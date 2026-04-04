export interface EditorBlock {

  id?: string;
  type: string;
  data: any;
}

export interface BlogContent {
  time?: number;
  block: EditorBlock[];
  version?: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  author: string;
  authorId?: string | { _id?: string; name: string; avatar?: string; title?: string; profilePhoto?: string; profession?: string };
  content?: string;
  body?: EditorBlock[];
  thumbnail?: { 
    image?: string; 
    title?: string; 
    description?: string 
  };
  image?: string;
  time?: string;
  publishedDate?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  likeCount?: number;
  isLikedByUser?: boolean;
  commentCount?: number;
  views?: number;
  category?: string;
  tags?: string[];
  url: string;
  status?: "approved" | "pending" | "rejected";
  editorType?: string;
  isTrending?: boolean;
  contentType?: "blog" | "project";
  language?: "en" | "hi";
  creator?: {
    _id?: string;
    name?: string;
    profilePhoto?: string;
    profession?: string;
  };
  isSaved?: boolean;
}
