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

export interface Profile {
  id: string;
  username: string;
  email: string;
  filter_preferences: string[];
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_edited: boolean;
}

export interface CommentWithProfile extends Comment {
  profile: Profile;
  replies?: CommentWithProfile[];
}

export type CommentInsert = Omit<Comment, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'is_edited'>;
export type CommentUpdate = Partial<Pick<Comment, 'content' | 'is_edited' | 'deleted_at'>>;

export interface Topic {
  id: string;
  name: string;
  gradient_from: string;
  gradient_to: string;
  hover_gradient_from: string;
  hover_gradient_to: string;
  created_at: string;
  updated_at: string;
}

export type TopicInsert = Omit<Topic, 'id' | 'created_at' | 'updated_at'>;
export type TopicUpdate = Partial<TopicInsert>;

export interface Database {
  public: {
    Tables: {
      post: {
        Row: Post;
        Insert: PostInsert;
        Update: PostUpdate;
      };
      profiles: {
        Row: Profile;
      };
      comments: {
        Row: Comment;
        Insert: CommentInsert;
        Update: CommentUpdate;
      };
      topics: {
        Row: Topic;
        Insert: TopicInsert;
        Update: TopicUpdate;
      };
    };
  };
}
