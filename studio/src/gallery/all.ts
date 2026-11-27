// 全部组件目录，按文件名顺序合并（scripts/build_pack.py 用同样的顺序解析）。
import { CATALOG as BASE } from './catalog';
import { WEB } from './catalog-b-web';
import { SCREEN } from './catalog-c-screen';
import { MEDIA } from './catalog-d-media';
import { CHARTS } from './catalog-e-charts';
import { TYPE } from './catalog-f-type';
import { FLOW } from './catalog-g-flow';
import { TALK } from './catalog-h-talk';
import { FX } from './catalog-i-fx';
import { EFFECTS } from './catalog-j-effects';
import { BCAST } from './catalog-k-bc';
import { SERIES } from './catalog-l-series';
import { TFX_TYPE } from './catalog-m-tfx-type';
import { TFX_MEDIA } from './catalog-n-tfx-media';
import { X2026 } from './catalog-o-x2026';
export { SLOT, KLINE } from './catalog';
export type { Item } from './catalog';
export const CATALOG = [...BASE, ...WEB, ...SCREEN, ...MEDIA, ...CHARTS, ...TYPE, ...FLOW, ...TALK, ...FX, ...EFFECTS, ...BCAST, ...SERIES, ...TFX_TYPE, ...TFX_MEDIA, ...X2026];
