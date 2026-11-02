from fastapi import FastAPI
from routers.lab1 import router as lab1_router
from routers.lab2 import router as lab2_router

app = FastAPI(title="Optiq API")
app.include_router(lab1_router)
app.include_router(lab2_router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "message": "Optiq backend is connected",
    }
