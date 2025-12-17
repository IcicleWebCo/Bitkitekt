import { supabase } from '../lib/supabase';
import type { Comment, CommentInsert, CommentUpdate, CommentWithProfile, CommentLikeInsert } from '../types/database';

export const commentService = {
  async getCommentsByPostId(postId: string, userId?: string): Promise<CommentWithProfile[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('post_id', postId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const comments = (data || []) as unknown as CommentWithProfile[];
    const enrichedComments = await enrichCommentsWithPowerUps(comments, userId);
    return buildCommentTree(enrichedComments);
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

  async getPollComments(pollId: string, userId?: string): Promise<CommentWithProfile[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('poll_id', pollId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const comments = (data || []) as unknown as CommentWithProfile[];
    const enrichedComments = await enrichCommentsWithPowerUps(comments, userId);
    return buildCommentTree(enrichedComments);
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

  async powerUpComment(commentId: string, userId: string): Promise<void> {
    const powerUp: CommentLikeInsert = {
      comment_id: commentId,
      user_id: userId,
    };

    const { error } = await supabase
      .from('comment_likes')
      .insert(powerUp);

    if (error) throw error;
  },

  async removePowerUp(commentId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async getPowerUpCount(commentId: string): Promise<number> {
    const { count, error } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);

    if (error) throw error;
    return count || 0;
  },

  async hasUserPoweredUp(commentId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },
};

async function enrichCommentsWithPowerUps(
  comments: CommentWithProfile[],
  userId?: string
): Promise<CommentWithProfile[]> {
  const commentIds = comments.map(c => c.id);

  if (commentIds.length === 0) return comments;

  const { data: powerUpCounts, error: countError } = await supabase
    .from('comment_likes')
    .select('comment_id')
    .in('comment_id', commentIds);

  if (countError) throw countError;

  const countMap = new Map<string, number>();
  (powerUpCounts || []).forEach(like => {
    countMap.set(like.comment_id, (countMap.get(like.comment_id) || 0) + 1);
  });

  let userPowerUpMap = new Map<string, boolean>();
  if (userId) {
    const { data: userPowerUps, error: userError } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .in('comment_id', commentIds)
      .eq('user_id', userId);

    if (userError) throw userError;

    (userPowerUps || []).forEach(like => {
      userPowerUpMap.set(like.comment_id, true);
    });
  }

  return comments.map(comment => ({
    ...comment,
    power_up_count: countMap.get(comment.id) || 0,
    user_has_powered_up: userPowerUpMap.get(comment.id) || false,
  }));
}

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

  rootComments.sort((a, b) => {
    const countDiff = (b.power_up_count || 0) - (a.power_up_count || 0);
    if (countDiff !== 0) return countDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  rootComments.forEach(comment => {
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.sort((a, b) => {
        const countDiff = (b.power_up_count || 0) - (a.power_up_count || 0);
        if (countDiff !== 0) return countDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
  });

  return rootComments;
}
