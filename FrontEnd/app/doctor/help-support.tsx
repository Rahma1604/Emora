import React, { useMemo, useState } from "react";
import {
  Linking,
  Modal,
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
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

type IoniconName = keyof typeof Ionicons.glyphMap;

type FeedbackType =
  | "request_sent"
  | "request_error"
  | "email_error"
  | null;

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

type FeedbackContent = {
  icon: IoniconName;
  iconColor: string;
  gradientColors: readonly [string, string];
  badge: string;
  badgeBackground: string;
  badgeColor: string;
  title: string;
  description: string;
  buttonText: string;
};

type StoredSupportTicket = {
  id: string;
  message: string;
  createdAt: string;
  status: "pending";
};

const SUPPORT_EMAIL = "support@emora.app";

const faqs: FaqItem[] = [
  {
    id: "verification-time",
    question: "How long does doctor verification take?",
    answer:
      "Professional verification usually takes one to two business days after all required information and documents have been submitted.",
  },
  {
    id: "case-access",
    question: "Why can’t I access child cases?",
    answer:
      "Child cases are only available after your professional account is approved and your verified doctor session is active.",
  },
  {
    id: "edit-recommendation",
    question: "Can I edit a submitted recommendation?",
    answer:
      "A submitted recommendation may become part of the child’s medical history. Instead of replacing it, you should add a new follow-up recommendation when an update is needed.",
  },
  {
    id: "notifications",
    question: "How can I stop optional notifications?",
    answer:
      "Open Notification Settings from your profile and disable the notification types you no longer want to receive.",
  },
  {
    id: "password",
    question: "What should I do if I forget my password?",
    answer:
      "Use the Forgot Password option on the login screen. A password reset flow will be available when the authentication backend is connected.",
  },
  {
    id: "account-information",
    question: "Why can’t I edit my license information?",
    answer:
      "Sensitive professional information such as your National ID, medical license and syndicate number requires a new verification review before it can be changed.",
  },
];

export default function HelpSupportScreen() {
  const [expandedFaqId, setExpandedFaqId] = useState<
    string | null
  >(null);

  const [issueMessage, setIssueMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [feedback, setFeedback] =
    useState<FeedbackType>(null);

  const cleanIssueMessage = issueMessage.trim();

  const canSubmit =
    cleanIssueMessage.length >= 10 && !submitting;

  const handleBack = () => {
    if (submitting) return;

    router.back();
  };

  const toggleFaq = (faqId: string) => {
    setExpandedFaqId((currentId) =>
      currentId === faqId ? null : faqId
    );
  };

  const handleEmailSupport = async () => {
    try {
      const subject = encodeURIComponent(
        "Emora Doctor Support Request"
      );

      const body = encodeURIComponent(
        "Hello Emora Support,\n\nI need help with my doctor account.\n\nIssue:\n"
      );

      const emailUrl =
        `mailto:${SUPPORT_EMAIL}` +
        `?subject=${subject}&body=${body}`;

      const canOpen = await Linking.canOpenURL(emailUrl);

      if (!canOpen) {
        setFeedback("email_error");
        return;
      }

      await Linking.openURL(emailUrl);
    } catch (error) {
      console.log("Open support email error:", error);

      setFeedback("email_error");
    }
  };

  const handleSubmitIssue = async () => {
    if (!canSubmit) return;

    try {
      setSubmitting(true);

      const newTicket: StoredSupportTicket = {
        id: `local-ticket-${Date.now()}`,
        message: cleanIssueMessage,
        createdAt: new Date().toISOString(),
        status: "pending",
      };

      const storedTickets =
        await AsyncStorage.getItem(
          "doctorSupportTickets"
        );

      let previousTickets: StoredSupportTicket[] = [];

      if (storedTickets) {
        try {
          previousTickets = JSON.parse(
            storedTickets
          ) as StoredSupportTicket[];
        } catch {
          previousTickets = [];
        }
      }

      await AsyncStorage.setItem(
        "doctorSupportTickets",
        JSON.stringify([
          newTicket,
          ...previousTickets,
        ])
      );

      setIssueMessage("");
      setFeedback("request_sent");
    } catch (error) {
      console.log(
        "Submit support request error:",
        error
      );

      setFeedback("request_error");
    } finally {
      setSubmitting(false);
    }
  };

  const feedbackContent =
    useMemo<FeedbackContent>(() => {
      switch (feedback) {
        case "request_sent":
          return {
            icon: "checkmark-circle-outline",
            iconColor: "#49AD5D",
            gradientColors: [
              "#DDF7E4",
              "#EAF5FF",
            ],
            badge: "Request submitted",
            badgeBackground: "#E7F8EB",
            badgeColor: "#439D56",
            title: "We received your request",
            description:
              "Your support request has been saved successfully. The support team will review it when the backend support system is connected.",
            buttonText: "Done",
          };

        case "email_error":
          return {
            icon: "mail-unread-outline",
            iconColor: "#D38A40",
            gradientColors: [
              "#FFF1DE",
              "#FFE7E8",
            ],
            badge: "Email unavailable",
            badgeBackground: "#FFF3E5",
            badgeColor: "#C47B37",
            title: "Could not open your email app",
            description:
              `You can contact the support team manually at ${SUPPORT_EMAIL}.`,
            buttonText: "Got It",
          };

        case "request_error":
        default:
          return {
            icon: "alert-circle-outline",
            iconColor: "#D75A62",
            gradientColors: [
              "#FFE4E6",
              "#FFF1F2",
            ],
            badge: "Request failed",
            badgeBackground: "#FFF0F1",
            badgeColor: "#C8545C",
            title: "Request was not submitted",
            description:
              "Something went wrong while saving your support request. Please try again.",
            buttonText: "Try Again",
          };
      }
    }, [feedback]);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <LinearGradient
        colors={[
          "#FFFFFF",
          "#FFF8F8",
          "#F7FBFF",
        ]}
        locations={[0, 0.5, 1]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 1,
        }}
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
              activeOpacity={0.7}
              onPress={handleBack}
              disabled={submitting}
              style={styles.backButton}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#1F2937"
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              Help & Support
            </Text>

            <View
              style={styles.headerPlaceholder}
            />
          </View>

          {/* Introduction */}
          <View style={styles.introduction}>
            <LinearGradient
              colors={[
                "#DDEFFF",
                "#FFE3E5",
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              style={styles.introductionIcon}
            >
              <Ionicons
                name="help-circle-outline"
                size={29}
                color="#6D9EC8"
              />
            </LinearGradient>

            <View
              style={
                styles.introductionContent
              }
            >
              <Text style={styles.pageTitle}>
                How can we help?
              </Text>

              <Text
                style={styles.pageSubtitle}
              >
                Find quick answers or send a
                support request about your
                doctor account.
              </Text>
            </View>
          </View>

          {/* Contact Options */}
          <View style={styles.contactGrid}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleEmailSupport}
              style={styles.contactCard}
            >
              <View style={styles.contactIcon}>
                <Ionicons
                  name="mail-outline"
                  size={23}
                  color="#6798BF"
                />
              </View>

              <Text
                style={styles.contactTitle}
              >
                Email Support
              </Text>

              <Text
                style={
                  styles.contactDescription
                }
              >
                {SUPPORT_EMAIL}
              </Text>
            </TouchableOpacity>

            <View style={styles.contactCard}>
              <View
                style={[
                  styles.contactIcon,
                  styles.pinkContactIcon,
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={23}
                  color="#D98289"
                />
              </View>

              <Text
                style={styles.contactTitle}
              >
                Response Time
              </Text>

              <Text
                style={
                  styles.contactDescription
                }
              >
                Within 1–2 business days
              </Text>
            </View>
          </View>

          {/* Frequently Asked Questions */}
          <Text style={styles.sectionTitle}>
            Frequently Asked Questions
          </Text>

          <View style={styles.faqContainer}>
            {faqs.map((faq) => {
              const isExpanded =
                expandedFaqId === faq.id;

              return (
                <TouchableOpacity
                  key={faq.id}
                  activeOpacity={0.85}
                  onPress={() =>
                    toggleFaq(faq.id)
                  }
                  style={[
                    styles.faqCard,
                    isExpanded &&
                      styles.faqCardExpanded,
                  ]}
                >
                  <View
                    style={styles.faqHeader}
                  >
                    <View
                      style={styles.faqIcon}
                    >
                      <Ionicons
                        name="help-outline"
                        size={18}
                        color="#6B98BA"
                      />
                    </View>

                    <Text
                      style={styles.faqQuestion}
                    >
                      {faq.question}
                    </Text>

                    <Ionicons
                      name={
                        isExpanded
                          ? "chevron-up"
                          : "chevron-down"
                      }
                      size={19}
                      color="#7F878E"
                    />
                  </View>

                  {isExpanded ? (
                    <Text
                      style={styles.faqAnswer}
                    >
                      {faq.answer}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Report a Problem */}
          <Text style={styles.sectionTitle}>
            Report a Problem
          </Text>

          <View style={styles.reportCard}>
            <View
              style={styles.reportHeader}
            >
              <View
                style={styles.reportIcon}
              >
                <Ionicons
                  name="bug-outline"
                  size={20}
                  color="#D98289"
                />
              </View>

              <View
                style={
                  styles.reportHeaderContent
                }
              >
                <Text
                  style={styles.reportTitle}
                >
                  Tell us what happened
                </Text>

                <Text
                  style={
                    styles.reportDescription
                  }
                >
                  Include the page, action and
                  error message if available.
                </Text>
              </View>
            </View>

            <View
              style={
                styles.messageContainer
              }
            >
              <TextInput
                value={issueMessage}
                onChangeText={
                  setIssueMessage
                }
                placeholder="Describe the issue, where it happened and what you expected..."
                placeholderTextColor="#A6ABB1"
                multiline
                textAlignVertical="top"
                maxLength={1000}
                editable={!submitting}
                style={styles.messageInput}
              />

              <Text
                style={
                  styles.characterCounter
                }
              >
                {issueMessage.length}/1000
              </Text>
            </View>

            {issueMessage.length > 0 &&
            cleanIssueMessage.length < 10 ? (
              <Text style={styles.errorText}>
                Please provide at least 10
                characters.
              </Text>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSubmitIssue}
              disabled={!canSubmit}
              style={[
                styles.submitButtonWrapper,
                !canSubmit &&
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
                style={styles.submitButton}
              >
                {submitting ? (
                  <Ionicons
                    name="hourglass-outline"
                    size={19}
                    color="#25282B"
                  />
                ) : (
                  <Ionicons
                    name="send-outline"
                    size={18}
                    color="#25282B"
                  />
                )}

                <Text
                  style={
                    styles.submitButtonText
                  }
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Support Request"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Privacy Notice */}
          <View style={styles.privacyNotice}>
            <View
              style={styles.privacyIcon}
            >
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color="#648FB4"
              />
            </View>

            <View
              style={styles.privacyContent}
            >
              <Text
                style={styles.privacyTitle}
              >
                Do not include sensitive child
                information
              </Text>

              <Text
                style={styles.privacyText}
              >
                Avoid entering a child’s full
                name, National ID, medical
                documents or private case
                details in a general support
                request.
              </Text>
            </View>
          </View>

          {/* App Information */}
          <View style={styles.versionCard}>
            <View
              style={styles.versionIcon}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#648FB4"
              />
            </View>

            <View
              style={styles.versionContent}
            >
              <Text
                style={styles.versionTitle}
              >
                Emora Doctor App
              </Text>

              <Text
                style={styles.versionText}
              >
                Version 1.0.0 · Preview build
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Feedback Modal */}
      <Modal
        visible={feedback !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setFeedback(null)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient
              colors={
                feedbackContent.gradientColors
              }
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              style={styles.modalIcon}
            >
              <Ionicons
                name={feedbackContent.icon}
                size={40}
                color={
                  feedbackContent.iconColor
                }
              />

              {feedback ===
              "request_sent" ? (
                <View
                  style={styles.successBadge}
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
                    feedbackContent.badgeBackground,
                },
              ]}
            >
              <View
                style={[
                  styles.modalStatusDot,
                  {
                    backgroundColor:
                      feedbackContent.badgeColor,
                  },
                ]}
              />

              <Text
                style={[
                  styles.modalStatusText,
                  {
                    color:
                      feedbackContent.badgeColor,
                  },
                ]}
              >
                {feedbackContent.badge}
              </Text>
            </View>

            <Text style={styles.modalTitle}>
              {feedbackContent.title}
            </Text>

            <Text
              style={styles.modalDescription}
            >
              {feedbackContent.description}
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                setFeedback(null)
              }
              style={
                styles.modalButtonWrapper
              }
            >
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
                style={styles.modalButton}
              >
                <Text
                  style={
                    styles.modalButtonText
                  }
                >
                  {feedbackContent.buttonText}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  background: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 30,
  },

  header: {
    height: 55,
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
    color: "#22262A",
  },

  headerPlaceholder: {
    width: 40,
  },

  introduction: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 18,
  },

  introductionIcon: {
    width: 56,
    height: 56,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  introductionContent: {
    flex: 1,
  },

  pageTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#24282C",
  },

  pageSubtitle: {
    marginTop: 5,
    fontSize: 9.5,
    lineHeight: 15,
    color: "#878D93",
  },

  contactGrid: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 20,
  },

  contactCard: {
    flex: 1,
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7ECEF",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 13,
  },

  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EAF5FF",
    marginBottom: 9,
  },

  pinkContactIcon: {
    backgroundColor: "#FFF0F1",
  },

  contactTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#34393D",
    textAlign: "center",
  },

  contactDescription: {
    marginTop: 5,
    fontSize: 8.5,
    lineHeight: 13,
    color: "#8A9197",
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#34393D",
    marginBottom: 10,
  },

  faqContainer: {
    gap: 9,
    marginBottom: 20,
  },

  faqCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7ECEF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  faqCardExpanded: {
    borderColor: "#C9DEEE",
    backgroundColor: "#FBFDFF",
  },

  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  faqIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFF7FD",
    marginRight: 9,
  },

  faqQuestion: {
    flex: 1,
    paddingRight: 9,
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "600",
    color: "#363B40",
  },

  faqAnswer: {
    marginTop: 11,
    paddingLeft: 43,
    paddingRight: 5,
    fontSize: 9,
    lineHeight: 15,
    color: "#737B82",
  },

  reportCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7ECEF",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingTop: 13,
    paddingBottom: 12,
    marginBottom: 14,
  },

  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  reportIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF0F1",
    marginRight: 9,
  },

  reportHeaderContent: {
    flex: 1,
  },

  reportTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#3A3F43",
  },

  reportDescription: {
    marginTop: 3,
    fontSize: 8.5,
    lineHeight: 13,
    color: "#92989E",
  },

  messageContainer: {
    minHeight: 155,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E2E7EA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 27,
  },

  messageInput: {
    minHeight: 110,
    fontSize: 11,
    lineHeight: 17,
    color: "#292E32",
  },

  characterCounter: {
    position: "absolute",
    right: 11,
    bottom: 8,
    fontSize: 8,
    color: "#969CA2",
  },

  errorText: {
    marginTop: 6,
    marginLeft: 3,
    fontSize: 8.5,
    color: "#D85A62",
  },

  submitButtonWrapper: {
    marginTop: 12,
  },

  disabledButton: {
    opacity: 0.55,
  },

  submitButton: {
    height: 49,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  submitButtonText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#25282B",
  },

  privacyNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF5E9",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 13,
  },

  privacyIcon: {
    width: 37,
    height: 37,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 9,
  },

  privacyContent: {
    flex: 1,
  },

  privacyTitle: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#846348",
  },

  privacyText: {
    marginTop: 5,
    fontSize: 8.8,
    lineHeight: 14,
    color: "#98785D",
  },

  versionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF5FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },

  versionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 9,
  },

  versionContent: {
    flex: 1,
  },

  versionTitle: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#59768C",
  },

  versionText: {
    marginTop: 4,
    fontSize: 8.5,
    color: "#6A8397",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      "rgba(24,30,35,0.56)",
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

  successBadge: {
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

  modalButtonWrapper: {
    width: "100%",
    marginTop: 21,
  },

  modalButton: {
    height: 52,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  modalButtonText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#171A1E",
  },
});