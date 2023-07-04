import { ImageRequireSource, ImageURISource } from 'react-native';

export type Dimensions = {
  width: number;
  height: number;
};

export type Position = {
  x: number;
  y: number;
};

export type ImageSource = ImageURISource | ImageRequireSource;
