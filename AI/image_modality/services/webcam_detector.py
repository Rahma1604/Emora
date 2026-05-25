# -*- coding: utf-8 -*-
import cv2
from AI.image_modality.services.predict import predict_emotion_from_frame


def run_webcam():
    print("\n🎥 Opening Webcam... Press 'q' on your keyboard to close the stream.")
    cap = cv2.VideoCapture(0)


    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Error: Grab frame failed.")
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        for (x, y, w, h) in faces:
            face_roi = frame[y:y + h, x:x + w]
            emotion, conf = predict_emotion_from_frame(face_roi)


            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.putText(frame, f"{emotion} ({conf:.1f}%)", (x, y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        cv2.imshow('Emora AI Engine - Live Video Streaming', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()