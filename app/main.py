import logging
import uvicorn
from fastapi import FastAPI

from app.api.routes.api import limiter, router

logging.basicConfig(level="INFO")

app = FastAPI()
app.include_router(router)
app.state.limiter = limiter

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)