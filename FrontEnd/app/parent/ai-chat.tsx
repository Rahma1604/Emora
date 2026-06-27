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

import API from "../api";

type MessageSender =
  | "user"
  | "ai";

type MessageAttachment = {
  type: "image";
  uri: string;
  name: string;
  mimeType: string;
};

type Message = {
  id: string;
  sender: MessageSender;
  text: string;
  createdAt: Date;
  attachment?: MessageAttachment;
};

type SelectedImage = {
  uri: string;
  name: string;
  mimeType: string;
};

type ApiErrorData = {
  error?: string;
  message?: string;
  detail?: string;
};

type ImageAnalysis = {
  emotion?: string;
};

type TextAnalysis = {
  emotion?: string;
  confidence?: number;
  percentage?: number;
  summary?: string;
};

type DiagnosticData = {
  diagnosis?: string;
  details?: string;
};

type MotherReport = {
  message?: string;
  tips?: string[];
};

type DiagnosticResult = {
  diagnosis?: string;

  diagnostic?:
    | DiagnosticData
    | string;

  mother_report?:
    MotherReport;

  motherReport?:
    MotherReport;
};

type AIAnalysis = {
  status?: string;

  image_analysis?:
    ImageAnalysis;

  text_analysis?:
    TextAnalysis;

  diagnostic_result?:
    DiagnosticResult;
};

type CaseData = {
  aiDiagnosis?: string;
  aiSummary?: string;
  dominantEmotion?: string;
  emotionPercentage?: number;
  priority?: string;
};

type AIResponseData = {
  status?: string;
  message?: string;

  analysis?:
    AIAnalysis;

  case?:
    CaseData;
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
  attachment?: MessageAttachment
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
    attachment,
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

function getDiagnosticData(
  value:
    | DiagnosticData
    | string
    | undefined
): DiagnosticData {
  if (
    typeof value ===
    "string"
  ) {
    return {
      diagnosis:
        value,
    };
  }

  return value || {};
}

function buildAIReply(
  responseData: AIResponseData,
  childName: string
): string {
  const analysis =
    responseData.analysis ||
    {};

  const imageAnalysis =
    analysis.image_analysis ||
    {};

  const textAnalysis =
    analysis.text_analysis ||
    {};

  const diagnosticResult =
    analysis.diagnostic_result ||
    {};

  const diagnostic =
    getDiagnosticData(
      diagnosticResult.diagnostic
    );

  const motherReport =
    diagnosticResult.mother_report ||
    diagnosticResult.motherReport ||
    {};

  const imageEmotion =
    imageAnalysis.emotion ||
    "";

  const textEmotion =
    textAnalysis.emotion ||
    responseData.case
      ?.dominantEmotion ||
    "";

  const confidence =
    normalizeConfidence(
      textAnalysis.confidence ??
        textAnalysis.percentage ??
        responseData.case
          ?.emotionPercentage
    );

  const diagnosis =
    diagnostic.diagnosis ||
    diagnosticResult.diagnosis ||
    responseData.case
      ?.aiDiagnosis ||
    "";

  const details =
    diagnostic.details ||
    textAnalysis.summary ||
    responseData.case
      ?.aiSummary ||
    "";

  const motherMessage =
    motherReport.message ||
    "";

  const tips =
    Array.isArray(
      motherReport.tips
    )
      ? motherReport.tips
      : [];

  const replyParts:
    string[] = [];

  if (imageEmotion) {
    replyParts.push(
      `The image shows a ${imageEmotion} emotional expression.`
    );
  }

  if (textEmotion) {
    const confidenceText =
      confidence !== null
        ? ` with ${confidence.toFixed(
            1
          )}% confidence`
        : "";

    replyParts.push(
      `The written observation suggests that ${childName} may be experiencing ${textEmotion}${confidenceText}.`
    );
  }

  if (diagnosis) {
    replyParts.push(
      `Current monitoring result:\n${diagnosis}`
    );
  }

  if (details) {
    replyParts.push(
      details
    );
  }

  if (motherMessage) {
    replyParts.push(
      motherMessage
    );
  }

  if (
    tips.length > 0
  ) {
    replyParts.push(
      "Helpful next steps:\n" +
        tips
          .map(
            (
              tip,
              index
            ) =>
              `${index + 1}. ${tip}`
          )
          .join("\n")
    );
  }

  if (
    replyParts.length ===
    0
  ) {
    return (
      responseData.message ||
      `The image and observation about ${childName} were analyzed successfully.`
    );
  }

  return replyParts.join(
    "\n\n"
  );
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
    messages,
    setMessages,
  ] = useState<Message[]>([
    createMessage(
      "ai",
      `Hi! To analyze ${childName}'s emotional indicators, select a clear image or drawing and write a short observation about what you noticed.`
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
      if (isAnalyzing) {
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
      if (isAnalyzing) {
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

      if (!selectedImage) {
        Alert.alert(
          "Image required",
          "Please select an image or drawing before starting the analysis."
        );

        return;
      }

      if (!cleanText) {
        Alert.alert(
          "Observation required",
          "Please write a short observation about the image or the child's recent behavior."
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

      const userMessage =
        createMessage(
          "user",
          cleanText,
          {
            type:
              "image",

            uri:
              imageToSend.uri,

            name:
              imageToSend.name,

            mimeType:
              imageToSend.mimeType,
          }
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
      setIsAnalyzing(true);

      try {
        const formData =
          new FormData();

        /*
          أسماء الحقول مطابقة
          لـNode وFastAPI.
        */
        formData.append(
          "child_id",
          childId
        );

        formData.append(
          "text",
          cleanText
        );

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

        /*
          لا نكتب Content-Type يدويًا.
          Axios يضيف multipart boundary.
        */
        const response =
          await API.post<AIResponseData>(
            "/ai/analyze",
            formData,
            {
              timeout:
                180000,
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
      } catch (
        requestError
      ) {
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
            responseData?.error ||
            responseData?.message ||
            responseData?.detail ||
            "The AI service could not process this analysis.";

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
              responseData?.error ||
              "No approved specialist is currently available for this child.";
          }

          if (
            status === 503
          ) {
            errorMessage =
              responseData?.error ||
              "The Python AI service is not running.";
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
                "I’m sorry, an unexpected error occurred while analyzing the image."
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
              () => {
                setInput("");
                setSelectedImage(
                  null
                );

                setMessages([
                  createMessage(
                    "ai",
                    `Select a clear image or drawing and write a short observation about ${childName}.`
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

            item.attachment
              ? styles.imageBubble
              : null,
          ]}
        >
          {item.attachment ? (
            <Image
              source={{
                uri:
                  item.attachment
                    .uri,
              }}
              style={
                styles.messageImage
              }
              resizeMode="cover"
            />
          ) : null}

          <Text
            style={[
              styles.messageText,

              isUser
                ? styles.userMessageText
                : styles.aiMessageText,

              item.attachment
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
                AI is analyzing the image and observation...
              </Text>
            </View>
          </View>
        ) : null}

        {userMessagesCount >
          0 &&
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
      selectedImage &&
      input.trim() &&
      !isAnalyzing
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
              Select an image and write an observation. AI results are emotional indicators, not a medical diagnosis.
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
                    isAnalyzing
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
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={
                  pickImage
                }
                disabled={
                  isAnalyzing
                }
                style={
                  styles.selectImageCard
                }
              >
                <View
                  style={
                    styles.selectImageIcon
                  }
                >
                  <Ionicons
                    name="image-outline"
                    size={22}
                    color="#3976A4"
                  />
                </View>

                <View
                  style={
                    styles.selectImageContent
                  }
                >
                  <Text
                    style={
                      styles.selectImageTitle
                    }
                  >
                    Select image or drawing
                  </Text>

                  <Text
                    style={
                      styles.selectImageDescription
                    }
                  >
                    An image is required for the current AI model
                  </Text>
                </View>

                <Ionicons
                  name="add-circle-outline"
                  size={21}
                  color="#3976A4"
                />
              </TouchableOpacity>
            )}

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
                  : "Image + observation required"}
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