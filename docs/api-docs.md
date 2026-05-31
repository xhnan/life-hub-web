# 后端 API 文档说明

## 文档地址

后端基于 Swagger / OpenAPI 暴露接口文档，地址固定为：

```
http://localhost:9000/v3/api-docs
```

这是 JSON 格式的 OpenAPI spec，包含所有接口的路径、请求参数、请求体与响应结构。

## 类型生成

前端不实时读取文档，而是在生成期把后端文档快照成本地 TS 类型文件。

- 生成命令：`pnpm api:gen`
- 实际执行：`openapi-typescript http://localhost:9000/v3/api-docs -o src/types/api-schema.d.ts`
- 输出文件：`src/types/api-schema.d.ts`（自动生成，禁止手动修改）

`src/api/` 下手写的 API 封装应参照该类型文件对齐字段与路径。

## AI 使用约定

当需要了解后端接口的真实结构（路径、字段、参数、响应）时：

1. 优先读取本地已生成的 `src/types/api-schema.d.ts`。
2. 若该文件缺失或疑似过期（后端有改动），且后端服务已在 `localhost:9000` 运行，可直接抓取
   `http://localhost:9000/v3/api-docs` 获取最新文档，或运行 `pnpm api:gen` 重新生成类型文件。
3. 新增 / 修改 `src/api/` 下的接口封装时，以上述文档 / 类型为准，保持字段命名与后端一致。
