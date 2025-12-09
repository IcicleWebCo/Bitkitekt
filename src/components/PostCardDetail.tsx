import { useState } from 'react';
import { ExternalLink, AlertTriangle, TrendingUp, TrendingDown, Code2, Package, Tag, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { CommentSection } from './CommentSection';
import type { Post } from '../types/database';

const riskColors = {
  Low: 'bg-green-500/20 text-green-300 border-green-500/50',
  Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
  High: 'bg-red-500/20 text-red-300 border-red-500/50',
};

interface PostCardDetailProps {
  post: Post;
}

export function PostCardDetail({ post }: PostCardDetailProps) {
  const [expandedSnippets, setExpandedSnippets] = useState<Set<number>>(new Set());

  const toggleSnippet = (idx: number) => {
    setExpandedSnippets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };
  return (
    <div className="min-h-screen w-full snap-start flex items-center justify-center p-3 sm:p-4 md:p-8 pt-20 sm:pt-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />

      <div className="max-w-5xl w-full relative z-10">
        <article className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl md:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-10 space-y-4 md:space-y-6">

          <header className="space-y-3 md:space-y-4 border-b border-slate-700/50 pb-4 md:pb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight">
              {post.title}
            </h2>

            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs sm:text-sm">
              {post.primary_topic && (
                <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-cyan-500/10 text-cyan-300 px-2 sm:px-3 py-1 rounded-md border border-cyan-500/30">
                  <Code2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="font-medium">{post.primary_topic}</span>
                </div>
              )}

              {post.difficulty && (
                <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-orange-500/10 text-orange-300 px-2 sm:px-3 py-1 rounded-md border border-orange-500/30">
                  <span className="font-medium">{post.difficulty}</span>
                </div>
              )}

              {post.compatibility_min_version && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                  <span className="text-slate-400">Min:</span>
                  <span className="text-slate-200 font-mono">{post.compatibility_min_version}</span>
                </div>
              )}

              {post.doc_url && (
                <a
                  href={post.doc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 sm:gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                >
                  <span className="hidden sm:inline">View Documentation</span>
                  <span className="sm:hidden">Docs</span>
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                </a>
              )}
            </div>
          </header>

          <div className="space-y-4 md:space-y-6">
            {(post.summary || post.problem_solved) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {post.summary && (
                  <section>
                    <h2 className="text-sm md:text-base font-semibold text-cyan-400 mb-2">Summary</h2>
                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed">{post.summary}</p>
                  </section>
                )}

                {post.problem_solved && (
                  <section className="bg-slate-800/50 rounded-lg p-3 md:p-4 border border-slate-700/50">
                    <h2 className="text-sm md:text-base font-semibold text-emerald-400 mb-2">Problem Solved</h2>
                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed">{post.problem_solved}</p>
                  </section>
                )}
              </div>
            )}

            {post.code_snippets && post.code_snippets.length > 0 && (
              <section className="space-y-3 md:space-y-4">
                {post.code_snippets.map((snippet, idx) => {
                  const isExpanded = expandedSnippets.has(idx);
                  const previewContent = snippet.content.split('\n')[0];

                  return (
                    <div key={idx} className="bg-slate-950 rounded-lg border border-slate-700/50 overflow-hidden">
                      <button
                        onClick={() => toggleSnippet(idx)}
                        className="w-full bg-slate-800/50 px-3 md:px-4 py-2 border-b border-slate-700/50 hover:bg-slate-800/70 transition-colors"
                      >
                        <div className="flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Code2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400 flex-shrink-0" />
                            <span className="text-xs md:text-sm font-medium text-slate-300 truncate">
                              {snippet.label || 'Code Example'}
                            </span>
                            {snippet.language && (
                              <span className="hidden sm:inline text-xs text-slate-500">{snippet.language}</span>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>

                      {isExpanded ? (
                        <pre className="p-3 md:p-4 overflow-x-auto text-white">
                          <code className="text-xs md:text-sm font-mono">{snippet.content}</code>
                        </pre>
                      ) : (
                        <div className="p-3 md:p-4 overflow-hidden">
                          <code className="text-xs md:text-sm font-mono text-slate-400 truncate block">
                            {previewContent}...
                          </code>
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {(post.upside || post.downside) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
                {post.upside && (
                  <section className="bg-emerald-500/5 rounded-lg p-3 md:p-4 border border-emerald-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
                      <h2 className="text-sm md:text-base font-semibold text-emerald-400">Upside</h2>
                    </div>
                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed">{post.upside}</p>
                  </section>
                )}

                {post.downside && (
                  <section className="bg-orange-500/5 rounded-lg p-3 md:p-4 border border-orange-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-400" />
                      <h2 className="text-sm md:text-base font-semibold text-orange-400">Downside</h2>
                    </div>
                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed">{post.downside}</p>
                  </section>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {(post.performance_impact || post.compatibility_deprecated_in) && (
                <section>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-2 md:mb-3">
                    {post.performance_impact && (
                      <h2 className="text-base md:text-lg font-semibold text-sky-400">Performance Impact</h2>
                    )}
                    {post.compatibility_deprecated_in && (
                      <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                        <span className="text-slate-400">Deprecated:</span>
                        <span className="text-orange-400 font-mono">{post.compatibility_deprecated_in}</span>
                      </div>
                    )}
                  </div>
                  {post.performance_impact && (
                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed">{post.performance_impact}</p>
                  )}
                </section>
              )}

              {post.tags && post.tags.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <Tag className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                    <h2 className="text-base md:text-lg font-semibold text-slate-300">Tags</h2>
                  </div>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {post.tags.map((tag, idx) => (
                      <span key={idx} className="bg-slate-800 text-slate-300 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm border border-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {post.dependencies && post.dependencies.length > 0 && (
              <section className="bg-slate-800/30 rounded-lg p-3 md:p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <Package className="w-4 h-4 md:w-5 md:h-5 text-violet-400" />
                  <h2 className="text-base md:text-lg font-semibold text-violet-400">Dependencies</h2>
                </div>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {post.dependencies.map((dep, idx) => (
                    <span key={idx} className="bg-violet-500/10 text-violet-300 px-2 md:px-3 py-0.5 md:py-1 rounded-md text-xs md:text-sm font-mono border border-violet-500/30">
                      {dep}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          <CommentSection postId={post.id} />

        </article>
      </div>
    </div>
  );
}
