from fastapi import FastAPI, UploadFile, File, Form, HTTPException
import numpy as np
from PIL import Image
import io
import json
import os
import sys
import shutil

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path: sys.path.append(current_dir)
ai_dir = os.path.join(current_dir, "AI")
if os.path.exists(ai_dir) and ai_dir not in sys.path: sys.path.append(ai_dir)

from image_modality.models.emora_model import load_model
from image_modality.utils.constants import CLASS_NAMES, CONF_THRESHOLD as IMAGE_CONF_THRESHOLD
from text_modality.services.predict import predict_emotion_from_text
from voice_modality.services.predict import predict_emotion_from_voice
from expert_system.tracker_service import TrackerService, _extract_context
from report_generation.schemas import GeneratedReportResponse, ReportRequest
from report_generation.report_service import generate_report

app = FastAPI()
model = load_model()

DATA_FILE = "child_data.json"
trackers = {}
if os.path.exists(DATA_FILE):
    with open(DATA_FILE, "r") as f: trackers = json.load(f)

def save_data():
    with open(DATA_FILE, "w") as f: json.dump(trackers, f, default=str)

@app.post("/predict")
async def predict(
    child_id: str = Form(...),
    text: str = Form(None),
    file: UploadFile = File(None),
    audio: UploadFile = File(None)
):
    try:
        analyses = []
        final_text = text.strip() if text else ""
        tracker_result = None
        diagnostic_result = {"diagnosis": "تحت المتابعة"}

        # 1. معالجة الصوت
        if audio:
            temp_path = f"temp_audio_{child_id}.wav"
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(audio.file, buffer)
            voice_res = predict_emotion_from_voice(temp_path)
            os.remove(temp_path)
            if not final_text:
                final_text = voice_res["text"].strip()
            analyses.append({
                "modality": "voice",
                "emotion": voice_res["emotion"],
                "confidence": round(float(voice_res["confidence"]), 2),
                "content": voice_res["text"],
                "contexts": [],
                "isReliable": voice_res["confidence"] > 0.5
            })

        # 2. معالجة النص
        if final_text:
            text_emotion, text_conf = predict_emotion_from_text(final_text)
            text_is_reliable = text_emotion != "unknown"
            contexts = _extract_context(final_text)
            if child_id not in trackers: trackers[child_id] = TrackerService(child_id=child_id)
            tracker_result = trackers[child_id].update(emotion=text_emotion, text=final_text)
            if tracker_result and "diagnostic" in tracker_result:
                diagnostic_result = tracker_result["diagnostic"]
            analyses.append({
                "modality": "text",
                "emotion": text_emotion,
                "confidence": round(float(text_conf), 2),
                "content": final_text,
                "contexts": contexts,
                "isReliable": text_is_reliable
            })

        if file:
            image_data = await file.read()
            image = Image.open(io.BytesIO(image_data)).convert('RGB').resize((224, 224))
            img_array = np.expand_dims(np.array(image) / 255.0, axis=0)
            img_predictions = model.predict(img_array, verbose=0)
            img_index = int(np.argmax(img_predictions[0]))
            img_confidence = float(img_predictions[0][img_index] * 100)
            img_is_reliable = img_confidence >= IMAGE_CONF_THRESHOLD
            img_emotion = CLASS_NAMES[img_index] if img_is_reliable else "unknown"
            
            analyses.append({
                "modality": "image",
                "emotion": img_emotion,
                "confidence": round(img_confidence, 2),
                "content": "",
                "contexts": [],
                "isReliable": img_is_reliable
            })

        save_data()
        return {
            "status": "success",
            "child_id": child_id,
            "analyses": analyses,
            "diagnostic_result": diagnostic_result,
            "reports": tracker_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/generate-report", response_model=GeneratedReportResponse)
async def generate_report_endpoint(request: ReportRequest):
    try: return generate_report(request)
    except Exception as error: raise HTTPException(status_code=500, detail=str(error))