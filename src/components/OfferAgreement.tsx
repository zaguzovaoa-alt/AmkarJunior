import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Printer,
  Download,
  Search,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  Globe,
  Share2,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AmkarLogo } from "./AmkarLogo";

interface OfferAgreementProps {
  onBack?: () => void;
  isModal?: boolean;
}

export const OfferAgreement: React.FC<OfferAgreementProps> = ({
  onBack,
  isModal = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = useMemo(
    () => [
      { id: "sec-1", title: "1. Термины и общие положения" },
      { id: "sec-2", title: "2. Предмет договора" },
      { id: "sec-3", title: "3. Порядок акцепта оферты" },
      { id: "sec-4", title: "4. Права и обязанности Исполнителя" },
      { id: "sec-5", title: "5. Права и обязанности Заказчика" },
      { id: "sec-6", title: "6. Стоимость услуг и порядок оплаты" },
      { id: "sec-7", title: "7. Правила посещения, пропуски и отработки" },
      { id: "sec-8", title: "8. Медицинские требования и безопасность" },
      { id: "sec-9", title: "9. Ответственность сторон и форс-мажор" },
      { id: "sec-10", title: "10. Срок действия, изменение и расторжение" },
      { id: "sec-11", title: "11. Реквизиты и контакты Исполнителя" },
    ],
    []
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const textContent = `ДОГОВОР ПУБЛИЧНОЙ ОФЕРТЫ
на оказание физкультурно-оздоровительных (спортивных) услуг
Детская футбольная школа «Амкар Юниор» (ИП Тюкалов Е.Е.)
г. Пермь, редакция от 11.09.2025 г.
Официальный сайт: https://amkarjunior.ru

1. ТЕРМИНЫ И ОБЩИЕ ПОЛОЖЕНИЯ
1.1. Настоящий документ является публичной офертой Индивидуального предпринимателя Тюкалова Евгения Евгеньевича (далее — «Исполнитель») в соответствии со ст. 435 и ч. 2 ст. 437 Гражданского кодекса РФ.
1.2. Заказчик — совершеннолетний гражданин (родитель или законный представитель ребенка), осуществляющий акцепт настоящей оферты.
1.3. Воспитанник — несовершеннолетний ребенок Заказчика, непосредственно посещающий тренировочные занятия.
1.4. Абонемент — право Воспитанника на посещение фиксированного количества тренировочных занятий в течение установленного срока.

2. ПРЕДМЕТ ДОГОВОРА
2.1. Исполнитель обязуется оказывать услуги по организации и проведению спортивно-оздоровительных занятий по футболу для Воспитанника в соответствии с расписанием и методической программой, а Заказчик обязуется оплачивать данные услуги.

3. ПОРЯДОК АКЦЕПТА ОФЕРТЫ
3.1. Полным и безоговорочным акцептом настоящей публичной оферты (ст. 438 ГК РФ) является совершение Заказчиком любого из следующих действий:
- Оплата услуг (приобретение абонемента или разового занятия);
- Регистрация в личном кабинете мобильного/веб-приложения;
- Фактическое начало посещения занятий Воспитанником.

4. ПРАВА И ОБЯЗАННОСТИ СТОРОН
Исполнитель обязуется обеспечить квалифицированный тренерский состав, безопасные условия проведения занятий, ведение учета посещаемости в личном кабинете.
Заказчик обязуется своевременно оплачивать услуги, предоставлять медицинские справки об отсутствии противопоказаний, соблюдать дисциплину и правила спортивного комплекса.

5. СТОИМОСТЬ УСЛУГ И ПОРЯДОК РАСЧЕТОВ
5.1. Стоимость услуг определяется действующим прейскурантом (абонементы на 12, 8, 4 занятий, разовые занятия).
5.2. Оплата производится авансовым платежом в личном кабинете или по безналичному расчету.

6. ПРАВИЛА ПОСЕЩЕНИЯ И ПЕРЕНОСОВ
6.1. При пропуске занятий по уважительной причине (болезнь при наличии медицинской справки) пропущенные занятия могут быть отработаны с другими группами или компенсированы в порядке, установленном регламентом школы.

7. МЕДИЦИНСКИЙ ДОПУСК
7.1. Допуск к тренировкам осуществляется при наличии действующей медицинской справки (форма 086/у или справка от педиатра об отсутствии противопоказаний к футболу) и спортивной страховки.

8. РЕКВИЗИТЫ ИСПОЛНИТЕЛЯ
ИП Тюкалов Евгений Евгеньевич
г. Пермь
Сайт: https://amkarjunior.ru
`;

    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Dogovor_Oferta_Amkar_Junior.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = () => {
    const offerUrl = `${window.location.origin}/offer`;
    navigator.clipboard.writeText(offerUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      className={`bg-slate-50 font-sans text-slate-800 selection:bg-red-500 selection:text-white ${
        isModal ? "p-0" : "min-h-screen"
      }`}
    >
      {/* Top Header */}
      {!isModal && (
        <header className="bg-red-600 text-white sticky top-0 z-40 shadow-md print:hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <AmkarLogo width="32" height="32" className="text-white" />
              <div>
                <span className="font-extrabold uppercase tracking-wider text-sm sm:text-base block leading-tight">
                  Амкар Юниор
                </span>
                <span className="text-[10px] text-red-100 font-medium hidden sm:block">
                  Детская футбольная школа
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="flex items-center space-x-1.5 bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Распечатать договор"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Печать</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center space-x-1.5 bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Скачать текст договора"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Скачать</span>
              </button>

              {(onBack || window.history.length > 1) && (
                <button
                  onClick={() => {
                    if (onBack) onBack();
                    else window.history.back();
                  }}
                  className="flex items-center space-x-1.5 bg-white text-red-600 hover:bg-red-50 px-3.5 py-1.5 rounded-xl transition text-xs font-extrabold cursor-pointer ml-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Назад</span>
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Document Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative print:shadow-none print:border-none">
          {/* Header Banner inside document */}
          <div className="p-6 sm:p-10 border-b border-gray-100 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Официальный документ • Публичная оферта
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                  Договор публичной оферты
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
                  на оказание физкультурно-оздоровительных (спортивных) услуг по
                  обучению футболу
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-right sm:text-right space-y-1 shrink-0 self-start sm:self-auto">
                <div className="text-[11px] text-slate-300 font-semibold">
                  Исполнитель:
                </div>
                <div className="text-xs font-bold text-white">
                  ИП Тюкалов Е.Е.
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  г. Пермь • Редакция от 11.09.2025 г.
                </div>
              </div>
            </div>

            {/* Quick action bar for modal/desktop */}
            <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Акцепт оферты подтверждает заключение договора в соответствии со
                  ст. 438 ГК РФ
                </span>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  {copiedLink ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ссылка скопирована!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Скопировать ссылку</span>
                    </>
                  )}
                </button>
                {isModal && onBack && (
                  <button
                    onClick={onBack}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition cursor-pointer text-xs"
                  >
                    Закрыть
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Search and Table of Contents Bar */}
          <div className="p-4 sm:p-6 bg-slate-50 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
            {/* Search within document */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по договору (например: абонемент, справка, возврат)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-gray-400 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Jump Dropdown / Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                Разделы:
              </span>
              <div className="flex gap-1.5 flex-nowrap">
                {sections.slice(0, 5).map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-gray-200 rounded-lg text-[11px] font-bold text-slate-700 whitespace-nowrap transition cursor-pointer"
                  >
                    {sec.title.split(". ")[1]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 sm:p-10 md:p-12 space-y-8 leading-relaxed text-slate-700 text-xs sm:text-sm">
            {/* Section 1 */}
            <section id="sec-1" className="space-y-3 pt-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-xs font-black shrink-0">
                  1
                </span>
                1. Термины, определения и общие положения
              </h2>
              <div className="space-y-2.5 text-slate-700 pl-8">
                <p>
                  1.1. Настоящий документ представляет собой официальное
                  предложение (публичную оферту в соответствии с п. 2 ст. 437
                  Гражданского кодекса Российской Федерации) Индивидуального
                  предпринимателя <strong>Тюкалова Евгения Евгеньевича</strong>{" "}
                  (далее — <strong>«Исполнитель»</strong>) заключить договор на
                  оказание физкультурно-оздоровительных (спортивных) услуг по
                  обучению футболу на указанных ниже условиях.
                </p>
                <p>
                  1.2. <strong>Заказчик</strong> — совершеннолетнее дееспособное
                  физическое лицо (родитель, усыновитель, опекун или попечитель),
                  являющееся законным представителем несовершеннолетнего
                  Воспитанника, совершившее акцепт настоящей Оферты.
                </p>
                <p>
                  1.3. <strong>Воспитанник</strong> — несовершеннолетний ребенок,
                  в интересах которого Заказчик заключает Договор, и который
                  непосредственно получает физкультурно-оздоровительные услуги.
                </p>
                <p>
                  1.4. <strong>Школа</strong> — детская футбольная школа «Амкар
                  Юниор», организующая тренировочный и спортивный процесс.
                </p>
                <p>
                  1.5. <strong>Абонемент</strong> — приобретенное Заказчиком право
                  на посещение Воспитанником фиксированного количества
                  тренировочных занятий в определенной группе в течение
                  установленного срока действия.
                </p>
                <p>
                  1.6. <strong>Личный кабинет</strong> — персональный
                  информационный раздел Заказчика на веб-сайте{" "}
                  <a
                    href="https://amkarjunior.ru"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 font-bold hover:underline"
                  >
                    https://amkarjunior.ru
                  </a>
                  , содержащий данные о расписании, посещаемости, истории оплат,
                  балансе абонемента и статусе документов.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="sec-2" className="space-y-3 pt-4">
              <h2 className="text-base sm:text-lg font-black text-slate-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-xs font-black shrink-0">
                  2
                </span>
                2. Предмет Договора
              </h2>
              <div className="space-y-2.5 text-slate-700 pl-8">
                <p>
                  2.1. Исполнитель обязуется на возмездной основе оказывать
                  Воспитаннику физкультурно-оздоровительные услуги по обучению игре
                  в футбол в групповом или индивидуальном формате в соответствии с
                  расписанием, методическими программами Школы и возрастными
                  особенностями Воспитанника, а Заказчик обязуется оплачивать эти
                  услуги в порядке и сроки, установленные настоящей Офертой.
                </p>
                <p>
                  2.2. Занятия проводятся на специализированных спортивных
                  площадках и футбольных полях, согласованных Исполнителем.
                  Информация о расписании, тренере группы и месте проведения
                  доступна Заказчику в Личном кабинете и у дежурного
                  администратора.
                </p>
                <p>
                  2.3. Услуги не являются профессиональным спортивным или
                  образовательным учреждением, подлежащим лицензированию в сфере
                  общего образования, и носят спортивно-оздоровительный характер.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="sec-3" className="space-y-3 pt-4">
              <h2 className="text-base sm:text-lg font-black text-slate-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-xs font-black shrink-0">
                  3
                </span>
                3. Порядок акцепта Оферты и заключение Договора
              </h2>
              <div className="space-y-2.5 text-slate-700 pl-8">
                <p>
                  3.1. В соответствии со ст. 438 Гражданского кодекса РФ акцептом
                  настоящей Оферты признается совершение Заказчиком любого из
                  следующих конклюдентных действий:
                </p>
                <ul className="list-disc pl-5 space-y-1 font-medium">
                  <li>
                    Оплата стоимости разового занятия или абонемента на расчетный
                    счет Исполнителя, в кассу или через онлайн-оплату в Личном
                    кабинете;
                  </li>
                  <li>
                    Регистрация и подтверждение учетной записи в Личном кабинете
                    на Сайте;
                  </li>
                  <li>
                    Фактическое посещение Воспитанником первого и последующих
                    занятий Школы.
                  </li>
                </ul>
                <p>
                  3.2. Совершая акцепт Оферты, Заказчик подтверждает, что в полном
                  объеме ознакомлен с условиями Договора, правилами Школы,
                  тарифами, правилами техники безопасности и согласен с ними без
                  каких-либо изъятий и ограничений.
                </p>
                <p>
                  3.3. Договор считается заключенным в простой письменной форме с
                  момента совершения Заказчиком акцепта и имеет равную
                  юридическую силу с договором, подписанным на бумажном носителе.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="sec-4" className="space-y-3 pt-4">
              <h2 className="text-base sm:text-lg font-black text-slate-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-xs font-black shrink-0">
                  4
                </span>
                4. Права и обязанности Исполнителя
              </h2>
              <div className="space-y-2.5 text-slate-700 pl-8">
                <p>
                  <strong>4.1. Исполнитель обязуется:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    Организовать качественное и безопасное проведение тренировок с
                    привлечением квалифицированного тренерского состава;
                  </li>
                  <li>
                    Обеспечить наличие необходимого тренировочного инвентаря
                    (мячи, манишки, фишки, тренировочные барьеры);
                  </li>
                  <li>
                    Вести постоянный учет посещаемости, списания занятий и истории
                    платежей с отображением актуальной информации в Личном кабинете
                    Заказчика;
                  </li>
                  <li>
                    Своевременно информировать Заказчика об изменениях в
                    расписании, месте проведения или замене тренера через Личный
                    кабинет, SMS-уведомления или мессенджеры;
                  </li>
                  <li>
                    Обеспечивать бережное отношение и соблюдение правил пожарной
                    и санитарно-эпидемиологической безопасности.
                  </li>
                </ul>
                <p className="pt-2">
                  <strong>4.2. Исполнитель имеет право:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    Самостоятельно определять методику проведения занятий,
                    распределять Воспитанников по группам с учетом возраста и
                    спортивной подготовки;
                  </li>
                  <li>
                    Производить замену тренера в случае болезни, отпуска или
                    служебной необходимости без ухудшения качества тренировок;
                  </li>
                  <li>
                    Не допускать Воспитанника к тренировке при отсутствии
                    действующей медицинской справки, неоплаченном абонементе,
                    признаках острого респираторного заболевания или нарушении
                    экипировки (отсутствие щитков, ненадлежащая обувь);
                  </li>
                  <li>
                    Вносить изменения в расписание тренировок с заблаговременным
                    уведомлением Заказчиков.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section id="sec-5" className="space-y-3 pt-4">
              <h2 className="text-base sm:text-lg font-black text-slate-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-xs font-black shrink-0">
                  5
                </span>
                5. Права и обязанности Заказчика
              </h2>
              <div className="space-y-2.5 text-slate-700 pl-8">
                <p>
                  <strong>5.1. Заказчик обязуется:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    Своевременно оплачивать услуги Исполнителя в соответствии с
                    выбранным тарифом и условиями Оферты;
                  </li>
                  <li>
                    Предоставить до начала регулярных занятий медицинскую справку
                    (форма 086/у или заключение врача-педиатра) об отсутствии
                    противопоказаний к занятиям футболом;
                  </li>
                  <li>
                    Обеспечить наличие у Воспитанника надлежащей спортивной формы:
                    футбольная форма, щитки, обувь на подходящей подошве (сороконожки
                    / футзалки в зависимости от покрытия зала/поля);
                  </li>
                  <li>
                    Обеспечивать прибытие Воспитанника на тренировку не позднее чем
                    за 10-15 минут до начала занятия;
                  </li>
                  <li>
                    Незамедлительно сообщать тренеру или администрации Школы о
                    любых особенностях здоровья, аллергиях, перенесенных травмах
                    или плохом самочувствии ребенка;
                  </li>
                  <li>
                    Соблюдать правила поведения в спорткомплексе, бережно
                    относиться к имуществу и инвентарю, не вмешиваться в
                    тренировочный процесс во время занятий.
                  </li>
                </ul>
                <p className="pt-2">
                  <strong>5.2. Заказчик имеет право:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    Получать полную и достоверную информацию о тренировочном
                    процессе, спортивных успехах Воспитанника и квалификации
                    тренеров;
                  </li>
                  <li>
                    Иметь круглосуточный непрерывный доступ к Личному кабинету для
                    контроля баланса занятий, расписания и истории оплат;
                  </li>
                  <li>
                    Отрабатывать пропущенные по уважительной причине занятия в
                    соответствии с правилами Школы;
                  </li>
                  <li>
                    Обращаться к администрации Школы с предложениями и вопросами
                    по качеству оказываемых услуг.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section id="sec-6" className="space-y-3 pt-4">
              <h2 className="text-base sm:text-lg font-black text-slate-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-xs font-black shrink-0">
                  6
                </span>
                6. Стоимость услуг, абонементы и порядок расчетов
              </h2>
              <div className="space-y-2.5 text-slate-700 pl-8">
                <p>
                  6.1. Стоимость услуг утверждается Исполнителем и публикуется на
                  Сайте и в Личном кабинете Заказчика.
                </p>
                <p>
                  6.2. Оплата производится на условиях 100% предоплаты до начала
                  расчетного периода (до 1-го числа месяца или до даты окончания
                  текущего абонемента).
                </p>
                <p>
                  6.3. Виды абонементов:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Абонемент на 12 занятий</strong> — расчетный период 30
                    календарных дней (3 тренировки в неделю);
                  </li>
                  <li>
                    <strong>Абонемент на 8 занятий</strong> — расчетный период 30
                    календарных дней (2 тренировки в неделю);
                  </li>
                  <li>
                    <strong>Абонемент на 4 занятия</strong> — расчетный период 30
                    календарных дней (1 тренировка в неделю);
                  </li>
                  <li>
                    <strong>Разовое занятие</strong> — действует на одну конкретную
                    тренировку.
                  </li>
                </ul>
                <p>
                  6.4. Оплата осуществляется безналичным расчетом через
                  платежные шлюзы в Личном кабинете, банковским переводом по
                  реквизитам Исполнителя или в кассу Школы с формированием
                  фискального кассового чека.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="sec-7" className="space-y-3 pt-4">
              <h2 className="text-base sm:text-lg font-black text-slate-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-xs font-black shrink-0">
                  7
                </span>
                7. Правила посещения, пропуски и отработки занятий
              </h2>
              <div className="space-y-2.5 text-slate-700 pl-8">
                <p>
                  7.1. Списание занятия с баланса абонемента производится
                  автоматически при фиксации присутствия Воспитанника тренером в
                  электронном журнале.
                </p>
                <p>
                  7.2. В случае невозможности посещения тренировки по уважительной
                  причине (болезнь, травма) Заказчик обязан уведомить
                  администратора или тренера до начала занятия.
                </p>
                <p>
                  7.3. При предоставлении официальной медицинской справки о
                  болезни пропущенные занятия сохраняются и подлежат отработке в
                  параллельных группах своего или смежного возраста в течение 30
                  дней с момента выздоровления.
                </p>
                <p>
                  7.4. Пропуски без уважительной причины и без предварительного
                  уведомления считаются проведенными и сгорают, денежные средства
                  за них не возвращаются.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="sec-8" className="space-y-3 pt-4">
              <h2 className="text-base sm:text-lg font-black text-slate-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-xs font-black shrink-0">
                  8
                </span>
                8. Медицинские требования и техника безопасности
              </h2>
              <div className="space-y-2.5 text-slate-700 pl-8">
                <p>
                  8.1. Заказчик несет персональную ответственность за
                  достоверность сведений о состоянии здоровья Воспитанника.
                </p>
                <p>
                  8.2. Для участия в официальных турнирах, выездных сборах и
                  интенсивных спаррингах Заказчик обязуется оформить полис
                  добровольного спортивного страхования от несчастных случаев при
                  занятиях футболом.
                </p>
                <p>
                  8.3. Тренеры и персонал Школы обучены оказанию первой доврачебной
                  помощи и при необходимости незамедлительно вызывают скорую
                  медицинскую помощь и связываются с родителем по контактному
                  телефону.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section id="sec-9" className="space-y-3 pt-4">
              <h2 className="text-base sm:text-lg font-black text-slate-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-xs font-black shrink-0">
                  9
                </span>
                9. Ответственность Сторон и разрешение споров
              </h2>
              <div className="space-y-2.5 text-slate-700 pl-8">
                <p>
                  9.1. За неисполнение или ненадлежащее исполнение обязательств по
                  настоящему Договору Стороны несут ответственность в
                  соответствии с действующим законодательством Российской
                  Федерации.
                </p>
                <p>
                  9.2. Исполнитель не несет ответственности за сохранность
                  ценных вещей, денег и телефонов, оставленных в раздевалках без
                  присмотра.
                </p>
                <p>
                  9.3. Все споры и разногласия Стороны стремятся разрешить путем
                  переговоров и направления письменных претензий. Срок ответа на
                  претензию — 10 рабочих дней.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section id="sec-10" className="space-y-3 pt-4">
              <h2 className="text-base sm:text-lg font-black text-slate-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-xs font-black shrink-0">
                  10
                </span>
                10. Срок действия Оферты, изменение и расторжение
              </h2>
              <div className="space-y-2.5 text-slate-700 pl-8">
                <p>
                  10.1. Настоящая Оферта вступает в силу с момента ее публикации
                  на Сайте и действует бессрочно до момента ее отзыва
                  Исполнителем.
                </p>
                <p>
                  10.2. Исполнитель оставляет за собой право вносить изменения в
                  условия Оферты и прейскурант цен. Новая редакция вступает в силу
                  с даты ее опубликования на Сайте.
                </p>
                <p>
                  10.3. Заказчик вправе в любое время отказаться от исполнения
                  Договора при условии оплаты Исполнителю фактически понесенных им
                  расходов и фактически проведенных занятий в соответствии со ст.
                  32 Закона РФ «О защите прав потребителей».
                </p>
              </div>
            </section>

            {/* Section 11 - Bank details */}
            <section id="sec-11" className="space-y-3 pt-4">
              <h2 className="text-base sm:text-lg font-black text-slate-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-xs font-black shrink-0">
                  11
                </span>
                11. Реквизиты и контактная информация Исполнителя
              </h2>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 pl-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block">
                      Юридическое лицо
                    </span>
                    <strong className="text-slate-900 text-sm">
                      ИП Тюкалов Евгений Евгеньевич
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block">
                      Официальный сайт
                    </span>
                    <a
                      href="https://amkarjunior.ru"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 font-bold hover:underline flex items-center gap-1"
                    >
                      https://amkarjunior.ru
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block">
                      Местонахождение
                    </span>
                    <span className="text-slate-800 font-medium">
                      Российская Федерация, г. Пермь
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block">
                      Контактные телефоны
                    </span>
                    <a
                      href="tel:+79028358000"
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      +7 (902) 835-80-00
                    </a>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 text-[11px] text-gray-500">
                  По всем вопросам исполнения договора, расписания и расчетов вы
                  можете обратиться к администраторам через Личный кабинет или по
                  указанным контактам.
                </div>
              </div>
            </section>
          </div>

          {/* Footer inside document card */}
          <div className="p-6 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div>
              © 2025–2026 Детская футбольная школа «Амкар Юниор». Все права
              защищены.
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/privacy"
                className="text-slate-600 hover:text-red-600 font-semibold underline"
              >
                Политика конфиденциальности
              </a>
              <a
                href="/safety"
                className="text-slate-600 hover:text-red-600 font-semibold underline"
              >
                Согласие на обработку данных
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
