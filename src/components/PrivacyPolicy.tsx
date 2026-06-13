import React from "react";
import { ArrowLeft } from "lucide-react";

export const PrivacyPolicy: React.FC<{ onBack?: () => void }> = ({
  onBack,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6 md:p-12 selection:bg-red-500 selection:text-white">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-6 left-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors flex items-center justify-center"
            title="Назад"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="p-8 md:p-14">
          <div className="text-center mb-10">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
              Политика конфиденциальности
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-2">
              ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ТЮКАЛОВ ЕВГЕНИЙ ЕВГЕНЬЕВИЧ
            </p>
            <p className="text-xs text-gray-400 mt-1">г. Пермь, 11.09.2025</p>
          </div>

          <div className="prose prose-sm md:prose-base prose-slate max-w-none space-y-6">
            <p>
              В Политике конфиденциальности (далее — Политика) указан перечень
              персональных данных (далее — Данные), которые могут быть запрошены
              у пользователей (далее — Пользователь) на сайте{" "}
              <a
                href="https://amkarjunior.ru"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:underline font-medium"
              >
                https://amkarjunior.ru
              </a>{" "}
              (далее — Сайт), а также способы обработки таких данных.
            </p>
            <p>
              Политика применяется также к информации, которую ИП Тюкалов Е.Е.
              (далее — Оператор) получил в результате эксплуатации Пользователем
              Сайта.
            </p>

            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mt-8 mb-4">
                1. Предмет Политики
              </h2>
              <div className="space-y-3 text-slate-700">
                <p>
                  1.1. Пользователь выражает и подтверждает свое согласие с
                  Политикой, независимо от прохождения регистрации, заполнении
                  форм и приобретения услуг Оператора, при получении доступа или
                  использовании каких-либо функций Сайта. Иначе Пользователь
                  обязан прекратить использование Сайта.
                </p>
                <p>
                  1.2. Подлежащие обработке персональные данные Пользователя:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>фамилия, имя, отчество;</li>
                  <li>контактный телефон;</li>
                  <li>электронная почта;</li>
                  <li>адрес.</li>
                </ul>
                <p>
                  1.3. Подлежащие обработке технические данные Пользователя:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>IP-адрес;</li>
                  <li>данные браузера;</li>
                  <li>время посещения Сайта;</li>
                  <li>
                    адрес страницы, на которой располагается рекламный блок;
                  </li>
                  <li>адрес предыдущей страницы.</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mt-8 mb-4">
                2. Цели обработки Данных
              </h2>
              <div className="space-y-3 text-slate-700">
                <p>
                  2.1. Оператор использует данные Пользователя для следующих
                  целей:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>идентификация Пользователя для оформления заказа;</li>
                  <li>создание личного кабинета;</li>
                  <li>уведомления о статусе оплаты;</li>
                  <li>обработка и получение платежей;</li>
                  <li>
                    обратная связь с Пользователем, рассылки
                    рекламно-информационных материалов;
                  </li>
                  <li>
                    проведение маркетинговых, статистических и других
                    исследований.
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mt-8 mb-4">
                3. Способы и сроки обработки Данных
              </h2>
              <div className="space-y-3 text-slate-700">
                <p>
                  3.1. Политика вступает в силу с момента, когда Пользователь в
                  первый раз заходит на Сайт, и действует бессрочно.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mt-8 mb-4">
                4. Защита Данных
              </h2>
              <div className="space-y-3 text-slate-700">
                <p>
                  4.1. Оператор хранит и оберегает Данные от
                  несанкционированного доступа и распространения в соответствии
                  с внутренними правилами и регламентами, а также действующим
                  законодательством.
                </p>
                <p>
                  4.2. Оператор сохраняет конфиденциальность в отношении Данных
                  Пользователя за исключением случаев, когда Пользователь делает
                  их общедоступными.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mt-8 mb-4">
                5. Права и обязанности
              </h2>
              <div className="space-y-3 text-slate-700">
                <p>
                  5.1. Оператор охраняет конфиденциальность Данных Пользователя.
                  Если Данные будут утрачены или разглашены, Оператор обязан
                  уведомить об этом Пользователя.
                </p>
                <p>
                  5.2. Оператор обязан принять все меры, чтобы предотвратить
                  убытки и другие негативные последствия утраты и разглашения
                  Данных.
                </p>
                <p>
                  5.3. Оператор не вправе продавать, обменивать, публиковать или
                  разглашать другими способами Данные Пользователя.
                </p>
                <p>
                  5.4. Оператор вправе изменять Политику. Пользователь обязан
                  самостоятельно отслеживать изменения.
                </p>
                <p>
                  5.5. Пользователь вправе сделать запрос на блокировку Данных.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mt-8 mb-4">
                6. Разрешение споров
              </h2>
              <div className="space-y-3 text-slate-700">
                <p>
                  6.1. Споры и разногласия Пользователя и Оператора по вопросам,
                  связанным с Политикой, разрешаются на переговорах.
                </p>
                <p>
                  6.2. Если на переговорах Пользователь и Оператор не смогут
                  достичь согласия, спор передается в суд.
                </p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100 bg-slate-50 p-6 rounded-2xl">
              <h3 className="font-bold text-slate-900 uppercase tracking-wide mb-2">
                Реквизиты оператора
              </h3>
              <p className="text-sm font-medium text-slate-700">
                ИП Тюкалов Евгений Евгеньевич
              </p>
              <p className="text-sm font-mono text-slate-600 mt-1">
                ИНН: 590849300220
              </p>
              <p className="text-sm font-mono text-slate-600">
                ОГРН: 324595800068075
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
