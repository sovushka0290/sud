/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
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
  Share2
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

  // --- API Sync (Polling) ---

  useEffect(() => {
    let isMounted = true;
    const pollState = async () => {
      try {
        const res = await fetch('/api/state', { cache: 'no-store' });
        if (!res.ok) throw new Error('API down');
        const data = await res.json();
        if (isMounted) {
          setPhase(data.phase);
          setPlayers(data.players);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    };

    pollState();
    const interval = setInterval(pollState, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      let isMounted = true;
      const pollPlayerData = async () => {
        try {
          const res = await fetch(`/api/players/${guestId}`, { cache: 'no-store' });
          if (!res.ok) throw new Error('API down');
          const data = await res.json();
          if (isMounted) setPlayerData(data);
        } catch (e) {
          console.error("Player polling error", e);
        }
      };

      pollPlayerData();
      const interval = setInterval(pollPlayerData, 2000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [guestId, isAdmin]);

  // Quiz Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'QUIZ' && playerData?.status === 'quiz' && quizTimer > 0) {
      interval = setInterval(() => setQuizTimer(t => t - 1), 1000);
    } else if (quizTimer === 0 && phase === 'QUIZ' && playerData?.status === 'quiz') {
      handleQuizAnswer(-1); // Timeout as wrong answer
    }
    return () => clearInterval(interval);
  }, [phase, playerData?.status, quizTimer]);

  // --- Handlers ---

  const handleLogin = async () => {
    if (!userNameInput.trim()) return;
    
    if (userNameInput === 'ADMIN_SUD') {
      setIsAdmin(true);
      return;
    }

    try {
      await fetch(`/api/players/${guestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userNameInput,
          choices: [],
          score: 0,
          timeTaken: 0,
          assignedRole: null,
          status: 'waiting'
        })
      });
    } catch (e) {
      console.error("Login write failed", e);
      alert(lang === 'kz' ? 'Жүйеге кіру қатесі!' : 'Ошибка входа в систему!');
    }
  };

  const handleChoicesSubmit = async () => {
    if (selectedChoices.length < 3) return;
    try {
      await fetch(`/api/players/${guestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choices: selectedChoices })
      });
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
      await fetch(`/api/players/${guestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'quiz' })
      });
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
        await fetch(`/api/players/${guestId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'finished',
            score: finalScore,
            timeTaken: totalTime
          })
        });
      } catch (e) {
        console.error("Quiz answer submit failed", e);
      }
    }
  };

  const LanguageToggle = () => (
    <div className="fixed top-6 left-6 z-50 flex gap-2">
      <button 
        onClick={() => setLang('kz')}
        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${lang === 'kz' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
      >
        ҚАЗ
      </button>
      <button 
        onClick={() => setLang('ru')}
        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${lang === 'ru' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
      >
        РУС
      </button>
    </div>
  );

  // --- Admin Logic ---

  const setGlobalPhase = async (newPhase: GamePhase) => {
    await fetch('/api/admin/phase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPhase })
    });
  };

  const calculateResults = async () => {
    await fetch('/api/admin/calculate', { method: 'POST' });
  };

  const resetGame = async () => {
    await fetch('/api/admin/reset', { method: 'POST' });
    window.location.reload();
  };

  // --- UI Components ---

  if (isAdmin) return <AdminPanel players={players} phase={phase} onPhaseChange={setGlobalPhase} onCalculate={calculateResults} onReset={resetGame} lang={lang} setLang={setLang} />;

  if (!playerData && !isAdmin) return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 relative">
      <LanguageToggle />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 border border-white/10 p-8 rounded-3xl max-w-md w-full backdrop-blur-xl">
        <Scale className="w-12 h-12 text-blue-500 mb-6 mx-auto" />
        <h2 className="text-2xl font-bold text-center mb-2 uppercase tracking-widest">{t.title}</h2>
        <p className="text-gray-500 text-center text-xs mb-8 uppercase tracking-tighter">{t.regTitle}</p>
        
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder={t.namePlaceholder}
            value={userNameInput} 
            onChange={(e) => setUserNameInput(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none transition-all placeholder:text-gray-600 font-bold"
          />
          <button onClick={handleLogin} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">
            <LogIn size={20} /> {t.loginBtn}
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-4 md:p-8 flex items-center justify-center relative">
      <LanguageToggle />
      <AnimatePresence mode="wait">
        {phase === 'IDLE' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-6">
            <BrainCircuit className="w-20 h-20 text-blue-500 mx-auto animate-pulse" />
            <h2 className="text-3xl font-black uppercase italic">{t.welcome}, {playerData.name}!</h2>
            <p className="text-gray-400 max-w-sm mx-auto">{t.waitText}</p>
          </motion.div>
        )}

        {phase === 'PREFERENCES' && (
          <motion.div key="pref" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 p-8 rounded-3xl max-w-xl w-full backdrop-blur-xl">
             <h3 className="text-2xl font-bold mb-2 uppercase italic tracking-tighter">{t.chooseRoles}</h3>
             <p className="text-gray-500 text-sm mb-8">{t.chooseSub}</p>
             
             <div className="grid gap-3 mb-8">
               {ROLES.map(r => (
                 <button 
                  key={r.id}
                  disabled={playerData.choices.length > 0}
                  onClick={() => {
                    if (selectedChoices.includes(r.id)) setSelectedChoices(selectedChoices.filter(id => id !== r.id));
                    else if (selectedChoices.length < 3) setSelectedChoices([...selectedChoices, r.id]);
                  }}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${selectedChoices.includes(r.id) ? 'bg-blue-600/20 border-blue-500/50' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                 >
                   <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg bg-white/5 ${r.color}`}>
                        <r.icon size={24} />
                      </div>
                      <span className="font-bold tracking-tight">{r.name[lang]}</span>
                   </div>
                   {selectedChoices.includes(r.id) && (
                     <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-xs">
                        {selectedChoices.indexOf(r.id) + 1}
                     </div>
                   )}
                 </button>
               ))}
             </div>

             {playerData.choices.length > 0 ? (
               <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
                  <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm">✓ {t.choiceAccepted}</p>
                  <span className="text-[10px] text-gray-500 block mt-1">{t.dontLookAway}</span>
               </div>
             ) : (
               <button 
                disabled={selectedChoices.length < 3} 
                onClick={handleChoicesSubmit}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-2xl font-black uppercase tracking-widest transition-all cursor-pointer"
               >
                 {t.sendChoice}
               </button>
             )}
          </motion.div>
        )}

        {phase === 'LOBBY' && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
            <Timer className="w-16 h-16 text-blue-500 mx-auto animate-spin-slow" />
            <h2 className="text-3xl font-black uppercase">{t.quizPrep}</h2>
            <p className="text-gray-400">{t.quizPrepSub}</p>
          </motion.div>
        )}

        {phase === 'QUIZ' && (
          <motion.div key="quiz" className="w-full max-w-2xl">
            {playerData.status === 'finished' ? (
              <div className="text-center bg-white/5 p-12 rounded-3xl border border-white/10 backdrop-blur-md">
                 <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
                 <h2 className="text-3xl font-black uppercase mb-4 text-emerald-400">{t.quizFinished}</h2>
                 <p className="text-gray-400 leading-relaxed">{t.quizFinishedSub}</p>
              </div>
            ) : playerData.status === 'quiz' ? (
              <div className="bg-white/5 border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 bg-red-600 transition-all duration-1000" style={{ width: `${(quizTimer/10)*100}%` }}></div>
                <div className="flex justify-between items-center mb-10">
                   <span className="px-3 py-1 bg-white/5 rounded-lg text-xs font-mono text-gray-500">{quizStep + 1} / {QUESTIONS.length}</span>
                   <div className="text-4xl font-black text-red-500 tabular-nums">{quizTimer}s</div>
                </div>
                <h3 className="text-2xl md:text-4xl font-bold mb-12 leading-tight">{QUESTIONS[quizStep].text[lang]}</h3>
                <div className="grid gap-4">
                  {QUESTIONS[quizStep].options[lang].map((opt, i) => (
                    <button key={i} onClick={() => handleQuizAnswer(i)} className="p-6 text-left bg-white/5 border border-white/5 rounded-2xl hover:bg-blue-600/20 hover:border-blue-500/50 transition-all font-medium text-lg">
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center">
                 <button onClick={handleStartQuiz} className="px-16 py-8 bg-red-600 text-white font-black rounded-3xl text-3xl shadow-[0_0_50px_rgba(220,38,38,0.4)] animate-pulse hover:scale-105 active:scale-95 transition-all">
                   {t.startQuiz}
                 </button>
              </div>
            )}
          </motion.div>
        )}

        {phase === 'RESULTS' && playerData.assignedRole && (
          <motion.div key="res" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-12 max-w-sm">
             <div className="p-1 w-40 h-40 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400 mx-auto">
               <div className="w-full h-full bg-[#0a0a0c] rounded-full flex items-center justify-center">
                  {(() => {
                    const r = ROLES.find(r => r.id === playerData.assignedRole);
                    return r ? <r.icon size={80} className="text-emerald-400" /> : null
                  })()}
               </div>
             </div>
             <div>
                <h2 className="text-[12px] text-gray-600 font-bold uppercase tracking-[0.5em] mb-4">{t.assignedRoleLabel}</h2>
                <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">
                  {ROLES.find(r => r.id === playerData.assignedRole)?.name[lang]}
                </h3>
             </div>
             <div className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20">
                <p className="text-emerald-400 font-bold uppercase text-xs mb-1">{t.scoreLabel} {playerData.score} / 5</p>
                <p className="text-gray-500 text-[10px] uppercase font-bold">{t.qualConfirmed}</p>
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
    <div className="min-h-screen bg-[#050508] text-white flex flex-col">
      <header className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0a0a0c]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Settings className="text-blue-500" size={24} />
            </div>
            <div>
              <h1 className="font-black uppercase tracking-widest text-sm">{t.adminTitle}</h1>
              <p className="text-[8px] text-gray-500 uppercase font-bold tracking-tighter">{t.adminSub}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setLang('kz')}
              className={`px-3 py-1 rounded text-[10px] font-black transition-all ${lang === 'kz' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
            >
              ҚАЗ
            </button>
            <button 
              onClick={() => setLang('ru')}
              className={`px-3 py-1 rounded text-[10px] font-black transition-all ${lang === 'ru' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
            >
              РУС
            </button>
          </div>
        </div>
        <div className="flex gap-4">
           {phase === 'IDLE' && <button onClick={() => onPhaseChange('PREFERENCES')} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black uppercase transition-all shadow-lg">{t.phase1}</button>}
           {phase === 'PREFERENCES' && <button onClick={() => onPhaseChange('LOBBY')} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black uppercase transition-all shadow-lg">{t.phase2}</button>}
           {phase === 'LOBBY' && <button onClick={() => onPhaseChange('QUIZ')} className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-black uppercase transition-all shadow-lg animate-pulse">{t.phase3}</button>}
           {phase === 'QUIZ' && <button onClick={onCalculate} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black uppercase transition-all shadow-lg">{t.phase4}</button>}
           <button onClick={onReset} className="p-3 bg-red-950/30 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20} /></button>
        </div>
      </header>

      <main className="flex-1 p-6 grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
        {/* Players List */}
        <section className="bg-white/5 rounded-3xl border border-white/10 p-8">
           <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
             <h3 className="text-xl font-black uppercase italic flex items-center gap-3">
               <Users size={20} className="text-blue-500" />
               {t.connectedPlayers} ({players.length})
             </h3>
           </div>
           
           <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
             {players.sort((a: any, b: any) => b.score - a.score).map((p, idx) => (
               <div key={p.id} className="p-5 bg-white/2 border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-white/5 transition-all">
                 <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-gray-700">{idx + 1}</span>
                    <div>
                      <p className="font-bold text-lg leading-none mb-1">{p.name}</p>
                      <div className="flex gap-2">
                         {p.choices.map((c: string, i: number) => (
                            <span key={i} className="text-[8px] bg-white/10 px-1 py-0.5 rounded text-gray-500 uppercase font-black">{ROLES.find(r => r.id === c)?.id}</span>
                         ))}
                      </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="text-right">
                       <span className="text-sm font-black text-emerald-400 block">{p.score} / 5</span>
                       <span className="text-[9px] text-gray-600 uppercase font-bold tracking-tighter">{(p.timeTaken/1000).toFixed(2)}s</span>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${p.status === 'finished' ? 'bg-emerald-500' : p.status === 'quiz' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                 </div>
               </div>
             ))}
             {players.length === 0 && <div className="text-center py-20 text-gray-700 font-bold uppercase tracking-widest text-xs">{t.noPlayers}</div>}
           </div>
        </section>

        {/* Dashboard / Analytics */}
        <section className="space-y-8">
           <div className="p-1 bg-gradient-to-br from-blue-600/30 to-transparent rounded-3xl">
              <div className="bg-[#0a0a0c] p-8 rounded-[22px] border border-white/5">
                <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mb-6">{t.sysStatus}</h4>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-6 bg-white/2 rounded-2xl border border-white/5">
                      <span className="text-[8px] text-gray-600 uppercase font-black block mb-1">{t.status}</span>
                      <span className="text-3xl font-black italic uppercase text-blue-500">{phase}</span>
                   </div>
                   <div className="p-6 bg-white/2 rounded-2xl border border-white/5">
                      <span className="text-[8px] text-gray-600 uppercase font-black block mb-1">{t.finishedCount}</span>
                      <span className="text-3xl font-black tabular-nums">{players.filter((p: any) => p.status === 'finished').length}</span>
                   </div>
                </div>
              </div>
           </div>

           <div className="bg-white/5 rounded-3xl border border-white/10 p-8">
              <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mb-6">{t.roleDist}</h4>
              <div className="space-y-4">
                 {ROLES.map(role => {
                    const assigned = players.filter((p: any) => p.assignedRole === role.id).length;
                    const progress = (assigned / (role.limit === 99 ? players.length || 1 : role.limit)) * 100;
                    return (
                      <div key={role.id}>
                         <div className="flex justify-between items-end mb-2">
                            <span className={`text-sm font-bold uppercase tracking-tight ${role.color}`}>{role.name[lang]}</span>
                            <span className="text-xs font-mono text-gray-500">{assigned} / {role.limit === 99 ? '∞' : role.limit}</span>
                         </div>
                         <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(progress, 100)}%` }} className={`h-full ${role.color.replace('text-', 'bg-')}`} />
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}
