# -*- coding: utf-8 -*-
import cv2

# ✅ Relative import
from .predict import predict_emotion_from_frame, trigger_expert_system


def run_webcam():

    print("\n🎥 Opening Webcam...")
    print("   → Press 'q' or 'Q' to quit")
    print("   → Press 'e' or 'E' to freeze last frame & trigger Expert System\n")

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

        if key == ord('q') or key == ord('Q') or key == 27:
            print("\n👋 Quit signal received. Closing webcam...")
            break

        elif key == ord('e') or key == ord('E'):

            if last_emotion is None:
                print("\n⚠️ No emotion detected yet!")
                continue

            print(f"\n🧠 Freezing frame with emotion: {last_emotion}")

            frozen_frame = frame.copy()
            cap.release()
            cv2.destroyAllWindows()

            print("\n📤 Sending data to Expert System...")
            trigger_expert_system(last_emotion)

            print("\n✅ Expert System triggered successfully.")
            return

    cap.release()
    cv2.destroyAllWindows()
    print("\n✅ Webcam session ended.")