// Full imagegen manga boards: panels and cross-frame overlaps are baked into the art.
const BOARDS=['messages','city','messages','plans','messages','city','home','messages','home','home','cafe','plans','plans','gift','messages','home','messages','home','home','home','plans','plans','home','plans','plans','cafe','gift','city','home','metro'];
export function artworkFor(q){return `assets/manga-${BOARDS[q.id-1]}-v7.webp`;}
export function sceneIllustration(q){return `<div class="comic-art manga-art"><img src="${artworkFor(q)}" width="1536" height="1024" decoding="async" alt="都市生活的日系漫画分镜"><span class="comic-place">${q.place}</span></div>`;}
export function coverIllustration(){return '<img src="assets/manga-cover-v7.webp" width="1536" height="1024" fetchpriority="high" decoding="async" alt="日系漫画角色在咖啡店，手机与手跨越分格">';}
