/**
 * SkeletonLoader Component
 * 
 * A generic skeleton loader component for content placeholders.
 * Displays a pulsing placeholder while content is loading.
 * Supports different shapes (circle, rectangle) and sizes.
 * 
 * @component
 * @example
 * <SkeletonLoader width="w-full" height="h-12" />
 * <SkeletonLoader shape="circle" width="w-12" height="h-12" />
 */

export default function SkeletonLoader({
  width = 'w-full',
  height = 'h-4',
  shape = 'rectangle',
  count = 1,
  className = '',
}) {
  const shapeClasses = {
    rectangle: 'rounded-md',
    circle: 'rounded-full',
  };

  const skeletons = Array.from({ length: count }).map((_, index) => (
    <div
      key={index}
      className={`
        ${width} ${height}
        ${shapeClasses[shape]}
        bg-gray-200 animate-pulse
        ${className}
      `}
      aria-hidden="true"
    />
  ));

  return (
    <div className="space-y-2">
      {skeletons}
    </div>
  );
}
