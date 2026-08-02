import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { 
  Check, Plus, Trash2, X, Search, Filter, CalendarDays, User, Clock, CheckSquare, MessageSquare, ArrowUp, ArrowDown, Settings 
} from "lucide-react";
import { CRMTask } from "../types";

export const TasksModule: React.FC = () => {
  const { tasks, addTask, updateTask, completeTask, deleteTask, currentRole, userProfile } = useCRM();
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"my" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  
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

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const validRole = ['manager', 'trainer', 'director'].includes(currentRole) 
      ? (currentRole as 'manager' | 'trainer' | 'director') 
      : 'director';
      
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    const formattedDate = `${d}.${m}.${y}`;

    addTask({
      title: newTaskTitle.trim(),
      description: "Создано из панели задач",
      dueDate: formattedDate,
      assignedTo: validRole,
    });
    setNewTaskTitle("");
    setIsAddingTask(false);
  };

  const filteredTasks = tasks.filter(t => {
    if (t.id.includes("_att") || t.title.toLowerCase().includes("посещаемост") || t.description?.toLowerCase().includes("посещаемост")) return false;
    if (activeTab === "my" && t.assignedTo !== currentRole && currentRole !== 'director') return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const columns = [
    { id: 'new', title: 'Новые', color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 'pending', title: 'В работе', color: 'text-amber-600', bg: 'bg-amber-100' },
    { id: 'overdue', title: 'Просрочено', color: 'text-red-600', bg: 'bg-red-100' },
    { id: 'completed', title: 'Выполнено', color: 'text-emerald-600', bg: 'bg-emerald-100' }
  ] as const;

  const STATUS_LABELS = {
    'new': 'Новая',
    'pending': 'В работе',
    'completed': 'Выполнено',
    'overdue': 'Просрочено'
  };

  return (
    <div className="flex flex-col flex-1 bg-slate-50 text-slate-800 relative overflow-hidden min-h-[calc(100vh-160px)] h-full">
      {/* Main Board Content */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${selectedTask ? 'mr-0 lg:mr-96' : ''}`}>
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 z-10">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Задачи</h1>
            <div className="flex space-x-6 mt-3 border-b">
              <button 
                onClick={() => setActiveTab("my")}
                className={`pb-2 text-sm font-bold transition-colors relative ${activeTab === "my" ? "text-red-500" : "text-gray-500 hover:text-gray-800"}`}
              >
                Мои задачи
                {activeTab === "my" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-t-full"></div>}
              </button>
              <button 
                onClick={() => setActiveTab("all")}
                className={`pb-2 text-sm font-bold transition-colors relative ${activeTab === "all" ? "text-red-500" : "text-gray-500 hover:text-gray-800"}`}
              >
                Все задачи
                {activeTab === "all" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-t-full"></div>}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Поиск задач..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl pl-9 pr-4 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <button className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition flex items-center justify-center shrink-0">
              <Filter className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsAddingTask(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition shrink-0"
            >
              <Plus className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Новая задача</span>
            </button>
          </div>
        </div>

        {/* Board Container */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="flex h-full gap-6 min-w-max">
            {columns.map(col => {
              const colTasks = filteredTasks.filter(t => t.status === col.id);
              return (
                <div key={col.id} className="w-72 sm:w-80 flex flex-col h-full bg-slate-100/50 rounded-2xl border border-slate-100/80 shrink-0">
                  <div className="p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-700">{col.title}</h3>
                      <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {colTasks.length}
                      </span>
                    </div>
                    <button className="text-slate-400 hover:text-slate-800 transition">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 custom-scrollbar">
                    {colTasks.map(task => (
                      <div 
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-slate-300 hover:shadow transition ${selectedTaskId === task.id ? 'ring-2 ring-red-500 border-transparent' : ''}`}
                      >
                        <div className="flex flex-col gap-2">
                          {/* Top indicators */}
                          <div className="flex justify-between items-start">
                            <h4 className={`text-sm font-bold text-slate-800 leading-snug ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                              {task.title}
                            </h4>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg w-fit">
                              <User className="w-3 h-3" />
                              <span className="uppercase">{task.assignedTo}</span>
                            </div>
                            <div className={`flex items-center gap-1 ${task.status === 'overdue' ? 'text-red-500' : ''}`}>
                              <Clock className="w-3 h-3" />
                              <span className="font-mono">{task.dueDate}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center p-4">
                        <span className="text-xs text-slate-400 font-medium text-center">Нет задач</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task Details Side Panel */}
      <div 
        className={`fixed lg:absolute top-0 right-0 h-full w-full sm:w-96 bg-white border-l border-slate-200 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col
          ${selectedTask ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {selectedTask && (
          <>
            <div className="px-6 py-4 flex flex-col border-b border-slate-100 shrink-0 gap-4">
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-slate-100 text-slate-600`}>
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
                        <span className={`text-sm font-medium ${item.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
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
        )}
      </div>

      {/* Add Task Modal Overlay */}
      {isAddingTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <h3 className="font-extrabold text-sm">Создать задачу</h3>
              <button onClick={() => setIsAddingTask(false)} className="text-slate-400 hover:text-white transition p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Название задачи
              </label>
              <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="Что нужно сделать?"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  onClick={() => setIsAddingTask(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleAddTask}
                  className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm rounded-xl transition"
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
