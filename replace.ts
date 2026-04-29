import fs from 'fs';

let app = fs.readFileSync('src/App.tsx', 'utf-8');

const rep: Record<string, string> = {
  'bg-[#181920]': 'bg-[#F7F9FC] dark:bg-[#181920]',
  'bg-[#2A2B35]': 'bg-white dark:bg-[#2A2B35]',
  'bg-[#393A4B]': 'bg-[#E5E5E5] dark:bg-[#393A4B]',
  'hover:bg-[#343541]': 'hover:bg-[#F7F9FC] dark:hover:bg-[#343541]',
  'border-[#393A4B]': 'border-[#E5E5E5] dark:border-[#393A4B]',
  'text-[#8C8F9F]': 'text-[#AFAFAF] dark:text-[#8C8F9F]',
  'disabled:bg-[#393A4B]': 'disabled:bg-[#E5E5E5] dark:disabled:bg-[#393A4B]',
  'disabled:border-[#393A4B]': 'disabled:border-[#E5E5E5] dark:disabled:border-[#393A4B]',
  'disabled:text-[#8C8F9F]': 'disabled:text-[#AFAFAF] dark:disabled:text-[#8C8F9F]',
};

for (const [k, v] of Object.entries(rep)) {
  app = app.split(k).join(v);
}
fs.writeFileSync('src/App.tsx', app);
