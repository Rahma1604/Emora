# -*- coding: utf-8 -*-
"""
test_tracker.py — اختبار شامل لـ TrackerService + DiagnosticExpertSystem
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
يمكن تشغيله بدون موديلات — يختبر منطق الـ Expert System فقط.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from AI.expert_system.tracker_service import TrackerService, run_diagnostic_engine

SEPARATOR = "─" * 60


def run_scenario(title: str, interactions: list[tuple[str, str]]):
    """
    interactions: list of (emotion, text) — يحاكي 5 أيام من التفاعلات.
    """
    print(f"\n{'═'*60}")
    print(f"🧪  سيناريو: {title}")
    print(SEPARATOR)

    tracker = TrackerService(child_id=f"test_{title[:10]}", cycle_days=5)
    result = None

    for i, (emotion, text) in enumerate(interactions, 1):
        print(f"\n  📅 اليوم {i}: emotion={emotion!r}")
        print(f"       نص: {text!r}")
        result = tracker.update(emotion=emotion, text=text)

    if result:
        print(f"\n  ✅ نتيجة التشخيص النهائية:")
        print(f"     التشخيص : {result['diagnosis']}")
        print(f"     الخطر   : {result['risk']}")
        print(f"     التفاصيل: {result['details']}")
    else:
        print("\n  ⚠️  لم تكتمل الدورة (أقل من 5 تفاعلات)")
    print(SEPARATOR)


# ══════════════════════════════════════════════════════════════════════
# السيناريوهات
# ══════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("\n🤖  EMORA — Tracker & Expert System Test Suite")

    # 1. Depression
    run_scenario("Depression", [
        ("sad",     "أنا زهقان ومش عايز ألعب"),
        ("sad",     "ماليش لازمة وعايز أبقى لوحدي"),
        ("sad",     "بكيت من غير سبب وحاسس إني لوحدي"),
        ("neutral", "مش عارف أعمل إيه"),
        ("sad",     "حزين جداً ومش عايز أتكلم"),
    ])

    # 2. General Anxiety
    run_scenario("General Anxiety", [
        ("fear",    "خايف من بكرة وقلبي بيدق"),
        ("fear",    "دايماً قلقان ومش عارف ليه"),
        ("fear",    "بطني بتوجعني من الخوف"),
        ("neutral", "مش قادر أنام من القلق"),
        ("fear",    "خايف طول الوقت"),
    ])

    # 3. Separation Anxiety
    run_scenario("Separation Anxiety", [
        ("fear",    "خايف ماما تمشي وتسيبني"),
        ("fear",    "مش عايز أروح المدرسة لوحدي"),
        ("neutral", "بعيد عن ماما وبفضل قلقان"),
        ("sad",     "أنا وحيد في المدرسة"),
        ("neutral", "باكي عشان بابا مسافر"),
    ])

    # 4. PTSD
    run_scenario("PTSD", [
        ("fear",     "بفتكر الحادثة ومش بنام"),
        ("surprise", "الصوت العالي بيخوفني"),
        ("fear",     "عندي كوابيس من اللي اتعمل"),
        ("surprise", "صحيت مخضوض وبصرخ"),
        ("fear",     "مش قادر أنسى اللي حصل"),
    ])

    # 5. Eating Disorder
    run_scenario("Eating Disorder", [
        ("disgust", "قرفان من الأكل وما باكلش"),
        ("disgust", "برجع الأكل في بقي"),
        ("neutral", "مش جعان خالص"),
        ("sad",     "وزني نزل وما باكلش"),
        ("disgust", "الأكل ده قرف"),
    ])

    # 6. ODD
    run_scenario("ODD", [
        ("angry",   "مش هسمع الكلام خالص"),
        ("angry",   "مش هتمشي كلامك عليا"),
        ("angry",   "رافض أعمل اللي بتقوله"),
        ("neutral", "أنا حر وهعمل اللي أنا عايزه"),
        ("angry",   "مش هيمشي أمره عليا"),
    ])

    # 7. Conduct Disorder
    run_scenario("Conduct Disorder", [
        ("angry",   "ضربت القطة وكسرت ألعاب صاحبي"),
        ("angry",   "خناق في الفصل وشتيمة"),
        ("angry",   "خربت حاجة في البيت"),
        ("neutral", "ضربت صاحبي في المدرسة"),
        ("angry",   "بعمل الكلام ده دايماً"),
    ])

    # 8. ADHD
    run_scenario("ADHD", [
        ("neutral", "مش قادر أقعد ساكت في الفصل"),
        ("angry",   "المستر بيقول مش بركز"),
        ("neutral", "بنسى كشكولي دايماً"),
        ("angry",   "مش عارف أخلص الواجب"),
        ("neutral", "الفصل ممل ومش قادر أركز"),
    ])

    # 9. Healthy
    run_scenario("Healthy & Stable", [
        ("happy",   "لعبت كورة مع أصحابي"),
        ("happy",   "مبسوط وعملت الواجب"),
        ("neutral", "يوم عادي ومريح"),
        ("happy",   "أكلت كويس ونمت كويس"),
        ("neutral", "كل حاجة تمام"),
    ])

    print("\n✅  All scenarios tested successfully!")
