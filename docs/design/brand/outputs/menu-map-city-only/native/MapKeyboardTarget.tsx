import React, {cloneElement, type ReactElement} from 'react';
import {StyleSheet,type StyleProp,type ViewStyle} from 'react-native';
import {NativeTarget} from './MapKeyboardNative';

export function MapKeyboardTarget({id,enabled,style,onKey,onFocusChange,children}:{
  id:string;enabled:boolean;style:StyleProp<ViewStyle>;
  onKey:(key:string)=>boolean;onFocusChange:(focused:boolean)=>void;
  children:ReactElement<{style?:StyleProp<ViewStyle>}>;
}){
  if(!NativeTarget)return children;
  return <NativeTarget testID={`city-menu-keyboard-${id}`} accessible={false} pointerEvents="box-none"
    style={style} keyboardEnabled={enabled}
    onMapKey={event=>{if(enabled)onKey(event.nativeEvent.key);}}
    onMapFocus={event=>onFocusChange(event.nativeEvent.focused)}>
    {cloneElement(children,{style:StyleSheet.absoluteFill})}
  </NativeTarget>;
}
