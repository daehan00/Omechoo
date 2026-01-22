from fastapi import APIRouter
from datetime import datetime

router = APIRouter(tags=["system"])


@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat()
    }
