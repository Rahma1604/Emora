
import os
import tensorflow as tf

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_PATH = os.path.join(CURRENT_DIR, 'emora_pure_weights.weights.h5')

print("Building pure ResNet50V2 graph backbone...")
base_model = tf.keras.applications.ResNet50V2(weights=None, include_top=False, input_shape=(224, 224, 3))

model = tf.keras.models.Sequential([
    tf.keras.layers.Input(shape=(224, 224, 3)),
    base_model,
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dense(512, activation='relu'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dropout(0.5),
    tf.keras.layers.Dense(256, activation='relu'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.Dense(7, activation='softmax')
])

if os.path.exists(WEIGHTS_PATH):
    model.load_weights(WEIGHTS_PATH)
    print("🎯 SUCCESS: High-Accuracy ResNet weights safely loaded dynamically! 🎉")
else:
    print(f"⚠️ Warning: Weights file not found at {WEIGHTS_PATH}. Make sure it is placed inside AI/models/")

def load_model():
    return model