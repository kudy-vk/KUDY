export const BASTION_CLIP_PATH: string;
export function insideBastions(x: number, y: number): boolean;
type Draw<T> = (tag: 'g' | 'line' | 'circle' | 'ellipse' | 'path', attrs: Record<string, string | number>, ...children: T[]) => T;
export function bearingMarks<T>(svg: Draw<T>, cx: number, cy: number, ratio: number): T[];
export function cosmosEngravings<T>(svg: Draw<T>, ratio: number): T;
export const ribbonFontSize: number;
export const ribbonPadding: number;
export const ribbonTail: number;
export function ribbonPaths(width: number, height: number, scale: number): Record<'tail' | 'fold' | 'body' | 'inner' | 'leftDot' | 'rightDot', string>;
export function atlasLight(elapsed: number, motion: { light: number; progress: number }, finished?: boolean): {
  glow: number; inner: number; outer: number; innerScale: number; outerScale: number; seam: number;
};
export const atlasColors: Record<'light' | 'dark', {
  paper: string; brass: string; fill: string; tail: string; rim: string; inner: string; ink: string;
  engrave: string; engraving: number; watermark: number;
}>;
