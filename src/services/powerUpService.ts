import { supabase } from '../lib/supabase';

export interface PowerUpStatus {
  count: number;
  isPoweredUp: boolean;
}

export const powerUpService = {
  async getPowerUpStatus(postId: string, userId: string | null): Promise<PowerUpStatus> {
    const countQuery = supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error fetching power up count:', countError);
      return { count: 0, isPoweredUp: false };
    }

    if (!userId) {
      return { count: count || 0, isPoweredUp: false };
    }

    const { data: userLike, error: userError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (userError) {
      console.error('Error checking user power up status:', userError);
      return { count: count || 0, isPoweredUp: false };
    }

    return {
      count: count || 0,
      isPoweredUp: !!userLike,
    };
  },

  async togglePowerUp(postId: string, userId: string): Promise<{ success: boolean; isPoweredUp: boolean }> {
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingLike) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing power up:', error);
        return { success: false, isPoweredUp: true };
      }

      return { success: true, isPoweredUp: false };
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: userId });

      if (error) {
        console.error('Error adding power up:', error);
        return { success: false, isPoweredUp: false };
      }

      return { success: true, isPoweredUp: true };
    }
  },

  async getPowerUpCount(postId: string): Promise<number> {
    const { count, error } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) {
      console.error('Error fetching power up count:', error);
      return 0;
    }

    return count || 0;
  },
};
