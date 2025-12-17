import { supabase } from '../lib/supabase';
import type { Poll, PollOption, PollWithOptions, PollResults, PollOptionWithVotes, PollVoteInsert } from '../types/database';

export const pollService = {
  async getActivePolls(): Promise<PollWithOptions[]> {
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (pollsError) {
      throw new Error(`Failed to fetch polls: ${pollsError.message}`);
    }

    if (!polls || polls.length === 0) {
      return [];
    }

    const pollsWithOptions = await Promise.all(
      polls.map(async (poll) => {
        const { data: options, error: optionsError } = await supabase
          .from('poll_options')
          .select('*')
          .eq('poll_id', poll.id)
          .order('option_order', { ascending: true });

        if (optionsError) {
          console.error(`Failed to fetch options for poll ${poll.id}:`, optionsError);
          return { ...poll, options: [] };
        }

        return {
          ...poll,
          options: options || []
        };
      })
    );

    return pollsWithOptions;
  },

  async getPollById(pollId: string): Promise<PollWithOptions | null> {
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .maybeSingle();

    if (pollError) {
      throw new Error(`Failed to fetch poll: ${pollError.message}`);
    }

    if (!poll) {
      return null;
    }

    const { data: options, error: optionsError } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', pollId)
      .order('option_order', { ascending: true });

    if (optionsError) {
      throw new Error(`Failed to fetch poll options: ${optionsError.message}`);
    }

    return {
      ...poll,
      options: options || []
    };
  },

  async getPollResults(pollId: string, userId?: string): Promise<PollResults | null> {
    const pollWithOptions = await this.getPollById(pollId);

    if (!pollWithOptions) {
      return null;
    }

    const { data: votes, error: votesError } = await supabase
      .from('poll_votes')
      .select('poll_option_id')
      .eq('poll_id', pollId);

    if (votesError) {
      throw new Error(`Failed to fetch votes: ${votesError.message}`);
    }

    const voteCounts = new Map<string, number>();
    let totalVotes = 0;

    if (votes) {
      votes.forEach((vote) => {
        const count = voteCounts.get(vote.poll_option_id) || 0;
        voteCounts.set(vote.poll_option_id, count + 1);
        totalVotes++;
      });
    }

    const optionsWithVotes: PollOptionWithVotes[] = pollWithOptions.options.map((option) => ({
      ...option,
      vote_count: voteCounts.get(option.id) || 0
    }));

    let userVote: string | undefined;
    if (userId) {
      const { data: userVoteData } = await supabase
        .from('poll_votes')
        .select('poll_option_id')
        .eq('poll_id', pollId)
        .eq('user_id', userId)
        .maybeSingle();

      if (userVoteData) {
        userVote = userVoteData.poll_option_id;
      }
    }

    return {
      ...pollWithOptions,
      options: optionsWithVotes,
      total_votes: totalVotes,
      user_vote: userVote
    };
  },

  async hasUserVoted(pollId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('poll_votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking user vote:', error);
      return false;
    }

    return !!data;
  },

  async submitVote(pollId: string, optionId: string, userId: string): Promise<void> {
    const hasVoted = await this.hasUserVoted(pollId, userId);

    if (hasVoted) {
      throw new Error('You have already voted on this poll');
    }

    const voteData: PollVoteInsert = {
      poll_id: pollId,
      poll_option_id: optionId,
      user_id: userId
    };

    const { error } = await supabase
      .from('poll_votes')
      .insert(voteData);

    if (error) {
      if (error.code === '23505') {
        throw new Error('You have already voted on this poll');
      }
      throw new Error(`Failed to submit vote: ${error.message}`);
    }
  },

  async getUserVote(pollId: string, userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('poll_votes')
      .select('poll_option_id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user vote:', error);
      return null;
    }

    return data?.poll_option_id || null;
  }
};
