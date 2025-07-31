import React from "react";

export const FormField = ({
  label,
  id,
  children,
  type = "text",
  className = "",
  ...props
}) => (
  <div>
    <label htmlFor={id} className="block text-gray-400 mb-2">
      {label}
    </label>
    {type === "select" ? (
      <select
        id={id}
        className={`w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        {...props}
      >
        {children}
      </select>
    ) : (
      <input
        id={id}
        type={type}
        className={`w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        {...props}
      />
    )}
  </div>
);
