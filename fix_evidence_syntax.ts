import fs from 'fs';
let content = fs.readFileSync('src/EvidenceCollection.tsx', 'utf-8');
content = content.replace(/\\`/g, '\`');
content = content.replace(/\\\$/g, '\$');
fs.writeFileSync('src/EvidenceCollection.tsx', content);
