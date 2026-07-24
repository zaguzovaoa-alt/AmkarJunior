import React, { useState, useMemo } from 'react';
import { Client, TrainingSessionProtocol, TrainingGroup } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AttendanceTableProps {
  group: TrainingGroup;
  clients: Client[];
  trainingSessions: TrainingSessionProtocol[];
}

const statusConfig = {
  present: { symbol: '+', className: 'text-emerald-700 bg-emerald-100 font-bold', label: 'Присутствовал' },
  absent_sick: { symbol: 'Б', className: 'text-amber-700 bg-amber-100 font-bold', label: 'Болел' },
  absent: { symbol: '-', className: 'text-red-700 bg-red-100 font-bold', label: 'Отсутствовал' },
  trial_free: { symbol: 'П', className: 'text-blue-700 bg-blue-100 font-bold', label: 'Пробное' },
};

export const AttendanceTable: React.FC<AttendanceTableProps> = ({ group, clients, trainingSessions }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const groupPlayers = useMemo(() => {
    return (group.isSelectTeam
      ? clients.filter(c => group.selectedClientIds?.includes(c.id))
      : clients.filter(c => c.groupName === group.name)
    ).sort((a, b) => {
      const nameA = `${a.childSurname} ${a.childName}`.trim().toLowerCase();
      const nameB = `${b.childSurname} ${b.childName}`.trim().toLowerCase();
      return nameA.localeCompare(nameB, "ru");
    });
  }, [group, clients]);

  const monthSessions = useMemo(() => {
    return trainingSessions.filter(session => {
      if (session.groupId !== group.id) return false;
      const sessionDate = new Date(session.dateString || session.date);
      return sessionDate.getMonth() === month && sessionDate.getFullYear() === year;
    });
  }, [trainingSessions, group.id, month, year]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h4 className="font-bold text-slate-900 text-sm">Таблица посещаемости</h4>
        <div className="flex items-center space-x-4">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 rounded-lg transition">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="font-bold text-sm text-slate-800 w-32 text-center">
            {monthNames[month]} {year}
          </span>
          <button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 rounded-lg transition">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 font-bold text-slate-700 sticky left-0 bg-gray-100 z-10 w-48 shadow-[1px_0_0_0_#e5e7eb]">
                Ученик
              </th>
              {daysArray.map(day => {
                // Determine if there is at least one session on this day
                const hasSession = monthSessions.some(s => {
                  const sDate = new Date(s.dateString || s.date);
                  return sDate.getDate() === day;
                });
                return (
                  <th key={day} className={`px-1 py-2 font-bold text-center w-8 ${hasSession ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {day}
                  </th>
                );
              })}
              <th className="px-3 py-2 font-bold text-slate-700 text-center">Итого</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {groupPlayers.length === 0 ? (
              <tr>
                <td colSpan={daysInMonth + 2} className="px-3 py-6 text-center text-gray-500">
                  В этой группе пока нет учеников.
                </td>
              </tr>
            ) : (
              groupPlayers.map(player => {
                let totalPresent = 0;
                let totalSessions = 0;

                return (
                  <tr key={player.id} className="hover:bg-slate-50 transition">
                    <td className="px-3 py-2 font-medium text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[1px_0_0_0_#e5e7eb] truncate max-w-[12rem]">
                      {player.childSurname} {player.childName}
                    </td>
                    {daysArray.map(day => {
                      const daySessions = monthSessions.filter(s => {
                        const sDate = new Date(s.dateString || s.date);
                        return sDate.getDate() === day;
                      });

                      if (daySessions.length === 0) {
                        return <td key={day} className="px-1 py-2 text-center text-gray-200">-</td>;
                      }

                      // Assume max 1 session per group per day for simplicity of display, 
                      // or take the first record found for this player on this day.
                      const session = daySessions[0];
                      const record = (session.records || []).find(r => r.clientId === player.id);
                      
                      totalSessions++;

                      if (!record) {
                        // If there is a session but player is not in records, treat as unknown/empty
                        return <td key={day} className="px-1 py-2 text-center text-gray-300">?</td>;
                      }

                      if (record.status === 'present') totalPresent++;

                      const config = statusConfig[record.status];

                      return (
                        <td key={day} className="px-1 py-1">
                          <div className={`w-6 h-6 mx-auto rounded flex items-center justify-center text-[10px] ${config?.className || 'bg-gray-100'}`} title={config?.label}>
                            {config?.symbol || ''}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 font-bold text-slate-700 text-center bg-gray-50/50">
                      {totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) + '%' : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-3 bg-gray-50 border-t flex flex-wrap gap-4 text-[10px] text-gray-500 justify-center">
        {Object.values(statusConfig).map(config => (
          <div key={config.symbol} className="flex items-center space-x-1.5">
            <div className={`w-4 h-4 rounded flex items-center justify-center font-bold ${config.className}`}>
              {config.symbol}
            </div>
            <span>- {config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
