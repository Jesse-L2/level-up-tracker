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
        className="card-physical rounded-2xl shadow-2xl w-full max-w-md m-4 transform transition-all duration-300 scale-95 hover:scale-100 focus:outline-none"
      >
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-card-inner">
          <h3 className="text-xl font-bold text-theme-primary">{title}</h3>
          <button
            onClick={onClose}
            className="text-theme-secondary hover:text-theme-primary transition-colors p-2 rounded-full hover:bg-theme-input"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-4 sm:p-6 text-theme-secondary">{children}</div>
      </div>
    </div>
  );
};
