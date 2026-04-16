export interface CategoryItem {
  text: string;
  emoji: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  items: CategoryItem[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'animals',
    name: '动物',
    emoji: '🐾',
    items: [
      { text: '狗', emoji: '🐶' }, { text: '猫', emoji: '🐱' }, { text: '大象', emoji: '🐘' },
      { text: '狮子', emoji: '🦁' }, { text: '老虎', emoji: '🐯' }, { text: '熊猫', emoji: '🐼' },
      { text: '兔子', emoji: '🐰' }, { text: '狐狸', emoji: '🦊' }, { text: '熊', emoji: '🐻' },
      { text: '猴子', emoji: '🐒' }, { text: '斑马', emoji: '🦓' }, { text: '长颈鹿', emoji: '🦒' },
      { text: '鳄鱼', emoji: '🐊' }, { text: '乌龟', emoji: '🐢' }, { text: '青蛙', emoji: '🐸' },
      { text: '企鹅', emoji: '🐧' }, { text: '猫头鹰', emoji: '🦉' }, { text: '鹦鹉', emoji: '🦜' },
      { text: '鲸鱼', emoji: '🐳' }, { text: '海豚', emoji: '🐬' }, { text: '章鱼', emoji: '🐙' },
      { text: '蜜蜂', emoji: '🐝' }, { text: '蝴蝶', emoji: '🦋' }, { text: '独角兽', emoji: '🦄' },
      { text: '龙', emoji: '🐉' }, { text: '河马', emoji: '🦛' }, { text: '犀牛', emoji: '🦏' },
      { text: '骆驼', emoji: '🐪' }, { text: '羊驼', emoji: '🦙' }, { text: '鸵鸟', emoji: '🦅' },
    ],
  },
  {
    id: 'food',
    name: '美食',
    emoji: '🍽️',
    items: [
      { text: '比萨', emoji: '🍕' }, { text: '汉堡', emoji: '🍔' }, { text: '寿司', emoji: '🍣' },
      { text: '拉面', emoji: '🍜' }, { text: '火锅', emoji: '🫕' }, { text: '饺子', emoji: '🥟' },
      { text: '包子', emoji: '🥐' }, { text: '炒饭', emoji: '🍚' }, { text: '牛排', emoji: '🥩' },
      { text: '薯条', emoji: '🍟' }, { text: '冰淇淋', emoji: '🍦' }, { text: '蛋糕', emoji: '🎂' },
      { text: '巧克力', emoji: '🍫' }, { text: '糖果', emoji: '🍬' }, { text: '爆米花', emoji: '🍿' },
      { text: '咖啡', emoji: '☕' }, { text: '奶茶', emoji: '🧋' }, { text: '啤酒', emoji: '🍺' },
      { text: '西瓜', emoji: '🍉' }, { text: '草莓', emoji: '🍓' }, { text: '葡萄', emoji: '🍇' },
      { text: '芒果', emoji: '🥭' }, { text: '椰子', emoji: '🥥' }, { text: '牛油果', emoji: '🥑' },
      { text: '玉米', emoji: '🌽' }, { text: '辣椒', emoji: '🌶️' }, { text: '南瓜', emoji: '🎃' },
      { text: '三明治', emoji: '🥪' }, { text: '热狗', emoji: '🌭' }, { text: '炸鸡', emoji: '🍗' },
    ],
  },
  {
    id: 'movies',
    name: '影视',
    emoji: '🎬',
    items: [
      { text: '哈利·波特', emoji: '⚡' }, { text: '星球大战', emoji: '⚔️' }, { text: '复仇者联盟', emoji: '🦸' },
      { text: '泰坦尼克号', emoji: '🚢' }, { text: '侏罗纪公园', emoji: '🦕' }, { text: '功夫熊猫', emoji: '🐼' },
      { text: '冰雪奇缘', emoji: '❄️' }, { text: '狮子王', emoji: '👑' }, { text: '变形金刚', emoji: '🤖' },
      { text: '蜘蛛侠', emoji: '🕷️' }, { text: '钢铁侠', emoji: '🦾' }, { text: '美国队长', emoji: '🛡️' },
      { text: '黑豹', emoji: '🐆' }, { text: '神奇动物', emoji: '🧙' }, { text: '疯狂动物城', emoji: '🦊' },
      { text: '寻梦环游记', emoji: '🎸' }, { text: '头脑特工队', emoji: '🧠' }, { text: '海底总动员', emoji: '🐠' },
      { text: '玩具总动员', emoji: '🤠' }, { text: '机器人总动员', emoji: '🤖' }, { text: '无敌破坏王', emoji: '👾' },
      { text: '加勒比海盗', emoji: '🏴‍☠️' }, { text: '指环王', emoji: '💍' }, { text: '霍比特人', emoji: '🧝' },
      { text: '速度与激情', emoji: '🏎️' }, { text: '谍影重重', emoji: '🕵️' }, { text: '007', emoji: '🔫' },
      { text: '终结者', emoji: '🤖' }, { text: '异形', emoji: '👽' }, { text: '阿凡达', emoji: '💙' },
    ],
  },
  {
    id: 'celebrities',
    name: '名人',
    emoji: '⭐',
    items: [
      { text: '爱因斯坦', emoji: '🧑‍🔬' }, { text: '达芬奇', emoji: '🎨' }, { text: '莎士比亚', emoji: '📝' },
      { text: '牛顿', emoji: '🍎' }, { text: '贝多芬', emoji: '🎹' }, { text: '拿破仑', emoji: '👑' },
      { text: '林肯', emoji: '🎩' }, { text: '甘地', emoji: '🕊️' }, { text: '曼德拉', emoji: '✊' },
      { text: '特蕾莎修女', emoji: '🙏' }, { text: '牛顿', emoji: '🍎' }, { text: '达尔文', emoji: '🐢' },
      { text: '居里夫人', emoji: '⚗️' }, { text: '乔布斯', emoji: '💻' }, { text: '比尔盖茨', emoji: '💰' },
      { text: '马云', emoji: '🛒' }, { text: '成龙', emoji: '🥊' }, { text: '李小龙', emoji: '🦅' },
      { text: '邓丽君', emoji: '🎵' }, { text: '周杰伦', emoji: '🎤' }, { text: '刘德华', emoji: '🌟' },
      { text: '科比·布莱恩特', emoji: '🏀' }, { text: '梅西', emoji: '⚽' }, { text: '费德勒', emoji: '🎾' },
      { text: '迈克尔·乔丹', emoji: '🏀' }, { text: '刘翔', emoji: '🏃' }, { text: '姚明', emoji: '🏀' },
      { text: '邓小平', emoji: '🇨🇳' }, { text: '孔子', emoji: '📚' }, { text: '老子', emoji: '☯️' },
    ],
  },
  {
    id: 'countries',
    name: '国家',
    emoji: '🌍',
    items: [
      { text: '中国', emoji: '🇨🇳' }, { text: '美国', emoji: '🇺🇸' }, { text: '日本', emoji: '🇯🇵' },
      { text: '英国', emoji: '🇬🇧' }, { text: '法国', emoji: '🇫🇷' }, { text: '德国', emoji: '🇩🇪' },
      { text: '意大利', emoji: '🇮🇹' }, { text: '西班牙', emoji: '🇪🇸' }, { text: '俄罗斯', emoji: '🇷🇺' },
      { text: '加拿大', emoji: '🇨🇦' }, { text: '澳大利亚', emoji: '🇦🇺' }, { text: '巴西', emoji: '🇧🇷' },
      { text: '印度', emoji: '🇮🇳' }, { text: '韩国', emoji: '🇰🇷' }, { text: '墨西哥', emoji: '🇲🇽' },
      { text: '阿根廷', emoji: '🇦🇷' }, { text: '南非', emoji: '🇿🇦' }, { text: '埃及', emoji: '🇪🇬' },
      { text: '泰国', emoji: '🇹🇭' }, { text: '越南', emoji: '🇻🇳' }, { text: '新加坡', emoji: '🇸🇬' },
      { text: '瑞典', emoji: '🇸🇪' }, { text: '挪威', emoji: '🇳🇴' }, { text: '芬兰', emoji: '🇫🇮' },
      { text: '土耳其', emoji: '🇹🇷' }, { text: '沙特阿拉伯', emoji: '🇸🇦' }, { text: '以色列', emoji: '🇮🇱' },
      { text: '希腊', emoji: '🇬🇷' }, { text: '荷兰', emoji: '🇳🇱' }, { text: '瑞士', emoji: '🇨🇭' },
    ],
  },
  {
    id: 'sports',
    name: '运动',
    emoji: '🏆',
    items: [
      { text: '足球', emoji: '⚽' }, { text: '篮球', emoji: '🏀' }, { text: '网球', emoji: '🎾' },
      { text: '乒乓球', emoji: '🏓' }, { text: '羽毛球', emoji: '🏸' }, { text: '排球', emoji: '🏐' },
      { text: '棒球', emoji: '⚾' }, { text: '高尔夫', emoji: '⛳' }, { text: '游泳', emoji: '🏊' },
      { text: '跑步', emoji: '🏃' }, { text: '骑自行车', emoji: '🚴' }, { text: '滑冰', emoji: '⛸️' },
      { text: '滑雪', emoji: '⛷️' }, { text: '冲浪', emoji: '🏄' }, { text: '攀岩', emoji: '🧗' },
      { text: '拳击', emoji: '🥊' }, { text: '摔跤', emoji: '🤼' }, { text: '体操', emoji: '🤸' },
      { text: '跆拳道', emoji: '🥋' }, { text: '柔道', emoji: '🥋' }, { text: '射箭', emoji: '🏹' },
      { text: '赛车', emoji: '🏎️' }, { text: '马术', emoji: '🏇' }, { text: '举重', emoji: '🏋️' },
      { text: '跳高', emoji: '🏅' }, { text: '标枪', emoji: '🏅' }, { text: '铁人三项', emoji: '🏅' },
      { text: '橄榄球', emoji: '🏈' }, { text: '冰球', emoji: '🏒' }, { text: '曲棍球', emoji: '🏑' },
    ],
  },
  {
    id: 'brands',
    name: '品牌',
    emoji: '🏷️',
    items: [
      { text: '苹果', emoji: '🍎' }, { text: '耐克', emoji: '✔️' }, { text: '谷歌', emoji: '🔍' },
      { text: '脸书', emoji: '👥' }, { text: '亚马逊', emoji: '📦' }, { text: '微软', emoji: '🪟' },
      { text: '三星', emoji: '📱' }, { text: '宝马', emoji: '🚗' }, { text: '奔驰', emoji: '⭐' },
      { text: '可口可乐', emoji: '🥤' }, { text: '麦当劳', emoji: '🍟' }, { text: '星巴克', emoji: '☕' },
      { text: '华为', emoji: '📡' }, { text: '阿里巴巴', emoji: '🛒' }, { text: '腾讯', emoji: '🐧' },
      { text: '百度', emoji: '🔍' }, { text: '小米', emoji: '📱' }, { text: '比亚迪', emoji: '⚡' },
      { text: '路易威登', emoji: '👜' }, { text: '香奈儿', emoji: '💄' }, { text: '阿迪达斯', emoji: '👟' },
      { text: '乐高', emoji: '🧱' }, { text: '索尼', emoji: '🎮' }, { text: '任天堂', emoji: '🎮' },
      { text: '特斯拉', emoji: '⚡' }, { text: '优步', emoji: '🚗' }, { text: '网飞', emoji: '📺' },
      { text: '推特', emoji: '🐦' }, { text: '领英', emoji: '💼' }, { text: 'YouTube', emoji: '▶️' },
    ],
  },
  {
    id: 'occupations',
    name: '职业',
    emoji: '👔',
    items: [
      { text: '医生', emoji: '👨‍⚕️' }, { text: '护士', emoji: '👩‍⚕️' }, { text: '教师', emoji: '👨‍🏫' },
      { text: '警察', emoji: '👮' }, { text: '消防员', emoji: '👨‍🚒' }, { text: '厨师', emoji: '👨‍🍳' },
      { text: '飞行员', emoji: '👨‍✈️' }, { text: '宇航员', emoji: '👨‍🚀' }, { text: '科学家', emoji: '👨‍🔬' },
      { text: '工程师', emoji: '👨‍💻' }, { text: '艺术家', emoji: '👨‍🎨' }, { text: '音乐家', emoji: '🎵' },
      { text: '演员', emoji: '🎭' }, { text: '律师', emoji: '⚖️' }, { text: '建筑师', emoji: '🏗️' },
      { text: '摄影师', emoji: '📷' }, { text: '记者', emoji: '📰' }, { text: '翻译', emoji: '🌐' },
      { text: '心理咨询师', emoji: '🧠' }, { text: '设计师', emoji: '🎨' }, { text: '会计师', emoji: '📊' },
      { text: '农民', emoji: '🧑‍🌾' }, { text: '渔民', emoji: '🎣' }, { text: '矿工', emoji: '⛏️' },
      { text: '售货员', emoji: '🛍️' }, { text: '司机', emoji: '🚗' }, { text: '快递员', emoji: '📦' },
      { text: '理发师', emoji: '💇' }, { text: '裁缝', emoji: '🪡' }, { text: '魔术师', emoji: '🎩' },
    ],
  },
  {
    id: 'fantasy',
    name: '奇幻',
    emoji: '✨',
    items: [
      { text: '龙', emoji: '🐉' }, { text: '凤凰', emoji: '🔥' }, { text: '独角兽', emoji: '🦄' },
      { text: '美人鱼', emoji: '🧜' }, { text: '精灵', emoji: '🧝' }, { text: '矮人', emoji: '⛏️' },
      { text: '巫师', emoji: '🧙' }, { text: '吸血鬼', emoji: '🧛' }, { text: '僵尸', emoji: '🧟' },
      { text: '幽灵', emoji: '👻' }, { text: '骷髅', emoji: '💀' }, { text: '恶魔', emoji: '😈' },
      { text: '天使', emoji: '👼' }, { text: '仙女', emoji: '🧚' }, { text: '妖精', emoji: '🌟' },
      { text: '狼人', emoji: '🐺' }, { text: '半人马', emoji: '🏇' }, { text: '独眼巨人', emoji: '👁️' },
      { text: '美杜莎', emoji: '🐍' }, { text: '雷神', emoji: '⚡' }, { text: '海神', emoji: '🔱' },
      { text: '战神', emoji: '⚔️' }, { text: '爱神', emoji: '💘' }, { text: '智慧女神', emoji: '🦉' },
      { text: '太阳神', emoji: '☀️' }, { text: '月亮女神', emoji: '🌙' }, { text: '死神', emoji: '💀' },
      { text: '时间之神', emoji: '⏳' }, { text: '命运女神', emoji: '🎲' }, { text: '混沌之神', emoji: '🌀' },
    ],
  },
  {
    id: 'everyday',
    name: '日常物品',
    emoji: '🏠',
    items: [
      { text: '手机', emoji: '📱' }, { text: '电脑', emoji: '💻' }, { text: '电视', emoji: '📺' },
      { text: '冰箱', emoji: '🧊' }, { text: '洗衣机', emoji: '🫧' }, { text: '空调', emoji: '❄️' },
      { text: '汽车', emoji: '🚗' }, { text: '自行车', emoji: '🚲' }, { text: '飞机', emoji: '✈️' },
      { text: '雨伞', emoji: '☂️' }, { text: '眼镜', emoji: '👓' }, { text: '帽子', emoji: '🎩' },
      { text: '书', emoji: '📚' }, { text: '钥匙', emoji: '🔑' }, { text: '钱包', emoji: '👛' },
      { text: '剪刀', emoji: '✂️' }, { text: '锤子', emoji: '🔨' }, { text: '灯泡', emoji: '💡' },
      { text: '镜子', emoji: '🪞' }, { text: '钟表', emoji: '⏰' }, { text: '照相机', emoji: '📷' },
      { text: '耳机', emoji: '🎧' }, { text: '键盘', emoji: '⌨️' }, { text: '鼠标', emoji: '🖱️' },
      { text: '气球', emoji: '🎈' }, { text: '蜡烛', emoji: '🕯️' }, { text: '礼物盒', emoji: '🎁' },
      { text: '地图', emoji: '🗺️' }, { text: '望远镜', emoji: '🔭' }, { text: '显微镜', emoji: '🔬' },
    ],
  },
];

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find(c => c.id === id);
}

export function getRandomItem(categoryId: string): CategoryItem | null {
  const category = getCategoryById(categoryId);
  if (!category || category.items.length === 0) return null;
  const idx = Math.floor(Math.random() * category.items.length);
  return category.items[idx];
}

export function getUniqueItems(categoryId: string, count: number): CategoryItem[] {
  const category = getCategoryById(categoryId);
  if (!category) return [];
  const shuffled = [...category.items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
