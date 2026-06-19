# 🧠 Emora – Children's Neurodevelopment Support System

## Overview

Emora is an AI-powered multimodal emotional and behavioral analysis system designed to help parents better understand their children's emotional and psychological well-being.

The system analyzes multiple forms of child-generated content, including text messages, facial expressions, and voice recordings, to identify emotional patterns and provide meaningful insights into the child's emotional state.

Using advanced Artificial Intelligence techniques, Emora combines Natural Language Processing (NLP), Computer Vision, Speech Processing, and Expert Systems to generate personalized reports, emotional indicators, and supportive recommendations for parents and specialists.

The platform also enables continuous monitoring of a child's emotional development over time, allowing parents and professionals to track progress, identify potential concerns, and provide timely guidance while maintaining privacy and data security.

---

# ✨ Features

### 📝 Emotion Detection from Text

Analyzes text inputs and predicts emotional states using Natural Language Processing techniques.

### 🎤 Emotion Detection from Voice

Converts speech into text using Speech-to-Text technology, then performs emotion classification on the extracted text.

### 😊 Emotion Detection from Facial Images

Detects facial expressions from uploaded images or live webcam feeds and classifies emotions using Computer Vision.

### 📊 Emotional Progress Tracking

Monitors emotional changes and behavioral patterns over time.

### 📄 Reports & Summaries

Generates emotional reports and summaries to support parents and specialists in understanding children's development.

### 🌍 Arabic & English Support

Supports bilingual emotion recognition for both Arabic and English users.

### 🧩 Expert System Integration

Provides personalized emotional feedback and recommendations based on detected emotions.

### 🤖 Deep Learning-Based Classification

Uses advanced transformer and convolutional neural network architectures for high-accuracy predictions.

### ☁️ Cloud-Based AI Inference

AI models are deployed on Hugging Face and accessed through secure APIs, enabling scalable and efficient emotion prediction.

### 🔄 Multimodal Architecture

Allows emotion recognition from multiple data sources within a unified intelligent platform.

---

# 🛠 Technologies Used

## Text & Voice Processing

### CAMeL-BERT (Hosted on Hugging Face)

Fine-tuned transformer model deployed on Hugging Face for Arabic and English emotion classification.

### OpenAI Whisper

Speech-to-Text model used for converting voice recordings into text before emotion analysis.

### PyTorch

Deep Learning framework used for training and inference of NLP models.

---

## Image Processing

### ResNet50V2 (Hosted on Hugging Face)

Fine-tuned convolutional neural network deployed on Hugging Face for facial emotion recognition.

### TensorFlow / Keras

Framework used for training and deploying image classification models.

### OpenCV

Used for:

* Face Detection
* Image Processing
* Real-Time Webcam Streaming

---

## Model Deployment & Serving

### Hugging Face

Used for hosting, managing, and serving trained AI models through secure Inference APIs.

---

## Expert System

### Experta

Rule-Based Expert System used to generate personalized responses and recommendations based on detected emotions.

---

## Development Tools

* Kaggle
* Google Colab
* PyCharm
* GitHub
* Vercel

---

# 😊 Supported Emotions

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
Hugging Face API
(CAMeL-BERT)
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
Hugging Face API
(ResNet50V2)
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
Text Preprocessing
      │
      ▼
Hugging Face API
(CAMeL-BERT)
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
    Hugging Face     Hugging Face      Whisper
    (CAMeL-BERT)     (ResNet50V2)
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

## Backend Deployment Flow

```text
User Input
     │
     ▼
Frontend Application
     │
     ▼
Backend API (Node.js)
     │
     ▼
Hugging Face Inference API
     │
     ▼
Emotion Prediction
     │
     ▼
Expert System
     │
     ▼
Reports & Recommendations
```

---

# 📁 Project Structure

```text
Emora/
│
├── .expo/
├── AI/
├── config/
├── FrontEnd/
├── middleware/
├── models/
├── routes/
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
├── tsconfig.json
├── vercel.json
└── README.md
```

---

# 🎯 Project Objectives

* Help parents better understand their children's emotional well-being.
* Detect emotions from text, voice, and facial expressions.
* Track emotional development over time.
* Generate reports and emotional summaries.
* Assist specialists in reviewing cases and providing recommendations.
* Maintain privacy and secure handling of user data.
* Support early emotional awareness and intervention.

---

# 🎓 Academic Information

Faculty of Science

Cairo University

Department of Mathematics

Computer Science Program

Graduation Project

Academic Year 2025 – 2026

Project Domain:

**Children's Neurodevelopment Support**

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
* Federated Learning for Privacy Preservation
* Advanced Behavioral Analytics Dashboard

---

# 👨‍💻 Team Project

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
