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

    # --dev 플래그로 개발 모드 구분 (Reload 여부 결정)
    is_dev = "--dev" in sys.argv

    # LAN 노출 여부 결정 (User Strategy #4)
    # ALLOW_LAN=true 이면 0.0.0.0, 아니면 loopback(127.0.0.1)
    allow_lan = os.environ.get("ALLOW_LAN", "false").lower() == "true"
    host = "0.0.0.0" if allow_lan else "127.0.0.1"

    # 포트 충돌 시 자동 종료 (개발 모드에서만)
    if is_dev:
        kill_port(port)

    mode_str = "DEV MODE" if is_dev else "PROD MODE"
    access_str = "External Access Allowed" if allow_lan else "Local Only"
    print(f"🚀 [{mode_str} | {access_str}] RECOCO Backend starting on {host}:{port}")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=is_dev  # --dev 플래그일 때만 reload 활성화
    )


if __name__ == "__main__":
    main()
