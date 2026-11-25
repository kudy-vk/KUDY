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
  const before=StyleSheet.flatten(screen.getByTestId('city-menu-piece-guides',{includeHiddenElements:true}).props.style);
  // RNTL 14: rerender is async like render — await it so the translated
  // labels land before the assertions.
  await rerender(<CityMapMenu {...props} labels={{...labels,guides:'Stadtführungen durch die Altstadt'}} onSelect={()=>{}}/>);
  // Issue #216 (M11): the caption is the screen-reader name only — no
  // visible text label renders, the medallion carries the glyph instead.
  expect(screen.getByTestId('city-menu-access-guides').props.accessibilityLabel).toBe('Stadtführungen durch die Altstadt');
  expect(screen.queryByText('Stadtführungen durch die Altstadt',{includeHiddenElements:true})).toBeNull();
  expect(StyleSheet.flatten(screen.getByTestId('city-menu-piece-guides',{includeHiddenElements:true}).props.style)).toEqual(before);
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
test('the full visible medallion accepts tap and held drag at 320 dp',async()=>{
  jest.spyOn(Math,'random').mockReturnValue(.5);jest.useFakeTimers();
  jest.spyOn(AccessibilityInfo,'isScreenReaderEnabled').mockResolvedValue(false);
  const select=jest.fn();
  await render(<HomeMapMenu width={320} locale="be" onSelect={select}/>);
  const canvas=()=>screen.getByTestId('city-menu-canvas');
  const access=()=>screen.getByTestId('city-menu-access-nearby');
  const position=()=>StyleSheet.flatten(access().props.style).left;
  const center=StyleSheet.flatten(screen.getByTestId('city-menu-medal-nearby',{includeHiddenElements:true}).props.style);
  const target=StyleSheet.flatten(access().props.style);
  const x=target.left!+center.left!+19-9,y=target.top!+center.top!+19+15;
  let stamp=0;
  const event=(px:number,py:number)=>({nativeEvent:{locationX:px,locationY:py,pageX:px,pageY:py,touches:[{pageX:px,pageY:py}]},touchHistory:{numberActiveTouches:1,indexOfSingleActiveTouch:0,mostRecentTimeStamp:++stamp,touchBank:[{touchActive:true,currentTimeStamp:stamp,currentPageX:px,currentPageY:py,previousPageX:px,previousPageY:py}]}});
  const gesture={dx:0,dy:0,numberActiveTouches:1};
  const touch=event(x,y);
  expect(canvas().props.onStartShouldSetResponder(touch)).toBe(true);
  await act(()=>{canvas().props.onResponderGrant(touch,gesture);canvas().props.onResponderRelease(touch,gesture);});
  expect(select).toHaveBeenCalledWith('nearby');select.mockClear();
  const initial=position();
  await act(()=>canvas().props.onResponderGrant(event(x,y),gesture));
  await act(()=>jest.advanceTimersByTime(301));
  await act(()=>{canvas().props.onResponderMove(event(x+8,y),gesture);canvas().props.onResponderRelease(event(x+8,y),gesture);});
  expect(position()).toBeCloseTo(initial+8);expect(select).not.toHaveBeenCalled();
});

test('real native drags assemble all five, retain five flows and give the scene no flow',async () => {
  jest.spyOn(Math,'random').mockReturnValue(.5);jest.useFakeTimers();
  const select=jest.fn();await render(<CityMapMenu {...props} onSelect={select}/>);
  const canvas=screen.getByTestId('city-menu-canvas');let stamp=0;
  const event=(x:number,y:number)=>({nativeEvent:{locationX:x,locationY:y,pageX:x,pageY:y,touches:[{}]},touchHistory:{numberActiveTouches:1,indexOfSingleActiveTouch:0,mostRecentTimeStamp:++stamp,touchBank:[{touchActive:true,currentTimeStamp:stamp,currentPageX:x,currentPageY:y,previousPageX:x,previousPageY:y}]}});
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
  const soon=screen.getByTestId('city-menu-access-kudy');
  expect(soon.props.accessibilityActions).toContainEqual({name:'moveRight',label:'Управа'});
  expect(soon.props.accessibilityActions).not.toContainEqual({name:'activate'});
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
    else {
      expect(target.props.accessibilityLabel).toContain(uiStrings('pl').comingSoon);
      expect(target.props.accessibilityActions).not.toContainEqual({name:'activate'});
      expect(target.props.accessibilityActions).toContainEqual({name:'moveLeft',label:uiStrings('pl').mapAccessibility.moveLeft});
    }
  }
  await fireEvent(access('guides'),'accessibilityAction',{nativeEvent:{actionName:'moveLeft'}});
  expect(position()).not.toEqual(initial);
  expect(select).not.toHaveBeenCalled();
  await fireEvent(access('guides'),'accessibilityAction',{nativeEvent:{actionName:'activate'}});
  expect(select).toHaveBeenCalledWith('guides');
  await rerender(<HomeMapMenu key="second" width={width} locale="pl" onSelect={select}/>);
  expect(position()).toEqual(initial);
});

test('production host separates pointer drag from screen reader activation',async()=>{
  jest.spyOn(Math,'random').mockReturnValue(.5);jest.useFakeTimers();
  const read=jest.spyOn(AccessibilityInfo,'isScreenReaderEnabled').mockResolvedValue(false);
  const select=jest.fn();
  const {rerender}=await render(<HomeMapMenu key="pointer" width={360} locale="be" onSelect={select}/>);
  const canvas=()=>screen.getByTestId('city-menu-canvas');
  const piece=(id:string)=>screen.getByTestId(`city-menu-access-${id}`);
  const position=()=>StyleSheet.flatten(piece('nearby').props.style).left;
  const initial=position(),scale=360/1600;
  let stamp=0;
  const event=(x:number,y:number)=>({nativeEvent:{locationX:x,locationY:y,pageX:x,pageY:y,touches:[{pageX:x,pageY:y}]},touchHistory:{numberActiveTouches:1,indexOfSingleActiveTouch:0,mostRecentTimeStamp:++stamp,touchBank:[{touchActive:true,currentTimeStamp:stamp,currentPageX:x,currentPageY:y,previousPageX:x,previousPageY:y}]}});
  const gesture={dx:0,dy:0,numberActiveTouches:1};
  expect(cityMenuConfig.layout.dragEnabled).toBe(true);
  expect(piece('nearby').props.pointerEvents).toBe('none');
  await act(()=>canvas().props.onResponderGrant(event(338*scale,236*scale),gesture));
  await act(()=>jest.advanceTimersByTime(301));
  const movement=event(378*scale,236*scale);
  // Android's local coordinates may change with the hit view. Page delta must not.
  movement.nativeEvent.locationX=999;movement.nativeEvent.locationY=999;
  await act(()=>canvas().props.onResponderMove(movement,gesture));
  expect(position()).toBeCloseTo(initial);
  await act(()=>jest.advanceTimersByTime(32));
  expect(position()).toBeCloseTo(initial+9);
  const artwork=StyleSheet.flatten(screen.getByTestId('city-menu-piece-nearby',{includeHiddenElements:true}).props.style);
  expect(artwork.transform).toEqual([{translateX:expect.closeTo(position()-nativeLayout.pieces.find(p=>p.id==='nearby')!.padding*scale)},{translateY:expect.any(Number)}]);
  await act(()=>canvas().props.onResponderRelease(movement,gesture));
  expect(position()).toBeCloseTo(initial+9);expect(select).not.toHaveBeenCalled();
  await act(()=>canvas().props.onResponderGrant(event(378*scale,236*scale),gesture));
  await act(()=>jest.advanceTimersByTime(301));
  // Multiple moves within a frame use the latest target. Releasing before
  // that frame flushes it once and leaves no deferred movement.
  await act(()=>{
    canvas().props.onResponderMove(event(418*scale,236*scale),gesture);
    canvas().props.onResponderMove(event(478*scale,236*scale),gesture);
    canvas().props.onResponderRelease(event(478*scale,236*scale),gesture);
  });
  expect(position()).toBeCloseTo(initial+31.5);
  await act(()=>jest.advanceTimersByTime(500));
  expect(position()).toBeCloseTo(initial+31.5);expect(select).not.toHaveBeenCalled();
  read.mockResolvedValue(true);
  await rerender(<HomeMapMenu key="reader" width={360} locale="be" onSelect={select}/>);
  expect(piece('nearby').props.pointerEvents).toBe('auto');
  await fireEvent(piece('nearby'),'accessibilityAction',{nativeEvent:{actionName:'moveRight'}});
  expect(position()).toBeCloseTo(initial+8);
  await fireEvent(piece('nearby'),'accessibilityAction',{nativeEvent:{actionName:'moveRight'}});
  expect(position()).toBeCloseTo(initial+16);
  await fireEvent(piece('nearby'),'accessibilityAction',{nativeEvent:{actionName:'cancel'}});
  expect(position()).toBeCloseTo(initial);
  const kudyPosition=()=>StyleSheet.flatten(piece('kudy').props.style).left;
  const kudyStart=kudyPosition();
  await fireEvent(piece('kudy'),'accessibilityAction',{nativeEvent:{actionName:'moveLeft'}});
  expect(kudyPosition()).toBeCloseTo(kudyStart-8);
  await fireEvent(piece('kudy'),'accessibilityTap');expect(select).toHaveBeenCalledWith('kudy');
  await fireEvent(piece('nearby'),'accessibilityTap');expect(select).toHaveBeenCalledWith('nearby');
});

test.each([false,true])('held fragment shows stronger grab feedback (reduced motion %s)',async(reduceMotion)=>{
  jest.spyOn(Math,'random').mockReturnValue(.5);jest.useFakeTimers();
  await render(<CityMapMenu {...props} reduceMotion={reduceMotion} layout={cityMenuConfig.layout} items={cityMenuConfig.items.map(item=>({id:item.id,icon:item.icon}))} onSelect={()=>{}}/>);
  const canvas=()=>screen.getByTestId('city-menu-canvas');
  const veil=()=>screen.getByTestId('city-menu-veil-nearby',{includeHiddenElements:true}).props.opacity;
  const rim=()=>StyleSheet.flatten(screen.getByTestId('city-menu-medal-nearby',{includeHiddenElements:true}).props.style).borderWidth;
  const x=338*360/1600,y=236*360/1600;
  const event={nativeEvent:{locationX:x,locationY:y,pageX:x,pageY:y,touches:[{pageX:x,pageY:y}]},touchHistory:{numberActiveTouches:1,indexOfSingleActiveTouch:0,mostRecentTimeStamp:1,touchBank:[{touchActive:true,currentTimeStamp:1,currentPageX:x,currentPageY:y,previousPageX:x,previousPageY:y}]}};
  const gesture={dx:0,dy:0,numberActiveTouches:1};
  await act(()=>canvas().props.onResponderGrant(event,gesture));
  expect(veil()).toBe(0);
  await act(()=>jest.advanceTimersByTime(301));
  if(!reduceMotion){expect(veil()).toBeLessThan(.38);await act(()=>jest.advanceTimersByTime(200));}
  expect(veil()).toBeCloseTo(.38);expect(rim()).toBeCloseTo(3);
  await act(()=>canvas().props.onResponderRelease(event,gesture));
  expect(veil()).toBe(0);expect(rim()).toBeCloseTo(1.3);
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
