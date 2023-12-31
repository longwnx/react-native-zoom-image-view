import React, { FC, useCallback, useRef } from 'react';

import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
} from 'react-native';
import usePanResponder from '../../hooks/usePanResponder';

import { getImageTransform } from '../../utils';
import type { ImageSource } from '@types';
import FastImage, {
  FastImageProps,
  Priority,
  ResizeMode,
} from 'react-native-fast-image';
import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const SWIPE_CLOSE_OFFSET = 75;
const SWIPE_CLOSE_VELOCITY = 1.75;
const SCREEN = Dimensions.get('window');
const SCREEN_WIDTH = SCREEN.width;
const SCREEN_HEIGHT = SCREEN.height;

interface Props {
  imageSrc: ImageSource;
  onRequestClose: () => void;
  onZoom: (isZoomed: boolean) => void;
  onLongPress: (image: ImageSource) => void;
  delayLongPress: number;
  swipeToCloseEnabled?: boolean;
  doubleTapToZoomEnabled?: boolean;
  loadingIndicatorColor: string;
  top: number;
  cachePriority: Priority;
  resizeMode: ResizeMode;
}

const ImageItem: FC<Props> = ({
  imageSrc,
  onZoom,
  onRequestClose,
  onLongPress,
  delayLongPress,
  swipeToCloseEnabled = true,
  doubleTapToZoomEnabled = true,
  cachePriority,
  resizeMode,
  top,
}) => {
  const AnimatedFastImage = Animated.createAnimatedComponent(
    FastImage as React.ComponentClass<FastImageProps>
  );
  const imageContainer = useRef<ScrollView>(null);
  const dimensions = { width: SCREEN_WIDTH, height: (SCREEN_WIDTH * 16) / 9 };
  const [translate, scale] = getImageTransform(dimensions, SCREEN, top);
  const scrollValueY = useSharedValue(0);

  const onZoomPerformed = useCallback(
    (isZoomed: boolean) => {
      onZoom(isZoomed);
      if (imageContainer?.current) {
        imageContainer.current.setNativeProps({
          scrollEnabled: !isZoomed,
        });
      }
    },
    [onZoom]
  );

  const onLongPressHandler = useCallback(() => {
    onLongPress(imageSrc);
  }, [imageSrc, onLongPress]);

  const [panHandlers, scaleValue, translateValue] = usePanResponder({
    initialScale: scale || 1,
    initialTranslate: translate || { x: 0, y: 0 },
    onZoom: onZoomPerformed,
    doubleTapToZoomEnabled,
    onLongPress: onLongPressHandler,
    delayLongPress,
  });

  const imagesStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withTiming(scaleValue.value, {
            duration: 300,
            easing: Easing.linear,
          }),
        },
        {
          translateX: withTiming(translateValue.value.x, {
            duration: 300,
            easing: Easing.linear,
          }),
        },
        {
          translateY: withTiming(translateValue.value.y, {
            duration: 300,
            easing: Easing.linear,
          }),
        },
      ],
    };
  });

  const imageOpacity = interpolate(
    scrollValueY.value,
    [-SWIPE_CLOSE_OFFSET, 0, SWIPE_CLOSE_OFFSET],
    [0.7, 1, 0.7],
    Extrapolate.CLAMP
  );

  const imageStylesWithOpacity = useAnimatedStyle(
    () => ({ opacity: imageOpacity }),
    []
  );

  const onScrollEndDrag = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const velocityY = nativeEvent?.velocity?.y ?? 0;
    const offsetY = nativeEvent?.contentOffset?.y ?? 0;

    if (
      (Math.abs(velocityY) > SWIPE_CLOSE_VELOCITY &&
        offsetY > SWIPE_CLOSE_OFFSET) ||
      offsetY > SCREEN_HEIGHT / 2
    ) {
      onRequestClose();
    }
  };

  const onScroll = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = nativeEvent?.contentOffset?.y ?? 0;
    onRequestClose();
    scrollValueY.value = offsetY;
  };

  return (
    <ScrollView
      ref={imageContainer}
      style={styles.listItem}
      pagingEnabled
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.imageScrollContainer}
      scrollEnabled={swipeToCloseEnabled}
      {...(swipeToCloseEnabled && {
        onScroll,
        onScrollEndDrag,
      })}
    >
      <AnimatedFastImage
        {...panHandlers}
        resizeMode={resizeMode}
        source={{ uri: imageSrc?.uri || '', priority: cachePriority }}
        style={[dimensions, imageStylesWithOpacity, imagesStyles]}
        defaultSource={require('../../../assets/image.png')}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  listItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  imageScrollContainer: {
    height: SCREEN_HEIGHT * 2,
  },
});

export default React.memo(ImageItem);
