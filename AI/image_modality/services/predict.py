# -*- coding: utf-8 -*-
import numpy as np

# ✅ Relative imports — consistent وبتشتغل على أي جهاز
from ..models.emora_model import load_model
from ..utils.preprocess import preprocess_frame
from ..utils.constants import CLASS_NAMES, CONF_THRESHOLD
from ...expert_system.emotion_rules import EmotionFact, EmoraExpertSystem

model = load_model()


def predict_emotion_from_frame(frame):
    """
    تاخد frame (numpy array) وترجع (emotion_label, confidence_percentage).
    لو الـ confidence تحت الـ threshold ترجع 'unknown'.
    """
    processed_array = preprocess_frame(frame)

    predictions = model.predict(processed_array, verbose=0)
    predicted_idx = np.argmax(predictions[0])
    predicted_emotion = CLASS_NAMES[predicted_idx]
    confidence = 100 * predictions[0][predicted_idx]

    # 🔥 Smart Confidence Threshold
    if confidence < CONF_THRESHOLD:
        print(f"\n[System Note]: Low confidence ({confidence:.2f}% → {predicted_emotion}). Defaulting to 'unknown'.")
        predicted_emotion = 'unknown'
        confidence = 0.0  # ✅ أوضح من 100% — الموديل مش واثق

    return predicted_emotion, confidence


def trigger_expert_system(emotion):
    """تشغيل النظام الخبير وطباعة الرد المناسب للمشاعر."""
    engine = EmoraExpertSystem()
    engine.reset()
    engine.declare(EmotionFact(emotion=emotion))
    engine.run()
