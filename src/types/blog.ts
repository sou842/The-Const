export interface BlogAuthor {
  _id: string;
  name: string;
  username?: string;
  profilePhoto?: string;
  profession?: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  body?: Record<string, unknown>[]; // EditorJS OutputData blocks
  thumbnail: {
    title?: string;
    description?: string;
    image?: string;
  };
  category: string;
  tags: string[];
  author: string;
  creator?: {
    name?: string;
    profilePhoto?: string;
    profession?: string;
  };
  previewText?: string;
  authorId: string | BlogAuthor;
  publishedDate?: string;
  status: "approved" | "pending" | "rejected";
  editorType: string;
  views: number;
  videoUrl?: string;
  language: "en" | "hi";
  url: string;
  createdAt: string;
  updatedAt: string;
  isTrending: boolean;
  likeCount?: number;
  commentCount?: number;
  isLikedByUser?: boolean;
}
