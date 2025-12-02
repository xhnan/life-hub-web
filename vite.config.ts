import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {fileURLToPath, URL} from 'node:url'
import Icons from 'unplugin-icons/vite'; // 引入 unplugin-icons 插件

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
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    }
})
