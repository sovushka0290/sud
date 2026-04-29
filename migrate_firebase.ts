import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replacements

const importsToAdd = `import { db } from './firebase';
import { doc, onSnapshot, collection, setDoc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';\n`;

content = content.replace("import { motion, AnimatePresence } from 'motion/react';", importsToAdd + "import { motion, AnimatePresence } from 'motion/react';");

const newPollingCode = `
  useEffect(() => {
    let unsubscribeState: () => void;
    let unsubscribePlayers: () => void;

    // Listen to Game State
    unsubscribeState = onSnapshot(doc(db, 'game', 'state'), (docSnap) => {
      if (docSnap.exists()) {
        setPhase(docSnap.data().phase as GamePhase);
      } else {
        // init if not exists
        setDoc(doc(db, 'game', 'state'), { phase: 'IDLE' });
      }
    });

    // Listen to Players Collection
    unsubscribePlayers = onSnapshot(collection(db, 'players'), (snapshot) => {
      const pList: Player[] = [];
      snapshot.forEach(d => pList.push(d.data() as Player));
      setPlayers(pList);
      
      if (!isEditingName) {
        const me = pList.find(p => p.id === guestId);
        if (me) {
          setPlayerData(me);
        } else if (playerData && !me) {
          // If we were logged in but deleted
          setPlayerData(null);
        }
      }
    });

    return () => {
      if (unsubscribeState) unsubscribeState();
      if (unsubscribePlayers) unsubscribePlayers();
    };
  }, [guestId, isEditingName]);
`;

// Replace from 'const lastStateRef' up to 'isAnsweringRef.current'
const effectStart = "const lastStateRef = useRef<string>('');";
const effectEnd = "const isAnsweringRef = useRef(false);";
const sub = content.substring(content.indexOf(effectStart), content.indexOf(effectEnd));
content = content.replace(sub, newPollingCode + "\n\n  ");

// Clean up unused refs
content = content.replace(`const lastStateRef = useRef<string>('');\n  const lastPlayerRef = useRef<string>('');`, '');

// Replace HandleLogin
const newHandleLogin = `
  const handleLogin = async () => {
    if (!userNameInput.trim()) return;
    
    if (userNameInput === 'ADMIN_SUD') {
      setIsAdmin(true);
      return;
    }

    const newPlayerData: Player = {
      id: guestId,
      name: userNameInput,
      choices: [],
      score: 0,
      timeTaken: 0,
      assignedRole: null,
      status: 'waiting'
    };

    try {
      setPlayerData(newPlayerData);
      setIsEditingName(false); // Finished editing
      await setDoc(doc(db, 'players', guestId), newPlayerData);
    } catch (e) {
      console.error("Login write failed", e);
      setPlayerData(null);
      alert(lang === 'kz' ? 'Жүйеге кіру қатесі!' : 'Ошибка входа в систему!');
    }
  };
`;
content = content.replace(/const handleLogin = async \(\) => {[\s\S]*?};/, newHandleLogin.trim());

// Replace HandleChoicesSubmit
const newHandleChoicesSubmit = `
  const handleChoicesSubmit = async () => {
    if (selectedChoices.length < 3) return;
    try {
      await updateDoc(doc(db, 'players', guestId), { choices: selectedChoices });
    } catch (e) {
      console.error("Choices submit failed", e);
    }
  };
`;
content = content.replace(/const handleChoicesSubmit = async \(\) => {[\s\S]*?};/, newHandleChoicesSubmit.trim());

// Replace handleStartQuiz
const newHandleStartQuiz = `
  const handleStartQuiz = async () => {
    setQuizStep(0);
    setQuizScore(0);
    setQuizTimer(10);
    setQuizStartTime(Date.now());
    try {
      await updateDoc(doc(db, 'players', guestId), { status: 'quiz' });
    } catch (e) {
      console.error("Start quiz failed", e);
    }
  };
`;
content = content.replace(/const handleStartQuiz = async \(\) => {[\s\S]*?};/, newHandleStartQuiz.trim());

// Replace handleQuizAnswer
const newHandleQuizAnswer = `
  const handleQuizAnswer = async (index: number) => {
    const correct = index === QUESTIONS[quizStep].correct;
    const finalScore = quizScore + (correct ? 1 : 0);
    
    if (quizStep < QUESTIONS.length - 1) {
      setQuizScore(finalScore);
      setQuizStep(s => s + 1);
      setQuizTimer(10);
    } else {
      const totalTime = Date.now() - quizStartTime;
      try {
        await updateDoc(doc(db, 'players', guestId), {
          status: 'finished',
          score: finalScore,
          timeTaken: totalTime
        });
      } catch (e) {
        console.error("Quiz answer submit failed", e);
      }
    }
  };
`;
content = content.replace(/const handleQuizAnswer = async \([\s\S]*?};/, newHandleQuizAnswer.trim());

// Replace Admin Phase
const newSetGlobalPhase = `
  const setGlobalPhase = async (newPhase: GamePhase) => {
    await updateDoc(doc(db, 'game', 'state'), { phase: newPhase });
  };
`;
content = content.replace(/const setGlobalPhase = async \([\s\S]*?};/, newSetGlobalPhase.trim());

// Replace calculateResults
const newCalculateResults = `
  const calculateResults = async () => {
    const ROLES_LIMITS: Record<string, number> = {
      judge: 1, prosecutor: 1, lawyer: 1, secretary: 1, witness: 99
    };

    const candidates = [...players]
      .filter((p: any) => p.status === 'finished')
      .sort((a: any, b: any) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.timeTaken - b.timeTaken;
      });

    const roleAllocations: Record<string, number> = {
      judge: 0, prosecutor: 0, lawyer: 0, secretary: 0, witness: 0
    };

    const batch = writeBatch(db);

    for (const p of candidates) {
      let assigned = 'witness';
      for (const choice of p.choices) {
        if (roleAllocations[choice] < ROLES_LIMITS[choice]) {
          assigned = choice;
          roleAllocations[choice]++;
          break;
        }
      }
      batch.update(doc(db, 'players', p.id), { assignedRole: assigned });
    }

    batch.update(doc(db, 'game', 'state'), { phase: 'RESULTS' });
    await batch.commit();
  };
`;
content = content.replace(/const calculateResults = async \(\) => {[\s\S]*?};/, newCalculateResults.trim());

// Replace resetGame
const newResetGame = `
  const resetGame = async () => {
    const batch = writeBatch(db);
    batch.update(doc(db, 'game', 'state'), { phase: 'IDLE' });
    // DANGER: We delete all players manually or keep them? Instead of deleting, just reset the app by page reload and deleting players
    const qs = await getDocs(collection(db, 'players'));
    qs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  };
`;
content = content.replace(/const resetGame = async \(\) => {[\s\S]*?};\n/, newResetGame.trim() + '\n');


fs.writeFileSync('src/App.tsx', content);
