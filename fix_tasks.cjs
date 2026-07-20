const fs = require('fs');
let code = fs.readFileSync('src/components/TasksModule.tsx', 'utf8');

// 1. Add updateTask to useCRM and add new states
code = code.replace(
  'const { tasks, addTask, completeTask, deleteTask, currentRole } = useCRM();',
  'const { tasks, addTask, updateTask, completeTask, deleteTask, currentRole, userProfile } = useCRM();\n  const [newChecklistText, setNewChecklistText] = useState("");\n  const [newCommentText, setNewCommentText] = useState("");'
);

// We need to implement:
// 1. handleAddChecklist
// 2. handleToggleChecklist
// 3. handleAddComment
// 4. handleUpdateDueDate

const handlers = `
  const handleAddChecklist = () => {
    if (!newChecklistText.trim() || !selectedTask) return;
    const currentChecklist = selectedTask.checklist || [];
    updateTask(selectedTask.id, {
      checklist: [...currentChecklist, { id: 'cl_' + Date.now(), text: newChecklistText.trim(), isCompleted: false }]
    });
    setNewChecklistText("");
  };

  const handleToggleChecklist = (checkId: string) => {
    if (!selectedTask) return;
    const currentChecklist = selectedTask.checklist || [];
    updateTask(selectedTask.id, {
      checklist: currentChecklist.map(c => c.id === checkId ? { ...c, isCompleted: !c.isCompleted } : c)
    });
  };

  const handleAddComment = () => {
    if (!newCommentText.trim() || !selectedTask) return;
    const currentComments = selectedTask.comments || [];
    const timeNow = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const authorName = userProfile?.name || currentRole;
    updateTask(selectedTask.id, {
      comments: [...currentComments, { id: 'c_' + Date.now(), text: newCommentText.trim(), author: authorName, timestamp: timeNow }]
    });
    setNewCommentText("");
  };

  const handleUpdateDueDate = (newDate: string) => {
    if (!selectedTask) return;
    updateTask(selectedTask.id, { dueDate: newDate });
  };
`;

code = code.replace(
  'const handleAddTask = () => {',
  handlers + '\n  const handleAddTask = () => {'
);

const oldSelectedTaskBlock = `        {selectedTask && (
          <>
            <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 shrink-0">
              <span className={\`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-slate-100 text-slate-600\`}>
                Задача
              </span>
              <button 
                onClick={() => setSelectedTaskId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              <h2 className="text-xl font-black text-slate-900 leading-tight mb-2">
                {selectedTask.title}
              </h2>
              
              <p className="text-sm text-slate-600 mb-8 whitespace-pre-wrap leading-relaxed">
                {selectedTask.description}
              </p>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Исполнитель</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 capitalize">
                        {selectedTask.assignedTo === 'director' ? 'Директор' : selectedTask.assignedTo === 'manager' ? 'Менеджер' : 'Тренер'}
                      </div>
                      <div className="text-[10px] font-medium text-slate-400 uppercase">
                        {selectedTask.assignedTo}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Срок</h4>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                      <CalendarDays className="w-4 h-4 text-slate-400" />
                      {selectedTask.dueDate}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Статус</h4>
                    <select 
                      value={selectedTask.status} 
                      readOnly 
                      className="w-full text-sm font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 appearance-none outline-none"
                    >
                      <option value="new">{STATUS_LABELS['new']}</option>
                      <option value="pending">{STATUS_LABELS['pending']}</option>
                      <option value="completed">{STATUS_LABELS['completed']}</option>
                      <option value="overdue">{STATUS_LABELS['overdue']}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">Чек-лист</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <CheckSquare className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="text-sm text-slate-700 font-medium">Связаться с родителем</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-4 h-4 rounded border-2 border-slate-300"></div>
                      <span className="text-sm text-slate-700 font-medium">Уточнить детали</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-4 h-4 rounded border-2 border-slate-300"></div>
                      <span className="text-sm text-slate-700 font-medium">Пригласить на тренировку</span>
                    </div>
                    <button className="text-sm font-bold text-blue-600 hover:text-blue-700 mt-2 flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Добавить пункт
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Комментарий</h4>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
                    <div className="flex-1">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-400 font-medium">
                        Напишите комментарий...
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <button 
                onClick={() => {
                  if (window.confirm("Удалить задачу?")) {
                    deleteTask(selectedTask.id);
                    setSelectedTaskId(null);
                  }
                }}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedTaskId(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition"
                >
                  Отложить
                </button>
                {selectedTask.status !== 'completed' && (
                  <button 
                    onClick={() => {
                      completeTask(selectedTask.id);
                    }}
                    className="px-6 py-2 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition"
                  >
                    Выполнить
                  </button>
                )}
              </div>
            </div>
          </>
        )}`;

const newSelectedTaskBlock = `        {selectedTask && (
          <>
            <div className="px-6 py-4 flex flex-col border-b border-slate-100 shrink-0 gap-4">
              <div className="flex justify-between items-center">
                <span className={\`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-slate-100 text-slate-600\`}>
                  Задача
                </span>
                <button 
                  onClick={() => setSelectedTaskId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Moved Actions to the top */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedTaskId(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition"
                  >
                    Отложить
                  </button>
                  {selectedTask.status !== 'completed' && (
                    <button 
                      onClick={() => {
                        completeTask(selectedTask.id);
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition shadow-sm"
                    >
                      Выполнить
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => {
                    if (window.confirm("Удалить задачу?")) {
                      deleteTask(selectedTask.id);
                      setSelectedTaskId(null);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              <h2 className="text-xl font-black text-slate-900 leading-tight mb-2">
                {selectedTask.title}
              </h2>
              
              <p className="text-sm text-slate-600 mb-8 whitespace-pre-wrap leading-relaxed">
                {selectedTask.description}
              </p>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Исполнитель</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 capitalize">
                        {selectedTask.assignedTo === 'director' ? 'Директор' : selectedTask.assignedTo === 'manager' ? 'Менеджер' : 'Тренер'}
                      </div>
                      <div className="text-[10px] font-medium text-slate-400 uppercase">
                        {selectedTask.assignedTo}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Срок</h4>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 focus-within:ring-2 focus-within:ring-emerald-500">
                      <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                      <input 
                        type="text" 
                        value={selectedTask.dueDate} 
                        onChange={(e) => handleUpdateDueDate(e.target.value)}
                        className="bg-transparent border-none outline-none w-full font-bold text-slate-800 text-sm"
                        placeholder="ДД.ММ.ГГГГ"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Статус</h4>
                    <select 
                      value={selectedTask.status} 
                      onChange={(e) => updateTask(selectedTask.id, { status: e.target.value as any })}
                      className="w-full text-sm font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="new">{STATUS_LABELS['new']}</option>
                      <option value="pending">{STATUS_LABELS['pending']}</option>
                      <option value="completed">{STATUS_LABELS['completed']}</option>
                      <option value="overdue">{STATUS_LABELS['overdue']}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">Чек-лист</h4>
                  <div className="space-y-3">
                    {selectedTask.checklist?.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 group">
                        <button onClick={() => handleToggleChecklist(item.id)} className="mt-0.5 shrink-0 outline-none">
                          {item.isCompleted ? (
                            <CheckSquare className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <div className="w-4 h-4 rounded border-2 border-slate-300"></div>
                          )}
                        </button>
                        <span className={\`text-sm font-medium \${item.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}\`}>
                          {item.text}
                        </span>
                        <button 
                          onClick={() => {
                            const current = selectedTask.checklist || [];
                            updateTask(selectedTask.id, { checklist: current.filter(c => c.id !== item.id) });
                          }}
                          className="ml-auto opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    <div className="flex items-center gap-2 mt-2">
                      <input 
                        type="text" 
                        value={newChecklistText}
                        onChange={(e) => setNewChecklistText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
                        placeholder="Добавить пункт..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                      <button 
                        onClick={handleAddChecklist}
                        className="bg-slate-900 text-white p-2 rounded-xl hover:bg-slate-800 transition shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">Комментарии</h4>
                  <div className="space-y-4">
                    {selectedTask.comments?.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-2xl rounded-tl-none p-3 border border-slate-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-700">{comment.author}</span>
                            <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                          </div>
                          <p className="text-sm text-slate-600">{comment.text}</p>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-start gap-3 mt-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 font-bold text-xs uppercase">
                        {userProfile?.name?.charAt(0) || currentRole.charAt(0)}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                          placeholder="Напишите комментарий..."
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 font-medium outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                        <button 
                          onClick={handleAddComment}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl transition shrink-0 flex items-center justify-center"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}`;

code = code.replace(oldSelectedTaskBlock, newSelectedTaskBlock);

fs.writeFileSync('src/components/TasksModule.tsx', code);
