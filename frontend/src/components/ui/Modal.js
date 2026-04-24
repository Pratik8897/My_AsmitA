import React from "react";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-lg">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {title}
          </h2>
          <button onClick={onClose} className="text-gray-500 text-xl">
            ✖
          </button>
        </div>

        {/* Body (SCROLLABLE) */}
        <div className="p-4 overflow-y-auto">
          {children}
        </div>

      </div>
    </div>
  );
};

export default Modal;