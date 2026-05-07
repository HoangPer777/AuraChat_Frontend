/**
 * IconButton Component
 * 
 * A button that displays only an icon without text.
 * Used for compact UI elements like close, menu, settings, etc.
 * Includes accessibility features with aria-label for screen readers.
 * 
 * @component
 * @example
 * <IconButton
 *   icon={<CloseIcon />}
 *   onClick={handleClose}
 *   ariaLabel="Close dialog"
 * />
 */

export default function IconButton({
  icon,
  onClick,
  ariaLabel,
  loading = false,
  disabled = false,
  type = 'button',
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const variantClasses = {
    default: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
    primary: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
    danger: 'text-red-600 hover:text-red-700 hover:bg-red-50',
    ghost: 'text-gray-600 hover:text-gray-900',
  };

  const isDisabledState = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabledState}
      aria-label={ariaLabel}
      aria-busy={loading}
      aria-disabled={isDisabledState}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-md transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        flex items-center justify-center
        ${isDisabledState
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer'
        }
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg
          className="w-5 h-5 animate-spin"
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
      ) : (
        icon
      )}
    </button>
  );
}
