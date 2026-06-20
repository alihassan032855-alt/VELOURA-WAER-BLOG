import { useState, useEffect } from 'react';
import { Article } from './types';
import MagazineHome from './components/MagazineHome';
import ArticleDetail from './components/ArticleDetail';
import StudioDashboard from './components/StudioDashboard';
import AdminDashboard from './components/AdminDashboard';
import ContactPage from './components/ContactPage';
import SEOHeader from './components/SEOHeader';
import { Sparkles, BookOpen, PenTool, LayoutDashboard, Bookmark, X, Search, Heart, Clock, Menu } from 'lucide-react';

export default function App() {
  // Navigation states
  const [currentTab, setCurrentTab] = useState<'home' | 'reader' | 'studio' | 'admin' | 'contact'>('home');
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  
  // Administrative gates protection
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("veloura_authenticated") === "true";
  });
  
  // Articles data state
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Client bookmarks (local persistence)
  const [savedBookmarks, setSavedBookmarks] = useState<string[]>([]);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);

  // Load articles
  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/articles");
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (err) {
      console.error("Error fetching articles:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
    
    // Load local bookmarks
    const localSaved = localStorage.getItem("veloura_saved_slugs");
    if (localSaved) {
      setSavedBookmarks(JSON.parse(localSaved));
    }

    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#studio-admin' || hash === '#studio' || hash === '#admin') {
        setCurrentTab(hash === '#admin' ? 'admin' : 'studio');
        setActiveArticle(null);
      } else if (hash === '#contact') {
        setCurrentTab('contact');
        setActiveArticle(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleToggleBookmark = (id: string) => {
    let updated;
    if (savedBookmarks.includes(id)) {
      updated = savedBookmarks.filter(bId => bId !== id);
    } else {
      updated = [...savedBookmarks, id];
    }
    setSavedBookmarks(updated);
    localStorage.setItem("veloura_saved_slugs", JSON.stringify(updated));
    trackActivityEvent("bookmark", id);
  };

  const trackActivityEvent = async (eventType: string, value?: string) => {
    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, value })
      });
    } catch (err) {
      console.error("Error tracking event:", err);
    }
  };

  const selectArticleToRead = (art: Article) => {
    setActiveArticle(art);
    setCurrentTab('reader');
  };

  // Pre-filter bookmark items that are fully published
  const bookmarkedArticles = articles.filter(art => savedBookmarks.includes(art.id) && art.status === 'published');

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans selection:bg-[#D4AF37]/30 selection:text-[#1A1A1A]" id="veloura-app-view">
      
      {/* Dynamic SEO Injector script to header */}
      <SEOHeader article={activeArticle || undefined} />

      {/* Luxury Editorial Header Navigation matching Editorial Aesthetic */}
      <header className="h-20 flex items-center justify-between px-4 lg:px-10 border-b border-[#D4AF37]/20 bg-[#FAF9F6] text-[#1A1A1A] z-40 relative" id="header-topbar-strip">
        {/* Left Side: Global Tab Switching Controls */}
        <nav className="flex items-center gap-4 lg:gap-6 text-[10px] uppercase tracking-[0.2em] font-medium font-sans">
          <button
            onClick={() => {
              setCurrentTab('home');
              setActiveArticle(null);
              trackActivityEvent("tab_switch", "home");
            }}
            className={`flex items-center gap-1.5 transition pb-1 border-b cursor-pointer ${
              currentTab === 'home' || currentTab === 'reader'
                ? 'text-[#D4AF37] border-[#D4AF37] font-bold'
                : 'text-[#1A1A1A]/60 border-transparent hover:text-[#1A1A1A]'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Magazine</span>
          </button>

          {isAuthenticated && (
            <>
              <button
                onClick={() => {
                  setCurrentTab('studio');
                  setActiveArticle(null);
                  trackActivityEvent("tab_switch", "studio");
                }}
                className={`flex items-center gap-1.5 transition pb-1 border-b cursor-pointer ${
                  currentTab === 'studio'
                    ? 'text-[#D4AF37] border-[#D4AF37] font-bold'
                    : 'text-[#1A1A1A]/60 border-transparent hover:text-[#1A1A1A]'
                }`}
              >
                <PenTool className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Writer's Studio</span>
              </button>

              <button
                onClick={() => {
                  setCurrentTab('admin');
                  setActiveArticle(null);
                  trackActivityEvent("tab_switch", "admin");
                }}
                className={`flex items-center gap-1.5 transition pb-1 border-b cursor-pointer ${
                  currentTab === 'admin'
                    ? 'text-[#D4AF37] border-[#D4AF37] font-bold'
                    : 'text-[#1A1A1A]/60 border-transparent hover:text-[#1A1A1A]'
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">HQ Dashboard</span>
              </button>
            </>
          )}
        </nav>

        {/* Center: Absolute center header logo on large layouts */}
        <div className="text-xl sm:text-2xl md:text-3xl tracking-[0.25em] font-serif font-bold uppercase cursor-pointer select-none" onClick={() => { setCurrentTab('home'); setActiveArticle(null); }}>
          Veloura <span className="text-[#D4AF37]">Wear</span>
        </div>

        {/* Right Side: Quick access Saves & Curation details */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBookmarkModalOpen(true)}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-[#D4AF37] hover:bg-[#B8962E] text-white px-3 py-2 transition font-bold cursor-pointer"
            title="View Saves"
          >
            <Bookmark className="h-3.5 w-3.5 fill-current" />
            <span>Saves ({savedBookmarks.length})</span>
          </button>
        </div>
      </header>

      {/* Tab Contents Layout Selection Router */}
      <main className="flex-1" id="tab-router-viewport">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-4">
            <div className="h-10 w-10 border-4 border-stone-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-mono text-xs text-stone-400 uppercase tracking-widest">Inaugurating Veloura Wear Heritage Suite...</p>
          </div>
        ) : (
          <>
            {/* Magazine Frontpage Catalog */}
            {currentTab === 'home' && (
              <MagazineHome
                articles={articles}
                onSelectArticle={selectArticleToRead}
                savedBookmarks={savedBookmarks}
                onToggleBookmark={handleToggleBookmark}
                onSubscribe={() => trackActivityEvent("subscribe_newsletter")}
                onTrackEvent={trackActivityEvent}
                onNavigateToContact={() => {
                  setCurrentTab('contact');
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }}
              />
            )}

            {/* Individual Article Reader Panel */}
            {currentTab === 'reader' && activeArticle && (
              <ArticleDetail
                article={activeArticle}
                onBack={() => {
                  setCurrentTab('home');
                  setActiveArticle(null);
                }}
                savedBookmarks={savedBookmarks}
                onToggleBookmark={handleToggleBookmark}
                relatedArticles={articles.filter(a => a.category === activeArticle.category && a.id !== activeArticle.id)}
                onSelectArticle={selectArticleToRead}
                onTrackEvent={trackActivityEvent}
              />
            )}

            {/* Writer's blog CMS controls */}
            {currentTab === 'studio' && (
              !isAuthenticated ? (
                <div className="w-full bg-[#FAF9F6] py-20 px-4 flex justify-center items-center font-sans">
                  <div className="bg-white border border-[#D4AF37]/25 p-8 max-w-md w-full rounded-none">
                    <div className="text-center mb-6">
                      <Sparkles className="h-6 w-6 text-[#D4AF37] mx-auto mb-2" />
                      <h3 className="font-serif text-lg uppercase tracking-widest text-[#1A1A1A]">Maison Studio Gate</h3>
                      <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider font-mono">Restricted Editorial Access</p>
                    </div>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const val = (e.currentTarget.elements.namedItem('passwd') as HTMLInputElement).value;
                      if (val === 'hafizabad') {
                        setIsAuthenticated(true);
                        sessionStorage.setItem("veloura_authenticated", "true");
                      } else {
                        alert('Access Denied: Incorrect password.');
                      }
                    }} className="space-y-4">
                      <div>
                        <label className="block text-[10px] uppercase font-mono tracking-widest text-[#1A1A1A]/70 mb-1.5">Enter Security Passkey</label>
                        <input name="passwd" type="password" required className="w-full bg-[#FAF9F6] border border-[#D4AF37]/20 rounded-none px-4 py-2 text-xs focus:outline-none focus:border-[#D4AF37]" placeholder="•••••••••" />
                      </div>
                      <button type="submit" className="w-full bg-[#D4AF37] text-white font-bold text-xs uppercase py-2 tracking-widest cursor-pointer hover:bg-[#B8962E] transition rounded-none">Verify credentials</button>
                    </form>
                  </div>
                </div>
              ) : (
                <StudioDashboard
                  articles={articles}
                  onRefreshArticles={loadArticles}
                  onTrackEvent={trackActivityEvent}
                />
              )
            )}

            {/* Executive HQ metrics panel */}
            {currentTab === 'admin' && (
              !isAuthenticated ? (
                <div className="w-full bg-[#FAF9F6] py-20 px-4 flex justify-center items-center font-sans">
                  <div className="bg-white border border-[#D4AF37]/25 p-8 max-w-md w-full rounded-none">
                    <div className="text-center mb-6">
                      <LayoutDashboard className="h-6 w-6 text-[#D4AF37] mx-auto mb-2" />
                      <h3 className="font-serif text-lg uppercase tracking-widest text-[#1A1A1A]">Maison HQ Gate</h3>
                      <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider font-mono">Restricted HQ Analytics Access</p>
                    </div>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const val = (e.currentTarget.elements.namedItem('passwd') as HTMLInputElement).value;
                      if (val === 'hafizabad') {
                        setIsAuthenticated(true);
                        sessionStorage.setItem("veloura_authenticated", "true");
                      } else {
                        alert('Access Denied: Incorrect password.');
                      }
                    }} className="space-y-4">
                      <div>
                        <label className="block text-[10px] uppercase font-mono tracking-widest text-[#1A1A1A]/70 mb-1.5">Enter Security Passkey</label>
                        <input name="passwd" type="password" required className="w-full bg-[#FAF9F6] border border-[#D4AF37]/20 rounded-none px-4 py-2 text-xs focus:outline-none focus:border-[#D4AF37]" placeholder="•••••••••" />
                      </div>
                      <button type="submit" className="w-full bg-[#D4AF37] text-white font-bold text-xs uppercase py-2 tracking-widest cursor-pointer hover:bg-[#B8962E] transition rounded-none">Verify credentials</button>
                    </form>
                  </div>
                </div>
              ) : (
                <AdminDashboard
                  articles={articles}
                  onRefreshArticles={loadArticles}
                  onTrackEvent={trackActivityEvent}
                />
              )
            )}

            {/* Contact page */}
            {currentTab === 'contact' && (
              <ContactPage />
            )}
          </>
        )}
      </main>

      {/* BOOKMARK DRAWER / DIALOG (Client local saves catalog overlay) */}
      {isBookmarkModalOpen && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex justify-end" id="saves-modal-overlay">
          <div className="bg-white w-full max-w-md h-full p-8 flex flex-col justify-between shadow-2xl overflow-y-auto">
            
            <div>
              <div className="flex justify-between items-center border-b border-stone-200 pb-4 mb-6">
                <div>
                  <span className="text-[9px] font-mono tracking-widest uppercase text-[#D4AF37] block">My Curation Board</span>
                  <h3 className="font-serif text-xl font-light uppercase text-[#1A1A1A]">Bookmarked Editorials</h3>
                </div>
                <button
                  onClick={() => setIsBookmarkModalOpen(false)}
                  className="p-1 text-[#1A1A1A]/40 hover:text-[#1A1A1A] cursor-pointer transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {bookmarkedArticles.length === 0 ? (
                <div className="text-center py-16 text-[#1A1A1A]/40">
                  <Bookmark className="h-8 w-8 mx-auto stroke-1 mb-2.5 text-[#1A1A1A]/30" />
                  <p className="font-serif italic text-xs">Your personal look board is empty.</p>
                  <p className="text-[10px] text-[#1A1A1A]/50 mt-1">Tap the bookmark ribbon icon on any fashion post card to pin lookbooks here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookmarkedArticles.map(art => (
                    <div 
                      key={art.id} 
                      className="flex gap-4 p-3.5 border border-[#D4AF37]/25 hover:border-[#D4AF37]/40 bg-white rounded transition items-center"
                    >
                      <img
                        src={art.featuredImage}
                        alt={art.title}
                        referrerPolicy="no-referrer"
                        className="h-14 w-11 object-cover bg-stone-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[8px] font-mono text-[#D4AF37] uppercase tracking-wider block mb-0.5">{art.category}</span>
                        <h4 
                          onClick={() => {
                            setIsBookmarkModalOpen(false);
                            selectArticleToRead(art);
                          }}
                          className="font-serif text-xs font-bold leading-snug hover:text-[#D4AF37] transition cursor-pointer text-[#1A1A1A] truncate"
                        >
                          {art.title}
                        </h4>
                        <span className="text-[9px] font-mono block text-stone-400 mt-1">{art.readTime} min read estimate</span>
                      </div>
                      <button
                        onClick={() => handleToggleBookmark(art.id)}
                        className="text-stone-300 hover:text-red-700 p-1.5 transition text-[10px]"
                        title="Remove Bookmark"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-stone-200 pt-6 mt-6">
              <button
                onClick={() => setIsBookmarkModalOpen(false)}
                className="w-full bg-stone-900 hover:bg-stone-850 text-white font-semibold text-xs py-3 tracking-widest uppercase transition rounded-none cursor-pointer"
              >
                Close Curation Board
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
