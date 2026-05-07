import { useState } from "react";
import { importUnitsFile } from "../services/importService";
import { toast } from "react-toastify";

export default function BulkImport({ societyId, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    if (!societyId) {
      alert("Please select a society before importing");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await importUnitsFile(
        file,
        { societyId },
        (event) => {
        if (event.total) {
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
        }
        }
      );

      setResult(data);

      const parts = [];
      if (data?.insertedCount) parts.push(`Inserted: ${data.insertedCount}`);
      if (data?.updatedCount) parts.push(`Updated: ${data.updatedCount}`);
      if (data?.reactivatedCount) parts.push(`Reactivated: ${data.reactivatedCount}`);
      if (data?.mergedGroupCount) parts.push(`Merged groups: ${data.mergedGroupCount}`);
      if (parts.length) toast.info(parts.join(" | "));

      if (data?.failedCount) {
        toast.warn(`Conflicts / Skipped rows: ${data.failedCount}`);
      }

      onSuccess?.(data);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="p-4 border rounded bg-white max-w-xl">
      <h2 className="text-lg font-semibold mb-3">Bulk Import Units</h2>
      <p className="text-xs text-gray-600 mb-3">
        Uploads into the selected Society. Required columns: tower_name,
        floor_number, flat_number (optional: unit_type, merged_from)
      </p>

      {/* File Input */}
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-3"
      />

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {/* Progress */}
      {loading && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded h-3">
            <div
              className="bg-blue-500 h-3 rounded"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs mt-1">{progress}%</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-4 text-sm">
          <p className="text-green-600">
            Success: {result.successCount}
          </p>
          <p className="text-red-600">
            Failed: {result.failedCount}
          </p>

          {/* Error Table */}
          {result.errors?.length > 0 && (
            <div className="mt-3 max-h-40 overflow-auto border rounded">
              <table className="w-full text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-1 text-left">Row</th>
                    <th className="p-1 text-left">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((e, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-1">{e.row}</td>
                      <td className="p-1 text-red-500">{e.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sample Download */}
      <div className="mt-4 text-sm flex gap-4">
        <a
          href="/sample-units.xlsx"
          download
          className="text-blue-600 underline"
        >
          Sample Excel
        </a>
        <a
          href="/sample-units.csv"
          download
          className="text-blue-600 underline"
        >
          Sample CSV
        </a>
      </div>
    </div>
  );
}
