import { useState, useEffect } from 'react';
import { BarChart3, MessageCircle, ArrowRight, CheckCircle } from 'lucide-react';
import { pollService } from '../services/pollService';
import type { PollWithOptions, PollResults } from '../types/database';
import { useAuth } from '../contexts/AuthContext';

interface PollCardProps {
  poll: PollWithOptions;
  onViewDetail?: () => void;
  onViewComments?: () => void;
  commentCount?: number;
}

export function PollCard({ poll, onViewDetail, onViewComments, commentCount }: PollCardProps) {
  const { user } = useAuth();
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserVote();
    }
  }, [user, poll.id]);

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
    <div className="min-h-screen w-full snap-start flex items-center justify-center p-3 sm:p-4 md:p-8 pt-20 sm:pt-24 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-fuchsia-900/30 via-transparent to-transparent" />

      <div className="max-w-4xl w-full relative z-10">
        <article className="bg-slate-900/60 backdrop-blur-xl border border-fuchsia-500/30 rounded-xl md:rounded-2xl shadow-2xl p-3 sm:p-4 md:p-7 space-y-3 md:space-y-4 relative">

          <div className="absolute top-4 right-4 bg-fuchsia-500/20 text-fuchsia-300 px-3 py-1 rounded-full text-xs font-semibold border border-fuchsia-500/50 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            POLL
          </div>

          <header className="space-y-2 md:space-y-3 border-b border-slate-700/50 pb-3 md:pb-4">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight pr-20">
              {poll.question}
            </h2>

            {poll.description && (
              <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                {poll.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs sm:text-sm">
              {poll.category && (
                <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-fuchsia-500/10 text-fuchsia-300 px-2 sm:px-3 py-1 rounded-md border border-fuchsia-500/30">
                  <span className="font-medium">{poll.category}</span>
                </div>
              )}

              {commentCount !== undefined && commentCount > 0 && onViewComments && (
                <button
                  onClick={onViewComments}
                  className="inline-flex items-center gap-1 sm:gap-1.5 bg-slate-700/50 hover:bg-slate-700/80 text-slate-300 hover:text-white px-2 sm:px-3 py-1 rounded-md border border-slate-600/50 hover:border-slate-500/50 transition-all cursor-pointer"
                  title="View comments"
                >
                  <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="font-medium">{commentCount}</span>
                </button>
              )}

              {onViewDetail && (
                <button
                  onClick={onViewDetail}
                  className="inline-flex items-center gap-1 sm:gap-1.5 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 px-2 sm:px-3 py-1 rounded-md border border-fuchsia-500/50 transition-all cursor-pointer"
                  title="View details"
                >
                  <span className="font-medium">Details</span>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              )}
            </div>
          </header>

          <div className="space-y-2 md:space-y-3">
            {!showResults ? (
              <>
                {poll.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleVote(option.id)}
                    disabled={loading || hasVoted || !user}
                    className={`w-full text-left p-3 md:p-4 rounded-lg border-2 transition-all ${
                      loading || hasVoted
                        ? 'bg-slate-800/50 border-slate-700/50 cursor-not-allowed opacity-60'
                        : user
                        ? 'bg-slate-800/30 border-fuchsia-500/30 hover:border-fuchsia-500/60 hover:bg-fuchsia-500/10 cursor-pointer transform hover:scale-[1.02] hover:shadow-lg hover:shadow-fuchsia-500/20'
                        : 'bg-slate-800/30 border-slate-700/50 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span className="text-sm md:text-base font-medium text-white">
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
              <div className="space-y-2 md:space-y-3">
                <div className="text-center text-xs md:text-sm text-slate-400 pb-2 border-b border-slate-700/50">
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

                      <div className="relative p-3 md:p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isUserChoice && (
                            <CheckCircle className="w-4 h-4 text-fuchsia-400 flex-shrink-0" />
                          )}
                          <span className="text-sm md:text-base font-medium text-white truncate">
                            {option.option_text}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <span className="text-xs text-slate-400">
                            {option.vote_count}
                          </span>
                          <span className="text-base md:text-lg font-bold text-white min-w-[2.5rem] text-right">
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
      </div>

      <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 text-slate-400 text-xs md:text-sm animate-bounce">
        Scroll for more
      </div>
    </div>
  );
}
