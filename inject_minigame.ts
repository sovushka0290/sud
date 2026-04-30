import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes('import { MiniGame }')) {
  // Add import after other imports
  content = content.replace(/import \{ Trophy, UserRound/g, "import { MiniGame } from './MiniGame';\nimport { Trophy, UserRound");
}

// 1. In phase === 'IDLE', after changing name button
content = content.replace(
  /\{lang === 'kz' \? 'Атты өзгерту' : 'Изменить имя'\}\n\s*<\/motion.button>/,
  `{lang === 'kz' ? 'Атты өзгерту' : 'Изменить имя'}\n            </motion.button>\n            <MiniGame guestId={guestId} lang={lang} />`
);

// 2. In phase === 'LOBBY', after the "wait for start" kind of message
// Wait, phase LOBBY has competitor list. Let's add it before or after competitors list.
content = content.replace(
  /<\/div>\n\s*<\/motion\.div>\n\s*\)\}\n\n\s*\{phase === 'QUIZ'/g,
  `</div>\n            <MiniGame guestId={guestId} lang={lang} />\n          </motion.div>\n        )}\n\n        {phase === 'QUIZ'`
);

// 3. In player waiting_next state
content = content.replace(
  /\{lang === 'kz' \? 'Келесі ойынды күту' : 'Ждать следующей игры'\}\n\s*<\/motion\.button>\n\s*<\/div>/,
  `{lang === 'kz' ? 'Келесі ойынды күту' : 'Ждать следующей игры'}\n                  </motion.button>\n              </div>\n              <MiniGame guestId={guestId} lang={lang} />`
);

fs.writeFileSync('src/App.tsx', content);
