import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import createVitePlugins from './vite/plugins'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd())
  const { VITE_APP_ENV } = env
  return {
    base: VITE_APP_ENV === 'production' ? '/' : '/',
    plugins: createVitePlugins(env, command === 'build'),
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './'),
        '@': path.resolve(__dirname, './src')
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
    },
    server: {
      port: 80,
      host: true,
      open: false,
      proxy: {
        // ✅ 关键：代理 /ai 开头的请求到后端
        '/ai': {
          target: 'http://localhost:8086',
          changeOrigin: true,
          rewrite: (path) => path  // 保持原路径
        },
        // 代理 /dev-api 开头的请求
        '/dev-api': {
          target: 'http://localhost:8086',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/dev-api/, '')
        },
        // WebSocket 代理
        '/ws': {
          target: 'http://localhost:8086',
          ws: true,
          changeOrigin: true
        }
      }
    },
    css: {
      postcss: {
        plugins: [
          {
            postcssPlugin: 'internal:charset-removal',
            AtRule: {
              charset: (atRule) => {
                if (atRule.name === 'charset') {
                  atRule.remove();
                }
              }
            }
          }
        ]
      }
    }
  }
})