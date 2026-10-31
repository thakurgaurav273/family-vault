import React, { useState } from 'react';
import { Image as ImageIcon, Film, FileText } from 'lucide-react';

interface MediaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fileType?: 'photo' | 'video' | 'document';
  title?: string;
  containerClassName?: string;
}

export const MediaImage: React.FC<MediaImageProps> = ({
  src,
  alt = 'Family media',
  fileType = 'photo',
  title,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center p-4 bg-neutral-100 dark:bg-neutral-800/80 text-neutral-400 dark:text-neutral-500 select-none ${containerClassName}`}
      >
        {fileType === 'photo' && <ImageIcon className="w-8 h-8 mb-2 stroke-[1.5]" />}
        {fileType === 'video' && <Film className="w-8 h-8 mb-2 stroke-[1.5]" />}
        {fileType === 'document' && <FileText className="w-8 h-8 mb-2 stroke-[1.5]" />}
        {title && (
          <span className="text-xs text-center line-clamp-1 max-w-[90%] text-neutral-500 dark:text-neutral-400 font-medium">
            {title}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-100 dark:bg-neutral-900 ${containerClassName}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
    </div>
  );
};
