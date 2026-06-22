from fastapi import FastAPI, UploadFile, File, Form, HTTPException
import numpy as np
from PIL import Image
import io
import json
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

ai_dir = os.path.join(current_dir, "AI")
if os.path.exists(ai_dir) and ai_dir not in sys.path:
    sys.path.append(ai_dir)

from image_modality.models.emora_model import load_model
from text_modality.services.predict import predict_emotion_from_text
from expert_system.tracker_service import TrackerService

app = FastAPI()
model = load_model()

EMOTION_LABELS = ["Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise", "Neutral"]
DATA_FILE = "child_data.json"

trackers = {}
if os.path.exists(DATA_FILE):
    with open(DATA_FILE, "r") as f:
        data = json.load(f)


def save_data():
    with open(DATA_FILE, "w") as f:
        json.dump(trackers, f, default=str)


@app.post("/predict")
async def predict(
        child_id: str = Form(...),
        text: str = Form(...),
        file: UploadFile = File(...)
):
    try:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        image = image.resize((224, 224))
        img_array = np.array(image) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        img_predictions = model.predict(img_array)
        img_emotion = EMOTION_LABELS[np.argmax(img_predictions[0])]

        text_emotion, text_conf = predict_emotion_from_text(text)

        if child_id not in trackers:
            trackers[child_id] = TrackerService(child_id=child_id)

        tracker = trackers[child_id]
        diagnostic_result = tracker.update(emotion=text_emotion, text=text)

        save_data()

        return {
            "status": "success",
            "image_analysis": {"emotion": img_emotion},
            "text_analysis": {"emotion": text_emotion, "confidence": float(text_conf)},
            "diagnostic_result": diagnostic_result if diagnostic_result else {"diagnosis": "تحت المتابعة"}
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")