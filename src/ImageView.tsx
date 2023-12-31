import React, {
  ComponentType,
  FC,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  Dimensions,
  ModalProps,
  StyleSheet,
  View,
  VirtualizedList,
} from 'react-native';
import Animated from 'react-native-reanimated';

import ImageItem from './components/ImageItem/ImageItem';
import ImageDefaultHeader from './components/ImageDefaultHeader';

import useAnimatedComponents from './hooks/useAnimatedComponents';
import useImageIndexChange from './hooks/useImageIndexChange';
import useRequestClose from './hooks/useRequestClose';
import type { ImageSource } from '@types';
import { Priority, ResizeMode } from 'react-native-fast-image';

interface Props {
  images: ImageSource[];
  keyExtractor?: (imageSrc: ImageSource, index: number) => string;
  imageIndex: number;
  visible: boolean;
  onRequestClose: () => void;
  onLongPress?: (image: ImageSource) => void;
  onImageIndexChange?: (imageIndex: number) => void;
  presentationStyle?: ModalProps['presentationStyle'];
  animationType?: ModalProps['animationType'];
  backgroundColor?: string;
  swipeToCloseEnabled?: boolean;
  doubleTapToZoomEnabled?: boolean;
  delayLongPress?: number;
  loadingIndicatorColor?: string;
  HeaderComponent?: ComponentType<{ imageIndex: number }>;
  FooterComponent?: ComponentType<{ imageIndex: number }>;
  top?: number;
  cachePriority?: Priority;
  resizeMode?: ResizeMode;
}

// const DEFAULT_ANIMATION_TYPE = 'fade';
const DEFAULT_BG_COLOR = '#000';
const DEFAULT_DELAY_LONG_PRESS = 800;
const SCREEN = Dimensions.get('screen');
const SCREEN_WIDTH = SCREEN.width;

const ImageView: FC<Props> = ({
  images,
  keyExtractor,
  imageIndex,
  onRequestClose,
  onLongPress = () => undefined,
  onImageIndexChange,
  backgroundColor = DEFAULT_BG_COLOR,
  swipeToCloseEnabled,
  doubleTapToZoomEnabled,
  delayLongPress = DEFAULT_DELAY_LONG_PRESS,
  HeaderComponent,
  FooterComponent,
  loadingIndicatorColor = '#000000',
  cachePriority = 'normal',
  resizeMode = 'contain',
  top = 0,
}) => {
  const imageList = useRef<VirtualizedList<ImageSource>>(null);
  const [opacity, onRequestCloseEnhanced] = useRequestClose(onRequestClose);
  const [currentImageIndex, onScroll] = useImageIndexChange(imageIndex, SCREEN);
  const { headerStyle, footerStyle, toggleVisible } = useAnimatedComponents();

  useEffect(() => {
    if (onImageIndexChange) {
      onImageIndexChange(currentImageIndex);
    }
  }, [currentImageIndex, onImageIndexChange]);

  const onZoom = useCallback(
    (isScaled: boolean) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      imageList?.current?.setNativeProps({ scrollEnabled: !isScaled });
      toggleVisible(!isScaled);
    },
    [toggleVisible]
  );

  return (
    <View style={[styles.container, { opacity, backgroundColor }]}>
      <Animated.View style={[styles.header, headerStyle]}>
        {typeof HeaderComponent !== 'undefined' ? (
          React.createElement(HeaderComponent, {
            imageIndex: currentImageIndex,
          })
        ) : (
          <ImageDefaultHeader
            images={images}
            activeIndex={currentImageIndex}
            onRequestClose={onRequestCloseEnhanced}
          />
        )}
      </Animated.View>
      <VirtualizedList
        ref={imageList}
        data={images}
        horizontal
        pagingEnabled
        windowSize={2}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        initialScrollIndex={imageIndex}
        getItem={(_: any, index: number) => images[index]}
        getItemCount={() => images.length}
        getItemLayout={(_: any, index: number) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item: imageSrc }: { item: ImageSource }) => (
          <ImageItem
            loadingIndicatorColor={loadingIndicatorColor}
            onZoom={onZoom}
            imageSrc={imageSrc}
            onRequestClose={onRequestCloseEnhanced}
            onLongPress={onLongPress}
            delayLongPress={delayLongPress}
            swipeToCloseEnabled={swipeToCloseEnabled}
            doubleTapToZoomEnabled={doubleTapToZoomEnabled}
            top={top}
            cachePriority={cachePriority}
            resizeMode={resizeMode}
          />
        )}
        onMomentumScrollEnd={onScroll}
        keyExtractor={(imageSrc: ImageSource, index: number) =>
          keyExtractor ? keyExtractor(imageSrc, index) : imageSrc.uri
        }
      />
      {typeof FooterComponent !== 'undefined' && (
        <Animated.View style={[styles.footer, footerStyle]}>
          {React.createElement(FooterComponent, {
            imageIndex: currentImageIndex,
          })}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    width: '100%',
    zIndex: 1,
    top: 0,
  },
  footer: {
    position: 'absolute',
    width: '100%',
    zIndex: 1,
    bottom: 0,
  },
});

const EnhancedImageViewing = (props: Props) => (
  <ImageView key={props.imageIndex} {...props} />
);

export default EnhancedImageViewing;
