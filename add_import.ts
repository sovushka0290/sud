import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = `import { MiniGame } from './MiniGame';\n` + content;
fs.writeFileSync('src/App.tsx', content);
