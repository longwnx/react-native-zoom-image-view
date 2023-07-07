import { useMemo } from 'react';
import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  GestureResponderHandlers,
  NativeTouchEvent,
  PanResponderGestureState,
} from 'react-native';

import type { Position } from '@types';
import {
  createPanResponder,
  getDistanceBetweenTouches,
  getImageDimensionsByTranslate,
  getImageTranslate,
} from '../utils';
import {
  Easing,
  useAnimatedGestureHandler,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const SCREEN = Dimensions.get('window');
const SCREEN_WIDTH = SCREEN.width;
const SCREEN_HEIGHT = SCREEN.height;
const MIN_DIMENSION = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);

const SCALE_MAX = 2;
const DOUBLE_TAP_DELAY = 300;
const OUT_BOUND_MULTIPLIER = 0.75;

export type PanResponderProps = {
  initialScale: number;
  initialTranslate: Position;
  onZoom: (isZoomed: boolean) => void;
  doubleTapToZoomEnabled: boolean;
  onLongPress: () => void;
  delayLongPress: number;
};

const usePanResponder = ({
  initialScale,
  initialTranslate,
  onZoom,
  doubleTapToZoomEnabled,
  onLongPress,
  delayLongPress,
}: PanResponderProps): Readonly<
  [GestureResponderHandlers, Animated.Value, Animated.ValueXY]
> => {
  const numberInitialTouches = useSharedValue(1);
  const initialTouches = useSharedValue<NativeTouchEvent[] | null>(null);
  const currentScale = initialScale;
  const currentTranslate = initialTranslate;
  const tmpScale = 0;
  let tmpTranslate: Position | null = null;
  const isDoubleTapPerformed = useSharedValue(false);
  const lastTapTS = useSharedValue<number | null>(null);
  let longPressHandlerRef: NodeJS.Timeout | null = null;

  const meaningfulShift = MIN_DIMENSION * 0.01;
  const scaleValue = useSharedValue(initialScale);
  const translateValue = useSharedValue(initialTranslate);
  const translateXValue = useSharedValue(translateValue.value.x);
  const translateYValue = useSharedValue(translateValue.value.y);

  const imageDimensions = getImageDimensionsByTranslate(
    initialTranslate,
    SCREEN
  );

  const getBounds = (scale: number, topInset: number) => {
    const scaledImageDimensions = {
      width: imageDimensions.width * scale,
      height: imageDimensions.height * scale,
    };
    const translateDelta = getImageTranslate(
      scaledImageDimensions,
      SCREEN,
      topInset
    );

    const left = initialTranslate.x - translateDelta.x;
    const right = left - (scaledImageDimensions.width - SCREEN.width);
    const top = initialTranslate.y - translateDelta.y;
    const bottom = top - (scaledImageDimensions.height - SCREEN.height);

    return [top, left, bottom, right];
  };

  const getTranslateInBounds = (
    translate: Position,
    scale: number,
    top: number
  ) => {
    const inBoundTranslate = { x: translate.x, y: translate.y };
    const [topBound, leftBound, bottomBound, rightBound] = getBounds(
      scale,
      top
    );

    if (translate.x > leftBound) {
      inBoundTranslate.x = leftBound;
    } else if (translate.x < rightBound) {
      inBoundTranslate.x = rightBound;
    }

    if (translate.y > topBound) {
      inBoundTranslate.y = topBound;
    } else if (translate.y < bottomBound) {
      inBoundTranslate.y = bottomBound;
    }

    return inBoundTranslate;
  };

  const fitsScreenByWidth = () =>
    imageDimensions.width * currentScale < SCREEN_WIDTH;
  const fitsScreenByHeight = () =>
    imageDimensions.height * currentScale < SCREEN_HEIGHT;

  useAnimatedReaction(
    () => {
      return scaleValue.value !== initialScale;
    },
    (value) => {
      if (typeof onZoom === 'function') {
        onZoom(value);
      }
    }
  );

  const cancelLongPressHandle = () => {
    longPressHandlerRef && clearTimeout(longPressHandlerRef);
  };

  const handlers = useMemo(
    () => ({
      onGrant: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        numberInitialTouches.value = gestureState.numberActiveTouches;

        if (gestureState.numberActiveTouches > 1) return;

        longPressHandlerRef = setTimeout(onLongPress, delayLongPress);
      },
      onStart: (
        event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        initialTouches.value = event.nativeEvent.touches;
        numberInitialTouches.value = gestureState.numberActiveTouches;

        if (gestureState.numberActiveTouches > 1) return;

        const tapTS = Date.now();

        isDoubleTapPerformed.value = !!(
          lastTapTS.value && tapTS - lastTapTS.value < DOUBLE_TAP_DELAY
        );

        if (doubleTapToZoomEnabled && isDoubleTapPerformed.value) {
          const isScaled = currentTranslate.x !== initialTranslate.x; // currentScale !== initialScale;
          const { pageX: touchX, pageY: touchY } = event.nativeEvent.touches[0];
          const targetScale = SCALE_MAX;
          const nextScale = isScaled ? initialScale : targetScale;
          const nextTranslate = isScaled
            ? initialTranslate
            : getTranslateInBounds(
                {
                  x:
                    initialTranslate.x +
                    (SCREEN_WIDTH / 2 - touchX) * (targetScale / currentScale),
                  y:
                    initialTranslate.y +
                    (SCREEN_HEIGHT / 2 - touchY) * (targetScale / currentScale),
                },
                targetScale,
                0
              );

          onZoom(!isScaled);

          const animationConfig = {
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: true,
          };

          translateXValue.value = withTiming(nextTranslate.x, animationConfig);
          translateYValue.value = withTiming(nextTranslate.y, animationConfig);
          scaleValue.value = withTiming(nextScale, animationConfig);

          lastTapTS.value = null;
        } else {
          lastTapTS.value = Date.now();
        }
      },
      onMove: (
        event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const { dx, dy } = gestureState;

        if (
          Math.abs(dx) >= meaningfulShift ||
          Math.abs(dy) >= meaningfulShift
        ) {
          cancelLongPressHandle();
        }

        // Don't need to handle move because double tap in progress (was handled in onStart)
        if (doubleTapToZoomEnabled && isDoubleTapPerformed) {
          cancelLongPressHandle();
          return;
        }

        if (
          numberInitialTouches.value === 1 &&
          gestureState.numberActiveTouches === 2
        ) {
          numberInitialTouches.value = 2;
          initialTouches.value = event.nativeEvent.touches;
        }

        const isTapGesture =
          numberInitialTouches.value === 1 &&
          gestureState.numberActiveTouches === 1;
        const isPinchGesture =
          numberInitialTouches.value === 2 &&
          gestureState.numberActiveTouches === 2;

        if (isPinchGesture) {
          cancelLongPressHandle();

          const initialDistance = getDistanceBetweenTouches(
            initialTouches.value
          );
          const currentDistance = getDistanceBetweenTouches(
            event.nativeEvent.touches
          );

          let nextScale = (currentDistance / initialDistance) * currentScale;

          /**
           * In case image is scaling smaller than initial size ->
           * slow down this transition by applying OUT_BOUND_MULTIPLIER
           */
          if (nextScale < initialScale) {
            nextScale =
              nextScale + (initialScale - nextScale) * OUT_BOUND_MULTIPLIER;
          }

          /**
           * In case image is scaling down -> move it in direction of initial position
           */
          if (currentScale > initialScale && currentScale > nextScale) {
            const k =
              (currentScale - initialScale) / (currentScale - nextScale);

            const nextTranslateX =
              nextScale < initialScale
                ? initialTranslate.x
                : currentTranslate.x -
                  (currentTranslate.x - initialTranslate.x) / k;

            const nextTranslateY =
              nextScale < initialScale
                ? initialTranslate.y
                : currentTranslate.y -
                  (currentTranslate.y - initialTranslate.y) / k;

            const tmpTranslateX = useSharedValue(nextTranslateX);
            const tmpTranslateY = useSharedValue(nextTranslateY);

            translateValue.value.x = tmpTranslateX.value;
            translateValue.value.y = tmpTranslateY.value;

            tmpTranslate.value = {
              x: tmpTranslateX.value,
              y: tmpTranslateY.value,
            };
          }

          scaleValue.setValue(nextScale);
          tmpScale = nextScale;
        }

        if (isTapGesture && currentScale > initialScale) {
          const { x, y } = currentTranslate;
          const { dx, dy } = gestureState;
          const [topBound, leftBound, bottomBound, rightBound] = getBounds(
            currentScale,
            0
          );

          let nextTranslateX = x + dx;
          let nextTranslateY = y + dy;

          if (nextTranslateX > leftBound) {
            nextTranslateX =
              nextTranslateX -
              (nextTranslateX - leftBound) * OUT_BOUND_MULTIPLIER;
          }

          if (nextTranslateX < rightBound) {
            nextTranslateX =
              nextTranslateX -
              (nextTranslateX - rightBound) * OUT_BOUND_MULTIPLIER;
          }

          if (nextTranslateY > topBound) {
            nextTranslateY =
              nextTranslateY -
              (nextTranslateY - topBound) * OUT_BOUND_MULTIPLIER;
          }

          if (nextTranslateY < bottomBound) {
            nextTranslateY =
              nextTranslateY -
              (nextTranslateY - bottomBound) * OUT_BOUND_MULTIPLIER;
          }

          if (fitsScreenByWidth()) {
            nextTranslateX = x;
          }

          if (fitsScreenByHeight()) {
            nextTranslateY = y;
          }

          translateValue.value.x.setValue(nextTranslateX);
          translateValue.value.y.setValue(nextTranslateY);

          tmpTranslate = { x: nextTranslateX, y: nextTranslateY };
        }
      },
      onRelease: () => {
        // Xử lý sự kiện nhả chuột ở đây
      },
    }),
    []
  );

  const panGestureEvent = useAnimatedGestureHandler({
    onActive: (event, ctx) => {
      // Xử lý sự kiện di chuyển ở đây
    },
    onEnd: () => {
      // Xử lý sự kiện nhả chuột ở đây
    },
  });

  useAnimatedReaction(
    () => {
      return scaleValue.value !== initialScale;
    },
    (value) => {
      if (typeof onZoom === 'function') {
        onZoom(value);
      }
    }
  );

  //   onMove: (
  //     event: GestureResponderEvent,
  //     gestureState: PanResponderGestureState
  //   ) => {
  //     const { dx, dy } = gestureState;
  //
  //     if (Math.abs(dx) >= meaningfulShift || Math.abs(dy) >= meaningfulShift) {
  //       cancelLongPressHandle();
  //     }
  //
  //     // Don't need to handle move because double tap in progress (was handled in onStart)
  //     if (doubleTapToZoomEnabled && isDoubleTapPerformed) {
  //       cancelLongPressHandle();
  //       return;
  //     }
  //
  //     if (
  //       numberInitialTouches === 1 &&
  //       gestureState.numberActiveTouches === 2
  //     ) {
  //       numberInitialTouches = 2;
  //       initialTouches = event.nativeEvent.touches;
  //     }
  //
  //     const isTapGesture =
  //       numberInitialTouches === 1 && gestureState.numberActiveTouches === 1;
  //     const isPinchGesture =
  //       numberInitialTouches === 2 && gestureState.numberActiveTouches === 2;
  //
  //     if (isPinchGesture) {
  //       cancelLongPressHandle();
  //
  //       const initialDistance = getDistanceBetweenTouches(initialTouches);
  //       const currentDistance = getDistanceBetweenTouches(
  //         event.nativeEvent.touches
  //       );
  //
  //       let nextScale = (currentDistance / initialDistance) * currentScale;
  //
  //       /**
  //        * In case image is scaling smaller than initial size ->
  //        * slow down this transition by applying OUT_BOUND_MULTIPLIER
  //        */
  //       if (nextScale < initialScale) {
  //         nextScale =
  //           nextScale + (initialScale - nextScale) * OUT_BOUND_MULTIPLIER;
  //       }
  //
  //       /**
  //        * In case image is scaling down -> move it in direction of initial position
  //        */
  //       if (currentScale > initialScale && currentScale > nextScale) {
  //         const k = (currentScale - initialScale) / (currentScale - nextScale);
  //
  //         const nextTranslateX =
  //           nextScale < initialScale
  //             ? initialTranslate.x
  //             : currentTranslate.x -
  //               (currentTranslate.x - initialTranslate.x) / k;
  //
  //         const nextTranslateY =
  //           nextScale < initialScale
  //             ? initialTranslate.y
  //             : currentTranslate.y -
  //               (currentTranslate.y - initialTranslate.y) / k;
  //
  //         translateValue.x.setValue(nextTranslateX);
  //         translateValue.y.setValue(nextTranslateY);
  //
  //         tmpTranslate = { x: nextTranslateX, y: nextTranslateY };
  //       }
  //
  //       scaleValue.setValue(nextScale);
  //       tmpScale = nextScale;
  //     }
  //
  //     if (isTapGesture && currentScale > initialScale) {
  //       const { x, y } = currentTranslate;
  //       const { dx, dy } = gestureState;
  //       const [topBound, leftBound, bottomBound, rightBound] = getBounds(
  //         currentScale,
  //         0
  //       );
  //
  //       let nextTranslateX = x + dx;
  //       let nextTranslateY = y + dy;
  //
  //       if (nextTranslateX > leftBound) {
  //         nextTranslateX =
  //           nextTranslateX -
  //           (nextTranslateX - leftBound) * OUT_BOUND_MULTIPLIER;
  //       }
  //
  //       if (nextTranslateX < rightBound) {
  //         nextTranslateX =
  //           nextTranslateX -
  //           (nextTranslateX - rightBound) * OUT_BOUND_MULTIPLIER;
  //       }
  //
  //       if (nextTranslateY > topBound) {
  //         nextTranslateY =
  //           nextTranslateY - (nextTranslateY - topBound) * OUT_BOUND_MULTIPLIER;
  //       }
  //
  //       if (nextTranslateY < bottomBound) {
  //         nextTranslateY =
  //           nextTranslateY -
  //           (nextTranslateY - bottomBound) * OUT_BOUND_MULTIPLIER;
  //       }
  //
  //       if (fitsScreenByWidth()) {
  //         nextTranslateX = x;
  //       }
  //
  //       if (fitsScreenByHeight()) {
  //         nextTranslateY = y;
  //       }
  //
  //       translateValue.x.setValue(nextTranslateX);
  //       translateValue.y.setValue(nextTranslateY);
  //
  //       tmpTranslate = { x: nextTranslateX, y: nextTranslateY };
  //     }
  //   },
  //   onRelease: () => {
  //     cancelLongPressHandle();
  //
  //     if (isDoubleTapPerformed) {
  //       isDoubleTapPerformed = false;
  //     }
  //
  //     if (tmpScale > 0) {
  //       if (tmpScale < initialScale || tmpScale > SCALE_MAX) {
  //         tmpScale = tmpScale < initialScale ? initialScale : SCALE_MAX;
  //         Animated.timing(scaleValue, {
  //           toValue: tmpScale,
  //           duration: 100,
  //           useNativeDriver: true,
  //         }).start();
  //       }
  //
  //       currentScale = tmpScale;
  //       tmpScale = 0;
  //     }
  //
  //     if (tmpTranslate) {
  //       const { x, y } = tmpTranslate;
  //       const [topBound, leftBound, bottomBound, rightBound] = getBounds(
  //         currentScale,
  //         50
  //       );
  //
  //       let nextTranslateX = x;
  //       let nextTranslateY = y;
  //
  //       if (!fitsScreenByWidth()) {
  //         if (nextTranslateX > leftBound) {
  //           nextTranslateX = leftBound;
  //         } else if (nextTranslateX < rightBound) {
  //           nextTranslateX = rightBound;
  //         }
  //       }
  //
  //       if (!fitsScreenByHeight()) {
  //         if (nextTranslateY > topBound) {
  //           nextTranslateY = topBound;
  //         } else if (nextTranslateY < bottomBound) {
  //           nextTranslateY = bottomBound;
  //         }
  //       }
  //
  //       Animated.parallel([
  //         Animated.timing(translateValue.x, {
  //           toValue: nextTranslateX,
  //           duration: 100,
  //           useNativeDriver: true,
  //         }),
  //         Animated.timing(translateValue.y, {
  //           toValue: nextTranslateY,
  //           duration: 100,
  //           useNativeDriver: true,
  //         }),
  //       ]).start();
  //
  //       currentTranslate = { x: nextTranslateX, y: nextTranslateY };
  //       tmpTranslate = null;
  //     }
  //   },
  // };

  const panResponder = useMemo(() => createPanResponder(handlers), [handlers]);

  return [panResponder.panHandlers, scaleValue, translateValue];
};

export default usePanResponder;
