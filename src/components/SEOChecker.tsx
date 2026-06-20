import { useState, useEffect } from 'react';
import { Article } from '../types';
import { CheckCircle, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';

interface SEOCheckerProps {
  article: Partial<Article>;
  onKeywordSelect?: (keyword: string) => void;
}

export default function SEOChecker({ article, onKeywordSelect }: SEOCheckerProps) {
  const [targetKeyword, setTargetKeyword] = useState('fashion');
  const [score, setScore] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [checks, setChecks] = useState<Array<{ name: string; passed: boolean; message: string; type: 'success' | 'warning' }>>([]);

  const runAnalysis = () => {
    const title = article.title || '';
    const content = article.content || '';
    const summary = article.summary || '';
    const seoTitle = article.seoTitle || '';
    const seoDescription = article.seoDescription || '';
    const kw = targetKeyword.toLowerCase().trim();

    const resultChecks: typeof checks = [];
    let currentScore = 15; // baseline

    // Title Length Check
    if (seoTitle.length >= 30 && seoTitle.length <= 60) {
      resultChecks.push({ name: "SEO Title Length", passed: true, message: `Perfect title length (${seoTitle.length} characters). Ready for Google search snippet.`, type: 'success' });
      currentScore += 20;
    } else {
      resultChecks.push({ name: "SEO Title Length", passed: false, message: `Title length is ${seoTitle.length} chars. Aim for between 30 and 60 for optimum display.`, type: 'warning' });
      currentScore += 5;
    }

    // Alt Descriptions length check
    if (seoDescription.length >= 110 && seoDescription.length <= 160) {
      resultChecks.push({ name: "Meta Description", passed: true, message: `Outstanding meta description length (${seoDescription.length} characters). Fits beautifully.`, type: 'success' });
      currentScore += 20;
    } else {
      resultChecks.push({ name: "Meta Description", passed: false, message: `Meta description is ${seoDescription.length} chars. Ideal length is 110 to 160 characters.`, type: 'warning' });
      currentScore += 5;
    }

    // Keyword presence check
    if (kw) {
      // Check title copy
      if (title.toLowerCase().includes(kw)) {
        resultChecks.push({ name: "Keyword in Main Title", passed: true, message: `Keyword '${kw}' appears dynamically in your H1 heading. Excellent.`, type: 'success' });
        currentScore += 15;
      } else {
        resultChecks.push({ name: "Keyword in Main Title", passed: false, message: `Try placing your focus keyword '${kw}' inside the article title.`, type: 'warning' });
      }

      // Check text content occurrences
      const matches = content.toLowerCase().split(kw).length - 1;
      const density = content.length > 0 ? (matches / content.split(/\s+/).length) * 100 : 0;
      
      if (density >= 0.5 && density <= 2.5) {
        resultChecks.push({ name: "Keyword Density", passed: true, message: `Keyword density is perfect (${density.toFixed(1)}% - ${matches} occurrences). Avoids keyword stuffing.`, type: 'success' });
        currentScore += 20;
      } else if (density > 2.5) {
        resultChecks.push({ name: "Keyword Density", passed: false, message: `Keyword density is high (${density.toFixed(1)}%). Prune occurrences to avoid search engine flags.`, type: 'warning' });
        currentScore += 10;
      } else {
        resultChecks.push({ name: "Keyword Density", passed: false, message: `Keyword '${kw}' occurs ${matches} times. Introduce it key times to increase presence.`, type: 'warning' });
      }

      // Check Pinterest description completeness
      if (article.pinDescription && article.pinDescription.toLowerCase().includes('#')) {
        resultChecks.push({ name: "Pinterest Pin Rich Support", passed: true, message: "Contains organic hashtags for Pinterest rich pin lookup.", type: 'success' });
        currentScore += 10;
      } else {
        resultChecks.push({ name: "Pinterest Pin Rich Support", passed: false, message: "Add at least two styling hashtags inside the Pinterest Pin description.", type: 'warning' });
      }
    }

    // Internal linking indexer
    const listSuggestions: string[] = [];
    if (!content.includes('capsule-wardrobe')) {
      listSuggestions.push("Link back to our 'The Ultimate 10-Piece Minimalist Capsule Wardrobe for 2026' article to increase Domain Authority.");
    }
    if (!content.includes('color-theory')) {
      listSuggestions.push("Add a natural anchor text pointing to 'Vogue's Guide to Masterful Color Theory' to guide readers seamlessly.");
    }
    if (listSuggestions.length === 0) {
      listSuggestions.push("Great job! All suggested internal luxury linkages are active.");
    }

    setChecks(resultChecks);
    setScore(Math.min(100, currentScore));
    setSuggestions(listSuggestions);
  };

  useEffect(() => {
    runAnalysis();
  }, [article, targetKeyword]);

  const predefinedKeywords = ["capsule wardrobe", "styling rules", "women's fashion", "french style", "beauty", "wardrobe basics", "minimalist"];

  return (
    <div className="bg-white border border-[#D4AF37]/20 p-6 rounded-none text-[#1A1A1A]" id="seo-score-checker">
      <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-4 mb-4">
        <div>
          <h4 className="font-serif text-lg tracking-wide uppercase">Advanced SEO Health Panel</h4>
          <p className="text-xs text-stone-500">Real-time meta-data validation and search index optimization</p>
        </div>
        <div className="flex flex-col items-center justify-center bg-[#1A1A1A] text-amber-50 rounded-none h-16 w-16 border-2 border-[#D4AF37]">
          <span className="text-[9px] font-mono tracking-widest">SCORE</span>
          <span className="text-lg font-bold leading-none">{score}</span>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium uppercase tracking-wider text-stone-500 mb-1">
          Define Focus Keyword (e.g. 'capsule', 'styling')
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 text-sm bg-white border border-[#D4AF37]/20 rounded-none px-3 py-1.5 focus:outline-none focus:border-[#D4AF37] text-stone-900"
            value={targetKeyword}
            onChange={(e) => setTargetKeyword(e.target.value)}
            placeholder="Enter target keyword..."
          />
          <button
            onClick={runAnalysis}
            className="bg-stone-200 hover:bg-stone-300 cursor-pointer p-2 rounded text-stone-700"
            title="Recalculate Score"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {predefinedKeywords.map(kw => (
            <button
              key={kw}
              onClick={() => {
                setTargetKeyword(kw);
                if (onKeywordSelect) onKeywordSelect(kw);
              }}
              className="text-[10px] bg-stone-100 border border-stone-200 hover:border-stone-400 px-2 py-0.5 rounded text-stone-600 transition cursor-pointer"
            >
              +{kw}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <h5 className="font-semibold text-xs uppercase tracking-widest text-stone-700">Checklist Assessment</h5>
        {checks.map((c, i) => (
          <div key={i} className="flex gap-3 text-xs leading-relaxed">
            {c.passed ? (
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block">{c.name}</span>
              <span className="text-stone-600">{c.message}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#FAF9F6] border border-[#D4AF37]/25 rounded-none p-3 text-xs leading-relaxed">
        <div className="flex items-center gap-1.5 font-bold mb-1 text-stone-800">
          <Lightbulb className="h-4 w-4 text-[#D4AF37] shrink-0" />
          <span className="font-serif uppercase tracking-widest text-[#1A1A1A]">Internal Linkage Suggestions</span>
        </div>
        <ul className="list-disc pl-4 space-y-1 mt-1 text-stone-600 font-sans">
          {suggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
