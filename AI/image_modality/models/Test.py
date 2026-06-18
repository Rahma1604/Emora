# # -*- coding: utf-8 -*-
# import os
# import cv2
# import random
# import numpy as np
# import tensorflow as tf
# from tensorflow.keras.preprocessing import image
# import collections
# import collections.abc
#
# # Fixing Experta compatibility with Python 3.10+
# collections.Mapping = collections.abc.Mapping
# from experta import *
#
#
# # =====================================================================
# # 1. EMORA EXPERT SYSTEM RULES (EXPERTA)
# # =====================================================================
# class EmotionFact(Fact):
#     pass
#
#
# class EmoraExpertSystem(KnowledgeEngine):
#     @Rule(EmotionFact(emotion='happy'))
#     def respond_to_happy(self):
#         english = ["Wow! Your smile lights up the room! Keep shining! ✨", "That's a golden smile! 😄"]
#         arabic = ["واو! ضحكتك منورة المكان! خليك دايماً سعيد! ✨", "يا لها من ابتسامة ذهبية! ⭐"]
#         print(f"\n[Emora English]: {random.choice(english)}\n[Emora Arabic] : {random.choice(arabic)}")
#
#     @Rule(EmotionFact(emotion='sad'))
#     def respond_to_sad(self):
#         english = ["It's okay to feel sad sometimes. I'm here for you. ❤️", "Cheer up, buddy! 🌟"]
#         arabic = ["عادي إننا نزعل ساعات، أنا هنا جنبك وموجود عشانك. ❤️", "اضحك يا بطل! تحب أقول لك نكتة مضحكة؟ 🌟"]
#         print(f"\n[Emora English]: {random.choice(english)}\n[Emora Arabic] : {random.choice(arabic)}")
#
#     @Rule(EmotionFact(emotion='angry'))
#     def respond_to_angry(self):
#         english = ["Take a deep breath. Everything will be alright. 🧘‍♂️", "Calm down, buddy. 🌟"]
#         arabic = ["خذ نفساً عميقاً، كل شيء سيكون بخير. 🧘‍♂️", "عادي نغضب، بس تعال نهدأ شوية. 🎵"]
#         print(f"\n[Emora English]: {random.choice(english)}\n[Emora Arabic] : {random.choice(arabic)}")
#
#     @Rule(EmotionFact(emotion='neutral'))
#     def respond_to_neutral(self):
#         english = ["You look calm and peaceful. 🍃", "A nice, relaxed look! 🎮"]
#         arabic = ["شكلك هادي ورايق. أتمنى لك يوم لطيف! 🍃", "ملامح هادية وجميلة! أنا هنا لو تحب نتكلم سوا. 💭"]
#         print(f"\n[Emora English]: {random.choice(english)}\n[Emora Arabic] : {random.choice(arabic)}")
#
#     @Rule(EmotionFact(emotion=MATCH.any_emotion))
#     def respond_to_others(self, any_emotion):
#         if any_emotion not in ['happy', 'sad', 'angry', 'neutral']:
#             print(f"\n[Emora]: Oh, I spot a unique feeling! You look like you are feeling '{any_emotion}'. ✨")
#
#
# # =====================================================================
# # 2. LOAD RESNET50V2 MODEL
# # =====================================================================
# weights_path = r'D:\Emora\AI\models\emora_pure_weights.weights.h5'
# class_names = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
#
# print("Building pure ResNet50V2 graph backbone...")
# base_model = tf.keras.applications.ResNet50V2(weights=None, include_top=False, input_shape=(224, 224, 3))
# model = tf.keras.models.Sequential([
#     tf.keras.layers.Input(shape=(224, 224, 3)),
#     base_model,
#     tf.keras.layers.GlobalAveragePooling2D(),
#     tf.keras.layers.Dense(512, activation='relu'),
#     tf.keras.layers.BatchNormalization(),
#     tf.keras.layers.Dropout(0.5),
#     tf.keras.layers.Dense(256, activation='relu'),
#     tf.keras.layers.BatchNormalization(),
#     tf.keras.layers.Dropout(0.3),
#     tf.keras.layers.Dense(7, activation='softmax')
# ])
#
# if os.path.exists(weights_path):
#     model.load_weights(weights_path)
#     print("🎯 SUCCESS: High-Accuracy ResNet weights loaded! 🎉")
# else:
#     print(f"❌ CRITICAL ERROR: File not found at {weights_path}")
#     exit()
#
#
# # =====================================================================
# # 3. CORE PREDICTION FUNCTION (الـ Pipeline الموحد)
# # =====================================================================
# def predict_emotion_from_frame(frame):
#     # تحجيم الإطار ومعالجته رياضياً ليتطابق مع كاجل
#     resized_frame = cv2.resize(frame, (224, 224))
#     img_array = image.img_to_array(resized_frame)
#     img_array = np.expand_dims(img_array, axis=0)
#     img_array = (img_array / 127.5) - 1.0
#
#     predictions = model.predict(img_array, verbose=0)
#     predicted_idx = np.argmax(predictions[0])
#     predicted_emotion = class_names[predicted_idx]
#     confidence = 100 * predictions[0][predicted_idx]
#
#     # Smart Confidence Threshold
#     if confidence < 50:
#         return "uncertain"
#         confidence = 100.0
#
#     return predicted_emotion, confidence
#
#
# # =====================================================================
# # 4. INTERACTIVE INTERFACE (اختيار المود الفوري)
# # =====================================================================
# print("\n" + "=" * 40)
# print(" WELCOME TO EMORA MULTIMODAL ENGINE ")
# print("=" * 40)
# print("1. Predict from an Image File (فحص صورة)")
# print("2. Run Live Webcam Detection (تشغيل الكاميرا بث مباشر)")
# choice = input("Enter your choice (1 or 2): ").strip()
#
# if choice == "1":
#     img_path = r'D:\Emora\AI\models\PHOTO\child.jpg'  # غيري المسار للصورة المطلوبة
#     if os.path.exists(img_path):
#         raw_img = cv2.imread(img_path)
#         emotion, conf = predict_emotion_from_frame(raw_img)
#         print(f"\n🎯 Output: {emotion} ({conf:.2f}%)")
#
#         # تشغيل السيستم الخبير
#         engine = EmoraExpertSystem()
#         engine.reset()
#         engine.declare(EmotionFact(emotion=emotion))
#         engine.run()
#     else:
#         print(f"❌ Image not found at {img_path}")
#
# elif choice == "2":
#     print("\n🎥 Opening Webcam... Press 'q' to exit the camera stream.")
#     cap = cv2.VideoCapture(0)  # 0 للكاميرا المدمجة أو الخارجية الأساسية
#
#     # تحميل واجهة لتقطيع الوشوش للحفاظ على الأداء التفاعلي
#     face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
#
#     while True:
#         ret, frame = cap.read()
#         if not ret:
#             break
#
#         gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
#         faces = face_cascade.detectMultiScale(gray, 1.3, 5)
#
#         for (x, y, w, h) in faces:
#             # قص منطقة الوجه فقط لتمريرها للموديل لضمان قراءة صافية وملامح واضحة
#             face_roi = frame[y:y + h, x:x + w]
#             emotion, conf = predict_emotion_from_frame(face_roi)
#
#             # رسم مربع وكتابة التوقع على الشاشة لايف لاقناع الدكاترة
#             cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
#             cv2.putText(frame, f"{emotion} ({conf:.1f}%)", (x, y - 10),
#                         cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
#
#         cv2.imshow('Emora AI Engine - Live Video Streaming', frame)
#
#         # اضغطي حرف q على الكيبورد عشان تقفلي الكاميرا
#         if cv2.waitKey(1) & 0xFF == ord('q'):
#             break
#
#     cap.release()
#     cv2.destroyAllWindows()
# else:
#     print("❌ Invalid Choice!")