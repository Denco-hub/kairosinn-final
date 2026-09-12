import { useState } from "react";
import { Image } from "lucide-react";

type ImageWithSkeletonProps = {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  aspectRatio?: string;
};

export function ImageWithSkeleton({
  src,
  alt,
  className = "",
  fallbackSrc,
  aspectRatio,
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Once the primary image errors, swap to the fallback source for a clean retry.
  const currentSrc = hasError && fallbackSrc ? fallbackSrc : src;

  const handleLoad = () => setIsLoaded(true);

  const handleError = () => {
    // Nothing left to retry — show the neutral placeholder instead of looping.
    if (hasError || (fallbackSrc && src === fallbackSrc)) {
      setHasError(true);
      setIsLoaded(true);
      return;
    }
    if (fallbackSrc) {
      setHasError(true);
      setIsLoaded(false);
    } else {
      setHasError(true);
      setIsLoaded(true);
    }
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {!isLoaded && (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#faf6ee]/80 animate-pulse">
          <Image className="h-6 w-6 text-[#af8f52]/50" aria-hidden />
        </div>
      )}
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`absolute inset-0 z-10 h-full w-full object-cover transition-opacity duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}