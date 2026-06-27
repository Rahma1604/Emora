
# -*- coding: utf-8 -*-

from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Form,
    HTTPException,
)

from typing import Optional

import io
import json
import os
import shutil
import sys
import tempfile

import numpy as np

from PIL import Image


# =====================================================
# PATH CONFIGURATION
# =====================================================

CURRENT_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

PROJECT_DIR = os.path.dirname(
    CURRENT_DIR
)

if PROJECT_DIR not in sys.path:
    sys.path.insert(
        0,
        PROJECT_DIR,
    )

if CURRENT_DIR not in sys.path:
    sys.path.insert(
        0,
        CURRENT_DIR,
    )


# =====================================================
# AI IMPORTS
# =====================================================

from AI.image_modality.models.emora_model import (
    load_model,
)

from AI.image_modality.utils import (
    constants as image_constants,
)

from AI.text_modality.services.predict import (
    predict_emotion_from_text,
)

from AI.voice_modality.services.predict import (
    predict_emotion_from_voice,
)

from AI.expert_system.tracker_service import (
    TrackerService,
    _extract_context,
    get_child_state_for_db,
    load_child_from_db,
)

from report_generation.schemas import (
    GeneratedReportResponse,
    ReportRequest,
)

from report_generation.report_service import (
    generate_report,
)


# =====================================================
# IMAGE CONSTANTS
# =====================================================

CLASS_NAMES = getattr(
    image_constants,
    "CLASS_NAMES",
    getattr(
        image_constants,
        "CLASSES",
        [],
    ),
)

IMAGE_CONF_THRESHOLD = float(
    getattr(
        image_constants,
        "CONF_THRESHOLD",
        15.0,
    )
)


# =====================================================
# FASTAPI APPLICATION
# =====================================================

app = FastAPI(
    title="Emora AI Service",
    version="1.0.0",
)


# =====================================================
# LOAD IMAGE MODEL
# =====================================================

model = load_model()


# =====================================================
# TRACKER STORAGE
# =====================================================

DATA_FILE = os.path.join(
    CURRENT_DIR,
    "child_data.json",
)

trackers: dict[
    str,
    TrackerService,
] = {}


def load_saved_data() -> None:
    """
    Loads saved child states from child_data.json.
    """

    if not os.path.exists(
        DATA_FILE
    ):
        print(
            "[Tracker] No saved data file found."
        )

        return

    try:
        with open(
            DATA_FILE,
            "r",
            encoding="utf-8",
        ) as file:
            saved_data = json.load(
                file
            )

        if not isinstance(
            saved_data,
            dict,
        ):
            print(
                "[Tracker] Invalid saved data format."
            )

            return

        loaded_children = 0

        for (
            child_id,
            child_state,
        ) in saved_data.items():

            # Ignore corrupted old values
            # that were saved as strings.
            if not isinstance(
                child_state,
                dict,
            ):
                continue

            clean_child_id = str(
                child_id
            ).strip()

            if not clean_child_id:
                continue

            load_child_from_db(
                clean_child_id,
                child_state,
            )

            trackers[
                clean_child_id
            ] = TrackerService(
                child_id=
                    clean_child_id
            )

            loaded_children += 1

        print(
            "[Tracker] Loaded "
            f"{loaded_children} child state(s)."
        )

    except (
        json.JSONDecodeError,
        OSError,
        TypeError,
        ValueError,
    ) as error:
        print(
            "[Tracker] Could not load saved data:",
            str(error),
        )


def save_data() -> None:
    """
    Saves serializable child tracker states.
    """

    try:
        saved_data = {
            child_id:
                get_child_state_for_db(
                    child_id
                )
            for child_id in trackers
        }

        temporary_file = (
            DATA_FILE + ".tmp"
        )

        with open(
            temporary_file,
            "w",
            encoding="utf-8",
        ) as file:
            json.dump(
                saved_data,
                file,
                ensure_ascii=False,
                indent=2,
                default=str,
            )

        os.replace(
            temporary_file,
            DATA_FILE,
        )

    except (
        OSError,
        TypeError,
        ValueError,
    ) as error:
        print(
            "[Tracker] Could not save data:",
            str(error),
        )


load_saved_data()


# =====================================================
# HELPERS
# =====================================================

def normalize_confidence(
    value,
) -> float:
    """
    Supports:
    0.85 -> 85
    85   -> 85
    """

    try:
        confidence = float(
            value
        )

    except (
        TypeError,
        ValueError,
    ):
        return 0.0

    if (
        0 <= confidence <= 1
    ):
        confidence *= 100

    confidence = max(
        0.0,
        min(
            100.0,
            confidence,
        ),
    )

    return round(
        confidence,
        2,
    )


def normalize_emotion(
    value,
) -> str:
    emotion = str(
        value or "unknown"
    ).strip().lower()

    aliases = {
        "anger":
            "angry",

        "happiness":
            "happy",

        "sadness":
            "sad",

        "fearful":
            "fear",

        "surprised":
            "surprise",
    }

    return aliases.get(
        emotion,
        emotion,
    )


def get_audio_suffix(
    uploaded_file: UploadFile,
) -> str:
    filename = str(
        uploaded_file.filename
        or ""
    )

    suffix = os.path.splitext(
        filename
    )[1].lower()

    if suffix:
        return suffix

    content_type = str(
        uploaded_file.content_type
        or ""
    ).lower()

    if "wav" in content_type:
        return ".wav"

    if (
        "mpeg" in content_type
        or "mp3" in content_type
    ):
        return ".mp3"

    if (
        "mp4" in content_type
        or "m4a" in content_type
    ):
        return ".m4a"

    if "webm" in content_type:
        return ".webm"

    if "ogg" in content_type:
        return ".ogg"

    return ".m4a"


# =====================================================
# TEST ENDPOINTS
# =====================================================

@app.get("/")
async def root():
    return {
        "success":
            True,

        "message":
            "Emora AI service is running",
    }


@app.get("/health")
async def health():
    return {
        "success":
            True,

        "model_loaded":
            model is not None,

        "tracked_children":
            len(trackers),

        "data_file":
            DATA_FILE,
    }


# =====================================================
# PREDICT ENDPOINT
# =====================================================

@app.post("/predict")
async def predict(
    child_id: str = Form(...),

    text: Optional[str] = Form(
        None
    ),

    file: Optional[UploadFile] = File(
        None
    ),

    audio: Optional[UploadFile] = File(
        None
    ),
):
    clean_child_id = str(
        child_id or ""
    ).strip()

    final_text = str(
        text or ""
    ).strip()

    if not clean_child_id:
        raise HTTPException(
            status_code=400,
            detail=
                "child_id is required",
        )

    if (
        not final_text
        and file is None
        and audio is None
    ):
        raise HTTPException(
            status_code=400,
            detail=
                "Send text, an image, or an audio file.",
        )

    analyses = []

    tracker_result = None

    diagnostic_result = {
        "diagnosis":
            "تحت المتابعة",

        "risk":
            "Unknown",

        "details":
            "يلزم مزيد من التفاعلات للوصول إلى تشخيص أدق.",
    }

    audio_temp_path = None

    try:
        # =================================================
        # VOICE ANALYSIS
        # =================================================

        if audio is not None:
            audio_suffix = (
                get_audio_suffix(
                    audio
                )
            )

            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=audio_suffix,
            ) as temporary_audio:

                shutil.copyfileobj(
                    audio.file,
                    temporary_audio,
                )

                audio_temp_path = (
                    temporary_audio.name
                )

            voice_result = (
                predict_emotion_from_voice(
                    audio_temp_path
                )
            )

            if not isinstance(
                voice_result,
                dict,
            ):
                raise ValueError(
                    "Voice model returned an invalid response"
                )

            voice_text = str(
                voice_result.get(
                    "text",
                    "",
                )
            ).strip()

            voice_emotion = (
                normalize_emotion(
                    voice_result.get(
                        "emotion",
                        "unknown",
                    )
                )
            )

            voice_confidence = (
                normalize_confidence(
                    voice_result.get(
                        "confidence",
                        0,
                    )
                )
            )

            if (
                not final_text
                and voice_text
            ):
                final_text = (
                    voice_text
                )

            analyses.append(
                {
                    "modality":
                        "voice",

                    "emotion":
                        voice_emotion,

                    "confidence":
                        voice_confidence,

                    "content":
                        voice_text,

                    "contexts":
                        [],

                    "isReliable":
                        (
                            voice_emotion
                            != "unknown"
                            and
                            voice_confidence
                            > 0
                        ),
                }
            )

        # =================================================
        # TEXT ANALYSIS
        # =================================================

        if final_text:
            (
                text_emotion,
                raw_text_confidence,
            ) = predict_emotion_from_text(
                final_text
            )

            text_emotion = (
                normalize_emotion(
                    text_emotion
                )
            )

            text_confidence = (
                normalize_confidence(
                    raw_text_confidence
                )
            )

            contexts = _extract_context(
                final_text
            )

            if (
                clean_child_id
                not in trackers
            ):
                trackers[
                    clean_child_id
                ] = TrackerService(
                    child_id=
                        clean_child_id
                )

            tracker_result = trackers[
                clean_child_id
            ].update(
                emotion=
                    text_emotion,

                text=
                    final_text,
            )

            if (
                isinstance(
                    tracker_result,
                    dict,
                )
                and isinstance(
                    tracker_result.get(
                        "diagnostic"
                    ),
                    dict,
                )
            ):
                diagnostic_result = (
                    tracker_result[
                        "diagnostic"
                    ]
                )

            analyses.append(
                {
                    "modality":
                        "text",

                    "emotion":
                        text_emotion,

                    "confidence":
                        text_confidence,

                    "content":
                        final_text,

                    "contexts":
                        contexts,

                    "isReliable":
                        (
                            text_emotion
                            != "unknown"
                            and
                            text_confidence
                            > 0
                        ),
                }
            )

        # =================================================
        # IMAGE ANALYSIS
        # =================================================

        if file is not None:
            image_data = await file.read()

            if not image_data:
                raise ValueError(
                    "The uploaded image is empty"
                )

            image = (
                Image.open(
                    io.BytesIO(
                        image_data
                    )
                )
                .convert("RGB")
                .resize(
                    (224, 224)
                )
            )

            image_array = np.expand_dims(
                np.array(
                    image,
                    dtype=np.float32,
                ) / 255.0,

                axis=0,
            )

            image_predictions = (
                model.predict(
                    image_array,
                    verbose=0,
                )
            )

            image_index = int(
                np.argmax(
                    image_predictions[
                        0
                    ]
                )
            )

            image_confidence = (
                normalize_confidence(
                    image_predictions[
                        0
                    ][
                        image_index
                    ]
                )
            )

            image_is_reliable = (
                image_confidence
                >=
                IMAGE_CONF_THRESHOLD
            )

            if (
                image_is_reliable
                and
                image_index
                < len(
                    CLASS_NAMES
                )
            ):
                image_emotion = (
                    CLASS_NAMES[
                        image_index
                    ]
                )

            else:
                image_emotion = (
                    "unknown"
                )

            analyses.append(
                {
                    "modality":
                        "image",

                    "emotion":
                        image_emotion,

                    "confidence":
                        image_confidence,

                    "content":
                        "",

                    "contexts":
                        [],

                    "isReliable":
                        (
                            image_is_reliable
                            and
                            image_emotion
                            != "unknown"
                        ),
                }
            )

        # =================================================
        # SAVE TRACKER
        # =================================================

        save_data()

        tracker_progress = None

        if (
            clean_child_id
            in trackers
        ):
            tracker_progress = {
                "current_day":
                    trackers[
                        clean_child_id
                    ].get_current_day(),

                "current_scores":
                    trackers[
                        clean_child_id
                    ].get_current_scores(),
            }

        # =================================================
        # RESPONSE
        # =================================================

        return {
            "status":
                "success",

            "child_id":
                clean_child_id,

            "analyses":
                analyses,

            "diagnostic_result":
                diagnostic_result,

            "reports":
                tracker_result,

            "tracker_progress":
                tracker_progress,
        }

    except HTTPException:
        raise

    except Exception as error:
        print(
            "PREDICT ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail=
                f"Error: {str(error)}",
        ) from error

    finally:
        if (
            audio_temp_path
            and
            os.path.exists(
                audio_temp_path
            )
        ):
            try:
                os.remove(
                    audio_temp_path
                )

            except OSError as error:
                print(
                    "TEMP AUDIO DELETE ERROR:",
                    str(error),
                )


# =====================================================
# GENERATE REPORT ENDPOINT
# =====================================================

@app.post(
    "/generate-report",
    response_model=
        GeneratedReportResponse,
)
async def generate_report_endpoint(
    request: ReportRequest,
):
    try:
        return generate_report(
            request
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error

