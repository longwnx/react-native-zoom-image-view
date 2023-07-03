import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const INITIAL_POSITION = { x: 0, y: 0 };
const ANIMATION_CONFIG = {
  duration: 200,
  useNativeDriver: true,
};

const useAnimatedComponents = () => {
  const headerTranslateX = useSharedValue(INITIAL_POSITION.x);
  const headerTranslateY = useSharedValue(INITIAL_POSITION.y);
  const footerTranslateX = useSharedValue(INITIAL_POSITION.x);
  const footerTranslateY = useSharedValue(INITIAL_POSITION.y);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: withTiming(headerTranslateX.value, ANIMATION_CONFIG) },
        { translateY: withTiming(headerTranslateY.value, ANIMATION_CONFIG) },
      ],
    };
  });

  const footerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: withTiming(footerTranslateX.value, ANIMATION_CONFIG) },
        { translateY: withTiming(footerTranslateY.value, ANIMATION_CONFIG) },
      ],
    };
  });

  const toggleVisible = (isVisible: boolean) => {
    if (isVisible) {
      headerTranslateY.value = withTiming(0, ANIMATION_CONFIG);
      footerTranslateY.value = withTiming(0, ANIMATION_CONFIG);
    } else {
      headerTranslateY.value = withTiming(-300, ANIMATION_CONFIG);
      footerTranslateY.value = withTiming(300, ANIMATION_CONFIG);
    }
  };

  const getHeaderTransform = () => {
    return headerAnimatedStyle.transform;
  };

  const getFooterTransform = () => {
    return footerAnimatedStyle.transform;
  };

  const toggleVisibleWrapper = (isVisible: boolean) => {
    toggleVisible(isVisible);
  };

  return [
    getHeaderTransform,
    getFooterTransform,
    toggleVisibleWrapper,
  ] as const;
};

export default useAnimatedComponents;
