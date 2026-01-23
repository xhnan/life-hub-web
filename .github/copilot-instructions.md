# LifeHub Web - AI Coding Agent Instructions

## 项目概述
这是一个基于 Vue 3 + TypeScript + Vite 的管理后台系统，使用 Element Plus 作为 UI 框架。项目采用模块化路由系统和自动化布局注入机制。

## 核心架构原则

### 1. 路由系统 - 自动布局注入
路由配置在 `src/router/modules/` 下，采用文件模块自动扫描机制：
- **顶级路由**（如 `/sys`）会自动包裹 Layout 布局，除非在白名单中（`/login`, `/welcome`）
- **子路由** 直接渲染为 Layout 内的内容区域
- 所有路由模块通过 `import.meta.glob` 自动加载，无需手动注册
- 路由排序规则：`/welcome` 始终第一，其余按 `meta.rank` 升序（默认为 0）

**示例路由模块**（参考 [home.ts](src/router/modules/home.ts)）：
```typescript
export default {
  path: "/",
  component: Layout,
  redirect: "/welcome",
  meta: { icon: "ep/home-filled", title: "首页", rank: 0 },
  children: [
    {
      path: "/welcome",
      component: () => import('@/views/welcome/index.vue'),
      meta: { title: "首页" }
    }
  ]
}
```

**路由处理逻辑**（[utils.ts](src/router/utils.ts#L6-L24)）：
- `isTopLevelRoute()` 判断是否为顶级路由
- `formatRouter()` 自动为顶级路由包裹 Layout，并处理子路由
- 白名单路由不包裹 Layout，直接使用组件

### 2. 布局系统 - 固定侧边导航
布局组件 [layout/index.vue](src/layout/index.vue) 采用 Flex 固定侧边栏设计：
- 左侧导航栏固定宽度 240px，深色主题
- 右侧内容区域 flex-grow，白色背景
- 导航菜单由 [lay-navbar](src/layout/components/lay-navbar/index.vue) 组件实现，使用 Element Plus Menu 组件
- 菜单数据通过 [useNav](src/layout/hooks/useNav.ts) hook 从路由动态生成，支持多级嵌套

**导航菜单生成规则**：
- 从 Vue Router 读取所有路由，过滤包含 `meta.title` 且非动态路径的路由
- 按路径分组构建树形菜单，顶级路由作为一级菜单
- 菜单图标从 `meta.icon` 获取，使用 `@iconify/vue` 渲染（格式：`ep/home-filled`）

### 3. HTTP 请求封装 - 统一响应处理
所有 API 调用使用 [utils/http/index.ts](src/utils/http/index.ts) 封装的 axios 实例：

**标准响应结构**：
```typescript
interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}
```

**关键特性**：
- 自动注入 Bearer Token（从 localStorage 读取）
- 统一错误处理：`code !== 200` 时显示错误消息
- 401 自动跳转登录并清除 token
- 响应拦截器自动解包 `response.data`，业务方法直接返回 `ApiResponse<T>`
- 支持文件上传/下载（`upload()`, `download()`）

**API 模块示例**（[menuApi.ts](src/api/menuApi.ts)）：
```typescript
const prefix = '/sys/menu';
export const getMenuTreeApi = () => http.get<MenuRow[]>(`${prefix}/tree`);
export const addMenuApi = (data: Partial<MenuRow>) => http.post<MenuRow>(`${prefix}`, data);
```

### 4. 样式规范 - SCSS 变量全局注入
样式变量定义在 [styles/variables.scss](src/styles/variables.scss)，通过 Vite 配置全局注入：
```scss
$center-background-color: rgba(0, 0, 0, 0.3);
$menu-background-color: rgba(190, 240, 245, 0.3);
$primary-background-color: rgba(255, 255, 255, 0.8);
```

**使用方式**：
```vue
<style scoped lang="scss">
@use "@/styles/variables" as *;
.content { background: $center-background-color; }
</style>
```

## 关键开发工作流

### 添加新页面模块
1. 在 `src/views/` 下创建页面组件（如 `sys/user/index.vue`）
2. 在 `src/router/modules/` 创建路由模块，导出默认对象
3. 如需 API 调用，在 `src/api/` 创建对应 API 文件，使用 `http` 封装方法
4. 顶级路由会自动包裹 Layout，子路由直接渲染在内容区

### 开发命令
- 启动开发服务器：`pnpm dev`（默认端口 5173）
- 构建生产版本：`pnpm build`（先执行 vue-tsc 类型检查）
- 预览构建结果：`pnpm preview`

### 路径别名
Vite 配置了 `@` 别名指向 `src` 目录，所有导入使用绝对路径：
```typescript
import { http } from "@/utils/http";
import LayNavbar from "@/layout/components/lay-navbar/index.vue";
```

## 技术栈依赖
- **核心框架**：Vue 3.5 + TypeScript 5.9
- **构建工具**：Vite 7.2 + vue-tsc（类型检查）
- **UI 框架**：Element Plus 2.11
- **图标方案**：unplugin-icons + @iconify/vue（自动按需安装）
- **路由管理**：Vue Router 4
- **HTTP 客户端**：Axios 1.13
- **样式预处理**：Sass/SCSS
- **包管理器**：pnpm

## 后端集成配置
开发环境 API 代理配置在 [vite.config.ts](vite.config.ts#L17-L23)：
- 前端请求 `/api/*` 自动代理到 `http://localhost:9000`
- 代理会移除 `/api` 前缀（`rewrite` 规则）
- 生产环境通过 `VITE_API_BASE_URL` 环境变量配置基础路径

## 项目约定
- **组件命名**：使用 PascalCase，文件名统一 kebab-case（如 `lay-navbar/index.vue`）
- **路由 meta 字段**：`title`（菜单标题）、`icon`（图标）、`rank`（排序）
- **API 模块命名**：以 `Api` 结尾（如 `getMenuTreeApi`）
- **菜单类型**：1=目录、2=菜单、3=按钮（参考 [menuApi.ts](src/api/menuApi.ts#L8)）
- **Composition API 优先**：使用 `<script setup>` 语法，组合式函数放在 `hooks/` 目录
