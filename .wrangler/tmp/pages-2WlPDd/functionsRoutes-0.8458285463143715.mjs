import { onRequestPost as __api_jev_ts_onRequestPost } from "C:\\Users\\Administrator\\Desktop\\AI\\jev\\jev-web\\functions\\api\\jev.ts"
import { onRequestPost as __api_jev_box_ts_onRequestPost } from "C:\\Users\\Administrator\\Desktop\\AI\\jev\\jev-web\\functions\\api\\jev-box.ts"

export const routes = [
    {
      routePath: "/api/jev",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_jev_ts_onRequestPost],
    },
  {
      routePath: "/api/jev-box",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_jev_box_ts_onRequestPost],
    },
  ]