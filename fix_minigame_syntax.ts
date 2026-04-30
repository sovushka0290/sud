import fs from 'fs';
let content = fs.readFileSync('src/MiniGame.tsx', 'utf-8');
content = content.replace(/\\`/g, '\`');
content = content.replace(/\\\$/g, '\$');
fs.writeFileSync('src/MiniGame.tsx', content);
