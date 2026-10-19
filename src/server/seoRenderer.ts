import { BLOG_ARTICLES, BlogArticle, getArticleBySlug } from "../data/blogArticles";

export interface SEORenderOptions {
  origin: string;
  urlPath: string;
  rawHtml: string;
}

/**
 * Escapes characters for HTML attributes
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Generates pre-rendered semantic HTML for an article.
 * This is served inside <div id="root"> so search crawlers (Yandex, Google, Bing)
 * and AI scrapers (SearchGPT, Perplexity, Claude) immediately see the complete text.
 * React hydrates smoothly over this on the client.
 */
function generateSemanticArticleHtml(article: BlogArticle, origin: string): string {
  const sectionsHtml = article.sections
    .map((s, idx) => {
      const paragraphs = s.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
      const bullets =
        s.bulletPoints && s.bulletPoints.length > 0
          ? `<ul>${s.bulletPoints.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
          : "";
      const exercise = s.exercise
        ? `<div class="exercise-box">
             <h4>${escapeHtml(s.exercise.title)} (Возраст: ${escapeHtml(s.exercise.age)}, ${escapeHtml(s.exercise.duration)})</h4>
             <p><strong>Цель:</strong> ${escapeHtml(s.exercise.target)}</p>
             <p><strong>Инвентарь:</strong> ${escapeHtml(s.exercise.equipment)}</p>
             <ol>${s.exercise.steps.map((st) => `<li>${escapeHtml(st)}</li>`).join("")}</ol>
             <p><em>Совет тренера:</em> ${escapeHtml(s.exercise.coachTips)}</p>
           </div>`
        : "";
      const callout = s.callout
        ? `<aside class="callout callout-${s.callout.type}"><strong>${escapeHtml(s.callout.title)}</strong><p>${escapeHtml(s.callout.text)}</p></aside>`
        : "";
      const img = s.image
        ? `<figure><img src="${escapeHtml(s.image.url)}" alt="${escapeHtml(s.image.alt || s.image.caption || s.title)}" loading="lazy" /><figcaption>${escapeHtml(s.image.caption || "")}</figcaption></figure>`
        : "";
      return `<section>
        <h2>${idx + 1}. ${escapeHtml(s.title)}</h2>
        ${paragraphs}
        ${img}
        ${bullets}
        ${callout}
        ${exercise}
      </section>`;
    })
    .join("\n");

  const faqsHtml =
    article.faqs && article.faqs.length > 0
      ? `<section class="article-faqs">
           <h2>Часто задаваемые вопросы</h2>
           ${article.faqs
             .map(
               (faq) => `
             <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
               <h3 itemprop="name">${escapeHtml(faq.question)}</h3>
               <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                 <p itemprop="text">${escapeHtml(faq.answer)}</p>
               </div>
             </div>`
             )
             .join("\n")}
         </section>`
      : "";

  return `
    <article class="amkar-pre-rendered-article" itemscope itemtype="https://schema.org/Article" style="max-width: 900px; margin: 0 auto; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <nav aria-label="Хлебные крошки" style="font-size: 13px; margin-bottom: 16px; color: #64748b;">
        <a href="/" style="color: #dc2626; text-decoration: none;">Главная</a> &rarr; 
        <a href="/blog" style="color: #dc2626; text-decoration: none;">Блог</a> &rarr; 
        <span>${escapeHtml(article.title)}</span>
      </nav>

      <header style="margin-bottom: 24px;">
        <span style="display: inline-block; background: #dc2626; color: #fff; font-size: 11px; font-weight: bold; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.05em;">
          ${escapeHtml(article.category)}
        </span>
        <h1 itemprop="headline" style="font-size: 32px; font-weight: 900; line-height: 1.25; margin: 16px 0 12px; color: #0f172a;">
          ${escapeHtml(article.title)}
        </h1>
        <p itemprop="description" style="font-size: 18px; line-height: 1.6; color: #475569; margin-bottom: 16px;">
          ${escapeHtml(article.leadExcerpt)}
        </p>
        <div style="font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 10px 0;">
          <span itemprop="author" itemscope itemtype="https://schema.org/Person">
            Автор: <strong itemprop="name" style="color: #0f172a;">${escapeHtml(article.author)}</strong> (${escapeHtml(article.authorRole)})
          </span>
          &bull;
          <time itemprop="datePublished" datetime="${article.publishedAt}T08:00:00+05:00">Опубликовано: ${article.publishedAt}</time>
          &bull;
          <time itemprop="dateModified" datetime="${article.updatedAt}T08:00:00+05:00">Обновлено: ${article.updatedAt}</time>
          &bull;
          <span>Время чтения: ~${article.readTimeMinutes} мин.</span>
        </div>
      </header>

      <figure style="margin: 0 0 32px 0;">
        <img itemprop="image" src="${escapeHtml(article.coverImage)}" alt="${escapeHtml(article.title)}" style="width: 100%; max-height: 500px; object-fit: cover; border-radius: 16px;" />
      </figure>

      <div itemprop="articleBody" style="font-size: 16px; line-height: 1.75; color: #334155;">
        ${sectionsHtml}
        ${faqsHtml}
      </div>

      <footer style="margin-top: 40px; padding: 24px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0; color: #0f172a;">Футбольная школа «Амкар Юниор» в Перми</h3>
        <p style="color: #475569; font-size: 14px;">
          Набор детей от 4 до 12 лет. Профессиональные тренеры с лицензиями РФС/UEFA, современные теплые крытые манежи во всех районах Перми. Запишите ребенка на первое бесплатное занятие!
        </p>
        <p style="margin-bottom: 0;">
          <strong>Телефон:</strong> <a href="tel:+79991259055" style="color: #dc2626; font-weight: bold; text-decoration: none;">+7 (999) 125-90-55</a>
        </p>
      </footer>
    </article>
  `;
}

/**
 * Generates pre-rendered HTML for the /blog catalog index
 */
function generateSemanticBlogCatalogHtml(origin: string): string {
  const articlesList = BLOG_ARTICLES.map(
    (a, idx) => `
    <li style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0;">
      <article>
        <span style="font-size: 11px; font-weight: bold; color: #dc2626; text-transform: uppercase;">${escapeHtml(a.category)}</span>
        <h2 style="font-size: 20px; margin: 6px 0 8px;">
          <a href="/blog/${a.slug}" style="color: #0f172a; text-decoration: none;">${escapeHtml(a.title)}</a>
        </h2>
        <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 8px;">${escapeHtml(a.leadExcerpt)}</p>
        <div style="font-size: 12px; color: #94a3b8;">
          <span>${escapeHtml(a.author)}</span> &bull; <span>${a.publishedAt}</span> &bull; <span>~${a.readTimeMinutes} мин. чтения</span>
        </div>
      </article>
    </li>
  `
  ).join("\n");

  return `
    <main style="max-width: 900px; margin: 0 auto; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <nav style="font-size: 13px; margin-bottom: 16px; color: #64748b;">
        <a href="/" style="color: #dc2626; text-decoration: none;">Главная</a> &rarr; <span>Блог и база знаний</span>
      </nav>
      <header style="margin-bottom: 32px;">
        <h1 style="font-size: 36px; font-weight: 900; color: #0f172a; margin-bottom: 12px;">
          Блог о детском футболе «Амкар Юниор» Пермь
        </h1>
        <p style="font-size: 16px; color: #475569; line-height: 1.6;">
          Полезные статьи, рекомендации детских тренеров РФС, упражнения по футболу для дома и поля, обзоры манежей в Перми и советы родителям будущих чемпионов.
        </p>
      </header>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${articlesList}
      </ul>
    </main>
  `;
}

/**
 * Injects dynamic SEO meta tags, OpenGraph, Twitter, canonical, and Schema.org JSON-LD into index.html
 */
export function injectSeoIntoHtml(opts: SEORenderOptions): string {
  const { origin, urlPath, rawHtml } = opts;

  // 1. Check if specific article is requested: /blog/:slug
  const articleMatch = urlPath.match(/^\/blog\/([^/?#]+)/);
  const slug = articleMatch ? articleMatch[1] : null;
  const article = slug ? getArticleBySlug(slug) : null;

  if (article) {
    const fullArticleUrl = `${origin}/blog/${article.slug}`;
    const fullCoverImageUrl = article.coverImage.startsWith("http")
      ? article.coverImage
      : `${origin}${article.coverImage}`;

    const pageTitle = `${article.metaTitle} | Амкар Юниор Пермь`;
    const pageDesc = article.metaDescription;
    const pageKeywords = article.keywords.join(", ");

    // Schema.org structured data
    const schemaOrg = [
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": article.title,
        "description": article.metaDescription,
        "image": [fullCoverImageUrl],
        "datePublished": `${article.publishedAt}T08:00:00+05:00`,
        "dateModified": `${article.updatedAt}T08:00:00+05:00`,
        "inLanguage": "ru-RU",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": fullArticleUrl,
        },
        "author": {
          "@type": "Person",
          "name": article.author,
          "jobTitle": article.authorRole,
        },
        "publisher": {
          "@type": "SportsClub",
          "name": "АМКАР ЮНИОР Пермь",
          "telephone": "+7-999-125-90-55",
          "logo": {
            "@type": "ImageObject",
            "url": `${origin}/logo.png`,
          },
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Пермь",
            "addressRegion": "Пермский край",
            "addressCountry": "RU",
          },
        },
        "keywords": pageKeywords,
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Главная",
            "item": origin,
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Блог",
            "item": `${origin}/blog`,
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": article.title,
            "item": fullArticleUrl,
          },
        ],
      },
    ];

    if (article.faqs && article.faqs.length > 0) {
      schemaOrg.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": article.faqs.map((f) => ({
          "@type": "Question",
          "name": f.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.answer,
          },
        })),
      } as any);
    }

    const dynamicHeadTags = `
    <!-- Dynamic Article SEO -->
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(pageDesc)}" />
    <meta name="keywords" content="${escapeHtml(pageKeywords)}" />
    <meta name="author" content="${escapeHtml(article.author)}" />
    <link rel="canonical" href="${escapeHtml(fullArticleUrl)}" />

    <!-- Open Graph / Social Sharing (Telegram, VK, WhatsApp) -->
    <meta property="og:site_name" content="Амкар Юниор Пермь" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(pageTitle)}" />
    <meta property="og:description" content="${escapeHtml(pageDesc)}" />
    <meta property="og:url" content="${escapeHtml(fullArticleUrl)}" />
    <meta property="og:image" content="${escapeHtml(fullCoverImageUrl)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="ru_RU" />
    <meta property="article:published_time" content="${article.publishedAt}T08:00:00+05:00" />
    <meta property="article:modified_time" content="${article.updatedAt}T08:00:00+05:00" />
    <meta property="article:author" content="${escapeHtml(article.author)}" />
    <meta property="article:section" content="${escapeHtml(article.category)}" />

    <!-- Twitter / X Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(pageDesc)}" />
    <meta name="twitter:image" content="${escapeHtml(fullCoverImageUrl)}" />

    <!-- Schema.org JSON-LD -->
    <script type="application/ld+json" id="article-jsonld">
    ${JSON.stringify(schemaOrg, null, 2)}
    </script>
    `;

    // Replace <title> and default meta tags, then inject pre-rendered semantic HTML
    let html = rawHtml;
    html = html.replace(/<title>.*?<\/title>/i, "");
    html = html.replace(/<meta\s+name="description"[^>]*>/i, "");
    html = html.replace(/<meta\s+name="keywords"[^>]*>/i, "");
    html = html.replace(/<meta\s+property="og:title"[^>]*>/i, "");
    html = html.replace(/<meta\s+property="og:description"[^>]*>/i, "");
    html = html.replace(/<meta\s+property="og:image"[^>]*>/i, "");
    html = html.replace(/<meta\s+property="og:url"[^>]*>/i, "");
    html = html.replace(/<meta\s+property="og:type"[^>]*>/i, "");

    // Inject head tags before </head>
    html = html.replace("</head>", `${dynamicHeadTags}\n</head>`);

    // Inject semantic crawler markup inside <div id="root">
    const semanticContent = generateSemanticArticleHtml(article, origin);
    html = html.replace('<div id="root"></div>', `<div id="root">${semanticContent}</div>`);

    return html;
  }

  // 2. Check if blog catalog index is requested: /blog
  if (urlPath === "/blog" || urlPath === "/blog/") {
    const catalogTitle = "Блог и статьи о детском футболе в Перми | «Амкар Юниор»";
    const catalogDesc = "База знаний и статьи для родителей юных футболистов в Перми. Развитие скорости, дриблинга, питание, выбор манежей и подготовка к первым турнирам от тренеров «Амкар Юниор».";
    const catalogUrl = `${origin}/blog`;
    const catalogImage = `${origin}/kids_football.png`;

    const breadcrumbsJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Главная",
          "item": origin,
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Блог и статьи",
          "item": catalogUrl,
        },
      ],
    };

    const dynamicHeadTags = `
    <!-- Dynamic Blog Catalog SEO -->
    <title>${escapeHtml(catalogTitle)}</title>
    <meta name="description" content="${escapeHtml(catalogDesc)}" />
    <link rel="canonical" href="${escapeHtml(catalogUrl)}" />

    <meta property="og:site_name" content="Амкар Юниор Пермь" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(catalogTitle)}" />
    <meta property="og:description" content="${escapeHtml(catalogDesc)}" />
    <meta property="og:url" content="${escapeHtml(catalogUrl)}" />
    <meta property="og:image" content="${escapeHtml(catalogImage)}" />
    <meta property="og:locale" content="ru_RU" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(catalogTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(catalogDesc)}" />
    <meta name="twitter:image" content="${escapeHtml(catalogImage)}" />

    <script type="application/ld+json">
    ${JSON.stringify(breadcrumbsJsonLd, null, 2)}
    </script>
    `;

    let html = rawHtml;
    html = html.replace(/<title>.*?<\/title>/i, "");
    html = html.replace(/<meta\s+name="description"[^>]*>/i, "");
    html = html.replace("</head>", `${dynamicHeadTags}\n</head>`);
    html = html.replace('<div id="root"></div>', `<div id="root">${generateSemanticBlogCatalogHtml(origin)}</div>`);
    return html;
  }

  // Default homepage
  return rawHtml;
}

/**
 * Generates an advanced XML Sitemap including images extension for Yandex & Google Images
 */
export function generateSitemapXml(origin: string): string {
  const today = new Date().toISOString().split("T")[0];

  const articlesXml = BLOG_ARTICLES.map((a) => {
    const loc = `${origin}/blog/${a.slug}`;
    const imgLoc = a.coverImage.startsWith("http") ? a.coverImage : `${origin}${a.coverImage}`;

    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${a.updatedAt || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
    <image:image>
      <image:loc>${imgLoc}</image:loc>
      <image:title>${escapeHtml(a.title)}</image:title>
      <image:caption>${escapeHtml(a.leadExcerpt)}</image:caption>
    </image:image>
  </url>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Главная страница -->
  <url>
    <loc>${origin}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${origin}/kids_football.png</image:loc>
      <image:title>Детская футбольная школа «Амкар Юниор» в Перми</image:title>
      <image:caption>Профессиональные тренировки по футболу для детей от 4 до 12 лет в Перми</image:caption>
    </image:image>
  </url>

  <!-- Каталог Блога -->
  <url>
    <loc>${origin}/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

${articlesXml}
</urlset>`;
}

/**
 * Generates RSS 2.0 Feed for Yandex.Webmaster & Google News / RSS aggregators
 */
export function generateRssFeed(origin: string): string {
  const nowRfc822 = new Date().toUTCString();

  const items = BLOG_ARTICLES.map((a) => {
    const link = `${origin}/blog/${a.slug}`;
    const imgUrl = a.coverImage.startsWith("http") ? a.coverImage : `${origin}${a.coverImage}`;
    const pubDate = new Date(`${a.publishedAt}T08:00:00+05:00`).toUTCString();

    return `    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${a.leadExcerpt}]]></description>
      <category><![CDATA[${a.category}]]></category>
      <pubDate>${pubDate}</pubDate>
      <author>info@amkar-junior.ru (${a.author})</author>
      <enclosure url="${imgUrl}" type="image/jpeg" length="500000" />
    </item>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Блог детской футбольной школы «Амкар Юниор» Пермь</title>
    <link>${origin}/blog</link>
    <description>Экспертные статьи о детском футболе, тренировках мальчиков от 4 до 12 лет, манежах и спорте в Перми.</description>
    <language>ru-RU</language>
    <lastBuildDate>${nowRfc822}</lastBuildDate>
    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}

/**
 * Generates llms.txt standard (https://llmstxt.org) for LLMs & AI crawlers
 * (SearchGPT, Perplexity, Claude, Gemini, Copilot, DeepSeek).
 */
export function generateLlmsTxt(origin: string): string {
  const articlesList = BLOG_ARTICLES.map(
    (a, idx) => `- [${a.title}](${origin}/blog/${a.slug}): ${a.category}. ${a.leadExcerpt} (Ключевые темы: ${a.keywords.slice(0, 4).join(", ")})`
  ).join("\n");

  return `# Футбольная школа «Амкар Юниор» Пермь (Amkar Junior Perm)

> Официальная детская футбольная школа клуба «Амкар» в Перми. Профессиональная подготовка мальчиков и девочек от 4 до 12 лет в современных крытых манежах по всей Перми.

## Основная информация
- **Город:** Пермь, Пермский край, Россия
- **Возрастные группы:** 4-5 лет (начальный уровень), 6-7 лет (базовый футбол), 8-9 лет (соревновательный этап), 10-12 лет (углубленная подготовка)
- **Филиалы и манежи в Перми:**
  - СК им. В.П. Сухарева (ш. Космонавтов, 158а) — полноразмерный крытый манеж
  - Крытый футбольный манеж «Пермь Великая» (ул. Куйбышева, 140)
  - Спортивный комплекс «Спартак» (ул. Рабочая, 9)
  - Манеж «Пролетарский» (ул. Докучаева)
- **Тренерский состав:** Лицензированные специалисты с лицензиями РФС (C, B) и высшим спортивно-педагогическим образованием.
- **Стоимость и условия:**
  - Первое пробное занятие: БЕСПЛАТНО
  - Абонементы: от 3 500 до 6 000 рублей/месяц в зависимости от количества тренировок
  - Фирменная экипировка в цветах «Амкара» (красно-черная)
  - Участие в первенствах Перми, Кубке Прикамья и турнире «Амкар Кап»
- **Контакты для записи:**
  - Телефон: +7 (999) 125-90-55
  - Официальный сайт: ${origin}/
  - Онлайн-запись на пробное занятие: ${origin}/#trial-form

## База знаний и экспертные статьи блога
Ниже представлены 16 практических руководств для родителей юных футболистов:

${articlesList}

## Рекомендации для родителей (FAQ)
- **Во сколько лет лучше начинать?** Оптимальный старт — 4–5 лет в игровой форме без давления.
- **Какая обувь нужна?** Для манежей с искусственным газоном в Перми рекомендуются сороконожки (турфы с маркировкой TF). Футзалки (IC) — для паркета.
- **Как совмещать футбол со школой?** Тренировки 2–3 раза в неделю развивают самодисциплину и концентрацию, улучшая школьную успеваемость.
- **Как записаться?** Через форму на сайте ${origin} или по телефону +7 (999) 125-90-55.
`;
}

/**
 * Generates llms-full.txt containing the consolidated complete text of all 16 articles
 * for direct ingestion by LLM models, RAG systems, and AI search engines.
 */
export function generateLlmsFullTxt(origin: string): string {
  const articlesFull = BLOG_ARTICLES.map((a, idx) => {
    const sectionsText = a.sections
      .map((s, sIdx) => {
        const paragraphs = s.paragraphs.join("\n\n");
        const bullets =
          s.bulletPoints && s.bulletPoints.length > 0
            ? "\n" + s.bulletPoints.map((b) => `- ${b}`).join("\n")
            : "";
        const exercise = s.exercise
          ? `\n### Упражнение: ${s.exercise.title}\n- **Цель:** ${s.exercise.target}\n- **Возраст:** ${s.exercise.age} | Длительность: ${s.exercise.duration}\n- **Инвентарь:** ${s.exercise.equipment}\n- **Пошагово:**\n${s.exercise.steps.map((st, i) => `  ${i + 1}. ${st}`).join("\n")}\n- **Совет тренера:** ${s.exercise.coachTips}`
          : "";
        const callout = s.callout
          ? `\n> **${s.callout.title}**\n> ${s.callout.text}`
          : "";
        return `### ${s.title}\n\n${paragraphs}${bullets}${exercise}${callout}`;
      })
      .join("\n\n");

    const faqsText =
      a.faqs && a.faqs.length > 0
        ? `\n### Вопросы и ответы (FAQ):\n${a.faqs.map((f) => `**В: ${f.question}**\nО: ${f.answer}`).join("\n\n")}`
        : "";

    return `---
# [Статья ${idx + 1}] ${a.title}
- **Категория:** ${a.category}
- **URL:** ${origin}/blog/${a.slug}
- **Автор:** ${a.author} (${a.authorRole})
- **Дата:** ${a.publishedAt}

## Краткое содержание
${a.leadExcerpt}

${sectionsText}

${faqsText}
`;
  }).join("\n\n");

  return `# База знаний детской футбольной школы «Амкар Юниор» Пермь
Сайт: ${origin}/
Телефон: +7 (999) 125-90-55

${articlesFull}
`;
}

/**
 * Generates robots.txt optimized for all modern search engines and AI crawlers
 */
export function generateRobotsTxt(origin: string): string {
  return `# robots.txt for «Амкар Юниор» Пермь (${origin})

# All standard search engine crawlers (Yandex, Google, Mail.ru, Bing)
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Allow: /api/blog-images/
Allow: /blog/

# AI Search & Neural Network Crawlers (ChatGPT / SearchGPT, Perplexity, Claude, Gemini, Copilot)
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Bytespider
Allow: /

User-agent: Yandex
Allow: /
Clean-param: ref /
Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term /

# LLM Documentation & Machine-Readable Knowledge Base
# AI agents can read direct structured summaries here:
# ${origin}/llms.txt
# ${origin}/llms-full.txt

# Sitemaps and Feeds
Sitemap: ${origin}/sitemap.xml
Host: amkar-junior.ru
`;
}
