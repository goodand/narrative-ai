import { defineConfig } from 'vite';

export default defineConfig({
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
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
