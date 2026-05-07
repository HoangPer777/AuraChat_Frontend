/**
 * ConfirmModal Component
 * 
 * A confirmation dialog component for user confirmations.
 * Displays a message with confirm and cancel buttons.
 * Includes accessibility features and keyboard navigation.
 * 
 * @component
 * @example
 * <ConfirmModal
 *   isOpen={isOpen}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item?"
 *   onConfirm={handleDelete}
 *   onCancel={handleCancel}
 *   confirmText="Delete"
 *   confirmVariant="danger"
 * />
 */

import Modal from './Modal';
import PrimaryButton from '../buttons/PrimaryButton';
import SecondaryButton from '../buttons/SecondaryButton';

export default function ConfirmModal({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  loading = false,
  ...props
}) {
  const handleConfirm = () => {
    onConfirm?.();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose?.();
  };

  const confirmButtonClass = confirmVariant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size="sm"
      {...props}
    >
      <div className="space-y-6">
        {/* Message */}
        <p className="text-gray-600">{message}</p>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <SecondaryButton
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </SecondaryButton>
          <button
            onClick={handleConfirm}
            disabled={loading}
            aria-busy={loading}
            className={`
              px-4 py-2 font-medium rounded-md shadow-sm
              text-white transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2
              flex items-center justify-center gap-2
              ${confirmButtonClass}
              ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
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
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
