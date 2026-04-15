import React from "react";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 shadow-lg">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {title}
          </h2>
          <button onClick={onClose} className="text-gray-500">✖</button>
        </div>

        {/* Body */}
        {children}

      </div>
    </div>
  );
};

export default Modal;