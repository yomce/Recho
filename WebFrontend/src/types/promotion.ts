export interface Promotion {
  id: number;
  imageUrl: string;
  title: string;
  subtitle: string;
}

export interface PromotionPost {
  title: string;
  imageUrl: string;
  subtitle?: string;
}