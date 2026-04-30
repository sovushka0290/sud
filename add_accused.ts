import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes("{ id: 'accused'")) {
    content = content.replace(
        "  { id: 'witness', name: { kz: 'Куәгер', ru: 'Свидетель' }, limit: 99, icon: Users, color: 'text-amber-500' }",
        "  { id: 'witness', name: { kz: 'Куәгер', ru: 'Свидетель' }, limit: 99, icon: Users, color: 'text-amber-500' },\n  { id: 'accused', name: { kz: 'Айыпталушы', ru: 'Подсудимый' }, limit: 1, icon: UserRound, color: 'text-purple-500' }"
    );
    
    content = content.replace(
        "judge: 1, prosecutor: 1, lawyer: 1, secretary: 1, witness: 99",
        "judge: 1, prosecutor: 1, lawyer: 1, secretary: 1, accused: 1, witness: 99"
    );
    
    content = content.replace(
        "judge: 0, prosecutor: 0, lawyer: 0, secretary: 0, witness: 0",
        "judge: 0, prosecutor: 0, lawyer: 0, secretary: 0, accused: 0, witness: 0"
    );
    
    fs.writeFileSync('src/App.tsx', content);
}
