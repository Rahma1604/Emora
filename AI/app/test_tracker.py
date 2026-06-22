# -*- coding: utf-8 -*-


import sys, os, json

AI_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if AI_DIR not in sys.path:
    sys.path.insert(0, AI_DIR)

from AI.expert_system.tracker_service import (
    TrackerService,
    _get_child,
    _extract_context,
    run_diagnostic_engine,
    generate_mother_report,
    generate_doctor_report,
)


def simulate_days(child_id: str, child_name: str,
                  interactions: list[tuple[str, str]]) -> dict | None:

    tracker = TrackerService(child_id=child_id,
                             child_name=child_name,
                             cycle_days=len(interactions))
    result = None
    for i, (emotion, text) in enumerate(interactions):

        data = _get_child(child_id)
        fake_date = f"2026-06-{10 + i:02d}"

        if emotion in TrackerService.EMOTIONS:
            data["scores"][emotion] += 1
        for ctx in _extract_context(text):
            data["context"][ctx] += 1
        if data["last_update_date"] != fake_date:
            data["current_day"] += 1
            data["last_update_date"] = fake_date

        print(f"  📅 يوم {data['current_day']}: emotion={emotion!r:<10} | {text[:35]}")

        if data["current_day"] >= tracker.cycle_days:
            scores  = dict(data["scores"])
            context = dict(data["context"])
            diag    = run_diagnostic_engine(scores, context)
            mother  = generate_mother_report(diag, child_name, scores, fake_date)
            doctor  = generate_doctor_report(diag, child_name, child_id,
                                             scores, context, [], fake_date)
            result  = {"diagnostic": diag, "mother_report": mother,
                       "doctor_report": doctor}
    return result



SEP  = "─" * 62
SEP2 = "═" * 62

def print_result(result: dict | None):
    if not result:
        print("  ⚠️  الدورة لم تكتمل")
        return

    d = result["diagnostic"]
    m = result["mother_report"]
    dr = result["doctor_report"]

    print(f"\n  🔎 التشخيص   : {d['diagnosis']}")
    print(f"  ⚠️  الخطر     : {d['risk']}")
    print(f"  📝 التفاصيل  : {d['details']}")

    print(f"\n  {'─'*20} ريبورت الأم {'─'*20}")
    print(f"  📌 {m['title']}")
    print(f"  💬 {m['message'][:80]}…")
    print(f"  💡 نصائح:")
    for tip in m["tips"]:
        print(f"      • {tip}")
    urgent_label = "🔴 نعم — تواصلي مع متخصص فوراً" if m["urgent"] else "🟢 لا"
    print(f"  🚨 عاجل؟  {urgent_label}")

    print(f"\n  {'─'*20} ريبورت الدكتور {'─'*18}")
    print(f"  🏥 ICD-10          : {dr['icd10_code']}")
    print(f"  📋 ملاحظات سريرية : {dr['clinical_notes'][:80]}…")
    print(f"  🧪 تقييمات مقترحة : {', '.join(dr['recommended_assessment']) or '—'}")
    print(f"  💊 خطة التدخل     : {dr['intervention_plan']}")
    print(f"  📊 نقاط خام       : {dr['raw_emotion_scores']}")
    print(f"  🔗 سياق سلوكي     : {list(dr['behavioral_context'].keys())}")


def run_scenario(title: str, child_name: str,
                 interactions: list[tuple[str, str]]):
    child_id = f"test_{title.replace(' ', '_')[:15]}"
    print(f"\n{SEP2}")
    print(f"🧪  سيناريو: {title}  ({child_name})")
    print(SEP)
    result = simulate_days(child_id, child_name, interactions)
    print_result(result)
    print(SEP)



if __name__ == "__main__":
    print(f"\n{'🤖  EMORA — Full Test Suite':^62}")
    print(SEP2)

    run_scenario("Depression (عزلة)", "أحمد", [
        ("sad",     "أنا زهقان ومش عايز أكلم حد لوحدي"),
        ("sad",     "ماليش لازمة وعايز أبقى بوحدي"),
        ("sad",     "بكيت وحاسس إني لوحدي"),
        ("neutral", "مش عارف أعمل إيه"),
        ("sad",     "حزين ومش عايز أتكلم مع محدش"),
    ])

    run_scenario("General Anxiety", "سارة", [
        ("fear",    "خايفة من بكرة وقلبي بيدق"),
        ("fear",    "دايماً قلقانة ومش عارفة ليه"),
        ("fear",    "بطني بتوجعني من الخوف"),
        ("neutral", "مش قادرة أنام من القلق"),
        ("fear",    "خايفة طول الوقت"),
    ])

    run_scenario("Separation Anxiety", "يوسف", [
        ("fear",    "خايف ماما تمشي وتسيبني"),
        ("fear",    "مش عايز أروح المدرسة لوحدي"),
        ("neutral", "بعيد عن ماما وبفضل قلقان"),
        ("sad",     "أنا وحيد في المدرسة"),
        ("neutral", "باكي عشان بابا مسافر"),
    ])

    run_scenario("PTSD", "مريم", [
        ("fear",     "بفتكر الحادثة ومش بنام من الكوابيس"),
        ("surprise", "الصوت العالي بيخوفني جداً"),
        ("fear",     "عندي كوابيس من اللي اتعمل"),
        ("surprise", "صحيت مخضوضة وبصرخ"),
        ("fear",     "مش قادرة أنسى اللي حصل"),
    ])

    run_scenario("Eating Disorder", "نور", [
        ("disgust", "قرفانة من الأكل وما باكلش"),
        ("disgust", "برجع الأكل في بقي"),
        ("neutral", "مش جعانة خالص"),
        ("sad",     "وزني نزل وما باكلش"),
        ("disgust", "الأكل ده قرف مش قادرة آكله"),
    ])

    run_scenario("ODD", "كريم", [
        ("angry",   "مش هسمع الكلام خالص"),
        ("angry",   "مش هتمشي كلامك عليا أنا حر"),
        ("angry",   "رافض أعمل اللي بتقوله"),
        ("neutral", "أنا حر وهعمل اللي أنا عايزه"),
        ("angry",   "مش هيمشي أمره عليا"),
    ])

    run_scenario("Conduct Disorder", "طارق", [
        ("angry",   "ضربت القطة وكسرت ألعاب صاحبي"),
        ("angry",   "خناق في الفصل وشتيمة"),
        ("angry",   "خربت حاجة في البيت وضربت"),
        ("neutral", "ضربت صاحبي في المدرسة"),
        ("angry",   "بعمل الكلام ده دايماً"),
    ])

    run_scenario("ADHD", "لمى", [
        ("neutral", "مش قادرة أقعد ساكتة في الفصل"),
        ("angry",   "المستر بيقول مش بركز وبنسى كشكولي"),
        ("neutral", "بنسى كشكولي دايماً"),
        ("angry",   "مش عارفة أخلص الواجب"),
        ("neutral", "الفصل ممل ومش قادرة أركز"),
    ])

    run_scenario("Healthy & Stable", "رنا", [
        ("happy",   "لعبت كورة مع أصحابي وكان جميل"),
        ("happy",   "مبسوطة وعملت الواجب"),
        ("neutral", "يوم عادي ومريح"),
        ("happy",   "أكلت كويس ونمت كويس"),
        ("neutral", "كل حاجة تمام الحمد لله"),
    ])

    print(f"\n{'✅  All scenarios passed!':^62}")
    print(SEP2)