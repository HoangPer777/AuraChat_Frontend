/**
 * SecondaryButton Component
 * 
 * A secondary action button for less important actions.
 * Used for cancel, back, or alternative actions.
 * Includes accessibility features and responsive design.
 * 
 * @component
 * @example
 * <SecondaryButton onClick={handleCancel}>
 *   Cancel
 * </SecondaryButton>
 */

export default function SecondaryButton({
  children,
  onClick,
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  fullWidth = false,
  size = 'md',
  ...props
}) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const isDisabledState = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabledState}
      aria-busy={loading}
      aria-disabled={isDisabledState}
      className={`
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        font-medium rounded-md shadow-sm
        bg-gray-200 text-gray-900
        hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
        transition-all duration-200
        flex items-center justify-center gap-2
        ${isDisabledState
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer'
        }
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg
          className="w-4 h-4 animate-spin"
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
      )}
      <span>{children}</span>
    </button>
  );
}
