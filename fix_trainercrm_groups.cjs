const fs = require('fs');
let code = fs.readFileSync('src/components/TrainerCRM.tsx', 'utf8');

const regex = /\/\* Right column: Groups, Ratings, Files \*\/(.|\n)*?(<div className="text-left w-12 hidden sm:block">)/m;

const replacement = `/* Right column: Groups, Ratings, Files */
              <div className="space-y-6">
                {/* My Groups List - Image 3 right */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                  <div className="flex border-b pb-3 items-center justify-between">
                    <h3 className="font-extrabold text-slate-950 text-sm">
                      Мои группы
                    </h3>
                    <span
                      onClick={() => setActiveTab("trainer_groups")}
                      className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      Все группы
                    </span>
                  </div>

                  <div className="space-y-2">
                    {myGroups.map((grp, idx) => {
                      const colors = [
                        "bg-emerald-100 text-emerald-800",
                        "bg-blue-100 text-blue-800",
                        "bg-amber-100 text-amber-800",
                        "bg-purple-100 text-purple-800",
                      ];
                      const badgeColor = colors[idx % colors.length];
                      return (
                        <div
                          key={idx}
                          className="py-3 border-b border-gray-50 last:border-0 flex justify-between items-center group cursor-pointer hover:bg-slate-50 transition px-2 rounded-lg -mx-2 gap-2"
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 text-left flex-1 min-w-0">
                            <span
                              className={\`px-2 py-1 rounded font-bold text-[10px] whitespace-nowrap \${badgeColor}\`}
                            >
                              {grp.year}
                            </span>
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <div className="font-bold text-slate-900 text-xs truncate flex items-center gap-1">
                                {grp.isSelectTeam && (
                                  <Trophy className="w-3 h-3 text-orange-500 shrink-0" />
                                )}
                                <span className="truncate">{grp.name}</span>
                              </div>
                              <div className="text-[9px] text-gray-400 truncate">
                                Тренировка сегодня, 17:00
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-3 sm:space-x-4 shrink-0 justify-end items-center text-xs">
                            $2`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/TrainerCRM.tsx', code);
