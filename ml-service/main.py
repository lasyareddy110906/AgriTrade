from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from model import predict_crop_price, analyze_crop_image, predict_shelf_life_days

app = FastAPI(title="AgriTrade AI Local ML Microservice", version="2.0.0")

class PriceRequest(BaseModel):
    cropName: Optional[str] = "Wheat"
    category: Optional[str] = "Grains"
    quantityKg: float = 1000.0
    gradeScore: int = 3
    moistureContentPercent: Optional[float] = 12.0
    region: Optional[str] = "North Region"

class ShelfLifeRequest(BaseModel):
    cropType: str = "Wheat"
    temperatureC: float = 22.0
    humidityPercent: float = 60.0

@app.get("/")
def home():
    return {
        "status": "ONLINE",
        "service": "AgriTrade AI ML Engine",
        "port": 8000,
        "capabilities": ["Crop Price Regression", "Computer Vision Pathology", "FEFO Shelf Life Optimization"]
    }

@app.post("/predict-price")
def predict_price_endpoint(data: PriceRequest):
    return predict_crop_price(
        crop_name=data.cropName or "Wheat",
        category=data.category or "Grains",
        quantity_kg=data.quantityKg,
        grade_score=data.gradeScore,
        moisture_content=data.moistureContentPercent or 12.0,
        region=data.region or "North Region"
    )

@app.post("/analyze-crop")
async def analyze_crop_endpoint(file: UploadFile = File(...)):
    contents = await file.read()
    return analyze_crop_image(filename=file.filename, image_bytes=contents)

@app.post("/predict-shelf-life")
def predict_shelf_life_endpoint(data: ShelfLifeRequest):
    return predict_shelf_life_days(
        crop_type=data.cropType,
        temperature_c=data.temperatureC,
        humidity_percent=data.humidityPercent
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)