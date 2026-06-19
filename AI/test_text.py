# -*- coding: utf-8 -*-
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'AI'))

from text_modality.services.predict import (
    predict_emotion_from_text,
    trigger_expert_system
)

print("=" * 50)
print("🧠 EMORA TEXT MODALITY")
print("=" * 50)
print()
while True:
    text = input(
        #"🧠 Emora:\n"
        "Hello! I'm here to understand how you're feeling.\n"
        "مرحباً! أنا هنا عشان أفهم شعورك.\n"
        "💬 Your message | رسالتك: "
    )
    if text.lower() == "exit":
        break

    emotion, conf = predict_emotion_from_text(text)

    print(f"\nEmotion: {emotion}")
    print(f"Confidence: {conf:.2f}%")

    print("\nExpert System Response:")
    trigger_expert_system(emotion)