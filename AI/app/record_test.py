from AI.voice_modality.services.recorder import record_audio
from AI.voice_modality.services.predict import predict_emotion_from_voice


def main():

    audio_path = record_audio()

    result = predict_emotion_from_voice(audio_path)

    print("\n===== RESULT =====")
    print(f"Text    "
          f"   : {result['text']}")
    print(f"Emotion    : {result['emotion']}")
    print(f"Confidence : {result['confidence']:.2f}%")


if __name__ == "__main__":
    main()