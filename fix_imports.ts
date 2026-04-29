import fs from 'fs';
let c = fs.readFileSync('src/App.tsx', 'utf-8');
c = c.replace('Trash2\n} from', 'Trash2,\n  Sun,\n  Moon\n} from');
c = c.replace(/<LanguageToggle \/>/g, '<ControlsToggle />');
fs.writeFileSync('src/App.tsx', c);
