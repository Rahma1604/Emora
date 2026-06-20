# -*- coding: utf-8 -*-


import random
import collections
import collections.abc

collections.Mapping = collections.abc.Mapping
from experta import *




class EmotionFact(Fact):
    pass


class DiagnosticFact(Fact):

    pass



class EmoraExpertSystem(KnowledgeEngine):

    @Rule(EmotionFact(emotion='happy'))
    def happy(self):
        msgs = [
            ("You're glowing today ✨",         "إنت منور النهاردة ✨"),
            ("That happiness really suits you 💛", "السعادة لايقة عليك 💛"),
            ("Keep smiling like that 😄",        "فضل مبتسم كده 😄"),
            ("Your energy is amazing 🚀",        "طاقتك جميلة جداً 🚀"),
            ("I love this vibe 🌈",              "المود ده حلو 🌈"),
        ]
        e, a = random.choice(msgs)
        print(f"\n[Emora]: {e}")
        print(f"[Emora]: {a}")


    @Rule(EmotionFact(emotion='sad'))
    def sad(self):
        msgs = [
            ("I'm here for you ❤️",               "أنا جنبك ❤️"),
            ("It's okay to feel sad 🤍",           "عادي تزعل 🤍"),
            ("This will pass 🌧️",                  "ده هيعدي 🌧️"),
            ("You're not alone 🫶",                "مش لوحدك 🫶"),
            ("You matter even on hard days 💛",    "إنت مهم حتى في الأيام الصعبة 💛"),
        ]
        e, a = random.choice(msgs)
        print(f"\n[Emora]: {e}")
        print(f"[Emora]: {a}")

    @Rule(EmotionFact(emotion='angry'))
    def angry(self):
        msgs = [
            ("Take a deep breath 🌿",          "اهدى وخد نفس 🌿"),
            ("Don't let anger control you 🧠", "ما تخليش الغضب يتحكم فيك 🧠"),
            ("I understand your anger 🤍",     "فاهم غضبك 🤍"),
            ("Anger will pass like waves 🌊",  "الغضب زي الموج وبيعدي 🌊"),
        ]
        e, a = random.choice(msgs)
        print(f"\n[Emora]: {e}")
        print(f"[Emora]: {a}")

    @Rule(EmotionFact(emotion='neutral'))
    def neutral(self):
        msgs = [
            ("You seem calm 🍃",            "إنت هادي 🍃"),
            ("Peaceful energy 🌙",          "طاقة رايقة 🌙"),
            ("Just existing is okay ✨",    "مجرد الهدوء كفاية ✨"),
            ("Quiet mind is powerful 🌿",  "العقل الهادي قوة 🌿"),
        ]
        e, a = random.choice(msgs)
        print(f"\n[Emora]: {e}")
        print(f"[Emora]: {a}")

    @Rule(EmotionFact(emotion='disgust'))
    def disgust(self):
        msgs = [
            ("That feels uncomfortable 🤍",       "الإحساس ده طبيعي 🤍"),
            ("It's okay to react that way 🌿",    "عادي تحس بكده 🌿"),
            ("Focus on something better ✨",       "خلينا نفكر في حاجة أحسن ✨"),
        ]
        e, a = random.choice(msgs)
        print(f"\n[Emora]: {e}")
        print(f"[Emora]: {a}")

    @Rule(EmotionFact(emotion='fear'))
    def fear(self):
        msgs = [
            ("You are safe 🤍",                    "إنت في أمان 🤍"),
            ("Fear will pass 🌙",                  "الخوف هيعدي 🌙"),
            ("You are stronger than this 💪",      "إنت أقوى 💪"),
            ("I'm here with you 🫶",               "أنا جنبك 🫶"),
        ]
        e, a = random.choice(msgs)
        print(f"\n[Emora]: {e}")
        print(f"[Emora]: {a}")


    @Rule(EmotionFact(emotion='surprise'))
    def surprise(self):
        msgs = [
            ("Wow! That's unexpected 😲",    "واو! مفاجأة 😲"),
            ("Didn't see that coming ⚡",    "ما توقعتش ده ⚡"),
            ("Interesting moment 👀",        "لحظة غريبة 👀"),
        ]
        e, a = random.choice(msgs)
        print(f"\n[Emora]: {e}")
        print(f"[Emora]: {a}")

    @Rule(EmotionFact(emotion='unknown'))
    def respond_to_unknown(self):
        msgs = [
            (
                "Hmm, I'm not quite sure. Can you show a clearer expression? 🤔",
                "هممم، مش متأكد أوي. ممكن توريني تعبير أوضح؟ 🤔",
            ),
            (
                "Let's try again with better lighting! 🌟",
                "خلينا نجرب تاني بإضاءة أحسن! 🌟",
            ),
        ]
        e, a = random.choice(msgs)
        print(f"\n[Emora]: {e}")
        print(f"[Emora]: {a}")

    @Rule(
        EmotionFact(emotion=MATCH.e),
        TEST(lambda e: e not in
             ['angry', 'disgust', 'fear', 'happy', 'neutral',
              'sad', 'surprise', 'unknown']),
    )
    def others(self, e):
        print(f"\n[Emora]: I see a unique emotion: '{e}' 🌟")
        print(f"[Emora]: ده شعور مختلف: '{e}' 🌟")






_RISK_LABELS = {
    "None":    "✅ لا يوجد خطر",
    "Low":     "🟡 منخفض",
    "Medium":  "🟠 متوسط",
    "High":    "🔴 مرتفع",
    "Unknown": "⚪ غير محدد",
}

_DISORDER_MESSAGES = {
    "اضطراب الاكتئاب (Depression)": (
        "الطفل يُظهر حزناً مستمراً. يُنصح بمتابعة متخصص نفسي.",
        "The child shows persistent sadness. A mental health professional is advised.",
    ),
    "اضطراب القلق العام (General Anxiety)": (
        "قلق متواصل ومستمر. يستحق تقييم متخصص.",
        "Persistent anxiety detected. Specialist evaluation recommended.",
    ),
    "اضطراب قلق الانفصال (Separation Anxiety)": (
        "خوف شديد من الانفصال. تواصل مع أخصائي أسري.",
        "Severe separation fear. Family specialist referral suggested.",
    ),
    "اضطراب ما بعد الصدمة (PTSD)": (
        "مؤشرات صدمة نفسية. التدخل المتخصص ضروري.",
        "Trauma indicators present. Specialist intervention is essential.",
    ),
    "اضطرابات الأكل (Eating Disorder)": (
        "علامات تتعلق بالأكل. استشر طبيباً وأخصائياً تغذية.",
        "Eating-related signs. Consult a doctor and nutritionist.",
    ),
    "اضطرابات النوم والفزع (Sleep Disorder)": (
        "مشاكل في النوم متكررة. تابع مع طبيب الأطفال.",
        "Recurring sleep issues. Follow up with a paediatrician.",
    ),
    "اضطراب التحدي والمعارضة (ODD)": (
        "سلوك معارض مستمر. يُنصح ببرامج إدارة السلوك.",
        "Persistent oppositional behaviour. Behaviour management advised.",
    ),
    "اضطراب التصرف والسلوك (Conduct Disorder)": (
        "سلوك عدواني. يستلزم تدخل متخصص عاجل.",
        "Aggressive behaviour. Urgent specialist intervention required.",
    ),
    "فرط الحركة وتشتت الانتباه (ADHD Indicator)": (
        "مؤشرات تشتت انتباه. قيّم مع طبيب نفسي للأطفال.",
        "Attention indicators. Evaluate with a child psychiatrist.",
    ),
    "الصمت الانتقائي (Selective Mutism)": (
        "صمت انتقائي ملحوظ. يُنصح ببرامج العلاج الكلامي.",
        "Selective mutism observed. Speech therapy programmes advised.",
    ),
    "الحالة المستقرة (Healthy & Stable)": (
        "الطفل في حالة جيدة. استمر في المتابعة الدورية. 🌟",
        "Child is in good condition. Continue regular check-ins. 🌟",
    ),
    "بيانات غير كافية للتشخيص": (
        "البيانات لم تكفِ. تابع الدورة القادمة.",
        "Insufficient data. Continue monitoring next cycle.",
    ),
}


class DiagnosticExpertSystem(KnowledgeEngine):


    def __init__(self):
        super().__init__()
        self.result: dict = {}

    def _s(self, emotion: str) -> int:
        fact = self._get_fact()
        return fact.get("scores", {}).get(emotion, 0) if fact else 0

    def _ctx(self, *keys: str) -> bool:
        fact = self._get_fact()
        ctx = fact.get("context", {}) if fact else {}
        return any(ctx.get(k, 0) > 0 for k in keys)

    def _get_fact(self):
        for f in self.facts.values():
            if isinstance(f, DiagnosticFact):
                return f
        return None

    def _emit(self, diagnosis: str, risk: str, details: str):
        ar_msg, en_msg = _DISORDER_MESSAGES.get(
            diagnosis,
            ("راجع متخصصاً.", "Consult a specialist.")
        )
        self.result = {"diagnosis": diagnosis, "risk": risk, "details": details}

        print("\n" + "═" * 60)
        print("📋  تقرير  — Emora Diagnostic Report")
        print("═" * 60)
        print(f"  🔎 التشخيص   : {diagnosis}")
        print(f"  ⚠️  مستوى الخطر: {_RISK_LABELS.get(risk, risk)}")
        print(f"  📝 التفاصيل  : {details}")
        print(f"\n  💬 (AR) {ar_msg}")
        print(f"  💬 (EN) {en_msg}")
        print("═" * 60 + "\n")

    # ── Rules ──────────────────────────────────────────────────────────

    # 1. Depression
    @Rule(DiagnosticFact(),
          TEST(lambda self=None: True))  # guard via helper in action
    def check_depression(self):
        if self._s("sad") >= 3:
            risk = "High" if self._ctx("isolation") else "Medium"
            self._emit(
                "اضطراب الاكتئاب (Depression)", risk,
                "حزن مستمر لأكثر من 3 أيام" +
                (" مع عزلة اجتماعية." if self._ctx("isolation") else "."),
            )
            raise StopIteration  # وقف القواعد الباقية

    # 2. Separation Anxiety
    @Rule(DiagnosticFact())
    def check_separation_anxiety(self):
        if self._s("fear") >= 2 and self._ctx("family", "school"):
            self._emit(
                "اضطراب قلق الانفصال (Separation Anxiety)", "Medium",
                "خوف مرتبط بالانفصال عن الوالدين أو البيئة الأسرية.",
            )
            raise StopIteration

    # 3. PTSD
    @Rule(DiagnosticFact())
    def check_ptsd(self):
        if (self._s("fear") + self._s("surprise")) >= 2 and self._ctx("trauma", "nightmare"):
            self._emit(
                "اضطراب ما بعد الصدمة (PTSD)", "High",
                "فزع وكوابيس مرتبطة بذكريات صادمة.",
            )
            raise StopIteration

    # 4. Sleep Disorder
    @Rule(DiagnosticFact())
    def check_sleep(self):
        if (self._s("surprise") + self._s("fear")) >= 2 and self._ctx("nightmare"):
            self._emit(
                "اضطرابات النوم والفزع (Sleep Disorder)", "Medium",
                "شكاوى متكررة من الكوابيس وصعوبات النوم.",
            )
            raise StopIteration

    # 5. General Anxiety
    @Rule(DiagnosticFact())
    def check_general_anxiety(self):
        if self._s("fear") >= 3:
            self._emit(
                "اضطراب القلق العام (General Anxiety)", "Medium",
                "خوف وتوتر مستمر لأكثر من 3 أيام.",
            )
            raise StopIteration

    # 6. Eating Disorder
    @Rule(DiagnosticFact())
    def check_eating(self):
        if self._s("disgust") >= 2 and self._ctx("food"):
            self._emit(
                "اضطرابات الأكل (Eating Disorder)", "Medium",
                "مشاعر اشمئزاز متكررة مرتبطة بالطعام.",
            )
            raise StopIteration

    # 7. Conduct Disorder
    @Rule(DiagnosticFact())
    def check_conduct(self):
        if self._s("angry") >= 3 and self._ctx("aggression"):
            self._emit(
                "اضطراب التصرف والسلوك (Conduct Disorder)", "High",
                "سلوك عدواني ومؤذٍ متكرر.",
            )
            raise StopIteration

    # 8. ODD
    @Rule(DiagnosticFact())
    def check_odd(self):
        if self._s("angry") >= 3 and self._ctx("rebellion"):
            self._emit(
                "اضطراب التحدي والمعارضة (ODD)", "Medium",
                "عناد شديد ورفض مستمر للقواعد.",
            )
            raise StopIteration

    # 9. ADHD
    @Rule(DiagnosticFact())
    def check_adhd(self):
        if (self._s("neutral") + self._s("angry")) >= 3 and self._ctx("concentration", "school"):
            self._emit(
                "فرط الحركة وتشتت الانتباه (ADHD Indicator)", "Low",
                "صعوبات تركيز متكررة في السياق الأكاديمي.",
            )
            raise StopIteration

    # 10. Selective Mutism
    @Rule(DiagnosticFact())
    def check_mutism(self):
        if (self._s("fear") + self._s("neutral")) >= 3 and self._ctx("mutism", "school"):
            self._emit(
                "الصمت الانتقائي (Selective Mutism)", "Medium",
                "صمت تام في أماكن محددة مع التحدث الطبيعي في البيت.",
            )
            raise StopIteration

    # 11. Healthy
    @Rule(DiagnosticFact())
    def check_healthy(self):
        if (self._s("happy") + self._s("neutral")) >= 3:
            self._emit(
                "الحالة المستقرة (Healthy & Stable)", "None",
                "لا مؤشرات على اضطراب نفسي. استمر في المتابعة.",
            )
            raise StopIteration

    # 12. Insufficient data
    @Rule(DiagnosticFact())
    def check_insufficient(self):
        if not self.result:
            self._emit(
                "بيانات غير كافية للتشخيص", "Unknown",
                "يلزم مزيد من التفاعلات للوصول إلى تشخيص دقيق.",
            )
