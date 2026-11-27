import React,{memo} from 'react';
import {StyleSheet,View} from 'react-native';
import type {LayoutChangeEvent,ViewStyle} from 'react-native';
import Svg,{Circle,ClipPath,Ellipse,G,Image as SvgImage,Line,Path} from 'react-native-svg';
import {atlasColors,BASTION_CLIP_PATH,bearingMarks,cosmosEngravings,ribbonFontSize,ribbonPadding,ribbonPaths,ribbonTail} from '../atlas-art.mjs';
import {citySceneAssets} from '../native-assets';
import {nativeLayout} from '../native-layout';
import {ScaledText} from '../../../../../../components/scaled-text';
import {tokens} from '../../../../../../components/design-tokens';

export type AtlasPalette = typeof atlasColors.light;
export type RibbonSize = {width:number;height:number};

export function AtlasRibbon({id,label,size,fontScale,canvasWidth,palette,highlight,disabled,position,onLayout}:{
  id:string;label:string;size?:RibbonSize;fontScale:number;canvasWidth:number;palette:AtlasPalette;
  highlight:number;disabled:boolean;position:ViewStyle;onLayout:(event:LayoutChangeEvent)=>void;
}) {
  const wing=(ribbonTail+1)*fontScale;
  const path=size&&ribbonPaths(Math.max(1,size.width-2*wing),Math.max(1,size.height-8*fontScale),fontScale);
  const rim=highlight>0?'#bd852c':palette.rim;
  return <View testID={`city-menu-ribbon-${id}`} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    onLayout={onLayout}
    style={[styles.ribbon,position,{
      maxWidth:canvasWidth,minWidth:Math.min(canvasWidth,53*fontScale),
      minHeight:30*fontScale,paddingHorizontal:Math.min(canvasWidth/4,wing+ribbonPadding*fontScale/2),
      paddingVertical:4*fontScale,opacity:disabled?0.75:1,
    }]}>
    {path&&size&&<Svg style={StyleSheet.absoluteFill} width={size.width} height={size.height}
      viewBox={`${-size.width/2} ${-size.height/2} ${size.width} ${size.height}`}>
      <Path d={path.tail} fill={palette.tail} stroke={rim} strokeWidth={1.25} strokeLinejoin="round"/>
      <Path d={path.fold} fill={rim} opacity={0.52}/>
      <Path testID={`city-menu-ribbon-body-${id}`} d={path.body} fill={palette.fill} stroke={rim}
        strokeWidth={1.45+1.7*highlight} strokeLinejoin="round"/>
      <Path d={path.inner} fill="none" stroke={palette.inner} strokeWidth={0.75}/>
      <Path d={path.leftDot} fill={rim}/><Path d={path.rightDot} fill={rim}/>
    </Svg>}
    <ScaledText style={[styles.label,{color:palette.ink}]}>{label}</ScaledText>
  </View>;
}

export const AtlasBastions = memo(function AtlasBastions({clipId}:{clipId:string}) {
  return <ClipPath id={clipId}><Path d={BASTION_CLIP_PATH}/></ClipPath>;
});

export const AtlasScenery = memo(function AtlasScenery({clipId,testID}:{clipId:string;testID:string}) {
  return <G testID={testID} clipPath={`url(#${clipId})`}>
    {nativeLayout.layers.map(({id,x,y,width,height})=><SvgImage key={id} href={citySceneAssets[id]} x={x} y={y} width={width} height={height}/>)}
  </G>;
});

const elements = {g:G,circle:Circle,ellipse:Ellipse,line:Line,path:Path};
function drawMark(tag:keyof typeof elements,attrs:Record<string,string|number>,...children:React.ReactElement[]):React.ReactElement {
  const props=Object.fromEntries(Object.entries(attrs).map(([key,value])=>[
    key.replace(/-([a-z])/g,(_,letter:string)=>letter.toUpperCase()),value,
  ]));
  return React.createElement(elements[tag] as React.ComponentType,props,...children);
}

export const AtlasBackdrop = memo(function AtlasBackdrop({ratio,origin,maskId,clipId,palette,revealed}:{
  ratio:number;origin:{x:number;y:number};maskId:string;clipId:string;palette:AtlasPalette;revealed:boolean;
}) {
  return <G mask={`url(#${maskId})`} pointerEvents="none">
    <G testID="city-menu-cosmos" stroke={palette.engrave} fill="none" opacity={palette.engraving*(revealed?1.25:1)}>
      {bearingMarks(drawMark,origin.x+675,origin.y+582,ratio).map((mark,index)=>React.cloneElement(mark,{key:index}))}
      <G transform={`translate(${origin.x} ${origin.y})`}>{cosmosEngravings(drawMark,ratio)}</G>
    </G>
    {!revealed&&<G opacity={palette.watermark} transform={`translate(${origin.x} ${origin.y})`}>
      <AtlasScenery clipId={clipId} testID="city-menu-watermark"/>
    </G>}
  </G>;
});

const styles=StyleSheet.create({
  ribbon:{position:'absolute',alignItems:'center',justifyContent:'center'},
  label:{fontFamily:tokens.fontFamilyDisplay,fontSize:ribbonFontSize,lineHeight:18,includeFontPadding:false,letterSpacing:0.195,textAlign:'center'},
});
