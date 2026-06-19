# -*- coding: utf-8 -*-
import os
import numpy as np
import cv2
import tensorflow as tf
from huggingface_hub import hf_hub_download, login

from ..models.emora_model import load_model
from ..utils.preprocess import preprocess_frame
from ..utils.constants import CLASS_NAMES, CONF_THRESHOLD
from ...expert_system.emotion_rules import EmotionFact, EmoraExpertSystem

REPO_ID = "Emora-models/face-emotion-model"
FILENAME = "emora_pure_weights.weights.h5"

HF_TOKEN = os.getenv("HF_TOKEN")

print("🔐 Authenticating with Hugging Face Hub...")
if HF_TOKEN:
    login(token=HF_TOKEN, add_to_git_credential=False)
else:
    print("⚠️ Warning: No HF_TOKEN found in Environment Variables!")

print("🔄 Downloading model weights from Hugging Face Hub...")
downloaded_weights_path = hf_hub_download(repo_id=REPO_ID, filename=FILENAME, token=HF_TOKEN)

print("🔄 Building Emora Model Graph and injecting Hugging Face weights...")
model = load_model()

model.load_weights(downloaded_weights_path)
print("🎯 SUCCESS: Hugging Face weights injected into Emora model successfully! 🎉")


def predict_emotion_from_frame(frame):
    try:
        processed_array = preprocess_frame(frame)

        predictions = model.predict(processed_array, verbose=0)
        predicted_idx = np.argmax(predictions[0])
        predicted_emotion = CLASS_NAMES[predicted_idx]
        confidence = 100 * predictions[0][predicted_idx]

        if confidence < CONF_THRESHOLD:
            print(f"\n[System Note]: Low confidence ({confidence:.2f}% → {predicted_emotion}). Defaulting to 'unknown'.")
            predicted_emotion = 'unknown'
            confidence = 0.0

        return predicted_emotion, confidence

    except Exception as e:
        print(f"❌ Error during Hugging Face inference: {e}")
        return 'unknown', 0.0


def trigger_expert_system(emotion):
    engine = EmoraExpertSystem()
    engine.reset()
    engine.declare(EmotionFact(emotion=emotion))
    engine.run()