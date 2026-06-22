# -*- coding: utf-8 -*-


from datetime import date, datetime
from collections import defaultdict
from typing import Optional



CONTEXT_KEYWORDS: dict[str, list[str]] = {
    "isolation":     ["لوحدي", "عايز أبقى لوحدي", "مش عايز أتكلم", "مش عايز أكلم حد",
                      "بعيد عن كل حاجة", "عزلة", "محدش بيكلمني", "بوحدي"],
    "school":        ["مدرسة", "فصل", "مستر", "درس", "واجب", "ناظر",
                      "امتحان", "المدرسة", "الفصل", "الكشكول", "شنطة"],
    "family":        ["ماما", "بابا", "أهل", "بيت", "أخو", "أخت",
                      "جدو", "تيتة", "عيلة", "ولي الأمر"],
    "nightmare":     ["كابوس", "كوابيس", "نوم", "صحيت", "مخضوض", "بصرخ",
                      "مش عارف أنام", "بخاف من الليل", "الظلام"],
    "trauma":        ["بفتكر", "ذاكرني", "الحادثة", "اللي اتعمل",
                      "الصوت العالي", "فزعت", "اتصدمت"],
    "aggression":    ["ضربت", "كسرت", "خناق", "شتيمة", "خربت",
                      "كسرت ألعاب", "ضربت حيوان", "ضربت القطة"],
    "rebellion":     ["مش هسمع", "مش هاعمل", "مش هينفع كلامه",
                      "مش هتمشي كلامك عليا", "رافض", "مش هيمشي أمري", "أنا حر"],
    "food":          ["أكل", "باكل", "مش باكل", "قرفان من الأكل", "برجع الأكل",
                      "جعان ومش باكل", "باكل حاجات غريبة", "طين"],
    "concentration": ["مش بركز", "بنسى", "مش قادر أقعد", "تشتيت", "كشكولي",
                      "ساهي", "مش قادر أذاكر", "مش عارف أخلص الواجب"],
    "mutism":        ["مش بتكلم", "صامت", "ما بنطقش", "بسكت",
                      "ما باتكلمش", "مش قادر أتكلم هناك"],
}


_children_data: dict[str, dict] = {}


def _fresh_state() -> dict:
    return {
        "scores":           defaultdict(int),
        "context":          defaultdict(int),
        "current_day":      0,
        "last_update_date": None,
        "history":          [],
    }


def _get_child(child_id: str) -> dict:
    if child_id not in _children_data:
        _children_data[child_id] = _fresh_state()
    return _children_data[child_id]


def load_child_from_db(child_id: str, state: dict):

    _children_data[child_id] = {
        "scores":           defaultdict(int, state.get("scores", {})),
        "context":          defaultdict(int, state.get("context", {})),
        "current_day":      state.get("current_day", 0),
        "last_update_date": state.get("last_update_date"),
        "history":          state.get("history", []),
    }


def get_child_state_for_db(child_id: str) -> dict:
    """تُستدعى من main.py قبل الحفظ في DB."""
    data = _get_child(child_id)
    return {
        "scores":           dict(data["scores"]),
        "context":          dict(data["context"]),
        "current_day":      data["current_day"],
        "last_update_date": data["last_update_date"],
        "history":          data["history"],
    }



def _extract_context(text: str) -> list[str]:
    text_lower = text.lower()
    return [k for k, kws in CONTEXT_KEYWORDS.items()
            if any(kw in text_lower for kw in kws)]



MOTHER_REPORT_TEMPLATE = {
    "اضطراب الاكتئاب (Depression)": {
        "title":   "طفلك محتاج دعمك ❤️",
        "message": (
            "لاحظنا إن طفلك حاسس بحزن مستمر خلال الفترة الأخيرة. "
            "ده مش معناه حاجة كبيرة لازم تخافي منها، بس محتاج انتباهك. "
            "حاولي تقعدي معاه أكتر، تسمعيه، وتعرفيه إنه مش لوحده."
        ),
        "tips": [
            "خصصي وقت يومي للكلام مع طفلك بدون موبايل أو تليفزيون",
            "اسأليه عن يومه بشكل طبيعي مش باستجواب",
            "لو الحالة فضلت أكتر من أسبوعين، اتواصلي مع متخصص",
        ],
        "urgent": False,
    },
    "اضطراب القلق العام (General Anxiety)": {
        "title":   "طفلك بيعاني من قلق زيادة 💛",
        "message": (
            "طفلك بيحس بخوف وقلق بشكل متكرر. ده شيء بيأثر على يومه. "
            "محتاجة تساعديه يتكلم عن خوفه وتطمنيه."
        ),
        "tips": [
            "لما يقولك 'خايف' متقوليش 'مافيش حاجة' — سمعيه الأول",
            "علميه تاخد نفس عميق وتعد لـ 10 لما يحس بقلق",
            "تجنبي المواقف اللي بتزيد قلقه بشكل مفاجئ",
        ],
        "urgent": False,
    },
    "اضطراب قلق الانفصال (Separation Anxiety)": {
        "title":   "طفلك خايف يبعد عنك 🤍",
        "message": (
            "طفلك بيحس بخوف شديد لما بيبعد عنك أو عن البيت. "
            "ده طبيعي في سن معينة بس لو مستمر محتاج متابعة."
        ),
        "tips": [
            "لما بتمشي قوليله هترجعي إمتى بالظبط — الطفل محتاج يثق",
            "متختفيش من غير ما تودعيه حتى لو بيعيط",
            "اعمليله روتين ثابت يحس بالأمان",
        ],
        "urgent": False,
    },
    "اضطراب ما بعد الصدمة (PTSD)": {
        "title":   "⚠️ طفلك محتاج مساعدة متخصصة",
        "message": (
            "في علامات إن طفلك اتأثر بحاجة صعبة مرت عليه. "
            "ده مش تقصير منك — بس محتاج دعم متخصص فوراً."
        ),
        "tips": [
            "لا تسأليه عن الحادثة بشكل متكرر",
            "كوني جنبيه وطمنيه إنه في أمان",
            "تواصلي مع طبيب نفسي للأطفال في أقرب وقت",
        ],
        "urgent": True,
    },
    "اضطرابات الأكل (Eating Disorder)": {
        "title":   "طفلك عنده مشكلة مع الأكل 🍽️",
        "message": (
            "لاحظنا إن طفلك بيعاني من صعوبة مع الأكل بشكل متكرر. "
            "الموضوع ده محتاج انتباه طبي."
        ),
        "tips": [
            "متضغطيش عليه يأكل — ده بيعمل عكس المطلوب",
            "اعمليله وجبات صغيرة وملونة وجذابة",
            "اتكلمي مع طبيب الأطفال عن الموضوع",
        ],
        "urgent": False,
    },
    "اضطرابات النوم والفزع (Sleep Disorder)": {
        "title":   "طفلك بيعاني في نومه 🌙",
        "message": (
            "طفلك بيصحى من نومه خايف أو عنده كوابيس متكررة. "
            "النوم الكويس مهم جداً لصحته."
        ),
        "tips": [
            "اعمليله روتين ثابت قبل النوم: حمام، قصة، نور خافت",
            "لما يصحى خايف، روحيله وطمنيه من غير ما تعمليله دراما",
            "شيلي الشاشات (موبايل/تابلت) ساعة قبل النوم",
        ],
        "urgent": False,
    },
    "اضطراب التحدي والمعارضة (ODD)": {
        "title":   "طفلك بيعاند أكتر من المعتاد 🔶",
        "message": (
            "طفلك بيرفض الأوامر ويعاند بشكل مستمر. "
            "ده محتاج أسلوب تعامل مختلف مش عقاب أكتر."
        ),
        "tips": [
            "اديه خيارات بدل أوامر: 'عايز تذاكر دلوقتي ولا بعد نص ساعة؟'",
            "امدحيه لما يتصرف صح، ومتتجاهليش اللحظات الكويسة",
            "اتكلمي مع أخصائي سلوك أطفال",
        ],
        "urgent": False,
    },
    "اضطراب التصرف والسلوك (Conduct Disorder)": {
        "title":   "⚠️ سلوك طفلك محتاج تدخل سريع",
        "message": (
            "طفلك بيتصرف بطريقة عدوانية بتأذي نفسه أو غيره. "
            "ده محتاج مساعدة متخصصة عاجلة."
        ),
        "tips": [
            "متعاقبيش بالعنف — بيعلمه إن العنف حل",
            "راقبي اللي بيتفرج عليه ولعبيه",
            "اتواصلي مع طبيب نفسي للأطفال فوراً",
        ],
        "urgent": True,
    },
    "فرط الحركة وتشتت الانتباه (ADHD Indicator)": {
        "title":   "طفلك صعب يركز 📚",
        "message": (
            "طفلك بيعاني من صعوبة في التركيز والهدوء. "
            "ده مش كسل — ده محتاج تقييم متخصص."
        ),
        "tips": [
            "قسمي الواجب لأجزاء صغيرة مع استراحات",
            "اعمليله مكان هادي للمذاكرة بعيد عن الإزعاج",
            "اتكلمي مع المدرسة وطبيب الأطفال",
        ],
        "urgent": False,
    },
    "الصمت الانتقائي (Selective Mutism)": {
        "title":   "طفلك بيصمت في أماكن معينة 🤐",
        "message": (
            "طفلك بيتكلم عادي في البيت بس بيصمت في أماكن تانية. "
            "ده خوف حقيقي مش عناد."
        ),
        "tips": [
            "متضغطيش عليه يتكلم — ده بيزود الخوف",
            "امدحيه على أي محاولة للكلام مهما كانت صغيرة",
            "اتواصلي مع معالج كلام متخصص",
        ],
        "urgent": False,
    },
    "الحالة المستقرة (Healthy & Stable)": {
        "title":   "طفلك بخير ✅",
        "message": (
            "طفلك في حالة كويسة ومستقرة. "
            "فضلي تتابعي معاه وتدعميه."
        ),
        "tips": [
            "استمري في الروتين الإيجابي",
            "شجعيه على اللعب مع أصحابه",
            "اتكلمي معاه بانتظام عن مشاعره",
        ],
        "urgent": False,
    },
    "بيانات غير كافية للتشخيص": {
        "title":   "لسة بنتابع طفلك 🔄",
        "message": (
            "محتاجين أيام تانية من المتابعة عشان نقدر نديك صورة أوضح. "
            "فضلي تفاعلي معاه يومياً."
        ),
        "tips": [
            "حاولي تفاعلي معاه يومياً",
            "لو حسيتي بحاجة غريبة، سجليها",
        ],
        "urgent": False,
    },
}

DOCTOR_REPORT_TEMPLATE = {
    "اضطراب الاكتئاب (Depression)": {
        "icd10": "F32 – Depressive Episode",
        "clinical_notes": (
            "المريض أبدى مزاجاً اكتئابياً مستمراً لمدة ≥ 3 أيام خلال دورة المراقبة. "
            "مؤشرات العزلة الاجتماعية تُعزز التشخيص. "
            "يُوصى بتقييم سريري شامل وتطبيق Beck Depression Inventory للأطفال (CDI)."
        ),
        "recommended_assessment": ["CDI", "K-SADS", "تقرير ولي الأمر"],
        "intervention": "CBT + متابعة دورية — النظر في الدعم الدوائي إذا لزم",
    },
    "اضطراب القلق العام (General Anxiety)": {
        "icd10": "F41.1 – Generalised Anxiety Disorder",
        "clinical_notes": (
            "مؤشرات قلق منتشر ومستمر لمدة ≥ 3 أيام. "
            "يُوصى بمقياس SCARED للأطفال."
        ),
        "recommended_assessment": ["SCARED", "MASC", "تقرير ولي الأمر"],
        "intervention": "CBT التعرض التدريجي + تقنيات الاسترخاء",
    },
    "اضطراب قلق الانفصال (Separation Anxiety)": {
        "icd10": "F93.0 – Separation Anxiety Disorder",
        "clinical_notes": (
            "خوف مرتبط بالانفصال عن المرجعيات الأسرية مع سياق أسري واضح. "
            "مدة ≥ يومين خلال دورة المراقبة."
        ),
        "recommended_assessment": ["SCARED", "مقابلة أسرية منظمة"],
        "intervention": "العلاج الأسري + تدريج التعرض للانفصال",
    },
    "اضطراب ما بعد الصدمة (PTSD)": {
        "icd10": "F43.1 – Post-Traumatic Stress Disorder",
        "clinical_notes": (
            "وجود مؤشرات إعادة المعايشة (re-experiencing) والفزع واضطراب النوم "
            "مرتبطة بسياق صدمي موثق. الحالة تستدعي تدخلاً عاجلاً."
        ),
        "recommended_assessment": ["CPSS-5", "CAPS-CA", "تقييم سلامة فوري"],
        "intervention": "TF-CBT أو EMDR بواسطة معالج متخصص في صدمات الأطفال",
    },
    "اضطرابات الأكل (Eating Disorder)": {
        "icd10": "F50 – Eating Disorders",
        "clinical_notes": (
            "مؤشرات اشمئزاز مرتبطة بالطعام ≥ يومين مع سياق رفض غذائي. "
            "يُوصى بتقييم طبي وغذائي متوازٍ."
        ),
        "recommended_assessment": ["ChEAT", "تقييم غذائي", "فحص جسدي"],
        "intervention": "فريق متعدد التخصصات: نفسي + تغذية + طبيب أطفال",
    },
    "اضطرابات النوم والفزع (Sleep Disorder)": {
        "icd10": "F51 – Nonorganic Sleep Disorders",
        "clinical_notes": (
            "شكاوى نوم متكررة (كوابيس / فزع ليلي) مرتبطة بمشاعر مفاجأة وخوف."
        ),
        "recommended_assessment": ["CSHQ", "يوميات النوم", "استبعاد السبب العضوي"],
        "intervention": "تدخل سلوكي للنوم + تقييم Sleep Apnea إذا لزم",
    },
    "اضطراب التحدي والمعارضة (ODD)": {
        "icd10": "F91.3 – Oppositional Defiant Disorder",
        "clinical_notes": (
            "نمط معارضة ثابت ≥ 3 أيام مع سياق تمرد واضح على السلطة."
        ),
        "recommended_assessment": ["CBCL", "Conners", "مقابلة أسرية"],
        "intervention": "Parent Management Training (PMT) + تدخل مدرسي",
    },
    "اضطراب التصرف والسلوك (Conduct Disorder)": {
        "icd10": "F91 – Conduct Disorders",
        "clinical_notes": (
            "سلوكيات عدوانية موثقة تجاه الآخرين أو الممتلكات ≥ 3 أيام. "
            "الحالة تستدعي تقييماً عاجلاً."
        ),
        "recommended_assessment": ["CBCL", "تقييم خطورة", "مقابلة مع ولي الأمر والمدرسة"],
        "intervention": "MST أو FFT + متابعة جنائية إذا استدعى الأمر",
    },
    "فرط الحركة وتشتت الانتباه (ADHD Indicator)": {
        "icd10": "F90 – Hyperkinetic Disorders",
        "clinical_notes": (
            "مؤشرات تشتت انتباه وفرط نشاط في السياق الأكاديمي ≥ 3 أيام. "
            "يستلزم تقييماً متعدد المصادر (بيت + مدرسة)."
        ),
        "recommended_assessment": ["Conners-3", "ADHD-RS", "تقرير المدرسة", "IQ إذا لزم"],
        "intervention": "Behavioral Therapy + تعديل بيئي + تقييم دوائي",
    },
    "الصمت الانتقائي (Selective Mutism)": {
        "icd10": "F94.0 – Elective Mutism",
        "clinical_notes": (
            "صمت تام في أماكن محددة (مدرسة) مع تحدث طبيعي في البيئة المنزلية ≥ 3 أيام."
        ),
        "recommended_assessment": ["SMAF", "مقابلة أسرية", "تقرير المدرسة"],
        "intervention": "Behavioral + Speech Therapy + دعم أسري",
    },
    "الحالة المستقرة (Healthy & Stable)": {
        "icd10": "Z00 – Routine Health Examination",
        "clinical_notes": "لا مؤشرات اضطراب نفسي خلال دورة المراقبة. متابعة دورية كافية.",
        "recommended_assessment": [],
        "intervention": "استمرار المتابعة الوقائية",
    },
    "بيانات غير كافية للتشخيص": {
        "icd10": "Z03 – Observation / Evaluation",
        "clinical_notes": "البيانات المجمعة لا تكفي للتشخيص. يُوصى بإكمال دورة المراقبة.",
        "recommended_assessment": [],
        "intervention": "استمرار المتابعة",
    },
}


def generate_mother_report(diagnostic_result: dict, child_name: str,
                            scores: dict, cycle_date: str) -> dict:
    diagnosis = diagnostic_result.get("diagnosis", "بيانات غير كافية للتشخيص")
    tmpl = MOTHER_REPORT_TEMPLATE.get(diagnosis, MOTHER_REPORT_TEMPLATE["بيانات غير كافية للتشخيص"])

    dominant = max(scores, key=scores.get) if scores else "neutral"
    emotion_ar = {
        "sad": "حزن", "fear": "خوف", "angry": "غضب",
        "happy": "سعادة", "neutral": "هدوء",
        "disgust": "اشمئزاز", "surprise": "مفاجأة",
    }.get(dominant, dominant)

    return {
        "report_type":    "mother",
        "child_name":     child_name,
        "report_date":    cycle_date,
        "title":          tmpl["title"],
        "message":        tmpl["message"],
        "dominant_emotion": emotion_ar,
        "tips":           tmpl["tips"],
        "urgent":         tmpl["urgent"],
        "risk_level":     diagnostic_result.get("risk", "Unknown"),
        "diagnosis":      diagnosis,
    }


def generate_doctor_report(diagnostic_result: dict, child_name: str,
                            child_id: str, scores: dict,
                            context: dict, history: list,
                            cycle_date: str) -> dict:
    diagnosis = diagnostic_result.get("diagnosis", "بيانات غير كافية للتشخيص")
    tmpl = DOCTOR_REPORT_TEMPLATE.get(diagnosis, DOCTOR_REPORT_TEMPLATE["بيانات غير كافية للتشخيص"])

    return {
        "report_type":            "doctor",
        "child_id":               child_id,
        "child_name":             child_name,
        "report_date":            cycle_date,
        "diagnosis":              diagnosis,
        "icd10_code":             tmpl["icd10"],
        "risk_level":             diagnostic_result.get("risk", "Unknown"),
        "clinical_notes":         tmpl["clinical_notes"],
        "details":                diagnostic_result.get("details", ""),
        "raw_emotion_scores":     scores,
        "behavioral_context":     context,
        "recommended_assessment": tmpl["recommended_assessment"],
        "intervention_plan":      tmpl["intervention"],
        "monitoring_cycles_done": len(history),
        "previous_diagnoses":     [h.get("diagnosis") for h in history[-3:]],
    }



def run_diagnostic_engine(scores: dict, context: dict) -> dict:
    def s(e): return scores.get(e, 0)
    def ctx(*keys): return any(context.get(k, 0) > 0 for k in keys)

    if s("sad") >= 3:
        return {"diagnosis": "اضطراب الاكتئاب (Depression)",
                "risk": "High" if ctx("isolation") else "Medium",
                "details": "حزن مستمر لأكثر من 3 أيام" + (" مع عزلة اجتماعية." if ctx("isolation") else ".")}

    if s("fear") >= 2 and ctx("family", "school"):
        return {"diagnosis": "اضطراب قلق الانفصال (Separation Anxiety)",
                "risk": "Medium", "details": "خوف مرتبط بالانفصال عن الوالدين أو البيئة الأسرية."}

    if (s("fear") + s("surprise")) >= 2 and ctx("trauma", "nightmare"):
        return {"diagnosis": "اضطراب ما بعد الصدمة (PTSD)",
                "risk": "High", "details": "فزع وكوابيس مرتبطة بذكريات صادمة."}

    if (s("surprise") + s("fear")) >= 2 and ctx("nightmare"):
        return {"diagnosis": "اضطرابات النوم والفزع (Sleep Disorder)",
                "risk": "Medium", "details": "شكاوى متكررة من الكوابيس وصعوبات النوم."}

    if s("fear") >= 3:
        return {"diagnosis": "اضطراب القلق العام (General Anxiety)",
                "risk": "Medium", "details": "خوف وتوتر مستمر لأكثر من 3 أيام."}

    if s("disgust") >= 2 and ctx("food"):
        return {"diagnosis": "اضطرابات الأكل (Eating Disorder)",
                "risk": "Medium", "details": "مشاعر اشمئزاز متكررة مرتبطة بالطعام."}

    if s("angry") >= 3 and ctx("aggression"):
        return {"diagnosis": "اضطراب التصرف والسلوك (Conduct Disorder)",
                "risk": "High", "details": "سلوك عدواني ومؤذٍ متكرر."}

    if s("angry") >= 3 and ctx("rebellion"):
        return {"diagnosis": "اضطراب التحدي والمعارضة (ODD)",
                "risk": "Medium", "details": "عناد شديد ورفض مستمر للقواعد."}

    if (s("neutral") + s("angry")) >= 3 and ctx("concentration", "school"):
        return {"diagnosis": "فرط الحركة وتشتت الانتباه (ADHD Indicator)",
                "risk": "Low", "details": "صعوبات تركيز متكررة في السياق الأكاديمي."}

    if (s("fear") + s("neutral")) >= 3 and ctx("mutism", "school"):
        return {"diagnosis": "الصمت الانتقائي (Selective Mutism)",
                "risk": "Medium", "details": "صمت تام في أماكن محددة مع التحدث الطبيعي في البيت."}

    if (s("happy") + s("neutral")) >= 3:
        return {"diagnosis": "الحالة المستقرة (Healthy & Stable)",
                "risk": "None", "details": "لا مؤشرات على اضطراب نفسي. استمر في المتابعة."}

    return {"diagnosis": "بيانات غير كافية للتشخيص",
            "risk": "Unknown", "details": "يلزم مزيد من التفاعلات للوصول إلى تشخيص دقيق."}



class TrackerService:
    EMOTIONS = ("happy", "sad", "angry", "fear", "surprise", "disgust", "neutral")

    def __init__(self, child_id: str, child_name: str = "الطفل", cycle_days: int = 5):
        self.child_id   = child_id
        self.child_name = child_name
        self.cycle_days = cycle_days

    def update(self, emotion: str, text: str = "") -> Optional[dict]:

        data = _get_child(self.child_id)

        if emotion in self.EMOTIONS:
            data["scores"][emotion] += 1

        if text:
            for ctx in _extract_context(text):
                data["context"][ctx] += 1

        today = str(date.today())
        if data["last_update_date"] != today:
            data["current_day"] += 1
            data["last_update_date"] = today

        print(f"[Tracker] Day {data['current_day']}/{self.cycle_days} "
              f"| emotion={emotion} | child={self.child_id}")

        # 4️⃣ هل اكتملت الدورة؟
        if data["current_day"] >= self.cycle_days:
            return self._close_cycle(data)

        return None

    def _close_cycle(self, data: dict) -> dict:
        scores  = dict(data["scores"])
        context = dict(data["context"])
        cycle_date = datetime.now().strftime("%Y-%m-%d %H:%M")

        print(f"\n[Tracker] ✅ Cycle complete | Scores={scores} | Context={context}")

        diagnostic = run_diagnostic_engine(scores, context)

        mother_report = generate_mother_report(
            diagnostic, self.child_name, scores, cycle_date)
        doctor_report = generate_doctor_report(
            diagnostic, self.child_name, self.child_id,
            scores, context, data["history"], cycle_date)

        data["history"].append({
            "date":      cycle_date,
            "scores":    scores,
            "context":   context,
            "diagnosis": diagnostic["diagnosis"],
            "risk":      diagnostic["risk"],
        })

        data["scores"]           = defaultdict(int)
        data["context"]          = defaultdict(int)
        data["current_day"]      = 0
        data["last_update_date"] = None

        print("[Tracker] 🔄 Cycle reset\n")

        return {
            "diagnostic":     diagnostic,
            "mother_report":  mother_report,
            "doctor_report":  doctor_report,
        }

    def get_history(self) -> list:
        return _get_child(self.child_id)["history"]

    def get_current_scores(self) -> dict:
        return dict(_get_child(self.child_id)["scores"])

    def get_current_day(self) -> int:
        return _get_child(self.child_id)["current_day"]
