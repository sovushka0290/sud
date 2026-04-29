import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const useMemoAdd = `
  const myQuestions = useMemo(() => {
    if (!playerData || playerData.choices.length === 0) return [];
    return playerData.choices.flatMap(roleId => ROLE_QUESTIONS[roleId] || []);
  }, [playerData?.choices]);
`;

content = content.replace(
  /const \[isEditingName, setIsEditingName\] = useState\(false\);/, 
  useMemoAdd + "\n  const [isEditingName, setIsEditingName] = useState(false);"
);

fs.writeFileSync('src/App.tsx', content);
