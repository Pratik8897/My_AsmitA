import React, { useState, useMemo } from "react";

const DataTable = ({ columns = [], data = [] }) => {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const pageSize = 5;

  /* ---------------- SAFE VALUE ACCESS ---------------- */
  const getValue = (obj, path) =>
    path?.split(".").reduce((o, key) => o?.[key], obj);

  /* ---------------- SEARCH ---------------- */
  const filteredData = useMemo(() => {
    return data.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? "").toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [data, search]);

  /* ---------------- SORT ---------------- */
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = getValue(a, sortKey);
      const bVal = getValue(b, sortKey);

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDir]);

  /* ---------------- PAGINATION ---------------- */
  const totalPages = Math.ceil(sortedData.length / pageSize);

  const paginatedData = sortedData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleSort = (key) => {
    if (!key) return;

    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">

      {/* 🔍 SEARCH */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between">
        <input
          type="text"
          placeholder="Search records..."
          className="w-full md:w-72 px-3 py-2 rounded-lg border 
          border-gray-300 dark:border-gray-600
          bg-gray-50 dark:bg-gray-900
          text-gray-700 dark:text-gray-200
          focus:ring-2 focus:ring-blue-500 outline-none"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* ================= DESKTOP ================= */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">

          {/* HEADER */}
          <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  onClick={() => col.accessor && handleSort(col.accessor)}
                  className={`px-4 py-3 text-left font-medium 
                  text-gray-600 dark:text-gray-300
                  ${col.accessor ? "cursor-pointer" : "cursor-default"}`}
                >
                  {col.header}

                  {sortKey === col.accessor && (
                    <span className="ml-1 text-xs">
                      {sortDir === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-6 text-gray-400"
                >
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-gray-200 dark:border-gray-700 
                  hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  {columns.map((col, j) => (
                    <td
                      key={j}
                      className="px-4 py-3 text-gray-700 dark:text-gray-200"
                    >
                      {col.render
                        ? col.render(row, (page - 1) * pageSize + i)
                        : getValue(row, col.accessor)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

      {/* ================= MOBILE ================= */}
      <div className="md:hidden space-y-3 p-4">
        {paginatedData.length === 0 ? (
          <p className="text-center text-gray-400">No data found</p>
        ) : (
          paginatedData.map((row, i) => (
            <div
              key={i}
              className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border dark:border-gray-700"
            >
              {columns.map((col, j) => {
                const isAction = col.header === "Action";

                return (
                  <div
                    key={j}
                    className={`flex justify-between py-1 ${
                      isAction ? "border-t mt-2 pt-2" : ""
                    }`}
                  >
                    {!isAction && (
                      <span className="text-xs text-gray-500">
                        {col.header}
                      </span>
                    )}

                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      {col.render
                        ? col.render(row, (page - 1) * pageSize + i)
                        : getValue(row, col.accessor)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* ================= PAGINATION ================= */}
      <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700 text-sm">

        <span className="text-gray-500 dark:text-gray-400">
          Page {page} of {totalPages || 1}
        </span>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 
            disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Prev
          </button>

          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 
            disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      </div>

    </div>
  );
};

export default DataTable;