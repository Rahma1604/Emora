import whisper

whisper_model = whisper.load_model("small")


def audio_to_text(audio_path):

    result = whisper_model.transcribe(
        audio_path,
        task="transcribe",
        fp16=False
    )

    return result["text"]


