import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

type VerificationStatus =
  | "not_started"
  | "draft"
  | "under_review"
  | "changes_required"
  | "verified"
  | "rejected"
  | "expired"
  | "suspended";

const STORAGE_KEYS = {
  status: "verificationStatus",
  submittedAt: "verificationSubmittedAt",
  fullName: "verificationFullName",
  email: "verificationEmail",
  currentStep: "verificationCurrentStep",
};

export default function VerificationPendingScreen() {
  const [doctorName, setDoctorName] = useState("Doctor");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [submittedDate, setSubmittedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    loadApplicationStatus();
  }, []);

  const formatDate = (dateValue: string) => {
    const parsedDate = new Date(dateValue);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const redirectByStatus = async (
    status: VerificationStatus,
    currentStep?: string | null
  ) => {
    switch (status) {
      case "verified":
        router.replace(
          "/doctor/doctor-verification/approved" as Href
        );
        return;

      case "rejected":
        router.replace(
          "/doctor/doctor-verification/rejected" as Href
        );
        return;

      case "not_started":
        router.replace(
          "/doctor/doctor-verification/intro" as Href
        );
        return;

      case "draft":
        if (currentStep === "documents") {
          router.replace(
            "/doctor/doctor-verification/documents" as Href
          );
          return;
        }

        if (currentStep === "review") {
          router.replace(
            "/doctor/doctor-verification/review" as Href
          );
          return;
        }

        router.replace(
          "/doctor/doctor-verification/professional-info" as Href
        );
        return;

      case "under_review":
        return;

      default:
        router.replace("/auth/login" as Href);
    }
  };

  const loadApplicationStatus = async (
    isRefresh = false
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }

      const storedValues = await AsyncStorage.multiGet([
        STORAGE_KEYS.status,
        STORAGE_KEYS.submittedAt,
        STORAGE_KEYS.fullName,
        STORAGE_KEYS.email,
        STORAGE_KEYS.currentStep,
      ]);

      const storedData = new Map(storedValues);

      const storedStatus =
        storedData.get(STORAGE_KEYS.status) ||
        "under_review";

      const currentStep = storedData.get(
        STORAGE_KEYS.currentStep
      );

      const fullName = storedData.get(
        STORAGE_KEYS.fullName
      );

      const email = storedData.get(
        STORAGE_KEYS.email
      );

      const submittedAt = storedData.get(
        STORAGE_KEYS.submittedAt
      );

      setDoctorName(fullName || "Doctor");
      setDoctorEmail(email || "");

      if (submittedAt) {
        setSubmittedDate(formatDate(submittedAt));
      }

      /*
        حاليًا بنقرأ الحالة من AsyncStorage.

        بعد ربط الـBackend:
        هنا هنعمل API Call يجيب أحدث Status
        وبعدها نخزن النتيجة ونوجه المستخدم.
      */
      await redirectByStatus(
        storedStatus as VerificationStatus,
        currentStep
      );
    } catch (error) {
      console.log(
        "Failed to load verification status:",
        error
      );

      Alert.alert(
        "Unable to load status",
        "We could not check your verification status. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (refreshing) return;

    await loadApplicationStatus(true);
  };

  const handleBackToLogin = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      /*
        بنمسح بيانات الـSession فقط،
        لكن بنسيب role وverificationStatus موجودين.
      */
      await AsyncStorage.multiRemove([
        "token",
        "user",
      ]);

      await AsyncStorage.setItem(
        "role",
        "doctor"
      );

      router.replace("/auth/login" as Href);
    } catch (error) {
      console.log(
        "Failed to return to login:",
        error
      );

      Alert.alert(
        "Navigation failed",
        "Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
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
            "#EEF7FF",
            "#FFF5F6",
            "#FFFFFF",
          ]}
          locations={[0, 0.38, 0.72]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.18 }}
          style={styles.background}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#8DC0F0"
            />

            <Text style={styles.loadingText}>
              Checking your application status...
            </Text>
          </View>
        </LinearGradient>
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

      <LinearGradient
        colors={[
          "#EEF7FF",
          "#FFF5F6",
          "#FFFFFF",
        ]}
        locations={[0, 0.38, 0.72]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.18 }}
        style={styles.background}
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.heroSection}>
            <LinearGradient
              colors={["#DCEFFF", "#FFE8E9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.illustrationCircle}
            >
              <View style={styles.innerCircle}>
                <Ionicons
                  name="hourglass-outline"
                  size={53}
                  color="#6D9EC8"
                />
              </View>

              <View style={styles.clockBadge}>
                <Ionicons
                  name="time"
                  size={19}
                  color="#FFFFFF"
                />
              </View>
            </LinearGradient>

            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />

              <Text style={styles.statusBadgeText}>
                Under Review
              </Text>
            </View>

            <Text style={styles.title}>
              Your request is under review
            </Text>

            <Text style={styles.subtitle}>
              Thank you, {doctorName}. We&apos;ve received
              your professional verification request.
            </Text>

            <Text style={styles.description}>
              Our verification team is currently reviewing
              your identity, professional license and
              qualifications.
            </Text>
          </View>

          <View style={styles.reviewTimeCard}>
            <View style={styles.reviewTimeIcon}>
              <Ionicons
                name="time-outline"
                size={25}
                color="#DD934B"
              />
            </View>

            <View style={styles.reviewTimeContent}>
              <Text style={styles.reviewTimeLabel}>
                Expected review time
              </Text>

              <Text style={styles.reviewTimeValue}>
                Within 1–2 business days
              </Text>

              <Text style={styles.reviewTimeDescription}>
                You&apos;ll be notified once a decision
                has been made.
              </Text>
            </View>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>
              Application Details
            </Text>

            <DetailRow
              label="Current status"
              value="Under Review"
              highlighted
            />

            <View style={styles.divider} />

            <DetailRow
              label="Submitted on"
              value={submittedDate || "Recently"}
            />

            {doctorEmail ? (
              <>
                <View style={styles.divider} />

                <DetailRow
                  label="Account email"
                  value={doctorEmail}
                />
              </>
            ) : null}

            <View style={styles.divider} />

            <DetailRow
              label="Estimated completion"
              value="1–2 business days"
            />
          </View>

          <View style={styles.stepsCard}>
            <Text style={styles.sectionTitle}>
              What happens next?
            </Text>

            <ProgressStep
              icon="checkmark"
              title="Application submitted"
              description="Your information and documents were received successfully."
              completed
            />

            <ProgressStep
              icon="search-outline"
              title="Professional review"
              description="Our team reviews your identity, license and professional qualifications."
              active
            />

            <ProgressStep
              icon="shield-checkmark-outline"
              title="Final decision"
              description="You’ll see the approval or rejection result after logging in."
              isLast
            />
          </View>

          <View style={styles.restrictionCard}>
            <View style={styles.restrictionIcon}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#C17C40"
              />
            </View>

            <View style={styles.restrictionContent}>
              <Text style={styles.restrictionTitle}>
                Doctor access is currently locked
              </Text>

              <Text style={styles.restrictionText}>
                You can access child cases and professional
                tools after your account has been approved.
              </Text>
            </View>
          </View>

          <View style={styles.privacyCard}>
            <View style={styles.privacyIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={21}
                color="#638EB3"
              />
            </View>

            <View style={styles.privacyContent}>
              <Text style={styles.privacyTitle}>
                Your documents are protected
              </Text>

              <Text style={styles.privacyText}>
                Your submitted documents remain private
                and are only used for account verification.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleRefreshStatus}
            disabled={refreshing}
            style={[
              styles.refreshButtonWrapper,
              refreshing && styles.disabledButton,
            ]}
          >
            <LinearGradient
              colors={["#8DC0F0", "#F9A8A7"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.refreshButton}
            >
              {refreshing ? (
                <ActivityIndicator
                  color="#171A1E"
                />
              ) : (
                <>
                  <Ionicons
                    name="refresh-outline"
                    size={19}
                    color="#171A1E"
                  />

                  <Text style={styles.refreshButtonText}>
                    Refresh Status
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleBackToLogin}
            disabled={loggingOut}
            style={styles.loginButton}
          >
            {loggingOut ? (
              <ActivityIndicator
                size="small"
                color="#6A94B6"
              />
            ) : (
              <>
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color="#6A94B6"
                />

                <Text style={styles.loginButtonText}>
                  Back to Login
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>
        {label}
      </Text>

      {highlighted ? (
        <View style={styles.pendingBadge}>
          <View style={styles.pendingDot} />

          <Text style={styles.pendingBadgeText}>
            {value}
          </Text>
        </View>
      ) : (
        <Text
          style={styles.detailValue}
          numberOfLines={2}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

function ProgressStep({
  icon,
  title,
  description,
  completed = false,
  active = false,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  completed?: boolean;
  active?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepIndicator}>
        <View
          style={[
            styles.stepCircle,
            completed && styles.stepCircleCompleted,
            active && styles.stepCircleActive,
          ]}
        >
          <Ionicons
            name={icon}
            size={16}
            color={
              completed
                ? "#FFFFFF"
                : active
                  ? "#D38642"
                  : "#789DBB"
            }
          />
        </View>

        {!isLast ? (
          <View style={styles.stepLine} />
        ) : null}
      </View>

      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>
          {title}
        </Text>

        <Text style={styles.stepDescription}>
          {description}
        </Text>
      </View>
    </View>
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

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },

  loadingText: {
    fontSize: 12,
    color: "#7D838A",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 25,
    paddingBottom: 30,
  },

  heroSection: {
    alignItems: "center",
    marginBottom: 22,
  },

  illustrationCircle: {
    position: "relative",
    width: 132,
    height: 132,
    borderRadius: 66,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 17,
  },

  innerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.78)",
  },

  clockBadge: {
    position: "absolute",
    right: 7,
    bottom: 9,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E29A50",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF2E5",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginBottom: 12,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#DE944B",
  },

  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#C77D38",
  },

  title: {
    maxWidth: 330,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "700",
    color: "#202428",
    textAlign: "center",
  },

  subtitle: {
    maxWidth: 330,
    marginTop: 10,
    fontSize: 11.5,
    lineHeight: 18,
    color: "#727980",
    textAlign: "center",
  },

  description: {
    maxWidth: 330,
    marginTop: 7,
    fontSize: 10,
    lineHeight: 16,
    color: "#90969C",
    textAlign: "center",
  },

  reviewTimeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF6EA",
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 14,
    marginBottom: 13,
  },

  reviewTimeIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 11,
  },

  reviewTimeContent: {
    flex: 1,
  },

  reviewTimeLabel: {
    fontSize: 9.5,
    color: "#92775C",
  },

  reviewTimeValue: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#75593F",
  },

  reviewTimeDescription: {
    marginTop: 6,
    fontSize: 9,
    lineHeight: 14,
    color: "#A08770",
  },

  detailsCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "#E5EAEE",
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingTop: 14,
    paddingBottom: 4,
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#292D31",
    marginBottom: 8,
  },

  detailRow: {
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  detailLabel: {
    flex: 1,
    fontSize: 9.5,
    color: "#7D838A",
  },

  detailValue: {
    flex: 1.2,
    fontSize: 10,
    fontWeight: "600",
    color: "#373C41",
    textAlign: "right",
  },

  divider: {
    height: 1,
    backgroundColor: "#ECEEF0",
  },

  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFF2E5",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DE944B",
  },

  pendingBadgeText: {
    fontSize: 8.5,
    fontWeight: "600",
    color: "#C77D38",
  },

  stepsCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5EAEE",
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingTop: 14,
    paddingBottom: 4,
    marginBottom: 13,
  },

  stepRow: {
    flexDirection: "row",
    minHeight: 76,
  },

  stepIndicator: {
    width: 32,
    alignItems: "center",
    marginRight: 9,
  },

  stepCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#B9CFE1",
    backgroundColor: "#FFFFFF",
  },

  stepCircleCompleted: {
    borderColor: "#4DB764",
    backgroundColor: "#4DB764",
  },

  stepCircleActive: {
    borderColor: "#E4A15E",
    backgroundColor: "#FFF4E9",
  },

  stepLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: "#DCE6ED",
    marginTop: 4,
  },

  stepContent: {
    flex: 1,
    paddingBottom: 16,
  },

  stepTitle: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#353A3F",
  },

  stepDescription: {
    marginTop: 5,
    fontSize: 9,
    lineHeight: 14,
    color: "#81878D",
  },

  restrictionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF5EA",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 11,
  },

  restrictionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 10,
  },

  restrictionContent: {
    flex: 1,
  },

  restrictionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8A643E",
  },

  restrictionText: {
    marginTop: 5,
    fontSize: 9,
    lineHeight: 14,
    color: "#9B7D61",
  },

  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EAF5FF",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 19,
  },

  privacyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 10,
  },

  privacyContent: {
    flex: 1,
  },

  privacyTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#56748C",
  },

  privacyText: {
    marginTop: 5,
    fontSize: 9,
    lineHeight: 14,
    color: "#688198",
  },

  refreshButtonWrapper: {
    width: "100%",
  },

  disabledButton: {
    opacity: 0.65,
  },

  refreshButton: {
    height: 56,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  refreshButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#171A1E",
  },

  loginButton: {
    height: 51,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E4ED",
    borderRadius: 999,
    marginTop: 10,
  },

  loginButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6A94B6",
  },
});