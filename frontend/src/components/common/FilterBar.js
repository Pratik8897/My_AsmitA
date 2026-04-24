import React from "react";
import Select from "react-select";

const selectStyles = {
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

const FilterBar = ({
  filtersConfig = [],
  filters = {},
  setFilters,
  onApply,
  onClear,
}) => {
  const handleChange = (key, selectedOptions) => {
    setFilters((prev) => ({
      ...prev,
      [key]: selectedOptions
        ? selectedOptions.map((opt) => opt.value)
        : [],
    }));
  };

  const handleTextChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">

      {/* Filters */}
      <div className="flex flex-wrap gap-4">

        {filtersConfig.map((filter, i) => (
          <div key={i} className="min-w-[200px]">

            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {filter.label}
            </label>

            {filter.type === "text" ? (
              <input
                type="text"
                value={filters[filter.key] ?? ""}
                onChange={(e) =>
                  handleTextChange(filter.key, e.target.value)
                }
                placeholder={filter.placeholder || `Enter ${filter.label}`}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            ) : (
              <Select
                isMulti
                options={(filter.options ?? []).map((opt) => ({
                  label: opt,
                  value: opt,
                }))}
                value={(filter.options ?? [])
                  .filter((opt) => (filters[filter.key] ?? []).includes(opt))
                  .map((opt) => ({ label: opt, value: opt }))}
                onChange={(selected) =>
                  handleChange(filter.key, selected)
                }
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
                styles={selectStyles}
                className="text-sm"
                classNamePrefix="react-select"
              />
            )}
          </div>
        ))}

      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApply}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Apply Filters
        </button>

        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Clear
        </button>
      </div>

    </div>
  );
};

export default FilterBar;
