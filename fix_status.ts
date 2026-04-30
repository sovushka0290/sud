import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace(
  "updateDoc(doc(db, 'players', guestId), { status: 'waiting_next' });",
  "updateDoc(doc(db, 'players', guestId), { status: 'finished' });"
);
fs.writeFileSync('src/App.tsx', content);
