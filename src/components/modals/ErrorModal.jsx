/**
 * ErrorModal Component
 * 
 * A modal component for displaying critical error messages.
 * Provides a clear error message with an acknowledge button.
 * Includes accessibility features for screen readers.
 * 
 * @component
 * @example
 * <ErrorModal
 *   isOpen={isOpen}
 *   title="Error"
 *   message="An unexpected error occurred. Please try again."
 *   onClose={handleClose}
 * />
 */

import Modal from './Modal';
import PrimaryButton from '../buttons/PrimaryButton';

export default function ErrorModal({
  isOpen,
  onClose,
  title = 'Error',
  message,
  details,
  actionText = 'OK',
  onAction,
  ...props
}) {
  const handleAction = () => {
    onAction?.();
    onClose?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      {...props}
    >
      <div className="space-y-6">
        {/* Error Icon and Message */}
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-red-600"
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
          </div>
          <div className="flex-1">
            <p className="text-gray-700">{message}</p>
            {details && (
              <details className="mt-3">
                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-700">
                  Error details
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40 text-gray-600">
                  {details}
                </pre>
              </details>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <PrimaryButton
            onClick={handleAction}
            size="md"
          >
            {actionText}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
