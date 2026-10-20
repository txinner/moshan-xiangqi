export const levels=[
  {id:'novice',name:'初识楚河',tag:'新手',easy:'novice',depth:1,desc:'轻松试招，慢慢找到赢棋的感觉。'},
  {id:'starter',name:'小试身手',tag:'入门',easy:'starter',depth:1,desc:'多一分思考，练习简单的攻守。'},
  {id:'beginner',name:'初入棋门',tag:'初级',depth:2,desc:'从容落子，熟悉方寸间的攻守。'},
  {id:'intermediate',name:'渐入佳境',tag:'进阶',depth:5,desc:'试探布局，寻找每一步的可能。'},
  {id:'advanced',name:'登堂入室',tag:'高手',depth:8,desc:'运筹帷幄，感受中盘交锋之趣。'},
  {id:'master',name:'炉火纯青',tag:'大师',depth:11,desc:'步步为营，与强手切磋棋艺。'},
  {id:'grandmaster',name:'一代宗师',tag:'宗师',depth:14,desc:'纵览全局，挑战你的棋力极限。'},
];
// Old saves used five numeric levels. Keep their original strength after inserting two.
export function resolveLevel(id,legacy){
  const index=levels.findIndex(level=>level.id===id);
  if(index>=0)return index;
  const old=Number(legacy);
  return legacy!==null&&legacy!==undefined&&legacy!==''&&Number.isInteger(old)&&old>=0&&old<5?old+2:0;
}
