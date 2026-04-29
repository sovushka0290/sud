import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace(/text-\[#4B4B4B\] dark:text-\[#4B4B4B\] dark:text-white/g, 'text-[#4B4B4B] dark:text-white');
fs.writeFileSync('src/App.tsx', content);
