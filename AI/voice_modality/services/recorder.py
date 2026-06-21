import sounddevice as sd
from scipy.io.wavfile import write
from pathlib import Path


def record_audio(filename="recorded.wav", sample_rate=16000):

    output_path = Path(filename)

    input("🎤 اضغطي Enter لبدء التسجيل...")

    print("🔴 Recording... اضغطي Enter للإيقاف")

    recording = []

    def callback(indata, frames, time, status):
        recording.append(indata.copy())

    with sd.InputStream(
            samplerate=sample_rate,
            channels=1,
            dtype="int16",
            callback=callback
    ):
        input()

    import numpy as np

    audio_data = np.concatenate(recording, axis=0)

    write(output_path, sample_rate, audio_data)

    print(f"✅ Audio saved: {output_path}")

    return str(output_path)