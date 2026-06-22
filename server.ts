import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { Article, Comment, CATEGORIES } from "./src/types";
import { INITIAL_ARTICLES } from "./src/mockArticles";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import fs from "fs";
import nodemailer from "nodemailer";

// Lazy-loaded Gemini SDK
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database for state persistence
let articles: Article[] = [...INITIAL_ARTICLES];
let comments: Comment[] = [
  {
    id: "comment-1",
    articleId: "capsule-wardrobe-2026",
    authorName: "Charlotte R.",
    content: "Absolutely love the recommendation for the camel trench! It really is a signature look.",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: "comment-2",
    articleId: "capsule-wardrobe-2026",
    authorName: "Victoria Milan",
    content: "The 60-30-10 color theory rules are so helpful, I tried the silk camisole and tailored trousers pairing today!",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "comment-3",
    articleId: "color-theory-styling",
    authorName: "Alice Dubois",
    content: "A tonal slate styling always feels so elite! Thank you for this beautiful design perspective.",
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

// In-memory traffic metrics for analytics dashboard
let analyticsMetrics = {
  totalViews: 4626,
  categoryClicks: {
    "Fashion Tips": 340,
    "Style Guides": 450,
    "Outfit Ideas": 210,
    "Seasonal Fashion": 120,
    "Fashion Trends": 540,
    "Wardrobe Essentials": 1240,
    "Fashion Mistakes": 940,
    "Luxury Fashion": 610,
    "Beauty Tips": 380,
    "Accessories": 170
  } as Record<string, number>,
  pinterestShares: 342,
  newsletterSignups: 118,
  affiliateClicks: 84
};

// --- AUTHENTICATION & IMAGE PERSISTENCE SETUPS ---

const HASHED_PASSWORD = bcrypt.hashSync("hafizabad", 10);
const JWT_SECRET = process.env.JWT_SECRET || "veloura_secret_secure_key_2026_fashion_luxe";

// Express Authentication Middleware
const requireAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access Denied: Unauthenticated" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Access Denied: Invalid or expired token" });
  }
};

// Multer Storage Configuration (Local persistent storage uploads)
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "-");
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// dynamic SEO Injection utilities
const injectSEOMetadata = (html: string, article: Article | null): string => {
  const defaultTitle = "Veloura Wear | Premium Luxury Fashion Magazine";
  const defaultDesc = "Veloura Wear is an elite modern fashion journal covering capsule wardrobes, timeless aesthetics, luxury trend reports, and bespoke style curations.";
  const defaultImage = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200";

  const title = article ? (article.seoTitle || article.title) : defaultTitle;
  const desc = article ? (article.seoDescription || article.summary || defaultDesc) : defaultDesc;
  const image = article ? (article.featuredImage || defaultImage) : defaultImage;
  const url = article ? `https://velourawear.com/article/${article.slug}` : "https://velourawear.com/";

  const metaHtml = `
    <title>${title}</title>
    <meta name="description" content="${desc}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="article" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${image}" />
  `;

  let cleaned = html.replace(/<title>[^<]*<\/title>/i, "");
  return cleaned.replace("<head>", `<head>${metaHtml}`);
};

// Contact inquiry database file path
const contactsFile = path.join(process.cwd(), "contacts.json");
let contactSubmissions: any[] = [];
if (fs.existsSync(contactsFile)) {
  try {
    contactSubmissions = JSON.parse(fs.readFileSync(contactsFile, "utf-8"));
  } catch (err) {
    console.error("Error reading contacts.json:", err);
  }
}

// Lazy email sender function
const sendEmailNotification = async (submission: any) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  
  if (!user || !pass) {
    console.log("-----------------------------------------");
    console.log("[EMAIL NOTIFICATION] E-mail credentials not configured in environment variables (EMAIL_USER/EMAIL_PASS).");
    console.log(`To: ah344wjwjueu@gmail.com`);
    console.log(`From: ${submission.name} <${submission.email}>`);
    console.log(`Subject: New Veloura Wear Inquiry - ${submission.name}`);
    console.log("-----------------------------------------");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: { user, pass }
    });

    await transporter.sendMail({
      from: `"${submission.name}" <${user}>`,
      to: "ah344wjwjueu@gmail.com",
      replyTo: submission.email,
      subject: `Veloura Wear Fashion inquiry from ${submission.name}`,
      text: `You have received a new inquiry on Veloura Wear Magazine.\n\nFrom: ${submission.name} (${submission.email})\nDate: ${submission.createdAt}\n\nMessage:\n${submission.message}`
    });
    console.log(`Email successfully forwarded to ah344wjwjueu@gmail.com`);
  } catch (err) {
    console.error("Error forwarding email via Nodemailer:", err);
  }
};


// --- API ROUTES ---

// POST Auth Login
app.post("/api/auth/login", (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  const isValid = bcrypt.compareSync(password, HASHED_PASSWORD);
  if (!isValid) {
    return res.status(401).json({ error: "Access Denied: Incorrect password" });
  }

  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ success: true, token });
});

// POST Contact Form
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Full Name is required" });
  }
  if (!email || typeof email !== "string" || !email.trim() || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email address is required" });
  }
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Editorial inquiry message content is required" });
  }

  const submission = {
    id: `contact-${Date.now()}`,
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    createdAt: new Date().toISOString()
  };

  contactSubmissions.push(submission);
  try {
    fs.writeFileSync(contactsFile, JSON.stringify(contactSubmissions, null, 2));
  } catch (err) {
    console.error("Error writing contacts.json:", err);
  }

  // Fire email notification in background
  await sendEmailNotification(submission);

  res.json({ success: true, message: "Thank you for contacting Veloura Wear. We will get back to you soon." });
});

// GET /sitemap.xml
app.get("/sitemap.xml", (req, res) => {
  const publishedArticles = articles.filter(a => a.status === "published");
  const urls = publishedArticles.map(a => {
    return `  <url>
    <loc>https://velourawear.com/article/${a.slug}</loc>
    <lastmod>${new Date(a.createdAt).toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://velourawear.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${urls}
</urlset>`;

  res.header("Content-Type", "application/xml");
  res.send(sitemap);
});

// GET /robots.txt
app.get("/robots.txt", (req, res) => {
  const robots = `User-agent: *
Allow: /
Sitemap: https://velourawear.com/sitemap.xml
`;
  res.header("Content-Type", "text/plain");
  res.send(robots);
});

// POST Upload Image File
app.post("/api/upload", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Secure Analytics summary
app.get("/api/analytics", requireAuth, (req, res) => {
  res.json({
    metrics: analyticsMetrics,
    totalArticles: articles.length,
    draftsCount: articles.filter(a => a.status === 'draft').length,
    publishedCount: articles.filter(a => a.status === 'published').length,
    popular: [...articles].sort((a,b) => b.views - a.views).slice(0, 3)
  });
});

// Update click metrics
app.post("/api/analytics/track", (req, res) => {
  const { eventType, value } = req.body;
  if (eventType === "pinterest") {
    analyticsMetrics.pinterestShares += 1;
  } else if (eventType === "subscribe") {
    analyticsMetrics.newsletterSignups += 1;
  } else if (eventType === "affiliate") {
    analyticsMetrics.affiliateClicks += 1;
  } else if (eventType === "category" && typeof value === "string") {
    if (analyticsMetrics.categoryClicks[value] !== undefined) {
      analyticsMetrics.categoryClicks[value] += 1;
    } else {
      analyticsMetrics.categoryClicks[value] = 1;
    }
  }
  res.json({ success: true, metrics: analyticsMetrics });
});

// GET all articles
app.get("/api/articles", (req, res) => {
  // Sort published first, then drafts, by date descending
  const sorted = [...articles].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  res.json(sorted);
});

// GET custom article by ID/slug
app.get("/api/articles/:idOrSlug", (req, res) => {
  const { idOrSlug } = req.params;
  const article = articles.find(a => a.id === idOrSlug || a.slug === idOrSlug);
  
  if (!article) {
    return res.status(404).json({ error: "Article not found" });
  }

  // Auto increment views
  article.views += 1;
  analyticsMetrics.totalViews += 1;
  
  // Track custom category views for dashboard metrics search
  if (analyticsMetrics.categoryClicks[article.category] !== undefined) {
    analyticsMetrics.categoryClicks[article.category] += 1;
  }

  res.json(article);
});

// POST create empty draft or full article
app.post("/api/articles", requireAuth, (req, res) => {
  const newArticle: Article = {
    id: `art-${Date.now()}`,
    title: req.body.title || "Untitled Draft",
    slug: req.body.slug || `untitled-draft-${Date.now()}`,
    content: req.body.content || "Write your beautiful article content here.",
    summary: req.body.summary || "",
    category: req.body.category || "Fashion Tips",
    tags: Array.isArray(req.body.tags) ? req.body.tags : ["Fashion"],
    seoTitle: req.body.seoTitle || req.body.title || "Untitled Draft",
    seoDescription: req.body.seoDescription || req.body.summary || "",
    featuredImage: req.body.featuredImage || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200",
    status: req.body.status || "draft",
    createdAt: new Date().toISOString(),
    readTime: Number(req.body.readTime) || 3,
    author: req.body.author || {
      name: "Veloura Editors",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150",
      bio: "Curation and style analysis desk at Veloura Wear."
    },
    reactions: { love: 0, insight: 0, clap: 0 },
    views: 0,
    commentsCount: 0,
    isSponsored: !!req.body.isSponsored,
    affiliateProducts: req.body.affiliateProducts || [],
    pinDescription: req.body.pinDescription || `Curated style and look guides on Veloura Wear. Styling advice and beauty updates. ${req.body.title}`
  };

  articles.push(newArticle);
  res.status(201).json(newArticle);
});

// PUT update an article details (saves draft/publish)
app.put("/api/articles/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const index = articles.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Article not found" });
  }

  articles[index] = {
    ...articles[index],
    ...req.body,
    // Keep internal values safe if not explicitly updated
    reactions: req.body.reactions || articles[index].reactions,
    views: req.body.views !== undefined ? req.body.views : articles[index].views,
    commentsCount: comments.filter(c => c.articleId === id).length
  };

  res.json(articles[index]);
});

// DELETE delete article
app.delete("/api/articles/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const index = articles.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Article not found" });
  }
  articles.splice(index, 1);
  res.json({ success: true, message: "Article was successfully removed." });
});

// GET comments for an article
app.get("/api/articles/:id/comments", (req, res) => {
  const { id } = req.params;
  const filtered = comments.filter(c => c.articleId === id);
  res.json(filtered);
});

// POST comment on an article
app.post("/api/articles/:id/comments", (req, res) => {
  const { id } = req.params;
  const { authorName, content } = req.body;
  
  if (!authorName || !content) {
    return res.status(400).json({ error: "Author name and content are required." });
  }

  const newComment: Comment = {
    id: `co-${Date.now()}`,
    articleId: id,
    authorName,
    content,
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);

  // Sync comment count in article
  const art = articles.find(a => a.id === id);
  if (art) {
    art.commentsCount = comments.filter(c => c.articleId === id).length;
  }

  res.status(201).json(newComment);
});

// POST reaction count
app.post("/api/articles/:id/reactions", (req, res) => {
  const { id } = req.params;
  const { type } = req.body; // 'love', 'insight', 'clap'
  
  const article = articles.find(a => a.id === id);
  if (!article) {
    return res.status(404).json({ error: "Article not found" });
  }

  if (type === 'love') article.reactions.love += 1;
  else if (type === 'insight') article.reactions.insight += 1;
  else if (type === 'clap') article.reactions.clap += 1;

  res.json(article.reactions);
});

// --- BLOGGER ARTICLE IMPORT FROM URL ---
app.post("/api/import", requireAuth, async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Blogger URL is required." });
  }

  console.log(`Blogger Import requested for: ${url}`);

  try {
    // 1. Fetch raw HTML from the Blogger/any URL
    const fetchResponse = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) VelouraWear/1.0"
      }
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch page. Status: ${fetchResponse.status}`);
    }

    const html = await fetchResponse.text();

    // 2. See if standard Gemini AI parsing is available
    const ai = getGeminiClient();

    if (ai) {
      console.log("Using server-side Gemini 3.5 Flash for smart HTML parsing...");
      // Sanitize/truncate HTML a bit so details fit in context nicely
      const cleanHtmlSample = html.substring(0, 45000);

      const prompt = `
You are a premium luxury fashion editor for "Veloura Wear" magazine.
A user has pasted the following raw HTML content of a Blogger article:
---
${cleanHtmlSample}
---

Your task is to parse, extract, synthesize, and rewrite this Blogger post into an ultra-premium, elegant, SEO-optimized luxury fashion magazine article.
Return a STRICT JSON response containing the following structure matches exactly:
{
  "title": "A captivating, luxurious version of the title",
  "content": "A beautiful, rich, styled Markdown content block with clear headings, styled sub-paragraphs, bold points, bullet points, and high quality reading flow.",
  "category": "One of these exact categories: 'Fashion Tips', 'Style Guides', 'Outfit Ideas', 'Seasonal Fashion', 'Fashion Trends', 'Wardrobe Essentials', 'Fashion Mistakes', 'Luxury Fashion', 'Beauty Tips', 'Accessories'. Pick the single best descriptor.",
  "tags": ["3 to 5 fashion tags matching the article"],
  "seoTitle": "Under 60 character Google SEO title with Veloura Wear",
  "seoDescription": "Under 160 character elegant summary for search results",
  "featuredImage": "An extracted image URL from the source if found (e.g. looking for img src tags in HTML), or if none, fallback to a elegant placeholder like 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200'",
  "pinDescription": "A highly search-optimized Pinterest pin description, including a hook, overview of the post, and curated styling hashtags.",
  "readTime": 5,
  "isSponsored": false,
  "affiliateProducts": [
    {
      "title": "Suggested designer/affordable product to style this look",
      "brand": "Suggested Brand name",
      "price": "$120.00",
      "image": "An elegant representation image, or fallback to beautiful placeholder 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=400'",
      "url": "#"
    }
  ]
}

Guidelines for synthesis:
- Preserve all images or style references mentioned in the Blogger post
- Enhance paragraphs with high editorial polish, professional vocabulary, and visual phrasing
- Structure headings beautifully with Markdown h2 and h3 elements
- Exclude blogging feed noise, footers, headers, sidebar text and calendar dates
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              category: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              seoTitle: { type: Type.STRING },
              seoDescription: { type: Type.STRING },
              featuredImage: { type: Type.STRING },
              pinDescription: { type: Type.STRING },
              readTime: { type: Type.INTEGER },
              isSponsored: { type: Type.BOOLEAN },
              affiliateProducts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    brand: { type: Type.STRING },
                    price: { type: Type.STRING },
                    image: { type: Type.STRING },
                    url: { type: Type.STRING }
                  },
                  required: ["title", "brand", "price", "image", "url"]
                }
              }
            },
            required: ["title", "content", "category", "tags", "seoTitle", "seoDescription", "featuredImage", "pinDescription", "readTime", "isSponsored", "affiliateProducts"]
          }
        }
      });

      const parsedResult = JSON.parse(response.text.trim());
      
      // Ensure the generated slug is valid
      const slug = parsedResult.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const importedDraft: Article = {
        id: `imported-${Date.now()}`,
        title: parsedResult.title,
        slug,
        content: parsedResult.content,
        summary: parsedResult.seoDescription,
        category: CATEGORIES.includes(parsedResult.category) ? parsedResult.category : "Fashion Tips",
        tags: parsedResult.tags,
        seoTitle: parsedResult.seoTitle,
        seoDescription: parsedResult.seoDescription,
        featuredImage: parsedResult.featuredImage,
        status: 'draft', // Saved as edit draft first
        createdAt: new Date().toISOString(),
        readTime: parsedResult.readTime || 4,
        author: {
          name: "Imported Curation",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150",
          bio: "Extracted post from Blogger with high-end aesthetic enhancement."
        },
        reactions: { love: 0, insight: 0, clap: 0 },
        views: 0,
        commentsCount: 0,
        isSponsored: !!parsedResult.isSponsored,
        affiliateProducts: parsedResult.affiliateProducts,
        pinDescription: parsedResult.pinDescription
      };

      articles.push(importedDraft);
      return res.json({ success: true, article: importedDraft, sourceUrl: url });
    }

    // 3. FALLBACK: Simple, advanced manual rule-based regex parsing if Gemini isn't loaded/activated
    console.log("No Gemini API Key found. Performing rule-based parsing...");
    
    // Extract title from <title> tag
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    let title = titleMatch ? titleMatch[1].replace(/(\s?-?\s?Blogger|Blogspot|Powered by)/gi, "").trim() : "Imported Outfit Guide";
    
    // Clean up title
    if (title.toUpperCase() === title) {
      title = title.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.substring(1)).join(' ');
    }

    // Try to extract images
    const imgRegex = /<img[^>]+src="([^">]+)"/gi;
    const imgUrls: string[] = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null && imgUrls.length < 5) {
      const src = match[1];
      if (src.startsWith('http') && !src.includes('avatar') && !src.includes('widget')) {
        imgUrls.push(src);
      }
    }

    const featuredImage = imgUrls[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200";

    // Extract text from paragraph tags or simple clean tags
    let contentMarkdown = "";
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    const bodyParagraphs: string[] = [];
    while ((match = pRegex.exec(html)) !== null && bodyParagraphs.length < 8) {
      const cleanP = match[1].replace(/<[^>]+>/g, '').trim();
      if (cleanP.length > 25) {
        bodyParagraphs.push(cleanP);
      }
    }

    if (bodyParagraphs.length > 0) {
      contentMarkdown = `# ${title}\n\n` + bodyParagraphs.map(p => p).join("\n\n");
    } else {
      contentMarkdown = `# ${title}\n\nThis article was imported successfully from: ${url}.\n\nBlogger layout details, stylish capsule inspirations, and bespoke styling tips. Browse our category lists to enhance your outfit presentation.`;
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const fallbackImportedDraft: Article = {
      id: `imported-${Date.now()}`,
      title: title,
      slug,
      content: contentMarkdown,
      summary: `Read the imported curation of '${title}' from Blogger, featuring refined luxury elements in seasonal outfits.`,
      category: "Fashion Tips",
      tags: ["Imported", "Blogger Post", "Style Notes"],
      seoTitle: `${title} | Veloura Wear`,
      seoDescription: `Read the editorial version of ${title} with high-res styling inspiration.`,
      featuredImage: featuredImage,
      status: 'draft',
      createdAt: new Date().toISOString(),
      readTime: Math.max(3, Math.ceil(bodyParagraphs.join(" ").split(" ").length / 200)) || 4,
      author: {
        name: "Blogger Import Desk",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150",
        bio: "Direct import parser from Blogger feeds."
      },
      reactions: { love: 0, insight: 0, clap: 0 },
      views: 0,
      commentsCount: 0,
      isSponsored: false,
      affiliateProducts: [
        {
          id: `aff-${Date.now()}-1`,
          title: "Sleek Calfskin Kitten Heel",
          brand: "Veloura Atelier",
          price: "$145.00",
          image: featuredImage,
          url: "#"
        }
      ],
      pinDescription: `Stunning layout for ${title}. Pin this to save to your outfit inspiration board today. #bloggerfashion #fashiontips #velourawear`
    };

    articles.push(fallbackImportedDraft);
    res.json({ success: true, article: fallbackImportedDraft, sourceUrl: url });

  } catch (err: any) {
    console.error("Import error:", err);
    res.status(500).json({ error: `Could not parse url. Fetch error: ${err.message}` });
  }
});


// --- VITE MIDDLEWARE SETUP & STATIC SERVING ---

let viteInstance: any = null;

const serveHTMLIndexWithSEO = async (req: express.Request, res: express.Response, article: Article | null) => {
  const isDev = process.env.NODE_ENV !== "production";
  try {
    const templatePath = isDev 
      ? path.join(process.cwd(), "index.html")
      : path.join(process.cwd(), "dist", "index.html");

    if (!fs.existsSync(templatePath)) {
      return res.status(404).send("Index.html template not found.");
    }
    
    let html = fs.readFileSync(templatePath, "utf-8");
    if (isDev && viteInstance) {
      html = await viteInstance.transformIndexHtml(req.originalUrl, html);
    }
    
    const finalHtml = injectSEOMetadata(html, article);
    res.setHeader("Content-Type", "text/html");
    res.status(200).send(finalHtml);
  } catch (err: any) {
    res.status(500).send(`Server Template Error: ${err.message}`);
  }
};

app.get("/article/:slug", async (req, res) => {
  const { slug } = req.params;
  const article = articles.find(a => a.slug === slug);
  await serveHTMLIndexWithSEO(req, res, article || null);
});

app.get("/", async (req, res) => {
  await serveHTMLIndexWithSEO(req, res, null);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode with hot Vite rendering middleware
    viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(viteInstance.middlewares);
  } else {
    // Production Mode serving compiled static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { index: false }));
    app.get("*", async (req, res) => {
      await serveHTMLIndexWithSEO(req, res, null);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Veloura Wear Full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
