// Visible, jointly selected reasons. Flags describe wording the player actually accepts.
// They are independent of prediction fit, not inferred from getting a scenario wrong.
const reason = (text, generalization = false) => ({ text, generalization });
export const CALIBRATION_REASONS = {
  M08: [
    reason("说明书还有两页，我猜他会先读完"),
    reason("他已经动手，我猜会边做边试"),
    reason("男人遇到装家具都会直接甩给别人", true),
    reason("我想到他也可能先找个教程"),
  ],
  M09: [
    reason("男人被异性夸肯定都当暧昧", true),
    reason("评论夸的是工作，我先猜他只是开心"),
    reason("我猜他习惯把同事互动告诉对象"),
    reason("公开评论里，我猜他会考虑怎么回复"),
  ],
  M12: [
    reason("男人公开关系都嫌麻烦", true),
    reason("我把不常发照片和私人生活边界联系起来"),
    reason("公开之后，我猜他会考虑别人怎么看"),
    reason("发照片习惯突然变了，我担心关系变化"),
  ],
  M13: [
    reason("男人肯定都不在乎收入差距", true),
    reason("我想到收入差距可能带来的角色压力"),
    reason("男人遇到这种差距都会立刻嫉妒", true),
    reason("我猜升职也可能让他更欣赏对方"),
  ],
  M20: [
    reason("我想到对方也可能更在意生活状态"),
    reason("男人最想要的肯定都是事业和收入", true),
    reason("我想到对方也可能更在意关系"),
    reason("我想到对方也可能更想有空休息"),
  ],
  F04: [
    reason("我先按对方说出来的话理解"),
    reason("语气和平时不同，我猜她会继续观察"),
    reason("女生对男生的情绪都不怎么在乎", true),
    reason("我猜她会先直接确认发生了什么"),
  ],
  F08: [
    reason("我猜她对公开平台互动不太敏感"),
    reason("公开而且频繁的互动，可能让人不舒服"),
    reason("女生遇到这种互动都会明显吃醋", true),
    reason("我猜她会先问这个人的身份"),
  ],
  F17: [
    reason("我猜她平时就不太注意头像"),
    reason("头像变化没解释，我猜她会继续观察"),
    reason("女生遇到换合照这种事都会直接分手", true),
    reason("我想到也许只是想换一种头像"),
  ],
  F19: [
    reason("女生肯定都先选事业有野心的", true),
    reason("长期投入可能比事业野心更合适"),
    reason("我觉得年龄和关系阶段会影响选择"),
    reason("我猜两种生活方式可能各有吸引力"),
  ],
  F20: [
    reason("我把公开表达与关注互动分开看"),
    reason("女人的心思就是都很矛盾", true),
    reason("我想到她也可能只是随手看朋友圈"),
    reason("我觉得这点信息还不足以判断投入"),
  ],
};
