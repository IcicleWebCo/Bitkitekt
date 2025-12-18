import { useState, useEffect, useMemo, useRef } from 'react';
import { FileCode, LogOut, User as UserIcon, ArrowLeft, Menu, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { postService } from './services/postService';
import { pollService } from './services/pollService';
import { commentService } from './services/commentService';
import { saveFilterPreferences, saveDifficultyPreferences } from './services/userPreferencesService';
import { topicService } from './services/topicService';
import type { TopicGradient } from './services/topicService';
import { PostCard } from './components/PostCard';
import { PostCardDetail } from './components/PostCardDetail';
import { PollCard } from './components/PollCard';
import { PollDetail } from './components/PollDetail';
import { UnifiedHeader } from './components/UnifiedHeader';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';
import { EmailConfirmation } from './components/EmailConfirmation';
import { Profile } from './components/Profile';
import { About } from './components/About';
import { Stack } from './components/Stack';
import { useAuth } from './contexts/AuthContext';
import type { Post, PollWithOptions } from './types/database';
import { TIMEOUTS } from './constants';
import { useHeaderHeight } from './hooks/useHeaderHeight';

type AuthMode = 'login' | 'register' | 'forgot-password';
type ConfirmationState = { type: 'confirmed' | 'error'; message?: string } | null;
type FeedItem = { type: 'post'; data: Post } | { type: 'poll'; data: PollWithOptions };

function App() {
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [polls, setPolls] = useState<PollWithOptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(new Set());
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [emailConfirmation, setEmailConfirmation] = useState<ConfirmationState>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showStack, setShowStack] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<PollWithOptions | null>(null);
  const [scrollToComments, setScrollToComments] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commentCounts, setCommentCounts] = useState<Map<string, number>>(new Map());
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [topicGradients, setTopicGradients] = useState<Map<string, TopicGradient>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const headerHeight = useHeaderHeight(headerRef, 80);
  const authEventProcessedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadPosts();

    const timeout = setTimeout(() => {
      if (loading) {
        console.error('Loading timeout - forcing completion');
        setLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadPosts();
    }
  }, [user?.id, authLoading]);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');

    if (accessToken && !authEventProcessedRef.current.has(accessToken)) {
      authEventProcessedRef.current.add(accessToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      } else if (event === 'SIGNED_IN' && session) {
        if (isPasswordRecovery) {
          setIsPasswordRecovery(false);
        }
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const confirmationType = hashParams.get('type');

        if ((confirmationType === 'email' || confirmationType === 'signup') &&
            !authEventProcessedRef.current.has(`${confirmationType}-${session.user.id}`)) {
          authEventProcessedRef.current.add(`${confirmationType}-${session.user.id}`);
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
        setSelectedDifficulties(new Set());
        authEventProcessedRef.current.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, [isPasswordRecovery]);

  useEffect(() => {
    if (profile && !preferencesLoaded) {
      const topicPreferences = profile.filter_preferences || [];
      const difficultyPreferences = profile.difficulty_preferences || [];
      setSelectedTopics(new Set(topicPreferences));
      setSelectedDifficulties(new Set(difficultyPreferences));
      setPreferencesLoaded(true);
    }
  }, [profile, preferencesLoaded]);

  useEffect(() => {
    if (profile && preferencesLoaded) {
      const topicPreferences = profile.filter_preferences || [];
      const difficultyPreferences = profile.difficulty_preferences || [];
      const currentTopicPreferences = Array.from(selectedTopics).sort().join(',');
      const newTopicPreferences = topicPreferences.sort().join(',');
      const currentDifficultyPreferences = Array.from(selectedDifficulties).sort().join(',');
      const newDifficultyPreferences = difficultyPreferences.sort().join(',');

      if (currentTopicPreferences !== newTopicPreferences) {
        setSelectedTopics(new Set(topicPreferences));
      }
      if (currentDifficultyPreferences !== newDifficultyPreferences) {
        setSelectedDifficulties(new Set(difficultyPreferences));
      }
    }
  }, [profile?.filter_preferences, profile?.difficulty_preferences, preferencesLoaded]);

  useEffect(() => {
    if (!user || !preferencesLoaded) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSavingPreferences(true);
        await Promise.all([
          saveFilterPreferences(user.id, Array.from(selectedTopics)),
          saveDifficultyPreferences(user.id, Array.from(selectedDifficulties))
        ]);
        await refreshProfile();
      } catch (err) {
        console.error('Failed to save preferences:', err);
      } finally {
        setSavingPreferences(false);
      }
    }, TIMEOUTS.DEBOUNCE_FILTER_PREFERENCES);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [selectedTopics, selectedDifficulties, user, preferencesLoaded, refreshProfile]);

  const loadPosts = async () => {
    try {
      const [postsData, pollsData] = await Promise.all([
        postService.getAllPosts(),
        pollService.getActivePolls(user?.id)
      ]);

      setPosts(postsData);
      setPolls(pollsData);

      const counts = new Map<string, number>();

      await Promise.all([
        ...postsData.map(async (post) => {
          try {
            const count = await commentService.getCommentCount(post.id);
            counts.set(post.id, count);
          } catch (err) {
            console.error(`Failed to load comment count for post ${post.id}:`, err);
          }
        }),
        ...pollsData.map(async (poll) => {
          try {
            const count = await commentService.getPollCommentCount(poll.id);
            counts.set(poll.id, count);
          } catch (err) {
            console.error(`Failed to load comment count for poll ${poll.id}:`, err);
          }
        })
      ]);

      setCommentCounts(counts);

      try {
        const topics = await topicService.getAllTopics();
        const gradientsMap = new Map<string, TopicGradient>();
        topics.forEach((topic) => {
          gradientsMap.set(topic.name, topicService.topicToGradient(topic));
        });
        setTopicGradients(gradientsMap);
      } catch (err) {
        console.error('Failed to load topic gradients:', err);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const uniqueSyntaxes = useMemo(() => {
    const syntaxes = new Set<string>();
    posts.forEach(post => {
      if (post.syntax) {
        syntaxes.add(post.syntax);
      }
    });
    return Array.from(syntaxes).sort();
  }, [posts]);

  const syntaxCounts = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach(post => {
      if (post.syntax) {
        counts.set(post.syntax, (counts.get(post.syntax) || 0) + 1);
      }
    });
    return counts;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let filtered = posts;

    if (selectedTopics.size > 0) {
      filtered = filtered.filter(post =>
        post.syntax && selectedTopics.has(post.syntax)
      );
    }

    if (selectedDifficulties.size > 0) {
      filtered = filtered.filter(post =>
        post.difficulty && selectedDifficulties.has(post.difficulty)
      );
    }

    return filtered;
  }, [posts, selectedTopics, selectedDifficulties]);

  const feedItems = useMemo(() => {
    const items: FeedItem[] = [];
    const postsToUse = filteredPosts;
    const pollsToUse = [...polls];

    if (postsToUse.length === 0 && pollsToUse.length === 0) {
      return [];
    }

    const pollFrequency = profile?.poll_frequency || 'normal';

    if (pollFrequency === 'none') {
      postsToUse.forEach((post) => {
        items.push({ type: 'post', data: post });
      });
      return items;
    }

    const frequencyMap = {
      frequent: 3,
      normal: 5,
      rare: 9
    };

    let pollIndex = 0;
    const pollInterval = frequencyMap[pollFrequency];

    postsToUse.forEach((post, index) => {
      items.push({ type: 'post', data: post });

      if (pollsToUse.length > 0 && (index + 1) % pollInterval === 0 && pollIndex < pollsToUse.length) {
        items.push({ type: 'poll', data: pollsToUse[pollIndex] });
        pollIndex++;
      }
    });

    while (pollIndex < pollsToUse.length) {
      items.push({ type: 'poll', data: pollsToUse[pollIndex] });
      pollIndex++;
    }

    return items;
  }, [filteredPosts, polls, profile?.poll_frequency]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (selectedPost || selectedPoll) {
        event.preventDefault();
        setSelectedPost(null);
        setSelectedPoll(null);
        setScrollToComments(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedPost, selectedPoll]);

  useEffect(() => {
    if (selectedPost || selectedPoll) {
      window.history.pushState({ view: 'detail' }, '');
    }
  }, [selectedPost, selectedPoll]);

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

  const toggleDifficulty = (difficulty: string) => {
    scrollToTop();
    setSelectedDifficulties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(difficulty)) {
        newSet.delete(difficulty);
      } else {
        newSet.add(difficulty);
      }
      return newSet;
    });
  };

  const clearAllFilters = () => {
    scrollToTop();
    setSelectedTopics(new Set());
    setSelectedDifficulties(new Set());
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

  if (showAuthModal && !user) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="relative">
          <button
            onClick={() => setShowAuthModal(false)}
            className="absolute -top-2 -right-2 p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
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
      </div>
    );
  }

  if (showProfile && user) {
    return <Profile onBack={() => setShowProfile(false)} />;
  }

  if (showAbout) {
    return <About onBack={() => setShowAbout(false)} />;
  }

  if (showStack) {
    return (
      <Stack
        onViewPost={(post) => {
          setShowStack(false);
          setSelectedPost(post);
        }}
        onBack={() => setShowStack(false)}
      />
    );
  }

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="fixed top-0 left-0 right-0 z-[60] bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to List</span>
              <span className="sm:hidden">Back</span>
            </button>

            {user ? (
              <>
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
              </>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors font-medium"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto">
          <PostCardDetail
            post={selectedPost}
            scrollToComments={scrollToComments}
            onSignIn={() => {
              setAuthMode('login');
              setShowAuthModal(true);
            }}
            onCommentCountChange={(postId, count) => {
              setCommentCounts(prev => {
                const newMap = new Map(prev);
                newMap.set(postId, count);
                return newMap;
              });
            }}
          />
        </div>
      </div>
    );
  }

  if (selectedPoll) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="fixed top-0 left-0 right-0 z-[60] bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to List</span>
              <span className="sm:hidden">Back</span>
            </button>

            {user ? (
              <>
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
              </>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors font-medium"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto">
          <PollDetail
            poll={selectedPoll}
            scrollToComments={scrollToComments}
            onSignIn={() => {
              setAuthMode('login');
              setShowAuthModal(true);
            }}
            onCommentCountChange={(pollId, count) => {
              setCommentCounts(prev => {
                const newMap = new Map(prev);
                newMap.set(pollId, count);
                return newMap;
              });
            }}
            onVoteSubmitted={() => {
              setSelectedPoll(null);
              loadPosts();
            }}
          />
        </div>
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <FileCode className="w-20 h-20 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-xl">No content found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {uniqueSyntaxes.length > 0 && (
        <UnifiedHeader
          ref={headerRef}
          topics={uniqueSyntaxes}
          selectedTopics={selectedTopics}
          onToggleTopic={toggleTopic}
          onClearAll={clearAllFilters}
          savingPreferences={savingPreferences}
          user={user}
          profile={profile}
          onSignIn={() => {
            setAuthMode('login');
            setShowAuthModal(true);
          }}
          onSignOut={signOut}
          onShowProfile={() => setShowProfile(true)}
          onShowAbout={() => setShowAbout(true)}
          onShowStack={() => setShowStack(true)}
          topicGradients={topicGradients}
          selectedDifficulties={selectedDifficulties}
          onToggleDifficulty={toggleDifficulty}
          onScrollToTop={scrollToTop}
          syntaxCounts={syntaxCounts}
        />
      )}
      <div
        ref={scrollContainerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-slate-950 transition-[padding] duration-300 ease-out"
        style={{ paddingTop: `${Math.max(headerHeight + 24, 80)}px` }}
      >
        {feedItems.length === 0 ? (
          <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="text-center">
              <FileCode className="w-20 h-20 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-xl">No content matches your filters</p>
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg border border-cyan-500/50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          feedItems.map((item, index) => {
            if (item.type === 'post') {
              return (
                <PostCard
                  key={`post-${item.data.id}`}
                  post={item.data}
                  onViewDetail={() => {
                    setScrollToComments(false);
                    setSelectedPost(item.data);
                  }}
                  onViewComments={() => {
                    setScrollToComments(true);
                    setSelectedPost(item.data);
                  }}
                  commentCount={commentCounts.get(item.data.id)}
                />
              );
            } else {
              return (
                <PollCard
                  key={`poll-${item.data.id}`}
                  poll={item.data}
                  onViewDetail={() => {
                    setScrollToComments(false);
                    setSelectedPoll(item.data);
                  }}
                  onViewComments={() => {
                    setScrollToComments(true);
                    setSelectedPoll(item.data);
                  }}
                  commentCount={commentCounts.get(item.data.id)}
                />
              );
            }
          })
        )}
      </div>
    </>
  );
}

export default App;
