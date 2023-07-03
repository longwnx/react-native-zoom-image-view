import { useEffect, useState } from 'react';
import { Image, ImageURISource } from 'react-native';

import { createCache } from '@utils/index';
import type { DimensionsScreens, ImageSource } from 'types/Image';

const CACHE_SIZE = 50;
const imageDimensionsCache = createCache(CACHE_SIZE);

const useImageDimensions = (image: ImageSource): DimensionsScreens | null => {
  const [dimensions, setDimensions] = useState<DimensionsScreens | null>(null);

  const getImageDimensions = (
    image: ImageSource
  ): Promise<DimensionsScreens> => {
    return new Promise((resolve) => {
      if (typeof image === 'number') {
        const cacheKey = `${image}`;
        let imageDimensions = imageDimensionsCache.get(cacheKey);

        if (!imageDimensions) {
          const { width, height } = Image.resolveAssetSource(image);
          imageDimensions = { width, height };
          imageDimensionsCache.set(cacheKey, imageDimensions);
        }

        resolve(imageDimensions);

        return;
      }

      if (image.uri) {
        const source = image as ImageURISource;

        const cacheKey = source.uri as string;

        const imageDimensions = imageDimensionsCache.get(cacheKey);

        if (imageDimensions) {
          resolve(imageDimensions);
        } else {
          if (source.uri && source.headers) {
            Image.getSizeWithHeaders(
              source.uri,
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
      isImageUnmounted = true;
    };
  }, [image]);

  return dimensions;
};

export default useImageDimensions;
