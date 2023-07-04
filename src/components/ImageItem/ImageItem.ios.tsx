import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import useDoubleTapToZoom from '../../hooks/useDoubleTapToZoom';
import useImageDimensions from '../../hooks/useImageDimensions';

import { getImageStyles, getImageTransform } from '../../utils';
import type { ImageSource } from '../../@types';
import { ImageLoading } from './ImageLoading';

const SWIPE_CLOSE_OFFSET = 50;
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
};

const ImageItem = ({
                     imageSrc,
                     onZoom,
                     onRequestClose,
                     onLongPress,
                     delayLongPress,
                     swipeToCloseEnabled = true,
                     doubleTapToZoomEnabled = true,
                   }: Props) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [loaded, setLoaded] = useState(false);
  const [scaled, setScaled] = useState(false);
  const imageDimensions = useImageDimensions(imageSrc);
  const handleDoubleTap = useDoubleTapToZoom(scrollViewRef, scaled, SCREEN);

  const [translate, scale] = getImageTransform(imageDimensions, SCREEN);
  const scrollValueY = new Animated.Value(0);
  const scaleValue = new Animated.Value(scale || 1);
  const translateValue = new Animated.ValueXY(translate);
  const maxScale = scale && scale > 0 ? Math.max(1 / scale, 2) : 1;
  const viewRef = useRef(null);

  const panResponder = PanResponder.create({
    onPanResponderRelease: (_e, gestureState) => {
      // Xử lý sự kiện vuốt xuống tại đây
      // onRequestClose()
      const { dx, dy } = gestureState;

      // Xác định hướng vuốt dựa trên khoảng cách ngang và dọc
      if (Math.abs(dx) > Math.abs(dy)) {
        // Vuốt ngang
        if (dx > 0) {
          // Vuốt sang phải
          console.log('Swiped right!');
        } else {
          // Vuốt sang trái
          console.log('Swiped left!');
        }
      } else {
        // Vuốt dọc
        if (dy > 100) {
          // Vuốt xuống
          scrollValueY.setValue(0);
          onRequestClose();
          console.log('Swiped down!', dy);
        } else {
          // Vuốt lên
          console.log('Swiped up!');
        }
      }
    },
  });

  const imageOpacity = scrollValueY.interpolate({
    inputRange: [-SWIPE_CLOSE_OFFSET, 0, SWIPE_CLOSE_OFFSET],
    outputRange: [0.5, 1, 0.5],
  });
  const imagesStyles = getImageStyles(
    imageDimensions,
    translateValue,
    scaleValue,
  );
  const imageStylesWithOpacity = { ...imagesStyles, opacity: imageOpacity };

  const onScrollEndDrag = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const velocityY = nativeEvent?.velocity?.y ?? 0;
      const scaled = nativeEvent?.zoomScale > 1;

      onZoom(scaled);
      setScaled(scaled);

      if (swipeToCloseEnabled &&
        !scaled &&
        swipeToCloseEnabled &&
        Math.abs(velocityY) > SWIPE_CLOSE_VELOCITY
      ) {
        onRequestClose();

      }

    },
    [scaled],
  );
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
  }, [loaded]);


  const onLongPressHandler = useCallback(
    (_event: GestureResponderEvent) => {
      onLongPress(imageSrc);
    },
    [imageSrc, onLongPress],
  );

  return (
    <View ref={viewRef}>
      <ScrollView
        {...panResponder.panHandlers}
        ref={scrollViewRef}
        style={styles.listItem}
        pinchGestureEnabled
        // contentOffset={{ x: 0, y: contentOffsetY }}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        maximumZoomScale={maxScale}
        contentContainerStyle={styles.imageScrollContainer}
        scrollEnabled={true}
        onScrollEndDrag={onScrollEndDrag}
        // scrollIndicatorInsets={{top: 0, bottom: 0}}
        scrollEventThrottle={1}

      >
        {(!loaded || !imageDimensions) && <ImageLoading />}
        <TouchableWithoutFeedback
          style={{ backgroundColor: 'green' }}
          onPress={doubleTapToZoomEnabled ? handleDoubleTap : undefined}
          onLongPress={onLongPressHandler}
          delayLongPress={delayLongPress}
        >
          <Animated.Image
            source={imageSrc}
            style={imageStylesWithOpacity}
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
    alignContent: 'center',

  },
  imageScrollContainer: {
    height: SCREEN_HEIGHT,
  },
});

export default React.memo(ImageItem);
