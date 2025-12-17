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

export type PollFrequency = 'frequent' | 'normal' | 'rare' | 'none';

export interface Profile {
  id: string;
  username: string;
  email: string;
  filter_preferences: string[];
  difficulty_preferences: string[];
  poll_frequency: PollFrequency;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string | null;
  poll_id: string | null;
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
  power_up_count?: number;
  user_has_powered_up?: boolean;
}

export type CommentInsert = Omit<Comment, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'is_edited'>;
export type CommentUpdate = Partial<Pick<Comment, 'content' | 'is_edited' | 'deleted_at'>>;

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export type CommentLikeInsert = Omit<CommentLike, 'id' | 'created_at'>;

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

export interface Poll {
  id: string;
  question: string;
  description: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  option_order: number;
  created_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  poll_option_id: string;
  user_id: string;
  created_at: string;
}

export interface PollWithOptions extends Poll {
  options: PollOption[];
}

export interface PollOptionWithVotes extends PollOption {
  vote_count: number;
}

export interface PollResults extends Poll {
  options: PollOptionWithVotes[];
  total_votes: number;
  user_vote?: string;
}

export type PollInsert = Omit<Poll, 'id' | 'created_at' | 'updated_at'>;
export type PollUpdate = Partial<PollInsert>;
export type PollOptionInsert = Omit<PollOption, 'id' | 'created_at'>;
export type PollVoteInsert = Omit<PollVote, 'id' | 'created_at'>;

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
      polls: {
        Row: Poll;
        Insert: PollInsert;
        Update: PollUpdate;
      };
      poll_options: {
        Row: PollOption;
        Insert: PollOptionInsert;
      };
      poll_votes: {
        Row: PollVote;
        Insert: PollVoteInsert;
      };
      comment_likes: {
        Row: CommentLike;
        Insert: CommentLikeInsert;
      };
    };
  };
}
