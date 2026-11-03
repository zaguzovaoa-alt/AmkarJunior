import { VideoLesson, VideoLessonCategory } from "../types";

export const VIDEO_LESSON_CATEGORIES: VideoLessonCategory[] = [
  "Техника и дриблинг",
  "Домашние тренировки",
  "ОФП и координация",
  "Удар и передача",
  "Тактика и мышление",
  "Разминка и здоровье",
];

export const VIDEO_LESSON_AGE_GROUPS = [
  "Все возрасты (4–14 лет)",
  "Младшие группы (4–6 лет)",
  "Средние группы (7–9 лет)",
  "Старшие группы (10–14 лет)",
];

export const VIDEO_LESSON_COVER_PRESETS = [
  {
    label: "Дриблинг и работа с мячом",
    url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Футбольное поле и тренировка",
    url: "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Удар по воротам и точность",
    url: "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Командная тактика и манеж",
    url: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "ОФП, баланс и координация",
    url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80",
  },
];

export const INITIAL_VIDEO_LESSONS: VideoLesson[] = [
  {
    id: "vl_amkar_1",
    title: "Базовый контроль мяча подошвой: «Топ-тап» и «Маятник»",
    description:
      "Фундаментальный видеоурок для отработки мягкого чувства мяча в домашних условиях и на разминке в манеже. Разбираем правильную постановку опорной ноги, работу голеностопа и переключение взгляда с мяча на партнеров по команде.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-soccer-player-juggling-the-ball-43478-large.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=80",
    category: "Техника и дриблинг",
    duration: "04:15",
    ageGroup: "Все возрасты (4–14 лет)",
    coachTips:
      "Следите, чтобы ребенок касался мяча передней частью подошвы (подушечкой стопы), а колени оставались слегка согнутыми. Достаточно 3 подходов по 45 секунд в день!",
    authorName: "Директор • Методический штаб «Амкар Юниор»",
    authorRole: "director",
    createdAt: "2026-05-10T10:00:00.000Z",
    isPinned: true,
    viewsCount: 142,
  },
  {
    id: "vl_amkar_2",
    title: "Домашний комплекс на 10 минут: 5 упражнений в комнате с мячом",
    description:
      "Компактный комплекс упражнений на квадратном метре пола. Идеально подходит для самостоятельных занятий дома между командными тренировками: перекаты подошвой, уход в сторону внутренней и внешней стороной стопы, остановка мяча под подошву.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-footballer-controlling-the-ball-on-the-field-43479-large.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=900&q=80",
    category: "Домашние тренировки",
    duration: "06:30",
    ageGroup: "Младшие группы (4–6 лет)",
    coachTips:
      "Для домашних тренировок лучше заниматься в чистых кроссовках с плоской подошвой или плотных спортивных носках на коврике. Хвалите ребенка за чистоту касаний, а не за спешку.",
    authorName: "Администратор • Академия «Амкар Юниор»",
    authorRole: "admin",
    createdAt: "2026-05-12T14:20:00.000Z",
    isPinned: true,
    viewsCount: 118,
  },
  {
    id: "vl_amkar_3",
    title: "Техника точной передачи «щечкой» и прием мяча первым касанием",
    description:
      "Пошаговый разбор самого важного элемента в командном футболе: как разворачивать стопу при пасе внутренней стороной («щечкой») и как мягко гасить скорость мяча при приеме в движении, чтобы сразу подготовить следующее действие.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-soccer-player-training-on-grass-field-43485-large.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=900&q=80",
    category: "Удар и передача",
    duration: "05:40",
    ageGroup: "Средние группы (7–9 лет)",
    coachTips:
      "Обратите внимание на носок опорной ноги: он всегда должен смотреть ровно туда, куда игрок отдает передачу.",
    authorName: "Директор • Методический штаб «Амкар Юниор»",
    authorRole: "director",
    createdAt: "2026-05-14T09:15:00.000Z",
    isPinned: false,
    viewsCount: 96,
  },
  {
    id: "vl_amkar_4",
    title: "Координационная лесенка и стартовая скорость юного футболиста",
    description:
      "Упражнения на частоту работы ног, баланс корпуса и взрывной старт с первых трех шагов. Если дома нет координационной лесенки, разметку легко выложить из обычной малярной ленты или шарфов на полу.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-athlete-doing-footwork-drills-on-an-agility-ladder-40275-large.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80",
    category: "ОФП и координация",
    duration: "05:10",
    ageGroup: "Все возрасты (4–14 лет)",
    coachTips:
      "Руки должны работать синхронно с ногами, согнутые в локтях под углом 90 градусов — это добавляет до 15% к скорости рывка.",
    authorName: "Администратор • Академия «Амкар Юниор»",
    authorRole: "admin",
    createdAt: "2026-05-15T16:45:00.000Z",
    isPinned: false,
    viewsCount: 84,
  },
  {
    id: "vl_amkar_5",
    title: "Финт Зидана (Марсельская рулетка) и смена направления 1-в-1",
    description:
      "Разбираем по фазам один из самых эффектных и надежных финтов для обыгрыша соперника в движении: укрывание мяча корпусом, перекат дальней ногой с разворотом на 180 градусов и ускорение в свободную зону.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-soccer-player-dribbling-the-ball-on-a-field-43482-large.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=900&q=80",
    category: "Техника и дриблинг",
    duration: "04:50",
    ageGroup: "Старшие группы (10–14 лет)",
    coachTips:
      "Начните изучение финта в медленном темпе (по шагам на счет «раз-два-три»), обязательно чередуя вращение через правое и левое плечо.",
    authorName: "Директор • Методический штаб «Амкар Юниор»",
    authorRole: "director",
    createdAt: "2026-05-17T11:30:00.000Z",
    isPinned: false,
    viewsCount: 109,
  },
  {
    id: "vl_amkar_6",
    title: "Суставная разминка и мягкая растяжка после тренировки",
    description:
      "Правильная 5-минутная заминка и профилактика микротравм для растущего организма: мягкое вытяжение икроножных мышц, передней и задней поверхности бедра, укрепление голеностопного сустава и упражнения на осанку.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-stretching-his-legs-before-exercising-40271-large.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80",
    category: "Разминка и здоровье",
    duration: "05:25",
    ageGroup: "Все возрасты (4–14 лет)",
    coachTips:
      "Все упражнения на растяжку выполняются плавно, на спокойном выдохе, без пружинящих рывков и болевых ощущений.",
    authorName: "Администратор • Академия «Амкар Юниор»",
    authorRole: "admin",
    createdAt: "2026-05-18T18:00:00.000Z",
    isPinned: false,
    viewsCount: 77,
  },
];
