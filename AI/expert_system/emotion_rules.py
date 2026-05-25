
import random
import collections
import collections.abc

collections.Mapping = collections.abc.Mapping
from experta import *


class EmotionFact(Fact):
    pass


class EmoraExpertSystem(KnowledgeEngine):

    # =========================
    # HAPPY
    # =========================
    @Rule(EmotionFact(emotion='happy'))
    def happy(self):
        english = [
            "You’re glowing today ✨",
            "That happiness really suits you 💛",
            "Keep smiling like that 😄",
            "Your energy is amazing 🚀",
            "I love this vibe 🌈",
            "You look unstoppable today 🔥",
            "This is your best energy 💫"
        ]

        arabic = [
            "إنت منور النهاردة ✨",
            "السعادة لايقة عليك 💛",
            "فضل مبتسم كده 😄",
            "طاقتك جميلة جداً 🚀",
            "المود ده حلو 🌈",
            "شكلك مش قابل الإيقاف 🔥",
            "دي أحلى طاقة عندك 💫"
        ]

        print(f"\n[Emora English]: {random.choice(english)}\n[Emora Arabic] : {random.choice(arabic)}")

    # =====================================================================
    # UNKNOWN (طلعت بره على المحاذاة الصح والجمل المعتمدة بتاعتك المظبوطة)
    # =====================================================================
    @Rule(EmotionFact(emotion='unknown'))
    def respond_to_unknown(self):
        english_responses = [
            "Hmm, I'm not quite sure about this expression. Can you show me a clearer smile or face? 🤔",
            "Emora is a bit confused! Let's try another picture with clearer lighting! 🌟"
        ]
        arabic_responses = [
            "هممم، أنا مش متأكد أوي من التعبير ده. ممكن توريني ابتسامة أو ملامح أوضح؟ 🤔",
            "إيمورا محتار شوية! تعال نجرب صورة تانية بإضاءة أوضح يا بطل! 🌟"
        ]
        print(f"\n[Emora English]: {random.choice(english_responses)}")
        print(f"[Emora Arabic] : {random.choice(arabic_responses)}")

    # =========================
    # SAD
    # =========================
    @Rule(EmotionFact(emotion='sad'))
    def sad(self):
        english = [
            "I’m here for you ❤️",
            "It’s okay to feel sad 🤍",
            "This will pass 🌧️",
            "You’re not alone 🫶",
            "Take your time 🌿",
            "I’m listening 💬",
            "You matter even on hard days 💛"
        ]

        arabic = [
            "أنا جنبك ❤️",
            "عادي تزعل 🤍",
            "ده هيعدي 🌧️",
            "مش لوحدك 🫶",
            "خد وقتك 🌿",
            "أنا سامعك 💬",
            "إنت مهم حتى في الأيام الصعبة 💛"
        ]

        print(f"\n[Emora English]: {random.choice(english)}\n[Emora Arabic] : {random.choice(arabic)}")

    # =========================
    # ANGRY
    # =========================
    @Rule(EmotionFact(emotion='angry'))
    def angry(self):
        english = [
            "Take a deep breath 🌿",
            "Don’t let anger control you 🧠",
            "Pause before reacting ⚡",
            "I understand your anger 🤍",
            "Let it out safely 🌊",
            "Calm down slowly 🧘‍♂️",
            "Anger will pass like waves 🌊"
        ]

        arabic = [
            "اهدى وخد نفس 🌿",
            "ما تخليش الغضب يتحكم فيك 🧠",
            "استنى قبل ما ترد ⚡",
            "فاهم غضبك 🤍",
            "طلع الطاقة دي بهدوء 🌊",
            "اهدى واحدة واحدة 🧘‍♂️",
            "الغضب زي الموج وبيعدي 🌊"
        ]

        print(f"\n[Emora English]: {random.choice(english)}\n[Emora Arabic] : {random.choice(arabic)}")

    # =========================
    # NEUTRAL
    # =========================
    @Rule(EmotionFact(emotion='neutral'))
    def neutral(self):
        english = [
            "You seem calm 🍃",
            "Peaceful energy 🌙",
            "Just existing is okay ✨",
            "Balanced mood ⚖️",
            "Quiet mind is powerful 🌿",
            "Soft vibes today 🤍"
        ]

        arabic = [
            "إنت هادي 🍃",
            "طاقة رايقة 🌙",
            "مجرد الهدوء كفاية ✨",
            "مود متوازن ⚖️",
            "العقل الهادي قوة 🌿",
            "إحساس هادي وجميل 🤍"
        ]

        print(f"\n[Emora English]: {random.choice(english)}\n[Emora Arabic] : {random.choice(arabic)}")

    # =========================
    # DISGUST
    # =========================
    @Rule(EmotionFact(emotion='disgust'))
    def disgust(self):
        english = [
            "That feels uncomfortable 🤍",
            "It’s okay to react that way 🌿",
            "Try to step away from it 🧘‍♂️",
            "Focus on something better ✨",
            "I understand your feeling 💛"
        ]

        arabic = [
            "الإحساس ده طبيعي 🤍",
            "عادي تحس بكده 🌿",
            "ابعد عن الحاجة دي 🧘‍♂️",
            "خلينا نفكر في حاجة أحسن ✨",
            "فاهم إحساسك 💛"
        ]

        print(f"\n[Emora English]: {random.choice(english)}\n[Emora Arabic] : {random.choice(arabic)}")

    # =========================
    # FEAR
    # =========================
    @Rule(EmotionFact(emotion='fear'))
    def fear(self):
        english = [
            "You are safe 🤍",
            "Fear will pass 🌙",
            "Take a deep breath 🌿",
            "You are stronger than this 💪",
            "I’m here with you 🫶"
        ]

        arabic = [
            "إنت في أمان 🤍",
            "الخوف هيعدي 🌙",
            "خد نفس 🌿",
            "إنت أقوى 💪",
            "أنا جنبك 🫶"
        ]

        print(f"\n[Emora English]: {random.choice(english)}\n[Emora Arabic] : {random.choice(arabic)}")

    # =========================
    # SURPRISE
    # =========================
    @Rule(EmotionFact(emotion='surprise'))
    def surprise(self):
        english = [
            "Wow! That’s unexpected 😲",
            "Didn’t see that coming ⚡",
            "Big surprise ✨",
            "That must have shocked you 😄",
            "Interesting moment 👀"
        ]

        arabic = [
            "واو! مفاجأة 😲",
            "ما توقعتش ده ⚡",
            "مفاجأة كبيرة ✨",
            "أكيد اتفاجئت 😄",
            "لحظة غريبة 👀"
        ]

        print(f"\n[Emora English]: {random.choice(english)}\n[Emora Arabic] : {random.choice(arabic)}")

    # =========================
    # OTHERS (FALLBACK)
    # =========================
    @Rule(EmotionFact(emotion=MATCH.any_emotion))
    def others(self, any_emotion):
        # زودنا هنا unknown عشان نضمن عدم التداخل الحسابي والجمل ما تطلعش دبل
        known = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise', 'unknown']

        if any_emotion not in known:
            english = [
                f"I see a unique emotion: '{any_emotion}' 🌟",
                f"That’s interesting… '{any_emotion}' 🤍",
                f"Tell me more about '{any_emotion}' 💬",
                f"Every feeling matters ✨",
                f"I’ve never seen this emotion before 🌙"
            ]

            arabic = [
                f"ده شعور مختلف: '{any_emotion}' 🌟",
                f"إحساس غريب شوية 🤍",
                f"احكيلي أكتر 💬",
                f"كل شعور مهم ✨",
                f"أول مرة أشوف الإحساس ده 🌙"
            ]

            print(f"\n[Emora English]: {random.choice(english)}\n[Emora Arabic] : {random.choice(arabic)}")