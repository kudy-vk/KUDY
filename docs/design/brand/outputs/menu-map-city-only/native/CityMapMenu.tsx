import React,{useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {AccessibilityInfo,AppState,PanResponder,Pressable,StyleSheet,View} from 'react-native';
import type {GestureResponderEvent,StyleProp,ViewStyle} from 'react-native';
import Svg,{Circle,ClipPath,Defs,Ellipse,G,Image as SvgImage,Mask,Path,RadialGradient,Rect,Stop} from 'react-native-svg';
import {amberPalette,lightThreads} from '../amber-light.mjs';
import manifest from '../manifest.json';
import {cityMenuAssets,citySceneAssets} from '../native-assets';
import {nativeLayout} from '../native-layout';
import {CityPuzzle} from './model';
import type {CityMenuLayout,PieceId,Point,PuzzleEvent,SceneId} from './model';
import {CanonIcon,type CanonGlyph} from '../../../../../../components/canon-icon';
import {tokens} from '../../../../../../components/design-tokens';

export type {PieceId,SceneId} from './model';
// Issue #216 (M11): the medallion glyph arrives as the component (CanonGlyph),
// the renderer places it on the medallion disc itself — the pieces carry no
// visible text captions any more, the label stays the screen-reader name.
export type CityMenuItem = {id:PieceId;disabled?:boolean;icon?:CanonGlyph};
export interface CityMapMenuProps {
  width: number;
  labels: Readonly<Record<PieceId,string>>;
  hint?: string;
  sceneLabels?: Readonly<Record<SceneId,string>>;
  items?: readonly CityMenuItem[];
  layout?: CityMenuLayout;
  onSelect: (id:PieceId)=>void;
  reduceMotion?: boolean;
  style?: StyleProp<ViewStyle>;
}

// The medallion of the map pieces (mockup menu.mjs MEDAL/GLYPH): a constant
// 38dp cream disc with the sand-gold rim and the section glyph in brown ink.
// The off (disabled) tones are the mockup's literal `.medal.off` values; the
// disc sits on the light map art (DT-4), so the tones are theme-independent.
const MEDAL = 38;
const OFF_PAPER = '#f3ead6';
const OFF_RIM = '#a8957c';
const OFF_INK = '#7d6c58';
// The mockup's `.piece.off` tone: a pale, desaturated art. React Native has
// no SVG filters, so the dim is a paper veil through the piece's own light
// mask; a press lights the piece back for the mockup's 700 ms.
const DIM_OPACITY = 0.55;
const LIT_MS = 700;

export function CityMapMenu(props:CityMapMenuProps) {
  const {width,labels,hint,sceneLabels,style}=props;
  const items:readonly CityMenuItem[]=props.items??nativeLayout.pieces.map(p=>({id:p.id}));
  const pieceKey=items.map(item=>item.id).join(',');
  const layoutKey=JSON.stringify(props.layout);
  // Labels and destination state may change without moving the geometry.
  const model=useMemo(()=>new CityPuzzle(width,Math.random,pieceKey.split(',') as PieceId[],props.layout),[pieceKey,layoutKey]);
  const sceneHeight=props.layout?.height??1800;
  const pieces=items.map(item=>nativeLayout.pieces.find(piece=>piece.id===item.id)!);
  const [focused,setFocused]=useState<PieceId|null>(null);
  const [litId,setLitId]=useState<PieceId|null>(null);
  const [,setRevision]=useState(0);
  const [systemReduced,setSystemReduced]=useState(true);
  const reduced=props.reduceMotion??systemReduced;
  const latest=useRef(props);latest.current=props;
  const reducedRef=useRef(reduced);reducedRef.current=reduced;
  const frame=useRef<number|null>(null);
  const hold=useRef<ReturnType<typeof setTimeout>|null>(null);
  const lit=useRef<ReturnType<typeof setTimeout>|null>(null);
  const feedback=useRef<{point:Point;until:number}|null>(null);
  const clock=useRef(Date.now());
  const refresh=useCallback(()=>setRevision(value=>value+1),[]);
  const clearHold=useCallback(()=>{if(hold.current!==null)clearTimeout(hold.current);hold.current=null;},[]);
  const clearLit=useCallback(()=>{if(lit.current!==null)clearTimeout(lit.current);lit.current=null;},[]);
  const stopFrame=useCallback(()=>{if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=null;},[]);
  const cancel=useCallback(()=>{clearHold();model.cancel();refresh();},[clearHold,model,refresh]);
  const startFrame=useCallback(()=>{
    if(frame.current!==null)return;
    const tick=()=>{
      frame.current=null;clock.current=Date.now();
      if(reducedRef.current)model.completeNow();
      const moving=model.advance(clock.current);
      if(feedback.current&&feedback.current.until<=clock.current)feedback.current=null;
      refresh();
      if(moving||feedback.current)frame.current=requestAnimationFrame(tick);
    };
    frame.current=requestAnimationFrame(tick);
  },[model,refresh]);
  const pulse=useCallback((point:Point)=>{
    feedback.current={point,until:Date.now()+(reducedRef.current?120:380)};
    startFrame();refresh();
  },[startFrame,refresh]);
  const handle=useCallback((event:PuzzleEvent)=>{
    if(event.kind==='select'){
      const item=latest.current.items?.find(item=>item.id===event.id);
      if(!latest.current.items||item&&!item.disabled)latest.current.onSelect(event.id);
    }
    else if(event.kind==='passive'||event.kind==='snap'){
      pulse(event.point);
      if(event.kind==='snap'&&event.complete){if(reducedRef.current)model.completeNow();else startFrame();}
    }
  },[model,pulse,startFrame]);
  const activatePiece=useCallback((id:PieceId)=>{
    const item=latest.current.items?.find(item=>item.id===id);
    if(item?.disabled){
      // M4: a waiting piece answers a tap with its colour only — the piece
      // lights back for a moment and nothing opens.
      setLitId(id);
      clearLit();
      lit.current=setTimeout(()=>setLitId(null),LIT_MS);
      return;
    }
    if(!latest.current.items||item)latest.current.onSelect(id);
  },[clearLit]);

  useLayoutEffect(()=>{stopFrame();clearHold();model.resize(width);if(model.phase!=='scattered'&&model.phase!=='complete')model.completeNow();feedback.current=null;refresh();},[width,model,refresh,clearHold,stopFrame]);
  useEffect(()=>{
    if(props.reduceMotion!==undefined)return;
    let active=true;
    AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(active)setSystemReduced(value);}).catch(error=>console.warn('Could not read Reduce Motion; using reduced motion',error));
    const listener=AccessibilityInfo.addEventListener('reduceMotionChanged',setSystemReduced);
    return()=>{active=false;listener.remove();};
  },[props.reduceMotion]);
  useEffect(()=>{
    if(reduced){stopFrame();feedback.current=null;model.completeNow();refresh();}
  },[reduced,model,stopFrame,refresh]);
  useEffect(()=>{
    const subscription=AppState.addEventListener('change',state=>{
      if(state!=='active'){clearHold();stopFrame();model.cancel();model.completeNow();feedback.current=null;refresh();}
    });
    return()=>{subscription.remove();clearHold();clearLit();stopFrame();model.cancel();feedback.current=null;};
  },[model,clearHold,clearLit,stopFrame,refresh]);

  const responder=useMemo(()=>{
    const point=(event:GestureResponderEvent)=>({x:event.nativeEvent.locationX*1600/width,y:event.nativeEvent.locationY*1600/width});
    return PanResponder.create({
      onStartShouldSetPanResponder:event=>event.nativeEvent.touches.length===1&&Boolean(model.hit(point(event))),
      onPanResponderGrant:event=>{
        clearHold();if(event.nativeEvent.touches.length!==1){cancel();return;}
        const hit=model.begin(point(event),Date.now());refresh();
        if(hit&&!hit.passive)hold.current=setTimeout(()=>{hold.current=null;model.hold(Date.now());refresh();},nativeLayout.gesture.holdMs);
      },
      onPanResponderStart:event=>{if(event.nativeEvent.touches.length!==1)cancel();},
      onPanResponderMove:event=>{
        if(event.nativeEvent.touches.length!==1){cancel();return;}
        const result=model.move(point(event),Date.now());
        if(result.kind==='snap')clearHold();
        handle(result);refresh();
      },
      onPanResponderRelease:()=>{clearHold();const result=model.release(Date.now());refresh();handle(result);},
      onPanResponderTerminate:cancel,
      onPanResponderTerminationRequest:()=>true,
      onShouldBlockNativeResponder:()=>true,
    });
  },[width,model,cancel,clearHold,handle,refresh]);

  const scale=width/1600,complete=model.phase!=='scattered';
  const pulseProgress=feedback.current?Math.max(0,Math.min(1,(feedback.current.until-clock.current)/380)):0;
  const passivePress=(id:SceneId)=>{const part=model.scenery.find(p=>p.id===id)!;pulse({x:125+part.x+part.width/2,y:320+part.y+part.height/2});};
  // The piece-relative medallion anchor of each piece, from the accepted
  // package manifest (menu.mjs: [anchor] − [x, y]).
  const medalAt=(id:PieceId)=>{
    const piece=manifest.pieces.find(piece=>piece.id===id);
    if(!piece)return null;
    return {x:(piece.anchor[0]-piece.x)*scale,y:(piece.anchor[1]-piece.y)*scale};
  };
  return <View style={[styles.host,style,{width,height:width*sceneHeight/1600}]}>
    <View testID="city-menu-canvas" collapsable={false} style={StyleSheet.absoluteFill} {...responder.panHandlers}>
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
        <Svg width={width} height={width*sceneHeight/1600} viewBox={`0 0 1600 ${sceneHeight}`}>
          <Defs>
            <RadialGradient id="city-menu-light"><Stop offset={0} stopColor={amberPalette.core}/><Stop offset={0.4} stopColor={amberPalette.glow} stopOpacity={0.95}/><Stop offset={1} stopColor={amberPalette.edge} stopOpacity={0}/></RadialGradient>
            <ClipPath id="city-menu-reveal"><Circle cx="675" cy="582" r={model.radius}/></ClipPath>
            {pieces.map(item=><Mask key={item.id} id={`city-menu-veil-${item.id}`} maskUnits="userSpaceOnUse" x={0} y={0} width={item.width} height={item.height}><SvgImage href={cityMenuAssets[item.id].light} width={item.width} height={item.height}/></Mask>)}
          </Defs>
          <Ellipse cx="800" cy="902" rx={350+model.light*530} ry={320+model.light*470} fill="url(#city-menu-light)" opacity={model.light}/>
          <G opacity={model.light*.25} fill="none" stroke={amberPalette.glow}><Ellipse cx="800" cy="902" rx="690" ry="560" strokeWidth={5}/><Ellipse cx="800" cy="902" rx="740" ry="610" strokeWidth={2}/></G>
          <G testID="city-menu-light-threads" pointerEvents="none" transform="translate(125 320)" opacity={reduced?0:1}>
            {lightThreads(model.effectProgress,model.light).map((thread,i)=><G key={i} transform={`translate(${thread.x} ${thread.y})`} opacity={thread.opacity}>
              <Path d={thread.d} fill="none" stroke={amberPalette.glow} strokeWidth={18} strokeOpacity={0.1} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={[1700,1500]} strokeDashoffset={thread.offset}/>
              <Path d={thread.d} fill="none" stroke={amberPalette.edge} strokeWidth={7} strokeOpacity={0.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={[1700,1500]} strokeDashoffset={thread.offset}/>
              <Path d={thread.d} fill="none" stroke={thread.core} strokeWidth={thread.width} strokeOpacity={0.95} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={[1700,1500]} strokeDashoffset={thread.offset}/>
            </G>)}
          </G>
          {pieces.map(item=>{
            const at=model.position(item.id),entry=items.find(entry=>entry.id===item.id)!,disabled=entry.disabled===true;
            return <G key={item.id} testID={`city-menu-piece-${item.id}`} transform={`translate(${at.x} ${at.y})`} opacity={model.active?.hit.id===item.id&&!model.active?.held?0.86:1}>
              <SvgImage href={cityMenuAssets[item.id].city} width={item.width} height={item.height}/>
              {!complete&&<SvgImage href={cityMenuAssets[item.id].ui} x={-item.padding} y={-item.padding} width={item.width+item.padding*2} height={item.height+item.padding*2}/>}
              <Rect testID={`city-menu-veil-${item.id}`} x={0} y={0} width={item.width} height={item.height} fill={amberPalette.veil} mask={`url(#city-menu-veil-${item.id})`} opacity={model.silhouette}/>
              {disabled&&<Rect testID={`city-menu-dim-${item.id}`} x={0} y={0} width={item.width} height={item.height} fill={tokens.colorPaper} mask={`url(#city-menu-veil-${item.id})`} opacity={litId===item.id?0:DIM_OPACITY}/>}
            </G>;
          })}
          <G transform="translate(125 320)" clipPath="url(#city-menu-reveal)">
            {nativeLayout.layers.map(item=><SvgImage key={item.id} href={citySceneAssets[item.id]} x={item.x} y={item.y} width={item.width} height={item.height}/>)}
          </G>
          {feedback.current&&<Circle cx={feedback.current.point.x} cy={feedback.current.point.y} r={reduced?55:40+(1-pulseProgress)*140} stroke="#bd852c" strokeWidth={6} fill="#f4d68a" fillOpacity={.2} opacity={pulseProgress}/>}
        </Svg>
      </View>
      {pieces.map(item=>{
        const at=model.position(item.id),entry=items.find(entry=>entry.id===item.id)!;
        const disabled=entry.disabled===true;
        const medal=medalAt(item.id);
        const activate=()=>activatePiece(item.id);
        return <Pressable key={item.id} testID={`city-menu-access-${item.id}`} pointerEvents={complete?'none':'auto'} accessible accessibilityRole="button" accessibilityLabel={labels[item.id]} accessibilityHint={disabled?undefined:hint} accessibilityState={{disabled}} focusable={!disabled} onFocus={()=>setFocused(item.id)} onBlur={()=>setFocused(null)} onPress={activate} accessibilityActions={disabled?[]:[{name:'activate'}]} onAccessibilityTap={activate} onAccessibilityAction={event=>{if(event.nativeEvent.actionName==='activate')activate();}} style={[styles.piece,{left:at.x*scale,top:at.y*scale,width:Math.max(48,item.width*scale),height:Math.max(48,item.height*scale)}]}>
          {medal&&entry.icon&&<View testID={`city-menu-medal-${item.id}`} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.medal,{left:medal.x-MEDAL/2,top:medal.y-MEDAL/2,borderColor:disabled?OFF_RIM:focused===item.id?tokens.colorAccent:tokens.colorMedalRim,backgroundColor:disabled?OFF_PAPER:tokens.colorMedalPaper}]}>
            <View pointerEvents="none" style={[styles.medalInner,{borderColor:disabled?OFF_RIM:tokens.colorMedalRim}]}/>
            <CanonIcon glyph={entry.icon} label={labels[item.id]} color={disabled?OFF_INK:tokens.colorMedalInk} size={20}/>
          </View>}
        </Pressable>;
      })}
      {sceneLabels&&model.phase==='complete'&&nativeLayout.layers.map(item=><View key={item.id} testID={`city-menu-scene-${item.id}`} pointerEvents="none" accessible accessibilityRole="button" accessibilityLabel={sceneLabels[item.id]} onAccessibilityTap={()=>passivePress(item.id)} accessibilityActions={[{name:'activate'}]} onAccessibilityAction={event=>{if(event.nativeEvent.actionName==='activate')passivePress(item.id);}} style={{position:'absolute',left:(125+item.x)*scale,top:(320+item.y)*scale,width:item.width*scale,height:item.height*scale}}/>)}
    </View>
  </View>;
}

const styles=StyleSheet.create({
  host:{backgroundColor:tokens.colorPaper,overflow:'hidden'},
  piece:{position:'absolute'},
  medal:{position:'absolute',width:38,height:38,borderRadius:19,borderWidth:1.3,alignItems:'center',justifyContent:'center',shadowColor:'#4a341e',shadowOpacity:0.38,shadowRadius:1.5,shadowOffset:{width:0,height:1.5}},
  medalInner:{position:'absolute',width:31,height:31,borderRadius:15.5,borderWidth:0.7,opacity:0.45},
});
