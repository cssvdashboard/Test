import React from 'react';
import { AlertCircle, Tag, Filter, Check } from 'lucide-react';
import { CategoryStat } from '../types/trace';

interface DelayCategoryChartProps {
  categories: CategoryStat[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const DelayCategoryChart: React.FC<DelayCategoryChartProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  // Top 8 categories
  const topCategories = categories.slice(0, 8);
  const maxCount = topCategories.length > 0 ? topCategories[0].count : 1;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Top Delay Categories & Root Causes
            </h3>
            <p className="text-xs text-slate-400">
              Primary operational reasons logged across cases
            </p>
          </div>
        </div>

        {selectedCategory && (
          <button
            onClick={() => onSelectCategory('')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 transition-colors"
          >
            <Filter className="w-3 h-3" />
            Reset ({selectedCategory})
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {topCategories.map((c) => {
          const isSelected = selectedCategory.toLowerCase() === c.category.toLowerCase();
          const percentage = Math.round((c.count / maxCount) * 100);

          return (
            <div
              key={c.category}
              onClick={() => onSelectCategory(isSelected ? '' : c.category)}
              className={`p-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                isSelected
                  ? 'bg-rose-950/50 border-rose-500 ring-1 ring-rose-500/40'
                  : 'bg-slate-900/40 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-xs flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-slate-500" />
                  {c.category}
                </span>
                <span className="font-bold text-rose-400 font-mono">
                  {c.count.toLocaleString()}
                </span>
              </div>

              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
