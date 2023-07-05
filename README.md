# react-native-zoom-image-view

> React Native modal component for viewing images as a sliding gallery.

[![npm version](https://badge.fury.io/js/react-native-zoom-image-view.svg)](https://badge.fury.io/js/react-native-zoom-image-view)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

- 🔥Pinch zoom for both iOS and Android
- 🔥Double tap to zoom for both iOS and Android
- 🔥Supports swipe-to-close animation
- 🔥Custom header and footer components
- 🔥Uses VirtualizedList to optimize image loading and rendering

[//]: # (Try with Expo: https://expo.io/@antonkalinin/react-native-zoom-image-view)

<p align="center">
  <img src="https://github.com/longwnx/react-native-zoom-image-view/blob/main/demo.gif?raw=true" height="480" />
</p>

## Installation

```bash
yarn add react-native-zoom-image-view
```

or

```bash
npm install --save react-native-zoom-image-view
```

## Usage

```jsx
import ImageView from "react-native-zoom-image-view";

const images = [
  {
    uri: "https://cdn11.bigcommerce.com/s-jl99edfb3g/images/stencil/original/attribute_rule_images/2797_source_1685935851.jpg",
  },
  {
    uri: "https://cdn11.bigcommerce.com/s-jl99edfb3g/images/stencil/original/attribute_rule_images/2798_source_1685935851.jp",
  },
  {
    uri: "https://cdn11.bigcommerce.com/s-jl99edfb3g/images/stencil/original/attribute_rule_images/2799_source_1685935851.jpg",
  },
  {
    uri: "https://cdn11.bigcommerce.com/s-jl99edfb3g/images/stencil/original/attribute_rule_images/2800_source_1685935851.jpg",
  },
];

const [visible, setIsVisible] = useState(false);

<ImageView
  images={images}
  imageIndex={0}
  visible={visible}
  swipeToCloseEnabled={true}
  onRequestClose={closeModal}
  doubleTapToZoomEnabled={true}
  onImageIndexChange={setActiveIndex}
  backgroundColor={'white'}
  animationType={'slide'}
  loadingIndicatorColor={'#000000'}
  top={top}
/>
```

#### [See Example](https://github.com/longwnx/react-native-zoom-image-view/blob/master/example/App.tsx#L62-L80)

## Props

| Prop name                | Description                                                                                         | Type                                                        | Required |
|--------------------------|-----------------------------------------------------------------------------------------------------|-------------------------------------------------------------|----------|
| `images`                 | Array of images to display                                                                          | ImageSource[]                                               | true     |
| `keyExtractor`           | Uniqely identifying each image                                                                      | (imageSrc: ImageSource, index: number) => string            | false    |
| `imageIndex`             | Current index of image to display                                                                   | number                                                      | true     |
| `visible`                | Is modal shown or not                                                                               | boolean                                                     | true     |
| `onRequestClose`         | Function called to close the modal                                                                  | function                                                    | true     |
| `onImageIndexChange`     | Function called when image index has been changed                                                   | function                                                    | false    |
| `onLongPress`            | Function called when image long pressed                                                             | function (event: GestureResponderEvent, image: ImageSource) | false    |
| `delayLongPress`         | Delay in ms, before onLongPress is called: default `800`                                            | number                                                      | false    |
| `animationType`          | Animation modal presented with: default `fade`                                                      | `none`, `fade`, `slide`                                     | false    |
| `presentationStyle`      | Modal presentation style: default: `fullScreen` **Android:** Use `overFullScreen` to hide StatusBar | `fullScreen`, `pageSheet`, `formSheet`, `overFullScreen`    | false    |
| `backgroundColor`        | Background color of the modal in HEX (#000000EE)                                                    | string                                                      | false    |
| `swipeToCloseEnabled`    | Close modal with swipe up or down: default `true`                                                   | boolean                                                     | false    |
| `doubleTapToZoomEnabled` | Zoom image by double tap on it: default `true`                                                      | boolean                                                     | false    |
| `HeaderComponent`        | Header component, gets current `imageIndex` as a prop                                               | component, function                                         | false    |
| `FooterComponent`        | Footer component, gets current `imageIndex` as a prop                                               | component, function                                         | false    |
| `top`                    | Header safeArea Insets                                                                              | number                                                      | false    |
| `loadingIndicatorColor`  | Loading indicator color                                                                             | string                                                      | false    |

- type ImageSource = {uri: string}

## Contributing

To start contributing clone this repo and then run inside `react-native-zoom-image-view` folder:

```bash
yarn
```

Then go inside `example` folder and run:

```bash
yarn & yarn start
```

This will start packager for expo so you can change `/src/ImageView` and see changes in expo example app.

## License

[MIT](LICENSE)
