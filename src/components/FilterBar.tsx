import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterBarProps {
  topics: string[];
  selectedTopics: Set<string>;
  onToggleTopic: (topic: string) => void;
  onClearAll: () => void;
}

const topicColors: Record<string, string> = {
  'React': 'from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400',
  'Rust': 'from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400',
  '.NET 8+': 'from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400',
  'Blazor': 'from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400',
  'Entity Framework Core': 'from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400',
};

const topicShortNames: Record<string, string> = {
  'Entity Framework Core': 'EF Core',
  '.NET 8+': '.NET 8+',
};

export function FilterBar({ topics, selectedTopics, onToggleTopic, onClearAll }: FilterBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hasFilters = selectedTopics.size > 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/30 shadow-2xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex-shrink-0 flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-all duration-200 border border-slate-700/50"
          >
            <Filter className={`w-4 h-4 md:w-5 md:h-5 transition-colors ${hasFilters ? 'text-cyan-400' : 'text-slate-400'}`} />
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            )}
            {hasFilters && (
              <span className="text-xs md:text-sm font-medium text-cyan-400">
                ({selectedTopics.size})
              </span>
            )}
          </button>

          <div className={`
            flex flex-wrap items-center gap-1.5 md:gap-2 flex-1 min-w-0
            transition-all duration-300 overflow-hidden
            ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}
          `}>
            {topics.map((topic) => {
              const isSelected = selectedTopics.has(topic);
              const gradient = topicColors[topic] || 'from-slate-500 to-slate-600 hover:from-slate-400 hover:to-slate-500';
              const shortName = topicShortNames[topic] || topic;

              return (
                <button
                  key={topic}
                  onClick={() => onToggleTopic(topic)}
                  className={`
                    group relative overflow-hidden rounded-full transition-all duration-300 ease-out
                    ${isSelected
                      ? 'scale-105 shadow-lg'
                      : 'scale-100 hover:scale-105 shadow-md hover:shadow-lg'
                    }
                  `}
                >
                  <div className={`
                    absolute inset-0 bg-gradient-to-r ${gradient}
                    ${isSelected ? 'opacity-100' : 'opacity-60'}
                    transition-opacity duration-300
                  `} />

                  <div className={`
                    relative px-2.5 sm:px-3 md:px-4 py-1 md:py-1.5
                    flex items-center gap-1 md:gap-1.5
                    ${isSelected ? 'text-white' : 'text-white/90'}
                  `}>
                    <span className="text-xs md:text-sm font-semibold whitespace-nowrap">
                      {shortName}
                    </span>
                    {isSelected && (
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white animate-pulse" />
                    )}
                  </div>

                  {isSelected && (
                    <div className="absolute inset-0 bg-white/20 animate-pulse" style={{ animationDuration: '2s' }} />
                  )}
                </button>
              );
            })}
          </div>

          {hasFilters && !isCollapsed && (
            <button
              onClick={onClearAll}
              className="flex-shrink-0 flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200 border border-slate-600/50"
            >
              <X className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline text-xs md:text-sm font-medium">Clear</span>
            </button>
          )}
        </div>

        {/*{hasFilters && !isCollapsed && (
          <div className="mt-2 text-xs md:text-sm text-slate-400">
            Showing {selectedTopics.size} {selectedTopics.size === 1 ? 'filter' : 'filters'}
          </div>
        )}*/}
      </div>
    </div>
  );
}
