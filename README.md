# 🍼 宝宝成长记录 (BabyDiary)

一款专为新手父母设计的宝宝日常记录应用，参考美柚功能设计，支持家庭成员共享记录、AI 智能对话记录。

## 🌟 功能特性

### 📝 记录管理
- **喂养记录** - 母乳/奶粉/辅食，支持记录时长、奶量
- **睡眠记录** - 入睡时间、醒来时间、自动计算睡眠时长
- **排便记录** - 大便/小便状态记录
- **身高体重** - 生长曲线图表追踪
- **疫苗接种** - 疫苗接种记录与提醒
- **成长里程碑** - 第一次抬头、第一次翻身等珍贵时刻

### 🤖 AI 智能助手
- 自然语言记录："宝宝吃了100ml奶粉" → 自动填表
- 智能问答："今天吃了几次奶？"
- 支持 OpenAI / Claude / 通义千问

### 📊 数据统计
- 身高体重生长曲线
- 每日/每周/每月统计

### 👨‍👩‍👧‍👦 家庭共享
- Supabase 云端存储
- 多成员协作记录

## 🚀 快速开始

### 在线访问
```
https://keo03mwo5kqi.space.minimaxi.com
```

### 本地开发

```bash
# 克隆项目
git clone <your-repo>
cd baby-diary

# 安装依赖
npm install
# 或
pnpm install

# 启动开发服务器
npm run dev
```

### 构建部署

```bash
# 构建生产版本
npm run build

# 部署到 Vercel / Netlify
vercel deploy
```

## 🔧 配置说明

### Supabase 配置

项目使用 Supabase 作为后端数据库，需要配置以下环境变量：

```env
VITE_SUPABASE_URL=你的Supabase项目URL
VITE_SUPABASE_KEY=你的Supabase anon key
```

### 数据库表结构

#### babies 表（宝宝信息）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | TEXT | 宝宝姓名 |
| birth_date | DATE | 出生日期 |
| gender | TEXT | 性别 |
| avatar_url | TEXT | 头像URL |

#### records 表（成长记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| baby_id | UUID | 宝宝ID |
| type | TEXT | 记录类型 |
| data | JSONB | 记录数据 |
| created_by | TEXT | 记录人 |
| created_at | TIMESTAMP | 创建时间 |

## 📱 技术栈

- **前端**: React 18 + Vite
- **后端**: Supabase (PostgreSQL)
- **图表**: Recharts
- **图标**: Lucide React
- **部署**: Vercel / 静态托管

## 📄 许可证

MIT License
