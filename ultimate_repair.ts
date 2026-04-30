import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const startAnchor = "{phase === 'RESULTS' && playerData.status === 'waiting_next' && (";
const endAnchor = "  return ("; // This is before the header in AdminPanel? No.
// Let's find a more unique end anchor.
const realEndAnchor = "function AdminPanel";

// Use split and join on a very stable line.

const parts = content.split("{phase === 'RESULTS' && playerData.status === 'waiting_next' && (");
if (parts.length < 2) {
    console.error("Start anchor not found");
    process.exit(1);
}

const secondPart = parts[1];
const secondParts = secondPart.split("function AdminPanel");
if (secondParts.length < 2) {
    console.error("End anchor not found");
    process.exit(1);
}

const head = parts[0];
const tail = "function AdminPanel" + secondParts[1];

const middle = `{phase === 'RESULTS' && playerData.status === 'waiting_next' && (
           <motion.div key="waiting_next" initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="text-center space-y-8 w-full max-w-md bg-white dark:bg-[#2A2B35] border-2 border-[#E5E5E5] dark:border-[#393A4B] p-8 rounded-3xl shadow-sm">
              <div className="w-32 h-32 rounded-full bg-[#1CB0F6]/10 mx-auto flex items-center justify-center border-4 border-[#1CB0F6]/20">
                 <Timer size={64} className="text-[#1CB0F6] animate-spin-slow" />
              </div>
              <div>
                 <h3 className="text-2xl font-black text-[#3C3C3C] dark:text-[#E5E5E5] leading-tight">
                   {lang === 'kz' ? 'Келесі ойынды күтудеміз...' : 'Ожидаем следующую игру...'}
                 </h3>
              </div>
           </motion.div>
        )}

        {phase === 'RESULTS' && playerData.status !== 'waiting_next' && playerData.assignedRole === 'unassigned' && (
           <motion.div key="unassigned" initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="text-center space-y-6 w-full max-w-md bg-white dark:bg-[#2A2B35] border-2 border-[#E5E5E5] dark:border-[#393A4B] p-8 rounded-3xl shadow-sm">
              <div className="w-32 h-32 rounded-full bg-[#FF4B4B]/10 mx-auto flex items-center justify-center border-4 border-[#FF4B4B]/20">
                 <Users size={64} className="text-[#FF4B4B]" />
              </div>
              
              <div>
                 <h2 className="text-[#AFAFAF] dark:text-[#8C8F9F] font-extrabold uppercase tracking-widest text-sm mb-2">{lang === 'kz' ? 'Нәтиже' : 'Результат'}</h2>
                 <h3 className="text-2xl font-black text-[#3C3C3C] dark:text-[#E5E5E5] leading-tight mb-4">
                   {lang === 'kz' ? 'Қап! Сіз таңдаған рөлдер бос емес.' : 'Упс! Все желаемые роли заняты.'}
                 </h3>
                 <p className="text-[#AFAFAF] dark:text-[#8C8F9F] font-bold">
                   {lang === 'kz' ? 'Куәгер бола аласыз немесе келесі ойынды күтуге болады.' : 'Вы можете стать свидетелем или подождать следующую игру.'}
                 </p>
              </div>

              <div className="flex flex-col gap-4 w-full">
                  <motion.button 
                     whileTap={{ y: 4 }}
                     onClick={async () => {
                        await updateDoc(doc(db, 'players', guestId), { assignedRole: 'witness' });
                     }}
                     className="w-full py-4 bg-[#1CB0F6] hover:bg-[#1899D6] border-[#1CB0F6] hover:border-[#1899D6] border-b-4 text-white rounded-2xl font-extrabold text-lg transition-all uppercase"
                  >
                     {lang === 'kz' ? 'Куәгер болу' : 'Стать свидетелем'}
                  </motion.button>
                  <motion.button 
                     whileTap={{ y: 4 }}
                     onClick={async () => {
                        await updateDoc(doc(db, 'players', guestId), { status: 'waiting_next' });
                     }}
                     className="w-full py-4 bg-white dark:bg-[#2A2B35] text-[#FF4B4B] hover:bg-[#FF4B4B]/5 border-[#E5E5E5] dark:border-[#393A4B] hover:border-[#FF4B4B] border-b-4 text-white rounded-2xl font-extrabold text-lg transition-all uppercase"
                  >
                     {lang === 'kz' ? 'Келесі ойынды күту' : 'Ждать следующей игры'}
                  </motion.button>
              </div>
           </motion.div>
        )}

        {phase === 'RESULTS' && playerData.assignedRole && playerData.assignedRole !== 'unassigned' && playerData.status !== 'waiting_next' && (
           <motion.div key="res" initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="text-center space-y-8 w-full max-w-md bg-white dark:bg-[#2A2B35] border-2 border-[#E5E5E5] dark:border-[#393A4B] p-8 rounded-3xl shadow-sm">
              <div className="w-32 h-32 rounded-full bg-[#1CB0F6]/10 mx-auto flex items-center justify-center border-4 border-[#1CB0F6]/20">
                 {(() => {
                   const r = ROLES.find(r => r.id === playerData.assignedRole);
                   return r ? <r.icon size={64} className="text-[#1CB0F6]" /> : null
                 })()}
              </div>
              
              <div>
                 <h2 className="text-[#AFAFAF] dark:text-[#8C8F9F] font-extrabold uppercase tracking-widest text-sm mb-2">{t.assignedRoleLabel}</h2>
                 <h3 className="text-4xl font-black text-[#3C3C3C] dark:text-[#E5E5E5]">
                   {ROLES.find(r => r.id === playerData.assignedRole)?.name[lang]}
                 </h3>
              </div>
              
              <div className="bg-[#FFC800]/10 p-6 rounded-2xl border-2 border-[#FFC800]/30 flex flex-col items-center gap-2">
                 <Trophy className="w-10 h-10 text-[#FFC800]" />
                 <p className="text-[#3C3C3C] dark:text-[#E5E5E5] font-extrabold text-xl">{t.scoreLabel} <span className="text-[#FFC800]">{playerData.score} / 5</span></p>
                 <p className="text-[#AFAFAF] dark:text-[#8C8F9F] text-sm font-bold uppercase">{t.qualConfirmed}</p>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
\n\n`;

fs.writeFileSync(filePath, head + middle + tail);
console.log("Success");
