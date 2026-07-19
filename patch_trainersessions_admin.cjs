const fs = require('fs');
let code = fs.readFileSync('src/components/TrainerSessions.tsx', 'utf8');

// Use currentRole
code = code.replace(
  '  const { trainingSessions, coaches } = useCRM();',
  '  const { trainingSessions, coaches, currentRole } = useCRM();'
);

// Modify filtering logic
code = code.replace(
  /const mySessions = \(trainingSessions \|\| \[\]\)\.filter\([\s\S]*?\.sort/m,
  `const isPrivileged = currentRole === 'admin' || currentRole === 'director';
  const mySessions = (trainingSessions || []).filter(
    (s) =>
      (isPrivileged || s.coachId === myCoach?.id ||
      s.coachName?.includes(myCoach?.name || "") ||
      s.assistantId === myCoach?.id) &&
      s.date.substring(0, 7) === filterMonth
  ).sort`
);

// Modify header
code = code.replace(
  '<HeaderDescription text={<>Мониторинг проведенных тренировок в качестве основного тренера и ассистента.</>} />',
  '<HeaderDescription text={<>{isPrivileged ? "Журнал всех проведенных тренировок и фотоотчетов." : "Мониторинг проведенных тренировок в качестве основного тренера и ассистента."}</>} />'
);

fs.writeFileSync('src/components/TrainerSessions.tsx', code);
