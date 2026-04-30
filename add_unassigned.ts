import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const unassignedBlock = `
        {phase === 'RESULTS' && playerData.assignedRole === 'unassigned' && (
           <motion.div key="unassigned" initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="text-center space-y-8 w-full max-w-md bg-white dark:bg-[#2A2B35] border-2 border-[#E5E5E5] dark:border-[#393A4B] p-8 rounded-3xl shadow-sm">
              <div className="w-32 h-32 rounded-full bg-[#FF4B4B]/10 mx-auto flex items-center justify-center border-4 border-[#FF4B4B]/20">
                 <Users size={64} className="text-[#FF4B4B]" />
              </div>
              
              <div>
                 <h2 className="text-[#AFAFAF] dark:text-[#8C8F9F] font-extrabold uppercase tracking-widest text-sm mb-2">{lang === 'kz' ? 'Нәтиже' : 'Результат'}</h2>
                 <h3 className="text-2xl font-black text-[#4B4B4B] dark:text-white leading-tight">
                   {lang === 'kz' ? 'Қап! Сіз таңдаған рөлдер бос емес.' : 'Упс! Все ваши желаемые роли уже заняты.'}
                 </h3>
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
                        // And maybe just show waiting screen? This can be handled by setting assignedRole to 'none' or we can just keep 'unassigned' but change status.
                     }}
                     className="w-full py-4 bg-[#FF4B4B] hover:bg-[#E54545] border-[#FF4B4B] hover:border-[#E54545] border-b-4 active:border-b-0 active:translate-y-[4px] text-white rounded-2xl font-extrabold text-lg transition-all uppercase"
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

fs.writeFileSync('src/App.tsx', content);
