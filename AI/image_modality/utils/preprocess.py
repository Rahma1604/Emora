# -*- coding: utf-8 -*-
import cv2
import numpy as np
from tensorflow.keras.preprocessing import image
from AI.image_modality.utils.constants import IMG_SIZE  # تأكدي من مسار الـ constants حسب الفولدرات عندك


def preprocess_frame(frame):
    # 1. التأكد التام إن الصورة 3 قنوات (RGB) حتى لو الأصلية أبيض وأسود
    if len(frame.shape) == 2 or frame.shape[2] == 1:
        frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)
    elif frame.shape[2] == 4:  # لو الصورة فيها Transparency (PNG)
        frame = cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)

    # 2. تغيير الحجم للـ (224, 224) المتوافقة مع ريزنت
    resized = cv2.resize(frame, IMG_SIZE)

    # 3. التحويل لـ Array وإضافة أبعاد الـ Batch
    arr = image.img_to_array(resized)
    arr = np.expand_dims(arr, axis=0)

    # 4. التقييس الحسابي الصافي (-1 إلى 1)
    arr = (arr / 127.5) - 1.0
    return arr