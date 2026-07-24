const fs = require('fs');
const content = fs.readFileSync('src/components/ScheduleCalendar.tsx', 'utf8');
const newContent = content.replace(
  /if \(\!gObj\.scheduleDays\.includes\(slotToAdd\)\) {/,
  'if (!(gObj.scheduleDays || []).includes(slotToAdd)) {'
).replace(
  /const updatedSlots = \[\.\.\.gObj\.scheduleDays\, slotToAdd\];/,
  'const updatedSlots = [...(gObj.scheduleDays || []), slotToAdd];'
);
fs.writeFileSync('src/components/ScheduleCalendar.tsx', newContent);
