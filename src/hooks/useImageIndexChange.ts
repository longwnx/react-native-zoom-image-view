import { useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import type { Dimensions } from '@types';

const useImageIndexChange = (imageIndex: number, screen: Dimensions) => {
  const [currentImageIndex, setImageIndex] = useState(imageIndex);
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {
      nativeEvent: {
        contentOffset: { x: scrollX },
      },
    } = event;

    if (screen.width) {
      const nextIndex = Math.round(scrollX / screen.width);
      setImageIndex(nextIndex < 0 ? 0 : nextIndex);
    }
  };

  return [currentImageIndex, onScroll] as const;
};

export default useImageIndexChange;
