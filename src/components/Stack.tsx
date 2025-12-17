import { useState, useEffect } from 'react';
import { Layers, Trash2, Package, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { stackService } from '../services/stackService';
import type { Post } from '../types/database';

interface StackProps {
  onViewPost: (post: Post) => void;
  onBack?: () => void;
}

export function Stack({ onViewPost, onBack }: StackProps) {
  const { user } = useAuth();
  const [stackedPosts, setStackedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    loadStack();
  }, [user]);

  const loadStack = async () => {
    if (!user) {
      setStackedPosts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const posts = await stackService.getUserStack(user.id);
    setStackedPosts(posts);
    setIsLoading(false);
  };

  const handlePop = async (postId: string) => {
    if (!user) return;

    const success = await stackService.popFromStack(postId, user.id);
    if (success) {
      setStackedPosts(prev => prev.filter(post => post.id !== postId));
    }
  };

  const handleClearStack = async () => {
    if (!user) return;
    if (!confirm('Are you sure you want to clear your entire stack?')) return;

    setIsClearing(true);
    const success = await stackService.clearStack(user.id);
    if (success) {
      setStackedPosts([]);
    }
    setIsClearing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 px-4">
        <div className="max-w-4xl mx-auto py-12">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center">
            <Layers className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Sign in to view your stack</h2>
            <p className="text-slate-400">Push posts to your stack to read them later</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 px-4">
        <div className="max-w-4xl mx-auto py-12">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400">Loading your stack...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 px-4">
      <div className="max-w-4xl mx-auto py-8 md:py-12">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}

        <div className="mb-6 md:mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-xl border border-blue-500/30">
              <Layers className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">My Stack</h1>
              <p className="text-sm text-slate-400 mt-1">
                {stackedPosts.length} {stackedPosts.length === 1 ? 'post' : 'posts'} in stack (LIFO)
              </p>
            </div>
          </div>

          {stackedPosts.length > 0 && (
            <button
              onClick={handleClearStack}
              disabled={isClearing}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/50 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear entire stack"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear Stack</span>
            </button>
          )}
        </div>

        {stackedPosts.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-12 text-center">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Your Stack is Empty</h2>
            <p className="text-slate-400 mb-4">
              Push posts to your stack to read them later
            </p>
            <p className="text-sm text-slate-500 font-mono">
              stack.push(post) // Add posts to the top
            </p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {stackedPosts.map((post, index) => (
              <div
                key={post.id}
                className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 md:p-6 hover:border-blue-500/50 transition-all group relative"
                style={{
                  transform: `translateY(${index * -2}px)`,
                  boxShadow: index === 0 ? '0 4px 20px rgba(59, 130, 246, 0.15)' : 'none'
                }}
              >
                {index === 0 && (
                  <div className="absolute -top-3 left-4 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                    TOP
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                      {post.title}
                    </h3>

                    {post.summary && (
                      <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                        {post.summary}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {post.primary_topic && (
                        <span className="bg-cyan-500/10 text-cyan-300 px-2 py-1 rounded-md border border-cyan-500/30 font-medium">
                          {post.primary_topic}
                        </span>
                      )}
                      {post.difficulty && (
                        <span className="bg-orange-500/10 text-orange-300 px-2 py-1 rounded-md border border-orange-500/30 font-medium">
                          {post.difficulty}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => onViewPost(post)}
                      className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg border border-cyan-500/50 transition-all hover:scale-105 font-medium text-sm whitespace-nowrap"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handlePop(post.id)}
                      className="px-4 py-2 bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg border border-slate-600/50 hover:border-red-500/50 transition-all hover:scale-105 font-medium text-sm whitespace-nowrap"
                      title="Pop from stack"
                    >
                      Pop
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
