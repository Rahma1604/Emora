import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  router,
  useLocalSearchParams,
  type Href,
} from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import API from "../api";

const girlPhoto = require("../../assets/images/images/girl.png");
const boyPhoto = require("../../assets/images/images/boy.png");

type CaseStatus =
  | "pending"
  | "reviewed"
  | "closed"
  | "improving"
  | string;

type ChildInfo = {
  id?: string;
  _id?: string;
  name?: string;
  age?: number;
  gender?: string;
  parentId?: string;
};

type CaseDetailsResponse = {
  caseId?: string;
  childId?: string;
  childInfo?: ChildInfo;

  progressStatus?: {
    label?: string;
    description?: string;
  };

  entriesInfo?: {
    totalEntries?: number;
    lastAnalysisDate?: string | null;
  };

  currentAnalysis?: {
    text?: string;
  };

  emotionData?: {
    emotion?: string;
    percentage?: number;
    keywords?: string[];
  };

  entriesCount?: number;
  lastAnalysisDate?: string | null;
  dominantEmotion?: string;
  emotionPercentage?: number;
  aiDiagnosis?: string;
  aiSummary?: string;
  childProgress?: string;
  status?: CaseStatus;
  priority?: string;
  doctorRecommendation?: string;
  recurringPatterns?: string[];
  createdAt?: string;
};

type HistoryCase = {
  _id?: string;
  childId?:
    | string
    | {
        _id?: string;
        id?: string;
      };
};

type ReviewResponse = {
  success?: boolean;
  message?: string;
  notificationSent?: boolean;
  case?: {
    status?: CaseStatus;
    doctorRecommendation?: string;
  };
};

type ModalType =
  | "recommendation_required"
  | "submit_success"
  | "submit_error"
  | "already_reviewed";

type ModalContent = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  message: string;
  buttonText: string;
};

const getParamValue = (
  value?: string | string[]
): string => {
  return Array.isArray(value)
    ? value[0] || ""
    : value || "";
};

const formatDate = (
  value?: string | null
): string => {
  if (!value) {
    return "Not available";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
};

const normalizePercentage = (
  value?: number
): number => {
  if (
    value === undefined ||
    value === null ||
    Number.isNaN(Number(value))
  ) {
    return 0;
  }

  const numberValue = Number(value);

  const normalized =
    numberValue <= 1
      ? numberValue * 100
      : numberValue;

  return Math.max(
    0,
    Math.min(100, normalized)
  );
};

const getRequestErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const responseData = error.response
    ?.data as
    | {
        message?: unknown;
        error?: unknown;
        detail?: unknown;
      }
    | undefined;

  const candidate =
    responseData?.message ??
    responseData?.error ??
    responseData?.detail;

  if (
    typeof candidate === "string" &&
    candidate.trim()
  ) {
    return candidate;
  }

  return fallback;
};

const getHistoryChildId = (
  item: HistoryCase
): string => {
  if (typeof item.childId === "string") {
    return item.childId;
  }

  return (
    item.childId?._id ||
    item.childId?.id ||
    ""
  );
};

export default function ReviewCaseScreen() {
  const params = useLocalSearchParams<{
    caseId?: string | string[];
    childId?: string | string[];
  }>();

  const caseIdParam = getParamValue(
    params.caseId
  );

  const childIdParam = getParamValue(
    params.childId
  );

  const recommendationInputRef =
    useRef<TextInput>(null);

  const [
    caseData,
    setCaseData,
  ] =
    useState<CaseDetailsResponse | null>(
      null
    );

  const [
    resolvedCaseId,
    setResolvedCaseId,
  ] = useState("");

  const [
    recommendation,
    setRecommendation,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    screenError,
    setScreenError,
  ] = useState("");

  const [
    actionModal,
    setActionModal,
  ] = useState<ModalType | null>(
    null
  );

  const handleExpiredSession =
    useCallback(async () => {
      await AsyncStorage.multiRemove([
        "token",
        "user",
      ]);

      router.replace(
        "/auth/login" as Href
      );
    }, []);

  const resolveCaseId =
    useCallback(async (): Promise<string> => {
      if (caseIdParam) {
        return caseIdParam;
      }

      if (!childIdParam) {
        return "";
      }

      const historyResponse =
        await API.get<HistoryCase[]>(
          "/doctor/history"
        );

      const matchingCase =
        historyResponse.data.find(
          (item) =>
            getHistoryChildId(item) ===
            childIdParam
        );

      return matchingCase?._id || "";
    }, [
      caseIdParam,
      childIdParam,
    ]);

  const loadCase =
    useCallback(
      async (
        mode:
          | "initial"
          | "refresh" = "initial"
      ) => {
        if (mode === "refresh") {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setScreenError("");

        try {
          const targetCaseId =
            await resolveCaseId();

          if (!targetCaseId) {
            throw new Error(
              "Case ID is missing. Open this screen from a case card or notification."
            );
          }

          const response =
            await API.get<CaseDetailsResponse>(
              `/doctor/case-details/${targetCaseId}`
            );

          setResolvedCaseId(
            response.data.caseId ||
              targetCaseId
          );

          setCaseData(response.data);

          setRecommendation(
            response.data
              .doctorRecommendation ||
              ""
          );
        } catch (error) {
          console.log(
            "LOAD CASE ERROR:",
            error
          );

          if (
            axios.isAxiosError(error) &&
            error.response?.status === 401
          ) {
            await handleExpiredSession();
            return;
          }

          setScreenError(
            error instanceof Error &&
              error.message.includes(
                "Case ID is missing"
              )
              ? error.message
              : getRequestErrorMessage(
                  error,
                  "The case details could not be loaded."
                )
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        handleExpiredSession,
        resolveCaseId,
      ]
    );

  useEffect(() => {
    void loadCase("initial");
  }, [loadCase]);

  const childInfo =
    caseData?.childInfo || {};

  const childName =
    childInfo.name ||
    "Unknown child";

  const childId =
    caseData?.childId ||
    childInfo.id ||
    childInfo._id ||
    childIdParam;

  const caseStatus =
    caseData?.status ||
    "pending";

  const isReviewed =
    caseStatus === "reviewed";

  const isClosed =
    caseStatus === "closed";

  const childAvatar =
    String(
      childInfo.gender || ""
    )
      .trim()
      .toLowerCase() ===
    "female"
      ? girlPhoto
      : boyPhoto;

  const dominantEmotion =
    caseData?.emotionData?.emotion ||
    caseData?.dominantEmotion ||
    "Not available";

  const confidence =
    normalizePercentage(
      caseData?.emotionData
        ?.percentage ??
        caseData?.emotionPercentage
    );

  const tags = useMemo(() => {
    const source =
      caseData?.emotionData
        ?.keywords ||
      caseData?.recurringPatterns ||
      [];

    return Array.from(
      new Set(
        source.filter(
          (item): item is string =>
            typeof item === "string" &&
            Boolean(item.trim())
        )
      )
    );
  }, [caseData]);

  const totalEntries =
    caseData?.entriesInfo
      ?.totalEntries ??
    caseData?.entriesCount ??
    0;

  const lastAnalysisDate =
    caseData?.entriesInfo
      ?.lastAnalysisDate ??
    caseData?.lastAnalysisDate ??
    caseData?.createdAt;

  const progressLabel =
    caseData?.progressStatus?.label ||
    caseData?.childProgress ||
    caseStatus;

  const progressDescription =
    caseData?.progressStatus
      ?.description ||
    "The child's emotional progress requires continued monitoring.";

  const currentAnalysis =
    caseData?.currentAnalysis?.text ||
    "No current text analysis is available.";

  const aiSummary =
    caseData?.aiSummary ||
    caseData?.aiDiagnosis ||
    "No AI summary is available.";

  const handleBack = () => {
    router.back();
  };

  const handleViewOverview = () => {
    if (!childId) {
      return;
    }

    router.push(
      `/doctor/child-overview?childId=${encodeURIComponent(
        childId
      )}&caseId=${encodeURIComponent(
        resolvedCaseId
      )}` as Href
    );
  };

  const submitRecommendation =
    async () => {
      if (submitting) {
        return;
      }

      if (!recommendation.trim()) {
        setActionModal(
          "recommendation_required"
        );

        return;
      }

      if (!resolvedCaseId) {
        setActionModal("submit_error");
        return;
      }

      if (isClosed) {
        setActionModal("submit_error");
        return;
      }

      try {
        setSubmitting(true);

        const response =
          await API.put<ReviewResponse>(
            `/doctor/review-case/${resolvedCaseId}`,
            {
              doctorRecommendation:
                recommendation.trim(),
            }
          );

        setCaseData(
          (currentCase) => ({
            ...currentCase,
            status:
              response.data.case
                ?.status ||
              "reviewed",
            doctorRecommendation:
              response.data.case
                ?.doctorRecommendation ||
              recommendation.trim(),
          })
        );

        setActionModal(
          "submit_success"
        );
      } catch (error) {
        console.log(
          "SUBMIT RECOMMENDATION ERROR:",
          error
        );

        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401
        ) {
          await handleExpiredSession();
          return;
        }

        setActionModal("submit_error");
      } finally {
        setSubmitting(false);
      }
    };

  const handleMarkAsReviewed =
    () => {
      if (isReviewed) {
        setActionModal(
          "already_reviewed"
        );
        return;
      }

      void submitRecommendation();
    };

  const getStatusText = () => {
    if (isReviewed) {
      return "Reviewed";
    }

    if (isClosed) {
      return "Closed";
    }

    return "Pending Review";
  };

  const getModalContent =
    (): ModalContent => {
      switch (actionModal) {
        case "recommendation_required":
          return {
            icon: "create-outline",
            iconColor: "#6799C2",
            title:
              "Add your recommendation",
            message:
              "The backend requires a professional recommendation before the case can be marked as reviewed.",
            buttonText:
              "Back to Writing",
          };

        case "submit_success":
          return {
            icon:
              "checkmark-circle-outline",
            iconColor: "#4CAC62",
            title:
              "Recommendation sent",
            message:
              `Your recommendation for ${childName} was saved. The parent notification is handled by the backend.`,
            buttonText: "Done",
          };

        case "already_reviewed":
          return {
            icon:
              "shield-checkmark-outline",
            iconColor: "#5E96C2",
            title:
              "Already reviewed",
            message:
              `${childName}'s case is already marked as reviewed.`,
            buttonText: "Got It",
          };

        case "submit_error":
        default:
          return {
            icon:
              "alert-circle-outline",
            iconColor: "#D95C64",
            title:
              "We couldn't submit it",
            message:
              "The recommendation could not be saved. Check the backend terminal and try again.",
            buttonText: "Close",
          };
      }
    };

  const modalContent =
    getModalContent();

  const closeModal = () => {
    const shouldFocus =
      actionModal ===
      "recommendation_required";

    setActionModal(null);

    if (shouldFocus) {
      setTimeout(() => {
        recommendationInputRef.current?.focus();
      }, 250);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.centerState}
      >
        <ActivityIndicator
          size="large"
          color="#6799C2"
        />

        <Text
          style={styles.stateTitle}
        >
          Loading case...
        </Text>
      </SafeAreaView>
    );
  }

  if (screenError || !caseData) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />

        <View
          style={styles.errorHeader}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color="#1F2937"
            />
          </TouchableOpacity>

          <Text
            style={styles.headerTitle}
          >
            Review Case
          </Text>

          <View
            style={
              styles.headerPlaceholder
            }
          />
        </View>

        <View
          style={styles.centerState}
        >
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color="#D95C64"
          />

          <Text
            style={styles.stateTitle}
          >
            Case unavailable
          </Text>

          <Text
            style={styles.stateMessage}
          >
            {screenError}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.retryButton}
            onPress={() =>
              void loadCase("initial")
            }
          >
            <Text
              style={
                styles.retryButtonText
              }
            >
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <LinearGradient
          colors={[
            "#FFFFFF",
            "#FFF9F9",
            "#F8FCFF",
          ]}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        >
          <ScrollView
            contentContainerStyle={
              styles.scrollContent
            }
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() =>
                  void loadCase(
                    "refresh"
                  )
                }
                tintColor="#6799C2"
              />
            }
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.7}
                onPress={handleBack}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color="#1F2937"
                />
              </TouchableOpacity>

              <Text
                style={styles.headerTitle}
              >
                Review Case
              </Text>

              <TouchableOpacity
                style={
                  styles.headerRefresh
                }
                activeOpacity={0.7}
                onPress={() =>
                  void loadCase(
                    "refresh"
                  )
                }
                disabled={refreshing}
              >
                <Ionicons
                  name="refresh-outline"
                  size={21}
                  color="#1F2937"
                />
              </TouchableOpacity>
            </View>

            <View
              style={styles.childCard}
            >
              <View
                style={
                  styles.childDecorationLeft
                }
              />

              <View
                style={
                  styles.childDecorationRight
                }
              />

              <View
                style={
                  styles.childAvatarWrapper
                }
              >
                <Image
                  source={childAvatar}
                  style={styles.childAvatar}
                  contentFit="cover"
                />
              </View>

              <View
                style={
                  styles.childInformation
                }
              >
                <Text
                  style={styles.childName}
                >
                  {childName}
                </Text>

                <Text
                  style={
                    styles.childDetails
                  }
                >
                  Child ID{" "}
                  {childId
                    ? `#${childId.slice(
                        -6
                      )}`
                    : "Not available"}{" "}
                  ·{" "}
                  {childInfo.age ??
                    "—"}{" "}
                  years old
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  isReviewed &&
                    styles.reviewedBadge,
                  isClosed &&
                    styles.closedBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isReviewed &&
                      styles.reviewedBadgeText,
                    isClosed &&
                      styles.closedBadgeText,
                  ]}
                >
                  {getStatusText()}
                </Text>
              </View>
            </View>

            <View
              style={styles.summaryRow}
            >
              <View
                style={[
                  styles.summaryCard,
                  styles.trendCard,
                ]}
              >
                <Ionicons
                  name="trending-up-outline"
                  size={27}
                  color="#202A26"
                />

                <Text
                  style={
                    styles.summaryLabel
                  }
                >
                  {progressLabel}
                </Text>

                <Text
                  style={
                    styles.summaryDescription
                  }
                >
                  {progressDescription}
                </Text>
              </View>

              <View
                style={[
                  styles.summaryCard,
                  styles.entriesCard,
                ]}
              >
                <Text
                  style={
                    styles.entriesLabel
                  }
                >
                  Entries
                </Text>

                <Text
                  style={
                    styles.entriesValue
                  }
                >
                  {totalEntries} Total
                </Text>

                <Text
                  style={
                    styles.lastAnalysisLabel
                  }
                >
                  Last Analysis
                </Text>

                <Text
                  style={
                    styles.lastAnalysisValue
                  }
                >
                  {formatDate(
                    lastAnalysisDate
                  )}
                </Text>
              </View>
            </View>

            <Text
              style={styles.sectionTitle}
            >
              Current Analysis
            </Text>

            <View
              style={
                styles.analysisTextCard
              }
            >
              <Text
                style={styles.quoteIcon}
              >
                “
              </Text>

              <Text
                style={
                  styles.analysisText
                }
              >
                {currentAnalysis}
              </Text>
            </View>

            <View
              style={styles.emotionCard}
            >
              <View
                style={
                  styles.emotionMainRow
                }
              >
                <View
                  style={
                    styles.emotionIconWrapper
                  }
                >
                  <Ionicons
                    name="bulb-outline"
                    size={23}
                    color="#65788A"
                  />
                </View>

                <View
                  style={
                    styles.emotionTextContainer
                  }
                >
                  <Text
                    style={
                      styles.emotionSmallLabel
                    }
                  >
                    DOMINANT EMOTION
                  </Text>

                  <Text
                    style={
                      styles.emotionValue
                    }
                  >
                    {dominantEmotion}
                  </Text>
                </View>

                <View
                  style={
                    styles.confidenceBadge
                  }
                >
                  <Text
                    style={
                      styles.confidenceValue
                    }
                  >
                    {confidence.toFixed(
                      0
                    )}
                    %
                  </Text>

                  <Text
                    style={
                      styles.confidenceLabel
                    }
                  >
                    Confidence
                  </Text>
                </View>
              </View>

              {tags.length > 0 ? (
                <View
                  style={
                    styles.tagsContainer
                  }
                >
                  {tags.map((tag) => (
                    <View
                      key={tag}
                      style={
                        styles.emotionTag
                      }
                    >
                      <Text
                        style={
                          styles.emotionTagText
                        }
                      >
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <LinearGradient
              colors={[
                "#DFF1FF",
                "#F7E9F0",
                "#FFDCDD",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={
                styles.aiSummaryCard
              }
            >
              <View
                style={styles.aiTitleRow}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={17}
                  color="#E7A82A"
                />

                <Text
                  style={styles.aiTitle}
                >
                  AI SUMMARY
                </Text>
              </View>

              <Text
                style={
                  styles.aiSummaryText
                }
              >
                {aiSummary}
              </Text>

              {caseData.priority ? (
                <View
                  style={
                    styles.priorityBadge
                  }
                >
                  <Text
                    style={
                      styles.priorityText
                    }
                  >
                    Priority:{" "}
                    {caseData.priority}
                  </Text>
                </View>
              ) : null}
            </LinearGradient>

            <TouchableOpacity
              activeOpacity={0.8}
              style={
                styles.overviewCard
              }
              onPress={
                handleViewOverview
              }
              disabled={!childId}
            >
              <View
                style={
                  styles.overviewIcon
                }
              >
                <Ionicons
                  name="bar-chart-outline"
                  size={22}
                  color="#4B5563"
                />
              </View>

              <View
                style={
                  styles.overviewTextContainer
                }
              >
                <Text
                  style={
                    styles.overviewTitle
                  }
                >
                  View Child Overview
                </Text>

                <Text
                  style={
                    styles.overviewSubtitle
                  }
                >
                  History, progress tracking & notes
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={21}
                color="#333333"
              />
            </TouchableOpacity>

            <View
              style={
                styles.recommendationHeader
              }
            >
              <Text
                style={styles.sectionTitle}
              >
                Doctor Recommendation
              </Text>

              <Text
                style={
                  styles.characterCounter
                }
              >
                {recommendation.length}
                /1000
              </Text>
            </View>

            <TextInput
              ref={
                recommendationInputRef
              }
              value={recommendation}
              onChangeText={
                setRecommendation
              }
              placeholder="Write your professional recommendation..."
              placeholderTextColor="#ADB1B8"
              multiline
              textAlignVertical="top"
              maxLength={1000}
              editable={
                !submitting &&
                !isClosed
              }
              style={[
                styles.recommendationInput,
                isClosed &&
                  styles.recommendationInputDisabled,
              ]}
            />

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                void submitRecommendation()
              }
              disabled={
                submitting ||
                isClosed
              }
              style={[
                styles.submitButtonWrapper,
                (submitting ||
                  isClosed) &&
                  styles.disabledButton,
              ]}
            >
              <LinearGradient
                colors={[
                  "#A8D4F7",
                  "#F7A8AC",
                ]}
                start={{
                  x: 0,
                  y: 0.5,
                }}
                end={{
                  x: 1,
                  y: 0.5,
                }}
                style={
                  styles.submitButton
                }
              >
                {submitting ? (
                  <ActivityIndicator
                    size="small"
                    color="#25282B"
                  />
                ) : (
                  <>
                    <Text
                      style={
                        styles.submitButtonText
                      }
                    >
                      {isReviewed
                        ? "Update Recommendation"
                        : "Submit Recommendation"}
                    </Text>

                    <Ionicons
                      name="send-outline"
                      size={17}
                      color="#25282B"
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.reviewedButton,
                isReviewed &&
                  styles.reviewedButtonActive,
              ]}
              onPress={
                handleMarkAsReviewed
              }
              disabled={
                submitting ||
                isClosed
              }
            >
              <Ionicons
                name={
                  isReviewed
                    ? "checkmark-circle"
                    : "checkmark-circle-outline"
                }
                size={18}
                color={
                  isReviewed
                    ? "#3C9A51"
                    : "#47B15C"
                }
              />

              <Text
                style={[
                  styles.reviewedButtonText,
                  isReviewed &&
                    styles.reviewedButtonTextActive,
                ]}
              >
                {isReviewed
                  ? "Reviewed"
                  : "Mark as Reviewed"}
              </Text>
            </TouchableOpacity>

            <Text
              style={
                styles.backendNote
              }
            >
              Close Case is not shown because the current backend does not provide a close-case endpoint.
            </Text>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>

      <Modal
        visible={
          actionModal !== null
        }
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={styles.modalCard}
          >
            <View
              style={
                styles.modalIcon
              }
            >
              <Ionicons
                name={
                  modalContent.icon
                }
                size={39}
                color={
                  modalContent.iconColor
                }
              />
            </View>

            <Text
              style={styles.modalTitle}
            >
              {modalContent.title}
            </Text>

            <Text
              style={
                styles.modalDescription
              }
            >
              {modalContent.message}
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={
                styles.modalButton
              }
              onPress={closeModal}
            >
              <Text
                style={
                  styles.modalButtonText
                }
              >
                {modalContent.buttonText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    flex: {
      flex: 1,
    },

    safeArea: {
      flex: 1,
      backgroundColor:
        "#FFFFFF",
    },

    background: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom: 28,
    },

    header: {
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    errorHeader: {
      height: 60,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    backButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "flex-start",
    },

    headerTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: "#1F2328",
    },

    headerPlaceholder: {
      width: 40,
    },

    headerRefresh: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "flex-end",
    },

    centerState: {
      flex: 1,
      backgroundColor: "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 28,
    },

    stateTitle: {
      marginTop: 14,
      fontSize: 17,
      fontWeight: "700",
      color: "#25282B",
      textAlign: "center",
    },

    stateMessage: {
      marginTop: 8,
      fontSize: 12,
      lineHeight: 18,
      color: "#7A8087",
      textAlign: "center",
    },

    retryButton: {
      marginTop: 20,
      borderRadius: 999,
      backgroundColor: "#6799C2",
      paddingHorizontal: 24,
      paddingVertical: 12,
    },

    retryButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
    },

    childCard: {
      position: "relative",
      minHeight: 76,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: 19,
      borderWidth: 1,
      borderColor: "#F0DFE2",
      paddingHorizontal: 12,
      overflow: "hidden",
      marginBottom: 14,
    },

    childDecorationLeft: {
      position: "absolute",
      left: -20,
      top: -15,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "#FFF0F1",
    },

    childDecorationRight: {
      position: "absolute",
      right: -14,
      bottom: -22,
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: "#FFF0F1",
    },

    childAvatarWrapper: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: "#FFF1EB",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "#F3DED6",
      marginRight: 10,
      zIndex: 2,
    },

    childAvatar: {
      width: "100%",
      height: "100%",
    },

    childInformation: {
      flex: 1,
      zIndex: 2,
    },

    childName: {
      fontSize: 16,
      fontWeight: "700",
      color: "#24272A",
    },

    childDetails: {
      marginTop: 3,
      fontSize: 9.5,
      color: "#6E737A",
    },

    statusBadge: {
      zIndex: 2,
      alignSelf: "flex-start",
      marginTop: 10,
      backgroundColor: "#FFF0DE",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },

    statusBadgeText: {
      fontSize: 8,
      fontWeight: "500",
      color: "#E49A43",
    },

    reviewedBadge: {
      backgroundColor: "#E9F9EC",
    },

    reviewedBadgeText: {
      color: "#42A45D",
    },

    closedBadge: {
      backgroundColor: "#ECEFF2",
    },

    closedBadgeText: {
      color: "#737A83",
    },

    summaryRow: {
      flexDirection: "row",
      gap: 9,
      marginBottom: 17,
    },

    summaryCard: {
      flex: 1,
      minHeight: 125,
      borderRadius: 10,
      padding: 13,
    },

    trendCard: {
      backgroundColor: "#EAF6EE",
    },

    entriesCard: {
      backgroundColor: "#FFE7E8",
    },

    summaryLabel: {
      marginTop: 12,
      fontSize: 14,
      fontWeight: "700",
      color: "#202522",
      textTransform: "capitalize",
    },

    summaryDescription: {
      marginTop: 15,
      fontSize: 10,
      lineHeight: 14,
      color: "#3D4740",
    },

    entriesLabel: {
      fontSize: 12,
      color: "#34373A",
    },

    entriesValue: {
      marginTop: 4,
      fontSize: 15,
      fontWeight: "700",
      color: "#1F2225",
    },

    lastAnalysisLabel: {
      marginTop: 20,
      fontSize: 11,
      color: "#5B5E62",
    },

    lastAnalysisValue: {
      marginTop: 5,
      fontSize: 13,
      fontWeight: "700",
      color: "#25282B",
    },

    sectionTitle: {
      marginBottom: 10,
      fontSize: 14,
      fontWeight: "500",
      color: "#30343A",
    },

    analysisTextCard: {
      position: "relative",
      minHeight: 95,
      justifyContent: "center",
      backgroundColor: "#F5F5F7",
      borderLeftWidth: 3,
      borderLeftColor: "#F5BAC0",
      paddingHorizontal: 15,
      paddingVertical: 14,
      marginBottom: 15,
    },

    quoteIcon: {
      position: "absolute",
      top: 2,
      left: 7,
      fontSize: 38,
      color: "#F4D1D4",
    },

    analysisText: {
      fontSize: 10.5,
      lineHeight: 17,
      fontStyle: "italic",
      color: "#4D5156",
    },

    emotionCard: {
      backgroundColor: "#FFFFFF",
      borderLeftWidth: 3,
      borderLeftColor: "#F4B8BD",
      borderRadius: 6,
      paddingHorizontal: 11,
      paddingVertical: 11,
      marginBottom: 15,
    },

    emotionMainRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    emotionIconWrapper: {
      width: 30,
      height: 30,
      borderRadius: 15,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },

    emotionTextContainer: {
      flex: 1,
    },

    emotionSmallLabel: {
      fontSize: 8.5,
      color: "#676D73",
    },

    emotionValue: {
      marginTop: 2,
      fontSize: 14,
      fontWeight: "700",
      color: "#25282B",
      textTransform: "capitalize",
    },

    confidenceBadge: {
      minWidth: 66,
      minHeight: 52,
      borderRadius: 26,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#EEF6FF",
      paddingHorizontal: 8,
    },

    confidenceValue: {
      fontSize: 14,
      fontWeight: "800",
      color: "#3976A4",
    },

    confidenceLabel: {
      marginTop: 1,
      fontSize: 7,
      color: "#718096",
    },

    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 9,
    },

    emotionTag: {
      backgroundColor: "#FFF0F1",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    emotionTagText: {
      fontSize: 8,
      color: "#F08C96",
    },

    aiSummaryCard: {
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginBottom: 15,
    },

    aiTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 8,
    },

    aiTitle: {
      fontSize: 10,
      fontWeight: "700",
      color: "#252A30",
    },

    aiSummaryText: {
      fontSize: 10,
      lineHeight: 15,
      color: "#343A40",
    },

    priorityBadge: {
      alignSelf: "flex-start",
      marginTop: 10,
      backgroundColor: "rgba(255,255,255,0.72)",
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },

    priorityText: {
      fontSize: 8.5,
      fontWeight: "700",
      color: "#7B5960",
    },

    overviewCard: {
      minHeight: 63,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F3F3F4",
      borderRadius: 8,
      paddingHorizontal: 11,
      marginBottom: 18,
    },

    overviewIcon: {
      width: 37,
      height: 37,
      borderRadius: 7,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      marginRight: 10,
    },

    overviewTextContainer: {
      flex: 1,
    },

    overviewTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: "#272B30",
    },

    overviewSubtitle: {
      marginTop: 3,
      fontSize: 8.5,
      color: "#888E95",
    },

    recommendationHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    characterCounter: {
      marginBottom: 10,
      fontSize: 8.5,
      color: "#A0A5AA",
    },

    recommendationInput: {
      minHeight: 132,
      backgroundColor: "#F4F4F6",
      borderRadius: 9,
      paddingHorizontal: 13,
      paddingTop: 13,
      paddingBottom: 13,
      fontSize: 11,
      lineHeight: 17,
      color: "#292D31",
      marginBottom: 17,
    },

    recommendationInputDisabled: {
      opacity: 0.55,
      backgroundColor: "#ECEEF0",
    },

    submitButtonWrapper: {
      width: "100%",
    },

    disabledButton: {
      opacity: 0.55,
    },

    submitButton: {
      height: 50,
      borderRadius: 999,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
    },

    submitButtonText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#25282B",
    },

    reviewedButton: {
      height: 46,
      marginTop: 10,
      borderRadius: 999,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#9DDBA8",
    },

    reviewedButtonActive: {
      backgroundColor: "#EAF8EC",
    },

    reviewedButtonText: {
      fontSize: 11,
      fontWeight: "500",
      color: "#47B15C",
    },

    reviewedButtonTextActive: {
      fontWeight: "700",
      color: "#3C9A51",
    },

    backendNote: {
      marginTop: 10,
      fontSize: 8.5,
      lineHeight: 13,
      color: "#92979D",
      textAlign: "center",
    },

    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor:
        "rgba(24, 30, 35, 0.56)",
      paddingHorizontal: 22,
    },

    modalCard: {
      width: "100%",
      maxWidth: 390,
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: 26,
      paddingHorizontal: 20,
      paddingTop: 25,
      paddingBottom: 20,
    },

    modalIcon: {
      width: 86,
      height: 86,
      borderRadius: 43,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#EEF6FF",
      marginBottom: 14,
    },

    modalTitle: {
      fontSize: 21,
      lineHeight: 28,
      fontWeight: "700",
      color: "#22262A",
      textAlign: "center",
    },

    modalDescription: {
      marginTop: 9,
      fontSize: 11,
      lineHeight: 17,
      color: "#858B92",
      textAlign: "center",
    },

    modalButton: {
      width: "100%",
      height: 50,
      marginTop: 21,
      borderRadius: 999,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#A8D4F7",
    },

    modalButtonText: {
      fontSize: 12.5,
      fontWeight: "700",
      color: "#171A1E",
    },
  });
