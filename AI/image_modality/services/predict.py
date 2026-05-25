
import numpy as np
from AI.image_modality.models.emora_model import load_model
from AI.image_modality.utils.preprocess import preprocess_frame
from AI.image_modality.utils.constants import CLASS_NAMES, CONF_THRESHOLD
from AI.expert_system.emotion_rules import EmotionFact, EmoraExpertSystem

model = load_model()


def predict_emotion_from_frame(frame):

    processed_array = preprocess_frame(frame)


    predictions = model.predict(processed_array, verbose=0)
    predicted_idx = np.argmax(predictions[0])
    predicted_emotion = CLASS_NAMES[predicted_idx]
    confidence = 100 * predictions[0][predicted_idx]

    # -----------------------------------------------------------------
    # 🔥 SMART CONFIDENCE THRESHOLD (الاعتراف بعدم المعرفة عند التشتت)
    # -----------------------------------------------------------------
    if confidence < CONF_THRESHOLD:
        print(
            f"\n[System Note]: Low confidence detection ({confidence:.2f}% as {predicted_emotion}). Defaulting to Unknown.")
        predicted_emotion = 'unknown'
        confidence = 100.0

    return predicted_emotion, confidence


def trigger_expert_system(emotion):
    engine = EmoraExpertSystem()
    engine.reset()
    engine.declare(EmotionFact(emotion=emotion))
    engine.run()