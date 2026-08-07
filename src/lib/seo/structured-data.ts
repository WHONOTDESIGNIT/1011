import type { 
  WithContext, 
  Thing, 
  Organization, 
  WebSite, 
  Article, 
  Product, 
  BreadcrumbList, 
  WebPage, 
  Offer, 
  AggregateRating, 
  SearchAction,
  ItemList,     // ✅ 确保引入
  ListItem,     // ✅ 确保引入
  FAQPage,      // ✅ 确保引入
  Question,     // ✅ 确保引入
  Answer,       // ✅ 确保引入
  ImageObject,
  Person
} from 'schema-dts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://iplmanufacturer.com';
const SITE_NAME = 'IPL Manufacturer';

// ---------------------------------------------------------
// 1. Organization
// ---------------------------------------------------------
export function getOrganizationSchema(locale: string): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: `${SITE_URL}/${locale}`,
    logo: `${SITE_URL}/images/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+86-123-4567-8900",
      contactType: "sales",
      areaServed: ["US", "EU", "TR", "AE"],
      availableLanguage: ["en", "de", "tr", "ar"],
    },
    sameAs: [
      "https://www.linkedin.com/company/your-company",
      "https://twitter.com/your-company",
    ],
  };
}

// ---------------------------------------------------------
// 2. WebSite
// ---------------------------------------------------------
export function getWebSiteSchema(locale: string): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${SITE_URL}/${locale}`,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/${locale}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    } as SearchAction,
  };
}

// ---------------------------------------------------------
// 3. WebPage
// ---------------------------------------------------------
export function getWebPageSchema(
  page: { title: string; description?: string; path: string },
  locale: string
): WithContext<WebPage> {
  const url = page.path.startsWith('http')
    ? page.path
    : `${SITE_URL}/${locale}${page.path.startsWith('/') ? page.path : '/' + page.path}`;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description,
    url,
    inLanguage: locale,
  };
}

// ---------------------------------------------------------
// 4. Article
// ---------------------------------------------------------
export function getArticleSchema(
  post: {
    title: string;
    description?: string;
    image?: string;
    date: string;
    slug: string;
    author?: string;
  },
  locale: string
): WithContext<Article> {
  const articleUrl = `${SITE_URL}/${locale}/blog/${post.slug}`;
  const imageUrl = post.image
    ? (post.image.startsWith('http') ? post.image : `${SITE_URL}${post.image}`)
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: imageUrl ? [imageUrl] : undefined,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: post.author || "IPL Manufacturer Team",
      url: `${SITE_URL}/${locale}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/logo.png`,
      },
      url: `${SITE_URL}/${locale}`,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
  };
}

// ---------------------------------------------------------
// 5. Product
// ---------------------------------------------------------
export function getProductSchema(
  product: {
    name: string;
    description: string;
    image: string;
    sku?: string;
    brand?: string;
    price?: string | number;
    currency?: string;
    ratingValue?: number;
    reviewCount?: number;
    inStock?: boolean;
  },
  locale: string
): WithContext<Product> {
  const imageAbs = product.image.startsWith('http') ? product.image : `${SITE_URL}${product.image}`;

  const schema: WithContext<Product> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: imageAbs,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand || SITE_NAME,
    },
  };

  if (product.ratingValue && product.reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.ratingValue,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    } as AggregateRating;
  }

  if (product.inStock !== undefined || product.price) {
    schema.offers = {
      "@type": "Offer",
      priceCurrency: product.currency || "USD",
      price: product.price ?? "0",
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/${locale}/products/${product.sku ?? ""}`,
    } as Offer;
  }

  return schema;
}

// ---------------------------------------------------------
// 6. BreadcrumbList
// ---------------------------------------------------------
export function getBreadcrumbSchema(
  items: Array<{ name: string; path: string }>,
  locale: string
): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path.startsWith('http')
        ? item.path
        : `${SITE_URL}/${locale}${item.path.startsWith('/') ? item.path : '/' + item.path}`,
    })),
  };
}

// ---------------------------------------------------------
// 7. ItemList (🔥 补回了这个函数)
// ---------------------------------------------------------
export function getItemListSchema(
  items: Array<{ name: string; url: string; image?: string }>,
  locale: string
): WithContext<ItemList> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((it, index) => {
      const url = it.url.startsWith('http') 
        ? it.url 
        : `${SITE_URL}/${locale}${it.url.startsWith('/') ? it.url : '/' + it.url}`;
      
      const imageAbs = it.image 
        ? (it.image.startsWith('http') ? it.image : `${SITE_URL}${it.image}`) 
        : undefined;

      return {
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Thing", // 使用 Thing 作为通用类型
          "@id": url,
          name: it.name,
          image: imageAbs,
          url: url, // 显式添加 url 属性
        } as Thing,
      };
    }),
  };
}

// ---------------------------------------------------------
// 8. FAQPage (🔥 补回了这个函数)
// ---------------------------------------------------------
export function getFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): WithContext<FAQPage> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      } as Answer,
    })) as Question[],
  };
}