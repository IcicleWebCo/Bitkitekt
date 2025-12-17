import { useState, useEffect, useRef } from 'react';
import { BarChart3, CheckCircle } from 'lucide-react';
import { pollService } from '../services/pollService';
import { commentService } from '../services/commentService';
import type { PollWithOptions, PollResults, CommentWithProfile } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { CommentSection } from './CommentSection';

interface PollDetailProps {
  poll: PollWithOptions;
  scrollToComments?: boolean;
  onSignIn: () => void;
  onCommentCountChange?: (pollId: string, count: number) => void;
}

export function PollDetail({ poll, scrollToComments, onSignIn, onCommentCountChange }: PollDetailProps) {
  const { user } = useAuth();
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      checkUserVote();
    }
    loadComments();
  }, [user, poll.id]);

  useEffect(() => {
    if (scrollToComments && commentsRef.current) {
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [scrollToComments]);

  const checkUserVote = async () => {
    if (!user) return;

    try {
      const voted = await pollService.hasUserVoted(poll.id, user.id);
      setHasVoted(voted);

      if (voted) {
        const pollResults = await pollService.getPollResults(poll.id, user.id);
        if (pollResults) {
          setResults(pollResults);
          setSelectedOption(pollResults.user_vote || null);
          setShowResults(true);
        }
      }
    } catch (err) {
      console.error('Error checking user vote:', err);
    }
  };

  const loadComments = async () => {
    try {
      const loadedComments = await commentService.getPollComments(poll.id);
      setComments(loadedComments);
      const count = await commentService.getPollCommentCount(poll.id);
      setCommentCount(count);
      onCommentCountChange?.(poll.id, count);
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const handleVote = async (optionId: string) => {
    if (!user) {
      setError('Please sign in to vote');
      return;
    }

    if (hasVoted) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await pollService.submitVote(poll.id, optionId, user.id);
      setHasVoted(true);
      setSelectedOption(optionId);

      const pollResults = await pollService.getPollResults(poll.id, user.id);
      if (pollResults) {
        setResults(pollResults);
        setShowResults(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (voteCount: number, totalVotes: number): number => {
    if (totalVotes === 0) return 0;
    return Math.round((voteCount / totalVotes) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-20">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <article className="bg-slate-900/60 backdrop-blur-xl border border-fuchsia-500/30 rounded-xl shadow-2xl p-6 md:p-10 space-y-6 relative">

          <div className="absolute top-4 right-4 bg-fuchsia-500/20 text-fuchsia-300 px-3 py-1 rounded-full text-xs font-semibold border border-fuchsia-500/50 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            POLL
          </div>

          <header className="space-y-4 border-b border-slate-700/50 pb-6">
            <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight pr-20">
              {poll.question}
            </h1>

            {poll.description && (
              <p className="text-base md:text-lg text-slate-300 leading-relaxed">
                {poll.description}
              </p>
            )}

            {poll.category && (
              <div className="inline-flex items-center gap-1.5 bg-fuchsia-500/10 text-fuchsia-300 px-3 py-1 rounded-md border border-fuchsia-500/30">
                <span className="font-medium">{poll.category}</span>
              </div>
            )}
          </header>

          <div className="space-y-4">
            {!showResults ? (
              <>
                {poll.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleVote(option.id)}
                    disabled={loading || hasVoted || !user}
                    className={`w-full text-left p-5 rounded-lg border-2 transition-all ${
                      loading || hasVoted
                        ? 'bg-slate-800/50 border-slate-700/50 cursor-not-allowed opacity-60'
                        : user
                        ? 'bg-slate-800/30 border-fuchsia-500/30 hover:border-fuchsia-500/60 hover:bg-fuchsia-500/10 cursor-pointer transform hover:scale-[1.02] hover:shadow-lg hover:shadow-fuchsia-500/20'
                        : 'bg-slate-800/30 border-slate-700/50 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span className="text-lg font-medium text-white">
                      {option.option_text}
                    </span>
                  </button>
                ))}

                {!user && (
                  <p className="text-center text-sm text-slate-400 mt-4">
                    Sign in to vote on this poll
                  </p>
                )}

                {error && (
                  <p className="text-center text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    {error}
                  </p>
                )}
              </>
            ) : results ? (
              <div className="space-y-4">
                <div className="text-center text-sm text-slate-400 pb-3 border-b border-slate-700/50">
                  {results.total_votes} {results.total_votes === 1 ? 'vote' : 'votes'}
                </div>

                {results.options.map((option) => {
                  const percentage = getPercentage(option.vote_count, results.total_votes);
                  const isUserChoice = selectedOption === option.id;

                  return (
                    <div
                      key={option.id}
                      className={`relative overflow-hidden rounded-lg border-2 ${
                        isUserChoice
                          ? 'border-fuchsia-500/60 bg-fuchsia-500/10'
                          : 'border-slate-700/50 bg-slate-800/30'
                      }`}
                    >
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 transition-all duration-700 ease-out"
                        style={{ width: `${percentage}%` }}
                      />

                      <div className="relative p-5 flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isUserChoice && (
                            <CheckCircle className="w-5 h-5 text-fuchsia-400 flex-shrink-0" />
                          )}
                          <span className="text-lg font-medium text-white">
                            {option.option_text}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                          <span className="text-sm text-slate-400">
                            {option.vote_count}
                          </span>
                          <span className="text-xl font-bold text-white min-w-[3rem] text-right">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </article>

        <div ref={commentsRef}>
          <CommentSection
            itemId={poll.id}
            itemType="poll"
            comments={comments}
            onCommentAdded={loadComments}
            onCommentDeleted={loadComments}
            onCommentUpdated={loadComments}
            onSignIn={onSignIn}
          />
        </div>
      </div>
    </div>
  );
}
