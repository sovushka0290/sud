import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const phrase1 = "{phase === 'QUIZ' && (";
const phrase2 = "{phase === 'RESULTS' &&";

const i1 = content.indexOf(phrase1);
const i2 = content.indexOf(phrase2, i1);

if (i1 !== -1 && i2 !== -1) {
  const replacement = `{phase === 'QUIZ' && (
          <motion.div key="evidence_phase" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-[#2A2B35] rounded-3xl border-2 border-[#E5E5E5] dark:border-[#393A4B] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                 <h2 className="text-2xl font-black text-[#FF4B4B] mb-2">{lang === 'kz' ? 'Айғақтар жинау' : 'Сбор доказательств'}</h2>
                 <p className="text-[#AFAFAF] dark:text-[#8C8F9F] font-bold text-sm">
                   {lang === 'kz' ? 'Бексананың ісі: барлық білетініңізді жазыңыз және дәлелдерді тіркеңіз.' : 'Дело Бексаны: опишите всё, что вы знаете, загрузите фото или видеоматериалы.'}
                 </p>
              </div>
              <motion.button 
                whileTap={{ y: 2 }} onClick={async () => { await updateDoc(doc(db, 'players', guestId), { status: 'waiting_next' }); }}
                className="w-full md:w-auto px-6 py-4 bg-[#1CB0F6] hover:bg-[#1899D6] border-[#1CB0F6] hover:border-[#1899D6] border-b-4 text-white font-extrabold rounded-2xl transition-all uppercase whitespace-nowrap"
              >
                {lang === 'kz' ? 'Куәлікті аяқтау' : 'Завершить показания'}
              </motion.button>
            </div>
            
            <EvidenceCollection guestId={guestId} playerName={playerData.name} lang={lang} t={t} />

            <div className="mt-8">
              <MiniGame guestId={guestId} lang={lang} />
            </div>
          </motion.div>
        )}

        `;
        
  content = content.substring(0, i1) + replacement + content.substring(i2);
  fs.writeFileSync('src/App.tsx', content);
} else {
  console.log("Could not find boundaries.");
}
