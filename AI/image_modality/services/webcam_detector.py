# -*- coding: utf-8 -*-
import cv2

# ✅ Relative import
from .predict import predict_emotion_from_frame, trigger_expert_system


def run_webcam():

    print("\n🎥 Opening Webcam...")
    print("   → Press 'q' to quit")
    print("   → Press 'e' to freeze last frame & trigger Expert System\n")

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("❌ Error: Cannot access webcam. Make sure it's connected and not used by another app.")
        return

    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )

    last_emotion = None

    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Error: Failed to grab frame from webcam.")
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

        for (x, y, w, h) in faces:
            face_roi = frame[y:y + h, x:x + w]

            emotion, conf = predict_emotion_from_frame(face_roi)
            last_emotion = emotion

            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

            label = (
                f"{emotion.upper()} (?)"
                if emotion == 'unknown'
                else f"{emotion.upper()} ({conf:.1f}%)"
            )

            cv2.putText(
                frame,
                label,
                (x, y - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 0),
                2
            )

        cv2.imshow(
            'Emora AI Engine - Live Detection  [Q: Quit | E: Freeze + Expert System]',
            frame
        )

        key = cv2.waitKey(1) & 0xFF

        # =========================
        # Quit
        # =========================
        if key == ord('q'):
            break

        # =========================
        # Freeze + Expert System
        # =========================
        elif key == ord('e'):

            if last_emotion is None:
                print("\n⚠️ No emotion detected yet!")
                continue

            print(f"\n🧠 Freezing frame with emotion: {last_emotion}")

            # حفظ آخر frame
            frozen_frame = frame.copy()

            # قفل الكاميرا والنافذة
            cap.release()
            cv2.destroyAllWindows()

            print("\n📤 Sending data to Expert System...")

            # إرسال الإيموشن (ممكن لاحقًا تبعتي frozen_frame كمان)
            trigger_expert_system(last_emotion)

            print("\n✅ Expert System triggered successfully.")
            return

    cap.release()
    cv2.destroyAllWindows()
    print("\n✅ Webcam session ended.")