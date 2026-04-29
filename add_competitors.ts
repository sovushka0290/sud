import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add Competitors logic in LOBBY phase
const lobbyRegex = /<h2 className="text-3xl font-extrabold text-\[#4B4B4B\] dark:text-white">\{t\.quizPrep\}<\/h2>\s*<p className="text-\[#AFAFAF\] dark:text-\[#8C8F9F\] text-lg font-bold">\{t\.quizPrepSub\}<\/p>/m;

const lobbyReplacement = `<h2 className="text-3xl font-extrabold text-[#4B4B4B] dark:text-white">{t.quizPrep}</h2>
            <p className="text-[#AFAFAF] dark:text-[#8C8F9F] text-lg font-bold">{t.quizPrepSub}</p>
            
            <div className="mt-8 space-y-4 w-full">
              <h3 className="font-extrabold text-sm text-[#AFAFAF] uppercase tracking-wider">{lang === 'kz' ? 'Бәсекелестер (Конкуренттер)' : 'Конкуренты'}</h3>
              {playerData.choices.map((roleId: string) => {
                 const roleInfo = ROLES.find(r => r.id === roleId);
                 const competitors = players.filter(p => p.id !== guestId && p.choices.includes(roleId));
                 return (
                    <div key={roleId} className="bg-white dark:bg-[#2A2B35] border-2 border-[#E5E5E5] dark:border-[#393A4B] rounded-2xl p-4 text-left shadow-sm">
                      <span className="font-extrabold text-[#4B4B4B] dark:text-white block mb-3 text-sm">{roleInfo?.name[lang]}</span>
                      <div className="flex flex-wrap gap-2">
                        {competitors.length > 0 ? competitors.map(c => (
                          <span key={c.id} className="inline-flex items-center bg-[#F7F9FC] dark:bg-[#181920] px-3 py-1.5 rounded-xl text-xs font-bold text-[#AFAFAF] border border-[#E5E5E5] dark:border-[#393A4B]">
                            {c.name}
                          </span>
                        )) : (
                          <span className="text-xs font-bold text-[#AFAFAF] italic">{lang === 'kz' ? 'Қарсыластар жоқ' : 'Нет конкурентов'}</span>
                        )}
                      </div>
                    </div>
                 );
              })}
            </div>`;

content = content.replace(lobbyRegex, lobbyReplacement);


// 2. Add Competitors tracking logic in QUIZ phase
const quizEndRegex = /<\/div>\s*\)\ : \(\s*<div className="text-center pt-20">/m;

const quizTrackingReplacement = `</div>
                
                <div className="mt-6 bg-white dark:bg-[#2A2B35] border-2 border-[#E5E5E5] dark:border-[#393A4B] p-5 rounded-3xl shadow-sm text-left">
                   <div className="font-extrabold text-xs text-[#AFAFAF] mb-4 uppercase tracking-wider flex justify-between items-center">
                      <span>{lang === 'kz' ? 'Бәсекелестердің прогрессі:' : 'Прогресс конкурентов:'}</span>
                      <span className="text-[#1CB0F6]">{ROLES.find(r => r.id === playerData.choices[Math.floor(quizStep / 3)] || playerData.choices[0])?.name[lang]}</span>
                   </div>
                   <div className="space-y-4">
                     {(() => {
                        const currentRoleId = playerData.choices[Math.floor(quizStep / 3)] || playerData.choices[0];
                        const competitors = players.filter(p => p.id !== guestId && p.choices.includes(currentRoleId));
                        if (competitors.length === 0) return <div className="text-sm font-bold text-[#AFAFAF] animate-pulse">{lang === 'kz' ? 'Қарсыластар жоқ' : 'Нет конкурентов'}</div>;
                        return competitors.map(c => {
                          const theirPct = c.status === 'finished' ? 100 : Math.round(((c.quizStep || 0) / 9) * 100);
                          return (
                            <div key={c.id} className="flex items-center gap-4">
                              <span className="text-sm font-extrabold w-20 truncate text-[#4B4B4B] dark:text-white">{c.name}</span>
                              <div className="flex-1 bg-[#F7F9FC] dark:bg-[#181920] h-3 rounded-full overflow-hidden border border-[#E5E5E5] dark:border-[#393A4B]">
                                 <div className="bg-[#1CB0F6] h-full rounded-full transition-all duration-500 relative overflow-hidden" style={{ width: \`\${theirPct}%\` }}>
                                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                                 </div>
                              </div>
                              <span className="text-xs font-bold text-[#AFAFAF] w-8 text-right">{theirPct}%</span>
                            </div>
                          );
                        });
                     })()}
                   </div>
                </div>
              </div>
            ) : (
              <div className="text-center pt-20">`;

content = content.replace(quizEndRegex, quizTrackingReplacement);

fs.writeFileSync('src/App.tsx', content);
