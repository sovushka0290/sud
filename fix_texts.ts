import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regexReplacements = [
  {
    find: /text-white flex flex-col font-sans/g,
    replace: 'text-[#4B4B4B] dark:text-white flex flex-col font-sans'
  },
  {
    find: /font-black uppercase tracking-widest text-white/g,
    replace: 'font-black uppercase tracking-widest text-[#4B4B4B] dark:text-white'
  },
  {
    find: /uppercase text-white flex items-center/g,
    replace: 'uppercase text-[#4B4B4B] dark:text-white flex items-center'
  },
  {
    find: /dark:bg-\[#393A4B\] text-white px-3/g,
    replace: 'dark:bg-[#393A4B] text-[#4B4B4B] dark:text-white px-3'
  },
  {
    find: /mb-2 text-white/g,
    replace: 'mb-2 text-[#4B4B4B] dark:text-white'
  },
  {
    find: /font-sans text-white/g,
    replace: 'font-sans text-[#4B4B4B] dark:text-white'
  },
  {
    find: /text-white p-4/g,
    replace: 'text-[#4B4B4B] dark:text-white p-4'
  },
  {
    find: /text-center text-white/g,
    replace: 'text-center text-[#4B4B4B] dark:text-white'
  },
  {
    find: /' : 'text-white'}/g,
    replace: `' : 'text-[#4B4B4B] dark:text-white'}`
  },
  {
    find: /text-white mb-8/g,
    replace: 'text-[#4B4B4B] dark:text-white mb-8'
  },
  {
    find: /text-white"/g,
    replace: 'text-[#4B4B4B] dark:text-white"'
  },
  {
    find: /text-white mb-2/g,
    replace: 'text-[#4B4B4B] dark:text-white mb-2'
  },
  {
    find: /text-white font-extrabold text-xl/g,
    replace: 'text-[#4B4B4B] dark:text-white font-extrabold text-xl'
  },
  {
    find: /px-6 py-4 text-white focus/g,
    replace: 'px-6 py-4 text-[#4B4B4B] dark:text-white focus'
  }
];

regexReplacements.forEach(({find, replace}) => {
  content = content.replace(find, replace);
});

// Restore correct button colors that might have been hit:
content = content.replace(/bg-\[#58CC02\].*?text-\[#4B4B4B\] dark:text-white/g, match => match.replace('text-[#4B4B4B] dark:text-white', 'text-white'));
content = content.replace(/bg-\[#FF4B4B\].*?text-\[#4B4B4B\] dark:text-white/g, match => match.replace('text-[#4B4B4B] dark:text-white', 'text-white'));
content = content.replace(/bg-\[#1CB0F6\].*?text-\[#4B4B4B\] dark:text-white/g, match => match.replace('text-[#4B4B4B] dark:text-white', 'text-white'));

// fix double spacing issues if any
content = content.replace(/text-\[#4B4B4B\] dark:text-[#4B4B4B] dark:text-white/g, 'text-[#4B4B4B] dark:text-white');

fs.writeFileSync('src/App.tsx', content);
