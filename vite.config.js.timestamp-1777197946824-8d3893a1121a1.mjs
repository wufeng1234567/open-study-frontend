// vite.config.js
import { defineConfig, loadEnv } from "file:///D:/OpenStudy/openstudy-vue3/node_modules/vite/dist/node/index.js";
import path2 from "path";

// vite/plugins/index.js
import vue from "file:///D:/OpenStudy/openstudy-vue3/node_modules/@vitejs/plugin-vue/dist/index.mjs";

// vite/plugins/auto-import.js
import autoImport from "file:///D:/OpenStudy/openstudy-vue3/node_modules/unplugin-auto-import/dist/vite.js";
function createAutoImport() {
  return autoImport({
    imports: [
      "vue",
      "vue-router",
      "pinia"
    ],
    dts: false
  });
}

// vite/plugins/svg-icon.js
import { createSvgIconsPlugin } from "file:///D:/OpenStudy/openstudy-vue3/node_modules/vite-plugin-svg-icons/dist/index.mjs";
import path from "path";
function createSvgIcon(isBuild) {
  return createSvgIconsPlugin({
    iconDirs: [path.resolve(process.cwd(), "src/assets/icons/svg")],
    symbolId: "icon-[dir]-[name]",
    svgoOptions: isBuild
  });
}

// vite/plugins/compression.js
import compression from "file:///D:/OpenStudy/openstudy-vue3/node_modules/vite-plugin-compression/dist/index.mjs";
function createCompression(env) {
  const { VITE_BUILD_COMPRESS } = env;
  const plugin = [];
  if (VITE_BUILD_COMPRESS) {
    const compressList = VITE_BUILD_COMPRESS.split(",");
    if (compressList.includes("gzip")) {
      plugin.push(
        compression({
          ext: ".gz",
          deleteOriginFile: false
        })
      );
    }
    if (compressList.includes("brotli")) {
      plugin.push(
        compression({
          ext: ".br",
          algorithm: "brotliCompress",
          deleteOriginFile: false
        })
      );
    }
  }
  return plugin;
}

// vite/plugins/setup-extend.js
import setupExtend from "file:///D:/OpenStudy/openstudy-vue3/node_modules/unplugin-vue-setup-extend-plus/dist/vite.js";
function createSetupExtend() {
  return setupExtend({});
}

// vite/plugins/index.js
function createVitePlugins(viteEnv, isBuild = false) {
  const vitePlugins = [vue()];
  vitePlugins.push(createAutoImport());
  vitePlugins.push(createSetupExtend());
  vitePlugins.push(createSvgIcon(isBuild));
  isBuild && vitePlugins.push(...createCompression(viteEnv));
  return vitePlugins;
}

// vite.config.js
var __vite_injected_original_dirname = "D:\\OpenStudy\\openstudy-vue3";
var vite_config_default = defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd());
  const { VITE_APP_ENV } = env;
  return {
    base: VITE_APP_ENV === "production" ? "/" : "/",
    plugins: createVitePlugins(env, command === "build"),
    resolve: {
      alias: {
        "~": path2.resolve(__vite_injected_original_dirname, "./"),
        "@": path2.resolve(__vite_injected_original_dirname, "./src")
      },
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"]
    },
    server: {
      port: 80,
      host: true,
      open: true,
      proxy: {
        // ✅ 关键：代理 /ai 开头的请求到后端
        "/ai": {
          target: "http://localhost:8086",
          changeOrigin: true,
          rewrite: (path3) => path3
          // 保持原路径
        },
        // 代理 /dev-api 开头的请求
        "/dev-api": {
          target: "http://localhost:8086",
          changeOrigin: true,
          rewrite: (path3) => path3.replace(/^\/dev-api/, "")
        }
      }
    },
    css: {
      postcss: {
        plugins: [
          {
            postcssPlugin: "internal:charset-removal",
            AtRule: {
              charset: (atRule) => {
                if (atRule.name === "charset") {
                  atRule.remove();
                }
              }
            }
          }
        ]
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAidml0ZS9wbHVnaW5zL2luZGV4LmpzIiwgInZpdGUvcGx1Z2lucy9hdXRvLWltcG9ydC5qcyIsICJ2aXRlL3BsdWdpbnMvc3ZnLWljb24uanMiLCAidml0ZS9wbHVnaW5zL2NvbXByZXNzaW9uLmpzIiwgInZpdGUvcGx1Z2lucy9zZXR1cC1leHRlbmQuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxPcGVuU3R1ZHlcXFxcb3BlbnN0dWR5LXZ1ZTNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXE9wZW5TdHVkeVxcXFxvcGVuc3R1ZHktdnVlM1xcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovT3BlblN0dWR5L29wZW5zdHVkeS12dWUzL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcclxuaW1wb3J0IGNyZWF0ZVZpdGVQbHVnaW5zIGZyb20gJy4vdml0ZS9wbHVnaW5zJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUsIGNvbW1hbmQgfSkgPT4ge1xyXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSlcclxuICBjb25zdCB7IFZJVEVfQVBQX0VOViB9ID0gZW52XHJcbiAgcmV0dXJuIHtcclxuICAgIGJhc2U6IFZJVEVfQVBQX0VOViA9PT0gJ3Byb2R1Y3Rpb24nID8gJy8nIDogJy8nLFxyXG4gICAgcGx1Z2luczogY3JlYXRlVml0ZVBsdWdpbnMoZW52LCBjb21tYW5kID09PSAnYnVpbGQnKSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICAnfic6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLycpLFxyXG4gICAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJylcclxuICAgICAgfSxcclxuICAgICAgZXh0ZW5zaW9uczogWycubWpzJywgJy5qcycsICcudHMnLCAnLmpzeCcsICcudHN4JywgJy5qc29uJywgJy52dWUnXVxyXG4gICAgfSxcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBwb3J0OiA4MCxcclxuICAgICAgaG9zdDogdHJ1ZSxcclxuICAgICAgb3BlbjogdHJ1ZSxcclxuICAgICAgcHJveHk6IHtcclxuICAgICAgICAvLyBcdTI3MDUgXHU1MTczXHU5NTJFXHVGRjFBXHU0RUUzXHU3NDA2IC9haSBcdTVGMDBcdTU5MzRcdTc2ODRcdThCRjdcdTZDNDJcdTUyMzBcdTU0MEVcdTdBRUZcclxuICAgICAgICAnL2FpJzoge1xyXG4gICAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo4MDg2JyxcclxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoICAvLyBcdTRGRERcdTYzMDFcdTUzOUZcdThERUZcdTVGODRcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vIFx1NEVFM1x1NzQwNiAvZGV2LWFwaSBcdTVGMDBcdTU5MzRcdTc2ODRcdThCRjdcdTZDNDJcclxuICAgICAgICAnL2Rldi1hcGknOiB7XHJcbiAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjgwODYnLFxyXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2Rldi1hcGkvLCAnJylcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBjc3M6IHtcclxuICAgICAgcG9zdGNzczoge1xyXG4gICAgICAgIHBsdWdpbnM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgcG9zdGNzc1BsdWdpbjogJ2ludGVybmFsOmNoYXJzZXQtcmVtb3ZhbCcsXHJcbiAgICAgICAgICAgIEF0UnVsZToge1xyXG4gICAgICAgICAgICAgIGNoYXJzZXQ6IChhdFJ1bGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChhdFJ1bGUubmFtZSA9PT0gJ2NoYXJzZXQnKSB7XHJcbiAgICAgICAgICAgICAgICAgIGF0UnVsZS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxPcGVuU3R1ZHlcXFxcb3BlbnN0dWR5LXZ1ZTNcXFxcdml0ZVxcXFxwbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxPcGVuU3R1ZHlcXFxcb3BlbnN0dWR5LXZ1ZTNcXFxcdml0ZVxcXFxwbHVnaW5zXFxcXGluZGV4LmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9PcGVuU3R1ZHkvb3BlbnN0dWR5LXZ1ZTMvdml0ZS9wbHVnaW5zL2luZGV4LmpzXCI7aW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXHJcblxyXG5pbXBvcnQgY3JlYXRlQXV0b0ltcG9ydCBmcm9tICcuL2F1dG8taW1wb3J0J1xyXG5pbXBvcnQgY3JlYXRlU3ZnSWNvbiBmcm9tICcuL3N2Zy1pY29uJ1xyXG5pbXBvcnQgY3JlYXRlQ29tcHJlc3Npb24gZnJvbSAnLi9jb21wcmVzc2lvbidcclxuaW1wb3J0IGNyZWF0ZVNldHVwRXh0ZW5kIGZyb20gJy4vc2V0dXAtZXh0ZW5kJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlVml0ZVBsdWdpbnModml0ZUVudiwgaXNCdWlsZCA9IGZhbHNlKSB7XHJcbiAgICBjb25zdCB2aXRlUGx1Z2lucyA9IFt2dWUoKV1cclxuICAgIHZpdGVQbHVnaW5zLnB1c2goY3JlYXRlQXV0b0ltcG9ydCgpKVxyXG5cdHZpdGVQbHVnaW5zLnB1c2goY3JlYXRlU2V0dXBFeHRlbmQoKSlcclxuICAgIHZpdGVQbHVnaW5zLnB1c2goY3JlYXRlU3ZnSWNvbihpc0J1aWxkKSlcclxuXHRpc0J1aWxkICYmIHZpdGVQbHVnaW5zLnB1c2goLi4uY3JlYXRlQ29tcHJlc3Npb24odml0ZUVudikpXHJcbiAgICByZXR1cm4gdml0ZVBsdWdpbnNcclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXE9wZW5TdHVkeVxcXFxvcGVuc3R1ZHktdnVlM1xcXFx2aXRlXFxcXHBsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXE9wZW5TdHVkeVxcXFxvcGVuc3R1ZHktdnVlM1xcXFx2aXRlXFxcXHBsdWdpbnNcXFxcYXV0by1pbXBvcnQuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L09wZW5TdHVkeS9vcGVuc3R1ZHktdnVlMy92aXRlL3BsdWdpbnMvYXV0by1pbXBvcnQuanNcIjtpbXBvcnQgYXV0b0ltcG9ydCBmcm9tICd1bnBsdWdpbi1hdXRvLWltcG9ydC92aXRlJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlQXV0b0ltcG9ydCgpIHtcclxuICAgIHJldHVybiBhdXRvSW1wb3J0KHtcclxuICAgICAgICBpbXBvcnRzOiBbXHJcbiAgICAgICAgICAgICd2dWUnLFxyXG4gICAgICAgICAgICAndnVlLXJvdXRlcicsXHJcbiAgICAgICAgICAgICdwaW5pYSdcclxuICAgICAgICBdLFxyXG4gICAgICAgIGR0czogZmFsc2VcclxuICAgIH0pXHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxPcGVuU3R1ZHlcXFxcb3BlbnN0dWR5LXZ1ZTNcXFxcdml0ZVxcXFxwbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxPcGVuU3R1ZHlcXFxcb3BlbnN0dWR5LXZ1ZTNcXFxcdml0ZVxcXFxwbHVnaW5zXFxcXHN2Zy1pY29uLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9PcGVuU3R1ZHkvb3BlbnN0dWR5LXZ1ZTMvdml0ZS9wbHVnaW5zL3N2Zy1pY29uLmpzXCI7aW1wb3J0IHsgY3JlYXRlU3ZnSWNvbnNQbHVnaW4gfSBmcm9tICd2aXRlLXBsdWdpbi1zdmctaWNvbnMnXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVTdmdJY29uKGlzQnVpbGQpIHtcclxuICAgIHJldHVybiBjcmVhdGVTdmdJY29uc1BsdWdpbih7XHJcblx0XHRpY29uRGlyczogW3BhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnc3JjL2Fzc2V0cy9pY29ucy9zdmcnKV0sXHJcbiAgICAgICAgc3ltYm9sSWQ6ICdpY29uLVtkaXJdLVtuYW1lXScsXHJcbiAgICAgICAgc3Znb09wdGlvbnM6IGlzQnVpbGRcclxuICAgIH0pXHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxPcGVuU3R1ZHlcXFxcb3BlbnN0dWR5LXZ1ZTNcXFxcdml0ZVxcXFxwbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxPcGVuU3R1ZHlcXFxcb3BlbnN0dWR5LXZ1ZTNcXFxcdml0ZVxcXFxwbHVnaW5zXFxcXGNvbXByZXNzaW9uLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9PcGVuU3R1ZHkvb3BlbnN0dWR5LXZ1ZTMvdml0ZS9wbHVnaW5zL2NvbXByZXNzaW9uLmpzXCI7aW1wb3J0IGNvbXByZXNzaW9uIGZyb20gJ3ZpdGUtcGx1Z2luLWNvbXByZXNzaW9uJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlQ29tcHJlc3Npb24oZW52KSB7XHJcbiAgICBjb25zdCB7IFZJVEVfQlVJTERfQ09NUFJFU1MgfSA9IGVudlxyXG4gICAgY29uc3QgcGx1Z2luID0gW11cclxuICAgIGlmIChWSVRFX0JVSUxEX0NPTVBSRVNTKSB7XHJcbiAgICAgICAgY29uc3QgY29tcHJlc3NMaXN0ID0gVklURV9CVUlMRF9DT01QUkVTUy5zcGxpdCgnLCcpXHJcbiAgICAgICAgaWYgKGNvbXByZXNzTGlzdC5pbmNsdWRlcygnZ3ppcCcpKSB7XHJcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9kb2MucnVveWkudmlwL3J1b3lpLXZ1ZS9vdGhlci9mYXEuaHRtbCNcdTRGN0ZcdTc1MjhnemlwXHU4OUUzXHU1MzhCXHU3RjI5XHU5NzU5XHU2MDAxXHU2NTg3XHU0RUY2XHJcbiAgICAgICAgICAgIHBsdWdpbi5wdXNoKFxyXG4gICAgICAgICAgICAgICAgY29tcHJlc3Npb24oe1xyXG4gICAgICAgICAgICAgICAgICAgIGV4dDogJy5neicsXHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlT3JpZ2luRmlsZTogZmFsc2VcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNvbXByZXNzTGlzdC5pbmNsdWRlcygnYnJvdGxpJykpIHtcclxuICAgICAgICAgICAgcGx1Z2luLnB1c2goXHJcbiAgICAgICAgICAgICAgICBjb21wcmVzc2lvbih7XHJcbiAgICAgICAgICAgICAgICAgICAgZXh0OiAnLmJyJyxcclxuICAgICAgICAgICAgICAgICAgICBhbGdvcml0aG06ICdicm90bGlDb21wcmVzcycsXHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlT3JpZ2luRmlsZTogZmFsc2VcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcGx1Z2luXHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxPcGVuU3R1ZHlcXFxcb3BlbnN0dWR5LXZ1ZTNcXFxcdml0ZVxcXFxwbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxPcGVuU3R1ZHlcXFxcb3BlbnN0dWR5LXZ1ZTNcXFxcdml0ZVxcXFxwbHVnaW5zXFxcXHNldHVwLWV4dGVuZC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovT3BlblN0dWR5L29wZW5zdHVkeS12dWUzL3ZpdGUvcGx1Z2lucy9zZXR1cC1leHRlbmQuanNcIjtpbXBvcnQgc2V0dXBFeHRlbmQgZnJvbSAndW5wbHVnaW4tdnVlLXNldHVwLWV4dGVuZC1wbHVzL3ZpdGUnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVTZXR1cEV4dGVuZCgpIHtcclxuICAgIHJldHVybiBzZXR1cEV4dGVuZCh7fSlcclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlRLFNBQVMsY0FBYyxlQUFlO0FBQy9TLE9BQU9BLFdBQVU7OztBQ0R1UixPQUFPLFNBQVM7OztBQ0FKLE9BQU8sZ0JBQWdCO0FBRTVULFNBQVIsbUJBQW9DO0FBQ3ZDLFNBQU8sV0FBVztBQUFBLElBQ2QsU0FBUztBQUFBLE1BQ0w7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0o7QUFBQSxJQUNBLEtBQUs7QUFBQSxFQUNULENBQUM7QUFDTDs7O0FDWDhTLFNBQVMsNEJBQTRCO0FBQ25WLE9BQU8sVUFBVTtBQUVGLFNBQVIsY0FBK0IsU0FBUztBQUMzQyxTQUFPLHFCQUFxQjtBQUFBLElBQzlCLFVBQVUsQ0FBQyxLQUFLLFFBQVEsUUFBUSxJQUFJLEdBQUcsc0JBQXNCLENBQUM7QUFBQSxJQUN4RCxVQUFVO0FBQUEsSUFDVixhQUFhO0FBQUEsRUFDakIsQ0FBQztBQUNMOzs7QUNUb1QsT0FBTyxpQkFBaUI7QUFFN1QsU0FBUixrQkFBbUMsS0FBSztBQUMzQyxRQUFNLEVBQUUsb0JBQW9CLElBQUk7QUFDaEMsUUFBTSxTQUFTLENBQUM7QUFDaEIsTUFBSSxxQkFBcUI7QUFDckIsVUFBTSxlQUFlLG9CQUFvQixNQUFNLEdBQUc7QUFDbEQsUUFBSSxhQUFhLFNBQVMsTUFBTSxHQUFHO0FBRS9CLGFBQU87QUFBQSxRQUNILFlBQVk7QUFBQSxVQUNSLEtBQUs7QUFBQSxVQUNMLGtCQUFrQjtBQUFBLFFBQ3RCLENBQUM7QUFBQSxNQUNMO0FBQUEsSUFDSjtBQUNBLFFBQUksYUFBYSxTQUFTLFFBQVEsR0FBRztBQUNqQyxhQUFPO0FBQUEsUUFDSCxZQUFZO0FBQUEsVUFDUixLQUFLO0FBQUEsVUFDTCxXQUFXO0FBQUEsVUFDWCxrQkFBa0I7QUFBQSxRQUN0QixDQUFDO0FBQUEsTUFDTDtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQ0EsU0FBTztBQUNYOzs7QUMzQnNULE9BQU8saUJBQWlCO0FBRS9ULFNBQVIsb0JBQXFDO0FBQ3hDLFNBQU8sWUFBWSxDQUFDLENBQUM7QUFDekI7OztBSkdlLFNBQVIsa0JBQW1DLFNBQVMsVUFBVSxPQUFPO0FBQ2hFLFFBQU0sY0FBYyxDQUFDLElBQUksQ0FBQztBQUMxQixjQUFZLEtBQUssaUJBQWlCLENBQUM7QUFDdEMsY0FBWSxLQUFLLGtCQUFrQixDQUFDO0FBQ2pDLGNBQVksS0FBSyxjQUFjLE9BQU8sQ0FBQztBQUMxQyxhQUFXLFlBQVksS0FBSyxHQUFHLGtCQUFrQixPQUFPLENBQUM7QUFDdEQsU0FBTztBQUNYOzs7QURkQSxJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLE1BQU0sUUFBUSxNQUFNO0FBQ2pELFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLENBQUM7QUFDdkMsUUFBTSxFQUFFLGFBQWEsSUFBSTtBQUN6QixTQUFPO0FBQUEsSUFDTCxNQUFNLGlCQUFpQixlQUFlLE1BQU07QUFBQSxJQUM1QyxTQUFTLGtCQUFrQixLQUFLLFlBQVksT0FBTztBQUFBLElBQ25ELFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUtDLE1BQUssUUFBUSxrQ0FBVyxJQUFJO0FBQUEsUUFDakMsS0FBS0EsTUFBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUN0QztBQUFBLE1BQ0EsWUFBWSxDQUFDLFFBQVEsT0FBTyxPQUFPLFFBQVEsUUFBUSxTQUFTLE1BQU07QUFBQSxJQUNwRTtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBO0FBQUEsUUFFTCxPQUFPO0FBQUEsVUFDTCxRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsVUFDZCxTQUFTLENBQUNBLFVBQVNBO0FBQUE7QUFBQSxRQUNyQjtBQUFBO0FBQUEsUUFFQSxZQUFZO0FBQUEsVUFDVixRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsVUFDZCxTQUFTLENBQUNBLFVBQVNBLE1BQUssUUFBUSxjQUFjLEVBQUU7QUFBQSxRQUNsRDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxLQUFLO0FBQUEsTUFDSCxTQUFTO0FBQUEsUUFDUCxTQUFTO0FBQUEsVUFDUDtBQUFBLFlBQ0UsZUFBZTtBQUFBLFlBQ2YsUUFBUTtBQUFBLGNBQ04sU0FBUyxDQUFDLFdBQVc7QUFDbkIsb0JBQUksT0FBTyxTQUFTLFdBQVc7QUFDN0IseUJBQU8sT0FBTztBQUFBLGdCQUNoQjtBQUFBLGNBQ0Y7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogWyJwYXRoIiwgInBhdGgiXQp9Cg==
