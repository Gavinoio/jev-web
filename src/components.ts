import type { App, Component } from 'vue'

// 根目录 components/ 下的组件全局可用（DemoTypes 里直接用了 QView、RView）。
// 单独放一个模块：main.ts 先引入样式再引入这里，组件样式才会排在主题样式之后。
const modules = import.meta.glob<{ default: Component }>('../components/*.vue', { eager: true })

export function registerComponents(app: App) {
  for (const [path, mod] of Object.entries(modules)) {
    const name = path.split('/').pop()!.replace(/\.vue$/, '')
    app.component(name, mod.default)
  }
}
