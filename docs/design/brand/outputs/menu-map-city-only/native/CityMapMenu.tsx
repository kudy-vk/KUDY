import React,{memo,useCallback,useEffect,useId,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {AccessibilityInfo,AppState,PanResponder,Pressable,StyleSheet,useWindowDimensions,View} from 'react-native';
import type {GestureResponderEvent,StyleProp,ViewStyle} from 'react-native';
import Svg,{Defs,Ellipse,G,Image as SvgImage,Line,Mask,Path,RadialGradient,Rect,Stop} from 'react-native-svg';
import {amberPalette,lightThreads} from '../amber-light.mjs';
import {atlasColors,atlasLight} from '../atlas-art.mjs';
import manifest from '../manifest.json';
import {cityMenuAssets} from '../native-assets';
import {nativeLayout} from '../native-layout';
import {CityPuzzle} from './model';
import {AtlasBackdrop,AtlasBastions,AtlasRibbon,AtlasScenery} from './AtlasArtwork';
import type {AtlasPalette,RibbonSize} from './AtlasArtwork';
import {MapKeyboardTarget} from './MapKeyboardTarget';
import type {CityMenuLayout,MapAccessibilityAction,PieceId,Point,PuzzleEvent,RibbonHit,SceneId} from './model';
import {useThemeScheme} from '../../../../../../components/theme';
import {tokens} from '../../../../../../components/design-tokens';

export type {PieceId,SceneId} from './model';
export type CityMenuItem = {id:PieceId;disabled?:boolean};
export interface CityMapMenuProps {
  width: number;
  labels: Readonly<Record<PieceId,string>>;
  hint?: string;
  accessibilityLabels?: Readonly<Record<MapAccessibilityAction | 'joined',string>>;
  sceneLabels?: Readonly<Record<SceneId,string>>;
  items?: readonly CityMenuItem[];
  layout?: CityMenuLayout;
  onSelect: (id:PieceId)=>void;
  onRevealed?: ()=>void;
  reduceMotion?: boolean;
  style?: StyleProp<ViewStyle>;
}

const DIM_OPACITY = 0.55;
const LIT_MS = 700;
const STATIC_THREADS = lightThreads(0.5, 1);
const anchors = Object.fromEntries(manifest.pieces.map(piece=>[piece.id,{x:piece.anchor[0]-piece.x,y:piece.anchor[1]-piece.y}])) as Record<PieceId,Point>;
const piecePaths = Object.fromEntries(manifest.pieces.map(piece=>[piece.id,piece.path])) as Record<PieceId,string>;
const movementActions: readonly MapAccessibilityAction[] = ['moveLeft','moveRight','moveUp','moveDown','snap','cancel'];
const keyboardActions: Readonly<Partial<Record<string,MapAccessibilityAction>>> = {ArrowLeft:'moveLeft',ArrowRight:'moveRight',ArrowUp:'moveUp',ArrowDown:'moveDown',s:'snap',S:'snap',Escape:'cancel'};

// Keep each piece's base SVG local and memoized separately from the animated
// amber veil so holding/charging never re-rasterizes city bitmaps or rims.
const PieceBase = memo(function PieceBase({item,scale,complete,disabled,lit,palette,joined}:{
  item:typeof nativeLayout.pieces[number];scale:number;complete:boolean;disabled:boolean;lit:boolean;palette:AtlasPalette;joined:boolean;
}){
  const {id,width,height,padding}=item;
  const dimMaskId=`city-menu-dim-mask-${id}`;
  return <Svg width={(width+2*padding)*scale} height={(height+2*padding)*scale} viewBox={`${-padding} ${-padding} ${width+2*padding} ${height+2*padding}`}>
    {disabled&&<Defs><Mask id={dimMaskId} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}><SvgImage href={cityMenuAssets[id].light} width={width} height={height}/></Mask></Defs>}
    <G>
      {!complete&&<G fill="none" strokeLinejoin="round" strokeLinecap="round">
        <Path testID={`city-menu-outer-rim-${id}`} d={piecePaths[id]} stroke={palette.brass} strokeWidth={6.5/scale} strokeOpacity={joined?0.65:1}/>
        <Path testID={`city-menu-paper-rim-${id}`} d={piecePaths[id]} stroke={palette.paper} strokeWidth={3.4/scale} strokeOpacity={joined?0.35:1}/>
      </G>}
      <SvgImage href={cityMenuAssets[id].city} width={width} height={height}/>
      {!joined&&!complete&&<SvgImage href={cityMenuAssets[id].ui} x={-padding} y={-padding} width={width+2*padding} height={height+2*padding}/>}
      {disabled&&<Rect testID={`city-menu-dim-${id}`} x={0} y={0} width={width} height={height} fill={tokens.colorPaper} mask={`url(#${dimMaskId})`} opacity={lit?0:DIM_OPACITY}/>}
    </G>
  </Svg>;
});

// Static SVG path per piece; the parent native View animates opacity on the GPU
// without invalidating or re-allocating the SvgView software bitmap.
const PieceVeil = memo(function PieceVeil({item,scale}:{
  item:typeof nativeLayout.pieces[number];scale:number;
}){
  const {id,width,height,padding}=item;
  return <Svg style={StyleSheet.absoluteFill} width={(width+2*padding)*scale} height={(height+2*padding)*scale} viewBox={`${-padding} ${-padding} ${width+2*padding} ${height+2*padding}`}>
    <Path testID={`city-menu-veil-${id}`} d={piecePaths[id]} fill={amberPalette.veil}/>
  </Svg>;
});

const BackdropLayer = memo(function BackdropLayer({width,sceneHeight,scale,origin,backClip,vignette,maskId,palette,revealed}:{
  width:number;sceneHeight:number;scale:number;origin:Point;backClip:string;vignette:string;maskId:string;palette:AtlasPalette;revealed:boolean;
}){
  return <Svg width={width} height={width*sceneHeight/1600} viewBox={`0 0 1600 ${sceneHeight}`}>
    <Defs>
      <AtlasBastions clipId={backClip}/>
      <RadialGradient id={vignette} cx="50%" cy="50%" rx="52%" ry="52%">
        <Stop offset={0} stopColor="white"/><Stop offset={0.62} stopColor="white" stopOpacity={0.88}/>
        <Stop offset={0.86} stopColor="white" stopOpacity={0.32}/><Stop offset={1} stopColor="white" stopOpacity={0}/>
      </RadialGradient>
      <Mask id={maskId} maskUnits="userSpaceOnUse" x={-200} y={-200} width={2000} height={sceneHeight+400}>
        <Rect x={-200} y={-200} width={2000} height={sceneHeight+400} fill={`url(#${vignette})`}/>
      </Mask>
    </Defs>
    <AtlasBackdrop ratio={scale} origin={origin} maskId={maskId} clipId={backClip} palette={palette} revealed={revealed}/>
  </Svg>;
});

const AuraSvg = memo(function AuraSvg({width,sceneHeight,lightId,cy}:{
  width:number;sceneHeight:number;lightId:string;cy:number;
}){
  return <Svg style={StyleSheet.absoluteFill} width={width} height={width*sceneHeight/1600} viewBox={`0 0 1600 ${sceneHeight}`}>
    <Defs>
      <RadialGradient id={lightId}><Stop offset={0} stopColor="#fff6cf"/><Stop offset={0.28} stopColor="#ffca57" stopOpacity={0.95}/><Stop offset={0.62} stopColor={amberPalette.glow} stopOpacity={0.72}/><Stop offset={1} stopColor={amberPalette.edge} stopOpacity={0}/></RadialGradient>
    </Defs>
    <Ellipse cx={800} cy={cy} rx={940} ry={840} fill={`url(#${lightId})`}/>
  </Svg>;
});

const WaveSvg = memo(function WaveSvg({width,sceneHeight,cy,rx,ry,stroke,strokeWidth,dashed}:{
  width:number;sceneHeight:number;cy:number;rx:number;ry:number;stroke:string;strokeWidth:number;dashed?:boolean;
}){
  return <Svg style={StyleSheet.absoluteFill} width={width} height={width*sceneHeight/1600} viewBox={`0 0 1600 ${sceneHeight}`}>
    <Ellipse cx={800} cy={cy} rx={rx} ry={ry} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dashed?[28,18]:undefined}/>
  </Svg>;
});

const ThreadSvg = memo(function ThreadSvg({width,sceneHeight,sceneTransform,d,core}:{
  width:number;sceneHeight:number;sceneTransform:string;d:string;core:string;
}){
  return <Svg style={StyleSheet.absoluteFill} width={width} height={width*sceneHeight/1600} viewBox={`0 0 1600 ${sceneHeight}`}>
    <G transform={sceneTransform} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Path d={d} stroke={amberPalette.glow} strokeWidth={18} strokeOpacity={0.14}/>
      <Path d={d} stroke={amberPalette.edge} strokeWidth={7} strokeOpacity={0.45}/>
      <Path d={d} stroke={core} strokeWidth={2.5} strokeOpacity={0.95}/>
    </G>
  </Svg>;
});

const StaticScenerySvg = memo(function StaticScenerySvg({width,sceneHeight,frontClip,sceneTransform}:{
  width:number;sceneHeight:number;frontClip:string;sceneTransform:string;
}){
  return <Svg width={width} height={width*sceneHeight/1600} viewBox={`0 0 1600 ${sceneHeight}`}>
    <Defs><AtlasBastions clipId={frontClip}/></Defs>
    <G transform={sceneTransform}>
      <AtlasScenery clipId={frontClip} testID="city-menu-revealed-scenery"/>
    </G>
  </Svg>;
});

const SeamsLayer = memo(function SeamsLayer({width,sceneHeight,pieceKey}:{width:number;sceneHeight:number;pieceKey:string}){
  const ids=pieceKey.split(',') as PieceId[];
  return <Svg style={StyleSheet.absoluteFill} width={width} height={width*sceneHeight/1600} viewBox={`0 0 1600 ${sceneHeight}`}>
    <G testID="city-menu-seams" fill="none" strokeLinejoin="round" strokeLinecap="round">
      {ids.map(id=>{
        const piece=nativeLayout.pieces.find(item=>item.id===id)!;
        return <G key={id} transform={`translate(${125+piece.x} ${320+piece.y})`}>
          <Path d={piecePaths[id]} stroke="#ffae2b" strokeWidth={22} strokeOpacity={0.45}/>
          <Path d={piecePaths[id]} stroke="#fff2c2" strokeWidth={7}/>
        </G>;
      })}
    </G>
  </Svg>;
});

const SparksLayer = memo(function SparksLayer({width,sceneHeight,sceneTransform}:{
  width:number;sceneHeight:number;sceneTransform:string;
}){
  return <Svg style={StyleSheet.absoluteFill} width={width} height={width*sceneHeight/1600} viewBox={`0 0 1600 ${sceneHeight}`}>
    <G transform={sceneTransform} stroke="#ffcf5c" strokeWidth={7} strokeLinecap="round">
      {manifest.joints.flatMap(({port:[x,y]},index)=>Array.from({length:5},(_,ray)=>{
        const angle=ray*2*Math.PI/5;
        const dx=Math.cos(angle),dy=Math.sin(angle);
        return <Line key={`${index}-${ray}`} x1={x+dx*45} y1={y+dy*45} x2={x+dx*75} y2={y+dy*75}/>;
      }))}
    </G>
  </Svg>;
});

export function CityMapMenu(props:CityMapMenuProps) {
  const {width,labels,hint,sceneLabels,style,accessibilityLabels}=props;
  const items:readonly CityMenuItem[]=props.items??nativeLayout.pieces.map(p=>({id:p.id}));
  const pieceKey=items.map(item=>item.id).join(',');
  const layoutKey=JSON.stringify(props.layout);
  // Labels and destination state may change without moving the geometry.
  const model=useMemo(()=>new CityPuzzle(width,Math.random,pieceKey.split(',') as PieceId[],props.layout),[pieceKey,layoutKey]);
  const sceneHeight=props.layout?.height??1800;
  const pieces=items.map(item=>nativeLayout.pieces.find(piece=>piece.id===item.id)!);
  const palette=atlasColors[useThemeScheme()];
  const fontScale=Math.min(useWindowDimensions().fontScale||1,tokens.fontBigTextFactor);
  const svgId=useId();
  const [ribbonSizes,setRibbonSizes]=useState<Partial<Record<PieceId,RibbonSize>>>({});
  const ribbonHits=useRef(new Map<PieceId,RibbonHit>());
  const [focused,setFocused]=useState<PieceId|null>(null);
  const [litId,setLitId]=useState<PieceId|null>(null);
  const [,setRevision]=useState(0);
  const [systemReduced,setSystemReduced]=useState(true);
  const [screenReader,setScreenReader]=useState(false);
  const reduced=props.reduceMotion??systemReduced;
  const latest=useRef(props);latest.current=props;
  const reducedRef=useRef(reduced);reducedRef.current=reduced;
  const frame=useRef<number|null>(null);
  const dragFrame=useRef<number|null>(null);
  const dragTarget=useRef<Point|null>(null);
  const dragStart=useRef<{local:Point;page:Point}|null>(null);
  const hold=useRef<ReturnType<typeof setTimeout>|null>(null);
  const lit=useRef<ReturnType<typeof setTimeout>|null>(null);
  const feedback=useRef<{point:Point;until:number}|null>(null);
  const clock=useRef(Date.now());
  const refresh=useCallback(()=>setRevision(value=>value+1),[]);
  const clearHold=useCallback(()=>{if(hold.current!==null)clearTimeout(hold.current);hold.current=null;},[]);
  const clearLit=useCallback(()=>{if(lit.current!==null)clearTimeout(lit.current);lit.current=null;},[]);
  const stopFrame=useCallback(()=>{if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=null;},[]);
  const stopDrag=useCallback(()=>{if(dragFrame.current!==null)cancelAnimationFrame(dragFrame.current);dragFrame.current=null;dragTarget.current=null;dragStart.current=null;},[]);
  const cancel=useCallback(()=>{clearHold();stopDrag();model.cancel();refresh();},[clearHold,stopDrag,model,refresh]);
  const startFrame=useCallback(()=>{
    if(frame.current!==null)return;
    const tick=()=>{
      frame.current=null;clock.current=Date.now();
      if(reducedRef.current)model.completeNow();
      const moving=model.advance(clock.current);
      if(feedback.current&&feedback.current.until<=clock.current)feedback.current=null;
      refresh();
      if(moving||feedback.current||(!reducedRef.current&&model.active?.held&&model.grabProgress(clock.current)<1))frame.current=requestAnimationFrame(tick);
    };
    frame.current=requestAnimationFrame(tick);
  },[model,refresh]);
  const pulse=useCallback((point:Point)=>{
    feedback.current={point,until:Date.now()+(reducedRef.current?120:380)};
    startFrame();refresh();
  },[startFrame,refresh]);
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
  const handle=useCallback((event:PuzzleEvent)=>{
    if(event.kind==='select')activatePiece(event.id);
    else if(event.kind==='passive'||event.kind==='snap'){
      pulse(event.point);
      if(event.kind==='snap'&&event.complete){if(reducedRef.current)model.completeNow();else startFrame();}
    }
  },[activatePiece,model,pulse,startFrame]);

  const flushDrag=useCallback(()=>{
    const next=dragTarget.current;
    dragTarget.current=null;
    if(!model.active?.held||model.active.cancelled||!next)return;
    const result=model.move(next,Date.now(),!reducedRef.current);
    handle(result);refresh();
    if(result.kind==='snap'){clearHold();stopDrag();}
  },[model,handle,refresh,clearHold,stopDrag]);
  const queueDrag=useCallback((target:Point)=>{
    dragTarget.current=target;
    if(dragFrame.current!==null)return;
    dragFrame.current=requestAnimationFrame(()=>{
      dragFrame.current=null;
      flushDrag();
    });
  },[flushDrag]);

  useEffect(()=>{
    let active=true;
    AccessibilityInfo.isScreenReaderEnabled().then(value=>{if(active)setScreenReader(value);}).catch(error=>console.warn('Could not read screen reader state',error));
    const subscription=AccessibilityInfo.addEventListener('screenReaderChanged',setScreenReader);
    return()=>{active=false;subscription.remove();};
  },[]);
  useEffect(()=>{if(screenReader&&model.active)cancel();},[screenReader,model,cancel]);
  useLayoutEffect(()=>{stopFrame();stopDrag();clearHold();model.resize(width);if(model.phase!=='scattered'&&model.phase!=='complete')model.completeNow();feedback.current=null;refresh();},[width,model,refresh,clearHold,stopFrame,stopDrag]);
  useEffect(()=>{
    if(props.reduceMotion!==undefined)return;
    let active=true;
    AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(active)setSystemReduced(value);}).catch(error=>console.warn('Could not read Reduce Motion; using reduced motion',error));
    const listener=AccessibilityInfo.addEventListener('reduceMotionChanged',setSystemReduced);
    return()=>{active=false;listener.remove();};
  },[props.reduceMotion]);
  useEffect(()=>{
    if(reduced){stopFrame();feedback.current=null;model.stopInertia();model.completeNow();refresh();}
  },[reduced,model,stopFrame,refresh]);
  useEffect(()=>{
    const subscription=AppState.addEventListener('change',state=>{
      if(state!=='active'){clearHold();stopFrame();stopDrag();model.cancel();model.completeNow();feedback.current=null;refresh();}
    });
    return()=>{subscription.remove();clearHold();clearLit();stopFrame();stopDrag();model.cancel();feedback.current=null;};
  },[model,clearHold,clearLit,stopFrame,stopDrag,refresh]);

  const updateHold=useCallback((now:number)=>{
    const held=model.active?.held;
    model.hold(now);
    if(!held&&model.active?.held){
      clock.current=now;refresh();
      if(!reducedRef.current)startFrame();
    }
  },[model,refresh,startFrame]);

  const responder=useMemo(()=>{
    const point=(event:GestureResponderEvent)=>({x:event.nativeEvent.locationX*1600/width,y:event.nativeEvent.locationY*1600/width});
    return PanResponder.create({
      onStartShouldSetPanResponder:event=>!screenReader&&event.nativeEvent.touches.length===1&&Boolean(model.hit(point(event),ribbonHits.current)),
      onPanResponderGrant:event=>{
        clearHold();if(event.nativeEvent.touches.length!==1){cancel();return;}
        stopDrag();
        const local=point(event);
        dragStart.current={local,page:{x:event.nativeEvent.pageX,y:event.nativeEvent.pageY}};
        const hit=model.begin(local,Date.now(),ribbonHits.current);refresh();
        if(hit&&!hit.passive)hold.current=setTimeout(()=>{hold.current=null;updateHold(Date.now());},nativeLayout.gesture.holdMs);
      },
      onPanResponderStart:event=>{if(event.nativeEvent.touches.length!==1)cancel();},
      onPanResponderMove:event=>{
        if(screenReader||event.nativeEvent.touches.length!==1){cancel();return;}
        const start=dragStart.current;
        if(!start)return;
        // Page coordinates remain stable if the underlying view changes while dragging.
        const target={x:start.local.x+(event.nativeEvent.pageX-start.page.x)*1600/width,y:start.local.y+(event.nativeEvent.pageY-start.page.y)*1600/width};
        if(!Number.isFinite(target.x)||!Number.isFinite(target.y)){cancel();return;}
        const now=Date.now();
        updateHold(now);
        if(props.layout?.dragEnabled===true&&model.active?.held){queueDrag(target);return;}
        const result=model.move(target,now,!reducedRef.current);
        if(result.kind==='snap'){clearHold();stopDrag();}
        handle(result);refresh();
      },
      onPanResponderRelease:()=>{clearHold();flushDrag();stopDrag();const result=model.release(Date.now());refresh();handle(result);},
      onPanResponderTerminate:cancel,
      onPanResponderTerminationRequest:()=>true,
      onShouldBlockNativeResponder:()=>true,
    });
  },[width,model,cancel,clearHold,handle,refresh,screenReader,stopDrag,queueDrag,flushDrag,updateHold,props.layout?.dragEnabled]);

  const scale=width/1600,complete=model.phase!=='scattered',revealed=model.phase==='complete';
  useEffect(()=>{if(revealed)latest.current.onRevealed?.();},[revealed]);
  const ribbons=new Map(pieces.map(({id})=>{
    const at=model.position(id),size=ribbonSizes[id],anchor=anchors[id];
    const x=(at.x+anchor.x)*scale-(size?.width??0)/2;
    const y=(at.y+anchor.y)*scale-(size?.height??0)/2;
    return [id,{
      x:Math.max(0,Math.min(width-(size?.width??0),x)),
      y:Math.max(0,Math.min(width*sceneHeight/1600-(size?.height??0),y)),
      width:size?.width??0,height:size?.height??0,
    }];
  }));
  useLayoutEffect(()=>{
    ribbonHits.current=new Map([...ribbons].filter(([,area])=>area.width>0&&area.height>0).map(([id,{x,y,width,height}])=>[
      id,{x:x/scale,y:y/scale,width:width/scale,height:height/scale},
    ]));
  });
  const grab=(id:PieceId)=>model.active?.held&&model.active.group===model.pieces.get(id)?.group
    ? (reduced?1:model.grabProgress(clock.current)):0;
  const origin=useMemo(()=>({x:model.sceneOrigin.x,y:model.sceneOrigin.y}),[model]);
  const sceneTransform=`translate(${origin.x} ${origin.y})`;
  const pulseProgress=feedback.current?Math.max(0,Math.min(1,(feedback.current.until-clock.current)/380)):0;
  const passivePress=(id:SceneId)=>{const part=model.scenery.find(p=>p.id===id)!;pulse({x:origin.x+part.x+part.width/2,y:origin.y+part.y+part.height/2});};
  const light=atlasLight(model.effectElapsed,{light:model.light,progress:model.effectProgress},revealed);
  const threads=model.light>0&&!reduced?lightThreads(model.effectProgress,model.light):null;
  const lightId=`${svgId}-amber`,backClip=`${svgId}-back-wall`,frontClip=`${svgId}-front-wall`;
  const vignette=`${svgId}-vignette`,maskId=`${svgId}-paper-mask`;
  const firstGroup=pieces.length>0?model.pieces.get(pieces[0].id)?.group:undefined;
  const seamDx=(firstGroup?.dx??0)*scale,seamDy=(firstGroup?.dy??0)*scale;
  const canvasHeight=width*sceneHeight/1600;
  const revealCenterX=(origin.x+675)*scale,revealCenterY=(origin.y+582)*scale;
  const revealRadiusPx=(revealed?1050:model.radius)*scale;
  const revealLeft=revealCenterX-revealRadiusPx,revealTop=revealCenterY-revealRadiusPx;
  // The glow and waves scale about the reveal center, not the View midpoint:
  // the assembled artwork sits at cy=704 of the 1600×1600 production layout
  // while the canvas midpoint is y=800, so an unpinned scale would drift the
  // effects off the reveal circle (issue #517).
  const effectOrigin=`${revealCenterX}px ${revealCenterY}px`;
  const sparkProgress=!reduced&&light.seam>0&&!revealed&&model.effectElapsed>=0&&model.effectElapsed<650
    ? 1-model.effectElapsed/650:0;
  const rippleRadiusPx=feedback.current?(reduced?55:40+(1-pulseProgress)*140)*scale:0;
  return <View style={[styles.host,style,{width,height:canvasHeight}]}>
    <View testID="city-menu-canvas" collapsable={false} style={StyleSheet.absoluteFill} {...responder.panHandlers}>
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
        <BackdropLayer width={width} sceneHeight={sceneHeight} scale={scale} origin={origin} backClip={backClip} vignette={vignette} maskId={maskId} palette={palette} revealed={revealed}/>
        <View testID="city-menu-aura" pointerEvents="none" style={[StyleSheet.absoluteFill,{opacity:light.glow,transformOrigin:effectOrigin,transform:[{scale:0.45+light.glow*0.7}]}]}>
          <AuraSvg width={width} sceneHeight={sceneHeight} lightId={lightId} cy={origin.y+582}/>
        </View>
        <View testID="city-menu-inner-wave" pointerEvents="none" style={[StyleSheet.absoluteFill,{opacity:light.inner,transformOrigin:effectOrigin,transform:[{scale:light.innerScale}]}]}>
          <WaveSvg width={width} sceneHeight={sceneHeight} cy={origin.y+582} rx={610} ry={510} stroke="#ffcf66" strokeWidth={14}/>
        </View>
        <View testID="city-menu-outer-wave" pointerEvents="none" style={[StyleSheet.absoluteFill,{opacity:light.outer,transformOrigin:effectOrigin,transform:[{scale:light.outerScale}]}]}>
          <WaveSvg width={width} sceneHeight={sceneHeight} cy={origin.y+582} rx={740} ry={630} stroke="#e59a28" strokeWidth={8} dashed/>
        </View>
        <View testID="city-menu-light-threads" pointerEvents="none" style={StyleSheet.absoluteFill}>
          {STATIC_THREADS.map((base,i)=>{
            const active=threads?.[i];
            return <View key={i} pointerEvents="none" style={[StyleSheet.absoluteFill,{opacity:active?active.opacity:0,transform:[{translateX:(active?.x??0)*scale},{translateY:(active?.y??0)*scale}]}]}>
              <ThreadSvg width={width} sceneHeight={sceneHeight} sceneTransform={sceneTransform} d={base.d} core={base.core}/>
            </View>;
          })}
        </View>
        <View testID="city-menu-reveal-radius" pointerEvents="none" style={revealed?StyleSheet.absoluteFill:{
          position:'absolute',left:0,top:0,width:revealRadiusPx*2,height:revealRadiusPx*2,borderRadius:revealRadiusPx,
          overflow:'hidden',opacity:model.radius>0?1:0,transform:[{translateX:revealLeft},{translateY:revealTop}],
        }}>
          <View style={revealed?StyleSheet.absoluteFill:{width,height:canvasHeight,transform:[{translateX:-revealLeft},{translateY:-revealTop}]}}>
            <StaticScenerySvg width={width} sceneHeight={sceneHeight} frontClip={frontClip} sceneTransform={sceneTransform}/>
          </View>
        </View>
        {pieces.map(item=>{
          const at=model.position(item.id),entry=items.find(entry=>entry.id===item.id)!;
          const joined=(model.pieces.get(item.id)?.group.members.size??0)>1;
          const pressed=model.active?.hit.id===item.id&&!model.active?.held;
          const veil=Math.max(model.silhouette,0.38*grab(item.id));
          return <View key={item.id} testID={`city-menu-piece-${item.id}`} pointerEvents="none" style={[styles.piece,{left:0,top:0,opacity:pressed?0.86:1,transform:[{translateX:(at.x-item.padding)*scale},{translateY:(at.y-item.padding)*scale}]}]}>
            <PieceBase item={item} scale={scale} complete={complete} joined={joined} palette={palette} disabled={entry.disabled===true} lit={litId===item.id}/>
            <View testID={`city-menu-veil-layer-${item.id}`} pointerEvents="none" style={[StyleSheet.absoluteFill,{opacity:veil}]}>
              <PieceVeil item={item} scale={scale}/>
            </View>
          </View>;
        })}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill,{opacity:complete?Math.max(0.55,light.seam):0,transform:[{translateX:seamDx},{translateY:seamDy}]}]}>
          <SeamsLayer width={width} sceneHeight={sceneHeight} pieceKey={pieceKey}/>
        </View>
        <View testID={sparkProgress>0?'city-menu-joint-sparks':undefined} pointerEvents="none" style={[StyleSheet.absoluteFill,{opacity:sparkProgress,transform:[{scale:0.92+(1-sparkProgress)*0.16}]}]}>
          <SparksLayer width={width} sceneHeight={sceneHeight} sceneTransform={sceneTransform}/>
        </View>
        {feedback.current&&<View pointerEvents="none" style={{
          position:'absolute',left:0,top:0,width:rippleRadiusPx*2,height:rippleRadiusPx*2,borderRadius:rippleRadiusPx,
          borderWidth:6*scale,borderColor:'#bd852c',backgroundColor:'rgba(244,214,138,0.2)',opacity:pulseProgress,
          transform:[{translateX:feedback.current.point.x*scale-rippleRadiusPx},{translateY:feedback.current.point.y*scale-rippleRadiusPx}],
        }}/>}
        {pieces.map(({id})=>{
          const ribbon=ribbons.get(id)!;
          const held=model.active?.held&&model.active.group===model.pieces.get(id)?.group;
          return <AtlasRibbon key={id} id={id} label={labels[id]} size={ribbonSizes[id]} fontScale={fontScale}
            canvasWidth={width} palette={palette} highlight={held||focused===id?1:0}
            disabled={items.find(item=>item.id===id)?.disabled===true}
            position={{left:0,top:0,transform:[{translateX:ribbon.x},{translateY:ribbon.y}]}}
            onLayout={({nativeEvent:{layout:{width,height}}})=>setRibbonSizes(previous=>
              previous[id]?.width===width&&previous[id]?.height===height?previous:{...previous,[id]:{width,height}})}/>;
        })}
      </View>
      {pieces.map(item=>{
        const at=model.position(item.id),entry=items.find(entry=>entry.id===item.id)!;
        const disabled=entry.disabled===true;
        const activate=()=>activatePiece(item.id);
        const canMove = !complete && accessibilityLabels !== undefined;
        // Soon disables the destination, not the movable fragment. The host label
        // already carries the localized Soon note; keep its movement actions reachable.
        const actions = [...(disabled ? [] : [{name:'activate'}]), ...(canMove && accessibilityLabels ? movementActions.map(name=>({name,label:accessibilityLabels[name]})) : [])];
        const joined = (model.pieces.get(item.id)?.group.members.size ?? 0) > 1;
        const performMovement = (action:MapAccessibilityAction) => {
          clearHold();
          const result=model.accessibilityAction(item.id,action,Date.now());
          handle(result);refresh();
          if(result.kind==='snap'&&accessibilityLabels)AccessibilityInfo.announceForAccessibility(accessibilityLabels.joined);
        };
        const onAction = (name:string) => {
          if(name==='activate'){activate();return;}
          if(!canMove)return;
          const action=movementActions.find(candidate=>candidate===name);
          if(action)performMovement(action);
        };
        const keyboardMove=(key:string)=>{
          if(complete||(disabled&&!canMove))return false;
          const action=Object.hasOwn(keyboardActions,key)?keyboardActions[key]:undefined;
          if(!action)return false;
          performMovement(action);return true;
        };
        const targetStyle={left:at.x*scale,top:at.y*scale,width:Math.max(48,item.width*scale),height:Math.max(48,item.height*scale)};
        const blur=()=>setFocused(value=>value===item.id?null:value);
        return <MapKeyboardTarget key={item.id} id={item.id} enabled={!complete&&(!disabled||canMove)&&!screenReader} style={[styles.piece,targetStyle]} onKey={keyboardMove} onFocusChange={value=>value?setFocused(item.id):blur()}>
        <Pressable testID={`city-menu-access-${item.id}`} pointerEvents={complete||(!screenReader&&props.layout?.dragEnabled===true)?'none':'auto'} accessible accessibilityRole="button" accessibilityLabel={labels[item.id]} accessibilityHint={disabled?undefined:hint} accessibilityState={{disabled:disabled&&!canMove}} focusable={!disabled||canMove} onFocus={()=>setFocused(item.id)} onBlur={blur} onPress={activate} onKeyDown={event=>{
          const {key,altKey,ctrlKey,metaKey,shiftKey,isComposing}=event.nativeEvent;
          if(complete||(disabled&&!canMove)||altKey||ctrlKey||metaKey||isComposing||(shiftKey&&key!=='S'))return;
          if(keyboardMove(key)){event.preventDefault();event.stopPropagation();}
        }} accessibilityValue={joined&&accessibilityLabels?{text:accessibilityLabels.joined}:undefined} accessibilityActions={actions} onAccessibilityTap={activate} onAccessibilityAction={event=>onAction(event.nativeEvent.actionName)} style={[styles.piece,targetStyle]}>
        </Pressable></MapKeyboardTarget>;
      })}
      {sceneLabels&&model.phase==='complete'&&nativeLayout.layers.map(item=><View key={item.id} testID={`city-menu-scene-${item.id}`} pointerEvents="none" accessible accessibilityRole="button" accessibilityLabel={sceneLabels[item.id]} onAccessibilityTap={()=>passivePress(item.id)} accessibilityActions={[{name:'activate'}]} onAccessibilityAction={event=>{if(event.nativeEvent.actionName==='activate')passivePress(item.id);}} style={{position:'absolute',left:(origin.x+item.x)*scale,top:(origin.y+item.y)*scale,width:item.width*scale,height:item.height*scale}}/>)}
    </View>
  </View>;
}

const styles=StyleSheet.create({
  host:{overflow:'hidden'},
  piece:{position:'absolute'},
});
