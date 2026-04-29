import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const replacements: Record<string, string> = {
  // Backgrounds
  'bg-[#F7F9FC]': 'bg-[#181920]',
  'bg-white': 'bg-[#2A2B35]',
  'hover:bg-gray-50': 'hover:bg-[#343541]',
  'hover:bg-[#F7F9FC]': 'hover:bg-[#343541]',
  // Borders
  'border-[#E5E5E5]': 'border-[#393A4B]',
  'border-white': 'border-[#2A2B35]',
  // Texts
  'text-[#4B4B4B]': 'text-white',
  'text-[#AFAFAF]': 'text-[#8C8F9F]',
  'text-[#AFB0B6]': 'text-[#8C8F9F]',
  'text-gray-500': 'text-[#8C8F9F]',
  // Elements
  'bg-[#E5E5E5]': 'bg-[#393A4B]',
  'disabled:bg-[#E5E5E5]': 'disabled:bg-[#393A4B]',
  'disabled:border-[#E5E5E5]': 'disabled:border-[#393A4B]',
  'disabled:text-[#AFAFAF]': 'disabled:text-[#8C8F9F]',
};

for (const [find, replace] of Object.entries(replacements)) {
  content = content.split(find).join(replace);
}

fs.writeFileSync('src/App.tsx', content);

let cssContent = fs.readFileSync('src/index.css', 'utf-8');
cssContent = cssContent.replace('background-color: #f7f9fc;', 'background-color: #181920;');
cssContent = cssContent.replace('color: #374151;', 'color: #ffffff;');
cssContent = cssContent.replace('background: #F7F9FC;', 'background: #181920;');
cssContent = cssContent.replace('background: #E5E5E5;', 'background: #393A4B;');
fs.writeFileSync('src/index.css', cssContent);

console.log('Colors replaced successfully!');
