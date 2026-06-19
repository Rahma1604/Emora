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

### 🔄 Multimodal Architecture

Allows emotion recognition from multiple data sources within a unified intelligent platform.

---

# 🛠 Technologies Used

## Text & Voice Processing

### CAMeL-BERT

Transformer-based language model used for Arabic and English emotion classification.

### OpenAI Whisper

Speech-to-Text model used for converting voice recordings into text before emotion analysis.

### PyTorch

Deep Learning framework used for training and inference of NLP models.

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

Rule-Based Expert System used to generate personalized responses and recommendations based on detected emotions.

---

## Development Tools

* Kaggle
* Google Colab
* PyCharm
* GitHub
* Vercel

---

# 😊 Supported Emotions & Emotional Indicators

| Emotion     | Description                | Possible Child Indicators / Associated Conditions                                           | Interpretation                                                            |
| ----------- | -------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 😊 Happy    | Joy, Happiness, Excitement | Positive mood, confidence, enjoyment, good social interaction                               | Child appears emotionally healthy, comfortable, and in a positive state   |
| 😐 Neutral  | Emotionally Neutral        | Calm behavior, emotional balance, normal daily activities                                   | Child appears stable and emotionally okay                                 |
| 😢 Sad      | Sadness, Loneliness        | Withdrawal, crying, low motivation, loneliness, loss of interest                            | May indicate emotional distress, sadness, or need for emotional support   |
| 😠 Angry    | Anger, Frustration         | Irritability, aggression, frustration, emotional outbursts, difficulty controlling emotions | May indicate stress, frustration, or emotional regulation difficulties    |
| 😨 Fear     | Fear, Anxiety              | Worry, nervousness, avoidance, insecurity, excessive concern                                | May indicate anxiety, fear-related responses, or feeling unsafe           |
| 😮 Surprise | Surprise, Shock            | Sudden reactions, confusion, unexpected emotional response                                  | Usually a temporary emotional reaction depending on context               |
| 🤢 Disgust  | Disgust, Aversion          | Rejection, discomfort, negative reactions, avoidance                                        | May indicate dislike, discomfort, or negative response toward a situation |

---

# 🧩 Expert System Integration

The system uses an Expert System to analyze detected emotions and generate personalized emotional feedback and recommendations.

The recommendations are based on:

* Detected emotional state
* Emotional patterns over time
* Possible behavioral indicators

Example:

* Happy / Neutral → Child appears emotionally stable and in a good condition.
* Sad → System may suggest emotional support and monitoring of mood changes.
* Angry → System may suggest calming strategies and understanding possible frustration causes.
* Fear → System may suggest providing reassurance and identifying possible anxiety triggers.
* Surprise / Disgust → System evaluates the context before generating recommendations.


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
CAMeL-BERT
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
Text Preprocessing
      │
      ▼
CAMeL-BERT
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
  CAMeL-BERT      ResNet50V2       Whisper
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

This project is developed for educational and research purposes only. لو عايزة اعدل دي و اعمل ان الموديلز على اuggin face
