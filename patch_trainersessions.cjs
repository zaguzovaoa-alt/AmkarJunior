const fs = require('fs');
let code = fs.readFileSync('src/components/TrainerSessions.tsx', 'utf8');

// Replace imports
code = code.replace(
  'import { Calendar, User, Clock, CheckCircle } from "lucide-react";',
  'import { Calendar, User, Clock, CheckCircle, Camera, X } from "lucide-react";\nimport { TrainingSessionProtocol } from "../types";'
);

// Add state for selected session
code = code.replace(
  'const [filterMonth, setFilterMonth] = useState(',
  'const [selectedSession, setSelectedSession] = useState<TrainingSessionProtocol | null>(null);\n  const [filterMonth, setFilterMonth] = useState('
);

// Add photo thumbnail to session card
const sessionCardRegex = /<div className="flex items-center gap-6 sm:gap-8">/g;
code = code.replace(
  sessionCardRegex,
  `<div className="flex items-center gap-4 sm:gap-6">\n                  {session.photoUrl && (\n                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 cursor-pointer" onClick={() => setSelectedSession(session as any)}>\n                      <img src={session.photoUrl} alt="Фото" className="w-full h-full object-cover" />\n                    </div>\n                  )}\n                  <button onClick={() => setSelectedSession(session as any)} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition">Подробнее</button>\n                  <div className="flex items-center gap-4 sm:gap-6">`
);
// we need to close the extra div we opened
code = code.replace(
  /<CheckCircle className="w-4 h-4 text-emerald-500" \/>\n                  <\/div>\n                <\/div>/g,
  `<CheckCircle className="w-4 h-4 text-emerald-500" />\n                  </div>\n                </div>\n                </div>`
);

// Add modal at the end of the return statement
const modalCode = `
      {selectedSession && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Отчет по тренировке</h3>
              <button onClick={() => setSelectedSession(null)} className="p-1 hover:bg-slate-200 rounded-lg transition"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-4">
              {selectedSession.photoUrl ? (
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-slate-50 flex items-center justify-center min-h-[200px]">
                  <img src={selectedSession.photoUrl} alt="Фотоотчет" className="w-full object-contain max-h-[40vh]" />
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400 bg-slate-50 rounded-xl border border-dashed">
                  <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <span>Фотоотчет не прикреплен</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                   <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Группа</div>
                   <div className="font-bold text-sm text-slate-900">{selectedSession.groupName}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                   <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Дата и время проведения</div>
                   <div className="font-bold text-sm text-slate-900">{selectedSession.date} • {selectedSession.dateString}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                   <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Тренер</div>
                   <div className="font-bold text-sm text-slate-900">{selectedSession.coachName}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                   <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Ассистент</div>
                   <div className="font-bold text-sm text-slate-900">{selectedSession.assistantName || 'Не указан'}</div>
                </div>
              </div>

              <div className="p-4 border rounded-xl space-y-3">
                 <h4 className="font-bold text-sm text-slate-900">Посещаемость</h4>
                 <div className="flex gap-4 text-xs">
                    <span className="text-emerald-600 font-bold">Присутствовали: {selectedSession.presentCount}</span>
                    <span className="text-rose-600 font-bold">Пропустили: {selectedSession.absentCount + selectedSession.sickCount}</span>
                 </div>
                 <div className="space-y-1 mt-3">
                   {selectedSession.records && selectedSession.records.map(rec => (
                     <div key={rec.clientId} className="flex justify-between items-center py-1 border-b last:border-0 border-gray-100 text-xs">
                       <span className="font-medium">{rec.clientName}</span>
                       <span className={\`px-2 py-0.5 rounded text-[10px] font-bold \${rec.status === 'present' ? 'bg-emerald-50 text-emerald-700' : rec.status === 'absent_sick' ? 'bg-amber-50 text-amber-700' : rec.status === 'trial_free' ? 'bg-fuchsia-50 text-fuchsia-700' : 'bg-rose-50 text-rose-700'}\`}>
                         {rec.status === 'present' ? 'Был' : rec.status === 'absent_sick' ? 'Болел' : rec.status === 'trial_free' ? 'Пробная' : 'Пропуск'}
                       </span>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
`;
code = code.replace(
  '    </div>\n  );\n};',
  modalCode + '\n    </div>\n  );\n};'
);

fs.writeFileSync('src/components/TrainerSessions.tsx', code);
