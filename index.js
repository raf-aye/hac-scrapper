const hac = require('./hac.js');
const chalk = require('chalk')

const courseInfo = async() => { 
    const courses = await hac.login()

    courses.forEach((c) => {
        console.log(`Course Name: ${c.name}`)
        console.log(`Average: ${c.average}`)
        console.log("Assignments: \n")
        c.assignments.forEach((a, i) => {
            console.log(`#${i + 1}: Name: ${a.assignment}`)
            if (a.score != null) {
            if (a.score >=90) console.log(chalk.green(`\tGrade: ${a.score}/${a.totalPoints} (${a.percentage})`))
            else if (a.score >= 80) console.log(chalk.blue(`\tGrade: ${a.score}/${a.totalPoints} (${a.percentage})`))
            else if (a.score >= 70) console.log(chalk.yellow(`\tGrade: ${a.score}/${a.totalPoints} (${a.percentage})`))
            else console.log(chalk.red(`\tGrade: ${a.score}/${a.totalPoints} (${a.percentage})`))
            } else {
            console.log(`\tGrade: N/A`)
            }
            console.log(`\tGrade Type: ${a.category}\n`)
            
        })
        console.log("\n");
    });
}

courseInfo();