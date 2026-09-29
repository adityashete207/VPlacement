import React, { useState } from 'react';
import { Search, MapPin, Filter } from 'lucide-react';

const inputClass =
  'block w-full pl-10 pr-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-ink text-sm ' +
  'placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-emerald/50 focus:border-transparent transition-shadow';
const selectClass =
  'block w-full py-2.5 px-3.5 rounded-lg border border-white/10 bg-white/5 text-ink text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-emerald/50 focus:border-transparent transition-shadow';
const labelClass = 'block text-sm font-medium text-muted mb-1.5';

const SearchAndFilter = ({ onSearch, onFilter }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [salaryMin, setSalaryMin] = useState(undefined);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleFilterApply = () => {
    onFilter({
      location: location || undefined,
      jobType: jobType || undefined,
      salaryMin,
    });
  };

  const handleReset = () => {
    setLocation('');
    setJobType('');
    setSalaryMin(undefined);
    onFilter({});
  };

  return (
    <div className="glass-panel p-5 sm:p-6 mb-6">
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
        <div className="flex-grow relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-muted" />
          </div>
          <input
            type="text"
            placeholder="Search job titles, companies, or keywords..."
            className={inputClass}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-glow px-6 py-2.5 text-sm justify-center">
          Search
        </button>

        <button
          type="button"
          className="btn-ghost px-4 py-2.5 text-sm justify-center"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </form>

      {showFilters && (
        <div className="mt-5 pt-5 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Location</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <MapPin className="h-4.5 w-4.5 text-muted" />
                </div>
                <input
                  type="text"
                  placeholder="City, state, or remote"
                  className={inputClass}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Job Type</label>
              <select className={selectClass} value={jobType} onChange={(e) => setJobType(e.target.value)}>
                <option className="bg-obsidian" value="">All Types</option>
                <option className="bg-obsidian" value="Full-time">Full-time</option>
                <option className="bg-obsidian" value="Part-time">Part-time</option>
                <option className="bg-obsidian" value="Remote">Remote</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Minimum Salary</label>
              <select
                className={selectClass}
                value={salaryMin || ''}
                onChange={(e) => setSalaryMin(e.target.value ? parseInt(e.target.value) : undefined)}
              >
                <option className="bg-obsidian" value="">Any Salary</option>
                <option className="bg-obsidian" value="50000">$50,000+</option>
                <option className="bg-obsidian" value="75000">$75,000+</option>
                <option className="bg-obsidian" value="100000">$100,000+</option>
                <option className="bg-obsidian" value="125000">$125,000+</option>
                <option className="bg-obsidian" value="150000">$150,000+</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={handleReset}>
              Reset
            </button>
            <button type="button" className="btn-glow px-4 py-2 text-sm" onClick={handleFilterApply}>
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;