// 样式必须最先引入，顺序：重置 → 基础排版 → 主题 → 短类名工具类 → 外壳（演讲/阅读模式），之后才是组件
import './styles/reset.css'
import './styles/typography.css'
import './styles/theme.css'
import './styles/utils.css'
import './styles/base.css'
import { createApp } from 'vue'
import { registerComponents } from './components'
import App from './App.vue'

const app = createApp(App)
registerComponents(app)
app.mount('#app')
