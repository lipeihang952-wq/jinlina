/* =========================================================
 * 金丽娜 · 网站内容数据
 * ---------------------------------------------------------
 * 作品、故事、图片、荣誉、出处都从这里读取，改这里即可更新网站。
 * 每条信息的 src 对应下方 sources 的键名（公开出处）。
 * ========================================================= */
window.SITE_DATA = {
  config: {
    // 合作邮箱：填写后，页脚会出现“合作联系”按钮；留空则不显示。
    contactEmail: ""
  },

  /* ---------- 图片（均来自公开报道，版权归原作者） ---------- */
  images: {
    portrait: { src: "images/portrait.jpg", w: 413, h: 416, alt: "金丽娜肖像", caption: "金丽娜", credit: "图源：文狐网 · 人物介绍" },
    launch: { src: "images/launch-2023.jpg", w: 1269, h: 847, alt: "金丽娜在《微风吹过“撒欢谷”》发布会上发言", caption: "2023 年 5 月 25 日，北京。在《微风吹过“撒欢谷”》发布会上发言。", credit: "图源：央广网（主办方供图）" },
    onset: { src: "images/onset-2022.jpg", w: 260, h: 360, alt: "金丽娜在片场", caption: "《微风吹过“撒欢谷”》拍摄间隙。", credit: "图源：搜狐号" },
    premiere: { src: "images/premiere-2020.jpg", w: 650, h: 433, alt: "《因为遇见你》首映礼现场", caption: "2020 年 12 月，教育公益微电影《因为遇见你》在玉泉小学首映。", credit: "图源：新华网 / 贵州广播电视台" },
    valley: { src: "images/valley.jpg", w: 640, h: 854, alt: "北京延庆撒欢谷的夏天", caption: "北京延庆的“撒欢谷”，也是影片里那座农场的名字。", credit: "图源：搜狐号" },
    cover: { src: "images/book-cover.jpg", w: 568, h: 800, alt: "散文集《因为爱情》封面", caption: "散文集《因为爱情》，中国长安出版社，2013 年。", credit: "图源：豆瓣读书" }
  },
  gallery: ["launch", "portrait", "premiere", "onset", "valley"],

  /* ---------- 资料来源 ---------- */
  sources: {
    sina2007: { outlet: "新浪军事", date: "2007-06-24", title: "CCTV《军事纪实》栏目大事记", url: "http://mil.news.sina.com.cn/2007-06-24/1359451169.html" },
    cctv2009: { outlet: "央视网", date: "2009-04-28", title: "金丽娜：穿越海疆的记忆（访谈实录）", url: "http://news.cctv.cn/xianchang/20090428/109751.shtml" },
    jfjb1203: { outlet: "解放军报（新浪军事转载）", date: "2012-12-03", title: "顶风冒雪拍摄纪录片《走边关》", url: "http://mil.news.sina.com.cn/2012-12-03/0519708472.html" },
    jfjb1216: { outlet: "解放军报（新浪军事转载）", date: "2012-12-16", title: "一路风雪体悟戍边情怀", url: "http://mil.news.sina.com.cn/2012-12-16/0620709783.html" },
    douban: { outlet: "豆瓣读书", date: "2013-06", title: "《因为爱情》图书条目（作者简介、目录、封面）", url: "https://book.douban.com/subject/24816863/" },
    xinhua2020: { outlet: "新华网（贵州广播电视台转载）", date: "2020-12-24", title: "教育公益微电影《因为遇见你》首映", url: "https://www.gzstv.com/a/00e618966c9d4d52904bca39fa195e43" },
    sohu: { outlet: "搜狐号", date: "2022-10", title: "电影短片《微风吹过“撒欢谷”》介绍", url: "https://www.sohu.com/a/592435186_100187912" },
    cnr2023: { outlet: "央广网", date: "2023-05-26", title: "教育公益电影《微风吹过“撒欢谷”》全网发布", url: "https://edu.cnr.cn/gc/20230526/t20230526_526265382.shtml" },
    wenfox: { outlet: "文狐网 · 文狐之星", date: "2024-03-20", title: "金丽娜（人物介绍）", url: "https://www.wenfox.com/page-content-229.html" }
  },

  /* ---------- 作品（按时间排列）----------
   * type: doc 纪录片 / film 公益电影 / book 著作
   * img: 对应上面 images 的键名；没有图片的作品用 glyph（海报大字）+ tone（海报底色）
   */
  works: [
    {
      id: "sniper", type: "doc", year: 2007, glyph: "狙", tone: "#3e4a35",
      title: "狙击手集训队", kind: "纪录片", role: "编导", platform: "CCTV-7《军事纪实》",
      summary: "以奥运安保为主题的纪录片，走进一支狙击手集训队。",
      awards: ["2007年度中国十优纪录片长篇奖", "全军第二届军事节目评析一等奖"], src: ["douban"]
    },
    {
      id: "pingan", type: "doc", year: 2008, glyph: "安", tone: "#2c3d55",
      title: "平安奥运", kind: "十集纪录片", role: "参与拍摄", platform: null,
      summary: "2008 年，她参与拍摄了十集纪录片《平安奥运》。",
      awards: [], src: ["douban"]
    },
    {
      id: "xiangnanlin", type: "doc", year: 2008, glyph: "锋", tone: "#5b3a2b",
      title: "向南林“争锋”许三多", kind: "两集纪录片", role: "负责拍摄", platform: null,
      summary: "2008 年，她负责全军重大典型人物向南林的拍摄，制作了这部两集纪录片。",
      awards: ["改革开放30年精品作品奖"], src: ["douban"]
    },
    {
      id: "haijiang", type: "doc", year: 2009, glyph: "海", tone: "#1f4658",
      title: "穿越海疆的记忆", kind: "系列节目 · 四集", role: "编导", platform: "CCTV-7《军事纪实》",
      summary: "为中国海军建军 60 周年制作的四集系列节目。没有按年份平铺直叙，而是截取不同年代、不同历史阶段，在事件中融入人物，讲述海军的成长。",
      detail: "策划用了一个月，策划案改到第四稿才通过；之后两个月里，摄制组走访海军十几个地方，她一共采访了 8 位人物，涵盖老、中、青三代官兵。",
      awards: [], src: ["cctv2009"]
    },
    {
      id: "leifeng", type: "doc", year: 2012, glyph: "雷", tone: "#6a2a22",
      title: "永远的雷锋", kind: "文献纪录片", role: "主创", platform: null,
      summary: "一部追寻雷锋精神的文献纪录片。",
      awards: ["中宣部十八大献礼优秀作品", "中国文献纪录片一等奖"], src: ["douban", "wenfox"]
    },
    {
      id: "zoubianguan", type: "doc", year: 2012, glyph: "关", tone: "#384452",
      title: "走边关——内蒙古段", kind: "大型纪录片《走边关》· 内蒙古段", role: "编导", platform: "解放军电视宣传中心《军事纪实》栏目",
      summary: "《走边关》是一部 120 集的大型纪录片，以记者亲身体验为主线，走访边防哨所。2012 年冬，她作为编导，随 6 人摄制组自西向东走访内蒙古边防线。",
      awards: ["第19届中国电视纪录片“走转改”新闻纪实最佳导演"], src: ["jfjb1203", "jfjb1216", "wenfox"]
    },
    {
      id: "huli", type: "doc", year: 2013, glyph: "狐", tone: "#77562a",
      title: "“狐狸山”上的青春", kind: "纪录片", role: "导演", platform: null,
      summary: "她在 2013 年拍摄的纪录片，题名亦作《狐狸山上的“青春”》。",
      awards: ["第七届“纪录·中国”优秀导演奖", "中国十大纪录片奖"], src: ["douban", "wenfox"]
    },
    {
      id: "love", type: "book", year: 2013, img: "cover",
      title: "因为爱情", kind: "散文集", role: "作者", platform: "中国长安出版社 · 2013 年 6 月",
      summary: "一本记录爱情故事的散文集，以作者十几年的工作经历为背景，写下所见所闻的情感故事。全书十章，最后一章为“边防线上的爱情”。",
      detail: "308 页，ISBN 978-7-5107-0574-8。推荐：军旅音乐人小曾、央视军事节目中心专题部主任魏纪奎。",
      awards: [], src: ["douban"]
    },
    {
      id: "yujian", type: "film", year: 2020, img: "premiere",
      title: "因为遇见你", kind: "教育公益微电影", role: "导演", platform: "中国科学院附属玉泉小学、娜视（北京）文化传播有限公司联合出品",
      summary: "根据发生在玉泉小学的真实故事改编，讲述一名来自单亲家庭的学龄儿童的学习与成长。2020 年 12 月，影片在玉泉小学举行首映礼。",
      awards: [], src: ["xinhua2020", "wenfox"]
    },
    {
      id: "sahuangu", type: "film", year: 2023, yearLabel: "2022—2023", img: "valley",
      title: "微风吹过“撒欢谷”", kind: "教育公益电影短片", role: "导演", platform: "编剧：高峰",
      summary: "一个关于儿童抑郁症的故事：初中生乐乐患上抑郁症，被妈妈带到一个叫“撒欢谷”的农场，结识了退休的老校长和小伙伴婷婷，度过了一个疗愈心灵的夏天。",
      detail: "2022 年拍摄，部分拍摄资金通过众筹筹集；2023 年 5 月 25 日，在第十九个全国大中学生心理健康日来临之际于北京发布，并全网上线。",
      awards: [], src: ["cnr2023", "wenfox", "sohu"]
    },
    {
      id: "liangan", type: "doc", year: null, glyph: "岸", tone: "#2b524d",
      title: "打破隔绝30年", kind: "海峡两岸纪录片", role: "领队制作", platform: null,
      summary: "她领队制作的海峡两岸纪录片。据其个人介绍，该片受到台办及海峡两岸的高度赞誉。",
      awards: [], src: ["wenfox"]
    },
    {
      id: "haojiu", type: "book", year: null, glyph: "见", tone: "#4a3a5a",
      title: "好久不见", kind: "小说", role: "作者", platform: null,
      summary: "金丽娜出版的小说作品。", awards: [], src: ["wenfox"]
    },
    {
      id: "dangbing", type: "book", year: null, glyph: "兵", tone: "#45503a",
      title: "当兵的那一天", kind: "报告文学", role: "作者", platform: null,
      summary: "金丽娜出版的报告文学作品。", awards: [], src: ["wenfox"]
    }
  ],

  /* ---------- 《因为爱情》目录 ---------- */
  toc: ["一切都是幸福的模样", "当爱情转移了方向", "相见不如怀念", "因为爱情有点沧桑", "记住爱最美的模样", "不要爱恨两难消", "爱是一种很奇妙的东西", "爱已成为一种习惯", "我的私人爱情故事", "边防线上的爱情"],

  /* ---------- 打板游戏：每打一板解锁一个故事 ---------- */
  slate: [
    { scene: "2006 年以前", text: "进入央视之前，她是黑龙江电台情感节目的主持人，连续三年被评为交通广播最受欢迎的电台节目主持人。", src: ["douban"] },
    { scene: "2006", text: "她进入中央电视台，从此一直在军事报道一线。", src: ["douban"] },
    { scene: "2007", text: "她拍摄以奥运安保为主题的纪录片《狙击手集训队》，获 2007 年度中国十优纪录片长篇奖。", src: ["douban"] },
    { scene: "2008", text: "她负责全军重大典型人物向南林的拍摄，两集纪录片获改革开放30年精品作品奖。", src: ["douban"] },
    { scene: "2009 · 春", text: "为海军建军 60 周年，她用两个月走访海军十几个地方，采访了 8 位人物。", src: ["cctv2009"] },
    { scene: "2009 · 策划", text: "那期节目的策划案，改到第四稿才通过。", src: ["cctv2009"] },
    { scene: "2012", text: "文献纪录片《永远的雷锋》获评中宣部十八大献礼优秀作品。", src: ["douban"] },
    { scene: "2012 · 冬", text: "在阿拉善的神仙山哨所，她帮连长策划婚礼，还给新娘当了化妆师。", src: ["jfjb1216"] },
    { scene: "2012 · 冬", text: "从巴彦淖尔到包头，她连续 5 天输液，仍然带病完成节目创作。", src: ["jfjb1216"] },
    { scene: "2012 · 12 · 02", text: "零下 32 摄氏度，《走边关》摄制组来到阿尔山三角山哨所。", src: ["jfjb1203"] },
    { scene: "2013", text: "《“狐狸山”上的青春》获第七届“纪录·中国”优秀导演奖。", src: ["douban"] },
    { scene: "2013 · 06", text: "她出版散文集《因为爱情》，最后一章叫“边防线上的爱情”。", src: ["douban"] },
    { scene: "2020", text: "她执导教育公益微电影《因为遇见你》，12 月在玉泉小学首映。", src: ["xinhua2020"] },
    { scene: "2023 · 05", text: "《微风吹过“撒欢谷”》全网发布。她形容，这是自己导演生涯里最深刻的一次拍摄。", src: ["cnr2023"] }
  ],

  /* ---------- 《走边关》内蒙古段路线（站点按所在盟市驻地近似标注） ---------- */
  route: {
    ref: { name: "北京", lon: 116.40, lat: 39.90 },
    stations: [
      { id: "heishui", name: "黑水城", lon: 101.15, lat: 41.76, lp: "top" },
      { id: "alashan", name: "阿拉善", lon: 105.67, lat: 38.83, lp: "right" },
      { id: "bayan", name: "巴彦淖尔", lon: 107.39, lat: 40.74, lp: "top" },
      { id: "baotou", name: "包头", lon: 109.84, lat: 40.66, lp: "right" },
      { id: "xilin", name: "锡林浩特", lon: 116.09, lat: 43.94, lp: "top" },
      { id: "aershan", name: "阿尔山", lon: 119.94, lat: 47.18, lp: "left" }
    ],
    notes: [
      {
        station: "heishui", date: "2012 年冬 · 出发", title: "六个人，自西向东",
        text: "《军事纪实》栏目组选派 6 人组成摄制组：主编赵伟、出镜记者冯珈、编导金丽娜和王寒凝、摄像李后林和刘金梁。他们沿内蒙古边防线自西向东拍摄《走边关》。在被黄沙掩埋的千年古城黑水城，冯珈顶着漫天风沙完成了 10 分钟的出镜。",
        src: ["jfjb1216"]
      },
      {
        station: "alashan", date: "阿拉善 · 神仙山哨所", title: "哨所里的婚礼",
        text: "她做节目向来投入真情。得知连长要和妻子在哨所举行婚礼，她不仅帮忙策划婚礼，还给新娘当起了化妆师，又送上一条围巾作为新婚礼物。",
        src: ["jfjb1216"]
      },
      {
        station: "baotou", date: "巴彦淖尔 → 包头", title: "连续五天输液",
        text: "水土不服，加上连日劳累，从巴彦淖尔到包头，她连续 5 天输液，仍然带病完成了节目创作。",
        src: ["jfjb1216"]
      },
      {
        station: "xilin", date: "锡林浩特 · 夜", title: "零下三十度的雪地",
        text: "边关纪录片已经拍过许多，这一次摄制组想拍出新意。为了表现“科技控边”，编导王寒凝在零下 30 摄氏度的夜里坚持在雪地里拍摄。",
        src: ["jfjb1216"]
      },
      {
        station: "aershan", date: "12 月初 · 阿尔山", title: "零下三十六度",
        text: "12 月 2 日，零下 32 摄氏度，摄制组来到三角山哨所；之后又踏着齐膝深的积雪跟战士们一起巡逻。最冷的那天是零下 36 摄氏度，他们沿哈里哈河爬冰卧雪，在边境线上走了 8 个多小时。截至 12 月初，已拍下 9000 多分钟高清素材。",
        src: ["jfjb1203", "jfjb1216"]
      }
    ]
  },

  /* ---------- 个人称号 ---------- */
  titles: [
    { big: "2", unit: "次", title: "“中国十大纪录片导演”", text: "两次荣获该称号。", src: ["wenfox"] },
    { big: "多", unit: "次", title: "最佳纪录片导演 · 最佳纪录片制作人", text: "多次获中国纪录片委员会评选。", src: ["wenfox"] },
    { big: "3", unit: "年", title: "最受欢迎的电台节目主持人", text: "进入央视前，连续三年获评（交通广播）。", src: ["douban"] }
  ]
};
