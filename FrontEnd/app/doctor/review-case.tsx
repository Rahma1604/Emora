import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
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

const girlPhoto = require("../../assets/images/images/girl.png");
const boyPhoto = require("../../assets/images/images/boy.png");
const confidenceImage = require("../../assets/images/images/75%.png");

type IoniconName = keyof typeof Ionicons.glyphMap;

type CaseStatus =
  | "pending"
  | "reviewed"
  | "closed";

type ActionModalType =
  | "recommendation_required"
  | "submit_success"
  | "submit_error"
  | "mark_reviewed_confirm"
  | "reviewed_success"
  | "already_reviewed"
  | "close_confirm"
  | "closed_success"
  | "already_closed";

type ModalContent = {
  icon: IoniconName;
  iconColor: string;
  iconGradient: [string, string];
  badgeText: string;
  badgeBackground: string;
  badgeTextColor: string;
  title: string;
  message: string;
  primaryText: string;
  secondaryText?: string;
};

type CaseData = {
  name: string;
  childId: string;
  age: number;
  avatar: number;
  trend: string;
  trendDescription: string;
  totalEntries: number;
  lastAnalysis: string;
  dominantEmotion: string;
  confidence: string;
  analysisText: string;
  aiSummary: string;
  tags: string[];
};

const casesData: Record<string, CaseData> = {
  Lily: {
    name: "Lily",
    childId: "#1045",
    age: 5,
    avatar: girlPhoto,
    trend: "Improving",
    trendDescription:
      "Showing gradual improvement, but still needs monitoring.",
    totalEntries: 8,
    lastAnalysis: "May 12, 2026",
    dominantEmotion: "Anxiety",
    confidence: "75%",
    analysisText:
      "The child has recently shown signs of anxiety before going to school and appears worried during social interactions.",
    aiSummary:
      "Recent entries indicate mild anxiety related to the school environment, with noticeable improvement compared to previous submissions.",
    tags: ["School", "Fear", "Sleep", "Stress"],
  },

  Sammy: {
    name: "Sammy",
    childId: "#11045",
    age: 5,
    avatar: boyPhoto,
    trend: "Improving",
    trendDescription:
      "Emotional responses are becoming more stable over time.",
    totalEntries: 6,
    lastAnalysis: "May 15, 2026",
    dominantEmotion: "Emotional Stress",
    confidence: "75%",
    analysisText:
      "The child has shown increased emotional sensitivity during recent daily routines and social situations.",
    aiSummary:
      "Recent entries show emotional sensitivity with gradual improvement in emotional regulation and social interaction.",
    tags: ["Routine", "Stress", "Social", "Mood"],
  },

  Adam: {
    name: "Adam",
    childId: "#1072",
    age: 6,
    avatar: boyPhoto,
    trend: "Needs Monitoring",
    trendDescription:
      "Emotional stress is still appearing during school attendance and group activities.",
    totalEntries: 5,
    lastAnalysis: "May 3, 2026",
    dominantEmotion: "Stress",
    confidence: "68%",
    analysisText:
      "The child has recently shown signs of emotional stress during school attendance and group activities.",
    aiSummary:
      "Recent entries suggest moderate school-related stress that requires continued observation and structured support.",
    tags: ["School", "Stress", "Groups", "Routine"],
  },
};

const getParamValue = (
  value?: string | string[]
): string | undefined => {
  return Array.isArray(value)
    ? value[0]
    : value;
};

export default function ReviewCaseScreen() {
  const params = useLocalSearchParams<{
    child?: string | string[];
    childId?: string | string[];
  }>();

  const childParam = getParamValue(
    params.child
  );

  const childIdParam = getParamValue(
    params.childId
  );

  const selectedCase =
    childParam && casesData[childParam]
      ? casesData[childParam]
      : casesData.Lily;

  const displayChildId =
    childIdParam || selectedCase.childId;

  const recommendationInputRef =
    useRef<TextInput>(null);

  const [
    recommendation,
    setRecommendation,
  ] = useState("");

  const [caseStatus, setCaseStatus] =
    useState<CaseStatus>("pending");

  const [submitting, setSubmitting] =
    useState(false);

  const [actionModal, setActionModal] =
    useState<ActionModalType | null>(null);

  const handleBack = () => {
    router.back();
  };

  const handleViewOverview = () => {
    router.push(
      `/doctor/child-overview?child=${encodeURIComponent(
        selectedCase.name
      )}&childId=${encodeURIComponent(
        displayChildId
      )}` as Href
    );
  };

  const handleSubmitResponse = async () => {
    if (submitting) return;

    if (!recommendation.trim()) {
      setActionModal(
        "recommendation_required"
      );

      return;
    }

    if (caseStatus === "closed") {
      setActionModal("already_closed");

      return;
    }

    try {
      setSubmitting(true);

      /*
        Front-End only:
        سيتم لاحقًا إرسال التوصية إلى الـBackend.
      */
      await new Promise((resolve) =>
        setTimeout(resolve, 600)
      );

      /*
        بعد إرسال التوصية بنجاح،
        الحالة تعتبر Reviewed.
      */
      setCaseStatus("reviewed");
      setRecommendation("");
      setActionModal("submit_success");
    } catch (error) {
      console.log(
        "Submit recommendation error:",
        error
      );

      setActionModal("submit_error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsReviewed = () => {
    if (caseStatus === "closed") {
      setActionModal("already_closed");

      return;
    }

    if (caseStatus === "reviewed") {
      setActionModal("already_reviewed");

      return;
    }

    setActionModal(
      "mark_reviewed_confirm"
    );
  };

  const handleCloseCase = () => {
    if (caseStatus === "closed") {
      setActionModal("already_closed");

      return;
    }

    setActionModal("close_confirm");
  };

  const confirmMarkAsReviewed = () => {
    setCaseStatus("reviewed");
    setActionModal("reviewed_success");
  };

  const confirmCloseCase = () => {
    setCaseStatus("closed");
    setActionModal("closed_success");
  };

  const closeModal = () => {
    setActionModal(null);
  };

  const handleModalPrimaryAction = () => {
    switch (actionModal) {
      case "recommendation_required":
        closeModal();

        setTimeout(() => {
          recommendationInputRef.current?.focus();
        }, 250);

        return;

      case "mark_reviewed_confirm":
        confirmMarkAsReviewed();
        return;

      case "close_confirm":
        confirmCloseCase();
        return;

      case "submit_success":
      case "submit_error":
      case "reviewed_success":
      case "already_reviewed":
      case "closed_success":
      case "already_closed":
      default:
        closeModal();
    }
  };

  const getModalContent = (): ModalContent => {
    switch (actionModal) {
      case "recommendation_required":
        return {
          icon: "create-outline",
          iconColor: "#6799C2",
          iconGradient: [
            "#DCEFFF",
            "#FFE4E6",
          ],
          badgeText: "Recommendation needed",
          badgeBackground: "#FFF3E6",
          badgeTextColor: "#C87C35",
          title: "Add your recommendation",
          message:
            "Write a professional recommendation before submitting this case.",
          primaryText: "Back to Writing",
        };

      case "submit_success":
        return {
          icon: "paper-plane-outline",
          iconColor: "#4CAC62",
          iconGradient: [
            "#E2F8E8",
            "#EAF5FF",
          ],
          badgeText: "Successfully submitted",
          badgeBackground: "#E7F8EB",
          badgeTextColor: "#409B54",
          title: "Recommendation sent",
          message: `Your recommendation for ${selectedCase.name} has been submitted successfully. The case is now marked as reviewed.`,
          primaryText: "Done",
        };

      case "submit_error":
        return {
          icon: "alert-circle-outline",
          iconColor: "#D95C64",
          iconGradient: [
            "#FFE6E8",
            "#FFF3F3",
          ],
          badgeText: "Submission failed",
          badgeBackground: "#FFF0F1",
          badgeTextColor: "#CA555D",
          title: "We couldn't send it",
          message:
            "Something went wrong while submitting the recommendation. Please try again.",
          primaryText: "Try Again",
        };

      case "mark_reviewed_confirm":
        return {
          icon: "checkmark-done-outline",
          iconColor: "#4AAA60",
          iconGradient: [
            "#E2F8E8",
            "#EAF5FF",
          ],
          badgeText: "Review status",
          badgeBackground: "#E8F8EC",
          badgeTextColor: "#459B57",
          title: "Mark this case as reviewed?",
          message: `This will move ${selectedCase.name}'s case from Pending Review to Reviewed.`,
          primaryText: "Mark as Reviewed",
          secondaryText: "Cancel",
        };

      case "reviewed_success":
        return {
          icon: "checkmark-circle-outline",
          iconColor: "#46AE5B",
          iconGradient: [
            "#DCF7E3",
            "#EAF5FF",
          ],
          badgeText: "Status updated",
          badgeBackground: "#E7F8EB",
          badgeTextColor: "#409B54",
          title: "Case marked as reviewed",
          message: `${selectedCase.name}'s case has been moved to the reviewed cases list.`,
          primaryText: "Done",
        };

      case "already_reviewed":
        return {
          icon: "shield-checkmark-outline",
          iconColor: "#5E96C2",
          iconGradient: [
            "#E3F2FF",
            "#F1F8FF",
          ],
          badgeText: "Already reviewed",
          badgeBackground: "#EAF5FF",
          badgeTextColor: "#5A88AC",
          title: "No update needed",
          message: `${selectedCase.name}'s case is already marked as reviewed.`,
          primaryText: "Got It",
        };

      case "close_confirm":
        return {
          icon: "lock-closed-outline",
          iconColor: "#D85A62",
          iconGradient: [
            "#FFE3E5",
            "#FFF1F2",
          ],
          badgeText: "Close case",
          badgeBackground: "#FFF0F1",
          badgeTextColor: "#C9535A",
          title: "Close this case?",
          message: `Closing ${selectedCase.name}'s case will move it to the closed cases list. Its analyses and recommendations will remain available in History.`,
          primaryText: "Close Case",
          secondaryText: "Keep Open",
        };

      case "closed_success":
        return {
          icon: "lock-closed-outline",
          iconColor: "#737C84",
          iconGradient: [
            "#EDF0F2",
            "#F7F8F9",
          ],
          badgeText: "Case closed",
          badgeBackground: "#ECEFF1",
          badgeTextColor: "#747C83",
          title: "The case has been closed",
          message: `${selectedCase.name}'s case is now available in the closed cases section of History.`,
          primaryText: "Done",
        };

      case "already_closed":
        return {
          icon: "lock-closed-outline",
          iconColor: "#778089",
          iconGradient: [
            "#ECEFF2",
            "#F6F7F8",
          ],
          badgeText: "Closed case",
          badgeBackground: "#ECEFF1",
          badgeTextColor: "#747C83",
          title: "This case is already closed",
          message:
            "No additional actions can be submitted while the case is closed.",
          primaryText: "Got It",
        };

      default:
        return {
          icon: "information-circle-outline",
          iconColor: "#6799C2",
          iconGradient: [
            "#DCEFFF",
            "#FFE4E6",
          ],
          badgeText: "Case information",
          badgeBackground: "#EAF5FF",
          badgeTextColor: "#5A88AC",
          title: "Case update",
          message:
            "The case information has been updated.",
          primaryText: "Done",
        };
    }
  };

  const getStatusText = () => {
    if (caseStatus === "reviewed") {
      return "Reviewed";
    }

    if (caseStatus === "closed") {
      return "Closed";
    }

    return "Pending Review";
  };

  const modalContent = getModalContent();

  const isCloseConfirmation =
    actionModal === "close_confirm";

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
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Header */}
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

              <Text style={styles.headerTitle}>
                Review Case
              </Text>

              <View
                style={
                  styles.headerPlaceholder
                }
              />
            </View>

            {/* Child Information */}
            <View style={styles.childCard}>
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
                  source={selectedCase.avatar}
                  style={styles.childAvatar}
                  contentFit="cover"
                  transition={150}
                />
              </View>

              <View
                style={
                  styles.childInformation
                }
              >
                <Text style={styles.childName}>
                  {selectedCase.name}
                </Text>

                <Text
                  style={styles.childDetails}
                >
                  Child ID {displayChildId} ·{" "}
                  {selectedCase.age} years old
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  caseStatus === "reviewed" &&
                    styles.reviewedBadge,
                  caseStatus === "closed" &&
                    styles.closedBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    caseStatus ===
                      "reviewed" &&
                      styles.reviewedBadgeText,
                    caseStatus === "closed" &&
                      styles.closedBadgeText,
                  ]}
                >
                  {getStatusText()}
                </Text>
              </View>
            </View>

            {/* Quick Summary */}
            <View style={styles.summaryRow}>
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
                  style={styles.summaryLabel}
                >
                  {selectedCase.trend}
                </Text>

                <Text
                  style={
                    styles.summaryDescription
                  }
                >
                  {
                    selectedCase.trendDescription
                  }
                </Text>
              </View>

              <View
                style={[
                  styles.summaryCard,
                  styles.entriesCard,
                ]}
              >
                <Text
                  style={styles.entriesLabel}
                >
                  Entries
                </Text>

                <Text
                  style={styles.entriesValue}
                >
                  {selectedCase.totalEntries} Total
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
                  {selectedCase.lastAnalysis}
                </Text>
              </View>
            </View>

            {/* Current Analysis */}
            <Text style={styles.sectionTitle}>
              Current Analysis
            </Text>

            <View
              style={
                styles.analysisTextCard
              }
            >
              <Text style={styles.quoteIcon}>
                “
              </Text>

              <Text
                style={styles.analysisText}
              >
                {selectedCase.analysisText}
              </Text>
            </View>

            {/* Dominant Emotion */}
            <View style={styles.emotionCard}>
              <View
                style={styles.emotionMainRow}
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
                    style={styles.emotionValue}
                  >
                    {
                      selectedCase.dominantEmotion
                    }
                  </Text>
                </View>

                <Image
                  source={confidenceImage}
                  style={styles.confidenceImage}
                  contentFit="contain"
                />
              </View>

              <View
                style={styles.tagsContainer}
              >
                {selectedCase.tags.map(
                  (tag) => (
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
                  )
                )}
              </View>
            </View>

            {/* AI Summary */}
            <LinearGradient
              colors={[
                "#DFF1FF",
                "#F7E9F0",
                "#FFDCDD",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiSummaryCard}
            >
              <View style={styles.aiTitleRow}>
                <Ionicons
                  name="sparkles-outline"
                  size={17}
                  color="#E7A82A"
                />

                <Text style={styles.aiTitle}>
                  AI SUMMARY
                </Text>
              </View>

              <Text
                style={styles.aiSummaryText}
              >
                {selectedCase.aiSummary}
              </Text>
            </LinearGradient>

            {/* View Child Overview */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.overviewCard}
              onPress={handleViewOverview}
            >
              <View style={styles.overviewIcon}>
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
                  style={styles.overviewTitle}
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

            {/* Doctor Recommendation */}
            <View
              style={
                styles.recommendationHeader
              }
            >
              <Text style={styles.sectionTitle}>
                Doctor Recommendation
              </Text>

              <Text
                style={
                  styles.characterCounter
                }
              >
                {recommendation.length}/1000
              </Text>
            </View>

            <TextInput
              ref={recommendationInputRef}
              value={recommendation}
              onChangeText={setRecommendation}
              placeholder="Write your professional recommendation..."
              placeholderTextColor="#ADB1B8"
              multiline
              textAlignVertical="top"
              maxLength={1000}
              editable={
                !submitting &&
                caseStatus !== "closed"
              }
              style={[
                styles.recommendationInput,
                caseStatus === "closed" &&
                  styles.recommendationInputDisabled,
              ]}
            />

            {/* Submit Response */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSubmitResponse}
              disabled={submitting}
              style={[
                styles.submitButtonWrapper,
                submitting &&
                  styles.disabledButton,
              ]}
            >
              <LinearGradient
                colors={[
                  "#A8D4F7",
                  "#F7A8AC",
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.submitButton}
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
                      Submit Recommendation
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

            {/* Secondary Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.secondaryButton,
                  styles.reviewedButton,
                  caseStatus ===
                    "reviewed" &&
                    styles.reviewedButtonActive,
                  caseStatus === "closed" &&
                    styles.disabledSecondaryButton,
                ]}
                onPress={
                  handleMarkAsReviewed
                }
              >
                <Ionicons
                  name={
                    caseStatus === "reviewed"
                      ? "checkmark-circle"
                      : "checkmark-circle-outline"
                  }
                  size={17}
                  color={
                    caseStatus === "closed"
                      ? "#8E959C"
                      : "#47B15C"
                  }
                />

                <Text
                  style={[
                    styles.reviewedButtonText,
                    caseStatus ===
                      "reviewed" &&
                      styles.reviewedButtonTextActive,
                    caseStatus ===
                      "closed" &&
                      styles.disabledSecondaryText,
                  ]}
                >
                  {caseStatus === "reviewed"
                    ? "Reviewed"
                    : "Mark as Reviewed"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.secondaryButton,
                  styles.closeButton,
                  caseStatus === "closed" &&
                    styles.closedButtonActive,
                ]}
                onPress={handleCloseCase}
              >
                <Ionicons
                  name={
                    caseStatus === "closed"
                      ? "lock-closed"
                      : "close-circle-outline"
                  }
                  size={17}
                  color={
                    caseStatus === "closed"
                      ? "#747B83"
                      : "#F13940"
                  }
                />

                <Text
                  style={[
                    styles.closeButtonText,
                    caseStatus === "closed" &&
                      styles.closedButtonTextActive,
                  ]}
                >
                  {caseStatus === "closed"
                    ? "Closed"
                    : "Close Case"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>

      {/* Custom Action Modal */}
      <Modal
        visible={actionModal !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient
              colors={
                modalContent.iconGradient
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalIcon}
            >
              <Ionicons
                name={modalContent.icon}
                size={39}
                color={modalContent.iconColor}
              />

              {actionModal ===
                "submit_success" ||
              actionModal ===
                "reviewed_success" ||
              actionModal ===
                "closed_success" ? (
                <View
                  style={
                    styles.modalSuccessBadge
                  }
                >
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color="#FFFFFF"
                  />
                </View>
              ) : null}
            </LinearGradient>

            <View
              style={[
                styles.modalStatusBadge,
                {
                  backgroundColor:
                    modalContent.badgeBackground,
                },
              ]}
            >
              <View
                style={[
                  styles.modalStatusDot,
                  {
                    backgroundColor:
                      modalContent.badgeTextColor,
                  },
                ]}
              />

              <Text
                style={[
                  styles.modalStatusText,
                  {
                    color:
                      modalContent.badgeTextColor,
                  },
                ]}
              >
                {modalContent.badgeText}
              </Text>
            </View>

            <Text style={styles.modalTitle}>
              {modalContent.title}
            </Text>

            <Text
              style={styles.modalDescription}
            >
              {modalContent.message}
            </Text>

            {actionModal ===
            "recommendation_required" ? (
              <View
                style={styles.modalInfoCard}
              >
                <View
                  style={styles.modalInfoIcon}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color="#6799C2"
                  />
                </View>

                <Text
                  style={styles.modalInfoText}
                >
                  Add clear guidance, suggested steps
                  and any follow-up period the parent
                  should observe.
                </Text>
              </View>
            ) : null}

            {actionModal ===
            "close_confirm" ? (
              <View
                style={styles.modalWarningCard}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#D15A62"
                />

                <Text
                  style={styles.modalWarningText}
                >
                  Closing the case does not delete its
                  medical history or previous
                  recommendations.
                </Text>
              </View>
            ) : null}

            <View
              style={[
                styles.modalActions,
                !modalContent.secondaryText &&
                  styles.modalSingleAction,
              ]}
            >
              {modalContent.secondaryText ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={closeModal}
                  style={
                    styles.modalSecondaryButton
                  }
                >
                  <Text
                    style={
                      styles.modalSecondaryButtonText
                    }
                  >
                    {
                      modalContent.secondaryText
                    }
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={
                  handleModalPrimaryAction
                }
                style={[
                  styles.modalPrimaryWrapper,
                  !modalContent.secondaryText &&
                    styles.modalPrimaryFullWidth,
                ]}
              >
                {isCloseConfirmation ? (
                  <View
                    style={
                      styles.modalDestructiveButton
                    }
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={17}
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.modalDestructiveText
                      }
                    >
                      {modalContent.primaryText}
                    </Text>
                  </View>
                ) : (
                  <LinearGradient
                    colors={[
                      "#8DC0F0",
                      "#F9A8A7",
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
                      styles.modalPrimaryButton
                    }
                  >
                    <Text
                      style={
                        styles.modalPrimaryButtonText
                      }
                    >
                      {modalContent.primaryText}
                    </Text>

                    <Ionicons
                      name={
                        actionModal ===
                        "recommendation_required"
                          ? "create-outline"
                          : "arrow-forward"
                      }
                      size={17}
                      color="#171A1E"
                    />
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    justifyContent: "space-between",
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
    shadowColor: "#B7C0C8",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 1,
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
  },

  confidenceImage: {
    width: 50,
    height: 50,
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
    borderRadius: 6,
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
    opacity: 0.7,
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

  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },

  secondaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
  },

  reviewedButton: {
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
  },

  disabledSecondaryButton: {
    opacity: 0.45,
  },

  disabledSecondaryText: {
    color: "#8E959C",
  },

  closeButton: {
    borderWidth: 1,
    borderColor: "#FF5B61",
  },

  closeButtonText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#F13940",
  },

  closedButtonActive: {
    backgroundColor: "#F1F2F3",
    borderColor: "#B7BCC2",
  },

  closedButtonTextActive: {
    color: "#747B83",
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(24, 30, 35, 0.56)",
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
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 14,
  },

  modalIcon: {
    position: "relative",
    width: 91,
    height: 91,
    borderRadius: 46,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  modalSuccessBadge: {
    position: "absolute",
    right: 1,
    bottom: 3,
    width: 29,
    height: 29,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4DBA63",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  modalStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginBottom: 12,
  },

  modalStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  modalStatusText: {
    fontSize: 9,
    fontWeight: "700",
  },

  modalTitle: {
    maxWidth: 310,
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    color: "#22262A",
    textAlign: "center",
  },

  modalDescription: {
    maxWidth: 320,
    marginTop: 9,
    fontSize: 11,
    lineHeight: 17,
    color: "#858B92",
    textAlign: "center",
  },

  modalInfoCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EEF6FF",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 19,
  },

  modalInfoIcon: {
    width: 37,
    height: 37,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 9,
  },

  modalInfoText: {
    flex: 1,
    fontSize: 9.2,
    lineHeight: 14,
    color: "#668098",
  },

  modalWarningCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFF0F1",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 19,
  },

  modalWarningText: {
    flex: 1,
    fontSize: 9.2,
    lineHeight: 14,
    color: "#956166",
  },

  modalActions: {
    width: "100%",
    flexDirection: "row",
    gap: 9,
    marginTop: 21,
  },

  modalSingleAction: {
    justifyContent: "center",
  },

  modalSecondaryButton: {
    flex: 1,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE3E7",
    borderRadius: 999,
  },

  modalSecondaryButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6A7279",
  },

  modalPrimaryWrapper: {
    flex: 1,
  },

  modalPrimaryFullWidth: {
    flex: 0,
    width: "100%",
  },

  modalPrimaryButton: {
    height: 52,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },

  modalPrimaryButtonText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#171A1E",
  },

  modalDestructiveButton: {
    height: 52,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#EB656C",
  },

  modalDestructiveText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});