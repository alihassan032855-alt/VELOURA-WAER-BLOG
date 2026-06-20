export interface Author {
  name: string;
  avatar: string;
  bio: string;
}

export interface AffiliateProduct {
  id: string;
  title: string;
  brand: string;
  price: string;
  image: string;
  url: string;
}

export interface Comment {
  id: string;
  articleId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  featuredImage: string;
  status: 'draft' | 'published';
  createdAt: string;
  readTime: number; // in minutes
  author: Author;
  reactions: {
    love: number;
    insight: number;
    clap: number;
  };
  views: number;
  commentsCount: number;
  isSponsored: boolean;
  affiliateProducts?: AffiliateProduct[];
  pinDescription: string;
}

export interface UserBookmark {
  articleId: string;
  savedAt: string;
}

export type CategoryName =
  | "Fashion Tips"
  | "Style Guides"
  | "Outfit Ideas"
  | "Seasonal Fashion"
  | "Fashion Trends"
  | "Wardrobe Essentials"
  | "Fashion Mistakes"
  | "Luxury Fashion"
  | "Beauty Tips"
  | "Accessories";

export const CATEGORIES: CategoryName[] = [
  "Fashion Tips",
  "Style Guides",
  "Outfit Ideas",
  "Seasonal Fashion",
  "Fashion Trends",
  "Wardrobe Essentials",
  "Fashion Mistakes",
  "Luxury Fashion",
  "Beauty Tips",
  "Accessories"
];
