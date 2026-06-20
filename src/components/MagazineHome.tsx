import React, { useState } from 'react';
import { Article, CATEGORIES } from '../types';
import { Search, Heart, MessageSquare, CornerUpRight, Bookmark, ArrowRight, BookOpen, ExternalLink, Calendar } from 'lucide-react';

interface MagazineHomeProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  savedBookmarks: string[];
  onToggleBookmark: (id: string) => void;
  onSubscribe: () => void;
  onTrackEvent: (eventType: string, value?: string) => void;
  onNavigateToContact: () => void;
}

export default function MagazineHome({
  articles,
  onSelectArticle,
  savedBookmarks,
  onToggleBookmark,
  onSubscribe,
  onTrackEvent,
  onNavigateToContact
}: MagazineHomeProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [emailText, setEmailText] = useState("");
  const [subscribedMessage, setSubscribedMessage] = useState("");

  const publishedArticles = articles.filter(a => a.status === 'published');

  // Filter criteria search + categories
  const filteredArticles = publishedArticles.filter(art => {
    const matchesCategory = selectedCategory === "All" || art.category === selectedCategory;
    const matchesSearch = 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  // Featured article is the first published article
  const featuredArticle = publishedArticles[0];
  
  // Trending contains articles sorted by views
  const trendingArticles = [...publishedArticles]
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);

  // Editor's picks are other articles except the main featured
  const editorsPicks = publishedArticles.filter(a => a.id !== featuredArticle?.id).slice(0, 3);

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailText.trim()) return;
    onTrackEvent("subscribe");
    setSubscribedMessage("Thank you! Welcome to the inner circle. Your exclusive lookbook is on its way.");
    setEmailText("");
    onSubscribe();
  };

  const notifyPinterestPin = (art: Article) => {
    onTrackEvent("pinterest", art.title);
    alert(`📌 Pinterest Saved!\nTitle: ${art.title}\nPin Description: ${art.pinDescription || art.summary}`);
  };

  return (
    <div className="w-full bg-[#FAF9F6] text-[#1A1A1A]" id="magazine-home">
      
      {/* Editorial Header Logo Strip */}
      <div className="border-b border-[#D4AF37]/20 bg-[#FAF9F6] py-12 text-center" id="magazine-logo-header">
        <p className="font-serif tracking-[0.4em] text-xs uppercase text-stone-500 mb-2">The Style Heritage & Design Curation</p>
        <h1 className="font-serif text-5xl md:text-7xl font-light tracking-[0.15em] text-[#1A1A1A] italic lowercase select-none">
          veloura <span className="font-normal font-sans tracking-[0.05em] not-italic uppercase text-3xl md:text-5xl border-l border-stone-350 pl-2 lg:pl-4">wear</span>
        </h1>
        <div className="h-[2px] bg-[#1A1A1A] w-32 mx-auto mt-6 mb-2"></div>
        <p className="font-mono text-[10px] tracking-widest text-[#D4AF37] uppercase">Vogue Est. 2026 // Paris · Milan · New York</p>
      </div>

      {/* Hero Featured Article (Large Magazine Format) */}
      {featuredArticle && selectedCategory === "All" && !searchQuery && (
        <section className="border-b border-[#D4AF37]/20 bg-white" id="magazine-hero">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              <div className="lg:col-span-7 select-none relative group overflow-hidden">
                <img
                  src={featuredArticle.featuredImage || "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=1200"}
                  alt={featuredArticle.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-[380px] md:h-[500px] object-cover filter brightness-[0.96] hover:scale-105 transition-transform duration-1000 ease-out cursor-pointer"
                  onClick={() => onSelectArticle(featuredArticle)}
                />
                {featuredArticle.isSponsored && (
                  <span className="absolute top-4 left-4 bg-[#1A1A1A]/95 text-white text-[10px] uppercase font-mono tracking-widest px-3 py-1">
                    SPONSORED EDITORIAL
                  </span>
                )}
                <span className="absolute bottom-4 left-4 bg-[#D4AF37] text-white text-[10px] uppercase font-mono tracking-widest px-3 py-1">
                  {featuredArticle.category}
                </span>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-center">
                <p className="text-xs font-mono tracking-widest text-[#D4AF37] uppercase mb-3">
                  Featured Cover Story · {featuredArticle.readTime} min read
                </p>
                <h2 
                  onClick={() => onSelectArticle(featuredArticle)}
                  className="font-serif text-3xl md:text-4xl lg:text-5xl font-light leading-snug tracking-tight text-[#1A1A1A] hover:text-[#D4AF37] transition duration-350 cursor-pointer"
                >
                  {featuredArticle.title}
                </h2>
                <p className="mt-4 text-stone-600 text-sm md:text-base leading-relaxed tracking-wide">
                  {featuredArticle.summary}
                </p>

                <div className="flex items-center gap-3 mt-6 pb-6 border-b border-[#D4AF37]/15">
                  <img
                    src={featuredArticle.author.avatar}
                    alt={featuredArticle.author.name}
                    referrerPolicy="no-referrer"
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <div>
                    <span className="text-xs font-serif font-bold text-[#1A1A1A] block">
                      {featuredArticle.author.name}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      {new Date(featuredArticle.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => onSelectArticle(featuredArticle)}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1A1A1A] hover:text-[#D4AF37] group cursor-pointer transition"
                  >
                    <span>Read Full Editorial</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleBookmark(featuredArticle.id)}
                      className="text-stone-400 hover:text-[#1A1A1A] p-2 cursor-pointer transition"
                      title="Bookmark Article"
                    >
                      <Bookmark className={`h-4 w-4 ${savedBookmarks.includes(featuredArticle.id) ? 'fill-[#1A1A1A] text-[#1A1A1A]' : ''}`} />
                    </button>
                    <button
                      onClick={() => notifyPinterestPin(featuredArticle)}
                      className="bg-red-600 text-white rounded-full p-1.5 hover:bg-red-750 transition flex items-center gap-1 cursor-pointer font-bold text-[10px] px-3.5 py-1"
                      title="Save to Pinterest"
                    >
                      <span>📌 Save</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* Main Magazine Feed Navigation Filters & Sticky Search Bar */}
      <section className="bg-white border-b border-[#D4AF37]/25 py-6 sticky top-0 z-30 shadow-xs" id="magazine-filters">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Categories Tab Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1 md:pb-0 font-serif">
            <button
              onClick={() => {
                setSelectedCategory("All");
                onTrackEvent("category", "All");
              }}
              className={`text-xs uppercase tracking-widest px-3 py-1.5 border transition duration-350 shrink-0 cursor-pointer ${
                selectedCategory === "All"
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                  : "bg-[#FAF9F6] text-stone-600 border-[#D4AF37]/30 hover:border-[#D4AF37]"
              }`}
            >
              All Articles
            </button>
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  onTrackEvent("category", category);
                }}
                className={`text-xs uppercase tracking-widest px-3 py-1.5 border transition duration-350 shrink-0 cursor-pointer ${
                  selectedCategory === category
                    ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                    : "bg-[#FAF9F6] text-stone-600 border-[#D4AF37]/30 hover:border-[#D4AF37]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trends or tips..."
              className="w-full bg-[#FAF9F6] border border-[#D4AF37]/20 rounded-none px-4 py-1.5 pl-9 text-xs focus:outline-none focus:bg-white focus:border-[#D4AF37] text-stone-900"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#D4AF37]" />
          </div>

        </div>
      </section>

      {/* Grid of Articles - Pinterest Friendly Layout */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-12" id="magazine-grid">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Grid Content Col (8 of 12) */}
          <div className="lg:col-span-8">
            <p className="font-serif italic text-stone-500 uppercase tracking-widest text-xs mb-6 font-semibold pb-2 border-b border-[#D4AF37]/20">
              {selectedCategory !== "All" ? `${selectedCategory} Collection` : "Latest Publications"} ({filteredArticles.length})
            </p>

            {filteredArticles.length === 0 ? (
              <div className="text-center py-20 bg-white border border-[#D4AF37]/25 rounded-none">
                <p className="font-serif italic text-stone-500 mb-2">No editorial matches found</p>
                <p className="text-xs text-stone-400">Try broadening your target keywords or select another collection.</p>
                <button
                  onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
                  className="mt-4 bg-[#1A1A1A] text-amber-50 hover:bg-stone-850 text-xs tracking-wider uppercase px-4 py-2"
                >
                  Reset Filtering
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                {filteredArticles.map(art => (
                  <article 
                    key={art.id} 
                    className="bg-white border border-[#D4AF37]/20 overflow-hidden hover:shadow-xs transition-shadow duration-300 flex flex-col justify-between"
                  >
                    
                    {/* Cover Photo */}
                    <div className="aspect-[4/3] relative overflow-hidden group select-none">
                      <img
                        src={art.featuredImage}
                        alt={art.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover filter brightness-[0.98] group-hover:scale-105 transition-transform duration-700"
                      />
                      <span className="absolute top-3 left-3 bg-[#1A1A1A]/95 text-stone-100 font-mono text-[9px] tracking-widest uppercase px-2 py-0.5">
                        {art.category}
                      </span>
                      {art.isSponsored && (
                        <span className="absolute top-3 right-3 bg-[#1A1A1A] text-amber-200 font-mono text-[8px] tracking-widest px-2 py-0.5">
                          AD
                        </span>
                      )}
                    </div>

                    {/* Meta/Summary Info */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400 uppercase tracking-widest mb-2.5">
                          <BookOpen className="h-3.5 w-3.5 stroke-[1.5] text-[#D4AF37]" />
                          <span>{art.readTime} min read</span>
                          <span>·</span>
                          <span>{art.views} Views</span>
                        </div>

                        <h3 
                          onClick={() => onSelectArticle(art)}
                          className="font-serif text-lg font-bold text-[#1A1A1A] leading-snug tracking-tight hover:text-[#D4AF37] transition-colors duration-250 cursor-pointer limit-lines-2"
                        >
                          {art.title}
                        </h3>

                        <p className="mt-2 text-stone-600 text-xs leading-relaxed tracking-wide limit-lines-3">
                          {art.summary}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-[#D4AF37]/15 flex items-center justify-between">
                        <span className="text-[10px] font-serif font-bold text-stone-700 italic">By {art.author.name}</span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onToggleBookmark(art.id)}
                            className="p-1 hover:text-[#1A1A1A] transition text-stone-400"
                            title="Bookmark"
                          >
                            <Bookmark className={`h-3.5 w-3.5 ${savedBookmarks.includes(art.id) ? 'fill-[#1A1A1A] text-[#1A1A1A]' : ''}`} />
                          </button>
                          <button
                            onClick={() => notifyPinterestPin(art)}
                            className="bg-red-600 text-white rounded px-2 py-0.5 hover:bg-red-750 transition flex items-center gap-0.5 font-bold text-[9px]"
                            title="Save"
                          >
                            <span>📌 Save</span>
                          </button>
                        </div>
                      </div>

                    </div>

                  </article>
                ))}
              </div>
            )}

            {/* Google AdSense Integration (Minimalist & Premium Brand Advertisement) */}
            <div className="mt-12 select-none border border-[#D4AF37]/20 bg-[#FAF9F6] p-8 text-center rounded-none relative" id="adsense-slot-1">
              <span className="absolute top-2 right-2 text-[8px] uppercase tracking-widest font-mono text-stone-400">Sponsored Luxe AdS</span>
              <p className="font-serif tracking-widest text-[10px] uppercase text-[#D4AF37] mb-1">Couture Horizon 2026</p>
              <h4 className="font-serif text-xl sm:text-2xl tracking-wide font-light uppercase text-[#1A1A1A] italic">"Simplicity is the keynote of all true elegance."</h4>
              <p className="font-mono text-[9px] text-stone-400 uppercase mt-2">Explore the new Cruise collection at Chanel boutiques worldwide</p>
              <a href="#chanel-spot" className="inline-block mt-4 text-[10px] font-bold tracking-widest uppercase text-[#1A1A1A] border-b border-[#1A1A1A] pb-0.5 hover:text-[#D4AF37] hover:border-[#D4AF37] transition ml-1">
                discover boutiques
              </a>
            </div>

               {/* Sidebar Content Col (4 of 12) */}
          <div className="lg:col-span-4 space-y-12">
            
            {/* Elegant Newsletter Signup */}
            <div className="bg-[#1A1A1A] p-6 md:p-8 border border-[#D4AF37]/25" id="newsletter-sidebar">
              <p className="text-[9px] font-mono tracking-widest uppercase text-[#D4AF37] mb-1">Maison Membership</p>
              <h4 className="font-serif text-2xl font-light uppercase tracking-wide text-white">The Daily Veloura</h4>
              <p className="text-xs text-stone-300 mt-2 leading-relaxed tracking-wide">
                Join our premium VIP circle of 12,000+ fashion aficionados. Get weekly styling formulas, trend forecasts, and boutique lookbooks directly in your inbox.
              </p>

              <form onSubmit={handleSubscribeSubmit} className="mt-6 space-y-3">
                <input
                  type="email"
                  required
                  placeholder="name@exclusive.com"
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  className="w-full bg-[#FAF9F6] text-[#1A1A1A] border border-[#D4AF37]/25 px-4 py-2.5 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="submit"
                  className="w-full bg-[#D4AF37] text-white text-xs font-bold tracking-widest uppercase hover:bg-[#B8962E] transition py-2.5 cursor-pointer"
                >
                  Request Invite
                </button>
              </form>
              {subscribedMessage && (
                <p className="mt-3 text-[10px] text-amber-200 leading-snug">{subscribedMessage}</p>
              )}
            </div>

            {/* Trending Articles List */}
            <div className="border border-[#D4AF37]/20 p-6 bg-white" id="trending-sidebar">
              <h4 className="font-serif text-md tracking-wider uppercase border-b border-[#D4AF37]/20 pb-3 mb-4 text-[#1A1A1A]">Trending Now</h4>
              <div className="space-y-4">
                {trendingArticles.map((art, index) => (
                  <div key={art.id} className="flex gap-4 items-center group">
                    <span className="font-serif italic font-light text-2xl text-[#D4AF37] min-w-8">0{index + 1}</span>
                    <div className="flex-1">
                      <span className="text-[9px] font-mono tracking-wider uppercase text-stone-400 block mb-0.5">{art.category}</span>
                      <h5 
                        onClick={() => onSelectArticle(art)}
                        className="text-xs font-bold leading-snug text-[#1A1A1A] hover:text-[#D4AF37] transition duration-250 cursor-pointer limit-lines-2"
                      >
                        {art.title}
                      </h5>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* E-Commerce Digital Lookbook Selling (Highly curated monetization) */}
            <div className="border border-[#D4AF37]/20 bg-amber-50/50 p-6" id="digital-shop-sidebar">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[9px] font-mono text-[#D4AF37] tracking-widest uppercase">Digital Lookbooks</p>
                <span className="bg-[#D4AF37]/20 text-stone-800 font-mono text-[9px] px-2 py-0.5 font-bold">$9.90</span>
              </div>
              <h4 className="font-serif text-lg font-light uppercase text-stone-900">Autumnal Dressage Formula</h4>
              <p className="text-xs text-stone-600 mt-1 lines-2 leading-relaxed">
                40 detailed, beautiful look equations and visual flatlays for mid-season warmth styling. High Resolution. Includes 20 printable luxury checklist sheets.
              </p>
              <button 
                onClick={() => {
                  onTrackEvent("affiliate", "Lookbook Sale");
                  alert("🛍️ Digital Delivery System Activated!\nYour credit cards will render inside Stripe sandbox securely in future updates.");
                }}
                className="w-full mt-4 bg-[#1A1A1A] hover:bg-stone-850 text-white text-xs font-semibold py-2 tracking-widest uppercase transition cursor-pointer"
              >
                Purchase lookbook (instant PDF)
              </button>
            </div>

            {/* Editorial Board Letter */}
            <div className="p-6 bg-white border border-[#D4AF37]/20 text-stone-700" id="editor-notes-sidebar">
              <h4 className="font-serif text-md tracking-wider uppercase text-stone-900 border-b border-[#D4AF37]/20 pb-3 mb-3">Writer's Note</h4>
              <p className="text-stone-500 font-serif italic text-xs leading-relaxed">
                "Fashion is not simply garments. It is an intricate dialogue between structural architecture and raw posture. At Veloura Wear, we aim to deliver luxury education that empowers modern women worldwide to curate with intent."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150"
                  alt="Eléonore Dubois"
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full object-cover grayscale"
                />
                <div>
                  <span className="text-[10px] font-bold block text-stone-850">Eléonore Dubois</span>
                  <span className="text-[8px] font-mono text-stone-400 uppercase">Editor-In-Chief</span>
                </div>
              </div>
            </div>

          </div>

          </div>

        </div>
      </section>

      {/* Magazine Footer */}
      <footer className="bg-[#1A1A1A] text-stone-100 py-16 border-t border-[#D4AF37]/25 mt-12" id="magazine-footer">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-sm">
            
            <div className="md:col-span-2 space-y-4">
              <h4 className="font-serif text-2xl tracking-widest italic text-white lowercase">veloura <span className="font-sans font-normal uppercase not-italic text-sm text-[#D4AF37]">wear</span></h4>
              <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
                Veloura Wear is a premium luxury fashion magazine and blogging ecosystem focusing on style philosophy, beauty strategies, and classic silhouette education designed for Pinterest curators and modern trend-setters.
              </p>
            </div>

            <div>
              <h5 className="font-mono text-xs uppercase tracking-widest text-[#D4AF37] mb-4">The Collections</h5>
              <div className="flex flex-col gap-2.5 text-xs text-stone-400">
                <button onClick={() => { setSelectedCategory("Fashion Tips"); window.scrollTo({top: 400, behavior: 'smooth'}); }} className="hover:text-white transition text-left cursor-pointer">Fashion Tips</button>
                <button onClick={() => { setSelectedCategory("Style Guides"); window.scrollTo({top: 400, behavior: 'smooth'}); }} className="hover:text-white transition text-left cursor-pointer">Style Guides</button>
                <button onClick={() => { setSelectedCategory("Wardrobe Essentials"); window.scrollTo({top: 400, behavior: 'smooth'}); }} className="hover:text-white transition text-left cursor-pointer">Wardrobe Essentials</button>
                <button onClick={() => { setSelectedCategory("Beauty Tips"); window.scrollTo({top: 400, behavior: 'smooth'}); }} className="hover:text-white transition text-left cursor-pointer">Beauty Tips</button>
              </div>
            </div>

            <div>
              <h5 className="font-mono text-xs uppercase tracking-widest text-[#D4AF37] mb-4">Veloura Corporate</h5>
              <div className="flex flex-col gap-2.5 text-xs text-stone-400">
                <a href="#about" className="hover:text-white transition">About Our Heritage</a>
                <a href="#press" className="hover:text-white transition">Vogue Editorial Room</a>
                <button onClick={() => onNavigateToContact()} className="hover:text-white transition text-left cursor-pointer">Contact Us</button>
                <a href="#affiliate" className="hover:text-white transition">Affiliate Disclosure</a>
                <a href="#privacy" className="hover:text-white transition">Privacy Policy (GDPR)</a>
              </div>
            </div>

          </div>

          <div className="border-t border-stone-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-stone-500">
            <p>© 2026 Veloura Wear Magazine. Built with premium custom layout assets. All Rights Reserved.</p>
            <p className="font-mono tracking-widest text-[#D4AF37] text-[10px] mt-4 sm:mt-0 uppercase">elegant typography system paired with Inter Sans</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
