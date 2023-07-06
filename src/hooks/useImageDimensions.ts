import { useEffect, useState } from 'react';
import { Image, ImageURISource } from 'react-native';

import { createCache } from '../utils';
import type { DimensionsType, ImageSource } from '@types';

const CACHE_SIZE = 50;
const imageDimensionsCache = createCache(CACHE_SIZE);

const useImageDimensions = (image: ImageSource): DimensionsType | null => {
  const [dimensions, setDimensions] = useState<DimensionsType | null>(null);

  const getImageDimensions = (image: ImageSource): Promise<DimensionsType> => {
    return new Promise((resolve) => {
      if (image.uri) {
        const source = image as ImageURISource;

        const cacheKey = source.uri as string;

        const imageDimensions = imageDimensionsCache.get(cacheKey);

        if (imageDimensions) {
          resolve(imageDimensions);
        } else {
          Image.getSizeWithHeaders(
            cacheKey,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            source.headers,
            (width: number, height: number) => {
              imageDimensionsCache.set(cacheKey, { width, height });
              resolve({ width, height });
            },
            () => {
              resolve({ width: 0, height: 0 });
            }
          );
        }
      } else {
        resolve({ width: 0, height: 0 });
      }
    });
  };

  let isImageUnmounted = false;

  useEffect(() => {
    getImageDimensions(image).then((dimensions) => {
      if (!isImageUnmounted) {
        setDimensions(dimensions);
      }
    });

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      isImageUnmounted = true;
    };
  }, [image]);

  return dimensions;
};

export default useImageDimensions;
