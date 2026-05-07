/**
 * ConversationSkeleton Component
 * 
 * A skeleton loader component specifically for conversation list placeholders.
 * Displays multiple conversation-shaped placeholders while conversations are loading.
 * 
 * @component
 * @example
 * <ConversationSkeleton count={5} />
 */

import SkeletonLoader from './SkeletonLoader';

export default function ConversationSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex gap-3 p-3 border-b border-gray-200">
          {/* Avatar */}
          <SkeletonLoader
            shape="circle"
            width="w-12"
            height="h-12"
            className="flex-shrink-0"
          />
          
          {/* Conversation info */}
          <div className="flex-1 space-y-2">
            {/* Name and timestamp */}
            <div className="flex justify-between gap-2">
              <SkeletonLoader width="w-32" height="h-4" />
              <SkeletonLoader width="w-12" height="h-3" />
            </div>
            
            {/* Last message preview */}
            <SkeletonLoader width="w-full" height="h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
