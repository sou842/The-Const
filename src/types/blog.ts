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
