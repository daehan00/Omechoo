from fastapi import APIRouter
from slowapi import Limiter
from slowapi.util import get_remote_address


router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/menu")
@limiter.limit("3/minute")
def recommend_menu():
    return {}

@router.get("/sikdang")
@limiter.limit("3/minute")
def select_sikdang():
    return {}

@router.get("/share")
def share_sikdang():
    return {}

@router.get("/health")
def health():
    return {"status": "ok"}