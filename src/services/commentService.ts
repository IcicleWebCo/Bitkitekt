import { supabase } from '../lib/supabase';
import type { Comment, CommentInsert, CommentUpdate, CommentWithProfile } from '../types/database';

export const commentService = {
  async getCommentsByPostId(postId: string): Promise<CommentWithProfile[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('post_id', postId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const comments = (data || []) as unknown as CommentWithProfile[];
    return buildCommentTree(comments);
  },

  async getCommentCount(postId: string): Promise<number> {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .is('deleted_at', null);

    if (error) throw error;
    return count || 0;
  },

  async getPollComments(pollId: string): Promise<CommentWithProfile[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('poll_id', pollId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const comments = (data || []) as unknown as CommentWithProfile[];
    return buildCommentTree(comments);
  },

  async getPollCommentCount(pollId: string): Promise<number> {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('poll_id', pollId)
      .is('deleted_at', null);

    if (error) throw error;
    return count || 0;
  },

  async createComment(comment: CommentInsert): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert(comment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateComment(id: string, updates: CommentUpdate): Promise<Comment> {
    const updateData: CommentUpdate = {
      ...updates,
      is_edited: true,
    };

    const { data, error } = await supabase
      .from('comments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async softDeleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};

function buildCommentTree(comments: CommentWithProfile[]): CommentWithProfile[] {
  const commentMap = new Map<string, CommentWithProfile>();
  const rootComments: CommentWithProfile[] = [];

  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.id)!;

    if (comment.parent_comment_id) {
      const parent = commentMap.get(comment.parent_comment_id);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(commentWithReplies);
      }
    } else {
      rootComments.push(commentWithReplies);
    }
  });

  return rootComments;
}
