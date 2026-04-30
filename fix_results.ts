import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(/let assigned = 'witness';/, "let assigned = 'unassigned';");

fs.writeFileSync('src/App.tsx', content);
