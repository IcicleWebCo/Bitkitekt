import { useState, useEffect } from 'react';
import { ExternalLink, AlertTriangle, TrendingUp, TrendingDown, Code2, Package, Tag, Calendar, FileCode } from 'lucide-react';
import { postService } from './services/postService';
import type { Post } from './types/database';

const riskColors = {
  Low: 'bg-green-500/20 text-green-300 border-green-500/50',
  Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
  High: 'bg-red-500/20 text-red-300 border-red-500/50',
};

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      console.log('loading posts');
      const data = await postService.getAllPosts();
      console.log(data);
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-lg">Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 max-w-md">
          <p className="text-red-400 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <FileCode className="w-20 h-20 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-xl">No posts found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-slate-950">
      {posts.map((post) => (
        <div
          key={post.id}
          className="h-screen w-full snap-start flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />

          <div className="max-w-4xl w-full h-full relative z-10 flex flex-col py-8">
            <article className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl p-4 md:p-6 flex-1 flex flex-col overflow-hidden">

              <header className="flex-shrink-0 pb-3 border-b border-slate-700/50 mb-3">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                    {post.title}
                  </h1>
                  {post.risk_level && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs ${riskColors[post.risk_level]}`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="font-semibold">{post.risk_level}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {post.primary_topic && (
                    <div className="inline-flex items-center gap-1.5 bg-cyan-500/10 text-cyan-300 px-2.5 py-1 rounded-md border border-cyan-500/30 text-xs">
                      <Code2 className="w-3 h-3" />
                      <span className="font-medium">{post.primary_topic}</span>
                    </div>
                  )}
                  {post.doc_url && (
                    <a
                      href={post.doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors text-xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Docs</span>
                    </a>
                  )}
                </div>
              </header>

              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-3">
                    {post.summary && (
                      <section>
                        <p className="text-slate-300 text-sm leading-relaxed">{post.summary}</p>
                      </section>
                    )}

                    {post.problem_solved && (
                      <section className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        <h2 className="text-xs font-semibold text-emerald-400 mb-1">Problem Solved</h2>
                        <p className="text-slate-300 text-sm leading-relaxed">{post.problem_solved}</p>
                      </section>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      {post.upside && (
                        <section className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/30">
                          <div className="flex items-center gap-1.5 mb-1">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            <h2 className="text-xs font-semibold text-emerald-400">Upside</h2>
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed">{post.upside}</p>
                        </section>
                      )}

                      {post.downside && (
                        <section className="bg-orange-500/5 rounded-lg p-3 border border-orange-500/30">
                          <div className="flex items-center gap-1.5 mb-1">
                            <TrendingDown className="w-3.5 h-3.5 text-orange-400" />
                            <h2 className="text-xs font-semibold text-orange-400">Downside</h2>
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed">{post.downside}</p>
                        </section>
                      )}
                    </div>

                    {post.performance_impact && (
                      <section className="bg-slate-800/30 rounded-lg p-2.5 border border-slate-700/50">
                        <h2 className="text-xs font-semibold text-sky-400 mb-1">Performance</h2>
                        <p className="text-slate-300 text-xs">{post.performance_impact}</p>
                      </section>
                    )}

                    {(post.compatibility_min_version || post.compatibility_deprecated_in) && (
                      <section className="bg-slate-800/30 rounded-lg p-2.5 border border-slate-700/50">
                        <h2 className="text-xs font-semibold text-slate-300 mb-1.5">Compatibility</h2>
                        {post.compatibility_min_version && (
                          <div className="flex items-center gap-2 text-xs mb-1">
                            <span className="text-slate-400">Min:</span>
                            <span className="text-slate-200 font-mono">{post.compatibility_min_version}</span>
                          </div>
                        )}
                        {post.compatibility_deprecated_in && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400">Deprecated:</span>
                            <span className="text-orange-400 font-mono">{post.compatibility_deprecated_in}</span>
                          </div>
                        )}
                      </section>
                    )}
                  </div>

                  <div className="space-y-3">
                    {post.code_snippets && post.code_snippets.length > 0 && (
                      <section className="space-y-2">
                        {post.code_snippets.map((snippet, idx) => (
                          <div key={idx} className="bg-slate-950 rounded-lg border border-slate-700/50 overflow-hidden">
                            {snippet.label && (
                              <div className="bg-slate-800/50 px-3 py-1.5 border-b border-slate-700/50">
                                <div className="flex items-center gap-1.5">
                                  <Code2 className="w-3 h-3 text-cyan-400" />
                                  <span className="text-xs font-medium text-slate-300">{snippet.label}</span>
                                  {snippet.language && (
                                    <span className="text-xs text-slate-500 ml-auto">{snippet.language}</span>
                                  )}
                                </div>
                              </div>
                            )}
                            <pre className="p-3 overflow-x-auto">
                              <code className="text-xs text-cyan-300 font-mono leading-relaxed">{snippet.content}</code>
                            </pre>
                          </div>
                        ))}
                      </section>
                    )}

                    {post.dependencies && post.dependencies.length > 0 && (
                      <section className="bg-slate-800/30 rounded-lg p-2.5 border border-slate-700/50">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Package className="w-3.5 h-3.5 text-violet-400" />
                          <h2 className="text-xs font-semibold text-violet-400">Dependencies</h2>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {post.dependencies.map((dep, idx) => (
                            <span key={idx} className="bg-violet-500/10 text-violet-300 px-2 py-0.5 rounded text-xs font-mono border border-violet-500/30">
                              {dep}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    {post.tags && post.tags.length > 0 && (
                      <section>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Tag className="w-3.5 h-3.5 text-slate-400" />
                          <h2 className="text-xs font-semibold text-slate-300">Tags</h2>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {post.tags.map((tag, idx) => (
                            <span key={idx} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-xs border border-slate-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              </div>

              <footer className="flex-shrink-0 flex items-center justify-between pt-3 mt-3 border-t border-slate-700/50">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(post.last_verified).toLocaleDateString()}</span>
                </div>
              </footer>
            </article>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-500 text-xs animate-bounce">
            Scroll for more
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
