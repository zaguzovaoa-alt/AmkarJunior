import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { 
  CheckSquare, Check, Plus, Trash2, ArrowUpRight, CheckCircle2, ClipboardList
} from "lucide-react";
import { CRMTask } from "../types";

export const TasksModule: React.FC = () => {
  const { tasks, addTask, completeTask, currentRole } = useCRM();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    
    // Ensure we only use allowed roles for assignedTo
    const validRole = ['manager', 'trainer', 'director'].includes(currentRole) 
      ? (currentRole as 'manager' | 'trainer' | 'director') 
      : 'director';
      
    addTask({
      title: newTaskTitle.trim(),
      description: "Создано из панели задач",
      dueDate: new Date().toLocaleDateString("ru-RU"),
      assignedTo: validRole,
    });
    setNewTaskTitle("");
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status !== 'completed';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div className="flex-1 bg-white min-h-screen text-slate-800 p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-slate-100 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-905 flex items-center">
            <ClipboardList className="w-6 h-6 mr-3 text-emerald-600" />
            Мониторинг управленческих задач
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Управляйте задачами школы: создавайте, отмечайте выполненные, отслеживайте процесс.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border border-slate-100 bg-slate-50 p-5 rounded-2xl shadow-sm h-fit">
          <h3 className="font-extrabold text-sm mb-4">Создать новую задачу</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              placeholder="Опишите задачу..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder-gray-400"
            />
            <button
              onClick={handleAddTask}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-sm font-bold py-3 rounded-xl transition flex justify-center items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Добавить задачу
            </button>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h4 className="font-bold text-xs text-slate-500 mb-3 uppercase tracking-wider">Фильтры отображения</h4>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setFilter('all')} 
                className={`py-2 px-3 text-left rounded-lg text-xs font-bold transition flex justify-between items-center ${filter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
              >
                Все задачи <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">{tasks.length}</span>
              </button>
              <button 
                onClick={() => setFilter('pending')} 
                className={`py-2 px-3 text-left rounded-lg text-xs font-bold transition flex justify-between items-center ${filter === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-200 border' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
              >
                В работе <span className="text-[10px] bg-amber-200 px-1.5 py-0.5 rounded text-amber-900">{tasks.filter(t => t.status !== 'completed').length}</span>
              </button>
              <button 
                onClick={() => setFilter('completed')} 
                className={`py-2 px-3 text-left rounded-lg text-xs font-bold transition flex justify-between items-center ${filter === 'completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 border' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
              >
                Выполненные <span className="text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded text-emerald-900">{tasks.filter(t => t.status === 'completed').length}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-2 flex flex-col gap-2">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 font-medium">
                <CheckSquare className="w-12 h-12 mb-4 text-slate-200" />
                Здесь пока нет задач. Выберите нужный фильтр или добавьте новую задачу.
              </div>
            ) : (
              filteredTasks.map((t) => (
                <div key={t.id} className="p-4 bg-slate-50 border border-slate-150 rounded-xl hover:bg-slate-100/60 transition group flex flex-col sm:flex-row gap-4 items-start justify-between">
                  {/* Status toggle logic */}
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => {
                        if (t.status !== 'completed') {
                          completeTask(t.id);
                        }
                      }}
                      className={`mt-0.5 p-1 rounded-md transition border ${
                        t.status === 'completed' 
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-600 cursor-default'
                        : 'bg-white border-slate-300 text-transparent hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <Check className="w-4 h-4 text-inherit" />
                    </button>
                    <div>
                      <h4 className={`font-bold text-sm mb-1 ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {t.title}
                      </h4>
                      <p className="text-xs text-slate-500 mb-2 max-w-full">
                        {t.description}
                      </p>
                      <div className="flex gap-2 text-[10px] font-bold font-mono uppercase tracking-wider">
                        <span className="bg-white border px-2 py-0.5 rounded text-slate-500">
                          {t.dueDate}
                        </span>
                        <span className="bg-white border px-2 py-0.5 rounded text-slate-500">
                          {t.assignedTo}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
