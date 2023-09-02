const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const jssoup = require('jssoup').default;

const user = ""; // Enter your own username
const pass = ""; // Enter your own password
const domain = "" // Enter the domain of your home access website (homeaccess.[domain].org)
let token;

const superagent = require('superagent').agent();

const login = async() => {
  console.log("Logging in...");
  const req = await superagent
    .get(`https://homeaccess.${domain}.org/HomeAccess/Account/LogOn?ReturnUrl=%2fHomeAccess`)


    const reg = new RegExp('(?<=<input name="__RequestVerificationToken" type="hidden" value=")(.*)(?=" />)')
    token = reg.exec(req.text)[0];

    const login_data = {
        '__RequestVerificationToken': token,
        'SCKTY00328510CustomEnabled': false,
        'SCKTY00436568CustomEnabled': false,
        'Database': '10',
        'VerificationOption': 'UsernamePassword',
        'LogOnDetails.UserName': user,
        'tempUN': '',
        'tempPW': '',
        'LogOnDetails.Password': pass,
    }

    let dashboard = await superagent
    .post(`https://homeaccess.${domain}.org/HomeAccess/Account/LogOn?ReturnUrl=%2fHomeAccess%2f`)
    .send(login_data)
    .set("Content-Type", "application/x-www-form-urlencoded")

    console.log("Finished Logging in...");
    return await getCourseInfo();
}

const getCourseInfo = async () => {

  console.log("Getting Course info...")
    let class_grades = await superagent
    .get(`https://homeaccess.${domain}.org/HomeAccess/Content/Student/Assignments.aspx`)
    const html = new jssoup(class_grades.text);
    const data = html.findAll("a")


    const fetchAssignments = data.filter(h => h.attrs.class == 'sg-header-heading' || h.attrs.title != null)//.map(h => h.nextElement._text);
    const data2 = html.findAll("div", "AssignmentClass")//.filter(h => h.previousElement._text.endsWith("%"))
    const courseAndAssignments = [];

    data2.forEach((h, i) => { 
      const classInfo = h.contents[0]; // get into the class section
      const getClassName = classInfo.contents[1].nextElement._text // top row text
      const getAverage = classInfo.contents[1].nextElement.nextElement.nextElement.contents[0]._text

      const cleanClassName = getClassName.replace(/^\s+|\s+$/g, '').split("   ")[1].replace(/^\s+|\s+$/g, '')
      courseAndAssignments.push({name: cleanClassName, average: parseInt(getAverage.split(" ")[2]), assignments: []}) // remove the whitespace and assign in array
      let assignmentInfo = h.contents[1].contents[0] // Assignment List

      if (!assignmentInfo.contents || assignmentInfo.contents.length == 0) return; // Checks if there are assignments
      //else assignmentInfo = assignmentInfo.contents[i + 1].contents // Assignment Table; Ignore first row which is just text

      for (var j = 1; j < assignmentInfo.contents.length; j++) {
        
        const currentAssignment = assignmentInfo.contents[j].contents;

        const assignmentData = {}
        
        for (var k = 0; k < currentAssignment.length; k++) {
          if (currentAssignment[k] + "" == "<td></td>") continue;
          if (currentAssignment[k].contents.length == 0 || !currentAssignment[k].contents[0]._text) {
            const getAssignmentTitle = currentAssignment[k].nextElement.attrs.title;

            let cleanTitle = getAssignmentTitle.split('\n')[1]
            cleanTitle = cleanTitle.substring(11, cleanTitle.length).replace(/^\s+|\s+$/g, '')
            Object.assign(assignmentData, {assignment: cleanTitle}); 
         } else {
          const cleanText = currentAssignment[k].contents[0]._text.replace(/^\s+|\s+$/g, '')
          
          switch(k) {
            case 0: Object.assign(assignmentData, {dateDue: cleanText}); break; // Date Due
            case 1: Object.assign(assignmentData, {dateAssigned: cleanText}); break; // Date Assigned
            case 3: Object.assign(assignmentData, {category: cleanText}); break; // Category
            case 4: Object.assign(assignmentData, {score: cleanText}); break; // score 
            case 5: Object.assign(assignmentData, {totalPoints: cleanText}); break; // Total Points
            case 6: Object.assign(assignmentData, {weight: cleanText}); break; // Weight
            case 7: Object.assign(assignmentData, {weightedScore: cleanText}); break; // Weighted score
            case 8: Object.assign(assignmentData, {weightedTotalPoints: cleanText}); break; // Weighted Total Points
            case 9: Object.assign(assignmentData, {percentage: cleanText}); break; // Percentage
         }
        }
      }

      courseAndAssignments[courseAndAssignments.length - 1].assignments.push(assignmentData);
    }
  })


    return courseAndAssignments;
}




exports.login = login;