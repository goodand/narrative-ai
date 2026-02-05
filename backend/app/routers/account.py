"""
Account Router
/api/v1/delete-account 엔드포인트
회원 탈퇴 처리
"""

import logging
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["account"])


class DeleteAccountRequest(BaseModel):
    """계정 삭제 요청 모델"""
    user_id: str
    reason: str = "not_specified"


class DeleteAccountResponse(BaseModel):
    """계정 삭제 응답 모델"""
    success: bool
    message: str


@router.post(
    "/delete-account",
    response_model=DeleteAccountResponse,
    summary="회원 탈퇴",
    description="사용자 계정을 Supabase에서 완전히 삭제합니다."
)
async def delete_account(body: DeleteAccountRequest):
    """
    회원 탈퇴 API

    - **user_id**: 삭제할 사용자 ID
    - **reason**: 탈퇴 사유 (선택)
    """
    settings = get_settings()

    # Supabase 설정 확인
    if not settings.supabase_url or not settings.supabase_service_role_key:
        logger.warning("Supabase credentials not configured")
        # 설정이 없어도 성공으로 반환 (프론트엔드에서 로그아웃은 완료됨)
        return DeleteAccountResponse(
            success=True,
            message="Logged out successfully (account deletion requires server configuration)"
        )

    try:
        logger.info(f"Account deletion request - User ID: {body.user_id}, Reason: {body.reason}")

        # Supabase Admin API를 통한 사용자 삭제
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{settings.supabase_url}/auth/v1/admin/users/{body.user_id}",
                headers={
                    "apikey": settings.supabase_service_role_key,
                    "Authorization": f"Bearer {settings.supabase_service_role_key}",
                    "Content-Type": "application/json"
                }
            )

            if response.status_code == 200 or response.status_code == 204:
                logger.info(f"Account deleted successfully: {body.user_id}")
                return DeleteAccountResponse(
                    success=True,
                    message="Account deleted successfully"
                )
            elif response.status_code == 404:
                logger.warning(f"User not found: {body.user_id}")
                return DeleteAccountResponse(
                    success=True,
                    message="User already deleted or not found"
                )
            else:
                logger.error(f"Supabase error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to delete account: {response.text}"
                )

    except httpx.RequestError as e:
        logger.error(f"Network error during account deletion: {e}")
        raise HTTPException(
            status_code=500,
            detail="Network error during account deletion"
        )
    except Exception as e:
        logger.error(f"Unexpected error during account deletion: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
