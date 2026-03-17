# 📡 API 文档

本文档描述宝宝成长记录系统的后端 API 接口。

## 基础信息

- **Base URL**: `https://cyiuaertydcyeelguhor.supabase.co`
- **API Key**: 使用 Supabase anon key
- **认证方式**: Bearer Token (anon key)

## 数据库表

### babies - 宝宝信息表

```sql
CREATE TABLE babies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  birth_date DATE,
  gender TEXT,
  avatar_url TEXT,
  family_id UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### records - 成长记录表

```sql
CREATE TABLE records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID REFERENCES babies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('feeding', 'sleep', 'poop', 'growth', 'vaccine', 'milestone')),
  data JSONB NOT NULL DEFAULT '{}',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API 接口

### 宝宝管理

#### 获取宝宝列表
```http
GET /rest/v1/babies
```

**示例请求**
```bash
curl -X GET "https://cyiuaertydcyeelguhor.supabase.co/rest/v1/babies" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**响应**
```json
[
  {
    "id": "b28b33ff-f8bf-46f1-afac-e3ec8d250724",
    "name": "ok",
    "birth_date": "2025-11-27",
    "gender": "男",
    "avatar_url": "https://...",
    "created_at": "2026-03-17T04:26:38.549371+00:00"
  }
]
```

#### 创建宝宝
```http
POST /rest/v1/babies
```

**请求体**
```json
{
  "name": "宝宝名字",
  "birth_date": "2025-01-01",
  "gender": "男"
}
```

#### 更新宝宝信息
```http
PATCH /rest/v1/babies?id=eq.{baby_id}
```

---

### 记录管理

#### 获取记录列表
```http
GET /rest/v1/records?baby_id=eq.{baby_id}
```

**查询参数**
| 参数 | 说明 | 示例 |
|------|------|------|
| baby_id | 宝宝ID | `eq.b28b33ff-f8bf-46f1-afac-e3ec8d250724` |
| type | 记录类型 | `eq.feeding` |
| created_at | 创建时间 | `gte.2026-01-01` |

**示例**
```bash
curl -X GET "https://cyiuaertydcyeelguhor.supabase.co/rest/v1/records?baby_id=eq.b28b33ff-f8bf-46f1-afac-e3ec8d250724&order=created_at.desc" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

#### 创建记录
```http
POST /rest/v1/records
```

**请求体 - 喂养记录**
```json
{
  "baby_id": "b28b33ff-f8bf-46f1-afac-e3ec8d250724",
  "type": "feeding",
  "data": {
    "method": "奶粉",
    "amount": "100",
    "time": "2026-03-17T10:00:00"
  },
  "created_by": "爸爸"
}
```

**请求体 - 睡眠记录**
```json
{
  "baby_id": "b28b33ff-f8bf-46f1-afac-e3ec8d250724",
  "type": "sleep",
  "data": {
    "startTime": "2026-03-17T22:00:00",
    "endTime": "2026-03-18T06:00:00",
    "status": "深睡"
  }
}
```

**请求体 - 生长记录**
```json
{
  "baby_id": "b28b33ff-f8bf-46f1-afac-e3ec8d250724",
  "type": "growth",
  "data": {
    "date": "2026-03-17",
    "height": "65",
    "weight": "7.5",
    "head": "40"
  }
}
```

**请求体 - 疫苗记录**
```json
{
  "baby_id": "b28b33ff-f8bf-46f1-afac-e3ec8d250724",
  "type": "vaccine",
  "data": {
    "vaccineName": "脊灰第1针",
    "date": "2026-02-24",
    "site": "左臂",
    "remark": "无不良反应"
  }
}
```

**请求体 - 里程碑**
```json
{
  "baby_id": "b28b33ff-f8bf-46f1-afac-e3ec8d250724",
  "type": "milestone",
  "data": {
    "title": "第一次抬头",
    "date": "2026-01-15",
    "description": "宝宝能够自己抬头看人了"
  }
}
```

#### 更新记录
```http
PATCH /rest/v1/records?id=eq.{record_id}
```

#### 删除记录
```http
DELETE /rest/v1/records?id=eq.{record_id}
```

---

## 记录类型说明

| type 值 | 说明 | data 字段 |
|---------|------|-----------|
| feeding | 喂养 | method, side, duration, amount, food, time |
| sleep | 睡眠 | startTime, endTime, status |
| poop | 排便 | poopType, status, time, remark |
| growth | 生长 | date, height, weight, head |
| vaccine | 疫苗 | vaccineName, date, site, remark |
| milestone | 里程碑 | title, date, description |

---

## 错误处理

返回错误时，Supabase 会返回如下格式：

```json
{
  "message": "Row not found",
  "details": "The row was not found in the result set",
  "hint": null,
  "code": "PGRST116"
}
```

常见错误码：
- `PGRST116` - 记录未找到
- `23505` - 唯一约束冲突
- `42501` - 权限不足

---

## 使用示例

### JavaScript/TypeScript

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://cyiuaertydcyeelguhor.supabase.co',
  'YOUR_ANON_KEY'
)

// 获取宝宝信息
const { data: babies } = await supabase.from('babies').select('*')

// 添加记录
const { data, error } = await supabase.from('records').insert([
  {
    baby_id: 'b28b33ff-f8bf-46f1-afac-e3ec8d250724',
    type: 'feeding',
    data: { method: '奶粉', amount: '100' }
  }
])
```

### cURL

```bash
# 添加喂养记录
curl -X POST "https://cyiuaertydcyeelguhor.supabase.co/rest/v1/records" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "baby_id": "b28b33ff-f8bf-46f1-afac-e3ec8d250724",
    "type": "feeding",
    "data": {"method": "奶粉", "amount": "100"}
  }'
```
