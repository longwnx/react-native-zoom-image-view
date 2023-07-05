import React, { useCallback, useRef, useState } from 'react';

import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import useDoubleTapToZoom from '../../hooks/useDoubleTapToZoom';
import useImageDimensions from '../../hooks/useImageDimensions';

import { getImageStyles, getImageTransform } from '../../utils';
import type { ImageSource } from '@types';
import { ImageLoading } from './ImageLoading';
import FastImage, { FastImageProps } from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// const SWIPE_CLOSE_OFFSET = 75;
const SWIPE_CLOSE_VELOCITY = 1.55;
const SCREEN = Dimensions.get('screen');
const SCREEN_WIDTH = SCREEN.width;
const SCREEN_HEIGHT = SCREEN.height;

type Props = {
  imageSrc: ImageSource;
  onRequestClose: () => void;
  onZoom: (scaled: boolean) => void;
  onLongPress: (image: ImageSource) => void;
  delayLongPress: number;
  swipeToCloseEnabled?: boolean;
  doubleTapToZoomEnabled?: boolean;
  loadingIndicatorColor: string;
};

const ImageItem = ({
  imageSrc,
  onZoom,
  onRequestClose,
  onLongPress,
  delayLongPress,
  swipeToCloseEnabled = true,
  doubleTapToZoomEnabled = true,
  loadingIndicatorColor,
}: Props) => {
  const { top } = useSafeAreaInsets();
  const { width } = Dimensions.get('screen');
  const AnimatedFastImage = Animated.createAnimatedComponent(
    FastImage as React.ComponentClass<FastImageProps>
  );
  const scrollViewRef = useRef<ScrollView>(null);
  const [loaded, setLoaded] = useState(false);
  const [scaled, setScaled] = useState(false);
  const imageDimensions = useImageDimensions(imageSrc);
  const handleDoubleTap = useDoubleTapToZoom(scrollViewRef, scaled, SCREEN);

  const [translate, scale] = getImageTransform(imageDimensions, SCREEN, top);
  // const scrollValueY = new Animated.Value(0);
  const scaleValue = new Animated.Value(scale || 1);
  const translateValue = new Animated.ValueXY(translate);
  const maxScale = scale && scale > 0 ? Math.max(1 / scale, 1) : 1;

  // const imageOpacity = scrollValueY.interpolate({
  //   inputRange: [-SWIPE_CLOSE_OFFSET, 0, SWIPE_CLOSE_OFFSET],
  //   outputRange: [0.5, 1, 0.5],
  // });
  const imagesStyles = getImageStyles(
    imageDimensions,
    translateValue,
    scaleValue
  );
  const imageStyles = { ...imagesStyles };

  const onScrollEndDrag = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const velocityY = nativeEvent?.velocity?.y ?? 0;
      const scaled = nativeEvent?.zoomScale > 1;

      onZoom(scaled);
      setScaled(scaled);

      if (
        swipeToCloseEnabled &&
        !scaled &&
        swipeToCloseEnabled &&
        Math.abs(velocityY) > SWIPE_CLOSE_VELOCITY
      ) {
        onRequestClose();
      }
    },
    [onRequestClose, onZoom, swipeToCloseEnabled]
  );

  const onScroll = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (nativeEvent?.zoomScale > 1) {
      return;
    }
  };

  const onLongPressHandler = useCallback(
    (_event: GestureResponderEvent) => {
      onLongPress(imageSrc);
    },
    [imageSrc, onLongPress]
  );

  return (
    <View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.listItem}
        pinchGestureEnabled
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        maximumZoomScale={maxScale}
        contentContainerStyle={styles.imageScrollContainer}
        scrollEnabled={swipeToCloseEnabled}
        onScrollEndDrag={onScrollEndDrag}
        scrollEventThrottle={1}
        {...(swipeToCloseEnabled && {
          onScroll,
        })}
      >
        {(!loaded || !imageDimensions) && (
          <ImageLoading loadingIndicatorColor={loadingIndicatorColor} />
        )}
        <TouchableWithoutFeedback
          onPress={doubleTapToZoomEnabled ? handleDoubleTap : undefined}
          onLongPress={onLongPressHandler}
          delayLongPress={delayLongPress}
        >
          <AnimatedFastImage
            resizeMode={'contain'}
            source={{ uri: imageSrc?.uri || '' }}
            style={[{ width: width, height: (width * 16) / 9 }, imageStyles]}
            onLoad={() => setLoaded(true)}
          />
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  listItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  imageScrollContainer: {
    height: SCREEN_HEIGHT,
  },
});

export default React.memo(ImageItem);
