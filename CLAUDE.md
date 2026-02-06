# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LifeHub Web is a Vue 3 + TypeScript admin dashboard with a custom modular routing system and role-based access control (RBAC). Uses Element Plus for UI, Vue Router for navigation, and a dual-source routing strategy (backend menu tree + frontend static routes).

## Development Commands

```bash
# Start dev server (default port: 5173)
pnpm dev

# Build for production (runs vue-tsc type check first)
pnpm build

# Preview production build
pnpm preview
```

**IMPORTANT**: This project **MUST** use `pnpm` as the package manager. Do not use `npm` or `yarn`. Using other package managers may cause dependency conflicts and unexpected behavior due to differences in lock file formats and resolution algorithms.

## Architecture

### Dual-Source Routing System

The application combines routes from two sources:

1. **Backend menu tree** (fetched via `getMenuTreeApi()`) - converted to routes dynamically
2. **Frontend static routes** (defined in `src/router/modules/*.ts`)

Routes are merged in `src/store/permission.ts:generateRoutes()`:
- Backend routes are transformed by `transformMenuToRoutes()`
- Frontend routes are filtered by `filterAsyncRoutes()` based on user roles
- Duplicate routes (by name/path) are removed via Map deduplication
- 404 catch-all route is always added last

**CRITICAL: Route Strategy**
- **DO NOT add static routes** for new features in `src/router/modules/`
- **Always use backend menu (dynamic routes)** for all business features
- Static routes are reserved for system pages only (login, welcome, 404, etc.)
- Dynamic routes provide better flexibility, RBAC integration, and maintainability

**Critical**: The 404 route must be added last via `router.addRoute()` after all dynamic routes. See `src/router/index.ts:117-128`.

### Auto-Layout Injection

Routes defined in `src/router/modules/` are processed by `src/router/utils.ts`:

- Top-level routes (single path segment like `/sys`) are automatically wrapped with Layout component
- Exception: routes in whitelist (`/login`, `/welcome`) keep their original component
- Child routes render in Layout's content area

Example:
```typescript
// src/router/modules/sys.ts
export default {
  path: "/sys",
  // component: Layout - auto-injected
  redirect: "/sys/user",
  meta: { icon: "...", title: "系统管理", rank: 800 },
  children: [/* ... */]
}
```

### Permission System

**Three-tier permission model**:

1. **Token-based auth**: Stored in localStorage (`life_hub_token`, `life_hub_tokenExpiresAt`)
2. **Role-based access**: User roles in `userStore.roles` (string array)
3. **Permission-based control**: Fine-grained permissions in `userStore.permissions`

**Permission utilities** (`src/utils/auth.ts`):
- `hasPermission(value)` - check if user has permission(s). Supports `*:*:*` super-admin wildcard
- `hasRole(value)` - check if user has role(s)
- `clearAuthData()` - centralized cleanup for auth-related storage

**Route permissions**:
- Routes define required permissions via `meta.permissions: string[]`
- Checked in router guard (`src/router/index.ts:66-69`) before navigation
- Menu items filtered in `useNav.ts:30` using same permission check

**Storage constants**: All storage keys centralized in `src/utils/constants.ts` (`STORAGE_KEYS`)

### Authentication Flow

1. **Login** (`src/views/login/index.vue`):
   - Calls `loginApi()` to get token
   - Stores token + expiration in localStorage
   - Redirects to `/`

2. **Route guard** (`src/router/index.ts:43-151`):
   - Validates token expiration on every navigation
   - If no roles/permissions in memory:
     - Try restore from sessionStorage
     - Otherwise call `getUserInfoApi()` to fetch from backend
     - Cache in sessionStorage for subsequent page loads
   - Generate and add dynamic routes
   - Handle 401 errors by clearing auth data and redirecting to login

3. **HTTP interceptors** (`src/utils/http/index.ts`):
   - **Request**: Adds Bearer token, checks expiration
   - **Response**: Handles 401/403 errors, shows error messages
   - Uses `json-bigint` to prevent JavaScript integer precision loss

### State Management

Uses Vue 3 `reactive()` stores (no Pinia/Vuex):

- **`src/store/user.ts`**: User roles and permissions
- **`src/store/permission.ts`**: Route generation and dynamic route management

### Layout System

- **Layout component**: `src/layout/index.vue` - fixed 240px sidebar + flex content area
- **Navigation**: `src/layout/components/lay-navbar/index.vue` - auto-generated from routes
- **Menu generation**: `src/layout/hooks/useNav.ts` - transforms routes to menu tree, respects permissions

## Key Patterns

### API Module Pattern

All APIs in `src/api/` follow this pattern:

```typescript
import { http } from "@/utils/http";

const prefix = '/sys/menu';

export interface MenuRow { /* ... */ }

export const getMenuTreeApi = () => http.get<MenuRow[]>(`${prefix}/tree`);
```

**Response type** (`ApiResponse<T>`):
```typescript
{
  code: number;
  data: T;
  message: string;
}
```

### Adding New Pages

**IMPORTANT: Always use dynamic routes (backend menu), NEVER add static routes**

1. Create view component in `src/views/`
2. **Configure menu in backend admin panel** (system will auto-generate routes)
3. Add `meta.permissions` in backend menu configuration for access control
4. The system will automatically:
   - Fetch menu tree from backend on login
   - Transform menu items to Vue Router routes
   - Apply permission-based filtering
   - Inject Layout component automatically

**Static routes should ONLY be used for**:
- Login page (`/login`)
- Welcome/Dashboard page (`/welcome`)
- Error pages (404, 403, etc.)
- Other system-level pages that don't require RBAC

**DO NOT create new files in `src/router/modules/` for business features**

### Route Meta Fields

- `title`: Menu title (string)
- `icon`: Icon identifier for `@iconify/vue` (e.g., `"ep/home-filled"`, `"mdi:account"`)
- `rank`: Sort order (number, lower first). `/welcome` always first
- `permissions`: Required permissions array (checked by `hasPermission()`)
- `roles`: Required roles array (legacy, use `permissions`)
- `hidden`: Hide from menu (boolean)

## HTTP Client Configuration

- **Dev proxy**: `/api/*` → `http://localhost:9000` (prefix stripped)
- **Timeout**: 15 seconds
- **Transform**: `json-bigint` with `storeAsString: true` (handles 64-bit integers from backend)
- **Auto-retry**: None - failures show error message immediately

## Styling

- **Preprocessor**: SCSS with global variables
- **Variables**: `src/styles/variables.scss` (auto-injected via Vite config)
- **Variables available**:
  - `$center-background-color`, `$menu-background-color`, `$primary-background-color`
- **Usage**:
  ```vue
  <style scoped lang="scss">
  @use "@/styles/variables" as *;
  .my-class { background: $menu-background-color; }
  </style>
  ```

## Path Aliases

`@` → `src/` (configured in `vite.config.ts`)

Use absolute imports: `import { http } from "@/utils/http"`

## Important Files

- `src/router/index.ts` - Router setup, auth guard, dynamic route injection
- `src/router/utils.ts` - Auto-layout injection logic
- `src/store/permission.ts` - Route generation from backend menu + frontend routes
- `src/utils/auth.ts` - Permission utilities, auth data cleanup
- `src/utils/http/index.ts` - Axios instance, interceptors, json-bigint transform
- `src/utils/constants.ts` - Centralized storage key constants
