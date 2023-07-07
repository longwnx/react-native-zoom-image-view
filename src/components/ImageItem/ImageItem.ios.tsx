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
import { getImageStyles, getImageTransform } from '../../utils';
import type { ImageSource } from '@types';
import { DimensionsType } from '@types';
import FastImage, {
  FastImageProps,
  Priority,
  ResizeMode,
} from 'react-native-fast-image';

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
  top: number;
  cachePriority: Priority;
  resizeMode: ResizeMode;
};

const ImageItem = ({
  imageSrc,
  onZoom,
  onRequestClose,
  onLongPress,
  delayLongPress,
  swipeToCloseEnabled = true,
  doubleTapToZoomEnabled = true,
  top,
  cachePriority,
  resizeMode,
}: Props) => {
  const AnimatedFastImage = Animated.createAnimatedComponent(
    FastImage as React.ComponentClass<FastImageProps>
  );
  const [loaded, setLoaded] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [scaled, setScaled] = useState(false);
  const [dimensions, setDimensions] = useState<DimensionsType | null>({
    width: SCREEN_WIDTH,
    height: (SCREEN_WIDTH * 16) / 9,
  });
  const handleDoubleTap = useDoubleTapToZoom(scrollViewRef, scaled, SCREEN);
  const [translate, scale] = getImageTransform(dimensions, SCREEN, top);
  const scaleValue = new Animated.Value(scale || 1);
  const translateValue = new Animated.ValueXY(translate);
  const maxScale = scale && scale > 0 ? Math.max(1 / scale, 1) : 1;

  const imagesStyles = getImageStyles(dimensions, translateValue, scaleValue);

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
        <TouchableWithoutFeedback
          onPress={doubleTapToZoomEnabled ? handleDoubleTap : undefined}
          onLongPress={onLongPressHandler}
          delayLongPress={delayLongPress}
        >
          <AnimatedFastImage
            resizeMode={resizeMode}
            source={{ uri: imageSrc?.uri || '', priority: cachePriority }}
            style={[
              {
                width: SCREEN_WIDTH,
                height: (SCREEN_WIDTH * 16) / 9,
              },
              { ...imagesStyles },
            ]}
            onLoad={
              !loaded
                ? (event) => {
                    setDimensions({
                      width: event?.nativeEvent?.width,
                      height: event?.nativeEvent?.height,
                    });
                    setLoaded(true);
                  }
                : undefined
            }
            defaultSource={require('../../../assets/image.png')}
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
