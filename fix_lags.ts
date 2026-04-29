import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add deep compare for setPlayerData
const oldSetPlayerData = `setPlayerData(me);`;
const newSetPlayerData = `setPlayerData(prev => JSON.stringify(prev) === JSON.stringify(me) ? prev : me);`;
content = content.replace(oldSetPlayerData, newSetPlayerData);

// 2. Fix interval bug
const oldEffect = `useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'QUIZ' && playerData?.status === 'quiz' && quizTimer > 0) {
      interval = setInterval(() => setQuizTimer(t => t - 1), 1000);
    } else if (quizTimer === 0 && phase === 'QUIZ' && playerData?.status === 'quiz' && !isAnsweringRef.current) {
      isAnsweringRef.current = true;
      if (playerData.status === 'quiz') {
        setPlayerData(p => p ? { ...p, status: 'finished' } : p);
        handleQuizAnswer(-1).finally(() => {
          isAnsweringRef.current = false;
        });
      }
    }
    return () => clearInterval(interval);
  }, [phase, playerData?.status, quizTimer]);`;

const newEffect = `useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (phase === 'QUIZ' && playerData?.status === 'quiz') {
      interval = setInterval(() => {
        setQuizTimer(t => {
           if (t <= 1) {
              if (interval) clearInterval(interval);
              return 0;
           }
           return t - 1;
        });
      }, 1000);
    }
    return () => {
       if (interval) clearInterval(interval);
    }
  }, [phase, playerData?.status, quizStep]);

  useEffect(() => {
     if (quizTimer === 0 && phase === 'QUIZ' && playerData?.status === 'quiz' && !isAnsweringRef.current) {
      isAnsweringRef.current = true;
      if (playerData.status === 'quiz') {
        handleQuizAnswer(-1).finally(() => {
          isAnsweringRef.current = false;
        });
      }
    }
  }, [quizTimer, phase, playerData?.status]);`;

content = content.replace(oldEffect, newEffect);

fs.writeFileSync('src/App.tsx', content);
