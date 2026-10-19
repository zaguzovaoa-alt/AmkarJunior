import { BlogArticle } from "../data/blogArticles";

const CANONICAL_ORIGIN = "https://amkarjunior.ru";

export function updateSEOForArticle(article: BlogArticle) {
  // 1. Update Title
  document.title = `${article.metaTitle} | Детская футбольная школа Амкар Юниор Пермь`;

  // 2. Meta description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement("meta");
    metaDesc.setAttribute("name", "description");
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute("content", article.metaDescription);

  // 3. Keywords
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement("meta");
    metaKeywords.setAttribute("name", "keywords");
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute("content", article.keywords.join(", "));

  // 4. OpenGraph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", article.metaTitle);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute("content", article.metaDescription);

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) ogImage.setAttribute("content", CANONICAL_ORIGIN + article.coverImage);

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) {
    ogUrl.setAttribute("content", `${CANONICAL_ORIGIN}/blog/${article.slug}`);
  } else {
    const newOgUrl = document.createElement("meta");
    newOgUrl.setAttribute("property", "og:url");
    newOgUrl.setAttribute("content", `${CANONICAL_ORIGIN}/blog/${article.slug}`);
    document.head.appendChild(newOgUrl);
  }

  // 5. Twitter Card tags
  let twCard = document.querySelector('meta[name="twitter:card"]');
  if (!twCard) {
    twCard = document.createElement("meta");
    twCard.setAttribute("name", "twitter:card");
    document.head.appendChild(twCard);
  }
  twCard.setAttribute("content", "summary_large_image");

  let twTitle = document.querySelector('meta[name="twitter:title"]');
  if (!twTitle) {
    twTitle = document.createElement("meta");
    twTitle.setAttribute("name", "twitter:title");
    document.head.appendChild(twTitle);
  }
  twTitle.setAttribute("content", article.metaTitle);

  let twDesc = document.querySelector('meta[name="twitter:description"]');
  if (!twDesc) {
    twDesc = document.createElement("meta");
    twDesc.setAttribute("name", "twitter:description");
    document.head.appendChild(twDesc);
  }
  twDesc.setAttribute("content", article.metaDescription);

  let twImage = document.querySelector('meta[name="twitter:image"]');
  if (!twImage) {
    twImage = document.createElement("meta");
    twImage.setAttribute("name", "twitter:image");
    document.head.appendChild(twImage);
  }
  twImage.setAttribute("content", CANONICAL_ORIGIN + article.coverImage);

  // 6. Canonical link
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", `${CANONICAL_ORIGIN}/blog/${article.slug}`);

  // 7. Schema.org Structured Data: Article, Breadcrumbs & FAQPage
  const existingJsonLd = document.getElementById("article-jsonld");
  if (existingJsonLd) {
    existingJsonLd.remove();
  }

  const script = document.createElement("script");
  script.id = "article-jsonld";
  script.type = "application/ld+json";

  const jsonLdData = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title,
      "description": article.metaDescription,
      "image": [CANONICAL_ORIGIN + article.coverImage],
      "datePublished": `${article.publishedAt}T08:00:00+05:00`,
      "dateModified": `${article.updatedAt}T08:00:00+05:00`,
      "author": {
        "@type": "SportsOrganization",
        "name": article.author,
        "url": CANONICAL_ORIGIN
      },
      "publisher": {
        "@type": "SportsClub",
        "name": "АМКАР ЮНИОР Пермь",
        "logo": {
          "@type": "ImageObject",
          "url": CANONICAL_ORIGIN + "/logo.png"
        },
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Пермь",
          "addressRegion": "Пермский край",
          "addressCountry": "RU"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${CANONICAL_ORIGIN}/blog/${article.slug}`
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Главная",
          "item": CANONICAL_ORIGIN
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Блог",
          "item": `${CANONICAL_ORIGIN}/blog`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": article.title,
          "item": `${CANONICAL_ORIGIN}/blog/${article.slug}`
        }
      ]
    }
  ];

  if (article.faqs && article.faqs.length > 0) {
    jsonLdData.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": article.faqs.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    } as any);
  }

  script.textContent = JSON.stringify(jsonLdData);
  document.head.appendChild(script);
}

export function resetDefaultSEO() {
  document.title = "АМКАР ЮНИОР — Детская футбольная школа в Перми | Набор от 4 лет";
  
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute(
      "content",
      "Детская футбольная школа АМКАР ЮНИОР в Перми. Профессиональные тренировки по футболу для детей от 4 до 12 лет. Запишите ребенка на бесплатное пробное занятие!"
    );
  }

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute("href", `${CANONICAL_ORIGIN}/`);
  }

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) {
    ogUrl.setAttribute("content", `${CANONICAL_ORIGIN}/`);
  }

  const existingJsonLd = document.getElementById("article-jsonld");
  if (existingJsonLd) {
    existingJsonLd.remove();
  }
}
