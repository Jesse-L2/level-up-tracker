import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
      const handleEscape = (event) => {
        if (event.key === "Escape") {
          onClose();
        }
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        tabIndex="-1"
        className="card-physical bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md m-4 transform transition-all duration-300 scale-95 hover:scale-100 focus:outline-none"
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700"
            aria-label="Close modal"
          >
            <X size={24} className="text-white" />
          </button>
        </div>
        <div className="p-6 text-gray-300">{children}</div>
      </div>
    </div>
  );
};
