import React, { FC } from 'react';

import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';

const SCREEN = Dimensions.get('screen');
const SCREEN_WIDTH = SCREEN.width;
const SCREEN_HEIGHT = SCREEN.height;

type Props = {
  loadingIndicatorColor: string;
};

export const ImageLoading: FC<Props> = ({ loadingIndicatorColor }) => (
  <View style={styles.loading}>
    <ActivityIndicator size="small" color={loadingIndicatorColor} />
  </View>
);

const styles = StyleSheet.create({
  listItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loading: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageScrollContainer: {
    height: SCREEN_HEIGHT,
  },
});
