import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'; // 引入 unplugin-icons 插件
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue(),
        Icons({
            // 可选择你需要的图标库，例如 Material Design Icons (mdi) 和 Font Awesome (fa)
            autoInstall: true, // 自动安装图标
        }),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8080', // 后端地址
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    }
})
