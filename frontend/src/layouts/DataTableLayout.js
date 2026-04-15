import React from "react";

const DataTableLayout = ({
  title,
  stats,
  filters,
  actions,
  children,
}) => {
  return (
    <div className="p-2">

      {/* Header */}
      <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
        {title}
      </h2>

      {/* Stats */}
      {stats && (
        <div className="flex flex-wrap gap-4 mb-6">
          {stats}
        </div>
      )}

      {/* Filters + Actions */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-5">
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {filters}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {actions}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        {children}
      </div>

    </div>
  );
};

export default DataTableLayout;