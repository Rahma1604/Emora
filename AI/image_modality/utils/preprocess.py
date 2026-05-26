# -*- coding: utf-8 -*-
import cv2
import numpy as np
from tensorflow.keras.preprocessing import image

from .constants import IMG_SIZE


def preprocess_frame(frame):


    if len(frame.shape) == 2 or frame.shape[2] == 1:
        frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)
    elif frame.shape[2] == 4:
        frame = cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)

    resized = cv2.resize(frame, IMG_SIZE)

    arr = image.img_to_array(resized)
    arr = np.expand_dims(arr, axis=0)

    arr = (arr / 127.5) - 1.0

    return arr
