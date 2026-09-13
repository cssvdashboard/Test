import React from 'react';
import { Globe2, Building2, Filter } from 'lucide-react';

interface CountryAndShipperStatsProps {
  topCountries: { country: string; count: number }[];
  topShippers: { shipper: string; count: number }[];
  selectedCountry: string;
  onSelectCountry: (country: string) => void;
  onSearchShipper: (shipper: string) => void;
}

export const CountryAndShipperStats: React.FC<CountryAndShipperStatsProps> = ({
  topCountries,
  topShippers,
  selectedCountry,
  onSelectCountry,
  onSearchShipper,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Top Destination Countries */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Globe2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Top Trace Destinations
              </h3>
              <p className="text-xs text-slate-400">
                Countries with highest trace & inquiry volume
              </p>
            </div>
          </div>

          {selectedCountry && (
            <button
              onClick={() => onSelectCountry('')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-semibold text-cyan-300"
            >
              <Filter className="w-3 h-3" />
              Reset ({selectedCountry})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {topCountries.slice(0, 6).map((c) => {
            const isSelected = selectedCountry.toLowerCase() === c.country.toLowerCase();
            return (
              <div
                key={c.country}
                onClick={() => onSelectCountry(isSelected ? '' : c.country)}
                className={`p-2.5 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-500 ring-1 ring-cyan-500/40'
                    : 'bg-slate-900/40 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-medium text-slate-200 truncate pr-2">
                  {c.country}
                </span>
                <span className="text-xs font-bold text-cyan-400 font-mono">
                  {c.count.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Shippers */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Top Shippers
              </h3>
              <p className="text-xs text-slate-400">
                Accounts with active trace investigations
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {topShippers.slice(0, 6).map((s) => (
            <div
              key={s.shipper}
              onClick={() => onSearchShipper(s.shipper)}
              className="p-2.5 rounded-xl cursor-pointer transition-all bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between group"
            >
              <span className="text-xs font-medium text-slate-200 truncate pr-2 group-hover:text-purple-300">
                {s.shipper}
              </span>
              <span className="text-xs font-bold text-purple-400 font-mono">
                {s.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
