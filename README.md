# Emora – Multimodal Emotion Recognition System

## Overview

Emora is an AI-powered multimodal emotion recognition system designed to analyze human emotions from different input modalities including text and facial images. The project combines Deep Learning models with an Expert System to provide emotion-aware responses and recommendations.

The system aims to support mental health awareness by detecting emotional states and generating appropriate feedback based on the predicted emotion.

---

## Features

* Emotion Detection from Text
* Emotion Detection from Facial Images
* Arabic and English Language Support
* Real-time Webcam Emotion Recognition
* Expert System for Personalized Responses
* Deep Learning-Based Classification
* Multimodal Architecture

---

## Technologies Used

### 1. Text & Voice Processing
* **CAMel-BERT:** For high-accuracy Arabic and English text emotion classification.
* **OpenAI Whisper (Local Base Model):** For robust Speech-to-Text (STT) transcription of bilingual audio inputs.
* **TensorFlow / Keras** (or your specific NLP framework)

### 2. Image Processing
* **ResNet50V2:** For facial expression feature extraction and classification.
* **TensorFlow / Keras**
* **OpenCV:** For face detection and real-time webcam frame processing.

### 3. Expert System & Tools
* **Experta / Python:** For building the personalized mental health response rule engine.
* **Development Environments:** PyCharm (Local Backend Implementation), Kaggle & Google Colab (Model Training), GitHub (Version Control).

---
## Project Structure

Emora/
│
├── .expo/                # Expo configuration and build tools
├── AI/                   # Python AI models, notebooks, and scripts
├── config/               # System configuration files (Database, APIs, etc.)
├── FrontEnd/             # Mobile / Web Frontend codebase
├── middleware/           # Backend middleware functions (Auth, Validation, etc.)
├── models/               # Database models / schemas
├── routes/               # API endpoints & server routing
├── .gitignore            # Git ignored files
├── package.json          # Node.js project dependencies and scripts
├── package-lock.json     # Locked dependency versions
├── server.js             # Main backend server entry point
├── tsconfig.json         # TypeScript configuration
└── vercel.json           # Vercel deployment configurations

---

## Emotion Categories

The system currently supports the following emotions:

* Happy
* Sad
* Angry
* Fear
* Neutral
* Surprise
* Disgust

---

## Workflow

### Text Pipeline

Input Text

↓

Text Preprocessing

↓

CAMel-BERT

↓

Emotion Prediction

↓

Expert System Response

---

### Image Pipeline

Input Image

↓

Face Detection

↓

ResNet50V2

↓

Emotion Prediction

↓

Expert System Response

---

### Voice Pipeline

Input Audio

↓

OpenAI Whisper (STT)

↓

Extracted Text

↓

CAMel-BERT

↓

Emotion Prediction

↓

Expert System Response

---

## Future Improvements

* Advanced Multimodal Fusion Module (Feature-Level Attention Mechanisms).
* Deepening the Expert System's Clinical Recommendation Engine.
* Fine-Tuned Arabic Dialect Support.
* Full Cross-Platform Web and Mobile Application Deployment.

---

## Team Project

This project was developed as a Senior Graduation Project (Class of 2026), focusing on Artificial Intelligence, Software Development, Natural Language Processing (NLP), Computer Vision (CV), and Expert Systems.
---

## License

This project is developed for educational and research purposes.
