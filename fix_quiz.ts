import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Remove QUESTIONS array and add ROLE_QUESTIONS
const oldQuestionsCode = `const QUESTIONS = [
  { text: { kz: 'Заң дегеніміз не?', ru: 'Что такое закон?' }, options: { kz: ['Ережелер жинағы', 'Кітап', 'Ойын', 'Ән'], ru: ['Свод правил', 'Книга', 'Игра', 'Песня'] }, correct: 0 },
  { text: { kz: 'Конституция қашан қабылданды?', ru: 'Когда принята Конституция?' }, options: { kz: ['1991', '1995', '1998', '2000'], ru: ['1991', '1995', '1998', '2000'] }, correct: 1 },
  { text: { kz: 'Қылмыстық кодекс нені реттейді?', ru: 'Что регулирует Уголовный кодекс?' }, options: { kz: ['Мүлікті', 'Қылмысты', 'Отбасын', 'Салықты'], ru: ['Имущество', 'Преступления', 'Семью', 'Налоги'] }, correct: 1 },
  { text: { kz: 'Сот билігі кімге тиесілі?', ru: 'Кому принадлежит судебная власть?' }, options: { kz: ['Президентке', 'Парламентке', 'Соттарға', 'Халыққа'], ru: ['Президенту', 'Парламенту', 'Судам', 'Народу'] }, correct: 2 },
  { text: { kz: 'Адвокаттың негізгі міндеті?', ru: 'Главная задача адвоката?' }, options: { kz: ['Айыптау', 'Қорғау', 'Соттау', 'Жазалау'], ru: ['Обвинять', 'Защищать', 'Судить', 'Наказывать'] }, correct: 1 },
];`;

const newQuestionsCode = `const ROLE_QUESTIONS: Record<string, any[]> = {
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
};`;

content = content.replace(oldQuestionsCode, newQuestionsCode);

// 2. Add quizStep field to Player type and instantiation
content = content.replace(
  /assignedRole: string \| null;\n  status: 'waiting' \| 'quiz' \| 'finished';\n}/,
  "assignedRole: string | null;\n  status: 'waiting' | 'quiz' | 'finished';\n  quizStep?: number;\n}"
);

content = content.replace(
  /status: 'waiting'\n    };/g,
  "status: 'waiting',\n      quizStep: 0\n    };"
);

// 3. Update myQuestions computing
const useMemoAdd = `
  const myQuestions = useMemo(() => {
    if (!playerData || playerData.choices.length === 0) return [];
    return playerData.choices.flatMap(roleId => ROLE_QUESTIONS[roleId] || []);
  }, [playerData?.choices]);
`;
// place it before const [isEditingName, setIsEditingName] = useState(true);
content = content.replace(/const \[isEditingName, setIsEditingName\] = useState\(true\);/, useMemoAdd + "\n  const [isEditingName, setIsEditingName] = useState(true);");


// 4. Fix Start Quiz to sync step to 0
content = content.replace(
  /await updateDoc\(doc\(db, 'players', guestId\), \{ status: 'quiz' \}\);/,
  "await updateDoc(doc(db, 'players', guestId), { status: 'quiz', quizStep: 0, score: 0 });"
);

// 5. Update handles
const oldHandleQuizAnswer = `const handleQuizAnswer = async (index: number) => {
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
  };`;

const newHandleQuizAnswer = `const handleQuizAnswer = async (index: number) => {
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
  };`;

content = content.replace(oldHandleQuizAnswer, newHandleQuizAnswer);

fs.writeFileSync('src/App.tsx', content);
