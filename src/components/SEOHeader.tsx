import React from 'react';
import { Article } from '../types';

interface SEOHeaderProps {
  article?: Article;
}

export default function SEOHeader({ article }: SEOHeaderProps) {
  React.useEffect(() => {
    if (!article) {
      document.title = "Veloura Wear | Premium Luxury Fashion Magazine";
      return;
    }

    document.title = article.seoTitle || `${article.title} | Veloura Wear`;
    
    // Dynamically update meta description if in actual browser (mostly for completeness)
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", article.seoDescription || article.summary);
    }
  }, [article]);

  if (!article) return null;

  // JSON-LD Schema Markup
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": [article.featuredImage],
    "datePublished": article.createdAt,
    "dateModified": article.createdAt,
    "author": {
      "@type": "Person",
      "name": article.author.name,
      "image": article.author.avatar
    },
    "publisher": {
      "@type": "Organization",
      "name": "Veloura Wear",
      "logo": {
        "@type": "ImageObject",
        "url": "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=150"
      }
    },
    "description": article.summary
  };

  return (
    <script type="application/ld+json" id="seo-schema">
      {JSON.stringify(schemaMarkup)}
    </script>
  );
}

// Inline helper to generate downloadable XML Sitemap
export function generateSitemapXML(articles: Article[]): string {
  const rootUrl = window.location.origin;
  const urlNodes = articles
    .map(art => `  <url>
    <loc>${rootUrl}/article/${art.slug}</loc>
    <lastmod>${art.createdAt.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${rootUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${urlNodes}
</urlset>`;
}
