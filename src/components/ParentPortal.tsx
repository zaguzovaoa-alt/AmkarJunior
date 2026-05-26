import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { ScheduleCalendar } from './ScheduleCalendar';
import { 
  Calendar, Check, User, AlertCircle, TrendingUp, CreditCard, 
  MessageSquare, BookOpen, Download, HelpCircle, Trophy, ArrowRight, Upload, Clock, Phone, Send, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ParentPortalProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenPayment: () => void;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({ activeTab, setActiveTab, onOpenPayment }) => {
  const { clients, messages, addChatMessage, uploadDocument } = useCRM();
  const [chatInput, setChatInput] = useState('');
  
  // We simulate acting as "Мария Иванова" (Mom of "Максим Иванов", client: cl1)
  const myClient = clients.find(c => c.id === 'cl1') || clients[0];
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!myClient) {
    return <div className="p-8 text-center bg-gray-50 text-gray-400">Загрузка данных личного кабинета...</div>;
  }

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    addChatMessage({
      senderRole: 'parent',
      senderName: `${myClient.parentName} (Мама ${myClient.childName})`,
      text: chatInput
    });
    setChatInput('');
  };

  const handleFileUploadMock = (type: 'medical' | 'insurance') => {
    const fileName = type === 'medical' ? 'справка_пройдена_2026.pdf' : 'полис_страховой_защиты_спорт.pdf';
    uploadDocument(myClient.id, type, fileName);
    alert(`Файл ${fileName} успешно прикреплен к учетной карточке ребенка! Менеджер и тренер увидят это в системе.`);
  };

  // Knowledge base mock articles matching Image 1
  const kbArticles = [
    {
      id: 'art1',
      title: 'Что нужно взять с собой на тренировку?',
      category: 'Тренировки',
      views: 1256,
      content: 'Все просто, но важно ничего не упустить! Вашему будущему чемпиону понадобится фирменная черная экипировка АМКАР ЮНИОР, футбольные бутсы (или многошиповки для зала/манежа), защитные щитки (обязательно для безопасности берцовой кости), чистые гетры, и индивидуальная брендированная бутылка для питьевой негазированной воды. Также рекомендуем положить маленькое полотенце.'
    },
    {
      id: 'art2',
      title: 'Как происходит оплата абонемента?',
      category: 'Оплата и абонементы',
      views: 987,
      content: 'Оплата абонемента происходит в безналичном формате через платежную систему ЮKassa. Ссылка на оплату формируется менеджером CRM после успешного прохождения пробной тренировки и высылается вам в Личный кабинет. Вы можете оплатить картами любых банков РФ, СБП или СберПей. После оплаты чеки автоматически регистрируются в ФНС, а абонемент активируется.'
    },
    {
      id: 'art3',
      title: 'Можно ли пропустить тренировку?',
      category: 'Родителям',
      views: 765,
      content: 'Пропускать тренировки без уважительной причины не рекомендуется, так как ребенок выбивается из тренировочного цикла. Однако в случае болезни (при наличии медицинской справки), либо предупреждения тренера или менеджера не менее чем за 5 часов до начала, занятие сохраняется на балансе. Просим своевременно отмечать статус в приложении.'
    },
    {
      id: 'art4',
      title: 'Как записаться на турнир или сборы?',
      category: 'Тренировки',
      views: 654,
      content: 'Все выездные мероприятия, лагеря и турниры отображаются во вкладке "Ближайшие события" вашего кабинета. Для бронирования участия вам достаточно нажать кнопку "Подать заявку", после чего менеджер вызовер вас для утверждения логистики и меддопусков.'
    },
    {
      id: 'art5',
      title: 'Требования к игровой форме',
      category: 'Форма и экипировка',
      views: 543,
      content: 'Игровая форма школы АМКАР ЮНИОР разработана с учетом анатомии юных спортсменов из гипоаллергенной дышащей ткани. В комплект входят футболка, шорты и брендированные гетры. Стирать форму рекомендуется при температуре не более 30 градусов без агрессивных отбеливателей.'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-gray-800 min-h-screen">
      {/* Header bar matching exact screenshots */}
      <div className="p-6 bg-white border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 font-sans tracking-tight">
            {activeTab === 'parent_knowledge' 
              ? 'База знаний' 
              : `Добрый день, ${myClient.parentName ? (myClient.parentName.split(' ')[1] || myClient.parentName.split(' ')[0] || 'Родитель') : 'Родитель'}! 👋`}
          </h1>
          <p className="text-gray-500 text-sm">
            {activeTab === 'parent_knowledge' 
              ? 'Полезные статьи, инструкции и ответы на частые вопросы для заботливых родителей.'
              : 'Вы находитесь в удобном интерактивном кабинете родителя школы АМКАР ЮНИОР.'}
          </p>
        </div>

        {/* Top Profile Pickers exactly like picture */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-gray-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div className="text-xs text-left">
              <div className="font-semibold text-gray-800">{myClient.childSurname} {myClient.childName}</div>
              <div className="text-gray-500 font-mono text-[10px]">{myClient.groupName}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-9 w-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-emerald-600">
              {myClient.parentName[0]}
            </div>
            <div className="text-xs hidden sm:block text-left">
              <div className="font-bold text-gray-800">{myClient.parentName}</div>
              <div className="text-gray-500 text-[10px]">Мама Максима</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <AnimatePresence mode="wait">
          
          {/* 1. HOME DASHBOARD TAB (МАТЧИТ ИЗОБРАЖЕНИЕ №2) */}
          {activeTab === 'parent_home' && (
            <motion.div 
              id="parent-dashboard-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUMN 1 & 2: Main Dashboard Widgets */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Blijaishya Trenirovka Card */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="space-y-3.5 z-10">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded bg-orange-105 bg-orange-100 text-orange-600 font-bold text-[10px] uppercase font-mono tracking-wide">
                          Тренировка
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Рекомендуется прийти за 15 минут</span>
                      </div>
                      <div className="flex items-baseline space-x-3">
                        <span className="text-4xl font-extrabold text-slate-900">21</span>
                        <div className="text-xs leading-tight text-gray-500">
                          <div>Сегодня, ср</div>
                          <div className="font-semibold text-slate-800">Май 2026</div>
                        </div>
                        <div className="h-10 w-[1px] bg-gray-200 mx-1"></div>
                        <div className="space-y-0.5">
                          <div className="text-lg font-bold text-slate-800">17:00 – 18:30</div>
                          <div className="text-xs text-gray-500 font-medium">Манеж «Спартак»</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <User className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Тренер: <strong className="font-semibold text-slate-800">{myClient.coachName}</strong></span>
                      </div>
                      <div className="p-2.5 bg-blue-50 text-blue-800 rounded-xl text-xs flex items-center space-x-2 border border-blue-100">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Не забудьте сменную форму, гетры, бутсы, защитные щитки и бутылочку воды. 💧</span>
                      </div>
                    </div>

                    {/* Fun Graphic representation of team football jersey */}
                    <div className="h-32 w-32 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-white relative flex-shrink-0">
                      <div className="absolute top-2 left-2 text-[9px] font-mono text-gray-500 tracking-wider">КИП_ДОМАШНИЙ</div>
                      <div className="font-mono text-xl font-extrabold text-slate-100">10</div>
                      <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">АМКАР</div>
                      <div className="w-14 h-4 mt-1 bg-emerald-600 rounded flex items-center justify-center text-[8px] font-semibold text-white uppercase">Иванов</div>
                    </div>
                  </div>

                  {/* Payment & Abonement widget */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <CreditCard className="w-4.5 h-4.5" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-slate-900 text-sm">Платежи и абонементы</h3>
                          <p className="text-xs text-gray-500">Баланс активных занятий в клубе</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 ${
                        myClient.abonementSessionsLeft > 0 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span>{myClient.abonementSessionsLeft > 0 ? 'Абонемент активен' : 'Требуется оплата'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <div className="text-xs text-gray-400 font-medium">Оплаченный пакет</div>
                        <div className="font-bold text-slate-800 text-sm mt-0.5">
                          {myClient.abonement === '12_sessions' ? 'Пакет "Базовый 12 занятий"' : 
                           myClient.abonement === '8_sessions' ? 'Пакет "Стандарт 8 занятий"' : 
                           myClient.abonement === '4_sessions' ? 'Пакет "Выходной 4 занятия"' : 'Нет абонемента'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Истекает: {myClient.abonementExpirationDate || 'Нет даты'}</div>
                      </div>
                      <div className="border-t sm:border-t-0 sm:border-l border-gray-200 pt-3 sm:pt-0 sm:pl-4 flex flex-col justify-between">
                        <div>
                          <div className="text-xs text-gray-400 font-medium">Остаток тренировок</div>
                          <div className="text-2xl font-black text-slate-900 mt-0.5">{myClient.abonementSessionsLeft} <span className="text-xs text-gray-500 font-medium">из {myClient.abonement === '12_sessions' ? 12 : 8}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* History */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2.5">История платежей</h4>
                      <div className="space-y-2">
                        {myClient.payments.map((p, i) => (
                          <div key={i} className="flex items-center justify-between text-xs p-2 rounded hover:bg-slate-50 transition border border-transparent">
                            <span className="text-slate-700 font-medium">{p.item}</span>
                            <span className="text-gray-400 font-mono text-[11px]">{p.date}</span>
                            <div className="flex items-center space-x-1">
                              <span className="font-bold text-slate-900">{p.amount} Р</span>
                              <span className="px-1.5 py-0.5 text-[9px] rounded font-semibold bg-emerald-100 text-emerald-800">
                                {p.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={onOpenPayment}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-650 text-white rounded-xl font-bold transition flex items-center justify-center space-x-2 text-sm shadow-lg shadow-emerald-100"
                    >
                      <span>Оплатить / Продлить абонемент</span>
                    </button>
                  </div>

                  {/* Document uploads */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-center space-x-2.5 border-b border-gray-100 pb-3">
                      <div className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Upload className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-slate-900 text-sm">Документы и меддопуски</h3>
                        <p className="text-xs text-gray-500 font-medium">Загрузка обязательных медицинских справок</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 leading-normal">
                      Для проведения полноценных спаррингов и спортивных турниров, правилами школы и Минспортом РФ предписано обязательное предоставление справки формата 086/у о допуске к физическим нагрузкам, а также наличие спортивной страховки.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl space-y-2 flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                          <div className="text-xs">
                            <div className="font-bold text-slate-800">Справка-допуск спортивная</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 font-mono">Формат 086/у или свободный (допуск)</div>
                          </div>
                          {myClient.medicalCertificateUrl ? (
                            <span className="p-1 rounded-full bg-emerald-100 text-emerald-800">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-full bg-amber-100 text-amber-800">
                              <AlertCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                          <span className="text-[10px] text-gray-500 font-medium truncate max-w-[120px]">
                            {myClient.medicalCertificateUrl || 'Не загружен'}
                          </span>
                          <button 
                            onClick={() => handleFileUploadMock('medical')}
                            className="p-1.5 bg-emerald-500 hover:bg-emerald-650 text-white rounded text-[10px] font-bold transition flex items-center space-x-1"
                          >
                            <Upload className="w-3 h-3" />
                            <span>{myClient.medicalCertificateUrl ? 'Заменить' : 'Загрузить'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl space-y-2 flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                          <div className="text-xs">
                            <div className="font-bold text-slate-800">Полис страхования жизни</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 font-mono">Спортивная страховка (футбол)</div>
                          </div>
                          {myClient.insuranceUrl ? (
                            <span className="p-1 rounded-full bg-emerald-100 text-emerald-800">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-full bg-amber-100 text-amber-800">
                              <AlertCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                          <span className="text-[10px] text-gray-500 font-medium truncate max-w-[120px]">
                            {myClient.insuranceUrl || 'Не загружен'}
                          </span>
                          <button 
                            onClick={() => handleFileUploadMock('insurance')}
                            className="p-1.5 bg-emerald-500 hover:bg-emerald-650 text-white rounded text-[10px] font-bold transition flex items-center space-x-1"
                          >
                            <Upload className="w-3 h-3" />
                            <span>{myClient.insuranceUrl ? 'Заменить' : 'Загрузить'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* COLUMN 3: Right side panels */}
                <div className="space-y-6">
                  
                  {/* Performance metrics */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <h3 className="font-bold text-slate-900 text-sm">Прогресс ребенка</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-100 text-indigo-700">Оценка клуба</span>
                    </div>

                    {/* Circular rating ring */}
                    <div className="flex flex-col items-center py-2.5">
                      <div className="relative flex items-center justify-center">
                        <svg className="w-24 h-24 transform -rotate-90">
                           <circle cx="48" cy="48" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                           <circle cx="48" cy="48" r="40" stroke="#10b981" strokeWidth="8" fill="transparent" 
                            strokeDasharray={`${2.5 * Math.PI * 40}`} strokeDashoffset={`${2.5 * Math.PI * 40 * (1 - 4.6/5)}`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-2xl font-black text-slate-900 font-sans">4.6</span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">из 5</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center space-x-1">
                        <span>↑ +0,3 к прошлому месяцу</span>
                      </div>
                    </div>

                    {/* Progress bars matching screenshot exactly */}
                    <div className="space-y-3 pt-2">
                      {[
                        { name: 'Техника', score: myClient.progress.technique, color: 'bg-emerald-500' },
                        { name: 'Тактика', score: myClient.progress.tactics, color: 'bg-indigo-500' },
                        { name: 'Физ. подготовка', score: myClient.progress.physical, color: 'bg-amber-500' },
                        { name: 'Дисциплина', score: myClient.progress.discipline, color: 'bg-orange-500' }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-medium">{item.name}</span>
                            <span className="font-bold text-slate-800">{item.score}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`${item.color} h-full rounded-full`} style={{ width: `${(item.score / 5) * 100}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calendar/Attendance Grid (Май 2025/2026) */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Посещаемость</h3>
                        <p className="text-[10px] text-gray-400 font-medium">Журнал тренировок</p>
                      </div>
                      <span className="text-xs font-bold font-mono text-gray-600 bg-slate-100 px-2 py-0.5 rounded">
                        Май 2026
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 px-1 text-center bg-slate-50 p-2.5 rounded-xl border border-gray-100">
                      <div>
                        <div className="text-xs font-bold text-slate-800">8</div>
                        <div className="text-[9px] text-gray-400 font-medium mt-0.5">Посещено</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-600">1</div>
                        <div className="text-[9px] text-gray-400 font-medium mt-0.5">Уваж. пропуск</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-500">0</div>
                        <div className="text-[9px] text-gray-400 font-medium mt-0.5">Болезнь/прогул</div>
                      </div>
                    </div>

                    {/* Dynamic styled Monthly Calendar layout like image 2 */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                      {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d, i) => (
                        <div key={i} className="text-gray-400 font-bold py-1">{d}</div>
                      ))}
                      {/* Blank days pre month */}
                      <div className="text-gray-300 py-1 font-mono">27</div>
                      <div className="text-gray-300 py-1 font-mono">28</div>
                      <div className="text-gray-300 py-1 font-mono">29</div>
                      <div className="text-gray-300 py-1 font-mono">30</div>
                      
                      {/* Calendar items */}
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">1</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">2</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">3</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">4</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">5</div>
                      {/* May 6, 7 (Present) */}
                      <div className="bg-emerald-500 text-white font-bold py-1 rounded-full font-mono flex items-center justify-center">6</div>
                      <div className="bg-emerald-500 text-white font-bold py-1 rounded-full font-mono flex items-center justify-center">7</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">8</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">9</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">10</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">11</div>
                      {/* May 12 (Special absent) */}
                      <div className="bg-amber-100 text-amber-800 font-bold py-1 rounded-full font-mono flex items-center justify-center">12</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">13</div>
                      <div className="bg-emerald-500 text-white font-bold py-1 rounded-full font-mono flex items-center justify-center">14</div>
                      <div className="bg-emerald-500 text-white font-bold py-1 rounded-full font-mono flex items-center justify-center">15</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">16</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">17</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">18</div>
                      <div className="bg-emerald-500 text-white font-bold py-1 rounded-full font-mono flex items-center justify-center">19</div>
                      {/* 20 (Normal) */}
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">20</div>
                      {/* TODAY (21 May - Highlighted Active) */}
                      <div className="bg-emerald-500 text-white ring-2 ring-emerald-200 font-bold py-1 rounded-full font-mono flex items-center justify-center">21</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">22</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">23</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">24</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">25</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">26</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">27</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">28</div>
                      <div className="text-slate-800 py-1 font-bold rounded-lg border border-transparent font-mono">29</div>
                      <div className="text-slate-300 py-1 font-mono">30</div>
                      <div className="text-slate-300 py-1 font-mono">31</div>
                    </div>

                    <div className="flex items-center justify-center space-x-3 text-[10px] text-gray-500 border-t border-gray-100 pt-2.5">
                      <div className="flex items-center space-x-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span>Был</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                        <span>Уважительный</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                        <span>Пропуск/Болен</span>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming calendar events matching exact picture */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <h3 className="font-bold text-slate-900 text-sm">Ближайшие события</h3>
                      <button className="text-xs font-bold text-emerald-600 hover:text-emerald-500 transition">Все события</button>
                    </div>

                    <div className="space-y-3.5">
                      {[
                        { day: '24', month: 'мая', title: 'Турнир "Кубок Импульса"', time: '10:00 - 16:00', loc: 'Манеж Спартак' },
                        { day: '30', month: 'мая', title: 'Родительское собрание', time: '19:00 - 20:00', loc: 'Онлайн (Zoom)' },
                        { day: '12', month: 'июня', title: 'Выездные сборы', time: '12 - 15 июня', loc: 'Култаево, база «Мяч»' }
                      ].map((evt, id) => (
                        <div key={id} className="flex items-start space-x-3 text-xs">
                          <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-emerald-50 text-center flex flex-col justify-center border border-emerald-100/40">
                            <span className="text-base font-black text-emerald-600 font-mono leading-none">{evt.day}</span>
                            <span className="text-[8px] text-emerald-500 font-bold tracking-tight uppercase">{evt.month}</span>
                          </div>
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-800">{evt.title}</div>
                            <div className="text-[10px] text-gray-400 font-mono flex items-center space-x-1.5">
                              <span>{evt.time}</span>
                              <span>•</span>
                              <span>{evt.loc}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

          {/* 2. CALENDAR TAB */}
          {activeTab === 'parent_schedule' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl p-0 border border-slate-200 overflow-hidden shadow-sm"
            >
              <ScheduleCalendar />
            </motion.div>
          )}

          {/* 3. ATTENDANCE HISTORIC */}
          {activeTab === 'parent_attendance' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6"
            >
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-lg font-bold text-slate-900">Исторический журнал посещений Максима</h3>
                <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">{myClient?.groupName || 'Группа не назначена'}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-gray-400 font-semibold uppercase tracking-wider border-b">
                      <th className="p-3">Дата тренировки</th>
                      <th className="p-3">Статус присутствия</th>
                      <th className="p-3">Причина отсутствия / Примечание тренера</th>
                      <th className="p-3">Визуальный фотоотчет</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {myClient.attendance.map((att, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold">{att.date}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            att.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                            att.status === 'absent_sick' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {att.status === 'present' ? 'Присутствовал' :
                             att.status === 'absent_sick' ? 'Болел (уваж.)' : 'Пропуск'}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-600">
                          {att.reason || 'Занятие пройдено успешно, замечаний по поведению нет.'}
                        </td>
                        <td className="p-3 text-gray-400">
                          {att.status === 'present' ? '📸 Присутствует в групповом фото' : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* 4. REZULATTY & ACHIEVEMENTS */}
          {activeTab === 'parent_gamification' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Gamification progress dashboard elements */}
              <div className="p-5 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <span className="text-xs uppercase font-bold text-indigo-300 font-mono tracking-widest">Академия достижений АМКАР</span>
                  </div>
                  <h3 className="text-xl font-black font-sans leading-tight">Поддерживаем мотивацию будущего чемпиона!</h3>
                  <p className="text-xs text-indigo-200 leading-relaxed max-w-xl">
                    За каждую продуктивную тренировку, высокие спортивные оценки от тренера и стабильную дисциплину ребенок получает наградные значки-медали в своем Личном кабинете. Соберите 5 достижений за сезон для получения специального подарка от клуба!
                  </p>
                </div>
                <div className="h-28 w-28 rounded-full border-4 border-amber-400/40 flex flex-col items-center justify-center bg-slate-800 flex-shrink-0">
                  <span className="text-3xl font-extrabold text-amber-400 font-mono">3 / 5</span>
                  <span className="text-[10px] font-semibold text-slate-300">Наград</span>
                </div>
              </div>

              {/* Achievements collection list */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {myClient.achievements.map((ach, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex items-center space-x-4 font-sans text-xs">
                    <div className="h-16 w-16 rounded-xl bg-orange-50 text-3xl flex items-center justify-center border border-orange-100 flex-shrink-0 shadow-inner">
                      {ach.icon}
                    </div>
                    <div className="space-y-1">
                      <div className="font-extrabold text-slate-800 text-sm">{ach.title}</div>
                      <p className="text-[11px] text-gray-500 leading-normal">{ach.description}</p>
                      <div className="text-[9px] font-mono text-gray-400 font-semibold uppercase">Получен: {ach.earnedAt}</div>
                    </div>
                  </div>
                ))}
                
                {/* Unearned achievement placeholders */}
                <div className="bg-slate-50 border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center space-x-4 opacity-60">
                  <div className="h-16 w-16 rounded-xl bg-slate-200 text-3xl flex items-center justify-center border flex-shrink-0 grayscale">
                    🎯
                  </div>
                  <div className="space-y-1 text-left">
                    <div className="font-extrabold text-gray-400 text-sm">Железный АМКАРОВЕЦ</div>
                    <p className="text-[11px] text-gray-400 leading-normal">Посетите 12 тренировок в одном билинговом цикле.</p>
                    <div className="text-[9px] font-mono text-orange-500 font-bold uppercase">В процессе (8/12)</div>
                  </div>
                </div>

                <div className="bg-slate-50 border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center space-x-4 opacity-60">
                  <div className="h-16 w-16 rounded-xl bg-slate-200 text-3xl flex items-center justify-center border flex-shrink-0 grayscale">
                    ❤️
                  </div>
                  <div className="space-y-1">
                    <div className="font-extrabold text-gray-400 text-sm">Снайпер Академии</div>
                    <p className="text-[11px] text-gray-400 leading-normal">Заработайте наивысший бал 4.8+ за точность ударов.</p>
                    <div className="text-[9px] font-mono text-indigo-500 font-bold uppercase">Новая планка</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 5. PAYMENTS HISTORY */}
          {activeTab === 'parent_payments' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-lg font-bold text-slate-900">Детализированная история транзакций</h3>
                <button 
                  onClick={onOpenPayment}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded text-xs transition transition duration-200"
                >
                  Оплатить новый абонемент
                </button>
              </div>

              <div className="space-y-3">
                {myClient.payments.map((p, i) => (
                  <div key={i} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-slate-50 border border-gray-200 rounded-xl gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg">
                        <Check className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{p.item}</div>
                        <div className="text-xs text-gray-400 font-mono font-medium">{p.date} • Транзакция #TX_{Date.now() - i*100000}</div>
                      </div>
                    </div>
                    <div className="flex items-center sm:justify-end gap-3">
                      <span className="text-base font-black text-slate-900 font-mono">{p.amount} ₽</span>
                      <span className="px-3 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                        успешно
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 6. MESSAGES CHAT (С МУЛЬТИМЕДИА) */}
          {activeTab === 'parent_messages' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[520px] overflow-hidden"
            >
              {/* Active channel info */}
              <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-600">
                    A
                  </div>
                  <div className="text-left py-0.5">
                    <h3 className="font-bold text-slate-800 text-sm">Чат обратной связи школы</h3>
                    <p className="text-[10px] text-gray-500 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Дежурный менеджер & тренер {myClient.coachName} на связи</span>
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-400">Часовой пояс: МСК</div>
              </div>

              {/* Chat log with custom scroll */}
              <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-4 text-xs font-sans">
                {messages.map((msg, idx) => {
                  const isMe = msg.senderRole === 'parent';
                  return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs sm:max-w-md p-3 rounded-2xl ${
                        isMe 
                          ? 'bg-emerald-600 text-white rounded-br-none' 
                          : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                      }`}>
                        <div className="flex justify-between items-center mb-1 text-[9px] font-bold opacity-80">
                          <span>{msg.senderName}</span>
                          <span className="font-mono ml-2">{msg.timestamp}</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat write panel */}
              <form onSubmit={handleSendChat} className="p-3 border-t bg-white flex items-center space-x-2">
                <button 
                  type="button" 
                  onClick={() => {
                    const sampleFiles = ['заявление_болеем.pdf', 'медицинский_чек.png', 'тренировка_максим.jpeg'];
                    const picked = sampleFiles[Math.floor(Math.random() * sampleFiles.length)];
                    addChatMessage({
                      senderRole: 'parent',
                      senderName: `${myClient.parentName} (Мама ${myClient.childName})`,
                      text: `[Прикреплен файл]: ${picked}`
                    });
                  }}
                  title="Прикрепить файл/фото"
                  className="p-2.5 bg-slate-150 hover:bg-slate-200 rounded-xl text-gray-500 hover:text-gray-700 transition"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <input 
                  type="text" 
                  placeholder="Напишите сообщение родителю, тренеру или админу..." 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 focus:bg-white border focus:border-emerald-500 rounded-xl text-xs text-gray-800 outline-none transition"
                />
                <button 
                  type="submit"
                  className="p-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white transition-all shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}

          {/* 7. KNOWLEDGE BASE TAB (МАТЧИТ ИЗОБРАЖЕНИЕ №1) */}
          {activeTab === 'parent_knowledge' && (
            <motion.div 
              id="knowledge-base-root"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Popular Categories Grid from photo */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { cat: 'Тренировки', desc: 'Все о тренировочном процессе, формах, выездах', count: 12, bg: 'bg-orange-50 text-orange-600 border-orange-100/40' },
                  { cat: 'Оплата и абонементы', desc: 'Информация об оплате, пакетах и тарифах', count: 8, bg: 'bg-emerald-50 text-emerald-600 border-emerald-100/40' },
                  { cat: 'Форма и экипировка', desc: 'Требования к форме, гетрам, конусам', count: 6, bg: 'bg-blue-50 text-blue-600 border-blue-100/40' },
                  { cat: 'Родителям', desc: 'Рекомендации, правила клуба и памятки', count: 15, bg: 'bg-amber-50 text-amber-600 border-amber-100/40' },
                  { cat: 'Здоровье и безопасность', desc: 'Безопасность суставов, справки, допуски', count: 7, bg: 'bg-indigo-50 text-indigo-700 border-indigo-100/40' }
                ].map((category, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${category.bg} shadow-xs flex flex-col justify-between h-36 border-transparent hover:scale-[1.02] transition duration-200`}>
                    <div className="space-y-1 text-left">
                      <BookOpen className="w-4.5 h-4.5 mb-1" />
                      <div className="font-extrabold text-[12px] leading-snug">{category.cat}</div>
                      <p className="text-[10px] text-gray-500 leading-normal">{category.desc}</p>
                    </div>
                    <div className="text-[10px] font-bold text-slate-600">{category.count} статей →</div>
                  </div>
                ))}
              </div>

              {/* Main row split - Popular Articles list vs side info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Popular Articles column */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-slate-900 border-b pb-1.5 text-sm">Популярные статьи базы</h3>
                    
                    <div className="divide-y divide-gray-100">
                      {kbArticles.map((art, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setSelectedArticle(art)}
                          className="py-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-lg px-2 transition -mx-2"
                        >
                          <div className="space-y-0.5 text-left">
                            <h4 className="font-bold text-xs text-slate-800 hover:text-emerald-500 transition">{art.title}</h4>
                            <span className="text-[10px] text-gray-400 font-mono font-medium">{art.category}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-[10px] text-gray-400">
                            <span className="flex items-center space-x-1 font-mono">
                              <Eye className="w-3 h-3" />
                              <span>{art.views}</span>
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Useful materials list column (Photo 1 right) */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-slate-900 border-b pb-1.5 text-sm">Полезные материалы</h3>

                    {[
                      { title: 'Памятка/Правила Клуба', desc: 'Ценности и культура нашей школы.', file: 'Скачать PDF' },
                      { title: 'Календарь Сезона 2025/2026', desc: 'Даты турниров, выездов и вех.', file: 'Смотреть график' },
                      { title: 'Инструкция по питанию игроков', desc: 'Рацион питания для спортсменов 4-12 лет.', file: 'Открыть PDF' },
                      { title: 'Контакты тренеров и медицина', desc: 'Телефоны дежурной помощи клиники.', file: 'Показать контакты' }
                    ].map((mat, id) => (
                      <div key={id} className="p-3 bg-slate-50 border rounded-xl hover:shadow-xs transition text-left space-y-1.5">
                        <div className="font-bold text-xs text-slate-800">{mat.title}</div>
                        <p className="text-[10px] text-gray-500 leading-relaxed font-medium">{mat.desc}</p>
                        <button className="text-[10px] font-bold text-emerald-600 flex items-center space-x-1">
                          <Download className="w-3 h-3" />
                          <span>{mat.file}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Read Popup Dialog */}
              {selectedArticle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border shadow-xl">
                    <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                          {selectedArticle.category}
                        </span>
                        <h4 className="font-black text-slate-900 mt-1 max-w-md text-sm">{selectedArticle.title}</h4>
                      </div>
                      <button 
                        onClick={() => setSelectedArticle(null)}
                        className="p-1 text-gray-400 hover:text-gray-600 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="p-5 text-xs text-slate-700 leading-relaxed whitespace-pre-line text-left">
                      {selectedArticle.content}
                    </div>
                    <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
                      <span className="text-[11px] text-gray-400">Просмотров: {selectedArticle.views}</span>
                      <button 
                        onClick={() => setSelectedArticle(null)} 
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                      >
                        Закрыть статью
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* 8. SETTINGS */}
          {activeTab === 'parent_settings' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm max-w-lg mx-auto text-left space-y-6"
            >
              <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Настройки профиля родителя</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Имя законного представителя (Родителя)</label>
                  <input type="text" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs" value={myClient.parentName} readOnly />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Телефон для экстренной связи</label>
                  <input type="text" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-mono" value={myClient.parentPhone} readOnly />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Контактный Email</label>
                  <input type="text" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs" value={myClient.parentEmail} readOnly />
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
                  <div className="font-bold text-slate-800 text-xs">Уведомления в Telegram</div>
                  <p className="text-[11px] text-gray-500">
                    Хотите получать автоматические отчеты по тренировочным оценкам, напоминания об оплатах и посещаемости прямо в мессенджер Telegram? Подключите нашего бота-ассистента.
                  </p>
                  <button 
                    onClick={() => {
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded text-[10px] uppercase transition"
                  >
                    {copiedLink ? 'Ссылка скопирована! ✅' : 'Подключить Telegram бот'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
