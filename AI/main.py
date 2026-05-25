
import os
from image_modality.services.image_detector import detect_image
from image_modality.services.webcam_detector import run_webcam


def main():
    print("\n" + "=" * 40)
    print(" WELCOME TO EMORA MULTIMODAL ENGINE ")
    print("=" * 40)
    print("1. Predict from an Image File (فحص صورة)")
    print("2. Run Live Webcam Detection (تشغيل الكاميرا بث مباشر)")

    choice = input("\nEnter your choice (1 or 2): ").strip()


    current_dir = os.path.dirname(os.path.abspath(__file__))

    if choice == "1":

        test_img_path = os.path.join(current_dir, 'image_modality', 'test', 'download (2).jpg')

        print(f"\n[System]: Loading target image from: {test_img_path}")
        detect_image(test_img_path)

    elif choice == "2":
        run_webcam()
    else:
        print("❌ Invalid Choice! Please run the script again and select 1 or 2.")


if __name__ == "__main__":
    main()