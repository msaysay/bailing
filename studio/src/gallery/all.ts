// 全部组件目录，按文件名顺序合并（scripts/build_pack.py 用同样的顺序解析）。
import { CATALOG as BASE } from './catalog';
import { WEB } from './catalog-b-web';
import { SCREEN } from './catalog-c-screen';
export { SLOT, KLINE } from './catalog';
export type { Item } from './catalog';
export const CATALOG = [...BASE, ...WEB, ...SCREEN];
