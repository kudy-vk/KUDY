import React from 'react';
import {jest,expect,test,afterEach} from '@jest/globals';
import {render,fireEvent,screen,act} from '@testing-library/react-native';
import {processColor} from 'react-native';
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

test('MAP-10: native screen-reader and keyboard actions move and restore pieces without selection',async () => {
  const select=jest.fn();
  const actionLabels={moveLeft:'Налева',moveRight:'Направа',moveUp:'Уверх',moveDown:'Уніз',snap:'Злучыць',cancel:'Скасаваць'};
  await render(<CityMapMenu {...props} actionLabels={actionLabels} connectedLabel={(count,total)=>`${count}/${total}`} items={[{id:'guides'},{id:'kudy',disabled:true}]} layout={{height:2500,positions:{guides:{x:800,y:500}},dragEnabled:false}} onSelect={select}/>);
  const canvas=screen.getByTestId('city-menu-canvas');
  expect(canvas.props.onStartShouldSetResponder({nativeEvent:{touches:[{}],locationX:80,locationY:65}})).toBe(false);
  const button=screen.getByTestId('city-menu-access-guides');
  const position=()=>screen.getByTestId('city-menu-access-guides').props.style.at(-1).left as number;
  const start=position();
  expect(button.props.accessibilityActions.map((action:{name:string})=>action.name)).toEqual(['activate','moveLeft','moveRight','moveUp','moveDown','snap','cancel']);
  expect(button.props.accessibilityValue).toEqual({text:'1/2'});
  expect(screen.getByTestId('city-menu-access-kudy').props.focusable).toBe(true);
  await fireEvent(button,'accessibilityAction',{nativeEvent:{actionName:'moveRight'}});
  const moved=position();
  expect(moved).not.toBe(start);
  expect(select).not.toHaveBeenCalled();
  await fireEvent(button,'accessibilityAction',{nativeEvent:{actionName:'cancel'}});
  expect(position()).toBe(start);
  const preventDefault=jest.fn();
  await fireEvent(button,'keyDown',{nativeEvent:{key:'ArrowRight',altKey:false,ctrlKey:false,metaKey:false},preventDefault});
  expect(preventDefault).toHaveBeenCalledTimes(1);
  expect(position()).not.toBe(start);
  await fireEvent(button,'keyDown',{nativeEvent:{key:'Escape',altKey:false,ctrlKey:false,metaKey:false},preventDefault});
  expect(position()).toBe(start);
  await fireEvent(screen.getByTestId('city-menu-access-kudy'),'accessibilityTap');
  expect(select).not.toHaveBeenCalled();
});
