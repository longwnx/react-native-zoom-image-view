import {
  GestureResponderEvent,
  NativeTouchEvent,
  PanResponder,
  PanResponderGestureState,
  PanResponderInstance,
} from 'react-native';
import type { DimensionsScreens, Position } from 'types/Image';

type CacheStorageItem = { key: string; value: any };

export const createCache = (cacheSize: number) => ({
  _storage: [] as CacheStorageItem[],
  get(key: string): any {
    const { value } =
      this._storage.find(({ key: storageKey }) => storageKey === key) || {};

    return value;
  },
  set(key: string, value: any) {
    if (this._storage.length >= cacheSize) {
      this._storage.shift();
    }

    this._storage.push({ key, value });
  },
});

export const splitArrayIntoBatches = (arr: any[], batchSize: number): any[] =>
  arr.reduce((result, item) => {
    const batch = result.pop() || [];

    if (batch.length < batchSize) {
      batch.push(item);
      result.push(batch);
    } else {
      result.push(batch, [item]);
    }

    return result;
  }, []);

export const getImageTransform = (
  image: DimensionsScreens | null,
  screen: DimensionsScreens
) => {
  if (!image?.width || !image?.height) {
    return [] as const;
  }

  const wScale = screen.width / image.width;
  const hScale = screen.height / image.height;
  const scale = Math.min(wScale, hScale);
  const { x, y } = getImageTranslate(image, screen);

  return [{ x, y }, scale] as const;
};

export const getImageStyles = (
  image: DimensionsScreens | null,
  translate: { x: number; y: number },
  scale?: number
) => {
  if (!image?.width || !image?.height) {
    return { width: 0, height: 0 };
  }

  const transform = [{ translateX: translate.x }, { translateY: translate.y }];

  if (scale) {
    const scaleTransform = { scale };
    const perspectiveTransform = { perspective: 1000 };
    transform.push(scaleTransform as any);
    transform.push(perspectiveTransform as any);
  }

  return {
    width: image.width,
    height: image.height,
    transform,
  };
};
export const getImageTranslate = (
  image: DimensionsScreens,
  screen: DimensionsScreens
): Position => {
  const getTranslateForAxis = (axis: 'x' | 'y'): number => {
    const imageSize = axis === 'x' ? image.width : image.height;
    const screenSize = axis === 'x' ? screen.width : screen.height;

    return (screenSize - imageSize) / 2;
  };

  return {
    x: getTranslateForAxis('x'),
    y: getTranslateForAxis('y'),
  };
};

export const getImageDimensionsByTranslate = (
  translate: Position,
  screen: DimensionsScreens
): DimensionsScreens => ({
  width: screen.width - translate.x * 2,
  height: screen.height - translate.y * 2,
});

export const getImageTranslateForScale = (
  currentTranslate: Position,
  targetScale: number,
  screen: DimensionsScreens
): Position => {
  const { width, height } = getImageDimensionsByTranslate(
    currentTranslate,
    screen
  );

  const targetImageDimensions = {
    width: width * targetScale,
    height: height * targetScale,
  };

  return getImageTranslate(targetImageDimensions, screen);
};

type HandlerType = (
  event: GestureResponderEvent,
  state: PanResponderGestureState
) => void;

type PanResponderProps = {
  onGrant: HandlerType;
  onStart?: HandlerType;
  onMove: HandlerType;
  onRelease?: HandlerType;
  onTerminate?: HandlerType;
};

export const createPanResponder = ({
  onGrant,
  onStart,
  onMove,
  onRelease,
  onTerminate,
}: PanResponderProps): PanResponderInstance =>
  PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: onGrant,
    onPanResponderStart: onStart,
    onPanResponderMove: onMove,
    onPanResponderRelease: onRelease,
    onPanResponderTerminate: onTerminate,
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => false,
  });

export const getDistanceBetweenTouches = (
  touches: NativeTouchEvent[]
): number => {
  const [a, b] = touches;

  if (a == null || b == null) {
    return 0;
  }

  return Math.sqrt(
    Math.pow(a.pageX - b.pageX, 2) + Math.pow(a.pageY - b.pageY, 2)
  );
};
