const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

code = code.replace(
  '  ShoppingCart',
  '  ShoppingCart,\n  Camera'
);

code = code.replace(
  '{ id: "hq_attendance", label: "Посещения", icon: CheckSquare },',
  '{ id: "hq_attendance", label: "Посещения", icon: CheckSquare },\n          { id: "hq_sessions", label: "Журнал тренировок", icon: Camera },'
);

fs.writeFileSync('src/components/Sidebar.tsx', code);
