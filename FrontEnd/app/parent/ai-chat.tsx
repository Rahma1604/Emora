import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  LinearGradient,
} from "expo-linear-gradient";

import {
  Ionicons,
  Feather,
} from "@expo/vector-icons";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";

import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

import API from "../api";

type MessageSender =
  | "user"
  | "ai";

type MessageAttachment =
  | {
      type: "image";
      uri: string;
      name: string;
      mimeType: string;
    }
  | {
      type: "audio";
      uri: string;
      name: string;
      mimeType: string;
      durationMillis: number;
    };

type Message = {
  id: string;
  sender: MessageSender;
  text: string;
  createdAt: Date;
  attachments?: MessageAttachment[];
};

type SelectedImage = {
  uri: string;
  name: string;
  mimeType: string;
};

type SelectedAudio = {
  uri: string;
  name: string;
  mimeType: string;
  durationMillis: number;
};

type ApiErrorData = {
  error?: unknown;
  message?: unknown;
  detail?: unknown;
};

type AIAnalysisItem = {
  modality?: "text" | "image" | "voice" | string;
  emotion?: string;
  confidence?: number;
  percentage?: number;
  score?: number;
  content?: string;
  summary?: string;
  contexts?: string[];
  isReliable?: boolean;
};

type DiagnosticData = {
  diagnosis?: string;
  risk?: string;
  priority?: string;
  details?: string;
};

type MotherReport = {
  title?: string;
  message?: string;
  tips?: string[];
  urgent?: boolean;
  risk_level?: string;
  diagnosis?: string;
};

type TrackerReports = {
  diagnostic?: DiagnosticData;
  mother_report?: MotherReport;
  motherReport?: MotherReport;
  doctor_report?: Record<string, unknown>;
};

type RawAIResult = {
  status?: string;
  child_id?: string;
  analyses?: AIAnalysisItem[];
  diagnostic_result?: DiagnosticData;
  diagnosticResult?: DiagnosticData;
  reports?: TrackerReports | null;
  tracker_progress?: {
    current_day?: number;
    current_scores?: Record<string, number>;
  } | null;

  // Legacy response shapes
  image_analysis?: AIAnalysisItem;
  text_analysis?: AIAnalysisItem;
  voice_analysis?: AIAnalysisItem;
  audio_analysis?: AIAnalysisItem;
};

type CaseData = {
  aiDiagnosis?: string;
  aiSummary?: string;
  dominantEmotion?: string;
  emotionPercentage?: number;
  priority?: string;
};

type NormalizedResult = {
  diagnosis?: string;
  summary?: string;
  dominantEmotion?: string;
  confidence?: number;
  priority?: string;
  analyses?: {
    text?: AIAnalysisItem;
    image?: AIAnalysisItem;
    voice?: AIAnalysisItem;
  };
};

type AIResponseData = {
  success?: boolean;
  status?: string;
  message?: string;

  result?: NormalizedResult;
  case?: CaseData;
  rawAiResult?: RawAIResult;

  // Support an older Node response without breaking the screen.
  analysis?: RawAIResult;
};

const SUGGESTED_PROMPTS = [
  "My child seems anxious lately.",
  "I noticed a change in my child's behavior.",
  "My child has been unusually quiet.",
  "My child seems sad and avoids talking.",
];

function getSingleParam(
  value:
    | string
    | string[]
    | undefined
): string {
  if (
    Array.isArray(value)
  ) {
    return value[0] || "";
  }

  return value || "";
}

function createMessage(
  sender: MessageSender,
  text: string,
  attachments?: MessageAttachment[]
): Message {
  return {
    id:
      Date.now().toString() +
      "-" +
      Math.random()
        .toString(36)
        .slice(2),

    sender,
    text,
    attachments,
    createdAt:
      new Date(),
  };
}

function getFileName(
  uri: string,
  fallbackName: string
): string {
  const cleanUri =
    uri.split("?")[0];

  const name =
    cleanUri
      .split("/")
      .pop();

  return (
    name ||
    fallbackName
  );
}

function getImageMimeType(
  fileName: string,
  providedMimeType?:
    | string
    | null
): string {
  if (
    providedMimeType
  ) {
    return providedMimeType;
  }

  const lowerName =
    fileName.toLowerCase();

  if (
    lowerName.endsWith(
      ".png"
    )
  ) {
    return "image/png";
  }

  if (
    lowerName.endsWith(
      ".webp"
    )
  ) {
    return "image/webp";
  }

  if (
    lowerName.endsWith(
      ".heic"
    ) ||
    lowerName.endsWith(
      ".heif"
    )
  ) {
    return "image/heic";
  }

  return "image/jpeg";
}

function getAudioMimeType(
  fileName: string
): string {
  const lowerName =
    fileName.toLowerCase();

  if (
    lowerName.endsWith(
      ".wav"
    )
  ) {
    return "audio/wav";
  }

  if (
    lowerName.endsWith(
      ".mp3"
    )
  ) {
    return "audio/mpeg";
  }

  if (
    lowerName.endsWith(
      ".webm"
    )
  ) {
    return "audio/webm";
  }

  if (
    lowerName.endsWith(
      ".caf"
    )
  ) {
    return "audio/x-caf";
  }

  if (
    lowerName.endsWith(
      ".3gp"
    ) ||
    lowerName.endsWith(
      ".3gpp"
    )
  ) {
    return "audio/3gpp";
  }

  return "audio/mp4";
}

function formatDuration(
  durationMillis: number
): string {
  const totalSeconds =
    Math.max(
      0,
      Math.floor(
        durationMillis / 1000
      )
    );

  const minutes =
    Math.floor(
      totalSeconds / 60
    );

  const seconds =
    totalSeconds % 60;

  return `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function normalizeConfidence(
  value:
    | number
    | undefined
): number | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const numericValue =
    Number(value);

  if (
    Number.isNaN(
      numericValue
    )
  ) {
    return null;
  }

  const percentage =
    numericValue <= 1
      ? numericValue * 100
      : numericValue;

  return Math.min(
    100,
    percentage
  );
}

function getErrorText(
  value: unknown,
  fallback: string
): string {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (
    value &&
    typeof value === "object"
  ) {
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function getArrayAnalysis(
  analyses: AIAnalysisItem[] | undefined,
  modality: "text" | "image" | "voice"
): AIAnalysisItem | undefined {
  return analyses?.find(
    (item) =>
      String(item.modality || "").toLowerCase() === modality
  );
}

function formatEmotion(
  emotion: string
): string {
  const normalized = emotion.trim().toLowerCase();

  const labels: Record<string, string> = {
    angry: "anger",
    fear: "fear",
    happy: "happiness",
    neutral: "a neutral emotional state",
    sad: "sadness",
    surprise: "surprise",
    disgust: "disgust",
    unknown: "an unclear emotional state",
  };

  return labels[normalized] || emotion;
}

function buildAIReply(
  responseData: AIResponseData,
  childName: string
): string {
  const rawAI =
    responseData.rawAiResult ||
    responseData.analysis ||
    {};

  const rawAnalyses =
    Array.isArray(rawAI.analyses)
      ? rawAI.analyses
      : [];

  const normalizedAnalyses =
    responseData.result?.analyses ||
    {};

  const textAnalysis =
    normalizedAnalyses.text ||
    getArrayAnalysis(rawAnalyses, "text") ||
    rawAI.text_analysis ||
    {};

  const imageAnalysis =
    normalizedAnalyses.image ||
    getArrayAnalysis(rawAnalyses, "image") ||
    rawAI.image_analysis ||
    {};

  const voiceAnalysis =
    normalizedAnalyses.voice ||
    getArrayAnalysis(rawAnalyses, "voice") ||
    rawAI.voice_analysis ||
    rawAI.audio_analysis ||
    {};

  const trackerReports =
    rawAI.reports &&
    typeof rawAI.reports === "object"
      ? rawAI.reports
      : {};

  const diagnostic =
    trackerReports.diagnostic ||
    rawAI.diagnostic_result ||
    rawAI.diagnosticResult ||
    {};

  const motherReport =
    trackerReports.mother_report ||
    trackerReports.motherReport ||
    {};

  const dominantEmotion =
    responseData.result?.dominantEmotion ||
    responseData.case?.dominantEmotion ||
    textAnalysis.emotion ||
    imageAnalysis.emotion ||
    voiceAnalysis.emotion ||
    "";

  const confidence =
    normalizeConfidence(
      responseData.result?.confidence ??
        responseData.case?.emotionPercentage ??
        textAnalysis.confidence ??
        textAnalysis.percentage ??
        imageAnalysis.confidence ??
        voiceAnalysis.confidence
    );

  const diagnosis =
    responseData.result?.diagnosis ||
    responseData.case?.aiDiagnosis ||
    diagnostic.diagnosis ||
    "";

  const summary =
    responseData.result?.summary ||
    responseData.case?.aiSummary ||
    textAnalysis.summary ||
    textAnalysis.content ||
    diagnostic.details ||
    "";

  const priority =
    responseData.result?.priority ||
    responseData.case?.priority ||
    diagnostic.priority ||
    diagnostic.risk ||
    "";

  const tips =
    Array.isArray(motherReport.tips)
      ? motherReport.tips.filter(
          (tip): tip is string =>
            typeof tip === "string" && Boolean(tip.trim())
        )
      : [];

  const replyParts: string[] = [];

  if (imageAnalysis.emotion) {
    const imageConfidence =
      normalizeConfidence(
        imageAnalysis.confidence ??
          imageAnalysis.percentage ??
          imageAnalysis.score
      );

    replyParts.push(
      `Image analysis: ${formatEmotion(imageAnalysis.emotion)}${
        imageConfidence !== null
          ? ` (${imageConfidence.toFixed(1)}% confidence)`
          : ""
      }.`
    );
  }

  if (textAnalysis.emotion) {
    const textConfidence =
      normalizeConfidence(
        textAnalysis.confidence ??
          textAnalysis.percentage ??
          textAnalysis.score
      );

    replyParts.push(
      `Text analysis: ${childName}'s observation suggests ${formatEmotion(
        textAnalysis.emotion
      )}${
        textConfidence !== null
          ? ` (${textConfidence.toFixed(1)}% confidence)`
          : ""
      }.`
    );
  }

  if (voiceAnalysis.emotion) {
    const voiceConfidence =
      normalizeConfidence(
        voiceAnalysis.confidence ??
          voiceAnalysis.percentage ??
          voiceAnalysis.score
      );

    replyParts.push(
      `Voice analysis: ${formatEmotion(voiceAnalysis.emotion)}${
        voiceConfidence !== null
          ? ` (${voiceConfidence.toFixed(1)}% confidence)`
          : ""
      }.`
    );
  }

  if (
    !textAnalysis.emotion &&
    !imageAnalysis.emotion &&
    !voiceAnalysis.emotion &&
    dominantEmotion
  ) {
    replyParts.push(
      `Main emotional indicator: ${formatEmotion(dominantEmotion)}${
        confidence !== null
          ? ` (${confidence.toFixed(1)}% confidence)`
          : ""
      }.`
    );
  }

  if (diagnosis) {
    replyParts.push(
      `Current monitoring result:\n${diagnosis}`
    );
  }

  if (summary) {
    replyParts.push(summary);
  }

  if (motherReport.title) {
    replyParts.push(motherReport.title);
  }

  if (motherReport.message) {
    replyParts.push(motherReport.message);
  }

  if (priority) {
    replyParts.push(`Review level: ${priority}`);
  }

  if (tips.length > 0) {
    replyParts.push(
      "Helpful next steps:\n" +
        tips
          .map((tip, index) => `${index + 1}. ${tip}`)
          .join("\n")
    );
  }

  const currentDay =
    rawAI.tracker_progress?.current_day;

  if (
    typeof currentDay === "number" &&
    !trackerReports.diagnostic
  ) {
    replyParts.push(
      `Monitoring progress: day ${currentDay}. More entries may be needed before a fuller pattern can be generated.`
    );
  }

  if (replyParts.length === 0) {
    return (
      responseData.message ||
      `The entry for ${childName} was analyzed successfully.`
    );
  }

  return replyParts.join("\n\n");
}

export default function AIChatScreen() {
  const params =
    useLocalSearchParams<{
      childId?:
        | string
        | string[];

      childName?:
        | string
        | string[];

      childAge?:
        | string
        | string[];
    }>();

  const childId =
    getSingleParam(
      params.childId
    );

  const childName =
    getSingleParam(
      params.childName
    ) || "your child";

  const childAge =
    getSingleParam(
      params.childAge
    );

  const listRef =
    useRef<
      FlatList<Message>
    >(null);

  const audioRecorder =
    useAudioRecorder(
      RecordingPresets.HIGH_QUALITY
    );

  const recorderState =
    useAudioRecorderState(
      audioRecorder,
      200
    );

  const [
    input,
    setInput,
  ] = useState("");

  const [
    isAnalyzing,
    setIsAnalyzing,
  ] = useState(false);

  const [
    selectedImage,
    setSelectedImage,
  ] =
    useState<SelectedImage | null>(
      null
    );

  const [
    selectedAudio,
    setSelectedAudio,
  ] =
    useState<SelectedAudio | null>(
      null
    );

  const [
    isRecording,
    setIsRecording,
  ] = useState(false);

  const [
    isStoppingRecording,
    setIsStoppingRecording,
  ] = useState(false);

  const recordingActive =
    isRecording ||
    recorderState.isRecording;

  const [
    lastAnalysisSaved,
    setLastAnalysisSaved,
  ] = useState(false);

  const [
    messages,
    setMessages,
  ] = useState<Message[]>([
    createMessage(
      "ai",
      `Hi! Write an observation about ${childName}, attach an image, take a photo, or record a voice note, then send it for analysis.`
    ),
  ]);

  useEffect(() => {
    const timer =
      setTimeout(() => {
        listRef.current?.scrollToEnd(
          {
            animated: true,
          }
        );
      }, 120);

    return () =>
      clearTimeout(timer);
  }, [
    messages,
    isAnalyzing,
  ]);

  const userMessagesCount =
    messages.filter(
      (message) =>
        message.sender ===
        "user"
    ).length;

  const handleExpiredSession =
    async () => {
      try {
        await AsyncStorage.multiRemove(
          [
            "token",
            "user",
          ]
        );
      } catch (
        storageError
      ) {
        console.log(
          "SESSION CLEANUP ERROR:",
          storageError
        );
      }

      router.replace(
        "/auth/login" as never
      );
    };

  const pickImage =
    async () => {
      if (
        isAnalyzing ||
        recordingActive ||
        isStoppingRecording
      ) {
        return;
      }

      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (
          !permission.granted
        ) {
          Alert.alert(
            "Photos permission",
            "Please allow photo access to select an image for analysis."
          );

          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes: [
                "images",
              ],

              allowsEditing:
                true,

              quality:
                0.8,
            }
          );

        if (
          result.canceled ||
          !result.assets?.[0]
        ) {
          return;
        }

        const asset =
          result.assets[0];

        const fileName =
          asset.fileName ||
          getFileName(
            asset.uri,
            `child-image-${Date.now()}.jpg`
          );

        setSelectedImage({
          uri:
            asset.uri,

          name:
            fileName,

          mimeType:
            getImageMimeType(
              fileName,
              asset.mimeType
            ),
        });
      } catch (
        imageError
      ) {
        console.log(
          "IMAGE PICKER ERROR:",
          imageError
        );

        Alert.alert(
          "Unable to select image",
          "Please try selecting the image again."
        );
      }
    };

  const takePhoto =
    async () => {
      if (
        isAnalyzing ||
        recordingActive ||
        isStoppingRecording
      ) {
        return;
      }

      try {
        const permission =
          await ImagePicker.requestCameraPermissionsAsync();

        if (
          !permission.granted
        ) {
          Alert.alert(
            "Camera permission",
            "Please allow camera access to take a photo for analysis."
          );

          return;
        }

        const result =
          await ImagePicker.launchCameraAsync(
            {
              mediaTypes: [
                "images",
              ],

              allowsEditing:
                true,

              quality:
                0.8,
            }
          );

        if (
          result.canceled ||
          !result.assets?.[0]
        ) {
          return;
        }

        const asset =
          result.assets[0];

        const fileName =
          asset.fileName ||
          getFileName(
            asset.uri,
            `child-camera-${Date.now()}.jpg`
          );

        setSelectedImage({
          uri:
            asset.uri,

          name:
            fileName,

          mimeType:
            getImageMimeType(
              fileName,
              asset.mimeType
            ),
        });
      } catch (
        cameraError
      ) {
        console.log(
          "CAMERA ERROR:",
          cameraError
        );

        Alert.alert(
          "Unable to open camera",
          "Please try taking the photo again."
        );
      }
    };

  const startVoiceRecording =
    async () => {
      if (
        isAnalyzing ||
        recordingActive ||
        isStoppingRecording
      ) {
        return;
      }

      try {
        const permission =
          await requestRecordingPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Microphone permission",
            "Please allow microphone access to record a voice note."
          );

          return;
        }

        setSelectedAudio(null);
        setLastAnalysisSaved(false);

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
        setIsRecording(true);
      } catch (recordingError) {
        setIsRecording(false);

        console.log(
          "START RECORDING ERROR:",
          recordingError
        );

        try {
          await setAudioModeAsync({
            allowsRecording: false,
          });
        } catch {
          // Ignore audio mode reset errors.
        }

        Alert.alert(
          "Unable to record",
          "The voice recording could not be started."
        );
      }
    };

  const stopVoiceRecording =
    async (
      saveRecording = true
    ) => {
      if (
        (!recordingActive &&
          !isRecording) ||
        isStoppingRecording
      ) {
        return;
      }

      const durationMillis =
        recorderState.durationMillis ||
        0;

      setIsStoppingRecording(true);
      setIsRecording(false);

      try {
        await audioRecorder.stop();

        // Give the native recorder a moment to expose the final file URI.
        await new Promise((resolve) =>
          setTimeout(resolve, 120)
        );

        const recordingUri =
          audioRecorder.uri;

        if (
          saveRecording &&
          recordingUri
        ) {
          const fileName =
            getFileName(
              recordingUri,
              `child-voice-${Date.now()}.m4a`
            );

          setSelectedAudio({
            uri: recordingUri,
            name: fileName,
            mimeType:
              getAudioMimeType(
                fileName
              ),
            durationMillis,
          });
        } else if (
          saveRecording &&
          !recordingUri
        ) {
          throw new Error(
            "The recording file was not created."
          );
        }
      } catch (recordingError) {
        console.log(
          "STOP RECORDING ERROR:",
          recordingError
        );

        Alert.alert(
          "Unable to save recording",
          "Please record the voice note again."
        );
      } finally {
        setIsRecording(false);
        setIsStoppingRecording(false);

        try {
          await setAudioModeAsync({
            allowsRecording: false,
          });
        } catch {
          // Ignore audio mode reset errors.
        }
      }
    };

  const toggleVoiceRecording =
    async () => {
      if (
        recordingActive ||
        isRecording
      ) {
        await stopVoiceRecording();
      } else {
        await startVoiceRecording();
      }
    };

  const selectSuggestedPrompt =
    (
      prompt: string
    ) => {
      if (isAnalyzing) {
        return;
      }

      setInput(prompt);
    };

  const sendAnalysis =
    async () => {
      if (
        isAnalyzing ||
        recordingActive ||
        isStoppingRecording
      ) {
        return;
      }

      const cleanText =
        input.trim();

      if (!childId) {
        Alert.alert(
          "Child information missing",
          "Please return to the child profile and open AI Analysis again."
        );

        return;
      }

      if (
        !cleanText &&
        !selectedImage &&
        !selectedAudio
      ) {
        Alert.alert(
          "Entry required",
          "Please write an observation, add an image, take a photo, or record a voice note before starting the analysis."
        );

        return;
      }

      const token =
        await AsyncStorage.getItem(
          "token"
        );

      if (!token) {
        await handleExpiredSession();
        return;
      }

      const imageToSend =
        selectedImage;

      const audioToSend =
        selectedAudio;

      const attachments:
        MessageAttachment[] = [];

      if (imageToSend) {
        attachments.push({
          type:
            "image",

          uri:
            imageToSend.uri,

          name:
            imageToSend.name,

          mimeType:
            imageToSend.mimeType,
        });
      }

      if (audioToSend) {
        attachments.push({
          type:
            "audio",

          uri:
            audioToSend.uri,

          name:
            audioToSend.name,

          mimeType:
            audioToSend.mimeType,

          durationMillis:
            audioToSend.durationMillis,
        });
      }

      const fallbackText =
        imageToSend && audioToSend
          ? "Image and voice note submitted for analysis."
          : imageToSend
            ? "Image submitted for analysis."
            : "Voice note submitted for analysis.";

      const userMessage =
        createMessage(
          "user",
          cleanText || fallbackText,
          attachments.length > 0
            ? attachments
            : undefined
        );

      setMessages(
        (
          currentMessages
        ) => [
          ...currentMessages,
          userMessage,
        ]
      );

      setInput("");
      setSelectedImage(null);
      setSelectedAudio(null);
      setLastAnalysisSaved(false);
      setIsAnalyzing(true);

      try {
        const formData =
          new FormData();

        formData.append(
          "child_id",
          childId
        );

        if (cleanText) {
          formData.append(
            "text",
            cleanText
          );
        }

        if (imageToSend) {
          formData.append(
            "file",
            {
              uri:
                imageToSend.uri,

              name:
                imageToSend.name,

              type:
                imageToSend.mimeType,
            } as any
          );
        }

        if (audioToSend) {
          formData.append(
            "audio",
            {
              uri:
                audioToSend.uri,

              name:
                audioToSend.name,

              type:
                audioToSend.mimeType,
            } as any
          );
        }

        const response =
          await API.post<AIResponseData>(
            "/ai/analyze",
            formData,
            {
              timeout:
                180000,

              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

        console.log(
          "AI ANALYSIS RESPONSE:",
          response.data
        );

        const reply =
          buildAIReply(
            response.data,
            childName
          );

        setMessages(
          (
            currentMessages
          ) => [
            ...currentMessages,

            createMessage(
              "ai",
              reply
            ),
          ]
        );

        setLastAnalysisSaved(
          true
        );
      } catch (
        requestError
      ) {
        setLastAnalysisSaved(
          false
        );

        console.log(
          "AI ANALYSIS ERROR:",
          requestError
        );

        if (
          axios.isAxiosError(
            requestError
          )
        ) {
          const status =
            requestError.response
              ?.status;

          const responseData =
            requestError.response
              ?.data as
              | ApiErrorData
              | undefined;

          if (
            status === 401
          ) {
            await handleExpiredSession();
            return;
          }

          let errorMessage =
            getErrorText(
              responseData?.error ??
                responseData?.message ??
                responseData?.detail,
              "The AI service could not process this analysis."
            );

          if (
            requestError.code ===
            "ECONNABORTED"
          ) {
            errorMessage =
              "The AI analysis took too long. Please try again.";
          }

          if (
            status === 409
          ) {
            errorMessage =
              getErrorText(
                responseData?.error,
                "No approved specialist is currently available for this child."
              );
          }

          if (
            status === 503
          ) {
            errorMessage =
              getErrorText(
                responseData?.error,
                "The Python AI service is not running."
              );
          }

          if (
            errorMessage.includes(
              "WinError 2"
            ) ||
            errorMessage
              .toLowerCase()
              .includes(
                "ffmpeg"
              )
          ) {
            errorMessage =
              "Voice transcription is unavailable because FFmpeg is not installed or is not available in the system PATH.";
          }

          setMessages(
            (
              currentMessages
            ) => [
              ...currentMessages,

              createMessage(
                "ai",
                "I’m sorry, the analysis could not be completed.\n\n" +
                  errorMessage
              ),
            ]
          );
        } else {
          setMessages(
            (
              currentMessages
            ) => [
              ...currentMessages,

              createMessage(
                "ai",
                "I’m sorry, an unexpected error occurred while analyzing the entry."
              ),
            ]
          );
        }
      } finally {
        setIsAnalyzing(false);
      }
    };

  const startNewConversation =
    () => {
      Alert.alert(
        "Start a new analysis?",
        "The messages on this screen will be cleared. Previously saved analyses will remain in the child's case.",
        [
          {
            text:
              "Cancel",

            style:
              "cancel",
          },

          {
            text:
              "Start New",

            onPress:
              async () => {
                if (
                  recordingActive
                ) {
                  await stopVoiceRecording(
                    false
                  );
                }

                setInput("");
                setSelectedImage(
                  null
                );
                setSelectedAudio(
                  null
                );
                setLastAnalysisSaved(
                  false
                );

                setMessages([
                  createMessage(
                    "ai",
                    `Write an observation about ${childName}, select an image, take a photo, or record a voice note, then send it for analysis.`
                  ),
                ]);
              },
          },
        ]
      );
    };

  const renderMessage = ({
    item,
  }: {
    item: Message;
  }) => {
    const isUser =
      item.sender ===
      "user";

    const hasAttachments =
      Boolean(
        item.attachments?.length
      );

    return (
      <View
        style={[
          styles.messageRow,

          isUser
            ? styles.userMessageRow
            : styles.aiMessageRow,
        ]}
      >
        {!isUser ? (
          <LinearGradient
            colors={[
              "#B9D8F6",
              "#DDF6F1",
            ]}
            style={
              styles.avatar
            }
          >
            <Ionicons
              name="sparkles"
              size={16}
              color="#3976A4"
            />
          </LinearGradient>
        ) : null}

        <View
          style={[
            styles.messageBubble,

            isUser
              ? styles.userBubble
              : styles.aiBubble,

            hasAttachments
              ? styles.imageBubble
              : null,
          ]}
        >
          {item.attachments?.map(
            (
              attachment,
              index
            ) =>
              attachment.type ===
              "image" ? (
                <Image
                  key={`${attachment.uri}-${index}`}
                  source={{
                    uri:
                      attachment.uri,
                  }}
                  style={
                    styles.messageImage
                  }
                  resizeMode="cover"
                />
              ) : (
                <View
                  key={`${attachment.uri}-${index}`}
                  style={
                    styles.audioMessageAttachment
                  }
                >
                  <View
                    style={
                      styles.audioMessageIcon
                    }
                  >
                    <Ionicons
                      name="mic"
                      size={18}
                      color="#3976A4"
                    />
                  </View>

                  <View
                    style={
                      styles.audioMessageContent
                    }
                  >
                    <Text
                      style={
                        styles.audioMessageTitle
                      }
                    >
                      Voice recording
                    </Text>

                    <Text
                      style={
                        styles.audioMessageSubtitle
                      }
                    >
                      {formatDuration(
                        attachment.durationMillis
                      )}
                    </Text>
                  </View>
                </View>
              )
          )}

          <Text
            style={[
              styles.messageText,

              isUser
                ? styles.userMessageText
                : styles.aiMessageText,

              hasAttachments
                ? styles.messageTextWithAttachment
                : null,
            ]}
          >
            {item.text}
          </Text>
        </View>

        {isUser ? (
          <LinearGradient
            colors={[
              "#FBC0BF",
              "#FFE1DD",
            ]}
            style={
              styles.avatar
            }
          >
            <Feather
              name="user"
              size={16}
              color="#B65A61"
            />
          </LinearGradient>
        ) : null}
      </View>
    );
  };

  const renderListFooter =
    () => (
      <View>
        {isAnalyzing ? (
          <View
            style={[
              styles.messageRow,
              styles.aiMessageRow,
            ]}
          >
            <LinearGradient
              colors={[
                "#B9D8F6",
                "#DDF6F1",
              ]}
              style={
                styles.avatar
              }
            >
              <Ionicons
                name="sparkles"
                size={16}
                color="#3976A4"
              />
            </LinearGradient>

            <View
              style={
                styles.typingBubble
              }
            >
              <ActivityIndicator
                size="small"
                color="#629EC9"
              />

              <Text
                style={
                  styles.typingText
                }
              >
                AI is analyzing the entry...
              </Text>
            </View>
          </View>
        ) : null}

        {lastAnalysisSaved &&
        !isAnalyzing ? (
          <View
            style={
              styles.summaryCard
            }
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={21}
              color="#4D8B67"
            />

            <View
              style={
                styles.summaryContent
              }
            >
              <Text
                style={
                  styles.summaryTitle
                }
              >
                Analysis saved
              </Text>

              <Text
                style={
                  styles.summaryDescription
                }
              >
                The result was added to {childName}&apos;s emotional tracking case.
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    );

  const canSend =
    Boolean(
      (
        selectedImage ||
        selectedAudio ||
        input.trim()
      ) &&
      !isAnalyzing &&
      !recordingActive &&
      !isStoppingRecording
    );

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <KeyboardAvoidingView
        style={
          styles.keyboardContainer
        }
        behavior={
          Platform.OS ===
          "ios"
            ? "padding"
            : undefined
        }
      >
        <View
          style={styles.container}
        >
          <LinearGradient
            colors={[
              "rgba(185,216,246,0.45)",
              "rgba(255,255,255,0.90)",
              "rgba(251,192,191,0.35)",
            ]}
            start={{
              x: 0,
              y: 0,
            }}
            end={{
              x: 1,
              y: 0,
            }}
            style={
              styles.headerGradient
            }
          />

          <View
            style={styles.header}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                router.back()
              }
              style={
                styles.headerButton
              }
              disabled={
                isAnalyzing
              }
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#222222"
              />
            </TouchableOpacity>

            <View
              style={
                styles.headerContent
              }
            >
              <View
                style={
                  styles.titleRow
                }
              >
                <Ionicons
                  name="sparkles"
                  size={17}
                  color="#629EC9"
                />

                <Text
                  style={
                    styles.headerTitle
                  }
                >
                  AI Analysis
                </Text>
              </View>

              <Text
                style={
                  styles.childLabel
                }
                numberOfLines={1}
              >
                Analyzing{" "}
                {childName}
                {childAge
                  ? `, ${childAge} years`
                  : ""}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={
                startNewConversation
              }
              style={
                styles.headerButton
              }
              disabled={
                isAnalyzing
              }
            >
              <Ionicons
                name="refresh-outline"
                size={23}
                color="#222222"
              />
            </TouchableOpacity>
          </View>

          <View
            style={
              styles.disclaimer
            }
          >
            <Ionicons
              name="information-circle-outline"
              size={17}
              color="#718096"
            />

            <Text
              style={
                styles.disclaimerText
              }
            >
              Write an observation, add an image, take a photo, or record a voice note. AI results are emotional indicators and must be reviewed by a specialist.
            </Text>
          </View>

          {userMessagesCount ===
          0 ? (
            <View
              style={
                styles.promptsSection
              }
            >
              <Text
                style={
                  styles.promptsTitle
                }
              >
                Suggested observations
              </Text>

              <View
                style={
                  styles.promptsContainer
                }
              >
                {SUGGESTED_PROMPTS.map(
                  (
                    prompt
                  ) => (
                    <TouchableOpacity
                      key={
                        prompt
                      }
                      activeOpacity={0.8}
                      disabled={
                        isAnalyzing
                      }
                      onPress={() =>
                        selectSuggestedPrompt(
                          prompt
                        )
                      }
                      style={
                        styles.promptChip
                      }
                    >
                      <Ionicons
                        name="create-outline"
                        size={15}
                        color="#3976A4"
                      />

                      <Text
                        style={
                          styles.promptText
                        }
                      >
                        {prompt}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          ) : null}

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(
              item
            ) => item.id}
            renderItem={
              renderMessage
            }
            ListFooterComponent={
              renderListFooter
            }
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={
              styles.messagesContent
            }
          />

          <View
            style={
              styles.inputArea
            }
          >
            {selectedImage ? (
              <View
                style={
                  styles.attachmentPreview
                }
              >
                <Image
                  source={{
                    uri:
                      selectedImage.uri,
                  }}
                  style={
                    styles.previewImage
                  }
                />

                <View
                  style={
                    styles.previewInformation
                  }
                >
                  <Text
                    style={
                      styles.previewTitle
                    }
                    numberOfLines={1}
                  >
                    {selectedImage.name}
                  </Text>

                  <Text
                    style={
                      styles.previewSubtitle
                    }
                  >
                    Image ready for analysis
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={
                    isAnalyzing ||
                    recordingActive
                  }
                  onPress={() =>
                    setSelectedImage(
                      null
                    )
                  }
                  style={
                    styles.removeAttachmentButton
                  }
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color="#555555"
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={
                  styles.mediaActionsRow
                }
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={
                    pickImage
                  }
                  disabled={
                    isAnalyzing ||
                    recordingActive
                  }
                  style={[
                    styles.mediaActionButton,
                    styles.mediaActionButtonSpacing,
                  ]}
                >
                  <View
                    style={
                      styles.mediaActionIcon
                    }
                  >
                    <Ionicons
                      name="image-outline"
                      size={21}
                      color="#3976A4"
                    />
                  </View>

                  <View
                    style={
                      styles.mediaActionTextContainer
                    }
                  >
                    <Text
                      style={
                        styles.selectImageTitle
                      }
                    >
                      Select image
                    </Text>

                    <Text
                      style={
                        styles.selectImageDescription
                      }
                    >
                      Open gallery
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={
                    takePhoto
                  }
                  disabled={
                    isAnalyzing ||
                    recordingActive
                  }
                  style={
                    styles.mediaActionButton
                  }
                >
                  <View
                    style={
                      styles.mediaActionIcon
                    }
                  >
                    <Ionicons
                      name="camera-outline"
                      size={21}
                      color="#3976A4"
                    />
                  </View>

                  <View
                    style={
                      styles.mediaActionTextContainer
                    }
                  >
                    <Text
                      style={
                        styles.selectImageTitle
                      }
                    >
                      Take photo
                    </Text>

                    <Text
                      style={
                        styles.selectImageDescription
                      }
                    >
                      Open camera
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {recordingActive ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  stopVoiceRecording()
                }
                disabled={
                  isStoppingRecording
                }
                style={[
                  styles.attachmentPreview,
                  styles.recordingPreview,
                ]}
              >
                <View
                  style={
                    styles.recordingDot
                  }
                />

                <View
                  style={
                    styles.previewInformation
                  }
                >
                  <Text
                    style={
                      styles.previewTitle
                    }
                  >
                    {isStoppingRecording
                      ? "Saving voice note..."
                      : "Recording voice..."}
                  </Text>

                  <Text
                    style={
                      styles.previewSubtitle
                    }
                  >
                    {formatDuration(
                      recorderState.durationMillis ||
                      0
                    )} · Tap this red bar to stop
                  </Text>
                </View>

                <View
                  style={
                    styles.stopRecordingButton
                  }
                >
                  {isStoppingRecording ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <Ionicons
                      name="stop"
                      size={17}
                      color="#FFFFFF"
                    />
                  )}
                </View>
              </TouchableOpacity>
            ) : selectedAudio ? (
              <View
                style={
                  styles.attachmentPreview
                }
              >
                <View
                  style={
                    styles.audioPreviewIcon
                  }
                >
                  <Ionicons
                    name="mic"
                    size={21}
                    color="#3976A4"
                  />
                </View>

                <View
                  style={
                    styles.previewInformation
                  }
                >
                  <Text
                    style={
                      styles.previewTitle
                    }
                    numberOfLines={1}
                  >
                    Voice recording
                  </Text>

                  <Text
                    style={
                      styles.previewSubtitle
                    }
                  >
                    {formatDuration(
                      selectedAudio.durationMillis
                    )} · Ready for analysis
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={
                    isAnalyzing
                  }
                  onPress={() =>
                    setSelectedAudio(
                      null
                    )
                  }
                  style={
                    styles.removeAttachmentButton
                  }
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color="#555555"
                  />
                </TouchableOpacity>
              </View>
            ) : null}

            <View
              style={
                styles.inputContainer
              }
            >
              <TextInput
                value={input}
                onChangeText={
                  setInput
                }
                placeholder={`Write what you noticed about ${childName}...`}
                placeholderTextColor="#A0A0A0"
                multiline
                maxLength={1000}
                editable={
                  !isAnalyzing
                }
                style={styles.input}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={
                  isAnalyzing ||
                  isStoppingRecording
                }
                onPress={
                  toggleVoiceRecording
                }
                style={[
                  styles.microphoneButton,

                  recordingActive
                    ? styles.recordingMicrophoneButton
                    : null,
                ]}
              >
                <Ionicons
                  name={
                    recordingActive
                      ? "stop"
                      : "mic-outline"
                  }
                  size={20}
                  color={
                    recordingActive
                      ? "#FFFFFF"
                      : "#3976A4"
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={!canSend}
                onPress={
                  sendAnalysis
                }
                style={[
                  styles.sendButtonWrapper,

                  !canSend &&
                    styles.disabledSendButton,
                ]}
              >
                <LinearGradient
                  colors={[
                    "#B9D8F6",
                    "#FBC0BF",
                  ]}
                  start={{
                    x: 0,
                    y: 0,
                  }}
                  end={{
                    x: 1,
                    y: 1,
                  }}
                  style={
                    styles.sendButton
                  }
                >
                  {isAnalyzing ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <Ionicons
                      name="send"
                      size={18}
                      color="#FFFFFF"
                    />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View
              style={
                styles.inputFooter
              }
            >
              <Text
                style={
                  styles.characterCounter
                }
              >
                {input.length}/1000
              </Text>

              <Text
                style={
                  canSend
                    ? styles.readyLabel
                    : styles.requiredLabel
                }
              >
                {canSend
                  ? "Ready to analyze"
                  : "Observation, image, or voice required"}
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        "#FFFFFF",
    },

    keyboardContainer: {
      flex: 1,
    },

    container: {
      flex: 1,
      backgroundColor:
        "#FAFCFE",
    },

    headerGradient: {
      position:
        "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 130,
    },

    header: {
      minHeight: 72,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor:
        "rgba(225,225,225,0.55)",
    },

    headerButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "rgba(255,255,255,0.60)",
    },

    headerContent: {
      flex: 1,
      alignItems:
        "center",
      paddingHorizontal: 8,
    },

    titleRow: {
      flexDirection: "row",
      alignItems:
        "center",
    },

    headerTitle: {
      marginLeft: 6,
      fontSize: 17,
      fontWeight: "700",
      color: "#1F2937",
    },

    childLabel: {
      marginTop: 4,
      fontSize: 12,
      color: "#718096",
      maxWidth: 230,
    },

    disclaimer: {
      flexDirection: "row",
      alignItems:
        "center",
      marginHorizontal: 16,
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor:
        "#F1F6FA",
      borderWidth: 1,
      borderColor:
        "#E5EDF3",
    },

    disclaimerText: {
      flex: 1,
      marginLeft: 7,
      fontSize: 11,
      lineHeight: 16,
      color: "#718096",
    },

    promptsSection: {
      paddingHorizontal: 16,
      paddingTop: 15,
    },

    promptsTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: "#4B5563",
      marginBottom: 10,
    },

    promptsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
    },

    promptChip: {
      flexDirection: "row",
      alignItems:
        "center",
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#DDEAF4",
      borderRadius: 18,
      paddingHorizontal: 11,
      paddingVertical: 8,
      marginRight: 8,
      marginBottom: 8,
    },

    promptText: {
      marginLeft: 5,
      fontSize: 11,
      fontWeight: "600",
      color: "#3976A4",
    },

    messagesContent: {
      paddingHorizontal: 14,
      paddingTop: 16,
      paddingBottom: 15,
    },

    messageRow: {
      width: "100%",
      flexDirection: "row",
      alignItems:
        "flex-end",
      marginBottom: 15,
    },

    aiMessageRow: {
      justifyContent:
        "flex-start",
    },

    userMessageRow: {
      justifyContent:
        "flex-end",
    },

    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent:
        "center",
      alignItems:
        "center",
      marginHorizontal: 6,
    },

    messageBubble: {
      maxWidth: "76%",
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 18,
    },

    aiBubble: {
      backgroundColor:
        "#FFFFFF",
      borderBottomLeftRadius: 5,
      borderWidth: 1,
      borderColor:
        "#E8EDF2",
    },

    userBubble: {
      backgroundColor:
        "#FCE3E2",
      borderBottomRightRadius: 5,
    },

    imageBubble: {
      padding: 7,
    },

    messageImage: {
      width: 210,
      height: 175,
      borderRadius: 13,
      backgroundColor:
        "#E9EEF2",
    },

    messageText: {
      fontSize: 13,
      lineHeight: 20,
    },

    messageTextWithAttachment: {
      marginTop: 8,
      paddingHorizontal: 5,
    },

    aiMessageText: {
      color: "#374151",
    },

    userMessageText: {
      color: "#333333",
    },

    typingBubble: {
      maxWidth: "78%",
      minHeight: 48,
      flexDirection: "row",
      alignItems:
        "center",
      paddingHorizontal: 14,
      borderRadius: 18,
      borderBottomLeftRadius: 5,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E8EDF2",
    },

    typingText: {
      flex: 1,
      marginLeft: 8,
      fontSize: 11,
      lineHeight: 16,
      color: "#718096",
    },

    summaryCard: {
      marginHorizontal: 6,
      marginTop: 5,
      marginBottom: 12,
      padding: 14,
      borderRadius: 18,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#DCEAF4",
      flexDirection: "row",
      alignItems:
        "center",
    },

    summaryContent: {
      flex: 1,
      marginLeft: 10,
    },

    summaryTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: "#263238",
    },

    summaryDescription: {
      marginTop: 4,
      fontSize: 10,
      lineHeight: 15,
      color: "#718096",
    },

    inputArea: {
      paddingHorizontal: 14,
      paddingTop: 9,
      paddingBottom:
        Platform.OS ===
        "ios"
          ? 8
          : 12,
      backgroundColor:
        "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor:
        "#EAECEF",
    },

    attachmentPreview: {
      minHeight: 61,
      flexDirection: "row",
      alignItems:
        "center",
      padding: 8,
      marginBottom: 8,
      borderRadius: 15,
      backgroundColor:
        "#F5F8FA",
      borderWidth: 1,
      borderColor:
        "#E4EAF0",
    },

    previewImage: {
      width: 46,
      height: 46,
      borderRadius: 10,
      backgroundColor:
        "#E5E7EB",
    },

    previewInformation: {
      flex: 1,
      marginLeft: 10,
    },

    previewTitle: {
      fontSize: 11,
      fontWeight: "700",
      color: "#374151",
    },

    previewSubtitle: {
      marginTop: 3,
      fontSize: 9,
      color: "#718096",
    },

    removeAttachmentButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#FFFFFF",
    },

    selectImageCard: {
      minHeight: 64,
      flexDirection: "row",
      alignItems:
        "center",
      paddingHorizontal: 11,
      paddingVertical: 8,
      marginBottom: 8,
      borderRadius: 15,
      backgroundColor:
        "#EDF6FD",
      borderWidth: 1,
      borderColor:
        "#D4E8F6",
    },

    selectImageIcon: {
      width: 43,
      height: 43,
      borderRadius: 22,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#FFFFFF",
    },

    selectImageContent: {
      flex: 1,
      marginHorizontal: 10,
    },

    selectImageTitle: {
      fontSize: 11,
      fontWeight: "700",
      color: "#3976A4",
    },

    selectImageDescription: {
      marginTop: 3,
      fontSize: 9,
      color: "#718096",
    },

    mediaActionsRow: {
      flexDirection: "row",
      marginBottom: 8,
    },

    mediaActionButton: {
      flex: 1,
      minHeight: 62,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 15,
      backgroundColor: "#EDF6FD",
      borderWidth: 1,
      borderColor: "#D4E8F6",
    },

    mediaActionButtonSpacing: {
      marginRight: 8,
    },

    mediaActionIcon: {
      width: 39,
      height: 39,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
    },

    mediaActionTextContainer: {
      flex: 1,
      marginLeft: 8,
    },

    recordingPreview: {
      borderColor: "#F4C4C4",
      backgroundColor: "#FFF3F3",
    },

    recordingDot: {
      width: 13,
      height: 13,
      borderRadius: 7,
      backgroundColor: "#E55B5B",
      marginHorizontal: 10,
    },

    stopRecordingButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#E55B5B",
      marginLeft: 8,
      marginRight: 4,
    },

    audioPreviewIcon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#E8F4FC",
    },

    audioMessageAttachment: {
      minWidth: 190,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 9,
      borderRadius: 13,
      backgroundColor: "rgba(255,255,255,0.65)",
      borderWidth: 1,
      borderColor: "rgba(57,118,164,0.14)",
    },

    audioMessageIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#E8F4FC",
    },

    audioMessageContent: {
      flex: 1,
      marginLeft: 9,
    },

    audioMessageTitle: {
      fontSize: 11,
      fontWeight: "700",
      color: "#374151",
    },

    audioMessageSubtitle: {
      marginTop: 2,
      fontSize: 9,
      color: "#718096",
    },

    microphoneButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 4,
      backgroundColor: "#E8F4FC",
    },

    recordingMicrophoneButton: {
      backgroundColor: "#E55B5B",
    },

    inputContainer: {
      minHeight: 54,
      maxHeight: 120,
      flexDirection: "row",
      alignItems:
        "flex-end",
      paddingLeft: 12,
      paddingRight: 6,
      paddingVertical: 6,
      borderRadius: 27,
      backgroundColor:
        "#F5F7F9",
      borderWidth: 1,
      borderColor:
        "#E4E7EB",
    },

    input: {
      flex: 1,
      minHeight: 39,
      maxHeight: 100,
      paddingTop: 10,
      paddingBottom: 8,
      paddingHorizontal: 4,
      fontSize: 13,
      lineHeight: 19,
      color: "#222222",
      textAlignVertical:
        "top",
    },

    sendButtonWrapper: {
      marginLeft: 4,
    },

    disabledSendButton: {
      opacity: 0.4,
    },

    sendButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    inputFooter: {
      marginTop: 5,
      paddingHorizontal: 7,
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
    },

    characterCounter: {
      fontSize: 9,
      color: "#A0A0A0",
    },

    readyLabel: {
      fontSize: 9,
      color: "#4D8B67",
      fontWeight: "600",
    },

    requiredLabel: {
      fontSize: 9,
      color: "#B65A61",
      fontWeight: "600",
    },
  });