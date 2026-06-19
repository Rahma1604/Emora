# -*- coding: utf-8 -*-
import os
import re
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from arabert.preprocess import ArabertPreprocessor
from huggingface_hub import login


from ..utils.constants import CLASSES, CONF_THRESHOLD
from ...expert_system.emotion_rules import EmotionFact, EmoraExpertSystem


HF_TOKEN = "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"
MODEL_REPO = "Emora-models/text-emotion-model"

print("🔐 Authenticating with Hugging Face Hub...")
login(token=HF_TOKEN, add_to_git_credential=False)

print("🔄 Loading Emora Text Model (CAMeL-BERT) from Hugging Face Hub...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_REPO, token=HF_TOKEN)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_REPO, token=HF_TOKEN)
model.eval()

arabert_prep = ArabertPreprocessor(model_name="bert-base-arabertv2")
print("🎯 SUCCESS: CAMeL-BERT model loaded from Hugging Face successfully! 🎉")


def clean_text_arabic(text: str) -> str:
    text = str(text).strip()
    text = re.sub(r'http\S+|www\S+', '', text)
    text = re.sub(r'@\w+|#\w+', '', text)

    text = arabert_prep.preprocess(text)
    text = text.replace(" +", "").replace("+ ", "").replace("+", "")

    text = re.sub(r'\s+', ' ', text).strip()
    return text


def predict_emotion_from_text(text: str):

    text_lower = text.lower().strip()

    angry_slangs = [
        "fuck", "shit", "bitch", "damn", "go to hell",
        "asshole", "bastard", "dick", "piss off", "screw you",
        "shut up", "idiot", "stupid", "hate you", "fucker"
    ]
    if any(word in text_lower for word in angry_slangs):
        return "angry", 99.0

    sad_phrases = ["dead inside", "hopeless", "kill myself", "suicidal", "want to die"]
    if any(phrase in text_lower for phrase in sad_phrases):
        return "sad", 95.0

    if any(word in text_lower for word in ["بحب", "أحب", "بحب اكل", "بعشق"]):
        if not any(neg in text_lower for neg in ["مش", "مبقتش", "كرهت", "زعلان"]):
            return "happy", 90.0

    # حساب نسبة الحروف العربي للتأكد من اللغة
    arabic_chars = sum(1 for c in text if '\u0600' <= c <= '\u06FF')

    if arabic_chars > len(text) * 0.15:
        cleaned_text = clean_text_arabic(text)
    else:
        cleaned_text = text_lower
        cleaned_text = re.sub(r'http\S+|www\S+', '', cleaned_text)
        cleaned_text = re.sub(r'@\w+|#\w+', '', cleaned_text)
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()

    inputs = tokenizer(
        cleaned_text,
        return_tensors='pt',
        truncation=True,
        max_length=64,
        padding=True
    )

    with torch.no_grad():
        probs = torch.softmax(model(**inputs).logits, dim=1)[0]

    predicted_idx = torch.argmax(probs).item()
    confidence = float(probs[predicted_idx]) * 100
    predicted_emotion = CLASSES[predicted_idx]

    if confidence < CONF_THRESHOLD:
        print(f"\n[System Note]: Low confidence ({confidence:.2f}%). Defaulting to 'unknown'.")
        predicted_emotion = 'unknown'
        confidence = 0.0

    return predicted_emotion, round(confidence, 2)


def trigger_expert_system(emotion: str):
    engine = EmoraExpertSystem()
    engine.reset()
    engine.declare(EmotionFact(emotion=emotion))
    engine.run()