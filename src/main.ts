import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import router from "./router";
import { permission, hasPermi, hasRole } from './directives/permission'

const app = createApp(App)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})
app.directive('permission', permission)
app.directive('hasPermi', hasPermi)
app.directive('hasRole', hasRole)
app.mount('#app')

