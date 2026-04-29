/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, collection, setDoc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gavel, 
  UserRound, 
  ShieldCheck, 
  ScrollText, 
  Users, 
  Scale, 
  BrainCircuit, 
  Settings,
  Trophy,
  Timer,
  LogIn,
  CheckCircle2,
  Trash2,
  Share2,
  Sun,
  Moon
} from 'lucide-react';

// --- Types & Constants ---

type Role = {
  id: string;
  name: Record<string, string>;
  limit: number;
  icon: any;
  color: string;
};

type Player = {
  id: string;
  name: string;
  choices: string[];
  score: number;
  timeTaken: number;
  assignedRole: string | null;
  status: 'waiting' | 'quiz' | 'finished';
};

type GamePhase = 'IDLE' | 'PREFERENCES' | 'LOBBY' | 'QUIZ' | 'RESULTS';

const ROLES: Role[] = [
  { id: 'judge', name: { kz: 'Төрағалық етуші (Судья)', ru: 'Председательствующий (Судья)' }, limit: 1, icon: Gavel, color: 'text-blue-500' },
  { id: 'prosecutor', name: { kz: 'Прокурор', ru: 'Прокурор' }, limit: 1, icon: ShieldCheck, color: 'text-red-500' },
  { id: 'lawyer', name: { kz: 'Адвокат', ru: 'Адвокат' }, limit: 1, icon: UserRound, color: 'text-emerald-500' },
  { id: 'secretary', name: { kz: 'Сот мәжілісінің хатшысы', ru: 'Секретарь судебного заседания' }, limit: 1, icon: ScrollText, color: 'text-cyan-400' },
  { id: 'witness', name: { kz: 'Куәгер', ru: 'Свидетель' }, limit: 99, icon: Users, color: 'text-amber-500' },
];

const QUESTIONS = [
  {
    text: { kz: 'ҚР-да сот билігін кім жүзеге асырады?', ru: 'Кто осуществляет судебную власть в РК?' },
    options: {
      kz: ['Прокуратура', 'Тек соттар', 'Ішкі істер органдары', 'Парламент'],
      ru: ['Прокуратура', 'Только суды', 'Органы внутренних дел', 'Парламент']
    },
    correct: 1
  },
  {
    text: { kz: 'Сот залына судья кіргенде айтылатын міндетті сөз?', ru: 'Обязательные слова при входе судьи в зал заседаний?' },
    options: {
      kz: ['"Тұрыңыздар, сот келеді!"', '"Тыныштық сақтаңыздар!"', '"Назар аударыңыздар!"', '"Сот басталды!"'],
      ru: ['"Встать, суд идет!"', '"Прошу соблюдать тишину!"', '"Внимание!"', '"Суд начался!"']
    },
    correct: 0
  },
  {
    text: { kz: 'Кінәсіздік презумпциясы бойынша адамның кінәсін кім дәлелдеуі тиіс?', ru: 'Кто должен доказывать виновность лица согласно презумпции невиновности?' },
    options: {
      kz: ['Адвокат', 'Айыптаушы (Прокурор)', 'Судья', 'Сотталушы өзі'],
      ru: ['Адвокат', 'Обвинитель (Прокурор)', 'Судья', 'Сам подсудимый']
    },
    correct: 1
  },
  {
    text: { kz: 'Сот мәжілісінің хаттамасын кім жүргізеді?', ru: 'Кто ведет протокол судебного заседания?' },
    options: {
      kz: ['Судья', 'Хатшы', 'Адвокат', 'Пристав'],
      ru: ['Судья', 'Секретарь', 'Адвокат', 'Пристав']
    },
    correct: 1
  },
  {
    text: { kz: 'ҚР Конституциясына сәйкес сот шешімі кімнің атынан шығарылады?', ru: 'От чьего имени выносится судебное решение согласно Конституции РК?' },
    options: {
      kz: ['Судьяның атынан', 'Мемлекет атынан (Қазақстан Республикасының)', 'Халық атынан', 'Заң атынан'],
      ru: ['От имени судьи', 'От имени государства (Республики Казахстан)', 'От имени народа', 'От имени закона']
    },
    correct: 1
  }
];

const TRANSLATIONS: Record<string, any> = {
  kz: {
    title: 'Сот жүйесі',
    regTitle: 'Студентті тіркеу',
    namePlaceholder: 'Аты-жөніңізді енгізіңіз...',
    loginBtn: 'ЖҮЙЕГЕ КІРУ',
    welcome: 'Сәлем',
    waitText: 'Мұғалім сессияны бастағанша күте тұрыңыз. Қазір демала берсеңіз болады.',
    chooseRoles: 'Рөлдерді таңдаңыз',
    chooseSub: 'Өзіңіз қалайтын 3 рөлді маңыздылығы бойынша реттеп таңдаңыз.',
    choiceAccepted: 'Таңдау қабылданды',
    dontLookAway: 'ТЕЛЕФОННАН КӨЗ АЛМАҢЫЗ',
    sendChoice: 'ТАҢДАУДЫ ЖІБЕРУ',
    quizPrep: 'Тестке дайындық',
    quizPrepSub: 'Мұғалім тестті қосқанша күтіңіз. Сұрақтар қиын болады!',
    quizFinished: 'Сынақ аяқталды',
    quizFinishedSub: 'Біліміңіз жүйеге енгізілді. Мұғалім рөлдерді бөлгенше күтіңіз.',
    startQuiz: 'СЫНАҚТЫ БАСТАУ',
    assignedRoleLabel: 'Берілген рөліңіз:',
    scoreLabel: 'Сынақ нәтижесі:',
    qualConfirmed: 'Біліктілігіңіз расталды',
    adminTitle: 'Сот жүйесі: ADMIN',
    adminSub: 'Нақты уақыттық мониторинг',
    phase1: '1. Таңдауды ашу',
    phase2: '2. Таңдауды жабу',
    phase3: '3. Тестті бастау',
    phase4: '4. Рөлдерді бөлу',
    connectedPlayers: 'Байланыстағы ойыншылар',
    noPlayers: 'Ешкім қосылған жоқ...',
    sysStatus: 'Жүйелік статус',
    status: 'Мәртебе',
    finishedCount: 'Аяқтағандар',
    roleDist: 'Рөлдердің бөлінуі'
  },
  ru: {
    title: 'Судебная система',
    regTitle: 'Регистрация студента',
    namePlaceholder: 'Введите ваше имя и фамилию...',
    loginBtn: 'ВОЙТИ В СИСТЕМУ',
    welcome: 'Привет',
    waitText: 'Пожалуйста, подождите начала сессии. Можете пока отдохнуть.',
    chooseRoles: 'Выберите роли',
    chooseSub: 'Выберите 3 желаемые роли в порядке приоритета.',
    choiceAccepted: 'Выбор принят',
    dontLookAway: 'НЕ СВОДИТЕ ГЛАЗ С ТЕЛЕФОНА',
    sendChoice: 'ОТПРАВИТЬ ВЫБОР',
    quizPrep: 'Подготовка к тесту',
    quizPrepSub: 'Ждите запуска теста учителем. Вопросы будут сложными!',
    quizFinished: 'Тест завершен',
    quizFinishedSub: 'Ваши знания внесены в систему. Ждите распределения ролей.',
    startQuiz: 'НАЧАТЬ ТЕСТ',
    assignedRoleLabel: 'Ваша роль:',
    scoreLabel: 'Результат теста:',
    qualConfirmed: 'Квалификация подтверждена',
    adminTitle: 'Судебная система: ADMIN',
    adminSub: 'Мониторинг в реальном времени',
    phase1: '1. Открыть выбор',
    phase2: '2. Закрыть выбор',
    phase3: '3. Начать тест',
    phase4: '4. Распределить роли',
    connectedPlayers: 'Подключенные игроки',
    noPlayers: 'Никто еще не подключился...',
    sysStatus: 'Статус системы',
    status: 'Статус',
    finishedCount: 'Завершили',
    roleDist: 'Распределение ролей'
  }
};

export default function App() {
  const [lang, setLang] = useState<'kz' | 'ru'>('kz');
  const t = TRANSLATIONS[lang];

  const [isEditingName, setIsEditingName] = useState(false);
  const [guestId] = useState(() => {
    const key = 'court_game_player_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = 'p_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(key, id);
    }
    return id;
  });

  const [playerData, setPlayerData] = useState<Player | null>(null);
  const [phase, setPhase] = useState<GamePhase>('IDLE');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Local Entry State
  const [userNameInput, setUserNameInput] = useState('');
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  
  // Quiz State
  const [quizStep, setQuizStep] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizTimer, setQuizTimer] = useState(10);
  const [quizStartTime, setQuizStartTime] = useState(0);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('app_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  // --- API Sync (Polling) ---

  
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
          setPlayerData(prev => JSON.stringify(prev) === JSON.stringify(me) ? prev : me);
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


  const isAnsweringRef = useRef(false);

  useEffect(() => {
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
  }, [quizTimer, phase, playerData?.status]);

  // --- Handlers ---

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



  const handleChoicesSubmit = async () => {
    if (selectedChoices.length < 3) return;
    try {
      await updateDoc(doc(db, 'players', guestId), { choices: selectedChoices });
    } catch (e) {
      console.error("Choices submit failed", e);
    }
  };

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

  const ControlsToggle = () => (
    <div className="fixed top-6 right-6 md:right-10 z-50 flex gap-2">
      <button 
        onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border-2 border-b-4 active:border-b-2 active:translate-y-[2px] bg-white dark:bg-[#2A2B35] border-[#E5E5E5] dark:border-[#393A4B] text-[#AFAFAF] dark:text-[#8C8F9F] hover:bg-[#F7F9FC] dark:hover:bg-[#343541]`}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
      <button 
        onClick={() => setLang('kz')}
        className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all border-2 border-b-4 active:border-b-2 active:translate-y-[2px] ${lang === 'kz' ? 'bg-[#1CB0F6] border-[#1CB0F6] text-white' : 'bg-white dark:bg-[#2A2B35] border-[#E5E5E5] dark:border-[#393A4B] text-[#AFAFAF] dark:text-[#8C8F9F] hover:bg-[#F7F9FC] dark:hover:bg-[#343541]'}`}
      >
        ҚАЗ
      </button>
      <button 
        onClick={() => setLang('ru')}
        className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all border-2 border-b-4 active:border-b-2 active:translate-y-[2px] ${lang === 'ru' ? 'bg-[#1CB0F6] border-[#1CB0F6] text-white' : 'bg-white dark:bg-[#2A2B35] border-[#E5E5E5] dark:border-[#393A4B] text-[#AFAFAF] dark:text-[#8C8F9F] hover:bg-[#F7F9FC] dark:hover:bg-[#343541]'}`}
      >
        РУС
      </button>
    </div>
  );

  // --- Admin Logic ---

  const setGlobalPhase = async (newPhase: GamePhase) => {
    await updateDoc(doc(db, 'game', 'state'), { phase: newPhase });
  };

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

  const resetGame = async () => {
    const batch = writeBatch(db);
    batch.update(doc(db, 'game', 'state'), { phase: 'IDLE' });
    // DANGER: We delete all players manually or keep them? Instead of deleting, just reset the app by page reload and deleting players
    const qs = await getDocs(collection(db, 'players'));
    qs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  };

  // --- UI Components ---

  if (isAdmin) return <AdminPanel players={players} phase={phase} onPhaseChange={setGlobalPhase} onCalculate={calculateResults} onReset={resetGame} lang={lang} setLang={setLang} />;

  if (!playerData && !isAdmin) return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#181920] flex flex-col items-center justify-center p-6 relative font-sans text-[#4B4B4B] dark:text-white">
      <ControlsToggle />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#2A2B35] border-2 border-[#E5E5E5] dark:border-[#393A4B] p-8 rounded-3xl max-w-md w-full shadow-sm text-center">
        <div className="w-24 h-24 mx-auto bg-[#1CB0F6]/10 rounded-3xl rotate-12 flex items-center justify-center mb-6 border-4 border-[#1CB0F6]/20">
          <Scale className="w-12 h-12 text-[#1CB0F6] -rotate-12" />
        </div>
        <h2 className="text-3xl font-black mb-2 text-[#4B4B4B] dark:text-white">{t.title}</h2>
        <p className="text-[#AFAFAF] dark:text-[#8C8F9F] font-bold text-sm mb-8 uppercase tracking-widest">{t.regTitle}</p>
        
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder={t.namePlaceholder}
            value={userNameInput} 
            onChange={(e) => setUserNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full bg-[#F7F9FC] dark:bg-[#181920] border-2 border-[#E5E5E5] dark:border-[#393A4B] rounded-2xl px-6 py-4 text-[#4B4B4B] dark:text-white focus:border-[#1CB0F6] focus:bg-white dark:bg-[#2A2B35] outline-none transition-all placeholder:text-[#AFAFAF] dark:text-[#8C8F9F] font-extrabold text-lg"
          />
          <button 
            disabled={!userNameInput.trim()}
            onClick={handleLogin} 
            className="w-full py-4 bg-[#58CC02] hover:bg-[#46A302] border-[#58CC02] hover:border-[#46A302] disabled:bg-[#E5E5E5] dark:bg-[#393A4B] disabled:border-[#E5E5E5] dark:border-[#393A4B] disabled:text-[#AFAFAF] dark:text-[#8C8F9F] border-b-4 active:border-b-0 disabled:active:border-b-4 disabled:active:translate-y-0 active:translate-y-[4px] text-white rounded-2xl font-extrabold text-lg flex items-center justify-center gap-2 transition-all uppercase"
          >
            {t.loginBtn}
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#181920] text-[#4B4B4B] dark:text-white p-4 md:p-8 flex flex-col items-center justify-center relative font-sans">
      <ControlsToggle />
      <AnimatePresence mode="wait">
        {phase === 'IDLE' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-6 w-full max-w-sm">
            <div className="w-32 h-32 mx-auto bg-blue-100 rounded-full flex items-center justify-center animate-bounce">
              <BrainCircuit className="w-16 h-16 text-[#1CB0F6]" />
            </div>
            <h2 className="text-3xl font-extrabold">{t.welcome},<br/><span className="text-[#1CB0F6]">{playerData.name}!</span></h2>
            <p className="text-[#AFAFAF] dark:text-[#8C8F9F] font-bold text-lg">{t.waitText}</p>
            <button 
              onClick={() => {
                setPlayerData(null);
                setUserNameInput(playerData.name);
                setIsEditingName(true);
              }}
              className="mt-6 w-full px-6 py-4 bg-white dark:bg-[#2A2B35] hover:bg-[#F7F9FC] dark:hover:bg-[#343541] border-2 border-[#E5E5E5] dark:border-[#393A4B] hover:border-gray-300 border-b-4 active:border-b-2 active:translate-y-[2px] rounded-2xl text-[#AFAFAF] dark:text-[#8C8F9F] font-extrabold uppercase transition-all"
            >
              {lang === 'kz' ? 'Атты өзгерту' : 'Изменить имя'}
            </button>
          </motion.div>
        )}

        {phase === 'PREFERENCES' && (
          <motion.div key="pref" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#2A2B35] border-2 border-[#E5E5E5] dark:border-[#393A4B] p-6 md:p-8 rounded-3xl max-w-xl w-full shadow-sm">
             <h3 className="text-2xl font-extrabold mb-2 text-center text-[#4B4B4B] dark:text-white">{t.chooseRoles}</h3>
             <p className="text-[#AFAFAF] dark:text-[#8C8F9F] text-center font-bold mb-8">{t.chooseSub}</p>
             
             <div className="grid gap-3 mb-8">
               {ROLES.map(r => {
                 const isSelected = selectedChoices.includes(r.id);
                 return (
                 <button 
                  key={r.id}
                  disabled={playerData.choices.length > 0}
                  onClick={() => {
                    if (isSelected) setSelectedChoices(selectedChoices.filter(id => id !== r.id));
                    else if (selectedChoices.length < 3) setSelectedChoices([...selectedChoices, r.id]);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group
                    ${isSelected 
                      ? 'bg-[#DDF4FF] border-[#1CB0F6] border-b-4 active:border-b-2 active:translate-y-[2px]' 
                      : 'bg-white dark:bg-[#2A2B35] border-[#E5E5E5] dark:border-[#393A4B] border-b-4 hover:bg-[#F7F9FC] dark:bg-[#181920] active:border-b-2 active:translate-y-[2px]'}
                    ${playerData.choices.length > 0 ? 'opacity-70 pointer-events-none border-b-2 translate-y-[2px]' : ''}
                  `}
                 >
                   <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${isSelected ? 'bg-white dark:bg-[#2A2B35] shadow-sm' : 'bg-[#F7F9FC] dark:bg-[#181920]'} ${r.color.replace('text-', 'text-').replace('-500', '-500')}`}>
                         <r.icon size={28} style={{ color: isSelected ? '#1CB0F6' : '#8C8F9F' }} />
                      </div>
                      <span className={`font-extrabold text-lg ${isSelected ? 'text-[#1CB0F6]' : 'text-[#4B4B4B] dark:text-white'}`}>{r.name[lang]}</span>
                   </div>
                   {isSelected && (
                     <div className="w-8 h-8 rounded-full bg-[#1CB0F6] text-white flex items-center justify-center font-black text-sm shadow-sm">
                        {selectedChoices.indexOf(r.id) + 1}
                     </div>
                   )}
                 </button>
               )})}
             </div>

             {playerData.choices.length > 0 ? (
               <div className="p-6 bg-[#58CC02]/10 border-2 border-[#58CC02]/30 rounded-2xl text-center">
                  <p className="text-[#58CC02] font-extrabold text-lg mb-1 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-6 h-6" /> {t.choiceAccepted}
                  </p>
                  <span className="text-[#AFAFAF] dark:text-[#8C8F9F] font-bold text-sm">{t.dontLookAway}</span>
               </div>
             ) : (
               <button 
                disabled={selectedChoices.length < 3} 
                onClick={handleChoicesSubmit}
                className="w-full py-4 bg-[#58CC02] hover:bg-[#46A302] border-[#58CC02] hover:border-[#46A302] disabled:bg-[#E5E5E5] dark:bg-[#393A4B] disabled:border-[#E5E5E5] dark:border-[#393A4B] disabled:text-[#AFAFAF] dark:text-[#8C8F9F] disabled:active:translate-y-0 disabled:active:border-b-4 border-b-4 active:border-b-0 active:translate-y-[4px] rounded-2xl text-white font-extrabold text-lg uppercase transition-all"
               >
                 {t.sendChoice}
               </button>
             )}
          </motion.div>
        )}

        {phase === 'LOBBY' && (
          <motion.div key="lobby" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 max-w-sm">
            <div className="w-32 h-32 mx-auto bg-[#FFC800]/20 rounded-full flex items-center justify-center mb-6 relative">
              <Timer className="w-16 h-16 text-[#FFC800] animate-spin-slow absolute" />
            </div>
            <h2 className="text-3xl font-extrabold text-[#4B4B4B] dark:text-white">{t.quizPrep}</h2>
            <p className="text-[#AFAFAF] dark:text-[#8C8F9F] text-lg font-bold">{t.quizPrepSub}</p>
          </motion.div>
        )}

        {phase === 'QUIZ' && (
          <motion.div key="quiz" className="w-full max-w-2xl px-4">
            {playerData.status === 'finished' ? (
              <div className="text-center bg-white dark:bg-[#2A2B35] p-10 rounded-3xl border-2 border-[#E5E5E5] dark:border-[#393A4B] shadow-sm">
                 <div className="w-24 h-24 mx-auto bg-[#58CC02]/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-12 h-12 text-[#58CC02]" />
                 </div>
                 <h2 className="text-3xl font-extrabold mb-4 text-[#58CC02]">{t.quizFinished}</h2>
                 <p className="text-[#AFAFAF] dark:text-[#8C8F9F] font-bold text-lg leading-relaxed">{t.quizFinishedSub}</p>
              </div>
            ) : playerData.status === 'quiz' ? (
              <div className="bg-white dark:bg-[#2A2B35] border-2 border-[#E5E5E5] dark:border-[#393A4B] p-6 md:p-10 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="w-full bg-[#E5E5E5] dark:bg-[#393A4B] h-4 rounded-full mb-8 overflow-hidden">
                   <div 
                     className="h-full bg-[#FF4B4B] rounded-full transition-all duration-1000 ease-linear flex items-center justify-end px-2 text-[10px] font-extrabold text-white"
                     style={{ width: `${(quizTimer/10)*100}%` }}
                   ></div>
                </div>
                
                <div className="flex justify-between items-center mb-8">
                   <span className="font-extrabold text-[#AFAFAF] dark:text-[#8C8F9F] text-lg">
                      <span className="text-[#1CB0F6]">{quizStep + 1}</span> / {QUESTIONS.length}
                   </span>
                   <div className="text-3xl font-black text-[#FF4B4B] tabular-nums flex items-center gap-2">
                     <Timer className="w-8 h-8" /> {quizTimer}s
                   </div>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-extrabold text-[#4B4B4B] dark:text-white mb-8 leading-relaxed">
                  {QUESTIONS[quizStep].text[lang]}
                </h3>
                
                <div className="grid gap-4">
                  {QUESTIONS[quizStep].options[lang].map((opt, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleQuizAnswer(i)} 
                      className="p-5 text-left bg-white dark:bg-[#2A2B35] border-2 border-[#E5E5E5] dark:border-[#393A4B] border-b-4 hover:bg-[#F7F9FC] dark:bg-[#181920] hover:border-[#1CB0F6] hover:text-[#1CB0F6] active:border-b-2 active:translate-y-[2px] rounded-2xl transition-all font-extrabold text-lg text-[#4B4B4B] dark:text-white"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center pt-20">
                 <button 
                   onClick={handleStartQuiz} 
                   className="w-full max-w-sm mx-auto py-5 bg-[#FF4B4B] hover:bg-[#E54545] border-[#FF4B4B] hover:border-[#E54545] border-b-4 active:border-b-0 active:translate-y-[4px] text-white font-extrabold rounded-2xl text-2xl uppercase transition-all shadow-[0_4px_14px_rgba(255,75,75,0.4)]"
                 >
                   {t.startQuiz}
                 </button>
              </div>
            )}
          </motion.div>
        )}

        {phase === 'RESULTS' && playerData.assignedRole && (
          <motion.div key="res" initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="text-center space-y-8 w-full max-w-md bg-white dark:bg-[#2A2B35] border-2 border-[#E5E5E5] dark:border-[#393A4B] p-8 rounded-3xl shadow-sm">
             <div className="w-32 h-32 rounded-full bg-[#1CB0F6]/10 mx-auto flex items-center justify-center border-4 border-[#1CB0F6]/20">
                {(() => {
                  const r = ROLES.find(r => r.id === playerData.assignedRole);
                  return r ? <r.icon size={64} className="text-[#1CB0F6]" /> : null
                })()}
             </div>
             
             <div>
                <h2 className="text-[#AFAFAF] dark:text-[#8C8F9F] font-extrabold uppercase tracking-widest text-sm mb-2">{t.assignedRoleLabel}</h2>
                <h3 className="text-4xl font-black text-[#4B4B4B] dark:text-white">
                  {ROLES.find(r => r.id === playerData.assignedRole)?.name[lang]}
                </h3>
             </div>
             
             <div className="bg-[#FFC800]/10 p-6 rounded-2xl border-2 border-[#FFC800]/30 flex flex-col items-center gap-2">
                <Trophy className="w-10 h-10 text-[#FFC800]" />
                <p className="text-[#4B4B4B] dark:text-white font-extrabold text-xl">{t.scoreLabel} <span className="text-[#FFC800]">{playerData.score} / 5</span></p>
                <p className="text-[#AFAFAF] dark:text-[#8C8F9F] text-sm font-bold uppercase">{t.qualConfirmed}</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminPanel({ players, phase, onPhaseChange, onCalculate, onReset, lang, setLang }: any) {
  const t = TRANSLATIONS[lang];
  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#181920] text-[#4B4B4B] dark:text-white flex flex-col font-sans">
      <header className="p-4 md:p-6 border-b-2 border-[#E5E5E5] dark:border-[#393A4B] flex justify-between items-center bg-white dark:bg-[#2A2B35] sticky top-0 z-20 shadow-sm flex-col md:flex-row gap-4">
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#1CB0F6]/10 rounded-2xl border-2 border-[#1CB0F6]/20">
              <Settings className="text-[#1CB0F6]" size={28} />
            </div>
            <div>
              <h1 className="font-black uppercase tracking-widest text-[#4B4B4B] dark:text-white">{t.adminTitle}</h1>
              <p className="text-[10px] text-[#AFAFAF] dark:text-[#8C8F9F] uppercase font-bold tracking-tighter">{t.adminSub}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setLang('kz')}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all border-b-2 active:translate-y-[2px] active:border-b-0 ${lang === 'kz' ? 'bg-[#1CB0F6] text-white border-[#1899D6]' : 'bg-white dark:bg-[#2A2B35] border-[#E5E5E5] dark:border-[#393A4B] text-[#AFAFAF] dark:text-[#8C8F9F] hover:bg-[#F7F9FC] dark:bg-[#181920]'}`}
            >
              ҚАЗ
            </button>
            <button 
              onClick={() => setLang('ru')}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all border-b-2 active:translate-y-[2px] active:border-b-0 ${lang === 'ru' ? 'bg-[#1CB0F6] text-white border-[#1899D6]' : 'bg-white dark:bg-[#2A2B35] border-[#E5E5E5] dark:border-[#393A4B] text-[#AFAFAF] dark:text-[#8C8F9F] hover:bg-[#F7F9FC] dark:bg-[#181920]'}`}
            >
              РУС
            </button>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap md:flex-nowrap justify-center">
           {phase === 'IDLE' && <button onClick={() => onPhaseChange('PREFERENCES')} className="px-6 py-3 bg-[#1CB0F6] hover:bg-[#1899D6] border-[#1CB0F6] hover:border-[#1899D6] border-b-4 active:border-b-0 active:translate-y-[4px] text-white rounded-2xl font-extrabold text-sm uppercase transition-all">{t.phase1}</button>}
           {phase === 'PREFERENCES' && <button onClick={() => onPhaseChange('LOBBY')} className="px-6 py-3 bg-[#1CB0F6] hover:bg-[#1899D6] border-[#1CB0F6] hover:border-[#1899D6] border-b-4 active:border-b-0 active:translate-y-[4px] text-white rounded-2xl font-extrabold text-sm uppercase transition-all">{t.phase2}</button>}
           {phase === 'LOBBY' && <button onClick={() => onPhaseChange('QUIZ')} className="px-6 py-3 bg-[#FF4B4B] hover:bg-[#E54545] border-[#FF4B4B] hover:border-[#E54545] border-b-4 active:border-b-0 active:translate-y-[4px] text-white rounded-2xl font-extrabold text-sm uppercase transition-all animate-pulse">{t.phase3}</button>}
           {phase === 'QUIZ' && <button onClick={onCalculate} className="px-6 py-3 bg-[#58CC02] hover:bg-[#46A302] border-[#58CC02] hover:border-[#46A302] border-b-4 active:border-b-0 active:translate-y-[4px] text-white rounded-2xl font-extrabold text-sm uppercase transition-all">{t.phase4}</button>}
           <button onClick={onReset} className="p-3 bg-white dark:bg-[#2A2B35] text-[#FF4B4B] rounded-2xl border-2 border-[#E5E5E5] dark:border-[#393A4B] border-b-4 hover:border-[#FF4B4B] hover:bg-[#FF4B4B]/5 active:border-b-2 active:translate-y-[2px] transition-all"><Trash2 size={24} /></button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
        {/* Players List */}
        <section className="bg-white dark:bg-[#2A2B35] rounded-3xl border-2 border-[#E5E5E5] dark:border-[#393A4B] p-6 md:p-8 shadow-sm h-fit">
           <div className="flex justify-between items-center mb-6 pb-6 border-b-2 border-[#E5E5E5] dark:border-[#393A4B]">
             <h3 className="text-xl font-black uppercase text-[#4B4B4B] dark:text-white flex items-center gap-3">
               <Users size={24} className="text-[#1CB0F6]" />
               {t.connectedPlayers} <span className="bg-[#E5E5E5] dark:bg-[#393A4B] text-[#4B4B4B] dark:text-white px-3 py-1 rounded-xl text-sm">{players.length}</span>
             </h3>
           </div>
           
           <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
             {players.sort((a: any, b: any) => b.score - a.score).map((p, idx) => (
               <div key={p.id} className="p-4 bg-white dark:bg-[#2A2B35] border-2 border-[#E5E5E5] dark:border-[#393A4B] rounded-2xl flex justify-between items-center hover:bg-[#F7F9FC] dark:bg-[#181920] transition-all">
                 <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#E5E5E5] dark:bg-[#393A4B] text-[#AFAFAF] dark:text-[#8C8F9F] flex items-center justify-center font-black text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-none mb-2 text-[#4B4B4B] dark:text-white">{p.name}</p>
                      <div className="flex gap-2">
                         {p.choices.map((c: string, i: number) => (
                            <span key={i} className="text-[10px] bg-[#F7F9FC] dark:bg-[#181920] border-2 border-[#E5E5E5] dark:border-[#393A4B] px-2 py-1 rounded-lg text-[#AFAFAF] dark:text-[#8C8F9F] uppercase font-black">{ROLES.find(r => r.id === c)?.id}</span>
                         ))}
                      </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="text-right">
                       <span className="text-lg font-black text-[#FFC800] block">{p.score} <span className="text-[#AFAFAF] dark:text-[#8C8F9F] text-sm">/ 5</span></span>
                       <span className="text-[10px] text-[#AFAFAF] dark:text-[#8C8F9F] uppercase font-bold tracking-tighter">{(p.timeTaken/1000).toFixed(2)}s</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 border-[#2A2B35] shadow-sm ${p.status === 'finished' ? 'bg-[#58CC02]' : p.status === 'quiz' ? 'bg-[#FF4B4B] animate-pulse' : 'bg-[#E5E5E5] dark:bg-[#393A4B]'}`}></div>
                 </div>
               </div>
             ))}
             {players.length === 0 && <div className="text-center py-20 text-[#AFAFAF] dark:text-[#8C8F9F] font-bold uppercase tracking-widest text-sm">{t.noPlayers}</div>}
           </div>
        </section>

        {/* Dashboard / Analytics */}
        <section className="space-y-8 h-fit">
           <div className="bg-white dark:bg-[#2A2B35] rounded-3xl border-2 border-[#E5E5E5] dark:border-[#393A4B] p-6 md:p-8 shadow-sm">
             <h4 className="text-xs text-[#AFAFAF] dark:text-[#8C8F9F] font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2">
                <Settings size={16} /> {t.sysStatus}
             </h4>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-[#F7F9FC] dark:bg-[#181920] rounded-2xl border-2 border-[#E5E5E5] dark:border-[#393A4B]">
                   <span className="text-[10px] text-[#AFAFAF] dark:text-[#8C8F9F] uppercase font-black block mb-2">{t.status}</span>
                   <span className="text-2xl font-black uppercase text-[#1CB0F6]">{phase}</span>
                </div>
                <div className="p-6 bg-[#F7F9FC] dark:bg-[#181920] rounded-2xl border-2 border-[#E5E5E5] dark:border-[#393A4B]">
                   <span className="text-[10px] text-[#AFAFAF] dark:text-[#8C8F9F] uppercase font-black block mb-2">{t.finishedCount}</span>
                   <span className="text-3xl font-black text-[#58CC02]">{players.filter((p: any) => p.status === 'finished').length}</span>
                </div>
             </div>
           </div>

           <div className="bg-white dark:bg-[#2A2B35] rounded-3xl border-2 border-[#E5E5E5] dark:border-[#393A4B] p-6 md:p-8 shadow-sm">
              <h4 className="text-xs text-[#AFAFAF] dark:text-[#8C8F9F] font-extrabold uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Users size={16} /> {t.roleDist}
              </h4>
              <div className="space-y-6">
                 {ROLES.map(role => {
                    const assigned = players.filter((p: any) => p.assignedRole === role.id).length;
                    const progress = (assigned / (role.limit === 99 ? players.length || 1 : role.limit)) * 100;
                    return (
                      <div key={role.id}>
                         <div className="flex justify-between items-end mb-3">
                            <span className={`text-sm font-extrabold uppercase ${role.color.replace('text-', 'text-').replace('-500', '')}`}>{role.name[lang]}</span>
                            <span className="text-xs font-bold text-[#AFAFAF] dark:text-[#8C8F9F]">{assigned} / {role.limit === 99 ? '∞' : role.limit}</span>
                         </div>
                         <div className="h-3 bg-[#F7F9FC] dark:bg-[#181920] rounded-full overflow-hidden border-2 border-[#E5E5E5] dark:border-[#393A4B]">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(progress, 100)}%` }} className={`h-full ${role.color.replace('text-', 'bg-').replace('-500', '-500')}`} />
                         </div>
                      </div>
                    );
                 })}
              </div>
           </div>
        </section>
      </main>
      
      <style>{`
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #181920; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #393A4B; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #8C8F9F; }
      `}</style>
    </div>
  );
}
