import { useState, useRef, useEffect, forwardRef } from 'react';
import { Filter, X, ChevronLeft, ChevronRight, Search, UserIcon, LogOut, Layers, GraduationCap } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../types/database';

interface TopicGradient {
  from: string;
  to: string;
  hoverFrom: string;
  hoverTo: string;
}

interface UnifiedHeaderProps {
  topics: string[];
  selectedTopics: Set<string>;
  onToggleTopic: (topic: string) => void;
  onClearAll: () => void;
  savingPreferences?: boolean;
  user: User | null;
  profile: Profile | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onShowProfile: () => void;
  topicGradients?: Map<string, TopicGradient>;
  selectedDifficulties: Set<string>;
  onToggleDifficulty: (difficulty: string) => void;
  onScrollToTop?: () => void;
}

const topicShortNames: Record<string, string> = {
  'Entity Framework Core': 'EF Core',
  '.NET 8+': '.NET 8+',
};

const difficultyLevels = ['Beginner', 'Junior', 'Senior'];

const difficultyColors: Record<string, { bg: string; border: string; text: string }> = {
  'Beginner': {
    bg: 'bg-green-500/20',
    border: 'border-green-500/50',
    text: 'text-green-300'
  },
  'Junior': {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    text: 'text-yellow-300'
  },
  'Senior': {
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    text: 'text-red-300'
  }
};

export const UnifiedHeader = forwardRef<HTMLElement, UnifiedHeaderProps>(function UnifiedHeader({
  topics,
  selectedTopics,
  onToggleTopic,
  onClearAll,
  savingPreferences = false,
  user,
  profile,
  onSignIn,
  onSignOut,
  onShowProfile,
  topicGradients,
  selectedDifficulties,
  onToggleDifficulty,
  onScrollToTop,
}, ref) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollLeft, setShowScrollLeft] = useState(false);
  const [showScrollRight, setShowScrollRight] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const hasFilters = selectedTopics.size > 0 || selectedDifficulties.size > 0;
  const filteredTopics = searchQuery
    ? topics.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    : topics;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setIsHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    const throttledScroll = () => {
      requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, []);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowScrollLeft(scrollLeft > 10);
        setShowScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    checkScroll();
    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      container?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [filteredTopics]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  return (
    <>
      <header
        ref={ref}
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="bg-slate-950/70 backdrop-blur-2xl border-b border-slate-700/30 shadow-2xl">
          <div className="max-w-[1920px] mx-auto">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    id="SiteName"
                    onClick={() => onScrollToTop?.()}
                    className="md:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-600/50 transition-all duration-200 cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      Syntalyst
                    </span>
                  </button>
                  {/* Mobile: Filter count badge as toggle */}
                  <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="md:hidden relative group"
                  >
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200
                      ${hasFilters
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/50'
                        : 'bg-slate-800/50 border border-slate-700/50'
                      }
                    `}>
                      <Filter className={`w-5 h-5 ${hasFilters ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    {hasFilters && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/50 animate-pulse">
                        <span className="text-xs font-bold text-white">{selectedTopics.size + selectedDifficulties.size}</span>
                      </div>
                    )}
                  </button>

                  {/* Desktop: Full filter bar toggle */}
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="hidden md:flex group relative items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-700/80 hover:from-slate-700/80 hover:to-slate-600/80 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
                  >
                    <div className="relative">
                      <Filter className={`w-5 h-5 transition-all duration-300 ${hasFilters ? 'text-cyan-400 scale-110' : 'text-slate-400 group-hover:text-slate-300'}`} />
                      {hasFilters && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                      Filters
                    </span>
                    {hasFilters && (
                      <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-xs font-bold text-cyan-400">
                        {selectedTopics.size + selectedDifficulties.size}
                      </span>
                    )}
                  </button>

                  {savingPreferences && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg animate-pulse">
                      <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span className="hidden sm:inline text-xs text-cyan-400 font-medium">Saving...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {user ? (
                    <div className="relative">
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-700/80 hover:from-slate-700/80 hover:to-slate-600/80 border border-slate-600/50 hover:border-cyan-500/50 transition-all duration-300 shadow-lg group"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full flex items-center justify-center border border-cyan-400/30 group-hover:border-cyan-400/50 transition-colors">
                          <UserIcon className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="hidden sm:inline text-sm font-medium text-slate-300 group-hover:text-white transition-colors max-w-[120px] truncate">
                          {profile?.username}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showUserMenu ? 'rotate-90' : ''}`} />
                      </button>

                      {showUserMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowUserMenu(false)}
                          />
                          <div className="absolute right-0 top-14 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                            <div className="p-4 border-b border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full flex items-center justify-center border border-cyan-400/30">
                                  <UserIcon className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-white truncate">{profile?.username}</p>
                                  <p className="text-xs text-slate-400">Manage account</p>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                onShowProfile();
                                setShowUserMenu(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200 text-left group"
                            >
                              <UserIcon className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                              <span className="text-sm font-medium">Profile</span>
                            </button>
                            <button
                              onClick={() => {
                                onSignOut();
                                setShowUserMenu(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 text-left border-t border-slate-700/50 group"
                            >
                              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
                              <span className="text-sm font-medium">Sign Out</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={onSignIn}
                      className="group relative px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 group-hover:from-cyan-400 group-hover:to-blue-400 transition-all duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-white/25 to-cyan-400/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                      <span className="relative flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        Sign In
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div
                className={`hidden md:block overflow-hidden transition-all duration-500 ease-out ${
                  isExpanded ? 'max-h-[400px] opacity-100 pb-4' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="pt-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search filters..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-800/70 transition-all duration-200"
                      />
                    </div>

                    {/* Difficulty Filters */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <GraduationCap className="w-4 h-4 text-slate-400" />
                      {difficultyLevels.map((difficulty) => {
                        const isSelected = selectedDifficulties.has(difficulty);
                        const colors = difficultyColors[difficulty];

                        return (
                          <button
                            key={difficulty}
                            onClick={() => onToggleDifficulty(difficulty)}
                            className={`
                              relative px-2.5 py-1 rounded-md transition-all duration-200
                              text-xs font-medium whitespace-nowrap
                              ${isSelected
                                ? `${colors.bg} ${colors.border} ${colors.text} border`
                                : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                              }
                            `}
                          >
                            {difficulty}
                            {isSelected && (
                              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full animate-pulse" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {hasFilters && (
                      <button
                        onClick={onClearAll}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 transition-all duration-200 text-sm font-medium"
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">Clear All</span>
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    {showScrollLeft && (
                      <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-slate-800/95 border border-slate-700/50 shadow-xl hover:bg-slate-700/95 transition-all duration-200"
                      >
                        <ChevronLeft className="w-4 h-4 text-cyan-400" />
                      </button>
                    )}

                    {showScrollRight && (
                      <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-slate-800/95 border border-slate-700/50 shadow-xl hover:bg-slate-700/95 transition-all duration-200"
                      >
                        <ChevronRight className="w-4 h-4 text-cyan-400" />
                      </button>
                    )}

                    <div
                      ref={scrollContainerRef}
                      className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-8"
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch',
                      }}
                    >
                      {filteredTopics.map((topic) => {
                        const isSelected = selectedTopics.has(topic);
                        const topicGrad = topicGradients?.get(topic);
                        const gradient = topicGrad
                          ? `from-${topicGrad.from} to-${topicGrad.to}`
                          : 'from-slate-500 to-slate-600';
                        const shortName = topicShortNames[topic] || topic;

                        return (
                          <button
                            key={topic}
                            onClick={() => onToggleTopic(topic)}
                            className={`group relative overflow-hidden rounded-full transition-all duration-300 flex-shrink-0 ${
                              isSelected ? 'scale-105 shadow-lg shadow-cyan-500/25' : 'hover:scale-105 shadow-md'
                            }`}
                          >
                            <div className={`absolute inset-0 bg-gradient-to-r ${gradient} ${
                              isSelected ? 'opacity-100' : 'opacity-60 group-hover:opacity-80'
                            } transition-opacity duration-300`} />

                            <div className="relative px-4 py-2 flex items-center gap-2">
                              <span className="text-sm font-semibold text-white whitespace-nowrap">
                                {shortName}
                              </span>
                              {isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              )}
                            </div>

                            {isSelected && (
                              <div className="absolute inset-0 bg-white/10 animate-pulse" style={{ animationDuration: '2s' }} />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950/70 to-transparent pointer-events-none transition-opacity duration-300 ${showScrollLeft ? 'opacity-100' : 'opacity-0'}`} />
                    <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950/70 to-transparent pointer-events-none transition-opacity duration-300 ${showScrollRight ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* {hasFilters && (
            <div className="border-t border-slate-700/30 bg-slate-900/30">
              <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400 font-medium">Active:</span>
                  {Array.from(selectedDifficulties).map((difficulty) => {
                    const colors = difficultyColors[difficulty];
                    return (
                      <button
                        key={difficulty}
                        onClick={() => onToggleDifficulty(difficulty)}
                        className={`group flex items-center gap-1.5 px-2 py-1 rounded-md ${colors.bg} hover:opacity-80 border ${colors.border} transition-all duration-200`}
                      >
                        <span className={`text-xs font-medium ${colors.text}`}>{difficulty}</span>
                        <X className={`w-3 h-3 ${colors.text} opacity-60 group-hover:opacity-100 transition-opacity`} />
                      </button>
                    );
                  })}
                  {Array.from(selectedTopics).map((topic) => {
                    const shortName = topicShortNames[topic] || topic;
                    return (
                      <button
                        key={topic}
                        onClick={() => onToggleTopic(topic)}
                        className="group flex items-center gap-1.5 px-2 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-200"
                      >
                        <span className="text-xs font-medium text-cyan-400">{shortName}</span>
                        <X className="w-3 h-3 text-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )} */}
        </div>
      </header>

      {showMobileFilters && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-slate-900 border-t border-slate-700/50 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-gradient-to-br from-slate-800/50 to-slate-900/50">
              <h3 className="text-lg font-bold text-white">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search filters..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Difficulty Filters */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  <h4 className="text-sm font-semibold text-slate-300">Difficulty</h4>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {difficultyLevels.map((difficulty) => {
                    const isSelected = selectedDifficulties.has(difficulty);
                    const colors = difficultyColors[difficulty];

                    return (
                      <button
                        key={difficulty}
                        onClick={() => onToggleDifficulty(difficulty)}
                        className={`
                          relative px-3 py-2.5 rounded-lg transition-all duration-200
                          text-sm font-medium
                          ${isSelected
                            ? `${colors.bg} ${colors.border} ${colors.text} border`
                            : 'bg-slate-700/30 text-slate-400 border border-slate-700/50'
                          }
                        `}
                      >
                        {difficulty}
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topic Filters */}
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <h4 className="text-sm font-semibold text-slate-300">Topics</h4>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {filteredTopics.map((topic) => {
                  const isSelected = selectedTopics.has(topic);
                  const topicGrad = topicGradients?.get(topic);
                  const gradient = topicGrad
                    ? `from-${topicGrad.from} to-${topicGrad.to}`
                    : 'from-slate-500 to-slate-600';
                  const shortName = topicShortNames[topic] || topic;

                  return (
                    <button
                      key={topic}
                      onClick={() => onToggleTopic(topic)}
                      className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${
                        isSelected ? 'scale-105 shadow-lg shadow-cyan-500/25' : 'shadow-md'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} ${
                        isSelected ? 'opacity-100' : 'opacity-60'
                      } transition-opacity duration-300`} />

                      <div className="relative px-3 py-3 flex items-center justify-center gap-2">
                        <span className="text-sm font-semibold text-white text-center">
                          {shortName}
                        </span>
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {hasFilters && (
              <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
                <button
                  onClick={() => {
                    onClearAll();
                    setShowMobileFilters(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-all duration-200 font-medium"
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        @keyframes slide-in-from-top-2 {
          from {
            transform: translateY(-8px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slide-in-from-bottom {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-in {
          animation-fill-mode: both;
        }
      `}</style>
    </>
  );
});
