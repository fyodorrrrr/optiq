from fastapi import FastAPI

app = FastAPI(title="Optiq API")


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "message": "Optiq backend is connected",
    }
