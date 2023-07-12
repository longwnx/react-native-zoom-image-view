import { useCallback, useMemo, useRef } from 'react';
import {
  Dimensions,
  GestureResponderEvent,
  NativeTouchEvent,
  PanResponder,
  PanResponderCallbacks,
  PanResponderGestureState,
} from 'react-native';
import {
  Easing,
  runOnJS,
  SharedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { getImageDimensionsByTranslate } from '../utils';

const SCREEN = Dimensions.get('window');
const SCREEN_WIDTH = SCREEN.width;
const SCREEN_HEIGHT = SCREEN.height;
const MIN_DIMENSION = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);

const SCALE_MAX = 2;
const DOUBLE_TAP_DELAY = 300;
const OUT_BOUND_MULTIPLIER = 0.75;

type Position = { x: number; y: number };

const getDistanceBetweenTouches = (touches: NativeTouchEvent[]) => {
  const [touch1, touch2] = touches;
  return Math.hypot(touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY);
};

type Props = {
  initialScale: number;
  initialTranslate: Position;
  onZoom: (isZoomed: boolean) => void;
  doubleTapToZoomEnabled: boolean;
  onLongPress: () => void;
  delayLongPress: number;
};
const createPanResponder = (handlers: PanResponderCallbacks) => {
  return PanResponder.create(handlers);
};

type GestureResponderHandlers = {
  onMove: (
    event: GestureResponderEvent,
    gestureState: PanResponderGestureState
  ) => void;
  onStart: (
    event: GestureResponderEvent,
    gestureState: PanResponderGestureState
  ) => void;
  onRelease: () => void;
  onGrant: (
    event: GestureResponderEvent,
    gestureState: PanResponderGestureState
  ) => void;
};

const usePanResponder = ({
  initialScale,
  initialTranslate,
  onZoom,
  doubleTapToZoomEnabled,
  onLongPress,
  delayLongPress,
}: Props): [
  GestureResponderHandlers,
  SharedValue<number>,
  SharedValue<Position>
] => {
  const numberInitialTouches = useRef(1);
  const initialTouches = useRef<NativeTouchEvent[]>([]);
  const currentScale = useRef(initialScale);
  const currentTranslate = useRef(initialTranslate);
  const tmpScale = useRef(0);
  const tmpTranslate = useRef<Position | null>(null);
  const isDoubleTapPerformed = useRef<boolean>(false);
  const lastTapTS = useRef<number | null>(null);
  const longPressHandlerRef = useRef<NodeJS.Timeout | null>(null);

  const translateXValue = useSharedValue(0);
  const translateYValue = useSharedValue(0);

  const meaningfulShift = MIN_DIMENSION * 0.01;
  const scaleValue = useSharedValue(initialScale);
  const translateValue = useSharedValue(initialTranslate);

  const imageDimensions = useMemo(
    () => getImageDimensionsByTranslate(initialTranslate, SCREEN),
    [initialTranslate]
  );

  const getBounds = useCallback(
    (scale: number, topInset: number) => {
      const scaledImageDimensions = {
        width: imageDimensions.width * scale,
        height: imageDimensions.height * scale,
      };
      const translateDelta = {
        x: (scaledImageDimensions.width - SCREEN.width) / 2,
        y: (scaledImageDimensions.height - SCREEN.height) / 2,
      };

      const left = initialTranslate.x - translateDelta.x;
      const right = left - (scaledImageDimensions.width - SCREEN.width);
      const top = initialTranslate.y - translateDelta.y + topInset;
      const bottom = top - (scaledImageDimensions.height - SCREEN.height);

      return [top, left, bottom, right];
    },
    [
      imageDimensions.height,
      imageDimensions.width,
      initialTranslate.x,
      initialTranslate.y,
    ]
  );

  const getTranslateInBounds = useCallback(
    (translate: Position, scale: number, top: number) => {
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
    },
    [getBounds]
  );

  const fitsScreenByWidth = useCallback(() => {
    return imageDimensions.width * currentScale.current < SCREEN_WIDTH;
  }, [imageDimensions.width]);

  const fitsScreenByHeight = useCallback(() => {
    return imageDimensions.height * currentScale.current < SCREEN_HEIGHT;
  }, [imageDimensions.height]);

  const cancelLongPressHandle = () => {
    if (longPressHandlerRef.current) {
      clearTimeout(longPressHandlerRef.current);
    }
  };

  const handlers = useMemo(
    () =>
      ({
        onStart: (
          event: GestureResponderEvent,
          gestureState: PanResponderGestureState
        ) => {
          initialTouches.current = event.nativeEvent.touches;
          numberInitialTouches.current = gestureState.numberActiveTouches;

          const tapTS = Date.now();
          isDoubleTapPerformed.current = !!(
            lastTapTS.current && tapTS - lastTapTS.current < DOUBLE_TAP_DELAY
          );

          if (doubleTapToZoomEnabled && isDoubleTapPerformed.current) {
            const isScaled = currentTranslate.current.x !== initialTranslate.x;
            const { pageX: touchX, pageY: touchY } =
              event.nativeEvent.touches[0];
            const targetScale = SCALE_MAX;
            const nextScale = isScaled ? initialScale : targetScale;
            const nextTranslate = isScaled
              ? initialTranslate
              : getTranslateInBounds(
                  {
                    x:
                      initialTranslate.x +
                      (SCREEN_WIDTH / 2 - touchX) *
                        (targetScale / currentScale.current),
                    y:
                      initialTranslate.y +
                      (SCREEN_HEIGHT / 2 - touchY) *
                        (targetScale / currentScale.current),
                  },
                  targetScale,
                  0
                );

            onZoom(!isScaled);

            const animateTranslation = () => {
              'worklet';
              translateXValue.value = withTiming(nextTranslate.x, {
                duration: 300,
                easing: Easing.out(Easing.exp),
                // useNativeDriver: true,
              });

              translateYValue.value = withTiming(nextTranslate.y, {
                duration: 300,
                easing: Easing.out(Easing.exp),
                // useNativeDriver: true,
              });
            };

            const animateScale = () => {
              'worklet';
              scaleValue.value = withTiming(nextScale, {
                duration: 300,
                easing: Easing.out(Easing.exp),
                // useNativeDriver: true,
              });
            };

            runOnJS(animateTranslation)();
            runOnJS(animateScale)();

            currentScale.current = nextScale;
            currentTranslate.current = nextTranslate;

            lastTapTS.current = null;
          } else {
            lastTapTS.current = Date.now();
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
          if (doubleTapToZoomEnabled && isDoubleTapPerformed.current) {
            cancelLongPressHandle();
            return;
          }

          if (
            numberInitialTouches.current === 1 &&
            gestureState.numberActiveTouches === 2
          ) {
            numberInitialTouches.current = 2;
            initialTouches.current = event.nativeEvent.touches;
          }

          const isTapGesture =
            numberInitialTouches.current === 1 &&
            gestureState.numberActiveTouches === 1;
          const isPinchGesture =
            numberInitialTouches.current === 2 &&
            gestureState.numberActiveTouches === 2;

          if (isPinchGesture) {
            cancelLongPressHandle();

            const initialDistance = getDistanceBetweenTouches(
              initialTouches.current
            );
            const currentDistance = getDistanceBetweenTouches(
              event.nativeEvent.touches
            );

            let nextScale =
              (currentDistance / initialDistance) * currentScale.current;

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
            if (
              currentScale.current > initialScale &&
              currentScale.current > nextScale
            ) {
              const k =
                (currentScale.current - initialScale) /
                (currentScale.current - nextScale);

              const nextTranslateX =
                nextScale < initialScale
                  ? initialTranslate.x
                  : currentTranslate.current.x -
                    (currentTranslate.current.x - initialTranslate.x) / k;

              const nextTranslateY =
                nextScale < initialScale
                  ? initialTranslate.y
                  : currentTranslate.current.y -
                    (currentTranslate.current.y - initialTranslate.y) / k;

              translateValue.value.x = nextTranslateX;
              translateValue.value.y = nextTranslateY;

              tmpTranslate.current = { x: nextTranslateX, y: nextTranslateY };
            }

            scaleValue.value = nextScale;
            tmpScale.current = nextScale;
          }

          if (isTapGesture && currentScale.current > initialScale) {
            const { x, y } = currentTranslate.current;
            const { dx, dy } = gestureState;
            const [topBound, leftBound, bottomBound, rightBound] = getBounds(
              currentScale.current,
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

            translateValue.value.x = nextTranslateX;
            translateValue.value.y = nextTranslateY;

            tmpTranslate.current = { x: nextTranslateX, y: nextTranslateY };
          }
        },
        onRelease: () => {
          cancelLongPressHandle();

          if (isDoubleTapPerformed.current) {
            isDoubleTapPerformed.current = false;
          }

          if (tmpScale.current > 0) {
            if (
              tmpScale.current < initialScale ||
              tmpScale.current > SCALE_MAX
            ) {
              tmpScale.current =
                tmpScale.current < initialScale ? initialScale : SCALE_MAX;
              scaleValue.value = withTiming(tmpScale.current, {
                duration: 100,
              });
            }

            currentScale.current = tmpScale.current;
            tmpScale.current = 0;
          }

          if (tmpTranslate.current) {
            const { x, y } = tmpTranslate.current;
            const [topBound, leftBound, bottomBound, rightBound] = getBounds(
              currentScale.current,
              50
            );

            let nextTranslateX = x;
            let nextTranslateY = y;

            if (!fitsScreenByWidth()) {
              if (nextTranslateX > leftBound) {
                nextTranslateX = leftBound;
              } else if (nextTranslateX < rightBound) {
                nextTranslateX = rightBound;
              }
            }

            if (!fitsScreenByHeight()) {
              if (nextTranslateY > topBound) {
                nextTranslateY = topBound;
              } else if (nextTranslateY < bottomBound) {
                nextTranslateY = bottomBound;
              }
            }

            const animateParallel = () => {
              'worklet';

              translateValue.value.x = withTiming(nextTranslateX, {
                duration: 100,
              });

              translateValue.value.y = withTiming(nextTranslateY, {
                duration: 100,
              });
            };

            runOnJS(animateParallel)();

            currentTranslate.current = { x: nextTranslateX, y: nextTranslateY };
            tmpTranslate.current = null;
          }
        },
        onGrant: (
          _: GestureResponderEvent,
          gestureState: PanResponderGestureState
        ) => {
          numberInitialTouches.current = gestureState.numberActiveTouches;

          if (gestureState.numberActiveTouches > 1) return;

          longPressHandlerRef.current = setTimeout(onLongPress, delayLongPress);
        },
      } as PanResponderCallbacks),
    [
      delayLongPress,
      doubleTapToZoomEnabled,
      fitsScreenByHeight,
      fitsScreenByWidth,
      getBounds,
      getTranslateInBounds,
      initialScale,
      initialTranslate,
      meaningfulShift,
      onLongPress,
      onZoom,
      scaleValue,
      translateValue.value,
      translateXValue,
      translateYValue,
    ]
  );

  const panResponder = useMemo(() => createPanResponder(handlers), [handlers]);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return [panResponder.panHandlers, scaleValue, translateValue];
};

export default usePanResponder;
