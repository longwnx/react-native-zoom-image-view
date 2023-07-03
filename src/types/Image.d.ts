import { ImageRequireSource, ImageURISource } from 'react-native';

interface DimensionsScreens {
  width: number;
  height: number;
}

interface Position {
  x: number;
  y: number;
}

type ImageSource = ImageURISource | ImageRequireSource;
