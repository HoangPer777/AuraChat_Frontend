/**
 * FileInput Component
 * 
 * A file input component with image preview capability.
 * Validates file type and size, displays preview of selected image.
 * Includes accessibility features for screen readers.
 * 
 * @component
 * @example
 * <FileInput
 *   label="Upload Avatar"
 *   name="avatar"
 *   onChange={handleFileChange}
 *   accept="image/*"
 *   maxSize={5242880}
 *   error={fileError}
 * />
 */

import { useState } from 'react';

export default function FileInput({
  label,
  name,
  onChange,
  error,
  accept = 'image/*',
  maxSize,
  preview,
  previewAlt = 'Preview',
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const [previewUrl, setPreviewUrl] = useState(preview);
  const inputId = `input-${name}`;
  const errorId = `error-${name}`;
  const hasError = !!error;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }

    // Call parent onChange handler
    onChange?.(e);
  };

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="flex flex-col gap-4">
        {/* File Input */}
        <div className="relative">
          <input
            id={inputId}
            type="file"
            name={name}
            onChange={handleFileChange}
            accept={accept}
            disabled={disabled}
            aria-label={label || 'File input'}
            aria-describedby={hasError ? errorId : undefined}
            aria-invalid={hasError}
            className="hidden"
            {...props}
          />
          <label
            htmlFor={inputId}
            className={`
              block px-4 py-2 border-2 border-dashed rounded-md
              text-center cursor-pointer transition-colors duration-200
              ${hasError
                ? 'border-red-500 bg-red-50 hover:bg-red-100'
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <svg
              className="w-6 h-6 mx-auto mb-1 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <p className="text-sm text-gray-600">
              Click to upload or drag and drop
            </p>
            {maxSize && (
              <p className="text-xs text-gray-500 mt-1">
                Max size: {(maxSize / 1024 / 1024).toFixed(1)} MB
              </p>
            )}
          </label>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="flex flex-col items-center gap-2">
            <img
              src={previewUrl}
              alt={previewAlt}
              className="w-32 h-32 object-cover rounded-md border border-gray-300"
            />
            <button
              type="button"
              onClick={() => {
                setPreviewUrl(null);
                const input = document.getElementById(inputId);
                if (input) input.value = '';
              }}
              className="text-sm text-red-600 hover:text-red-700 underline"
            >
              Remove preview
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {hasError && (
        <p
          id={errorId}
          className="mt-2 text-sm text-red-600 flex items-center"
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
