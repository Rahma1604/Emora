
import os
import sys


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from AI.image_modality.services.image_detector import detect_image
from AI.image_modality.services.webcam_detector import run_webcam


def main():
    print("\n" + "=" * 55)
    print("        🧠✨ WELCOME TO EMORA MULTIMODAL ENGINE ✨🧠")
    print("=" * 55)
    print("📷  1. Predict from an Image File")
    print("      (ابعتلي الصورة يلا… أنا مستنيك 👀)")
    print()
    print("🎥  2. Run Live Webcam Detection")
    print("      (شغل الكاميرا وخليني أحلل اللايف)")
    print("=" * 55)

    choice = input("\n👉 Enter your choice (1 or 2): ").strip()

    if choice == "1":
        print("\n🖼️ جاهز… ابعت مسار الصورة 😎")
        detect_image()

    elif choice == "2":
        print("\n🎥 Starting live webcam detection...")
        run_webcam()

    else:
        print("\n❌ اختيار غير صحيح!")
        print("شغل البرنامج تاني واختار 1 أو 2 ✨")


if __name__ == "__main__":
    main()