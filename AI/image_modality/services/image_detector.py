# -*- coding: utf-8 -*-
import os
import cv2

# ✅ Relative imports
from .predict import predict_emotion_from_frame, trigger_expert_system


def detect_image(image_path=None):

    if image_path is None:
        image_path = input("\n📂 Enter the full path to the image file: ").strip()

    if not os.path.exists(image_path):
        print(f"❌ Error: Image not found at:\n   → {image_path}")
        return

    raw_img = cv2.imread(image_path)

    if raw_img is None:
        print(f"❌ Error: Could not read image (unsupported format or corrupted file):\n   → {image_path}")
        return

    emotion, conf = predict_emotion_from_frame(raw_img)

    print("\n" + "=" * 40)
    if emotion == 'unknown':
        print(f"  AI Model Output  : {emotion.upper()} (low confidence)")
    else:
        print(f"  AI Model Output  : {emotion.upper()} ({conf:.2f}%)")
    print("=" * 40)

    print("\nTriggering Emora Knowledge Base Decision...")
    trigger_expert_system(emotion)
    print("=" * 40)
