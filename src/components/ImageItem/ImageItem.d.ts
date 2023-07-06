import React from 'react';
import { ImageSource } from '@types';
import { Priority, ResizeMode } from 'react-native-fast-image';

declare type Props = {
  imageSrc: ImageSource;
  onRequestClose: () => void;
  onZoom: (isZoomed: boolean) => void;
  onLongPress: (image: ImageSource) => void;
  delayLongPress: number;
  swipeToCloseEnabled?: boolean;
  doubleTapToZoomEnabled?: boolean;
  loadingIndicatorColor: string;
  cachePriority: Priority;
  top: number;
  resizeMode: ResizeMode;
};

declare const _default: React.MemoExoticComponent<
  ({
    imageSrc,
    onZoom,
    onRequestClose,
    onLongPress,
    delayLongPress,
    swipeToCloseEnabled,
    loadingIndicatorColor,
    top,
    resizeMode,
    cachePriority,
  }: Props) => JSX.Element
>;

export default _default;
