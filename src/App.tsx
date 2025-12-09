import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FileCode, LogOut, User as UserIcon, ArrowLeft, Menu, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { postService } from './services/postService';
import { commentService } from './services/commentService';
import { saveFilterPreferences } from './services/userPreferencesService';
import { PostCard } from './components/PostCard';
import { PostCardDetail } from './components/PostCardDetail';
import { FilterBar } from './components/FilterBar';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';
import { EmailConfirmation } from './components/EmailConfirmation';
import { Profile } from './components/Profile';
import { useAuth } from './contexts/AuthContext';
import type { Post } from './types/database';

type AuthMode = 'login' | 'register' | 'forgot-password';
type ConfirmationState = { type: 'confirmed' | 'error'; message?: string } | null;

function App() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [emailConfirmation, setEmailConfirmation] = useState<ConfirmationState>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [scrollToComments, setScrollToComments] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commentCounts, setCommentCounts] = useState<Map<string, number>>(new Map());
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        } else if (event === 'SIGNED_IN' && session) {
          if (isPasswordRecovery) {
            setIsPasswordRecovery(false);
          }
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          if (hashParams.get('type') === 'email' || hashParams.get('type') === 'signup') {
            setEmailConfirmation({ type: 'confirmed' });
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else if (event === 'USER_UPDATED') {
          if (isPasswordRecovery) {
            setIsPasswordRecovery(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setPreferencesLoaded(false);
          setSelectedTopics(new Set());
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, [isPasswordRecovery]);

  useEffect(() => {
    if (profile && !preferencesLoaded) {
      const preferences = profile.filter_preferences || [];
      setSelectedTopics(new Set(preferences));
      setPreferencesLoaded(true);
    }
  }, [profile, preferencesLoaded]);

  useEffect(() => {
    if (!user || !preferencesLoaded) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSavingPreferences(true);
        await saveFilterPreferences(user.id, Array.from(selectedTopics));
      } catch (err) {
        console.error('Failed to save filter preferences:', err);
      } finally {
        setSavingPreferences(false);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [selectedTopics, user, preferencesLoaded]);

  const loadPosts = async () => {
    try {
      console.log('loading posts');
      const data = await postService.getAllPosts();
      console.log(data);
      setPosts(data);

      const counts = new Map<string, number>();
      await Promise.all(
        data.map(async (post) => {
          try {
            const count = await commentService.getCommentCount(post.id);
            counts.set(post.id, count);
          } catch (err) {
            console.error(`Failed to load comment count for post ${post.id}:`, err);
          }
        })
      );
      setCommentCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const uniqueTopics = useMemo(() => {
    const topics = new Set<string>();
    posts.forEach(post => {
      if (post.primary_topic) {
        topics.add(post.primary_topic);
      }
    });
    return Array.from(topics).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (selectedTopics.size === 0) {
      return posts;
    }
    return posts.filter(post =>
      post.primary_topic && selectedTopics.has(post.primary_topic)
    );
  }, [posts, selectedTopics]);

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleTopic = (topic: string) => {
    scrollToTop();
    setSelectedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topic)) {
        newSet.delete(topic);
      } else {
        newSet.add(topic);
      }
      return newSet;
    });
  };

  const clearAllFilters = () => {
    scrollToTop();
    setSelectedTopics(new Set());
  };

  if (authLoading || loading) {
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

  if (emailConfirmation) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <EmailConfirmation
          type={emailConfirmation.type}
          message={emailConfirmation.message}
          onContinue={() => setEmailConfirmation(null)}
        />
      </div>
    );
  }

  if (isPasswordRecovery) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <ResetPassword onComplete={() => setIsPasswordRecovery(false)} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        {authMode === 'login' && (
          <Login
            onToggleMode={() => setAuthMode('register')}
            onForgotPassword={() => setAuthMode('forgot-password')}
          />
        )}
        {authMode === 'register' && (
          <Register onToggleMode={() => setAuthMode('login')} />
        )}
        {authMode === 'forgot-password' && (
          <ForgotPassword onBack={() => setAuthMode('login')} />
        )}
      </div>
    );
  }

  if (showProfile) {
    return <Profile onBack={() => setShowProfile(false)} />;
  }

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="fixed top-0 left-0 right-0 z-[60] bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedPost(null);
                setScrollToComments(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to List</span>
              <span className="sm:hidden">Back</span>
            </button>

            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-sm font-medium text-white">{profile?.username}</span>
              </div>
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors text-sm"
              >
                <UserIcon className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            <div className="md:hidden relative">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {mobileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 bg-black/20 z-40"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-12 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                    <div className="p-3 border-b border-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="text-sm font-medium text-white">{profile?.username}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowProfile(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-left"
                    >
                      <UserIcon className="w-4 h-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-left border-t border-slate-700"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-y-auto">
          <PostCardDetail post={selectedPost} scrollToComments={scrollToComments} />
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
    <>
      <div className="fixed top-10 right-0 z-[60] p-4">
        <div className="hidden md:flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-lg px-4 py-2 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-sm font-medium text-white">{profile?.username}</span>
          </div>
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors text-sm"
          >
            <UserIcon className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <div className="md:hidden relative">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-xl text-slate-300 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {mobileMenuOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/20 z-40"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="absolute right-0 top-12 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                <div className="p-3 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-sm font-medium text-white">{profile?.username}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowProfile(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-left"
                >
                  <UserIcon className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-left border-t border-slate-700"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {uniqueTopics.length > 0 && (
        <FilterBar
          topics={uniqueTopics}
          selectedTopics={selectedTopics}
          onToggleTopic={toggleTopic}
          onClearAll={clearAllFilters}
          savingPreferences={savingPreferences}
        />
      )}
      <div ref={scrollContainerRef} className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-slate-950 pt-36 md:pt-36">
        {filteredPosts.length === 0 ? (
          <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="text-center">
              <FileCode className="w-20 h-20 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-xl">No posts match your filters</p>
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg border border-cyan-500/50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onViewDetail={() => {
                setScrollToComments(false);
                setSelectedPost(post);
              }}
              onViewComments={() => {
                setScrollToComments(true);
                setSelectedPost(post);
              }}
              commentCount={commentCounts.get(post.id)}
            />
          ))
        )}
      </div>
    </>
  );
}

export default App;
