# Updated points :
# 1- Uses the image class order from image_modality constants file "CLASS_NAMES".
# 2- Returns confidence and reliability for each image analysis and text analysis.
# 3- Prevents empty text from being analyzed or added to the tracker.
# 4- Extracts behavioral contexts from valid text input.
# 5- Returns a normalized "analyses" list for backend database storage.
# 6- Keeps diagnostic and report results from the tracker in the response.

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
from image_modality.utils.constants import (
    CLASS_NAMES,
    CONF_THRESHOLD as IMAGE_CONF_THRESHOLD
)
from text_modality.services.predict import predict_emotion_from_text
from expert_system.tracker_service import TrackerService, _extract_context

from report_generation.schemas import (
    GeneratedReportResponse,
    ReportRequest,
)
from report_generation.report_service import generate_report


app = FastAPI()
model = load_model()


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

        img_predictions = model.predict(img_array, verbose=0)

        img_index = int(np.argmax(img_predictions[0]))
        img_confidence = float(img_predictions[0][img_index] * 100)
        img_emotion = CLASS_NAMES[img_index]

        img_is_reliable = img_confidence >= IMAGE_CONF_THRESHOLD

        if not img_is_reliable:
            img_emotion = "unknown"


        cleaned_text = text.strip()

        if cleaned_text:
            text_emotion, text_confidence = predict_emotion_from_text(cleaned_text)

            text_confidence = float(text_confidence)
            text_is_reliable = text_emotion != "unknown"
            contexts = _extract_context(cleaned_text)

        else:
            text_emotion = "unknown"
            text_confidence = 0.0
            text_is_reliable = False
            contexts = []


        tracker_result = None

        if cleaned_text:
            if child_id not in trackers:
                trackers[child_id] = TrackerService(child_id=child_id)

            tracker = trackers[child_id]

            tracker_result = tracker.update(
                emotion=text_emotion,
                text=cleaned_text
            )



        analyses = [
            {
                "modality": "image",
                "emotion": img_emotion,
                "confidence": round(img_confidence, 2),
                "content": "",
                "contexts": [],
                "isReliable": img_is_reliable
            }
        ]

        if cleaned_text:
            analyses.append(
                {
                    "modality": "text",
                    "emotion": text_emotion,
                    "confidence": round(text_confidence, 2),
                    "content": cleaned_text,
                    "contexts": contexts,
                    "isReliable": text_is_reliable
                }
            )


        if tracker_result:
            diagnostic_result = tracker_result.get(
            "diagnostic",
            {"diagnosis": "تحت المتابعة"}
            )
        else:
            diagnostic_result = {
            "diagnosis": "تحت المتابعة"
            }


        save_data()

        return {
            "status": "success",
            "child_id": child_id,

            "image_analysis": {
            "emotion": img_emotion,
            "confidence": round(img_confidence, 2),
            "isReliable": img_is_reliable
            },

            "text_analysis": {
            "emotion": text_emotion,
            "confidence": round(text_confidence, 2),
            "content": cleaned_text,
            "contexts": contexts,
            "isReliable": text_is_reliable
            },

            "analyses": analyses,

            "diagnostic_result": diagnostic_result,

            "reports": tracker_result
        }



    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post(
    "/generate-report",
    response_model=GeneratedReportResponse,
)
async def generate_report_endpoint(
    request: ReportRequest,
):
    try:
        return generate_report(request)
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Report generation error: {str(error)}",
        )
