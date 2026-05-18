import React, { useState } from "react";
import clsx from "clsx";

export function ImageCarousel({ images, name }: { images: string[]; name: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-gray-400">
        <svg
          className="h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="group relative h-full w-full overflow-hidden bg-transparent">
      <img
        src={images[currentIndex]}
        alt={`${name} - ${currentIndex + 1}`}
        className="h-full w-full object-cover transition-opacity duration-500 rounded"
      />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-100 transition-opacity hover:bg-black/60 sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Previous image">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-100 transition-opacity hover:bg-black/60 sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Next image">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(i);
                }}
                className={clsx(
                  "rounded-full transition-all duration-200",
                  i === currentIndex
                    ? "bg-white w-4 h-2.5"
                    : "bg-white/70 w-2.5 h-2.5",
                )}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
