import { supabase } from '../lib/supabase';
import type { Post, PostStack, PostStackInsert } from '../types/database';

export const stackService = {
  async pushToStack(postId: string, userId: string): Promise<PostStack | null> {
    const stackItem: PostStackInsert = {
      post_id: postId,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('post_stack')
      .insert(stackItem)
      .select()
      .single();

    if (error) {
      console.error('Error pushing to stack:', error);
      return null;
    }

    return data;
  },

  async popFromStack(postId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('post_stack')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error popping from stack:', error);
      return false;
    }

    return true;
  },

  async isInStack(postId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('post_stack')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking stack:', error);
      return false;
    }

    return data !== null;
  },

  async getUserStack(userId: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from('post_stack')
      .select(`
        created_at,
        post:post_id (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user stack:', error);
      return [];
    }

    return (data || [])
      .map(item => item.post)
      .filter((post): post is Post => post !== null);
  },

  async getStackCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('post_stack')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching stack count:', error);
      return 0;
    }

    return count || 0;
  },

  async clearStack(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('post_stack')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing stack:', error);
      return false;
    }

    return true;
  },
};
