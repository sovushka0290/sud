import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Move myQuestions
const myQFunc = `  const myQuestions = useMemo(() => {
    if (!playerData || playerData.choices.length === 0) return [];
    return playerData.choices.flatMap(roleId => ROLE_QUESTIONS[roleId] || []);
  }, [playerData?.choices]);`;

content = content.replace(myQFunc, ''); // remove it from bad spot

const playerDataDef = "const [playerData, setPlayerData] = useState<Player | null>(null);";
content = content.replace(playerDataDef, playerDataDef + "\n" + myQFunc);

// 2. Add useMemo import
content = content.replace(/import React, \{ useState, useEffect, useRef \} from 'react';/, "import React, { useState, useEffect, useRef, useMemo } from 'react';");

fs.writeFileSync('src/App.tsx', content);
