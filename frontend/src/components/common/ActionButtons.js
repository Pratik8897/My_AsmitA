import { Pencil, Trash2, Eye } from "lucide-react";

const ActionButtons = ({
  row,
  onEdit,
  onDelete,
  onView,

  showEdit = true,
  showDelete = true,
  showView = true,

  deleteLabel = "Delete",
  disabled = false,
}) => {
  const baseBtn =
    "p-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center gap-2">

      {/* Edit */}
      {showEdit && (
        <button
          onClick={() => onEdit?.(row)}
          disabled={disabled}
          title="Edit"
          className={`${baseBtn} hover:bg-yellow-100 dark:hover:bg-yellow-900/30`}
        >
          <Pencil className="w-4 h-4 text-yellow-500" />
        </button>
      )}

      {/* Delete / Deactivate */}
      {showDelete && (
        <button
          onClick={() => onDelete?.(row)}
          disabled={disabled}
          title={deleteLabel}
          className={`${baseBtn} hover:bg-red-100 dark:hover:bg-red-900/30`}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      )}

      {/* View */}
      {showView && (
        <button
          onClick={() => onView?.(row)}
          disabled={disabled}
          title="View"
          className={`${baseBtn} hover:bg-blue-100 dark:hover:bg-blue-900/30`}
        >
          <Eye className="w-4 h-4 text-blue-500" />
        </button>
      )}

    </div>
  );
};

export default ActionButtons;