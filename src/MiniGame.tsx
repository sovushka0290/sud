import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { doc, onSnapshot, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';
import { Swords, Zap, Trophy } from 'lucide-react';

interface MiniGameProps {
  guestId: string;
  lang: 'kz' | 'ru';
}

export const MiniGame: React.FC<MiniGameProps> = ({ guestId, lang }) => {
  const [scoreRed, setScoreRed] = useState(0);
  const [scoreBlue, setScoreBlue] = useState(0);
  const teamRed = parseInt(guestId.replace(/[^0-9]/g, '') || '0') % 2 === 0; // Simple assignment
  const localClicks = useRef(0);
  const isSyncing = useRef(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'game', 'minigame'), (document) => {
      if (document.exists()) {
        const data = document.data();
        setScoreRed(data.red || 0);
        setScoreBlue(data.blue || 0);
      } else {
        try { setDoc(doc(db, 'game', 'minigame'), { red: 0, blue: 0 }); } catch(e){}
      }
    }, (error) => {
      console.error("MiniGame onSnapshot error:", error);
    });

    const interval = setInterval(async () => {
      if (localClicks.current > 0 && !isSyncing.current) {
        isSyncing.current = true;
        const clicksToSync = localClicks.current;
        localClicks.current = 0;
        try {
          await updateDoc(doc(db, 'game', 'minigame'), {
            [teamRed ? 'red' : 'blue']: increment(clicksToSync)
          });
        } catch (e) {
          localClicks.current += clicksToSync; // Retry next time
        } finally {
          isSyncing.current = false;
        }
      }
    }, 1000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [teamRed]);

  const handleTap = () => {
    localClicks.current += 1;
    if (teamRed) {
      setScoreRed(prev => prev + 1); // Optimistic UI
    } else {
      setScoreBlue(prev => prev + 1);
    }
  };

  const total = scoreRed + scoreBlue || 1;
  const redPct = (scoreRed / total) * 100;
  const bluePct = 100 - redPct;

  return (
    <div className="w-full bg-white dark:bg-[#2A2B35] rounded-3xl border-2 border-[#E5E5E5] dark:border-[#393A4B] p-6 shadow-sm mt-8">
      <div className="flex items-center justify-center gap-3 mb-6">
        <Swords className="text-[#AFAFAF] dark:text-[#8C8F9F]" />
        <h3 className="text-xl font-extrabold text-[#3C3C3C] dark:text-[#E5E5E5] uppercase tracking-wider">
          {lang === 'kz' ? 'Мини-ойын: Қарсыласу' : 'Мини-игра: Битва кликов'}
        </h3>
        <Swords className="text-[#AFAFAF] dark:text-[#8C8F9F]" />
      </div>

      <div className="relative h-12 w-full bg-[#F7F9FC] dark:bg-[#181920] rounded-full flex overflow-hidden border-2 border-[#E5E5E5] dark:border-[#393A4B] mb-8">
        <motion.div 
          className="h-full bg-[#FF4B4B] flex items-center justify-start px-4 text-white font-black"
          animate={{ width: `${redPct}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          {scoreRed > 0 && scoreRed}
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-8 h-8 rounded-full bg-white border-2 border-[#E5E5E5] dark:border-[#393A4B] flex items-center justify-center -ml-4 shadow-md">
            <Zap className="w-4 h-4 text-[#AFAFAF]" />
          </div>
        </div>
        <motion.div 
          className="h-full bg-[#1CB0F6] flex items-center justify-end px-4 text-white font-black"
          animate={{ width: `${bluePct}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
           {scoreBlue > 0 && scoreBlue}
        </motion.div>
      </div>

      <div className="text-center">
        <p className="text-sm font-bold text-[#AFAFAF] dark:text-[#8C8F9F] mb-4 uppercase">
          {lang === 'kz' ? 'Сіздің командаңыз:' : 'Ваша команда:'} 
          <span className={`ml-2 ${teamRed ? 'text-[#FF4B4B]' : 'text-[#1CB0F6]'}`}>
             {teamRed ? (lang === 'kz' ? 'ҚЫЗЫЛ' : 'КРАСНЫЕ') : (lang === 'kz' ? 'КӨК' : 'СИНИЕ')}
          </span>
        </p>
        
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleTap}
          className={`w-full max-w-[200px] h-20 rounded-2xl border-b-4 text-white font-black text-2xl uppercase transition-all shadow-sm active:border-b-0 active:translate-y-[4px] ${teamRed ? 'bg-[#FF4B4B] border-[#FF4B4B] hover:bg-[#E54545] hover:border-[#E54545]' : 'bg-[#1CB0F6] border-[#1CB0F6] hover:bg-[#1899D6] hover:border-[#1899D6]'}`}
        >
          {lang === 'kz' ? 'БАС!' : 'КЛИК!'}
        </motion.button>
      </div>
    </div>
  );
};
