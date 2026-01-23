import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // 환경변수 로드
  const env = loadEnv(mode, process.cwd(), '');

  // 백엔드 포트 (환경변수 또는 기본값 8000)
  const backendPort = env.VITE_BACKEND_PORT || '8000';
  const backendUrl = `http://localhost:${backendPort}`;

  console.log(`[Vite] Proxy target: ${backendUrl}`);

  return {
    // 1. "process is not defined" 에러 방지
    define: {
      'process.env': {}
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
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
          target: backendUrl,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
