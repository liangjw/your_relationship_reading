export function sceneArt(q) {
  if (!/^[MF](0[1-9]|1\d|20)$/.test(q.id)) throw new Error('Unknown scene artwork');
  return {id:q.id,src:`/assets/scenes/${q.id}.webp`,alt:q.context.split(/[。？]/)[0]+' · 生活漫画'};
}
