import React from 'react';
import {jest,expect,test,afterEach} from '@jest/globals';
import {render,fireEvent,screen,act} from '@testing-library/react-native';
import {AccessibilityInfo,processColor,StyleSheet} from 'react-native';
import {HomeMapMenu,cityMenuConfig} from '../../../../../../components/city-map-menu';
import {uiStrings} from '../../../../../../components/ui-strings';
import {CityMapMenu} from './CityMapMenu';
import {nativeLayout} from '../native-layout';
import RouteIcon from 'lucide-react-native/icons/route';
import HourglassIcon from 'lucide-react-native/icons/hourglass';

const labels={nearby:'Побач',guides:'Гіды',discovery:'Чым заняцца','reserve-1':'Хутка',kudy:'KUDY'};
const props={width:360,labels,hint:'Утрымлівай і перацягвай',sceneLabels:{water:'Вада',fortifications:'Астатняя карта'},reduceMotion:true};
afterEach(()=>{jest.restoreAllMocks();jest.useRealTimers();});

test('configured pieces control rendering and disabled activation across native input paths',async () => {
  const select=jest.fn();
  await render(<CityMapMenu {...props} items={[{id:'guides'},{id:'kudy',disabled:true}]} onSelect={select}/>);
  expect(screen.queryByTestId('city-menu-access-nearby')).toBeNull();
  const disabled=screen.getByTestId('city-menu-access-kudy');
  expect(disabled.props.accessibilityState).toEqual({disabled:true});
  await fireEvent(disabled,'accessibilityTap');
  await fireEvent(disabled,'accessibilityAction',{nativeEvent:{actionName:'activate'}});
  await fireEvent.press(disabled);
  expect(select).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByTestId('city-menu-access-guides'));
  expect(select).toHaveBeenCalledWith('guides');
});
test('five native accessibility activations call only their stable menu IDs',async () => {
  const select=jest.fn();await render(<CityMapMenu {...props} onSelect={select}/>);
  expect(screen.getByTestId('city-menu-veil-guides',{includeHiddenElements:true}).props.fill).toEqual({type:0,payload:processColor('#fff0c8')});
  for(const p of nativeLayout.pieces)await fireEvent(screen.getByTestId(`city-menu-access-${p.id}`),'accessibilityTap');
  expect(select.mock.calls.map(call=>call[0])).toEqual(nativeLayout.pieces.map(p=>p.id));
});
test('the medallion renders only with a host glyph and carries no text caption (M11)',async () => {
  const {rerender}= await render(<CityMapMenu {...props} items={[{id:'guides'},{id:'kudy',disabled:true}]} onSelect={()=>{}}/>);
  expect(screen.queryByTestId('city-menu-medal-guides',{includeHiddenElements:true})).toBeNull();
  // RNTL 14: rerender is async like render — await it so the medallions
  // mount before the assertions.
  await rerender(<CityMapMenu {...props} items={[{id:'guides',icon:RouteIcon},{id:'kudy',disabled:true,icon:HourglassIcon}]} onSelect={()=>{}}/>);
  expect(screen.getByTestId('city-menu-medal-guides',{includeHiddenElements:true})).toBeTruthy();
  expect(screen.getByTestId('city-menu-medal-kudy',{includeHiddenElements:true})).toBeTruthy();
  expect(screen.queryByText(labels.guides,{includeHiddenElements:true})).toBeNull();
});
test('translations change while the native piece positions remain stable', async () => {
  const {rerender}= await render(<CityMapMenu {...props} onSelect={()=>{}}/>);
  const before=screen.getByTestId('city-menu-piece-guides',{includeHiddenElements:true}).props.transform;
  // RNTL 14: rerender is async like render — await it so the translated
  // labels land before the assertions.
  await rerender(<CityMapMenu {...props} labels={{...labels,guides:'Stadtführungen durch die Altstadt'}} onSelect={()=>{}}/>);
  // Issue #216 (M11): the caption is the screen-reader name only — no
  // visible text label renders, the medallion carries the glyph instead.
  expect(screen.getByTestId('city-menu-access-guides').props.accessibilityLabel).toBe('Stadtführungen durch die Altstadt');
  expect(screen.queryByText('Stadtführungen durch die Altstadt',{includeHiddenElements:true})).toBeNull();
  expect(screen.getByTestId('city-menu-piece-guides',{includeHiddenElements:true}).props.transform).toEqual(before);
});
test('native responder tap selects, while early movement cancels selection',async () => {
  jest.spyOn(Math,'random').mockReturnValue(.5);jest.useFakeTimers();
  const select=jest.fn();const {rerender}= await render(<CityMapMenu {...props} onSelect={select}/>);
  const canvas=screen.getByTestId('city-menu-canvas');
  let stamp=0;
  const event=(x:number,y:number)=>({nativeEvent:{locationX:x,locationY:y,pageX:x,pageY:y,touches:[{pageX:x,pageY:y}],changedTouches:[{pageX:x,pageY:y}]},touchHistory:{numberActiveTouches:1,indexOfSingleActiveTouch:0,mostRecentTimeStamp:++stamp,touchBank:[{touchActive:true,currentTimeStamp:stamp,currentPageX:x,currentPageY:y,previousPageX:x,previousPageY:y}]}});
  const gesture={dx:0,dy:0,numberActiveTouches:1};
  await act(()=>{canvas.props.onResponderGrant(event(80,65),gesture);canvas.props.onResponderRelease(event(80,65),gesture);});
  expect(select).toHaveBeenCalledWith('nearby');select.mockClear();
  await act(()=>{canvas.props.onResponderGrant(event(80,65),gesture);canvas.props.onResponderMove(event(130,65),gesture);canvas.props.onResponderRelease(event(130,65),gesture);});
  expect(select).not.toHaveBeenCalled();
  // RNTL 14: rerender is async like render — await it, then re-query the
  // canvas: the captured instance's props are the pre-rerender snapshot and
  // would tap the all-enabled tree.
  await rerender(<CityMapMenu {...props} items={nativeLayout.pieces.map(p=>({id:p.id,disabled:p.id==='reserve-1'}))} onSelect={select}/>);
  const rerenderedCanvas=screen.getByTestId('city-menu-canvas');
  await act(()=>{rerenderedCanvas.props.onResponderGrant(event(358*360/1600,1054*360/1600),gesture);rerenderedCanvas.props.onResponderRelease(event(358*360/1600,1054*360/1600),gesture);});
  expect(select).not.toHaveBeenCalled();
});
test('real native drags assemble all five, retain five flows and give the scene no flow',async () => {
  jest.spyOn(Math,'random').mockReturnValue(.5);jest.useFakeTimers();
  const select=jest.fn();await render(<CityMapMenu {...props} onSelect={select}/>);
  const canvas=screen.getByTestId('city-menu-canvas');let stamp=0;
  const event=(x:number,y:number)=>({nativeEvent:{locationX:x,locationY:y,touches:[{}]},touchHistory:{numberActiveTouches:1,indexOfSingleActiveTouch:0,mostRecentTimeStamp:++stamp,touchBank:[{touchActive:true,currentTimeStamp:stamp,currentPageX:x,currentPageY:y,previousPageX:x,previousPageY:y}]}});
  const gesture={dx:0,dy:0,numberActiveTouches:1};
  const scale=360/1600;
  for(const [sx,sy,tx,ty] of [[1072,397,709,352],[1201,989,909,252],[358,1054,419,632],[579,1520,709,712]]){
    await act(()=>canvas.props.onResponderGrant(event(sx*scale,sy*scale),gesture));
    await act(()=>jest.advanceTimersByTime(301));
    await act(()=>{canvas.props.onResponderMove(event(tx*scale,ty*scale),gesture);canvas.props.onResponderRelease(event(tx*scale,ty*scale),gesture);});
  }
  expect(select).not.toHaveBeenCalled();
  expect(screen.getByTestId('city-menu-scene-water')).toBeTruthy();
  expect(screen.getByTestId('city-menu-access-guides').props.pointerEvents).toBe('none');
  for(const [id,x,y] of [['nearby',330,485],['guides',650,520],['discovery',850,420],['reserve-1',360,800],['kudy',650,880]] as const){
    await act(()=>{canvas.props.onResponderGrant(event((125+x)*scale,(320+y)*scale),gesture);canvas.props.onResponderRelease(event((125+x)*scale,(320+y)*scale),gesture);});
    expect(select).toHaveBeenLastCalledWith(id);
  }
  select.mockClear();
  await act(()=>{canvas.props.onResponderGrant(event(775*scale,530*scale),gesture);canvas.props.onResponderRelease(event(775*scale,530*scale),gesture);});
  await fireEvent(screen.getByTestId('city-menu-scene-water'),'accessibilityTap');
  expect(select).not.toHaveBeenCalled();
});


test('localized accessibility actions move and cancel without opening a destination',async()=>{
  jest.spyOn(Math,'random').mockReturnValue(.5);
  const select=jest.fn();
  const accessibilityLabels={moveLeft:'Улева',moveRight:'Управа',moveUp:'Уверх',moveDown:'Уніз',snap:'Злучыць',cancel:'Скасаваць',joined:'Злучана'};
  await render(<CityMapMenu {...props} accessibilityLabels={accessibilityLabels} items={[{id:'guides'},{id:'kudy',disabled:true}]} onSelect={select}/>);
  const access=()=>screen.getByTestId('city-menu-access-guides');
  const position=()=>StyleSheet.flatten(access().props.style).left;
  const before=position();
  expect(access().props.accessibilityActions).toContainEqual({name:'moveRight',label:'Управа'});
  expect(screen.getByTestId('city-menu-access-kudy').props.accessibilityActions).toEqual([]);
  await fireEvent(access(),'accessibilityAction',{nativeEvent:{actionName:'moveRight'}});
  expect(position()).not.toEqual(before);
  await fireEvent(access(),'accessibilityAction',{nativeEvent:{actionName:'cancel'}});
  expect(position()).toEqual(before);
  expect(select).not.toHaveBeenCalled();
  await fireEvent(access(),'accessibilityAction',{nativeEvent:{actionName:'activate'}});
  expect(select).toHaveBeenCalledWith('guides');
});


test.each([320,360,390,430])('host at %i dp preserves localized navigation, targets and menu order',async(width)=>{
  jest.spyOn(Math,'random').mockReturnValue(.5);
  const select=jest.fn();
  const {rerender}=await render(<HomeMapMenu key="first" width={width} locale="pl" onSelect={select}/>);
  const access=(id:string)=>screen.getByTestId(`city-menu-access-${id}`);
  const position=()=>StyleSheet.flatten(access('guides').props.style).left;
  const initial=position();
  expect(screen.getAllByRole('button').map(node=>node.props.testID)).toEqual(cityMenuConfig.items.map(item=>`city-menu-access-${item.id}`));
  for(const item of cityMenuConfig.items){
    const target=access(item.id);
    const size=StyleSheet.flatten(target.props.style);
    expect(size.width).toBeGreaterThanOrEqual(48);
    expect(size.height).toBeGreaterThanOrEqual(48);
    if(item.destination)expect(target.props.accessibilityActions).toContainEqual({name:'moveLeft',label:uiStrings('pl').mapAccessibility.moveLeft});
    else expect(target.props.accessibilityState.disabled).toBe(true);
  }
  await fireEvent(access('guides'),'accessibilityAction',{nativeEvent:{actionName:'moveLeft'}});
  expect(position()).not.toEqual(initial);
  expect(select).not.toHaveBeenCalled();
  await fireEvent(access('guides'),'accessibilityAction',{nativeEvent:{actionName:'activate'}});
  expect(select).toHaveBeenCalledWith('guides');
  await rerender(<HomeMapMenu key="second" width={width} locale="pl" onSelect={select}/>);
  expect(position()).toEqual(initial);
});

test('joining via accessibility announces joined state and preserves navigation with reduced motion',async()=>{
  jest.spyOn(Math,'random').mockReturnValue(0);
  const announce=jest.spyOn(AccessibilityInfo,'announceForAccessibility').mockImplementation(()=>{});
  const select=jest.fn();
  const accessibilityLabels={...uiStrings('en').mapAccessibility};
  const ids=['nearby','guides'] as const;
  const positions=Object.fromEntries(nativeLayout.pieces.filter(p=>ids.some(id=>id===p.id)).map(p=>[p.id,{x:125+p.x,y:320+p.y}]));
  await render(<CityMapMenu {...props} accessibilityLabels={accessibilityLabels} items={ids.map(id=>({id}))} layout={{height:1800,positions,dragEnabled:false}} onSelect={select}/>);
  const access=()=>screen.getByTestId('city-menu-access-guides');
  await fireEvent(access(),'accessibilityAction',{nativeEvent:{actionName:'snap'}});
  expect(announce).toHaveBeenCalledWith(accessibilityLabels.joined);
  expect(access().props.accessibilityValue).toEqual({text:accessibilityLabels.joined});
  expect(access().props.accessibilityActions).toEqual([{name:'activate'}]);
  expect(select).not.toHaveBeenCalled();
  await fireEvent(access(),'accessibilityAction',{nativeEvent:{actionName:'activate'}});
  expect(select).toHaveBeenCalledWith('guides');
});

test('keyboard arrows and Escape share the non-pointer movement path',async()=>{
  jest.spyOn(Math,'random').mockReturnValue(.5);
  const select=jest.fn();
  await render(<CityMapMenu {...props} onSelect={select}/>);
  const access=()=>screen.getByTestId('city-menu-access-guides');
  const position=()=>StyleSheet.flatten(access().props.style).left;
  const key=async(key:string,extra={})=>{
    const event={nativeEvent:{key,...extra},preventDefault:jest.fn(),stopPropagation:jest.fn()};
    await fireEvent(access(),'keyDown',event);
    return event;
  };
  const before=position();
  expect((await key('Tab')).preventDefault).not.toHaveBeenCalled();
  expect((await key('ArrowRight',{ctrlKey:true})).preventDefault).not.toHaveBeenCalled();
  expect(position()).toEqual(before);
  expect((await key('ArrowRight')).preventDefault).toHaveBeenCalled();
  expect(position()).not.toEqual(before);
  await key('Escape');
  expect(position()).toEqual(before);
  expect(select).not.toHaveBeenCalled();
});
