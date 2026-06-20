import React, { useState, useEffect } from 'react';
import { Article, Comment } from '../types';
import { Heart, MessageSquare, Clock, ArrowLeft, Bookmark, CornerUpRight, Clipboard, Tag, ExternalLink } from 'lucide-react';

interface ArticleDetailProps {
  article: Article;
  onBack: () => void;
  savedBookmarks: string[];
  onToggleBookmark: (id: string) => void;
  relatedArticles: Article[];
  onSelectArticle: (article: Article) => void;
  onTrackEvent: (eventType: string, value?: string) => void;
}

export default function ArticleDetail({
  article,
  onBack,
  savedBookmarks,
  onToggleBookmark,
  relatedArticles,
  onSelectArticle,
  onTrackEvent
}: ArticleDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reactions, setReactions] = useState(article.reactions);
  const [hasLoved, setHasLoved] = useState(false);
  const [hasInsight, setHasInsight] = useState(false);
  const [hasClapped, setHasClapped] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);

  // Load comments
  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/articles/${article.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Error loading comments:", err);
    }
  };

  useEffect(() => {
    fetchComments();
    setReactions(article.reactions);
    
    // Reset reactions flags
    setHasLoved(false);
    setHasInsight(false);
    setHasClapped(false);

    // Scroll back to top on load
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Handle scroll progress
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setReadingProgress((window.scrollY / totalScroll) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [article]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !commentText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/articles/${article.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName, content: commentText })
      });
      if (res.ok) {
        setCommentText("");
        fetchComments();
      }
    } catch (err) {
      console.error("Error comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (type: 'love' | 'insight' | 'clap') => {
    // Prevent double reaction in UX
    if (type === 'love' && hasLoved) return;
    if (type === 'insight' && hasInsight) return;
    if (type === 'clap' && hasClapped) return;

    if (type === 'love') setHasLoved(true);
    if (type === 'insight') setHasInsight(true);
    if (type === 'clap') setHasClapped(true);

    try {
      const res = await fetch(`/api/articles/${article.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        const data = await res.json();
        setReactions(data);
      }
    } catch (err) {
      console.error("Error updates reaction:", err);
    }
  };

  const copyArticleLink = () => {
    const slugUrl = `${window.location.origin}/article/${article.slug}`;
    navigator.clipboard.writeText(slugUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const notifyPinterestPin = () => {
    onTrackEvent("pinterest", article.title);
    alert(`📌 Saved to Pinterest!\n\nAutomatic Pin Description:\n"${article.pinDescription || article.summary}"`);
  };

  // Convert raw Markdown text to pristine styled HTML paragraphs and headings
  const renderFormattedMarkdown = (markdown: string) => {
    if (!markdown) return "";
    
    // Simple line by line custom HTML compiler for flawless display without bundle crash
    const lines = markdown.split("\n");
    let inList = false;
    let listItems: string[] = [];
    const htmlBlocks: React.JSX.Element[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith("# ")) {
        // H1 header - let's skip as title is already rendered elegantly at top
        return;
      }

      if (trimmed.startsWith("## ")) {
        if (inList) {
          htmlBlocks.push(
            <ul key={`list-${index}`} className="list-disc pl-6 space-y-2 text-stone-700 my-4 text-sm md:text-base leading-relaxed">
              {listItems.map((li, i) => <li key={i}>{li}</li>)}
            </ul>
          );
          inList = false;
          listItems = [];
        }
        htmlBlocks.push(
          <h2 key={`h2-${index}`} className="font-serif text-xl md:text-2xl tracking-wide uppercase font-medium text-stone-900 mt-8 mb-4 border-b border-stone-200 pb-2">
            {trimmed.substring(3)}
          </h2>
        );
        return;
      }

      if (trimmed.startsWith("### ")) {
        if (inList) {
          htmlBlocks.push(
            <ul key={`list-${index}`} className="list-disc pl-6 space-y-2 text-stone-700 my-4 text-sm md:text-base leading-relaxed">
              {listItems.map((li, i) => <li key={i}>{li}</li>)}
            </ul>
          );
          inList = false;
          listItems = [];
        }
        htmlBlocks.push(
          <h3 key={`h3-${index}`} className="font-serif text-lg font-bold text-stone-850 mt-6 mb-3">
            {trimmed.substring(4)}
          </h3>
        );
        return;
      }

      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        inList = true;
        // Strip bold markdown markers inside list elements
        const liContent = trimmed.substring(2).replace(/\*\*/g, "");
        listItems.push(liContent);
        return;
      }

      if (trimmed === "" || trimmed === "---") {
        if (inList) {
          htmlBlocks.push(
            <ul key={`list-${index}`} className="list-disc pl-6 space-y-2 text-stone-700 my-4 text-sm md:text-base leading-relaxed">
              {listItems.map((li, i) => <li key={i}>{li}</li>)}
            </ul>
          );
          inList = false;
          listItems = [];
        }
        if (trimmed === "---") {
          htmlBlocks.push(<hr key={`hr-${index}`} className="border-stone-200 my-8" />);
        }
        return;
      }

      // Normal paragraph lines
      if (inList) {
        htmlBlocks.push(
          <ul key={`list-${index}`} className="list-disc pl-6 space-y-2 text-stone-700 my-4 text-sm md:text-base leading-relaxed">
            {listItems.map((li, i) => <li key={i}>{li}</li>)}
          </ul>
        );
        inList = false;
        listItems = [];
      }

      // Handle custom blockquotes or styling formats
      if (trimmed.startsWith("> ")) {
        htmlBlocks.push(
          <blockquote key={`quote-${index}`} className="border-l-4 border-[#D4AF37] pl-4 italic text-stone-600 my-6 font-serif">
            {trimmed.substring(2)}
          </blockquote>
        );
        return;
      }

      // Styled regular text with potential inline bold tags
      const chunks = trimmed.split("**");
      const renderedText = chunks.map((chunk, chunkIndex) => {
        if (chunkIndex % 2 === 1) {
          return <strong key={chunkIndex} className="font-bold text-stone-900">{chunk}</strong>;
        }
        return chunk;
      });

      htmlBlocks.push(
        <p key={`p-${index}`} className="text-stone-750 text-sm md:text-lg leading-relaxed md:leading-loose tracking-wide my-4 text-justify">
          {renderedText}
        </p>
      );
    });

    // Cleanup lingering lists
    if (inList && listItems.length > 0) {
      htmlBlocks.push(
        <ul key="list-last" className="list-disc pl-6 space-y-2 text-stone-700 my-4 text-sm md:text-base leading-relaxed">
          {listItems.map((li, i) => <li key={i}>{li}</li>)}
        </ul>
      );
    }

    return htmlBlocks;
  };

  // Build the automatic Table of Contents based on H2 titles
  const getTableOfContents = (markdown: string) => {
    if (!markdown) return [];
    return markdown
      .split("\n")
      .filter(line => line.trim().startsWith("## "))
      .map(line => line.trim().substring(3));
  };

  const tocItems = getTableOfContents(article.content);

  return (
    <div className="w-full bg-[#FAF9F6] min-h-screen text-[#1A1A1A] relative pb-16 font-sans" id="article-detail">
      
      {/* 1. Thin Reading Progress Bar */}
      <div 
        className="fixed top-0 left-0 bg-[#D4AF37] h-1 z-50 transition-all duration-100 ease-out" 
        style={{ width: `${readingProgress}%` }}
        id="reading-progress-bar"
      ></div>

      {/* Floating Reading Actions */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-8">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition text-[#D4AF37]" />
          <span>Back to publication lists</span>
        </button>
      </div>

      <article className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        
        {/* Main Body Content Column (8/12) */}
        <div className="lg:col-span-8 space-y-8 bg-white p-6 md:p-12 border border-[#D4AF37]/20 rounded-none">
          
          {/* Header Metadata block */}
          <div className="space-y-4">
            <span className="bg-[#D4AF37] text-white text-[10px] uppercase font-mono tracking-widest px-3 py-1 font-bold inline-block">
              {article.category}
            </span>
            <h1 className="font-serif text-3xl md:text-5xl font-light leading-tight tracking-tight text-[#1A1A1A]">
              {article.title}
            </h1>
            <p className="text-stone-500 italic text-sm md:text-base font-serif leading-relaxed">
              "{article.summary}"
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-stone-400 border-t border-b border-[#D4AF37]/20 py-4 mt-6">
              <span className="text-stone-700 font-serif font-bold">By {article.author.name}</span>
              <span>·</span>
              <div className="flex items-center gap-1 text-[#D4AF37]">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-stone-500">{article.readTime} min read</span>
              </div>
              <span>·</span>
              <span className="text-stone-500">Published: {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span>·</span>
              <span className="text-stone-500">{article.views} Views</span>
            </div>
          </div>

          {/* Large Hero Image */}
          <div className="select-none relative overflow-hidden rounded">
            <img
              src={article.featuredImage}
              alt={article.title}
              referrerPolicy="no-referrer"
              className="w-full max-h-[500px] object-cover"
            />
            {article.isSponsored && (
              <span className="absolute top-4 left-4 bg-stone-950/90 text-amber-200 text-[10px] uppercase font-mono tracking-widest px-3.5 py-1">
                SPONSORED COUTURE EDITORIAL
              </span>
            )}
          </div>

          {/* Video embedding preview panel */}
          {article.content.includes("video") && (
            <div className="border border-stone-200 bg-stone-900 text-stone-100 p-4 rounded text-center my-6" id="video-embed">
              <p className="font-mono text-[9px] text-amber-200 uppercase tracking-widest mb-1">Muted Video Frame Embed</p>
              <div className="aspect-video bg-stone-950 flex items-center justify-center border border-stone-800 rounded">
                <p className="text-xs text-stone-400">High-Fidelity Virtual Runway Streaming Ready (Youtube/Vimeo Mock)</p>
              </div>
            </div>
          )}

          {/* Formatted Content Body */}
          <div className="prose prose-stone max-w-none text-stone-800" id="editorial-body">
            {renderFormattedMarkdown(article.content)}
          </div>

          {/* Styling Tags Block */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-[#D4AF37]/20">
              <Tag className="h-4 w-4 text-[#D4AF37] shrink-0" />
              {article.tags.map(t => (
                <span key={t} className="text-[10px] font-mono tracking-wider uppercase bg-[#FAF9F6] border border-[#D4AF37]/20 rounded-none px-2.5 py-0.5 text-stone-600">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Monetization: Affiliate Product Boxes */}
          {article.affiliateProducts && article.affiliateProducts.length > 0 && (
            <div className="bg-[#FAF9F6] border border-[#D4AF37]/20 p-6 md:p-8 mt-12 rounded-none" id="affiliate-boxes">
              <h4 className="font-serif italic text-stone-500 uppercase tracking-widest text-xs mb-4 pb-2 border-b border-[#D4AF37]/20">
                Shop The Silhouette (Affiliate Showcase)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {article.affiliateProducts.map(prod => (
                  <div key={prod.id} className="bg-white p-4 border border-[#D4AF37]/20 flex items-center gap-4 hover:shadow-sm transition rounded-none">
                    <img
                      src={prod.image}
                      alt={prod.title}
                      referrerPolicy="no-referrer"
                      className="h-20 w-16 object-cover bg-[#FAF9F6] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400">{prod.brand}</p>
                      <h5 className="font-serif text-sm font-semibold text-stone-850 truncate">{prod.title}</h5>
                      <p className="font-bold text-[#D4AF37] text-xs mt-1">{prod.price}</p>
                      <button
                        onClick={() => {
                          onTrackEvent("affiliate", prod.title);
                          alert(`🛍️ Product link activated via redirect: ${prod.url || '#'} (affiliate earning potential loaded)`);
                        }}
                        className="mt-2 text-[10px] font-bold tracking-widest uppercase hover:text-[#D4AF37] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>BUY FROM BOUTIQUE</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Comments and Reader Engagement Section */}
          <div className="pt-12 border-t border-[#D4AF37]/20" id="comments-section">
            <h3 className="font-serif text-xl tracking-wider uppercase mb-6 flex items-center gap-2 text-[#1A1A1A]">
              <MessageSquare className="h-5 w-5 text-[#D4AF37]" />
              <span>Comments & Reflections ({comments.length})</span>
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="space-y-3 bg-[#FAF9F6] p-4 border border-[#D4AF37]/20 rounded-none mb-8">
              <h4 className="font-mono text-[9px] tracking-widest uppercase text-stone-500">Leave Your Perspective</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Your Name (e.g. Marie L.)"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="bg-white border border-[#D4AF37]/20 rounded-none text-xs px-3 py-2 text-stone-900 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <textarea
                required
                rows={3}
                placeholder="What styling details resonated with you most?"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full bg-white border border-[#D4AF37]/20 rounded-none text-xs p-3 text-stone-900 focus:outline-none focus:border-[#D4AF37]"
              ></textarea>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#1A1A1A] hover:bg-[#D4AF37] text-white font-semibold text-xs tracking-wider uppercase px-4 py-2 cursor-pointer transition disabled:opacity-50"
              >
                {isSubmitting ? "Postings..." : "Post Reflection"}
              </button>
            </form>

            {/* Comments Lists */}
            {comments.length === 0 ? (
              <p className="text-stone-400 font-serif italic text-xs">No entries posted yet. Be the first to start the styling conversation!</p>
            ) : (
              <div className="space-y-4">
                {comments.map(co => (
                  <div key={co.id} className="border-b border-stone-150 pb-4 text-xs leading-relaxed">
                    <div className="flex justify-between items-center mb-1 text-stone-500">
                      <span className="font-bold text-stone-850">{co.authorName}</span>
                      <span className="font-mono text-[9px]">{new Date(co.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-stone-650 italic pl-2 border-l border-stone-300 font-serif">"{co.content}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Floating Utilities Right Column (4/12) */}
        <div className="lg:col-span-4 space-y-12 lg:sticky lg:top-24">
          
          {/* Table of Contents (Vogue styling helper) */}
          {tocItems.length > 0 && (
            <div className="border border-[#D4AF37]/20 bg-white p-6 rounded-none" id="table-of-contents-box">
              <h4 className="font-serif text-xs font-semibold tracking-wider uppercase text-stone-900 border-b border-[#D4AF37]/20 pb-2 mb-4">
                In This Editorial
              </h4>
              <nav className="space-y-2.5 text-xs text-stone-600">
                {tocItems.map((item, i) => (
                  <a
                    href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                    key={i}
                    onClick={(e) => {
                      e.preventDefault();
                      // Find direct H2 containing text
                      const headings = Array.from(document.querySelectorAll("#editorial-body h2"));
                      const matchHeading = headings.find(h => h.textContent?.includes(item));
                      if (matchHeading) {
                        matchHeading.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className="block font-serif hover:text-[#D4AF37] transition truncate cursor-pointer"
                  >
                    0{i+1}. {item}
                  </a>
                ))}
              </nav>
            </div>
          )}

          {/* Social Engagement and Pinterest Quick Tools */}
          <div className="border border-[#D4AF37]/20 bg-[#FAF9F6] p-6 rounded-none" id="social-engagement-box">
            <h4 className="font-serif text-xs font-semibold tracking-wider uppercase text-[#1A1A1A] border-b border-[#D4AF37]/20 pb-2 mb-4">
              Reader Engagement
            </h4>
            
            {/* Quick Copy Link */}
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={copyArticleLink}
                className="flex-1 bg-white border border-[#D4AF37]/20 hover:border-[#D4AF37] rounded-none text-[11px] font-mono py-2 flex items-center justify-center gap-2 text-stone-700 transition cursor-pointer"
              >
                <Clipboard className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span>{linkCopied ? "LINK COPIED TO CLIPBOARD!" : "COPY ARTICLE SECURE LINK"}</span>
              </button>
            </div>

            {/* Reactions Counts */}
            <div className="grid grid-cols-3 gap-3 text-center mb-6">
              
              <button
                onClick={() => handleReaction('love')}
                className={`py-3 px-1 border rounded-none flex flex-col items-center justify-center cursor-pointer transition ${
                  hasLoved ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-[#D4AF37]/10 hover:border-[#D4AF37]'
                }`}
              >
                <Heart className={`h-4 w-4 ${hasLoved ? 'fill-red-650' : ''}`} />
                <span className="font-bold text-xs mt-1.5">{reactions.love}</span>
                <span className="text-[8px] font-mono uppercase text-stone-400">LOVE</span>
              </button>

              <button
                onClick={() => handleReaction('insight')}
                className={`py-3 px-1 border rounded-none flex flex-col items-center justify-center cursor-pointer transition ${
                  hasInsight ? 'bg-amber-50 border-amber-200 text-[#D4AF37]' : 'bg-white border-[#D4AF37]/10 hover:border-[#D4AF37]'
                }`}
              >
                <Clock className="h-4 w-4 text-[#D4AF37]" />
                <span className="font-bold text-xs mt-1.5">{reactions.insight}</span>
                <span className="text-[8px] font-mono uppercase text-[#D4AF37]">INSIGHT</span>
              </button>

              <button
                onClick={() => handleReaction('clap')}
                className={`py-3 px-1 border rounded-none flex flex-col items-center justify-center cursor-pointer transition ${
                  hasClapped ? 'bg-[#FAF9F6] border-[#D4AF37]/30 text-[#D4AF37]' : 'bg-white border-[#D4AF37]/10 hover:border-[#D4AF37]'
                }`}
              >
                <Bookmark className={`h-4 w-4 ${hasClapped ? 'fill-[#D4AF37]' : ''}`} />
                <span className="font-bold text-xs mt-1.5">{reactions.clap}</span>
                <span className="text-[8px] font-mono uppercase text-stone-400">CLAP</span>
              </button>

            </div>

            {/* Pinterest Share Button */}
            <div className="space-y-2">
              <button
                onClick={notifyPinterestPin}
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-none font-bold text-xs py-2.5 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>📌 Save to Pinterest Board</span>
              </button>
              <p className="text-[9px] font-mono text-stone-405 leading-normal text-center text-stone-550">
                Includes rich pin description metadata, optimizing search traffic back to Veloura Cover pages.
              </p>
            </div>
          </div>

          {/* Author biography presentation panel */}
          <div className="border border-[#D4AF37]/20 bg-white p-6 rounded-none" id="author-column-sidebar">
            <h4 className="font-serif text-xs font-semibold tracking-wider uppercase text-stone-900 mb-4 pb-2 border-b border-[#D4AF37]/20">
              The Writer Profile
            </h4>
            <div className="flex gap-4 items-center mb-3">
              <img
                src={article.author.avatar}
                alt={article.author.name}
                referrerPolicy="no-referrer"
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <span className="font-serif text-sm font-bold block text-stone-850">{article.author.name}</span>
                <span className="text-[10px] uppercase tracking-widest font-mono text-[#D4AF37]">Editor-at-large</span>
              </div>
            </div>
            <p className="text-stone-500 text-xs leading-relaxed font-serif italic text-justify">
              "{article.author.bio}"
            </p>
          </div>

          {/* Related articles */}
          {relatedArticles.length > 0 && (
            <div className="border border-[#D4AF37]/20 bg-white p-6 rounded-none" id="related-articles-box">
              <h4 className="font-serif text-xs font-semibold tracking-wider uppercase text-stone-900 border-b border-[#D4AF37]/20 pb-2 mb-4">
                You Might Also Adore
              </h4>
              <div className="space-y-4">
                {relatedArticles.slice(0, 2).map(ra => (
                  <div key={ra.id} className="group border-b border-stone-100 pb-3 last:border-0 last:pb-0">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#D4AF37] block mb-0.5">{ra.category}</span>
                    <h5 
                      onClick={() => onSelectArticle(ra)}
                      className="text-xs font-bold leading-snug hover:text-[#D4AF37] cursor-pointer transition limit-lines-2"
                    >
                      {ra.title}
                    </h5>
                    <p className="text-[11px] text-stone-400 mt-1 truncate">{ra.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </article>

    </div>
  );
}
