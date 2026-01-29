import React from "react";

export const FormField = ({
  label,
  id,
  children,
  type = "text",
  className = "",
  ...props
}) => {
  // Check if custom width or padding class is provided
  const hasCustomWidth = className.includes('w-');
  const hasCustomPadding = className.includes('p-') || className.includes('px-') || className.includes('py-');
  const baseClasses = `bg-theme-input rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500`;
  const widthClass = hasCustomWidth ? '' : 'w-full';
  const paddingClass = hasCustomPadding ? '' : 'p-2';

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-theme-secondary mb-2">
          {label}
        </label>
      )}
      {type === "select" ? (
        <select
          id={id}
          className={`${widthClass} ${paddingClass} ${baseClasses} ${className}`}
          {...props}
        >
          {children}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          className={`${widthClass} ${paddingClass} ${baseClasses} ${className}`}
          {...props}
        />
      )}
    </div>
  );
};
