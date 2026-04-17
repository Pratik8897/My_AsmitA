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
    <div className="flex flex-col gap-3">

      {/* Filters */}
      <div className="flex flex-wrap gap-4">

        {filtersConfig.map((filter, i) => (
          <div key={i} className="min-w-[200px]">

            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
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
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
      <div className="flex gap-2">
        <button
          onClick={onApply}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Apply Filters
        </button>

        <button
          onClick={onClear}
          className="px-4 py-2 border rounded"
        >
          Clear
        </button>
      </div>

    </div>
  );
};

export default FilterBar;
