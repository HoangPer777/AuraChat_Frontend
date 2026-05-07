/**
 * TextInput Component
 * 
 * A reusable text input component with validation display and error messages.
 * Supports accessibility features including ARIA labels and error descriptions.
 * 
 * @component
 * @example
 * <TextInput
 *   label="Email"
 *   name="email"
 *   value={email}
 *   onChange={handleChange}
 *   error={emailError}
 *   placeholder="Enter your email"
 *   required
 * />
 */

export default function TextInput({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
  autoComplete,
  className = '',
  ...props
}) {
  const inputId = `input-${name}`;
  const errorId = `error-${name}`;
  const hasError = !!error;

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
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-label={label || placeholder}
        aria-describedby={hasError ? errorId : undefined}
        aria-invalid={hasError}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-offset-0
          transition-colors duration-200
          ${hasError
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
          }
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
        {...props}
      />
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
