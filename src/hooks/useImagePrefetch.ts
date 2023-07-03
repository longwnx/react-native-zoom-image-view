/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect } from 'react';
import { Image } from 'react-native';
import type { ImageSource } from 'types/Image';

const useImagePrefetch = (images: ImageSource[]) => {
  useEffect(() => {
    images.forEach((image) => {
      if (image.uri) {
        return Image.prefetch(image.uri);
      }
    });
  }, [images]);
};

export default useImagePrefetch;
