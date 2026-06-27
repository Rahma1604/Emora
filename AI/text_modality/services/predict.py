# -*- coding: utf-8 -*-
import os
import re
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from ..utils.constants import CLASSES, CONF_THRESHOLD

from AI.expert_system.emotion_rules import EmotionFact, EmoraExpertSystem

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    CURRENT_DIR,
    '..',
    'models',
    'emora_camel_model_prod_v5'
)

print("Loading Emora Text Model (CAMeL-BERT v5 - Production Mode)...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

print("🎯 SUCCESS: Text model loaded successfully! 🎉")

def clean_text(text):
    text = str(text).lower().strip()
    text = re.sub(r'http\S+|www\S+', '', text)
    text = re.sub(r'#\w+|@\w+', '', text)
    text = re.sub(r"[\u064B-\u0652]", "", text)
    text = re.sub(r'(.)\1+', r'\1\1', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def predict_emotion_from_text(text: str):
    cleaned = clean_text(text)

    danger_words = ["بيضربني", "بيضربونا", "يضربني", "ضربني", "بيضرب", "علقة", "بيضربوني"]
    if any(dw in cleaned for dw in danger_words):
        return "sad", 91.0

    if "مش مبسوط" in cleaned or "مش فرحان" in cleaned or "مش سعيد" in cleaned or "مش متفائل" in cleaned:
        return "sad", 85.0

    if "تروما" in cleaned or "trauma" in cleaned:
        return "fear", 80.0

    inputs = tokenizer(
        cleaned,
        return_tensors="pt",
        truncation=True,
        max_length=128,
        padding=True
    ).to(device)

    with torch.no_grad():
        logits = model(**inputs).logits
        probs = torch.softmax(logits, dim=1)[0]

    scores = {
        emotion: float(prob)
        for emotion, prob in zip(CLASSES, probs)
    }

    print("\n📊 All Probabilities:")
    for emotion in CLASSES:
        print(f"{emotion:<10}: {scores[emotion] * 100:.2f}%")

    emotion = max(scores, key=scores.get)
    confidence = scores[emotion] * 100

    if confidence < CONF_THRESHOLD:
        emotion = "unknown"

    return emotion, round(confidence, 2)

def trigger_expert_system(emotion):
    engine = EmoraExpertSystem()
    engine.reset()
    engine.declare(EmotionFact(emotion=emotion))
    engine.run()