import type {ReactElement} from 'react';
import {Platform,type StyleProp,type ViewStyle} from 'react-native';
import {requireNativeViewManager,requireOptionalNativeModule} from 'expo-modules-core';

type NativeTargetProps = {
  style: StyleProp<ViewStyle>;
  testID: string;
  accessible: boolean;
  pointerEvents: 'box-none';
  keyboardEnabled: boolean;
  onMapKey: (event:{nativeEvent:{key:string}})=>void;
  onMapFocus: (event:{nativeEvent:{focused:boolean}})=>void;
  children: ReactElement;
};

// Android already dispatches onKeyDown on the Pressable. iOS needs UIKit
// key commands from the local native module. Old binaries without the module
// retain screen-reader actions; hardware keyboard support needs a new build.
export const NativeTarget = Platform.OS==='ios'&&requireOptionalNativeModule('KudyMapKeyboard')
  ? requireNativeViewManager<NativeTargetProps>('KudyMapKeyboard') : null;
