import { MiniGame } from './MiniGame';
import { EvidenceCollection } from './EvidenceCollection';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo } from 'react';
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
  status: 'waiting' | 'quiz' | 'finished' | 'waiting_next';
  quizStep?: number;
};

type GamePhase = 'IDLE' | 'PREFERENCES' | 'LOBBY' | 'QUIZ' | 'RESULTS';

const ROLES: Role[] = [
  { id: 'judge', name: { kz: 'Төрағалық етуші (Судья)', ru: 'Председательствующий (Судья)' }, limit: 1, icon: Gavel, color: 'text-blue-500' },
  { id: 'prosecutor', name: { kz: 'Прокурор', ru: 'Прокурор' }, limit: 1, icon: ShieldCheck, color: 'text-red-500' },
  { id: 'lawyer', name: { kz: 'Адвокат', ru: 'Адвокат' }, limit: 1, icon: UserRound, color: 'text-emerald-500' },
  { id: 'secretary', name: { kz: 'Сот мәжілісінің хатшысы', ru: 'Секретарь судебного заседания' }, limit: 1, icon: ScrollText, color: 'text-cyan-400' },
  { id: 'witness', name: { kz: 'Куәгер', ru: 'Свидетель' }, limit: 99, icon: Users, color: 'text-amber-500' },
  { id: 'accused', name: { kz: 'Айыпталушы', ru: 'Подсудимый' }, limit: 1, icon: UserRound, color: 'text-purple-500' },
];

const ROLE_QUESTIONS: Record<string, any[]> = {
  judge: [
    { text: { kz: "Судьяның негізгі міндеті?", ru: "Главная обязанность судьи?" }, options: { kz: ["Шешім шығару", "Айыптау", "Қорғау", "Жазу"], ru: ["Выносить решения", "Обвинять", "Защищать", "Писать"] }, correct: 0 },
    { text: { kz: "Судья кімге бағынады?", ru: "Кому подчиняется судья?" }, options: { kz: ["Заңға", "Президентке", "Халыққа", "Ешкімге"], ru: ["Закону", "Президенту", "Народу", "Никому"] }, correct: 0 },
    { text: { kz: "Сот отырысын кім басқарады?", ru: "Кто ведет судебное заседание?" }, options: { kz: ["Судья", "Хатшы", "Адвокат", "Прокурор"], ru: ["Судья", "Секретарь", "Адвокат", "Прокурор"] }, correct: 0 }
  ],
  lawyer: [
    { text: { kz: "Адвокаттың қызметі?", ru: "Функция адвоката?" }, options: { kz: ["Қорғау", "Айыптау", "Соттау", "Қарау"], ru: ["Защита", "Обвинение", "Судить", "Смотреть"] }, correct: 0 },
    { text: { kz: "Адвокаттық құпия не?", ru: "Что такое адвокатская тайна?" }, options: { kz: ["Ақпаратты жарияламау", "Өтірік айту", "Ақша жасыру", "Дәлелдерді жою"], ru: ["Неразглашение информации", "Врать", "Прятать деньги", "Уничтожать улики"] }, correct: 0 },
    { text: { kz: "Кім адвокат бола алады?", ru: "Кто может быть адвокатом?" }, options: { kz: ["Лицензиясы бар заңгер", "Кез келген адам", "Прокурор", "Студент"], ru: ["Юрист с лицензией", "Любой человек", "Прокурор", "Студент"] }, correct: 0 }
  ],
  prosecutor: [
    { text: { kz: "Прокурордың рөлі?", ru: "Роль прокурора?" }, options: { kz: ["Мемлекеттік айыптауды қолдау", "Қорғау", "Соттау", "Кешірім жасау"], ru: ["Поддержание гособвинения", "Защита", "Судить", "Помилование"] }, correct: 0 },
    { text: { kz: "Прокурор қадағалайды:", ru: "Прокурор надзирает за:" }, options: { kz: ["Заңдылықты", "Тазалықты", "Моральды", "Ауа райын"], ru: ["Законностью", "Чистотой", "Моралью", "Погодой"] }, correct: 0 },
    { text: { kz: "Прокурор қатыспайды:", ru: "Прокурор не участвует в:" }, options: { kz: ["Үкім шығаруға", "Дәлелдеуге", "Тергеуге", "Сотқа"], ru: ["Вынесении приговора", "Доказывании", "Следствии", "Суде"] }, correct: 0 }
  ],
  secretary: [
    { text: { kz: "Хатшы не істейді?", ru: "Что делает секретарь?" }, options: { kz: ["Хаттама жазады", "Үкім шығарады", "Қорғайды", "Сұрақ қояды"], ru: ["Пишет протокол", "Выносит приговор", "Защищает", "Задает вопросы"] }, correct: 0 },
    { text: { kz: "Сот хатшысына қойылатын талап?", ru: "Требование к секретарю суда?" }, options: { kz: ["Мұқияттылық / жылдамдық", "Күш", "Байлық", "Әртістік"], ru: ["Внимательность / скорость", "Сила", "Богатство", "Артистизм"] }, correct: 0 },
    { text: { kz: "Сот отырысының хаттамасы - бұл?", ru: "Протокол судебного заседания - это?" }, options: { kz: ["Ресми құжат", "Қаралама", "Газет мақаласы", "Эссе"], ru: ["Официальный документ", "Черновик", "Газетная статья", "Эссе"] }, correct: 0 }
  ],
  witness: [
    { text: { kz: "Куәгердің міндеті?", ru: "Обязанность свидетеля?" }, options: { kz: ["Шындықты айту", "Үндемеу", "Пікір айту", "Сұрақ қою"], ru: ["Говорить правду", "Молчать", "Высказывать мнение", "Задавать вопросы"] }, correct: 0 },
    { text: { kz: "Жалған жауап бергені үшін?", ru: "За дачу ложных показаний?" }, options: { kz: ["Қылмыстық жауапкершілік", "Сыйлық", "Ескерту", "Ештеңе жоқ"], ru: ["Уголовная ответственность", "Подарок", "Предупреждение", "Ничего"] }, correct: 0 },
    { text: { kz: "Дәйектемені бекітетін кім?", ru: "Кто дает клятву?" }, options: { kz: ["Куәгер", "Судья", "Көрермен", "Адвокат"], ru: ["Свидетель", "Судья", "Зритель", "Адвокат"] }, correct: 0 }
  ]
};

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
    quizPrep: 'Іспен танысу',
    quizPrepSub: 'Бексананың ісі: мән-жайларды күтіңіз...',
    quizFinished: 'Сынақ аяқталды',
    quizFinishedSub: 'Біліміңіз жүйеге енгізілді. Мұғалім рөлдерді бөлгенше күтіңіз.',
    startQuiz: 'АЙҒАҚ БЕРУГЕ КӨШУ',
    assignedRoleLabel: 'Берілген рөліңіз:',
    scoreLabel: 'Сынақ нәтижесі:',
    qualConfirmed: 'Біліктілігіңіз расталды',
    adminTitle: 'Сот жүйесі: ADMIN',
    adminSub: 'Нақты уақыттық мониторинг',
    phase1: '1. Таңдауды ашу',
    phase2: '2. Таңдауды жабу',
    phase3: '3. Айғақ жинау',
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
    quizPrep: 'Ознакомление с делом',
    quizPrepSub: 'Дело Бексаны: ждите начала сбора доказательств.',
    quizFinished: 'Тест завершен',
    quizFinishedSub: 'Ваши знания внесены в систему. Ждите распределения ролей.',
    startQuiz: 'ПЕРЕЙТИ К ДАЧЕ ПОКАЗАНИЙ',
    assignedRoleLabel: 'Ваша роль:',
    scoreLabel: 'Результат теста:',
    qualConfirmed: 'Квалификация подтверждена',
    adminTitle: 'Судебная система: ADMIN',
    adminSub: 'Мониторинг в реальном времени',
    phase1: '1. Открыть выбор',
    phase2: '2. Закрыть выбор',
    phase3: '3. Сбор показаний',
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
  const myQuestions = useMemo(() => {
    if (!playerData || playerData.choices.length === 0) return [];
    return playerData.choices.flatMap(roleId => ROLE_QUESTIONS[roleId] || []);
  }, [playerData?.choices]);
  const [phase, setPhase] = useState<GamePhase>('IDLE');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Local Entry State
  const [userNameInput, setUserNameInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
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
        try { setDoc(doc(db, 'game', 'state'), { phase: 'IDLE' }); } catch(e){}
      }
    }, (error) => { console.error("Snapshot error on game/state: ", error); });

    // Listen to Players Collection
    unsubscribePlayers = onSnapshot(collection(db, 'players'), (snapshot) => {
      const pList: Player[] = [];
      snapshot.forEach(d => pList.push(d.data() as Player));
      
      setPlayers(prev => {
        const isSame = prev.length === pList.length && prev.every((p, i) => JSON.stringify(p) === JSON.stringify(pList[i]));
        return isSame ? prev : pList;
      });
      
      if (!isEditingName) {
        const me = pList.find(p => p.id === guestId);
        if (me) {
          setPlayerData(prev => JSON.stringify(prev) === JSON.stringify(me) ? prev : me);
        } else if (playerData && !me) {
          setPlayerData(null);
        }
      }
    }, (error) => { console.error("Snapshot error on players: ", error); });

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
    if (isProcessing) return;
    setIsProcessing(true);
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
      status: 'waiting',
      quizStep: 0
    };

    try {
      setPlayerData(newPlayerData);
      setIsEditingName(false); // Finished editing
      await setDoc(doc(db, 'players', guestId), newPlayerData);
    } catch (e) {
      console.error("Login write failed", e);
      setPlayerData(null);
      alert(lang === 'kz' ? 'Жүйеге кіру қатесі!' : 'Ошибка входа в систему!');
    } finally {
      setIsProcessing(false);
    }
  };



  const handleChoicesSubmit = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    if (selectedChoices.length < 3) return;
    try {
      await updateDoc(doc(db, 'players', guestId), { choices: selectedChoices });
    } catch (e) {
      console.error("Choices submit failed", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartQuiz = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setQuizStep(0);
    setQuizScore(0);
    setQuizTimer(10);
    setQuizStartTime(Date.now());
    try {
      await updateDoc(doc(db, 'players', guestId), { status: 'quiz', quizStep: 0, score: 0 });
    } catch (e) {
      console.error("Start quiz failed", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuizAnswer = async (index: number) => {
    if (isProcessing || myQuestions.length === 0) return;
    setIsProcessing(true);
    if (myQuestions.length === 0) return;
    const currentQ = myQuestions[quizStep];
    const correct = index === currentQ?.correct;
    const finalScore = quizScore + (correct ? 1 : 0);
    
    if (quizStep < myQuestions.length - 1) {
      setQuizScore(finalScore);
      setQuizStep(s => s + 1);
      setQuizTimer(10);
      try {
        await updateDoc(doc(db, 'players', guestId), { quizStep: quizStep + 1, score: finalScore });
      } catch(e){}
    } else {
      const totalTime = Date.now() - quizStartTime;
      try {
        await updateDoc(doc(db, 'players', guestId), {
          status: 'finished',
          quizStep: quizStep + 1,
          score: finalScore,
          timeTaken: totalTime
        });
      } catch (e) {
        console.error("Quiz answer submit failed", e);
      }
    }
    setTimeout(() => setIsProcessing(false), 300); // Small delay for smooth animation
  };

  const ControlsToggle = () => (
    <div className="fixed top-6 right-6 md:right-10 z-50 flex gap-2">
      <motion.button 
        whileTap={{ y: 2 }}
        onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border-2 border-b-4 bg-white dark:bg-[#2A2B35] border-[#E5E5E5] dark:border-[#393A4B] text-[#AFAFAF] dark:text-[#8C8F9F] hover:bg-[#F7F9FC] dark:hover:bg-[#343541]`}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </motion.button>
      <motion.button 
        whileTap={{ y: 2 }}
        onClick={() => setLang('kz')}
        className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all border-2 border-b-4 ${lang === 'kz' ? 'bg-[#1CB0F6] border-[#1CB0F6] text-white' : 'bg-white dark:bg-[#2A2B35] border-[#E5E5E5] dark:border-[#393A4B] text-[#AFAFAF] dark:text-[#8C8F9F] hover:bg-[#F7F9FC] dark:hover:bg-[#343541]'}`}
      >
        ҚАЗ
      </motion.button>
      <motion.button 
        whileTap={{ y: 2 }}
        onClick={() => setLang('ru')}
        className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all border-2 border-b-4 ${lang === 'ru' ? 'bg-[#1CB0F6] border-[#1CB0F6] text-white' : 'bg-white dark:bg-[#2A2B35] border-[#E5E5E5] dark:border-[#393A4B] text-[#AFAFAF] dark:text-[#8C8F9F] hover:bg-[#F7F9FC] dark:hover:bg-[#343541]'}`}
      >
        РУС
      </motion.button>
    </div>
  );

  // --- Admin Logic ---

  const setGlobalPhase = async (newPhase: GamePhase) => {
    await updateDoc(doc(db, 'game', 'state'), { phase: newPhase });
  };

  const calculateResults = async () => {
    const ROLES_LIMITS: Record<string, number> = {
      judge: 1, prosecutor: 1, lawyer: 1, secretary: 1, accused: 1, witness: 99
    };

    const candidates = [...players]
      .filter((p: any) => p.status === 'finished')
      .sort((a: any, b: any) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.timeTaken - b.timeTaken;
      });

    const roleAllocations: Record<string, number> = {
      judge: 0, prosecutor: 0, lawyer: 0, secretary: 0, accused: 0, witness: 0
    };

    const batch = writeBatch(db);

    for (const p of candidates) {
      let assigned = 'unassigned';
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
    const qs = await getDocs(collection(db, 'players'));
    qs.forEach(d => {
      // Keep players but reset their state
      batch.update(d.ref, {
        choices: [],
        score: 0,
        timeTaken: 0,
        assignedRole: null,
        status: 'waiting',
        quizStep: 0
      });
    });
    await batch.commit();
  };

  // --- UI Components ---

  if (isAdmin) return <AdminPanel players={players} phase={phase} onPhaseChange={setGlobalPhase} onCalculate={calculateResults} onReset={resetGame} lang={lang} setLang={setLang} />;

  if (!playerData && !isAdmin) return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#181920] flex flex-col items-center justify-center p-6 relative font-sans text-[#3C3C3C] dark:text-[#E5E5E5]">
      <ControlsToggle />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#2A2B35] border-2 border-[#E5E5E5] dark:border-[#393A4B] p-8 rounded-3xl max-w-md w-full shadow-sm text-center">
        <div className="w-24 h-24 mx-auto bg-[#1CB0F6]/10 rounded-3xl rotate-12 flex items-center justify-center mb-6 border-4 border-[#1CB0F6]/20">
          <Scale className="w-12 h-12 text-[#1CB0F6] -rotate-12" />
        </div>
        <h2 className="text-3xl font-black mb-2 text-[#3C3C3C] dark:text-[#E5E5E5]">{t.title}</h2>
        <p className="text-[#AFAFAF] dark:text-[#8C8F9F] font-bold text-sm mb-8 uppercase tracking-widest">{t.regTitle}</p>
        
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder={t.namePlaceholder}
            value={userNameInput} 
            onChange={(e) => setUserNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full bg-[#F7F9FC] dark:bg-[#181920] border-2 border-[#E5E5E5] dark:border-[#393A4B] rounded-2xl px-6 py-4 text-[#3C3C3C] dark:text-[#E5E5E5] focus:border-[#1CB0F6] focus:bg-white dark:focus:bg-[#2A2B35] outline-none transition-all placeholder:text-[#AFAFAF] dark:placeholder:text-[#8C8F9F] font-extrabold text-lg"
          />
          <motion.button whileTap={!userNameInput.trim() ? {} : { y: 4 }} disabled={!userNameInput.trim() || isProcessing} onClick={handleLogin} className="w-full py-4 bg-[#58CC02] hover:bg-[#46A302] border-[#58CC02] hover:border-[#46A302] disabled:bg-[#E5E5E5] dark:bg-[#393A4B] disabled:border-[#E5E5E5] dark:border-[#393A4B] disabled:text-[#AFAFAF] dark:text-[#8C8F9F] border-b-4 text-white rounded-2xl font-extrabold text-lg flex items-center justify-center gap-2 transition-all uppercase"
          >
            {t.loginBtn}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#181920] text-[#3C3C3C] dark:text-[#E5E5E5] p-4 md:p-8 flex flex-col items-center justify-center relative font-sans">
      <ControlsToggle />
      <AnimatePresence mode="wait">
        {phase === 'IDLE' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-6 w-full max-w-sm">
            <div className="w-32 h-32 mx-auto bg-blue-100 rounded-full flex items-center justify-center animate-bounce">
              <BrainCircuit className="w-16 h-16 text-[#1CB0F6]" />
            </div>
            <h2 className="text-3xl font-extrabold">{t.welcome},<br/><span className="text-[#1CB0F6]">{playerData.name}!</span></h2>
            <p className="text-[#AFAFAF] dark:text-[#8C8F9F] font-bold text-lg">{t.waitText}</p>
            <motion.button whileTap={{ y: 2 }} onClick={() => { setPlayerData(null); setUserNameInput(playerData.name); setIsEditingName(true); }} className="mt-6 w-full px-6 py-4 bg-white dark:bg-[#2A2B35] hover:bg-[#F7F9FC] dark:hover:bg-[#343541] border-2 border-[#E5E5E5] dark:border-[#393A4B] hover:border-gray-300 border-b-4 rounded-2xl text-[#AFAFAF] dark:text-[#8C8F9F] font-extrabold uppercase transition-all"
            >
              {lang === 'kz' ? 'Атты өзгерту' : 'Изменить имя'}
            </motion.button>
            <MiniGame guestId={guestId} lang={lang} />
          </motion.div>
        )}

        {phase === 'PREFERENCES' && (
          <motion.div key="pref" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#2A2B35] border-2 border-[#E5E5E5] dark:border-[#393A4B] p-6 md:p-8 rounded-3xl max-w-xl w-full shadow-sm">
             <h3 className="text-2xl font-extrabold mb-2 text-center text-[#3C3C3C] dark:text-[#E5E5E5]">{t.chooseRoles}</h3>
             <p className="text-[#AFAFAF] dark:text-[#8C8F9F] text-center font-bold mb-8">{t.chooseSub}</p>
             
             <div className="grid gap-3 mb-8">
               {ROLES.map(r => {
                 const isSelected = selectedChoices.includes(r.id);
                 return (
                 <motion.button 
                  key={r.id}
                  whileTap={{ y: 2 }}
                  disabled={playerData.choices.length > 0}
                  onClick={() => {
                    if (isSelected) setSelectedChoices(selectedChoices.filter(id => id !== r.id));
                    else if (selectedChoices.length < 3) setSelectedChoices([...selectedChoices, r.id]);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group
                    ${isSelected 
                      ? 'bg-[#DDF4FF] border-[#1CB0F6] border-b-4 text-[#1CB0F6]' 
                      : 'bg-white dark:bg-[#2A2B35] border-[#E5E5E5] dark:border-[#393A4B] border-b-4 hover:bg-[#F7F9FC] dark:bg-[#181920]'}
                    ${playerData.choices.length > 0 ? 'opacity-70 pointer-events-none' : ''}
                  `}
                 >
                   <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${isSelected ? 'bg-white dark:bg-[#2A2B35] shadow-sm' : 'bg-[#F7F9FC] dark:bg-[#181920]'} ${r.color.replace('text-', 'text-').replace('-500', '-500')}`}>
                         <r.icon size={28} style={{ color: isSelected ? '#1CB0F6' : '#8C8F9F' }} />
                      </div>
                      <span className={`font-extrabold text-lg ${isSelected ? 'text-[#1CB0F6]' : 'text-[#3C3C3C] dark:text-[#E5E5E5]'}`}>{r.name[lang]}</span>
                   </div>
                   {isSelected && (
                     <div className="w-8 h-8 rounded-full bg-[#1CB0F6] text-white flex items-center justify-center font-black text-sm shadow-sm">
                        {selectedChoices.indexOf(r.id) + 1}
                     </div>
                   )}
                 </motion.button>
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
               <motion.button whileTap={selectedChoices.length < 3 ? {} : { y: 4 }} disabled={selectedChoices.length < 3 || isProcessing} onClick={handleChoicesSubmit} className="w-full py-4 bg-[#58CC02] hover:bg-[#46A302] border-[#58CC02] hover:border-[#46A302] disabled:bg-[#E5E5E5] dark:bg-[#393A4B] disabled:border-[#E5E5E5] dark:border-[#393A4B] disabled:text-[#AFAFAF] dark:text-[#8C8F9F] border-b-4 rounded-2xl text-white font-extrabold text-lg uppercase transition-all"
               >
                 {t.sendChoice}
               </motion.button>
             )}
          </motion.div>
        )}

        {phase === 'LOBBY' && (
          <motion.div key="lobby" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 max-w-sm">
            <div className="w-32 h-32 mx-auto bg-[#FFC800]/20 rounded-full flex items-center justify-center mb-6 relative">
              <Timer className="w-16 h-16 text-[#FFC800] animate-spin-slow absolute" />
            </div>
            <h2 className="text-3xl font-extrabold text-[#3C3C3C] dark:text-[#E5E5E5]">{t.quizPrep}</h2>
            <p className="text-[#AFAFAF] dark:text-[#8C8F9F] text-lg font-bold">{t.quizPrepSub}</p>
            
            <div className="mt-8 space-y-4 w-full">
              <h3 className="font-extrabold text-sm text-[#AFAFAF] dark:text-[#8C8F9F] uppercase tracking-wider">{lang === 'kz' ? 'Бәсекелестер (Конкуренттер)' : 'Конкуренты'}</h3>
              {playerData.choices.map((roleId: string) => {
                 const roleInfo = ROLES.find(r => r.id === roleId);
                 const competitors = players.filter(p => p.id !== guestId && p.choices.includes(roleId));
                 return (
                    <div key={roleId} className="bg-white dark:bg-[#2A2B35] border-2 border-[#E5E5E5] dark:border-[#393A4B] rounded-2xl p-4 text-left shadow-sm">
                      <span className="font-extrabold text-[#3C3C3C] dark:text-[#E5E5E5] block mb-3 text-sm">{roleInfo?.name[lang]}</span>
                      <div className="flex flex-wrap gap-2">
                        {competitors.length > 0 ? competitors.map(c => (
                          <span key={c.id} className="inline-flex items-center bg-[#F7F9FC] dark:bg-[#181920] px-3 py-1.5 rounded-xl text-xs font-bold text-[#AFAFAF] dark:text-[#8C8F9F] border border-[#E5E5E5] dark:border-[#393A4B]">
                            {c.name}
                          </span>
                        )) : (
                          <span className="text-xs font-bold text-[#AFAFAF] dark:text-[#8C8F9F] italic">{lang === 'kz' ? 'Қарсыластар жоқ' : 'Нет конкурентов'}</span>
                        )}
                      </div>
                    </div>
                 );
              })}
            </div>
            <MiniGame guestId={guestId} lang={lang} />
          </motion.div>
        )}

        {phase === 'QUIZ' && (
          <motion.div key="evidence_phase" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-[#2A2B35] rounded-3xl border-2 border-[#E5E5E5] dark:border-[#393A4B] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                 <h2 className="text-2xl font-black text-[#FF4B4B] mb-2">{lang === 'kz' ? 'Айғақтар жинау' : 'Сбор доказательств'}</h2>
                 <p className="text-[#AFAFAF] dark:text-[#8C8F9F] font-bold text-sm">
                   {lang === 'kz' ? 'Бексананың ісі: барлық білетініңізді жазыңыз және дәлелдерді тіркеңіз.' : 'Дело Бексаны: опишите всё, что вы знаете, загрузите фото или видеоматериалы.'}
                 </p>
              </div>
              <motion.button 
                whileTap={{ y: 2 }} onClick={async () => { await updateDoc(doc(db, 'players', guestId), { status: 'finished' }); }}
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

        {phase === 'RESULTS' && playerData.status === 'waiting_next' && (
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
                     className="w-full py-4 bg-white dark:bg-[#2A2B35] text-[#FF4B4B] hover:bg-[#FF4B4B]/5 border-[#E5E5E5] dark:border-[#393A4B] hover:border-[#FF4B4B] border-b-4 rounded-2xl font-extrabold text-lg transition-all uppercase"
                  >
                     {lang === 'kz' ? 'Келесі ойынды күту' : 'Ждать следующей игры'}
                  </motion.button>
              </div>
              <MiniGame guestId={guestId} lang={lang} />
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


function AdminPanel({ players, phase, onPhaseChange, onCalculate, onReset, lang, setLang }: any) {
  const t = TRANSLATIONS[lang];
  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#181920] text-[#3C3C3C] dark:text-[#E5E5E5] flex flex-col font-sans">
      <header className="p-4 md:p-6 border-b-2 border-[#E5E5E5] dark:border-[#393A4B] flex justify-between items-center bg-white dark:bg-[#2A2B35] sticky top-0 z-20 shadow-sm flex-col md:flex-row gap-4">
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#1CB0F6]/10 rounded-2xl border-2 border-[#1CB0F6]/20">
              <Settings className="text-[#1CB0F6]" size={28} />
            </div>
            <div>
              <h1 className="font-black uppercase tracking-widest text-[#3C3C3C] dark:text-[#E5E5E5]">{t.adminTitle}</h1>
              <p className="text-[10px] text-[#AFAFAF] dark:text-[#8C8F9F] uppercase font-bold tracking-tighter">{t.adminSub}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <motion.button 
              whileTap={{ y: 2 }}
              onClick={() => setLang('kz')}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all border-b-2 ${lang === 'kz' ? 'bg-[#1CB0F6] text-white border-[#1899D6]' : 'bg-white dark:bg-[#2A2B35] border-[#E5E5E5] dark:border-[#393A4B] text-[#AFAFAF] dark:text-[#8C8F9F] hover:bg-[#F7F9FC] dark:bg-[#181920]'}`}
            >
              ҚАЗ
            </motion.button>
            <motion.button 
              whileTap={{ y: 2 }}
              onClick={() => setLang('ru')}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all border-b-2 ${lang === 'ru' ? 'bg-[#1CB0F6] text-white border-[#1899D6]' : 'bg-white dark:bg-[#2A2B35] border-[#E5E5E5] dark:border-[#393A4B] text-[#AFAFAF] dark:text-[#8C8F9F] hover:bg-[#F7F9FC] dark:bg-[#181920]'}`}
            >
              РУС
            </motion.button>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap md:flex-nowrap justify-center">
           {phase === 'IDLE' && <motion.button onClick={() => onPhaseChange('PREFERENCES')} whileTap={{ y: 4 }} className="px-6 py-3 bg-[#1CB0F6] hover:bg-[#1899D6] border-[#1CB0F6] hover:border-[#1899D6] border-b-4 text-white rounded-2xl font-extrabold text-sm uppercase transition-all">{t.phase1}</motion.button>}
           {phase === 'PREFERENCES' && <motion.button onClick={() => onPhaseChange('LOBBY')} whileTap={{ y: 4 }} className="px-6 py-3 bg-[#1CB0F6] hover:bg-[#1899D6] border-[#1CB0F6] hover:border-[#1899D6] border-b-4 text-white rounded-2xl font-extrabold text-sm uppercase transition-all">{t.phase2}</motion.button>}
           {phase === 'LOBBY' && <motion.button onClick={() => onPhaseChange('QUIZ')} whileTap={{ y: 4 }} className="px-6 py-3 bg-[#FF4B4B] hover:bg-[#E54545] border-[#FF4B4B] hover:border-[#E54545] border-b-4 text-white rounded-2xl font-extrabold text-sm uppercase transition-all animate-pulse">{t.phase3}</motion.button>}
           {phase === 'QUIZ' && <motion.button onClick={onCalculate} whileTap={{ y: 4 }} className="px-6 py-3 bg-[#58CC02] hover:bg-[#46A302] border-[#58CC02] hover:border-[#46A302] border-b-4 text-white rounded-2xl font-extrabold text-sm uppercase transition-all">{t.phase4}</motion.button>}
           <motion.button whileTap={{ scale: 0.95 }} onClick={onReset} className="p-3 bg-white dark:bg-[#2A2B35] text-[#FF4B4B] rounded-2xl border-2 border-[#E5E5E5] dark:border-[#393A4B] border-b-4 hover:border-[#FF4B4B] hover:bg-[#FF4B4B]/5 transition-all"><Trash2 size={24} /></motion.button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
        {/* Players List */}
        <section className="bg-white dark:bg-[#2A2B35] rounded-3xl border-2 border-[#E5E5E5] dark:border-[#393A4B] p-6 md:p-8 shadow-sm h-fit">
           <div className="flex justify-between items-center mb-6 pb-6 border-b-2 border-[#E5E5E5] dark:border-[#393A4B]">
             <h3 className="text-xl font-black uppercase text-[#3C3C3C] dark:text-[#E5E5E5] flex items-center gap-3">
               <Users size={24} className="text-[#1CB0F6]" />
               {t.connectedPlayers} <span className="bg-[#E5E5E5] dark:bg-[#393A4B] text-[#3C3C3C] dark:text-[#E5E5E5] px-3 py-1 rounded-xl text-sm">{players.length}</span>
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
                      <p className="font-bold text-lg leading-none mb-2 text-[#3C3C3C] dark:text-[#E5E5E5]">{p.name}</p>
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
