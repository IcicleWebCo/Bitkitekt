import { supabase } from '../lib/supabase';
import type { Post, PostInsert, PostUpdate } from '../types/database';

// Helper function to fetch posts with power up counts and sort them
async function fetchAndSortPosts(query: any): Promise<Post[]> {
  const { data: posts, error: postsError } = await query;
  if (postsError) throw postsError;

  if (!posts || posts.length === 0) return [];

  // Get power up counts for all posts
  const postIds = posts.map((p: Post) => p.id);
  const { data: likeCounts, error: likeError } = await supabase
    .from('post_likes')
    .select('post_id')
    .in('post_id', postIds);

  if (likeError) throw likeError;

  // Count likes per post
  const likeCountMap = new Map<string, number>();
  (likeCounts || []).forEach((like: any) => {
    likeCountMap.set(like.post_id, (likeCountMap.get(like.post_id) || 0) + 1);
  });

  // Sort posts by power up count (descending), then by created_at (descending)
  return posts.sort((a: Post, b: Post) => {
    const aCount = likeCountMap.get(a.id) || 0;
    const bCount = likeCountMap.get(b.id) || 0;

    if (bCount !== aCount) {
      return bCount - aCount;
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export const postService = {
  async getAllPosts(): Promise<Post[]> {
    const query = supabase
      .from('post')
      .select('*');

    return fetchAndSortPosts(query);
  },

  async getPostById(id: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from('post')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getPostsByTopic(topic: string): Promise<Post[]> {
    const query = supabase
      .from('post')
      .select('*')
      .eq('primary_topic', topic);

    return fetchAndSortPosts(query);
  },

  async getPostsByTag(tag: string): Promise<Post[]> {
    const query = supabase
      .from('post')
      .select('*')
      .contains('tags', [tag]);

    return fetchAndSortPosts(query);
  },

  async getPostsByRiskLevel(riskLevel: 'Low' | 'Medium' | 'High'): Promise<Post[]> {
    const query = supabase
      .from('post')
      .select('*')
      .eq('risk_level', riskLevel);

    return fetchAndSortPosts(query);
  },

  async searchPosts(searchTerm: string): Promise<Post[]> {
    const query = supabase
      .from('post')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%,problem_solved.ilike.%${searchTerm}%`);

    return fetchAndSortPosts(query);
  },

  async createPost(post: PostInsert): Promise<Post> {
    const { data, error } = await supabase
      .from('post')
      .insert(post)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePost(id: string, updates: PostUpdate): Promise<Post> {
    const { data, error } = await supabase
      .from('post')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .from('post')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getRecentPosts(limit: number = 10): Promise<Post[]> {
    const query = supabase
      .from('post')
      .select('*');

    const sortedPosts = await fetchAndSortPosts(query);
    return sortedPosts.slice(0, limit);
  },

  async getPostsNeedingVerification(daysOld: number = 90): Promise<Post[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffString = cutoffDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('post')
      .select('*')
      .lt('last_verified', cutoffString)
      .order('last_verified', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
