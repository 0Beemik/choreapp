
const fs = require('fs');

const coveragePath = '/home/brent/Documents/choreapp/family-chores-app/coverage/coverage-final.json';
const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));

const fileCoverage = [];

for (const file in coverageData) {
  const fileData = coverageData[file];
  const statements = fileData.statementMap;
  const executed = fileData.s;

  const totalStatements = Object.keys(statements).length;
  const executedStatements = Object.values(executed).filter(count => count > 0).length;

  if (totalStatements > 0) {
    const coveragePercentage = (executedStatements / totalStatements) * 100;
    fileCoverage.push({
      file: file.replace('/home/brent/Documents/choreapp/family-chores-app/src/', ''),
      coverage: coveragePercentage.toFixed(2),
      totalStatements,
      executedStatements,
    });
  }
}

fileCoverage.sort((a, b) => a.coverage - b.coverage);

console.log('Files with the lowest test coverage:');
fileCoverage.slice(0, 20).forEach(file => {
  console.log(`${file.file}: ${file.coverage}% (${file.executedStatements}/${file.totalStatements})`);
});
