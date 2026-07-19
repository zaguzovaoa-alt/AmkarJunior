const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('TrainerSessions')) {
  code = code.replace(
    'import { TrainerCRM } from "./components/TrainerCRM";',
    'import { TrainerCRM } from "./components/TrainerCRM";\nimport { TrainerSessions } from "./components/TrainerSessions";'
  );
}

// Global replace
code = code.split('if (currentTab === "hq_attendance")').join('if (currentTab === "hq_sessions") return <TrainerSessions />;\n        if (currentTab === "hq_attendance")');

fs.writeFileSync('src/App.tsx', code);
console.log('done');
