import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // 환경변수 로드
  const env = loadEnv(mode, process.cwd(), '');
  const rootDir = fileURLToPath(new URL('.', import.meta.url));

  // 백엔드 오리진 (환경변수 또는 로컬 기본값)
  const backendOrigin = env.VITE_BACKEND_ORIGIN || `http://localhost:${env.VITE_BACKEND_PORT || '8000'}`;

  console.log(`[Vite] Proxy target: ${backendOrigin}`);

  return {
    // 1. "process is not defined" 에러 방지
    define: {
      'process.env': {}
    },
    resolve: {
      alias: {
        '@recoco/core': resolve(rootDir, 'packages/core/src/index.js')
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        input: {
          app: resolve(rootDir, 'index.html')
        }
      },
      commonjsOptions: {
        // 2. CommonJS 라이브러리(exif-js 등) 호환성 해결
        transformMixedEsModules: true,
      },
    },
    server: {
      open: true,
      // FastAPI 백엔드 프록시 설정
      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
