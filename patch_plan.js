import fs from 'fs';
let content = fs.readFileSync('src/components/FinanceModule.tsx', 'utf8');

const planRegex = /(<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">[\s\S]*?)(\{\/\* ДИНАМИКА И ВЫПОЛНЕНИЕ ПЛАНА \(ТРАТЫ И ДОХОДЫ\) \*\/\}[\s\S]*?)(          <\/div>\n        \)}\n      <\/div>\n    <\/div>\n  \);\n}\n)/;

const match = content.match(planRegex);
if (match) {
  const [_, firstDiv, secondDiv, tail] = match;
  content = content.replace(planRegex, secondDiv + '\n            ' + firstDiv + tail);
  fs.writeFileSync('src/components/FinanceModule.tsx', content);
  console.log('Swapped correctly');
} else {
  console.log('Match not found');
}
