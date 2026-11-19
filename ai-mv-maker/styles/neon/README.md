# 霓虹城市

三个工厂函数，传参数就能用，换歌不用改时间：
```js
const s1 = neonStreet({ signs: ['未眠', '24H', '旧梦', '夜'], col: '#ff4fd8', col2: '#38e8ff', col3: '#ffd34f' }); // 雨夜霓虹街道，打伞的人走过；歌词 ly 330–420
const s2 = synthRoad({ sun: ['#ffe46b', '#ff4f9a'], grid: '#ff4fd8' });   // 复古条纹落日 + 网格公路 + 车尾灯；网格随响度加速
const s3 = rainWindow({ warm: true });                                     // 雨窗：窗外城市光斑，窗前背影；适合配 lyric: 'vertical'
```
