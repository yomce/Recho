import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/

export default defineConfig(({ mode }) => { // 👈 함수형으로 변경합니다.
  // 현재 작업 디렉터리의 .env 파일을 로드합니다.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss(), tsconfigPaths()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          // 👇 env 객체에서 VITE_API_BASE_URL을 가져와 사용합니다.
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, ""),
          secure: false,
          ws: true,
        },
      },
    },
  };
});