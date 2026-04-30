import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const unassignedBlock = `
        {phase === 'RESULTS' && playerData.status === 'waiting_next' && (
           <motion.div key="waiting_next" initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="text-center space-y-8 w-full max-w-md bg-white dark:bg-[#2A2B35] border-2 border-[#E5E5E5] dark:border-[#393A4B] p-8 rounded-3xl shadow-sm">
              <div className="w-32 h-32 rounded-full bg-[#1CB0F6]/10 mx-auto flex items-center justify-center border-4 border-[#1CB0F6]/20">
                 <Timer size={64} className="text-[#1CB0F6] animate-spin-slow" />
              </div>
              <div>
                 <h3 className="text-2xl font-black text-[#4B4B4B] dark:text-white leading-tight">
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
                 <h3 className="text-2xl font-black text-[#4B4B4B] dark:text-white leading-tight mb-4">
                   {lang === 'kz' ? 'Қап! Сіз таңдаған рөлдер бос емес.' : 'Упс! Все желаемые роли заняты.'}
                 </h3>
                 <p className="text-[#AFAFAF] dark:text-[#8C8F9F] font-bold">
                   {lang === 'kz' ? 'Куәгер бола аласыз немесе келесі ойынды күтуге болады.' : 'Вы можете стать свидетелем или подождать следующую игру.'}
                 </p>
              </div>

              <div className="flex flex-col gap-4 w-full">
                  <button 
                     onClick={async () => {
                        await updateDoc(doc(db, 'players', guestId), { assignedRole: 'witness' });
                     }}
                     className="w-full py-4 bg-[#1CB0F6] hover:bg-[#1899D6] border-[#1CB0F6] hover:border-[#1899D6] border-b-4 active:border-b-0 active:translate-y-[4px] text-white rounded-2xl font-extrabold text-lg transition-all uppercase"
                  >
                     {lang === 'kz' ? 'Куәгер болу' : 'Стать свидетелем'}
                  </button>
                  <button 
                     onClick={async () => {
                        await updateDoc(doc(db, 'players', guestId), { status: 'waiting_next' });
                     }}
                     className="w-full py-4 bg-white dark:bg-[#2A2B35] text-[#FF4B4B] hover:bg-[#FF4B4B]/5 border-[#E5E5E5] dark:border-[#393A4B] hover:border-[#FF4B4B] border-b-4 active:border-b-0 active:translate-y-[4px] rounded-2xl font-extrabold text-lg transition-all uppercase"
                  >
                     {lang === 'kz' ? 'Келесі ойынды күту' : 'Ждать следующей игры'}
                  </button>
              </div>
           </motion.div>
        )}

        {phase === 'RESULTS' && playerData.assignedRole && playerData.assignedRole !== 'unassigned' && playerData.status !== 'waiting_next' && (
`;

content = content.replace(
  "{phase === 'RESULTS' && playerData.assignedRole && (",
  unassignedBlock
);

// We should also make sure `Player.status` type includes 'waiting_next'
content = content.replace(/status: 'waiting' \| 'quiz' \| 'finished';/, "status: 'waiting' | 'quiz' | 'finished' | 'waiting_next';");

fs.writeFileSync('src/App.tsx', content);
