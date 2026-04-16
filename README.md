# 🎭 HeadGame — 猜头顶多人派对游戏

[![Deploy](https://github.com/YOUR_USERNAME/headgame/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/headgame/actions)

> 2-8人实时多人在线猜头顶游戏。每位玩家头顶有一张只有别人看得到的卡片，通过向他人提问来猜出自己头顶的内容！

## 🎮 玩法规则

1. **房主创建房间**，其他人输入房间码加入（最多8人）
2. **房主选择题库分类**（动物/美食/影视等10类）和显示模式（文字/表情图片）
3. 游戏开始后，系统随机给每人分配头顶内容，**只有别人看得到你头顶上是什么**
4. **轮流提问**：到你回合时可以向任意玩家提问（其他玩家回答是/否）
5. **随时猜测**：任何时候可以猜测自己头顶，猜错扣1条命 -10分
6. **计分规则**：
   - 第1个猜对：100分 + 速度奖励
   - 第2个猜对：85分
   - 第N个猜对：每晚15分（最低10分）
   - 猜错：-10分
7. 所有玩家猜对或淘汰后游戏结束，分数最高者获胜！

## ✨ 功能特性

- 🌐 **实时多人** — Socket.io WebSocket，低延迟实时同步
- 🎯 **10大题库** — 动物、美食、影视、名人、国家、运动、品牌、职业、奇幻、日常物品，每类30个词条
- 🖼️ **双显示模式** — 表情图片模式 or 文字模式
- 🎤 **语音输入** — 支持浏览器语音识别（Chrome/Edge）
- ❤️ **生命系统** — 可配置1/2/3/5条命
- ⏱️ **回合计时** — 可配置30/60/90/120秒限时
- 🎨 **丝滑UI** — 玻璃拟态 + 霓虹特效 + Framer Motion动画
- 🏆 **积分排行** — 实时积分 + 游戏结束颁奖典礼

## 🏗️ 技术架构

```
headgame/
├── client/          # React 18 + TypeScript + Vite + Tailwind CSS
│   └── src/
│       ├── pages/   # 首页、大厅、游戏、结算
│       ├── hooks/   # useSocket, useSpeech
│       └── types/   # 共享类型定义
└── server/          # Node.js + Express + Socket.io
    └── src/
        ├── GameManager.ts  # 游戏状态管理
        ├── categories.ts   # 题库数据
        └── index.ts        # Socket事件处理
```

## 🚀 本地运行

### 前置需求
- Node.js 18+
- npm 9+

### 启动步骤

```bash
# 1. 克隆仓库
git clone https://github.com/YOUR_USERNAME/headgame.git
cd headgame

# 2. 安装服务端依赖
cd server && npm install && cd ..

# 3. 安装客户端依赖
cd client && npm install && cd ..

# 4. 启动服务端（终端1）
cd server && npm run dev
# 服务端运行在 http://localhost:3001

# 5. 启动客户端（终端2）
cd client && npm run dev
# 游戏运行在 http://localhost:5173
```

## 📦 部署到 GitHub

### 前端 → GitHub Pages

1. **Push 到 GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/headgame.git
   git push -u origin main
   ```

2. **开启 GitHub Pages**
   - 仓库 → Settings → Pages → Source: **GitHub Actions**

3. **配置 Secret**（可选，如果有独立服务端）
   - 仓库 → Settings → Secrets → `VITE_SERVER_URL` = `https://your-server.railway.app`

4. **自动部署** — 每次 push 到 main 分支时自动构建并部署

### 后端 → Railway（免费）

1. 访问 [railway.app](https://railway.app)，用 GitHub 登录
2. New Project → Deploy from GitHub repo → 选择此仓库
3. 配置根目录为 `server`，Railway 会自动检测并运行
4. 获取部署 URL，填入前端的 `VITE_SERVER_URL` Secret

### 环境变量

**服务端**（Railway 配置）：
```
PORT=3001
CLIENT_ORIGIN=https://YOUR_USERNAME.github.io
```

**客户端**（GitHub Secret 或 `.env.local`）：
```
VITE_SERVER_URL=https://your-server.railway.app
VITE_BASE_URL=/headgame/
```

## 🎲 Socket.io 事件

| 客户端发送 | 说明 |
|---|---|
| `create_room` | 创建房间 |
| `join_room` | 加入房间 |
| `start_game` | 开始游戏（仅房主）|
| `send_message` | 发送问题/回答 |
| `make_guess` | 猜测头顶内容 |
| `end_turn` | 结束当前回合 |
| `update_settings` | 更新设置（仅房主）|

| 服务端广播 | 说明 |
|---|---|
| `room_updated` | 房间状态变更 |

## 📝 License

MIT
