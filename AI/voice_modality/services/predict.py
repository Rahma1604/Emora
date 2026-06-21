from AI.voice_modality.services.speech_to_text import audio_to_text
from AI.text_modality.services.predict import predict_emotion_from_text


def predict_emotion_from_voice(audio_path):

    text = audio_to_text(audio_path)

    emotion, confidence = predict_emotion_from_text(text)

    return {
        "text": text,
        "emotion": emotion,
        "confidence": float(confidence)
    }