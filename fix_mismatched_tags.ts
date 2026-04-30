import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Use a regex to find <motion.button ... > ... </button>
// This is hard for complex nested JSX, but I'll try to find common patterns I introduced.

// Pattern 1: login
content = content.replace(
    /(<motion.button[^>]*whileTap[^>]*>[\s\S]*?)<\/button>/g,
    (match, p1) => {
        // Only replace if p1 contains <motion.button but not </motion.button>
        // and doesn't contain another nested <button
        if (p1.includes('<motion.button') && !p1.includes('</motion.button>')) {
            return p1 + '</motion.button>';
        }
        return match;
    }
);

// Targeted fixes for the specific lines reported
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    // Look ahead for </button> after a <motion.button
    if (lines[i].includes('<motion.button') && !lines[i].includes('</motion.button>')) {
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
            if (lines[j].trim() === '</button>') {
                lines[j] = lines[j].replace('</button>', '</motion.button>');
                break;
            }
            if (lines[j].includes('<motion.button') || lines[j].includes('<button')) break; // don't cross boundaries
        }
    }
}
content = lines.join('\n');

fs.writeFileSync(filePath, content);
