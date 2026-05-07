/**
 * TextArea Component
 * 
 * A reusable textarea component for multi-line text input with validation display.
 * Supports character count and auto-expanding height.
 * Includes accessibility features for screen readers.
 * 
 * @component
 * @example
 * <TextArea
 *   label="Bio"
 *   name="bio"
 *   value={bio}
 *   onChange={handleChange}
 *   error={bioError}
 *   maxLength={500}
 *   placeholder="Tell us about yourself"
 * />
 */

import { useState, useEffect } from 'react';

export default function TextArea({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  maxLength,
  minRows = 3,
  required = false,
  disabled = false,
  autoComplete,
  className = '',
  showCharCount = true,
  ...props
}) {
  const [rows, setRows] = useState(minRows);
  const inputId = `input-${name}`;
  const errorId = `error-${name}`;
  const charCountId = `charcount-${name}`;
  const hasError = !!error;
  const charCount = value?.length || 0;
  const charCountPercent = maxLength ? (charCount / maxLength) * 100 : 0;

  // Auto-expand textarea based on content
  useEffect(() => {
    const textarea = document.getElementById(inputId);
    if (textarea) {
      textarea.style.height = 'auto';
      const newRows = Math.max(
        minRows,
        Math.ceil(textarea.scrollHeight / 24) // Approximate line height
      );
      setRows(newRows);
    }
  }, [value, inputId, minRows]);

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        maxLength={maxLength}
        rows={rows}
        aria-label={label || placeholder}
        aria-describedby={
          [hasError && errorId, showCharCount && charCountId]
            .filter(Boolean)
            .join(' ')
        }
        aria-invalid={hasError}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-offset-0
          transition-colors duration-200 resize-none
          ${hasError
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
          }
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
        {...props}
      />

      {/* Character Count */}
      {showCharCount && maxLength && (
        <div className="mt-2 flex items-center justify-between">
          <div className="flex-1 mr-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  charCountPercent > 90
                    ? 'bg-red-500'
                    : charCountPercent > 75
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(charCountPercent, 100)}%` }}
              />
            </div>
          </div>
          <p
            id={charCountId}
            className="text-xs text-gray-500 whitespace-nowrap ml-2"
          >
            {charCount} / {maxLength}
          </p>
        </div>
      )}

      {/* Error Message */}
      {hasError && (
        <p
          id={errorId}
          className="mt-1 text-sm text-red-600 flex items-center"
          role="alert"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18.101 12.93a1 1 0 00-1.414-1.414L10 17.586l-6.687-6.687a1 1 0 00-1.414 1.414l8.1 8.1a1 1 0 001.414 0l8.1-8.1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
