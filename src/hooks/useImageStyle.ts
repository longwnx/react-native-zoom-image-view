import {
  Easing,
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Dimensions } from 'react-native';
import { DimensionsType } from '@types';

const SCREEN = Dimensions.get('window');
const SCREEN_WIDTH = SCREEN.width;

interface Props {
  imageDimensions: DimensionsType;
  translate: SharedValue<{ x: number; y: number }>;
  scale: SharedValue<number>;
}

const useImageStyles = ({ imageDimensions, translate, scale }: Props) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withTiming(scale.value, {
            duration: 300,
            easing: Easing.linear,
          }),
        },
        {
          translateX: withTiming(translate.value.x, {
            duration: 300,
            easing: Easing.linear,
          }),
        },
        {
          translateY: withTiming(translate.value.y, {
            duration: 300,
            easing: Easing.linear,
          }),
        },
      ],
    };
  });

  return {
    width: imageDimensions?.width || SCREEN_WIDTH,
    height: imageDimensions?.height || (SCREEN_WIDTH * 16) / 9,
    animatedStyle,
  };
};

export default useImageStyles;
