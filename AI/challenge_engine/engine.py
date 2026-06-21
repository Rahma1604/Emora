import random
from game_pool import GAME_POOL

def select_challenge(emotion, intensity="medium"):
    options = GAME_POOL.get(emotion, GAME_POOL["neutral"])

    # لو الحالة قوية (angry/anxious)
    if emotion in ["angry", "anxious"]:
        preferred = [c for c in options if "breathing" in c or "calm" in c]
        if preferred:
            return random.choice(preferred)

    return random.choice(options)