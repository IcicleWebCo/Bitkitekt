const tailwindColors: Record<string, string> = {
  'cyan-400': '#22d3ee',
  'cyan-500': '#06b6d4',
  'blue-400': '#60a5fa',
  'blue-500': '#3b82f6',
  'orange-400': '#fb923c',
  'orange-500': '#f97316',
  'red-400': '#f87171',
  'red-500': '#ef4444',
  'teal-400': '#2dd4bf',
  'teal-500': '#14b8a6',
  'emerald-400': '#34d399',
  'emerald-500': '#10b981',
  'green-400': '#4ade80',
  'green-500': '#22c55e',
  'amber-400': '#fbbf24',
  'amber-500': '#f59e0b',
  'sky-400': '#38bdf8',
  'sky-500': '#0ea5e9',
  'rose-400': '#fb7185',
  'rose-500': '#f43f5e',
  'pink-400': '#f472b6',
  'pink-500': '#ec4899',
  'yellow-400': '#facc15',
  'yellow-500': '#eab308',
  'lime-400': '#a3e635',
  'lime-500': '#84cc16',
  'fuchsia-400': '#e879f9',
  'fuchsia-500': '#d946ef',
  'slate-500': '#64748b',
  'slate-600': '#475569',
};

export function getTailwindColor(colorName: string): string {
  return tailwindColors[colorName] || '#64748b';
}

export function createGradient(from: string, to: string): string {
  const fromColor = getTailwindColor(from);
  const toColor = getTailwindColor(to);
  return `linear-gradient(to right, ${fromColor}, ${toColor})`;
}
