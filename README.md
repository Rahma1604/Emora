# 🧠 Emora – Multimodal Emotion Recognition System

## Overview

Emora is an AI-powered multimodal emotion recognition system designed to analyze human emotions from three primary input modalities:

* 📝 Text
* 😊 Facial Images
* 🎤 Voice

The system combines state-of-the-art Deep Learning models with a Rule-Based Expert System to detect emotional states and provide personalized responses, emotional support, and mental health recommendations.

The goal of Emora is to create an intelligent emotional assistant capable of understanding users through multiple communication channels while supporting both Arabic and English languages.

---

# ✨ Features

### 📝 Emotion Detection from Text

Analyzes text inputs and predicts the user's emotional state using Natural Language Processing techniques.

### 🎤 Emotion Detection from Voice

Converts speech into text using Speech-to-Text technology, then performs emotion classification on the extracted text.

### 😊 Emotion Detection from Facial Images

Detects facial expressions from uploaded images or live webcam feeds and classifies emotions using Computer Vision.

### 🌍 Arabic & English Support

Supports bilingual emotion recognition for both Arabic and English users.

### 🧩 Expert System Integration

Provides personalized emotional feedback and recommendations based on the detected emotion.

### 🤖 Deep Learning-Based Classification

Uses advanced transformer and convolutional neural network architectures for high-accuracy predictions.

### 🔄 Multimodal Architecture

Allows emotion recognition from multiple data sources within a unified system.

---

# 🛠 Technologies Used

## Text & Voice Processing

### CAMel-BERT

Multilingual Transformer model used for emotion classification in Arabic and English text.

### OpenAI Whisper

Speech-to-Text model used for converting voice recordings into text before emotion analysis.

### PyTorch

Framework used for training and inference of NLP models.

---

## Image Processing

### ResNet50V2

Deep Convolutional Neural Network used for facial emotion recognition.

### TensorFlow / Keras

Framework used for training and deploying image classification models.

### OpenCV

Used for:

* Face Detection
* Image Processing
* Real-Time Webcam Streaming

---

## Expert System

### Experta

Rule-Based Expert System used to generate personalized responses based on predicted emotions.

---

## Development Tools

* Kaggle
* Google Colab
* PyCharm
* GitHub
* Vercel

---

# 😊 Supported Emotions

The system currently supports the following emotion categories:

| Emotion     | Description                |
| ----------- | -------------------------- |
| 😊 Happy    | Joy, Happiness, Excitement |
| 😢 Sad      | Sadness, Loneliness        |
| 😠 Angry    | Anger, Frustration         |
| 😨 Fear     | Fear, Anxiety              |
| 😐 Neutral  | Emotionally Neutral        |
| 😮 Surprise | Surprise, Shock            |
| 🤢 Disgust  | Disgust, Aversion          |

---

# 🔄 System Workflow

## Text Emotion Recognition Pipeline

```text
User Text Input
        │
        ▼
Text Preprocessing
(Tokenization & Cleaning)
        │
        ▼
CAMel-BERT
        │
        ▼
Emotion Classification
        │
        ▼
Expert System
        │
        ▼
Personalized Response & Recommendation
```

---

## Image Emotion Recognition Pipeline

```text
Image Input / Webcam Frame
            │
            ▼
Face Detection
(OpenCV)
            │
            ▼
Face Preprocessing
(Resize & Normalization)
            │
            ▼
ResNet50V2
            │
            ▼
Emotion Classification
            │
            ▼
Expert System
            │
            ▼
Personalized Response & Recommendation
```

---

## Voice Emotion Recognition Pipeline

```text
Voice Input
      │
      ▼
Speech-to-Text
(OpenAI Whisper)
      │
      ▼
Extracted Text
      │
      ▼
Text Preprocessing (Tokenization & Cleaning)
      │
      ▼
CAMel-BERT
      │
      ▼
Emotion Classification
      │
      ▼
Expert System
      │
      ▼
Personalized Response & Recommendation
```

---

## Complete System Architecture

```text
                ┌─────────────┐
                │ User Input  │
                └──────┬──────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
     Text            Image          Voice
       │               │               │
       ▼               ▼               ▼
  CAMel-BERT      ResNet50V2       Whisper
       │               │               │
       └───────────────┼───────────────┘
                       │
                       ▼
             Emotion Classification
                       │
                       ▼
                 Expert System
                       │
                       ▼
       Personalized Feedback & Support
```

---

# 📁 Project Structure

```text
Emora/
│
├── .expo/                # Expo configuration and build files
├── AI/                   # AI models, training notebooks, and inference scripts
├── config/               # Configuration files
├── FrontEnd/             # Mobile/Web frontend application
├── middleware/           # Backend middleware functions
├── models/               # Database models and schemas
├── routes/               # API routes and endpoints
├── .gitignore
├── package.json
├── package-lock.json
├── server.js             # Backend server entry point
├── tsconfig.json
├── vercel.json
└── README.md
```

---

# 🚀 Future Improvements

* Advanced Multimodal Fusion Models
* Attention-Based Feature Fusion
* Enhanced Arabic Dialect Support
* Personalized Mental Health Recommendation Engine
* Continuous Learning System
* Mobile Application Deployment
* Web Application Deployment
* Real-Time Emotion Monitoring

---

# 👨‍💻 Team Project

Graduation Project – Computer Science 2026

This project integrates concepts from:

* Software Development
* Artificial Intelligence
* Machine Learning
* Deep Learning
* Natural Language Processing
* Computer Vision
* Expert Systems
* Human-Computer Interaction

---

# 📄 License

This project is developed for educational and research purposes only.
