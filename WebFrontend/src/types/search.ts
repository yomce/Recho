// WebFrontend/src/types/search.ts

export interface Post {
    postId: number;
    title: string;
    author: string;
    createdAt: string;
  }
  export interface UsedProduct {
    productId: number;
    title: string;
    price: number;
    imageUrl?: string;
  }
  export interface RecruitEnsemble {
    postId: number;
    title: string;
    skillLevel: string;
    eventDate: string;
  }
  
  export interface SearchResults {
    posts: Post[];
    usedProducts: UsedProduct[];
    recruitEnsembles: RecruitEnsemble[];
  }