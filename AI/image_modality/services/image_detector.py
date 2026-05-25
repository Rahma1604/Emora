# -*- coding: utf-8 -*-
import os
import cv2
from AI.image_modality.services.predict import predict_emotion_from_frame, trigger_expert_system


def detect_image(image_path):
    if os.path.exists(image_path):
        raw_img = cv2.imread(image_path)
        emotion, conf = predict_emotion_from_frame(raw_img)

        print("\n" + "=" * 40)
        print(f"AI Model Output  : {emotion} ({conf:.2f}%)")
        print("=" * 40)

        print("\nTriggering Emora Knowledge Base Decision...")
        trigger_expert_system(emotion)
        print("=" * 40)
    else:
        print(f"❌ Error: Cannot find image file at:\n-> {image_path}")