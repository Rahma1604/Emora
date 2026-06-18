# -*- coding: utf-8 -*-
import os
import tensorflow as tf

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_PATH = os.path.join(CURRENT_DIR, 'emora_pure_weights.weights.h5')

print("Building pure ResNet50V2 graph backbone...")


base_model = tf.keras.applications.ResNet50V2(
    weights=None,
    include_top=False,
    input_shape=(224, 224, 3)
)
base_model.trainable = False

inputs = tf.keras.Input(shape=(224, 224, 3))
x = base_model(inputs, training=False)
x = tf.keras.layers.GlobalAveragePooling2D()(x)
x = tf.keras.layers.Dense(512, activation='relu')(x)
x = tf.keras.layers.BatchNormalization()(x)
x = tf.keras.layers.Dropout(0.5)(x)
x = tf.keras.layers.Dense(256, activation='relu')(x)
x = tf.keras.layers.BatchNormalization()(x)
x = tf.keras.layers.Dropout(0.3)(x)
outputs = tf.keras.layers.Dense(7, activation='softmax')(x)

model = tf.keras.Model(inputs, outputs)

if os.path.exists(WEIGHTS_PATH):
    model.load_weights(WEIGHTS_PATH)
    print("🎯 SUCCESS: Emora weights loaded successfully! 🎉")
else:
    print(f"⚠️  WARNING: Weights file not found!")
    print(f"   Expected path: {WEIGHTS_PATH}")
    print("   ➡️  Download emora_pure_weights.weights.h5 and place it in AI/image_modality/models/")


def load_model():
    return model
