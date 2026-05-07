/**
 * Spinner Component
 * 
 * A loading indicator spinner component.
 * Used to indicate that content is loading or an operation is in progress.
 * Supports different sizes and can be centered on the page.
 * 
 * @component
 * @example
 * <Spinner size="lg" centered />
 */

export default function Spinner({
  size = 'md',
  centered = false,
  label = 'Loading...',
  className = '',
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const spinner = (
    <svg
      className={`${sizeClasses[size]} animate-spin text-blue-600 ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  if (centered) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2"
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        {spinner}
        {label && <p className="text-sm text-gray-600">{label}</p>}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {spinner}
    </div>
  );
}
