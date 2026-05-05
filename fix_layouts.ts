import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// For Users: Move EvidenceCollection out of phase block
// The user layout wrapper:
// <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#181920] text-[#3C3C3C] dark:text-[#E5E5E5] p-4 md:p-8 flex flex-col items-center justify-center relative font-sans">
//   <ControlsToggle />
//   <AnimatePresence mode="wait">
//     ...
//   </AnimatePresence>
//   [PUT EVIDENCE HERE IF THEY ARE REGISTERED]
// </div>
// Actually, if we put it at the bottom, we need to check if playerData exists, so they don't see it if they haven't entered their name.

const userEndPhaseStr = "</AnimatePresence>";
const replaceEndPhase = `</AnimatePresence>
      {playerData && (
        <div className="w-full max-w-4xl mt-12 animate-fade-in">
          <EvidenceCollection guestId={guestId} playerName={playerData.name} lang={lang} t={t} />
        </div>
      )}`;
if (content.includes(userEndPhaseStr)) {
  content = content.replace(userEndPhaseStr, replaceEndPhase);
}


// In the QUIZ phase, remove the EvidenceCollection reference
content = content.replace(
  /<EvidenceCollection guestId=\{guestId\} playerName=\{playerData\.name\} lang=\{lang\} t=\{t\} \/>/,
  ''
);

// For Admin: Move EvidenceCollection below the grid of players and stats
const adminGridStartStr = `<main className="flex-1 p-4 md:p-8 grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">`;
const replaceAdminGridStart = `<main className="flex-1 p-4 md:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full">
<div className="grid lg:grid-cols-2 gap-8 w-full">`;

if (content.includes(adminGridStartStr)) {
  content = content.replace(adminGridStartStr, replaceAdminGridStart);
}

// Find "</main>" that belongs to AdminPanel
const adminGridEndStr = `</section>\n      </main>`;
const replaceAdminGridEnd = `</section>
        </div>
        <div className="w-full mt-4">
           <EvidenceCollection guestId="admin" playerName="Admin" lang={lang} t={{}} />
        </div>
      </main>`;
if (content.includes(adminGridEndStr)) {
  content = content.replace(adminGridEndStr, replaceAdminGridEnd);
}

fs.writeFileSync('src/App.tsx', content);
