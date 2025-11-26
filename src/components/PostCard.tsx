import { ExternalLink, AlertTriangle, TrendingUp, TrendingDown, Code2, Package, Tag, Calendar } from 'lucide-react';
import type { Post } from '../types/database';

const riskColors = {
  Low: 'bg-green-500/20 text-green-300 border-green-500/50',
  Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
  High: 'bg-red-500/20 text-red-300 border-red-500/50',
};

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <div className="min-h-screen w-full snap-start flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />

      <div className="max-w-5xl w-full relative z-10">
        <article className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 md:p-10 space-y-6">

          <header className="space-y-4 border-b border-slate-700/50 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
                {post.title}
              </h2>
              {post.difficulty && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">Difficulty:</span>
                  <span className="text-slate-200 font-mono">{post.difficulty_level}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              {post.primary_topic && (
                <div className="inline-flex items-center gap-1.5 bg-cyan-500/10 text-cyan-300 px-3 py-1 rounded-md border border-cyan-500/30">
                  <Code2 className="w-3.5 h-3.5" />
                  <span className="font-medium">{post.primary_topic}</span>
                </div>
              )}

              {post.compatibility_min_version && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">Min Version:</span>
                  <span className="text-slate-200 font-mono">{post.compatibility_min_version}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>Last verified: {new Date(post.last_verified).toLocaleDateString()}</span>
              </div>

              {post.doc_url && (
                <a
                  href={post.doc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                >
                  <span>View Documentation</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </header>

          <div className="space-y-6">
            {(post.summary || post.problem_solved) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {post.summary && (
                  <section>
                    <h2 className="text-lg font-semibold text-cyan-400 mb-2">Summary</h2>
                    <p className="text-slate-300 leading-relaxed">{post.summary}</p>
                  </section>
                )}

                {post.problem_solved && (
                  <section className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <h2 className="text-lg font-semibold text-emerald-400 mb-2">Problem Solved</h2>
                    <p className="text-slate-300 leading-relaxed">{post.problem_solved}</p>
                  </section>
                )}
              </div>
            )}

            {post.code_snippets && post.code_snippets.length > 0 && (
              <section className="space-y-4">
                {/*<h2 className="text-lg font-semibold text-cyan-400">Code Examples</h2>*/}
                {post.code_snippets.map((snippet, idx) => (
                  <div key={idx} className="bg-slate-950 rounded-lg border border-slate-700/50 overflow-hidden">
                    {snippet.label && (
                      <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm font-medium text-slate-300">{snippet.label}</span>
                          {snippet.language && (
                            <span className="text-xs text-slate-500 ml-auto">{snippet.language}</span>
                          )}
                        </div>
                      </div>
                    )}
                    <pre className="p-4 overflow-x-auto">
                      <code className="text-sm text-cyan-300 font-mono">{snippet.content}</code>
                    </pre>
                  </div>
                ))}
              </section>
            )}

            {(post.upside || post.downside) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {post.upside && (
                  <section className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <h2 className="text-base font-semibold text-emerald-400">Upside</h2>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{post.upside}</p>
                  </section>
                )}

                {post.downside && (
                  <section className="bg-orange-500/5 rounded-lg p-4 border border-orange-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-orange-400" />
                      <h2 className="text-base font-semibold text-orange-400">Downside</h2>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{post.downside}</p>
                  </section>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(post.performance_impact || post.compatibility_deprecated_in) && (
                <section>
                  <div className="flex flex-wrap items-center gap-4 mb-3">
                    {post.performance_impact && (
                      <h2 className="text-lg font-semibold text-sky-400">Performance Impact</h2>
                    )}
                    {post.compatibility_deprecated_in && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Deprecated In:</span>
                        <span className="text-orange-400 font-mono">{post.compatibility_deprecated_in}</span>
                      </div>
                    )}
                  </div>
                  {post.performance_impact && (
                    <p className="text-slate-300 leading-relaxed">{post.performance_impact}</p>
                  )}
                </section>
              )}

              {post.tags && post.tags.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-semibold text-slate-300">Tags</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, idx) => (
                      <span key={idx} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm border border-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {post.dependencies && post.dependencies.length > 0 && (
              <section className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-violet-400" />
                  <h2 className="text-lg font-semibold text-violet-400">Dependencies</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.dependencies.map((dep, idx) => (
                    <span key={idx} className="bg-violet-500/10 text-violet-300 px-3 py-1 rounded-md text-sm font-mono border border-violet-500/30">
                      {dep}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

        </article>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-500 text-sm animate-bounce">
        Scroll for more
      </div>
    </div>
  );
}
