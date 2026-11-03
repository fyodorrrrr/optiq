from fastapi import FastAPI
from routers.lab1 import router as lab1_router
from routers.lab2 import router as lab2_router
from routers.lab3 import router as lab3_router
from routers.lab4 import router as lab4_router

from routers.lab5 import router as lab5_router

app = FastAPI(title="Optiq API")
app.include_router(lab1_router)
app.include_router(lab2_router)
app.include_router(lab3_router)
app.include_router(lab4_router)
app.include_router(lab5_router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "message": "Optiq backend is connected",
    }
