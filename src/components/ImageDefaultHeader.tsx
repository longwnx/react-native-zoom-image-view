import React, { FC } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import type { ImageSource } from '@types';

interface Props {
  onRequestClose: () => void;
  activeIndex: number;
  images: ImageSource[];
}

const ImageDefaultHeader: FC<Props> = ({
  onRequestClose,
  activeIndex,
  images,
}) => (
  <>
    <SafeAreaView />
    <View style={styles.root}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.closeButton}
        onPress={onRequestClose}
      >
        <FastImage
          source={require('../../assets/ic_XBack.png')}
          style={{ width: 18, height: 18 }}
        />
      </TouchableOpacity>

      <Text style={styles.closeText}>
        {`${activeIndex + 1} of ${images.length}`}
      </Text>
    </View>
  </>
);

const styles = StyleSheet.create({
  root: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    top: 10,
    left: 0,
    right: 0,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    left: 20,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#000000',
  },
});

export default ImageDefaultHeader;
