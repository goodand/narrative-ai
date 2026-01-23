"""
RECOCO Backend Server Entry Point

Usage:
  - 로컬 개발: python run.py --dev (기본 포트 8000, reload 활성화)
  - 배포 환경: python run.py (PORT 환경변수 사용, reload 비활성화)

Environment Variables:
  - PORT: 서버 포트 (기본값: 8000)
"""

import os
import sys
import signal
import subprocess
import platform
import uvicorn


def kill_port(port: int) -> bool:
    """
    지정된 포트를 사용하는 프로세스 종료
    Returns: True if killed, False if no process found
    """
    system = platform.system()

    try:
        if system == "Darwin" or system == "Linux":  # macOS / Linux
            # 포트 사용 중인 PID 찾기
            result = subprocess.run(
                ["lsof", "-ti", f":{port}"],
                capture_output=True,
                text=True
            )
            pids = result.stdout.strip().split('\n')
            pids = [p for p in pids if p]  # 빈 문자열 제거

            if pids:
                for pid in pids:
                    os.kill(int(pid), signal.SIGKILL)
                print(f"⚠️  Port {port} was in use. Killed process(es): {', '.join(pids)}")
                return True

        elif system == "Windows":
            # Windows에서 포트 사용 프로세스 찾기
            result = subprocess.run(
                ["netstat", "-ano", "|", "findstr", f":{port}"],
                capture_output=True,
                text=True,
                shell=True
            )
            # Windows 처리는 복잡하므로 간단히 안내만
            if result.stdout:
                print(f"⚠️  Port {port} is in use on Windows. Please close it manually.")
                return False

    except Exception as e:
        print(f"⚠️  Could not check/kill port {port}: {e}")

    return False


def main():
    # 환경변수에서 포트 가져오기 (기본값: 8000)
    port = int(os.environ.get("PORT", 8000))

    # --dev 플래그로 개발 모드 구분
    is_dev = "--dev" in sys.argv

    # 포트 충돌 시 자동 종료 (개발 모드에서만)
    if is_dev:
        kill_port(port)

    if is_dev:
        print(f"🚀 [DEV MODE] RECOCO Backend starting on port {port}")
        uvicorn.run(
            "app.main:app",
            host="127.0.0.1",  # 로컬에서만 접근
            port=port,
            reload=True  # 코드 변경 시 자동 재시작
        )
    else:
        print(f"🚀 [PROD MODE] RECOCO Backend starting on port {port}")
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",  # 외부 접근 허용
            port=port,
            reload=False
        )


if __name__ == "__main__":
    main()
