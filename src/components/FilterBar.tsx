import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface FilterBarProps {
  topics: string[];
  selectedTopics: Set<string>;
  onToggleTopic: (topic: string) => void;
  onClearAll: () => void;
  savingPreferences?: boolean;
}

const topicColors: Record<string, string> = {
  'React': 'from-cyan-500 to-blue-500 group-hover:from-cyan-400 group-hover:to-blue-400',
  'Rust': 'from-orange-500 to-red-500 group-hover:from-orange-400 group-hover:to-red-400',
  '.NET 8+': 'from-fuchsia-500 to-pink-500 group-hover:from-fuchsia-400 group-hover:to-pink-400',
  'Blazor': 'from-violet-500 to-fuchsia-500 group-hover:from-violet-400 group-hover:to-fuchsia-400',
  'Entity Framework Core': 'from-blue-500 to-cyan-500 group-hover:from-blue-400 group-hover:to-cyan-400',
  'JavaScript': 'from-yellow-500 to-orange-500 group-hover:from-yellow-400 group-hover:to-orange-400',
  'TypeScript': 'from-blue-600 to-sky-500 group-hover:from-blue-500 group-hover:to-sky-400',
  'Python': 'from-blue-500 to-green-500 group-hover:from-blue-400 group-hover:to-green-400',
  'Java': 'from-red-500 to-orange-500 group-hover:from-red-400 group-hover:to-orange-400',
  'C#': 'from-emerald-500 to-teal-500 group-hover:from-emerald-400 group-hover:to-teal-400',
  'Go': 'from-cyan-500 to-teal-500 group-hover:from-cyan-400 group-hover:to-teal-400',
  'Node.js': 'from-green-600 to-emerald-500 group-hover:from-green-500 group-hover:to-emerald-400',
  'Vue': 'from-emerald-500 to-green-500 group-hover:from-emerald-400 group-hover:to-green-400',
  'Angular': 'from-red-500 to-pink-500 group-hover:from-red-400 group-hover:to-pink-400',
  'Svelte': 'from-orange-500 to-amber-500 group-hover:from-orange-400 group-hover:to-amber-400',
  'Docker': 'from-blue-600 to-blue-500 group-hover:from-blue-500 group-hover:to-blue-400',
  'Kubernetes': 'from-blue-500 to-cyan-500 group-hover:from-blue-400 group-hover:to-cyan-400',
  'AWS': 'from-orange-600 to-yellow-500 group-hover:from-orange-500 group-hover:to-yellow-400',
  'Azure': 'from-blue-500 to-sky-500 group-hover:from-blue-400 group-hover:to-sky-400',
  'GraphQL': 'from-pink-500 to-rose-500 group-hover:from-pink-400 group-hover:to-rose-400',
  'MongoDB': 'from-green-600 to-emerald-500 group-hover:from-green-500 group-hover:to-emerald-400',
  'PostgreSQL': 'from-blue-600 to-indigo-500 group-hover:from-blue-500 group-hover:to-indigo-400',
  'Redis': 'from-red-600 to-rose-500 group-hover:from-red-500 group-hover:to-rose-400',
  'Next.js': 'from-slate-700 to-slate-600 group-hover:from-slate-600 group-hover:to-slate-500',
  'Tailwind CSS': 'from-cyan-500 to-blue-600 group-hover:from-cyan-400 group-hover:to-blue-500',
  'SQL': 'from-blue-500 to-indigo-600 group-hover:from-blue-400 group-hover:to-indigo-500',
  'API': 'from-teal-500 to-emerald-500 group-hover:from-teal-400 group-hover:to-emerald-400',
  'Testing': 'from-green-500 to-lime-500 group-hover:from-green-400 group-hover:to-lime-400',
  'DevOps': 'from-orange-500 to-red-500 group-hover:from-orange-400 group-hover:to-red-400',
  'Security': 'from-red-600 to-orange-500 group-hover:from-red-500 group-hover:to-orange-400',
  'Performance': 'from-yellow-500 to-amber-500 group-hover:from-yellow-400 group-hover:to-amber-400',
};

const colorPalette = [
  'from-emerald-500 to-teal-500 group-hover:from-emerald-400 group-hover:to-teal-400',
  'from-blue-500 to-cyan-500 group-hover:from-blue-400 group-hover:to-cyan-400',
  'from-fuchsia-500 to-pink-500 group-hover:from-fuchsia-400 group-hover:to-pink-400',
  'from-orange-500 to-amber-500 group-hover:from-orange-400 group-hover:to-amber-400',
  'from-rose-500 to-pink-500 group-hover:from-rose-400 group-hover:to-pink-400',
  'from-violet-500 to-fuchsia-500 group-hover:from-violet-400 group-hover:to-fuchsia-400',
  'from-lime-500 to-green-500 group-hover:from-lime-400 group-hover:to-green-400',
  'from-sky-500 to-blue-500 group-hover:from-sky-400 group-hover:to-blue-400',
  'from-red-500 to-rose-500 group-hover:from-red-400 group-hover:to-rose-400',
  'from-amber-500 to-orange-500 group-hover:from-amber-400 group-hover:to-orange-400',
];

function getTopicColor(topic: string): string {
  if (topicColors[topic]) {
    return topicColors[topic];
  }
  const hash = topic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colorPalette[hash % colorPalette.length];
}

const topicShortNames: Record<string, string> = {
  'Entity Framework Core': 'EF Core',
  '.NET 8+': '.NET 8+',
};

export function FilterBar({ topics, selectedTopics, onToggleTopic, onClearAll, savingPreferences = false }: FilterBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hasFilters = selectedTopics.size > 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/30 shadow-2xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center gap-2 md:gap-3">
          <div className={`
            flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-md
            transition-opacity duration-200
            ${savingPreferences ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}>
            <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-cyan-400 hidden sm:inline">Saving...</span>
          </div>
          {/* Mobile: Filter count badge as toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="md:hidden flex-shrink-0 relative group"
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
                <span className="text-xs font-bold text-white">{selectedTopics.size}</span>
              </div>
            )}
          </button>

          {/* Desktop: Full filter bar toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex flex-shrink-0 items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-all duration-200 border border-slate-700/50"
          >
            <Filter className={`w-5 h-5 transition-colors ${hasFilters ? 'text-cyan-400' : 'text-slate-400'}`} />
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            )}
            {hasFilters && (
              <span className="text-sm font-medium text-cyan-400 transition-opacity duration-200">
                ({selectedTopics.size})
              </span>
            )}
          </button>

          {/*{hasFilters && !isCollapsed && (
            <button
              onClick={onClearAll}
              className="flex-shrink-0 flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200 border border-slate-600/50"
            >
              <X className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline text-xs md:text-sm font-medium">Clear</span>
            </button>
          )}*/}

          <div className={`
            flex flex-wrap items-center gap-1.5 md:gap-2 flex-1 min-w-0
            transition-all duration-300 overflow-hidden
            ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}
          `}>
            {topics.map((topic) => {
              const isSelected = selectedTopics.has(topic);
              const gradient = getTopicColor(topic);
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
