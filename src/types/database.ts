export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface CodeSnippet {
  label: string;
  language: string;
  content: string;
}

export interface Post {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  summary: string | null;
  problem_solved: string | null;
  upside: string | null;
  downside: string | null;
  risk_level: RiskLevel | null;
  performance_impact: string | null;
  doc_url: string | null;
  primary_topic: string | null;
  syntax: string | null;
  code_snippets: CodeSnippet[];
  dependencies: string[];
  compatibility_min_version: string | null;
  compatibility_deprecated_in: string | null;
  tags: string[];
  last_verified: string;
  difficulty: string;
}

export type PostInsert = Omit<Post, 'id' | 'created_at' | 'updated_at'>;
export type PostUpdate = Partial<PostInsert>;

export interface Database {
  public: {
    Tables: {
      post: {
        Row: Post;
        Insert: PostInsert;
        Update: PostUpdate;
      };
    };
  };
}
