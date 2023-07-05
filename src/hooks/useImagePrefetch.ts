import { useEffect } from 'react';
import { Image } from 'react-native';
import type { ImageSource } from '@types';

const useImagePrefetch = (images: ImageSource[]) => {
  useEffect(() => {
    images.forEach((image) => {
      if (image.uri) {
        return Image.prefetch(image.uri);
      }
      return null;
    });
  }, [images]);
};

export default useImagePrefetch;
