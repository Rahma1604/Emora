# -*- coding: utf-8 -*-
"""
tracker_service.py — Emora Diagnostic Tracker
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
المسؤول عن:
  • تجميع نقاط المشاعر اليومية (Emotion Scores)
  • حفظ السياق السلوكي (Context)
  • تشغيل دورة 5 أيام وإطلاق Expert System
  • إعادة تصفير الدورة وحفظ التاريخ

الاستخدام:
    tracker = TrackerService(child_id="child_123")
    tracker.update(emotion="sad", text="أنا زهقان ومش عايز ألعب")
"""

import re
from datetime import datetime
from collections import defaultdict
from typing import Optional


# ─────────────────────────────────────────────
#  Context keyword maps
# ─────────────────────────────────────────────
CONTEXT_KEYWORDS: dict[str, list[str]] = {
    "isolation": [
        "لوحدي", "عايز أبقى لوحدي", "مش عايز أتكلم", "مش عايز أكلم حد",
        "بعيد عن كل حاجة", "عزلة", "محدش بيكلمني", "بوحدي",
    ],
    "school": [
        "مدرسة", "فصل", "مستر", "مدرسة", "درس", "واجب", "مستر", "ناظر",
        "امتحان", "المدرسة", "الفصل", "الكشكول", "شنطة",
    ],
    "family": [
        "ماما", "بابا", "أهل", "بيت", "أخو", "أخت", "جدو", "تيتة",
        "عيلة", "ولي الأمر",
    ],
    "nightmare": [
        "كابوس", "كوابيس", "نوم", "صحيت", "مخضوض", "بصرخ", "مش عارف أنام",
        "بخاف من الليل", "الظلام",
    ],
    "trauma": [
        "بفتكر", "ذاكرني", "الحادثة", "اللي اتعمل", "الصوت العالي",
        "فزعت", "اتصدمت",
    ],
    "aggression": [
        "ضربت", "كسرت", "خناق", "شتيمة", "خربت", "كسرت ألعاب",
        "ضربت حيوان", "ضربت القطة",
    ],
    "rebellion": [
        "مش هسمع", "مش هاعمل", "مش هينفع كلامه", "مش هتمشي كلامك عليا",
        "رافض", "مش هيمشي أمري", "أنا حر",
    ],
    "food": [
        "أكل", "باكل", "مش باكل", "قرفان من الأكل", "برجع الأكل",
        "جعان ومش باكل", "باكل حاجات غريبة", "طين",
    ],
    "concentration": [
        "مش بركز", "بنسى", "مش قادر أقعد", "تشتيت", "كشكولي",
        "ساهي", "مش قادر أذاكر", "مش عارف أخلص الواجب",
    ],
    "mutism": [
        "مش بتكلم", "صامت", "ما بنطقش", "بسكت", "ما باتكلمش",
        "مش قادر أتكلم هناك",
    ],
}

# ─────────────────────────────────────────────
#  Per-child state (in-memory)
# ─────────────────────────────────────────────
_children_data: dict[str, dict] = {}


def _get_child(child_id: str) -> dict:
    if child_id not in _children_data:
        _children_data[child_id] = _fresh_state()
    return _children_data[child_id]


def _fresh_state() -> dict:
    return {
        "scores": defaultdict(int),   # emotion → count
        "context": defaultdict(int),  # context_key → count
        "current_day": 0,
        "history": [],
    }


# ─────────────────────────────────────────────
#  Context extractor
# ─────────────────────────────────────────────
def _extract_context(text: str) -> list[str]:
    """Return list of matched context keys from the input text."""
    text_lower = text.lower()
    found = []
    for ctx_key, keywords in CONTEXT_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            found.append(ctx_key)
    return found


# ─────────────────────────────────────────────
#  TrackerService
# ─────────────────────────────────────────────
class TrackerService:
    """
    واجهة التتبع الرئيسية لكل طفل.

    Parameters
    ----------
    child_id : str
        معرّف فريد للطفل.
    cycle_days : int
        عدد أيام دورة المراقبة (افتراضي 5).
    """

    EMOTIONS = ("happy", "sad", "angry", "fear", "surprise", "disgust", "neutral")

    def __init__(self, child_id: str, cycle_days: int = 5):
        self.child_id = child_id
        self.cycle_days = cycle_days

    # ------------------------------------------------------------------
    def update(self, emotion: str, text: str = "") -> Optional[dict]:
        """
        تُستدعى بعد كل تفاعل (نص أو صورة).

        Parameters
        ----------
        emotion : str   الشعور المستخرج من الموديل
        text    : str   النص الأصلي (اختياري، لاستخراج السياق)

        Returns
        -------
        None  — إذا لم تكتمل الدورة بعد
        dict  — نتيجة التشخيص عند اكتمال الـ 5 أيام
        """
        data = _get_child(self.child_id)

        # 1️⃣  تحديث نقاط المشاعر
        if emotion in self.EMOTIONS:
            data["scores"][emotion] += 1

        # 2️⃣  استخراج وحفظ السياق
        if text:
            for ctx in _extract_context(text):
                data["context"][ctx] += 1

        # 3️⃣  تقدّم العداد اليومي
        data["current_day"] += 1
        print(
            f"[Tracker] Day {data['current_day']}/{self.cycle_days} "
            f"| emotion={emotion} | child={self.child_id}"
        )

        # 4️⃣  هل اكتملت الدورة؟
        if data["current_day"] >= self.cycle_days:
            return self._close_cycle(data)

        return None  # لسة مكملناش

    # ------------------------------------------------------------------
    def _close_cycle(self, data: dict) -> dict:
        """تشغيل Expert System وحفظ التاريخ وتصفير الدورة."""
        scores = dict(data["scores"])
        context = dict(data["context"])

        print(f"\n[Tracker] ✅ Cycle complete — running Expert System …")
        print(f"  Scores : {scores}")
        print(f"  Context: {context}")

        result = run_diagnostic_engine(scores, context)

        # حفظ في التاريخ
        record = {
            "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "scores": scores,
            "context": context,
            "diagnosis": result["diagnosis"],
            "risk": result["risk"],
        }
        data["history"].append(record)

        # إعادة التصفير
        data["scores"] = defaultdict(int)
        data["context"] = defaultdict(int)
        data["current_day"] = 0

        print(f"[Tracker] 🔄 Cycle reset — new 5-day cycle started.\n")
        return result

    # ------------------------------------------------------------------
    def get_history(self) -> list:
        """إرجاع سجل التشخيصات السابقة."""
        return _get_child(self.child_id)["history"]

    # ------------------------------------------------------------------
    def get_current_scores(self) -> dict:
        """إرجاع النقاط الحالية للدورة الجارية."""
        return dict(_get_child(self.child_id)["scores"])


# ─────────────────────────────────────────────
#  Diagnostic Engine  (Rule-based)
# ─────────────────────────────────────────────
def run_diagnostic_engine(scores: dict, context: dict) -> dict:
    """
    نظام خبير مبني على قواعد يشخّص الاضطراب بناءً على:
      • نقاط المشاعر خلال 5 أيام
      • السياق السلوكي المستخرج من النصوص

    Returns
    -------
    dict: { "diagnosis": str, "risk": str, "details": str }
    """

    def s(emotion: str) -> int:
        return scores.get(emotion, 0)

    def ctx(*keys: str) -> bool:
        return any(context.get(k, 0) > 0 for k in keys)

    # ── 1. Depression ─────────────────────────────────────────────────
    if s("sad") >= 3:
        risk = "High" if ctx("isolation") else "Medium"
        return {
            "diagnosis": "اضطراب الاكتئاب (Depression)",
            "risk": risk,
            "details": (
                "حزن مستمر لأكثر من 3 أيام"
                + (" مع عزلة اجتماعية." if ctx("isolation") else ".")
            ),
        }

    # ── 2. Separation Anxiety ─────────────────────────────────────────
    if s("fear") >= 2 and ctx("family", "school"):
        return {
            "diagnosis": "اضطراب قلق الانفصال (Separation Anxiety)",
            "risk": "Medium",
            "details": "خوف مرتبط بالانفصال عن الوالدين أو البيئة الأسرية.",
        }

    # ── 3. PTSD ───────────────────────────────────────────────────────
    if (s("fear") + s("surprise")) >= 2 and ctx("trauma", "nightmare"):
        return {
            "diagnosis": "اضطراب ما بعد الصدمة (PTSD)",
            "risk": "High",
            "details": "فزع وكوابيس مرتبطة بذكريات صادمة.",
        }

    # ── 4. Sleep Disorder ─────────────────────────────────────────────
    if (s("surprise") + s("fear")) >= 2 and ctx("nightmare"):
        return {
            "diagnosis": "اضطرابات النوم والفزع (Sleep Disorder)",
            "risk": "Medium",
            "details": "شكاوى متكررة من الكوابيس وصعوبات النوم.",
        }

    # ── 5. General Anxiety ────────────────────────────────────────────
    if s("fear") >= 3:
        return {
            "diagnosis": "اضطراب القلق العام (General Anxiety)",
            "risk": "Medium",
            "details": "خوف وتوتر مستمر لأكثر من 3 أيام.",
        }

    # ── 6. Eating Disorder ────────────────────────────────────────────
    if s("disgust") >= 2 and ctx("food"):
        return {
            "diagnosis": "اضطرابات الأكل (Eating Disorder)",
            "risk": "Medium",
            "details": "مشاعر اشمئزاز متكررة مرتبطة بالطعام.",
        }

    # ── 7. Conduct Disorder ───────────────────────────────────────────
    if s("angry") >= 3 and ctx("aggression"):
        return {
            "diagnosis": "اضطراب التصرف والسلوك (Conduct Disorder)",
            "risk": "High",
            "details": "سلوك عدواني ومؤذٍ متكرر.",
        }

    # ── 8. ODD ────────────────────────────────────────────────────────
    if s("angry") >= 3 and ctx("rebellion"):
        return {
            "diagnosis": "اضطراب التحدي والمعارضة (ODD)",
            "risk": "Medium",
            "details": "عناد شديد ورفض مستمر للقواعد.",
        }

    # ── 9. ADHD Indicator ─────────────────────────────────────────────
    if (s("neutral") + s("angry")) >= 3 and ctx("concentration", "school"):
        return {
            "diagnosis": "فرط الحركة وتشتت الانتباه (ADHD Indicator)",
            "risk": "Low",
            "details": "صعوبات تركيز متكررة في السياق الأكاديمي.",
        }

    # ── 10. Selective Mutism ──────────────────────────────────────────
    if (s("fear") + s("neutral")) >= 3 and ctx("mutism", "school"):
        return {
            "diagnosis": "الصمت الانتقائي (Selective Mutism)",
            "risk": "Medium",
            "details": "صمت تام في أماكن محددة مع التحدث الطبيعي في البيت.",
        }

    # ── 11. Healthy & Stable ──────────────────────────────────────────
    if (s("happy") + s("neutral")) >= 3:
        return {
            "diagnosis": "الحالة المستقرة (Healthy & Stable)",
            "risk": "None",
            "details": "لا مؤشرات على اضطراب نفسي. استمر في المتابعة.",
        }

    # ── Insufficient Data ─────────────────────────────────────────────
    return {
        "diagnosis": "بيانات غير كافية للتشخيص",
        "risk": "Unknown",
        "details": "يلزم مزيد من التفاعلات للوصول إلى تشخيص دقيق.",
    }
