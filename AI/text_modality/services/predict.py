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
    'emora_text_model_final'
)


print("Loading Emora Text Model (CAMel-BERT)...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)

model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_PATH
)

model.eval()

print("🎯 SUCCESS: Text model loaded successfully! 🎉")



def clean_text(text):

    text = str(text).lower().strip()

    text = re.sub(
        r'http\S+|www\S+',
        '',
        text
    )

    text = re.sub(
        r'#\w+|@\w+',
        '',
        text
    )

    text = re.sub(
        r'\s+',
        ' ',
        text
    )

    return text



def keyword_boost(text):

    boost = {
        "happy": 0,
        "sad": 0,
        "angry": 0,
        "fear": 0,
        "surprise": 0
    }


    happy_words = [
        "فرحان",
        "فرحانة",
        "مبسوط",
        "مبسوطة",
        "سعيد",
        "سعيدة",
        "سعادة",
        "فرحت",
        "مبسوط",
        "مبسوطه",
        "بحب",
        "جميل",
        "رائع",
        "نجحت",
        "كسبت",
        "happy",
        "great",
        "wonderful",
        "glad",
        "love"
    ]


    sad_words = [
        "زعلان",
        "حزين",
        "وحيد",
        "لوحدي",
        "بعيط",
        "اعيط",
        "مخنوق",
        "تعبت",
        "مش عايز اتكلم",
        "sad",
        "alone",
        "lonely"
    ]


    angry_words = [
        "غاضب",
        "متعصب",
        "اتخنقت",
        "بكره",
        "كرهت",
        "هضرب",
        "مستفز",
        "angry",
        "mad",
        "hate",
        "fuck",
        "shit"
    ]


    fear_words = [
        "خايف",
        "خفت",
        "مرعوب",
        "قلقان",
        "مش آمن",
        "scared",
        "afraid",
        "fear"
    ]


    for w in happy_words:
        if w in text:
            boost["happy"] += 3


    for w in sad_words:
        if w in text:
            boost["sad"] += 3


    for w in angry_words:
        if w in text:
            boost["angry"] += 3


    for w in fear_words:
        if w in text:
            boost["fear"] += 3


    return boost



def predict_emotion_from_text(text: str):

    cleaned = clean_text(text)


    inputs = tokenizer(
        cleaned,
        return_tensors="pt",
        truncation=True,
        max_length=128,
        padding=True
    )


    with torch.no_grad():

        logits = model(**inputs).logits

        probs = torch.softmax(
            logits,
            dim=1
        )[0]



    scores = {
        emotion: float(prob)
        for emotion, prob in zip(CLASSES, probs)
    }


    boosts = keyword_boost(cleaned)



    for emotion, value in boosts.items():

        scores[emotion] += value / 100



    total = sum(scores.values())

    for k in scores:
        scores[k] /= total



    print("\n📊 All Probabilities:")

    for emotion in CLASSES:

        print(
            f"{emotion:<10}: {scores[emotion]*100:.2f}%"
        )


    emotion = max(
        scores,
        key=scores.get
    )


    confidence = scores[emotion] * 100



    if confidence < CONF_THRESHOLD:

        emotion = "neutral"



    return emotion, round(confidence,2)




def trigger_expert_system(emotion):

    engine = EmoraExpertSystem()

    engine.reset()

    engine.declare(
        EmotionFact(
            emotion=emotion
        )
    )

    engine.run()