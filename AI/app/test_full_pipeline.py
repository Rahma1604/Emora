# -*- coding: utf-8 -*-

import sys, os

AI_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if AI_DIR not in sys.path:
    sys.path.insert(0, AI_DIR)

print("\n⏳ جاري تحميل NLP + Image models...")
from AI.text_modality.services.predict  import predict_emotion_from_text
from AI.image_modality.services.predict import predict_emotion_from_frame
from AI.expert_system.tracker_service   import (
    TrackerService, _get_child, _extract_context,
    run_diagnostic_engine,
    generate_mother_report, generate_doctor_report,
)
print("✅ NLP + Image جاهزين!\n")

_whisper_ready = False

def _ensure_whisper():
    global _whisper_ready
    if not _whisper_ready:
        print("⏳ جاري تحميل Whisper (أول مرة بس)...")
        import voice_modality.services.speech_to_text  # يشغّل load_model
        _whisper_ready = True
        print("✅ Whisper جاهز!")

SEP  = "─" * 58
SEP2 = "═" * 58



def handle_text() -> tuple[str, str]:
    text = input("  ✏️  اكتب كلام الطفل: ").strip()
    if not text:
        return "neutral", ""
    emotion, conf = predict_emotion_from_text(text)
    print(f"  🧠 NLP  →  {emotion}  ({conf:.1f}%)")
    return emotion, text


def handle_image() -> tuple[str, str]:
    import cv2
    print("  📷 هيفتح الكاميرا — اضغط SPACE للتقاط | ESC للإلغاء")
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("  ⚠️  مش قادر يفتح الكاميرا — هيسجل neutral")
        return "neutral", ""

    emotion = "neutral"
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        cv2.imshow("Emora — SPACE لالتقاط الصورة", frame)
        key = cv2.waitKey(1) & 0xFF
        if key == 32:      # SPACE
            emotion, conf = predict_emotion_from_frame(frame)
            print(f"  📷 Vision  →  {emotion}  ({conf:.1f}%)")
            break
        elif key == 27:    # ESC
            print("  ↩️  تم الإلغاء — هيسجل neutral")
            break

    cap.release()
    cv2.destroyAllWindows()
    return emotion, ""


def handle_voice() -> tuple[str, str]:
    _ensure_whisper()

    from AI.voice_modality.services.recorder import record_audio
    from AI.voice_modality.services.predict  import predict_emotion_from_voice

    audio_path = record_audio()                      # record_audio من recorder.py
    result     = predict_emotion_from_voice(audio_path)   # STT → NLP

    print(f"  📝 Whisper  →  \"{result['text']}\"")
    print(f"  🧠 NLP      →  {result['emotion']}  ({result['confidence']:.1f}%)")
    return result["emotion"], result["text"]


def handle_text_and_image() -> tuple[str, str]:
    print("  [نص أولاً]")
    text_emotion, text = handle_text()
    print("  [صورة ثانياً]")
    img_emotion, _     = handle_image()
    print(f"\n  📊 NLP={text_emotion}  |  Vision={img_emotion}")
    print(f"  → هيسجل NLP في الـ Tracker")
    return text_emotion, text




def print_reports(result: dict):
    d  = result["diagnostic"]
    m  = result["mother_report"]
    dr = result["doctor_report"]

    print(f"\n{SEP2}")
    print("📋  نتيجة دورة الـ 5 أيام")
    print(SEP2)
    print(f"  🔎 التشخيص  : {d['diagnosis']}")
    print(f"  ⚠️  الخطر    : {d['risk']}")
    print(f"  📝 التفاصيل : {d['details']}")

    print(f"\n  {SEP}")
    print("  ريبورت الأم 👩")
    print(f"  {SEP}")
    print(f"  📌 {m['title']}")
    print(f"  💬 {m['message']}")
    print("  💡 نصائح:")
    for tip in m["tips"]:
        print(f"       • {tip}")
    urgent = "🔴 نعم — تواصلي مع متخصص فوراً" if m["urgent"] else "🟢 لا"
    print(f"  🚨 عاجل؟  {urgent}")

    print(f"\n  {SEP}")
    print("  ريبورت الدكتور 🏥")
    print(f"  {SEP}")
    print(f"  🏷️  ICD-10           : {dr['icd10_code']}")
    print(f"  📋 ملاحظات سريرية  : {dr['clinical_notes']}")
    print(f"  🧪 تقييمات مقترحة  : {', '.join(dr['recommended_assessment']) or '—'}")
    print(f"  💊 خطة التدخل      : {dr['intervention_plan']}")
    print(f"  📊 نقاط خام        : {dr['raw_emotion_scores']}")
    print(f"  🔗 سياق سلوكي      : {list(dr['behavioral_context'].keys())}")
    print(SEP2)




def main():
    print(SEP2)
    print("🤖  Emora — Full Pipeline Test (Real Models)")
    print(SEP2)

    child_id   = input("🆔 child_id  (مثال: child_001) : ").strip() or "child_001"
    child_name = input("👤 اسم الطفل                  : ").strip() or "الطفل"
    cycle_days = 5

    tracker = TrackerService(child_id=child_id,
                             child_name=child_name,
                             cycle_days=cycle_days)

    print(f"\n✅ بدأت متابعة {child_name} — {cycle_days} أيام\n")

    day = 1
    while day <= cycle_days:
        print(f"\n{SEP}")
        print(f"📅  اليوم {day} / {cycle_days}  —  {child_name}")
        print(SEP)
        print("  النهارده هتبعت إيه؟")
        print("  [1] نص (text)")
        print("  [2] صورة (webcam)")
        print("  [3] صوت (voice)")
        print("  [4] نص + صورة")

        choice = input("\n  اختاري رقم: ").strip()

        if   choice == "1": emotion, text = handle_text()
        elif choice == "2": emotion, text = handle_image()
        elif choice == "3": emotion, text = handle_voice()
        elif choice == "4": emotion, text = handle_text_and_image()
        else:
            print("  ⚠️  اختيار غير صحيح — هيسجل neutral")
            emotion, text = "neutral", ""

        data      = _get_child(child_id)
        fake_date = f"2026-06-{day:02d}"

        if emotion in TrackerService.EMOTIONS:
            data["scores"][emotion] += 1
        if text:
            for ctx in _extract_context(text):
                data["context"][ctx] += 1
        if data["last_update_date"] != fake_date:
            data["current_day"] += 1
            data["last_update_date"] = fake_date

        print(f"\n  ✅ سُجِّل: {emotion}  |  يوم {data['current_day']}/{cycle_days}")
        print(f"  📊 النقاط: {dict(data['scores'])}")

        if data["current_day"] >= cycle_days:
            scores  = dict(data["scores"])
            context = dict(data["context"])
            diag    = run_diagnostic_engine(scores, context)
            mother  = generate_mother_report(diag, child_name, scores, fake_date)
            doctor  = generate_doctor_report(diag, child_name, child_id,
                                             scores, context,
                                             data["history"], fake_date)
            print_reports({"diagnostic": diag,
                           "mother_report": mother,
                           "doctor_report": doctor})

            again = input("🔄 دورة جديدة لنفس الطفل؟ (y/n): ").strip().lower()
            if again == "y":
                from collections import defaultdict
                data["scores"]           = defaultdict(int)
                data["context"]          = defaultdict(int)
                data["current_day"]      = 0
                data["last_update_date"] = None
                day = 0
                print(f"\n🔄 دورة جديدة بدأت لـ {child_name}\n")

        day += 1

    print(f"\n{SEP2}")
    print("✅  انتهى الاختبار")
    print(SEP2)


if __name__ == "__main__":
    main()