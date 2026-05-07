/**
 * ErrorMessage Component
 * 
 * An inline error message component for displaying validation and API errors.
 * Typically displayed below form fields or in alert boxes.
 * Includes accessibility features for screen readers.
 * 
 * @component
 * @example
 * <ErrorMessage
 *   message="Email is required"
 *   onDismiss={handleDismiss}
 * />
 */

export default function ErrorMessage({
  message,
  onDismiss,
  dismissible = true,
  className = '',
}) {
  if (!message) return null;

  return (
    <div
      className={`
        bg-red-50 border border-red-200 text-red-800
        rounded-md p-4 flex items-start gap-3
        ${className}
      `}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <svg
        className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={`
            flex-shrink-0 ml-2 inline-flex text-red-400 hover:text-red-500
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded
          `}
          aria-label="Dismiss error message"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
