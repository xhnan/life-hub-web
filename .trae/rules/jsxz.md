IMPORTANT: Use pnpm only (NO npm/yarn). Using other package managers may cause lockfile conflicts.

1) Stack: Vue 3 + TypeScript + Element Plus + Vue Router 4.6
2) HTTP: Axios 1.13 + custom interceptors (token injection, 401 redirect, error message); unified ApiResponse<T>
3) Auth: RBAC; cache roles/permissions in sessionStorage; supports super_admin and *:*:* wildcard permission
4) Styling: Sass/SCSS; alias @ -> src/
5) Routing: Business pages must use backend-driven dynamic routes (menu tree -> routes). DO NOT add new business static routes in src/router/modules. Static routes are for system pages only (/login, /welcome, 403/404, etc.)
