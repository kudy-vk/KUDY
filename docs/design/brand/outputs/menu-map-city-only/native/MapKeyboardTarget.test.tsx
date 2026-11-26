import React from 'react';
import {afterEach,expect,jest,test} from '@jest/globals';
import {fireEvent,render,screen,act} from '@testing-library/react-native';
import {AccessibilityInfo,StyleSheet} from 'react-native';
import {CityMapMenu} from './CityMapMenu';
import {nativeLayout} from '../native-layout';
import {uiStrings} from '../../../../../../components/ui-strings';

// The UIKit view itself requires an iOS build. Exercise the exact JS
// event boundary, not RN's Android-only onKeyDown dispatch.
jest.mock('./MapKeyboardNative',()=>({
  NativeTarget: jest.requireActual<typeof import('react-native')>('react-native').View,
}));

afterEach(()=>{jest.restoreAllMocks();});

test('native iOS key events move, cancel, join, and stop when the map is complete',async()=>{
  jest.spyOn(Math,'random').mockReturnValue(0);
  jest.spyOn(AccessibilityInfo,'isScreenReaderEnabled').mockResolvedValue(false);
  const announce=jest.spyOn(AccessibilityInfo,'announceForAccessibility').mockImplementation(()=>{});
  const select=jest.fn();
  const ids=['nearby','guides'] as const;
  const labels={nearby:'Nearby',guides:'Guides',discovery:'Discovery','reserve-1':'About',kudy:'KUDY'};
  const positions=Object.fromEntries(nativeLayout.pieces.filter(p=>ids.some(id=>id===p.id)).map(p=>[p.id,{x:125+p.x,y:320+p.y}]));
  await render(<CityMapMenu width={320} labels={labels} reduceMotion accessibilityLabels={uiStrings('en').mapAccessibility} items={ids.map(id=>({id}))} layout={{height:1800,positions,dragEnabled:true}} onSelect={select}/>);
  const target=()=>screen.getByTestId('city-menu-keyboard-guides');
  const position=()=>StyleSheet.flatten(target().props.style).left;
  const key=(key:string)=>fireEvent(target(),'mapKey',{nativeEvent:{key}});
  expect(target().props.keyboardEnabled).toBe(true);
  expect(target().props.accessible).toBe(false);
  expect(screen.getAllByRole('button')).toHaveLength(2);
  await act(()=>target().props.onMapFocus({nativeEvent:{focused:true}}));
  const before=position();
  await key('ArrowRight');expect(position()).toBeCloseTo(before+8);
  await key('Tab');expect(position()).toBeCloseTo(before+8);
  await key('Escape');expect(position()).toBeCloseTo(before);
  await key('s');
  expect(announce).toHaveBeenCalledWith(uiStrings('en').mapAccessibility.joined);
  expect(target().props.keyboardEnabled).toBe(false);
  await key('ArrowRight');expect(position()).toBeCloseTo(before);
  expect(select).not.toHaveBeenCalled();
  await fireEvent(screen.getByTestId('city-menu-access-guides'),'accessibilityTap');
  expect(select).toHaveBeenCalledWith('guides');
});

test('native keyboard path yields to active VoiceOver without hiding the accessible target',async()=>{
  jest.spyOn(AccessibilityInfo,'isScreenReaderEnabled').mockResolvedValue(true);
  const select=jest.fn();
  const labels={nearby:'Nearby',guides:'Guides',discovery:'Discovery','reserve-1':'About',kudy:'KUDY'};
  await render(<CityMapMenu width={320} labels={labels} reduceMotion accessibilityLabels={uiStrings('en').mapAccessibility} onSelect={select}/>);
  const target=()=>screen.getByTestId('city-menu-keyboard-guides');
  const access=()=>screen.getByTestId('city-menu-access-guides');
  const position=()=>StyleSheet.flatten(target().props.style).left;
  const before=position();
  expect(target().props.keyboardEnabled).toBe(false);
  await fireEvent(target(),'mapKey',{nativeEvent:{key:'ArrowRight'}});
  expect(position()).toEqual(before);
  await fireEvent(access(),'accessibilityAction',{nativeEvent:{actionName:'moveRight'}});
  expect(position()).toBeCloseTo(before+8);
  expect(select).not.toHaveBeenCalled();
});
