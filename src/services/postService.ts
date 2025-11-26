import { supabase } from '../lib/supabase';
import type { Post, PostInsert, PostUpdate } from '../types/database';

export const postService = {
  async getAllPosts(): Promise<Post[]> {
    const { data, error } = await supabase
      .from('post')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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
    const { data, error } = await supabase
      .from('post')
      .select('*')
      .eq('primary_topic', topic)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPostsByTag(tag: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from('post')
      .select('*')
      .contains('tags', [tag])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPostsByRiskLevel(riskLevel: 'Low' | 'Medium' | 'High'): Promise<Post[]> {
    const { data, error } = await supabase
      .from('post')
      .select('*')
      .eq('risk_level', riskLevel)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async searchPosts(searchTerm: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from('post')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%,problem_solved.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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
    const { data, error } = await supabase
      .from('post')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
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
