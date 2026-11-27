import React,{memo,useCallback,useEffect,useId,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {AccessibilityInfo,AppState,PanResponder,Pressable,StyleSheet,useWindowDimensions,View} from 'react-native';
import type {GestureResponderEvent,StyleProp,ViewStyle} from 'react-native';
import Svg,{Circle,ClipPath,Defs,Ellipse,G,Image as SvgImage,Line,Mask,Path,RadialGradient,Rect,Stop} from 'react-native-svg';
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
const anchors = Object.fromEntries(manifest.pieces.map(piece=>[piece.id,{x:piece.anchor[0]-piece.x,y:piece.anchor[1]-piece.y}])) as Record<PieceId,Point>;
const piecePaths = Object.fromEntries(manifest.pieces.map(piece=>[piece.id,piece.path])) as Record<PieceId,string>;
const movementActions: readonly MapAccessibilityAction[] = ['moveLeft','moveRight','moveUp','moveDown','snap','cancel'];
const keyboardActions: Readonly<Partial<Record<string,MapAccessibilityAction>>> = {ArrowLeft:'moveLeft',ArrowRight:'moveRight',ArrowUp:'moveUp',ArrowDown:'moveDown',s:'snap',S:'snap',Escape:'cancel'};

// Keep each piece's SVG local and memoized: translating a native View does
// not invalidate the other pieces' masks and full-canvas SVG on every drag frame.
const PieceArtwork = memo(function PieceArtwork({item,scale,complete,pressed,disabled,lit,veil,palette,joined}:{
  item:typeof nativeLayout.pieces[number];scale:number;complete:boolean;pressed:boolean;disabled:boolean;lit:boolean;veil:number;palette:AtlasPalette;joined:boolean;
}){
  const {id,width,height,padding}=item;
  const maskId=`city-menu-veil-${id}`;
  return <Svg width={(width+2*padding)*scale} height={(height+2*padding)*scale} viewBox={`${-padding} ${-padding} ${width+2*padding} ${height+2*padding}`}>
    <Defs><Mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}><SvgImage href={cityMenuAssets[id].light} width={width} height={height}/></Mask></Defs>
    <G opacity={pressed?0.86:1}>
      {!complete&&<G fill="none" strokeLinejoin="round" strokeLinecap="round">
        <Path testID={`city-menu-outer-rim-${id}`} d={piecePaths[id]} stroke={palette.brass} strokeWidth={6.5/scale} opacity={joined?0.65:1}/>
        <Path testID={`city-menu-paper-rim-${id}`} d={piecePaths[id]} stroke={palette.paper} strokeWidth={3.4/scale} opacity={joined?0.35:1}/>
      </G>}
      <SvgImage href={cityMenuAssets[id].city} width={width} height={height}/>
      {!joined&&!complete&&<SvgImage href={cityMenuAssets[id].ui} x={-padding} y={-padding} width={width+2*padding} height={height+2*padding}/>}
      <Rect testID={maskId} x={0} y={0} width={width} height={height} fill={amberPalette.veil} mask={`url(#${maskId})`} opacity={veil}/>
      {disabled&&<Rect testID={`city-menu-dim-${id}`} x={0} y={0} width={width} height={height} fill={tokens.colorPaper} mask={`url(#${maskId})`} opacity={lit?0:DIM_OPACITY}/>}
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
  const backgroundOrigin=useMemo(()=>({x:125,y:(sceneHeight-1164)/2}),[sceneHeight]);
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
  const origin=model.sceneOrigin;
  const sceneTransform=`translate(${origin.x} ${origin.y})`;
  const pulseProgress=feedback.current?Math.max(0,Math.min(1,(feedback.current.until-clock.current)/380)):0;
  const passivePress=(id:SceneId)=>{const part=model.scenery.find(p=>p.id===id)!;pulse({x:origin.x+part.x+part.width/2,y:origin.y+part.y+part.height/2});};
  const light=atlasLight(model.effectElapsed,{light:model.light,progress:model.effectProgress},revealed);
  const lightId=`${svgId}-amber`,backClip=`${svgId}-back-wall`,frontClip=`${svgId}-front-wall`;
  const vignette=`${svgId}-vignette`,maskId=`${svgId}-paper-mask`,revealId=`${svgId}-reveal`;
  return <View style={[styles.host,style,{width,height:width*sceneHeight/1600}]}>
    <View testID="city-menu-canvas" collapsable={false} style={StyleSheet.absoluteFill} {...responder.panHandlers}>
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
        <Svg width={width} height={width*sceneHeight/1600} viewBox={`0 0 1600 ${sceneHeight}`}>
          <Defs>
            <AtlasBastions clipId={backClip}/>
            <RadialGradient id={vignette} cx="50%" cy="50%" rx="52%" ry="52%">
              <Stop offset={0} stopColor="white"/><Stop offset={0.62} stopColor="white" stopOpacity={0.88}/>
              <Stop offset={0.86} stopColor="white" stopOpacity={0.32}/><Stop offset={1} stopColor="white" stopOpacity={0}/>
            </RadialGradient>
            <Mask id={maskId} maskUnits="userSpaceOnUse" x={-200} y={-200} width={2000} height={sceneHeight+400}>
              <Rect x={-200} y={-200} width={2000} height={sceneHeight+400} fill={`url(#${vignette})`}/>
            </Mask>
            <RadialGradient id={lightId}><Stop offset={0} stopColor="#fff6cf"/><Stop offset={0.28} stopColor="#ffca57" stopOpacity={0.95}/><Stop offset={0.62} stopColor={amberPalette.glow} stopOpacity={0.72}/><Stop offset={1} stopColor={amberPalette.edge} stopOpacity={0}/></RadialGradient>
          </Defs>
          <AtlasBackdrop ratio={scale} origin={backgroundOrigin} maskId={maskId} clipId={backClip} palette={palette} revealed={revealed}/>
          <G testID="city-menu-aura" opacity={light.glow}>
            <Ellipse cx={800} cy={origin.y+582} rx={940*(0.45+light.glow*0.7)} ry={840*(0.45+light.glow*0.7)} fill={`url(#${lightId})`}/>
          </G>
          <G fill="none">
            <Ellipse testID="city-menu-inner-wave" cx={800} cy={origin.y+582} rx={610*light.innerScale} ry={510*light.innerScale} stroke="#ffcf66" strokeWidth={14} opacity={light.inner}/>
            <Ellipse testID="city-menu-outer-wave" cx={800} cy={origin.y+582} rx={740*light.outerScale} ry={630*light.outerScale} stroke="#e59a28" strokeWidth={8} strokeDasharray={[28,18]} opacity={light.outer}/>
          </G>
          <G testID="city-menu-light-threads" pointerEvents="none" transform={sceneTransform} opacity={reduced?0:1}>
            {(model.light>0?lightThreads(model.effectProgress,model.light):[]).map((thread,i)=><G key={i} transform={`translate(${thread.x} ${thread.y})`} opacity={thread.opacity}>
              <Path d={thread.d} fill="none" stroke={amberPalette.glow} strokeWidth={18} strokeOpacity={0.1} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={[1700,1500]} strokeDashoffset={thread.offset}/>
              <Path d={thread.d} fill="none" stroke={amberPalette.edge} strokeWidth={7} strokeOpacity={0.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={[1700,1500]} strokeDashoffset={thread.offset}/>
              <Path d={thread.d} fill="none" stroke={thread.core} strokeWidth={thread.width} strokeOpacity={0.95} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={[1700,1500]} strokeDashoffset={thread.offset}/>
            </G>)}
          </G>
        </Svg>
        {pieces.map(item=>{
          const at=model.position(item.id),entry=items.find(entry=>entry.id===item.id)!;
          const joined=(model.pieces.get(item.id)?.group.members.size??0)>1;
          return <View key={item.id} testID={`city-menu-piece-${item.id}`} pointerEvents="none" style={[styles.piece,{left:0,top:0,transform:[{translateX:(at.x-item.padding)*scale},{translateY:(at.y-item.padding)*scale}]}]}>
            <PieceArtwork item={item} scale={scale} complete={complete} joined={joined} palette={palette} pressed={model.active?.hit.id===item.id&&!model.active?.held} disabled={entry.disabled===true} lit={litId===item.id} veil={Math.max(model.silhouette,0.38*grab(item.id))}/>
          </View>;
        })}
        <Svg style={StyleSheet.absoluteFill} width={width} height={width*sceneHeight/1600} viewBox={`0 0 1600 ${sceneHeight}`}>
          <Defs>
            <AtlasBastions clipId={frontClip}/>
            <ClipPath id={revealId}><Circle cx="675" cy="582" r={model.radius}/></ClipPath>
          </Defs>
          {model.radius>0&&<G transform={sceneTransform} clipPath={`url(#${revealId})`}>
            <AtlasScenery clipId={frontClip} testID="city-menu-revealed-scenery"/>
          </G>}
          {complete&&<G testID="city-menu-seams" fill="none" strokeLinejoin="round" strokeLinecap="round">
            {pieces.map(({id})=>{
              const at=model.position(id);
              return <G key={id} transform={`translate(${at.x} ${at.y})`}>
                <Path d={piecePaths[id]} stroke="#ffae2b" strokeWidth={22} opacity={light.seam*0.6}/>
                <Path d={piecePaths[id]} stroke={light.seam>0.5?'#fff7d6':'#f3bc52'} strokeWidth={7}
                  opacity={Math.max(0.55,light.seam)}/>
              </G>;
            })}
          </G>}
          {!reduced&&light.seam>0&&!revealed&&model.effectElapsed<650&&
            <G testID="city-menu-joint-sparks" transform={sceneTransform} stroke="#ffcf5c" strokeWidth={7} strokeLinecap="round"
              opacity={Math.max(0,1-model.effectElapsed/650)}>
              {manifest.joints.flatMap(({port:[x,y]},index)=>Array.from({length:5},(_,ray)=>{
                const angle=ray*2*Math.PI/5,dist=50+model.effectElapsed/12;
                const dx=Math.cos(angle),dy=Math.sin(angle);
                return <Line key={`${index}-${ray}`} x1={x+dx*(dist-20)} y1={y+dy*(dist-20)} x2={x+dx*dist} y2={y+dy*dist}/>;
              }))}
            </G>}
          {feedback.current&&<Circle cx={feedback.current.point.x} cy={feedback.current.point.y} r={reduced?55:40+(1-pulseProgress)*140} stroke="#bd852c" strokeWidth={6} fill="#f4d68a" fillOpacity={.2} opacity={pulseProgress}/>}
        </Svg>
        {pieces.map(({id})=>{
          const ribbon=ribbons.get(id)!;
          return <AtlasRibbon key={id} id={id} label={labels[id]} size={ribbonSizes[id]} fontScale={fontScale}
            canvasWidth={width} palette={palette} highlight={Math.max(grab(id),focused===id?1:0)}
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
