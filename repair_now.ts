import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Use simple string replacement for the corrupted parts to avoid regex issues
const corrupted1 = '                                    <div className="absolute inset-0 bg-white/20 w-f               <div className="flex flex-col gap-4 w-full">';
const repair1 = '                                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>\n' +
'                                 </div>\n' +
'                              </div>\n' +
'                              <span className="text-xs font-bold text-[#AFAFAF] dark:text-[#8C8F9F] w-8 text-right">{theirPct}%</span>\n' +
'                            </div>\n' +
'                          );\n' +
'                        });\n' +
'                     })()}\n' +
'                   </div>\n' +
'                </div>\n' +
'              </>\n' +
'            ) : (\n' +
'              <div className="text-center pt-20">\n' +
'                 <motion.button \n' +
'                   onClick={handleStartQuiz} \n' +
'                   whileTap={{ y: 4 }} className="w-full max-w-sm mx-auto py-5 bg-[#FF4B4B] hover:bg-[#E54545] border-[#FF4B4B] hover:border-[#E54545] border-b-4 text-white font-extrabold rounded-2xl text-2xl uppercase transition-all shadow-[0_4px_14px_rgba(255,75,75,0.4)]"\n' +
'                 >\n' +
'                   {t.startQuiz}\n' +
'                 </motion.button>\n' +
'              </div>\n' +
'            )}\n' +
'          </motion.div>\n' +
'        )}\n' +
'\n' +
'        \n' +
'        {phase === \'RESULTS\' && playerData.status === \'waiting_next\' && (\n' +
'           <motion.div key="waiting_next" initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="text-center space-y-8 w-full max-w-md bg-white dark:bg-[#2A2B35] border-2 border-[#E5E5E5] dark:border-[#393A4B] p-8 rounded-3xl shadow-sm">';

content = content.replace(corrupted1, repair1);

const corrupted2 = '              </div>\n' +
'text-center space-y-8 w-full max-w-md bg-white dark:bg-[#2A2B35] border-2 border-[#E5E5E5] dark:border-[#393A4B] p-8 rounded-3xl shadow-sm">';

// This seems to be a fragment of a larger line. 
// I'll check the file content again or just use a regex for this specific messed up line.

fs.writeFileSync(filePath, content);
console.log('Done');
