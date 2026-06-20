import React, { useState, useEffect } from 'react';
import { Article, CATEGORIES, CategoryName, AffiliateProduct } from '../types';
import SEOChecker from './SEOChecker';
import { Upload, Import, Link, Check, AlertCircle, Sparkles, BookOpen, Clock, Heart, ArrowRight, Video, Trash2, Eye } from 'lucide-react';

interface StudioDashboardProps {
  articles: Article[];
  onRefreshArticles: () => void;
  onTrackEvent: (eventType: string, value?: string) => void;
}

export default function StudioDashboard({
  articles,
  onRefreshArticles,
  onTrackEvent
}: StudioDashboardProps) {
  // Blogger URL input state
  const [bloggerUrl, setBloggerUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Active document editing state
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formCategory, setFormCategory] = useState<CategoryName>("Fashion Tips");
  const [formTags, setFormTags] = useState("");
  const [formSeoTitle, setFormSeoTitle] = useState("");
  const [formSeoDescription, setFormSeoDescription] = useState("");
  const [formFeaturedImage, setFormFeaturedImage] = useState("");
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');
  const [formReadTime, setFormReadTime] = useState(4);
  const [formIsSponsored, setFormIsSponsored] = useState(false);
  const [formPinDescription, setFormPinDescription] = useState("");
  const [formAffiliateList, setFormAffiliateList] = useState<AffiliateProduct[]>([]);
  const [affTitle, setAffTitle] = useState("");
  const [affBrand, setAffBrand] = useState("");
  const [affPrice, setAffPrice] = useState("");
  const [affImage, setAffImage] = useState("");

  const [savingStatus, setSavingStatus] = useState("");

  // Select first article or default to new
  const loadArticleIntoForm = (art: Article) => {
    setSelectedArticleId(art.id);
    setFormTitle(art.title);
    setFormSlug(art.slug);
    setFormContent(art.content);
    setFormSummary(art.summary);
    setFormCategory(art.category as CategoryName);
    setFormTags(art.tags.join(", "));
    setFormSeoTitle(art.seoTitle || art.title);
    setFormSeoDescription(art.seoDescription || art.summary);
    setFormFeaturedImage(art.featuredImage);
    setFormStatus(art.status);
    setFormReadTime(art.readTime || 4);
    setFormIsSponsored(!!art.isSponsored);
    setFormPinDescription(art.pinDescription || "");
    setFormAffiliateList(art.affiliateProducts || []);
  };

  const createNewEmptyArticle = () => {
    setSelectedArticleId(null);
    setFormTitle("Untitled Editorial Draft");
    setFormSlug(`untitled-editorial-${Date.now()}`);
    setFormContent(`## Introduction\nType your opening here...\n\n## Styling The Silhouette\nOutline the specific design look formulas here...\n\n- Bullet point styling advice\n- Brand match list\n\n## Conclusion\nClosing design thoughts...`);
    setFormSummary("Add a brief SEO summaries overview here to capture user clicks.");
    setFormCategory("Fashion Tips");
    setFormTags("Style Guides, Wardrobe Essentials, Vogue Chic");
    setFormSeoTitle("Untitled Editorial | Veloura Wear");
    setFormSeoDescription("Add an engaging description under 160 characters.");
    setFormFeaturedImage("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200");
    setFormStatus("draft");
    setFormReadTime(4);
    setFormIsSponsored(false);
    setFormPinDescription("Discover structural styling advice and outfits equations on Veloura Wear. Pin to save to your look boards. #luxurystyles");
    setFormAffiliateList([]);
  };

  useEffect(() => {
    if (articles.length > 0 && selectedArticleId === null) {
      // Find latest edit or draft, else create new
      loadArticleIntoForm(articles[0]);
    }
  }, [articles]);

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloggerUrl.trim()) return;

    setIsImporting(true);
    setImportStatus(null);
    onTrackEvent("blogger_import", bloggerUrl);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: bloggerUrl })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setImportStatus({ success: true, message: `Blogger Article '${data.article.title}' crawled, enhanced and imported successfully into your drafts queue!` });
        onRefreshArticles();
        loadArticleIntoForm(data.article);
        setBloggerUrl("");
      } else {
        setImportStatus({ success: false, message: data.error || "Could not retrieve URL content. Try using another address." });
      }
    } catch (err: any) {
      setImportStatus({ success: false, message: `Fetcher error: ${err.message}` });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveOrPublish = async (overrideStatus?: 'draft' | 'published') => {
    const targetStatus = overrideStatus || formStatus;
    setSavingStatus("Saving edits to database...");

    const tagsArr = formTags.split(",").map(t => t.trim()).filter(t => t.length > 0);

    const articleData = {
      title: formTitle,
      slug: formSlug || formTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      content: formContent,
      summary: formSummary,
      category: formCategory,
      tags: tagsArr,
      seoTitle: formSeoTitle || formTitle,
      seoDescription: formSeoDescription || formSummary,
      featuredImage: formFeaturedImage,
      status: targetStatus,
      readTime: Number(formReadTime) || 3,
      isSponsored: formIsSponsored,
      pinDescription: formPinDescription || `A curated editorial look regarding ${formTitle} on Veloura Wear. #styleeducation`,
      affiliateProducts: formAffiliateList
    };

    try {
      let res;
      if (selectedArticleId && selectedArticleId.startsWith("art") || selectedArticleId?.startsWith("imported") || selectedArticleId?.startsWith("minimalist")) {
        // UPDATE existing
        res = await fetch(`/api/articles/${selectedArticleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(articleData)
        });
      } else {
        // CREATE new
        res = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(articleData)
        });
      }

      const data = await res.json();
      if (res.ok) {
        setSavingStatus("Saved successfully!");
        onRefreshArticles();
        if (!selectedArticleId) {
          loadArticleIntoForm(data);
        }
        setTimeout(() => setSavingStatus(""), 3000);
      } else {
        setSavingStatus(`Error: ${data.error || "Save failed"}`);
      }
    } catch (err: any) {
      setSavingStatus(`Save error: ${err.message}`);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Are you certain you wish to purge this editorial from the servers? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      if (res.ok) {
        onRefreshArticles();
        createNewEmptyArticle();
        alert("Purged successfully.");
      }
    } catch (error) {
      alert("Removal failed.");
    }
  };

  const addAffiliateProduct = () => {
    if (!affTitle.trim() || !affPrice.trim()) return;
    const newProd: AffiliateProduct = {
      id: `aff-${Date.now()}`,
      title: affTitle,
      brand: affBrand || "Atelier Paris",
      price: affPrice,
      image: affImage || formFeaturedImage || "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=400",
      url: "#"
    };

    setFormAffiliateList([...formAffiliateList, newProd]);
    setAffTitle("");
    setAffBrand("");
    setAffPrice("");
    setAffImage("");
  };

  const removeAffiliateProduct = (pId: string) => {
    setFormAffiliateList(formAffiliateList.filter(p => p.id !== pId));
  };

  const currentDraftData = {
    title: formTitle,
    content: formContent,
    summary: formSummary,
    seoTitle: formSeoTitle,
    seoDescription: formSeoDescription,
    pinDescription: formPinDescription
  };

  const curatedCoverPresets = [
    { name: "Luxury Dress", url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200" },
    { name: "Tailoring Suit", url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200" },
    { name: "Minimalist Outfit", url: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=1200" },
    { name: "Jewelry Accessory", url: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=1200" },
    { name: "Luxe Beauty", url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1200" }
  ];

  return (
    <div className="w-full bg-stone-50 pb-16" id="studio-dashboard">
      
      {/* Editorial Title Banner */}
      <div className="bg-white border-b border-stone-200 py-10 px-6 mb-8 text-center" id="studio-header">
        <h2 className="font-serif text-3xl font-light uppercase tracking-widest text-stone-900 leading-none">THE WRITER'S STUDIO</h2>
        <p className="text-xs text-stone-500 font-mono tracking-widest uppercase mt-2">Publish Editorial Outfits Guides & Crawl Blogger Feeds</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Article Draft Lists & Importer (4 of 12) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Blogger Importer Widget */}
          <div className="bg-[#1A1A1A] text-stone-100 p-6 border border-[#D4AF37]/25 rounded-none" id="blogger-crawler-widget">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-[#D4AF37] shrink-0" />
              <h3 className="font-serif text-md uppercase tracking-widest text-[#D4AF37]">Blogger URL Import Tool</h3>
            </div>
            <p className="text-xs text-stone-400 mb-4 leading-relaxed font-sans">
              Paste any legacy Blogger URL. Our Gemini AI crawler parses, cleans headings, converts paragraphs, preserves graphics and automatically creates a draft inside your editor in seconds!
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-3">
              <div className="relative font-sans">
                <input
                  type="url"
                  required
                  placeholder="https://exclusive-outfits.blogspot.com/..."
                  value={bloggerUrl}
                  onChange={(e) => setBloggerUrl(e.target.value)}
                  className="w-full bg-stone-800 text-stone-100 border border-[#D4AF37]/20 rounded-none px-4 py-2 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <Import className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-stone-500" />
              </div>
              <button
                type="submit"
                disabled={isImporting}
                className="w-full bg-[#D4AF37] text-white font-bold text-xs uppercase py-2 tracking-widest cursor-pointer hover:bg-[#B8962E] transition flex items-center justify-center gap-2 rounded-none"
              >
                {isImporting ? (
                  <>
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    <span>Gemini is Crafting Premium Edits...</span>
                  </>
                ) : (
                  <>
                    <span>Crawl & Synthesize Post</span>
                  </>
                )}
              </button>
            </form>

            {importStatus && (
              <div className={`mt-3 p-3 rounded text-xs flex gap-2 leading-relaxed ${
                importStatus.success ? "bg-emerald-950/45 border border-emerald-800 text-emerald-250" : "bg-red-950/45 border border-red-800 text-red-250"
              }`}>
                {importStatus.success ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>

          {/* Active List of Articles to Edit */}
          <div className="bg-white border border-[#D4AF37]/20 p-6 rounded-none" id="dashboard-articles-panel">
            <div className="flex justify-between items-center border-b border-[#D4AF37]/20 pb-3 mb-4">
              <h3 className="font-serif text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">Your Editorial Queue</h3>
              <button
                onClick={createNewEmptyArticle}
                className="text-[10px] font-bold tracking-widest bg-[#FAF9F6] hover:bg-stone-200 border border-[#D4AF37]/25 px-3 py-1 text-stone-700 uppercase cursor-pointer transition rounded-none"
              >
                + Create New
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 no-scrollbar font-sans">
              {articles.map(art => (
                <div
                  key={art.id}
                  onClick={() => loadArticleIntoForm(art)}
                  className={`p-3 border text-xs leading-snug cursor-pointer transition flex justify-between items-start gap-3 rounded-none ${
                    selectedArticleId === art.id
                      ? "bg-[#FAF9F6] border-[#D4AF37] shadow-none"
                      : "bg-stone-55 border-stone-200 hover:border-[#D4AF37]/45"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1 text-[9px] font-mono text-stone-400 uppercase tracking-wider">
                      <span>{art.category}</span>
                      <span>·</span>
                      <span className={`px-1.5 py-0.2 rounded font-bold ${art.status === 'published' ? 'text-emerald-700 bg-emerald-50' : 'text-stone-500 bg-stone-200'}`}>
                        {art.status.toUpperCase()}
                      </span>
                    </div>
                    <span className="font-serif font-bold text-stone-850 block truncate">{art.title}</span>
                    <span className="text-[10px] text-stone-400 mt-0.5 block truncate font-mono">{new Date(art.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteArticle(art.id);
                    }}
                    className="text-stone-300 hover:text-red-600 p-1 cursor-pointer transition shrink-0"
                    title="Delete Entry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                </div>
              ))}
            </div>
          </div>

          {/* Mounted SEO Score Checker */}
          <SEOChecker article={currentDraftData} onKeywordSelect={(k) => console.log('Keyword selected for draft:', k)} />

        </div>

        {/* Right Side: Interactive Rich Document Editor Form (8 of 12) */}
        <div className="lg:col-span-8 space-y-6 bg-white p-6 md:p-8 border border-[#D4AF37]/20 rounded-none font-sans" id="rich-editor-panel-form">
          
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[#D4AF37]/20 pb-4 mb-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#D4AF37] block">Document Editor Modes</span>
              <h3 className="font-serif text-lg tracking-wider uppercase text-stone-900">
                {selectedArticleId ? `Editing: '${formTitle}'` : "Drafting New Premium Sheet"}
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              {savingStatus && <span className="text-xs text-stone-500 font-mono animate-pulse">{savingStatus}</span>}
              <button
                onClick={() => handleSaveOrPublish('draft')}
                className="bg-[#FAF9F6] border border-[#D4AF37]/20 hover:bg-stone-200 text-stone-850 px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer rounded-none"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSaveOrPublish('published')}
                className="bg-[#D4AF37] hover:bg-[#B8962E] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1 rounded-none"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>One-Click Publish</span>
              </button>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Title */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">Article Title H1 (Vogue Design standard)</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => {
                  setFormTitle(e.target.value);
                  // Auto seo values
                  setFormSeoTitle(`${e.target.value} | Veloura Wear`);
                }}
                className="w-full bg-[#FAF9F6] border border-[#D4AF37]/20 rounded-none p-2 text-sm text-stone-900 font-serif focus:outline-none focus:border-[#D4AF37]"
                placeholder="Title representing the visual fashion edit..."
              />
            </div>

            {/* URL Slug */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">URL Slug (Editable)</label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                className="w-full bg-[#FAF9F6] border border-[#D4AF37]/20 rounded-none p-1.5 text-xs text-stone-900 font-mono focus:outline-none focus:border-[#D4AF37]"
                placeholder="url-friendly-slug-text"
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">Fashion Curation Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as CategoryName)}
                className="w-full bg-[#FAF9F6] border border-[#D4AF37]/20 rounded-none p-1.5 text-xs text-stone-900 focus:outline-none focus:border-[#D4AF37]"
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Custom tags */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">Metadata Tags (Comma-separated)</label>
              <input
                type="text"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                className="w-full bg-[#FAF9F6] border border-[#D4AF37]/20 rounded-none p-1.5 text-xs text-stone-900 focus:outline-none focus:border-[#D4AF37]"
                placeholder="Capsule, Minimalist, Outfits, Vogue"
              />
            </div>

            {/* Reading Time */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">EST Read Time (Minutes)</label>
              <input
                type="number"
                value={formReadTime}
                onChange={(e) => setFormReadTime(Number(e.target.value))}
                className="w-full bg-[#FAF9F6] border border-[#D4AF37]/20 rounded-none p-1.5 text-xs text-stone-900 focus:outline-none focus:border-[#D4AF37]"
                min={1}
                max={30}
              />
            </div>

            {/* Image selection Cover */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">Featured Cover Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formFeaturedImage}
                  onChange={(e) => setFormFeaturedImage(e.target.value)}
                  className="flex-1 bg-stone-50 border border-stone-320 rounded p-1.5 text-xs text-stone-900 font-mono focus:outline-none"
                  placeholder="https://images.unsplash.com/... for cover image"
                />
              </div>

              {/* Preselected Cover options */}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-mono text-stone-400 mt-1 uppercase">Instant High-Res Presets:</span>
                {curatedCoverPresets.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => setFormFeaturedImage(preset.url)}
                    className="text-[9px] bg-stone-100 hover:bg-stone-250 border border-stone-200 rounded px-2 py-0.5 text-stone-700 font-mono cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary preview description (short meta-description check) */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-mono uppercase tracking-widest text-stone-500 mb-1">Visual Curation Summary (Editorial Snippet)</label>
              <textarea
                rows={2}
                value={formSummary}
                onChange={(e) => {
                  setFormSummary(e.target.value);
                  setFormSeoDescription(e.target.value);
                }}
                className="w-full bg-[#FAF9F6] border border-[#D4AF37]/20 rounded-none p-2 text-xs text-stone-900 focus:outline-none font-serif focus:border-[#D4AF37]"
                placeholder="Describe your capsule outfit formulas elegantly (100-150 characters to score high)..."
              ></textarea>
            </div>

            {/* Broad Rich Markdown Content Input Area */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-mono uppercase tracking-widest text-stone-500">
                  Luxury Article Body (Markdown Assisted Editor)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-stone-400">Heading: Use ## and List: Use -</span>
                </div>
              </div>
              <textarea
                rows={12}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="w-full bg-[#FAF9F6] border border-[#D4AF37]/20 rounded-none p-3 text-xs md:text-sm text-stone-950 font-mono leading-relaxed focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] focus:outline-none"
                placeholder="Write with headers using ##, write lists inside matching outfits guides..."
              ></textarea>
            </div>

            {/* Custom Google Ads / Affiliate Box Builder inside dashboard */}
            <div className="col-span-1 md:col-span-2 border border-[#D4AF37]/25 bg-[#FAF9F6] p-4 rounded-none">
              <h4 className="font-serif text-xs font-bold uppercase tracking-widest text-stone-850 mb-2 border-b border-[#D4AF37]/20 pb-1">
                Affiliate Ad Products Linker
              </h4>
              <p className="text-[10px] text-stone-500 leading-normal mb-3 font-sans">
                Include interactive shopping cards inside the article. Select brand names and past product values cards.
              </p>

              {/* Product draft creation */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3 font-sans">
                <input
                  type="text"
                  placeholder="Product Title"
                  value={affTitle}
                  onChange={(e) => setAffTitle(e.target.value)}
                  className="bg-white border border-[#D4AF37]/20 rounded-none p-1 text-xs text-stone-900 focus:outline-none focus:border-[#D4AF37]"
                />
                <input
                  type="text"
                  placeholder="Designer Brand"
                  value={affBrand}
                  onChange={(e) => setAffBrand(e.target.value)}
                  className="bg-white border border-[#D4AF37]/20 rounded-none p-1 text-xs text-stone-900 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Price (e.g. $190.00)"
                  value={affPrice}
                  onChange={(e) => setAffPrice(e.target.value)}
                  className="bg-white border border-[#D4AF37]/20 rounded-none p-1 text-xs text-stone-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addAffiliateProduct}
                  className="bg-[#D4AF37] text-white text-xs font-bold uppercase rounded-none p-1 hover:bg-[#B8962E] cursor-pointer transition font-mono"
                >
                  + Add Product
                </button>
              </div>

              {/* Added product collections listed */}
              {formAffiliateList.length > 0 && (
                <div className="space-y-2 mt-2">
                  <span className="text-[10px] font-mono font-semibold text-stone-600 block">Linked Affiliate Cards:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {formAffiliateList.map(item => (
                      <div key={item.id} className="bg-white p-2 border border-stone-250 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold block text-stone-850 text-[11px]">{item.title}</span>
                          <span className="text-[10px] text-stone-400 font-mono">{item.brand} — {item.price}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAffiliateProduct(item.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-mono p-1"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ADVANCED GOOGLE SEO DETAILS */}
            <div className="col-span-1 md:col-span-2 border border-[#D4AF37]/20 p-4 bg-white space-y-3 rounded-none font-sans">
              <h4 className="font-serif text-xs font-bold uppercase tracking-widest text-stone-800 border-b border-[#D4AF37]/20 pb-1">
                Advanced SEO & Metadata Options
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-0.5">Custom SEO Title Override</label>
                  <input
                    type="text"
                    value={formSeoTitle}
                    onChange={(e) => setFormSeoTitle(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#D4AF37]/20 rounded-none p-1 text-xs text-stone-900 focus:outline-none focus:border-[#D4AF37]"
                    placeholder="Under 60 Character high-ranking Google title"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-0.5">SEO Meta Description</label>
                  <input
                    type="text"
                    value={formSeoDescription}
                    onChange={(e) => setFormSeoDescription(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#D4AF37]/20 rounded-none p-1 text-xs text-stone-900 focus:outline-none focus:border-[#D4AF37]"
                    placeholder="120 to 160 Characters for search engine display snippet"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-0.5">Pinterest Rich Pin Narrative</label>
                  <textarea
                    rows={2}
                    value={formPinDescription}
                    onChange={(e) => setFormPinDescription(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#D4AF37]/20 rounded-none p-1.5 text-xs text-stone-900 font-serif focus:outline-none focus:border-[#D4AF37]"
                    placeholder="Detailed Pinterest Description using hooks and clothing hashtags..."
                  ></textarea>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs pt-2">
                <label className="flex items-center gap-2 text-stone-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsSponsored}
                    onChange={(e) => setFormIsSponsored(e.target.checked)}
                    className="rounded-none border-[#D4AF37]/50 focus:ring-0 text-[#D4AF37] scale-110"
                  />
                  <span>Sponsored Placement Marker</span>
                </label>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
