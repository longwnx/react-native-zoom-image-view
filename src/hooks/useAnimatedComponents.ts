import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useCallback } from 'react';

const INITIAL_POSITION = { x: 0, y: 0 };
const ANIMATION_CONFIG = {
  duration: 250,
  easing: Easing.linear,
};

const useAnimatedComponents = () => {
  const headerTranslateX = useSharedValue(INITIAL_POSITION.x);
  const headerTranslateY = useSharedValue(INITIAL_POSITION.y);
  const footerTranslateX = useSharedValue(INITIAL_POSITION.x);
  const footerTranslateY = useSharedValue(INITIAL_POSITION.y);

  const toggleVisible = useCallback(
    (isVisible: boolean) => {
      if (isVisible) {
        headerTranslateY.value = withTiming(0, ANIMATION_CONFIG);
        footerTranslateY.value = withTiming(0, ANIMATION_CONFIG);
      } else {
        headerTranslateY.value = withTiming(-300, ANIMATION_CONFIG);
        footerTranslateY.value = withTiming(300, ANIMATION_CONFIG);
      }
    },
    [footerTranslateY, headerTranslateY]
  );

  const headerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: headerTranslateX.value },
        { translateY: headerTranslateY.value },
      ],
    };
  });

  const footerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: footerTranslateX.value },
        { translateY: footerTranslateY.value },
      ],
    };
  });

  return { headerStyle, footerStyle, toggleVisible };
};

export default useAnimatedComponents;
