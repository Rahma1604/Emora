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
  fullName: "verificationFullName",
  rejectionReason: "verificationRejectionReason",
  rejectedAt: "verificationRejectedAt",
  currentStep: "verificationCurrentStep",
};

const DEFAULT_REJECTION_REASON =
  "We could not verify one or more of the submitted professional documents. Please review your information and upload clear, valid documents before submitting again.";

export default function VerificationRejectedScreen() {
  const [doctorName, setDoctorName] = useState("Doctor");
  const [rejectionReason, setRejectionReason] =
    useState(DEFAULT_REJECTION_REASON);
  const [rejectedDate, setRejectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [openingDocuments, setOpeningDocuments] =
    useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    loadRejectionDetails();
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

  const redirectByStatus = (
    status: VerificationStatus
  ) => {
    if (status === "verified") {
      router.replace(
        "/doctor/doctor-verification/approved" as Href
      );

      return;
    }

    if (status === "under_review") {
      router.replace(
        "/doctor/doctor-verification/pending" as Href
      );

      return;
    }

    if (status === "not_started") {
      router.replace(
        "/doctor/doctor-verification/intro" as Href
      );

      return;
    }
  };

  const loadRejectionDetails = async () => {
    try {
      const storedValues = await AsyncStorage.multiGet([
        STORAGE_KEYS.status,
        STORAGE_KEYS.fullName,
        STORAGE_KEYS.rejectionReason,
        STORAGE_KEYS.rejectedAt,
      ]);

      const storedData = new Map(storedValues);

      const currentStatus =
        storedData.get(STORAGE_KEYS.status) ||
        "rejected";

      const fullName = storedData.get(
        STORAGE_KEYS.fullName
      );

      const reason = storedData.get(
        STORAGE_KEYS.rejectionReason
      );

      const rejectedAt = storedData.get(
        STORAGE_KEYS.rejectedAt
      );

      setDoctorName(fullName || "Doctor");

      if (reason) {
        setRejectionReason(reason);
      }

      if (rejectedAt) {
        setRejectedDate(formatDate(rejectedAt));
      }

      redirectByStatus(
        currentStatus as VerificationStatus
      );
    } catch (error) {
      console.log(
        "Failed to load rejection details:",
        error
      );

      Alert.alert(
        "Unable to load application",
        "We could not load your verification result."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDocuments = async () => {
    if (openingDocuments) return;

    try {
      setOpeningDocuments(true);

      /*
        مؤقتًا بنرجع الطلب إلى Draft علشان
        الدكتور يقدر يعدل المستندات.

        بعد ربط الـBackend:
        هيتم استدعاء API لإنشاء Resubmission.
      */
      await AsyncStorage.multiSet([
        [
          STORAGE_KEYS.status,
          "draft",
        ],
        [
          STORAGE_KEYS.currentStep,
          "documents",
        ],
      ]);

      router.replace(
        "/doctor/doctor-verification/documents" as Href
      );
    } catch (error) {
      console.log(
        "Failed to open documents:",
        error
      );

      Alert.alert(
        "Unable to continue",
        "Please try again."
      );
    } finally {
      setOpeningDocuments(false);
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      "Contact Support",
      "Support integration will be connected later. For now, please contact the Emora support team."
    );
  };

  const handleBackToLogin = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

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
              Loading verification result...
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
              colors={["#DCEFFF", "#FFE2E4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.illustrationCircle}
            >
              <View style={styles.innerCircle}>
                <Ionicons
                  name="document-text-outline"
                  size={51}
                  color="#778FA4"
                />
              </View>

              <View style={styles.rejectedBadgeIcon}>
                <Ionicons
                  name="close"
                  size={22}
                  color="#FFFFFF"
                />
              </View>
            </LinearGradient>

            <View style={styles.statusBadge}>
              <Ionicons
                name="close-circle"
                size={15}
                color="#D8535B"
              />

              <Text style={styles.statusBadgeText}>
                Verification Rejected
              </Text>
            </View>

            <Text style={styles.title}>
              Your request wasn&apos;t approved
            </Text>

            <Text style={styles.subtitle}>
              We&apos;re sorry, {doctorName}. Your
              professional verification request could not
              be approved at this time.
            </Text>
          </View>

          <View style={styles.reasonCard}>
            <View style={styles.reasonHeader}>
              <View style={styles.reasonIcon}>
                <Ionicons
                  name="alert-circle-outline"
                  size={22}
                  color="#D85A62"
                />
              </View>

              <View style={styles.reasonHeaderContent}>
                <Text style={styles.reasonTitle}>
                  Reason for rejection
                </Text>

                <Text style={styles.reasonLabel}>
                  Please review the following issue
                </Text>
              </View>
            </View>

            <Text style={styles.reasonText}>
              {rejectionReason}
            </Text>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>
              Application Details
            </Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                Current status
              </Text>

              <View style={styles.rejectedStatusBadge}>
                <Text
                  style={
                    styles.rejectedStatusBadgeText
                  }
                >
                  Rejected
                </Text>
              </View>
            </View>

            {rejectedDate ? (
              <>
                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Decision date
                  </Text>

                  <Text style={styles.detailValue}>
                    {rejectedDate}
                  </Text>
                </View>
              </>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                Doctor access
              </Text>

              <Text style={styles.lockedValue}>
                Locked
              </Text>
            </View>
          </View>

          <View style={styles.nextStepsCard}>
            <Text style={styles.sectionTitle}>
              What can you do?
            </Text>

            <ActionExplanation
              icon="document-attach-outline"
              title="Review your documents"
              description="Make sure all uploaded documents are clear, valid and match your account information."
            />

            <ActionExplanation
              icon="refresh-outline"
              title="Update and resubmit"
              description="Replace the incorrect documents and submit your verification request again."
            />

            <ActionExplanation
              icon="help-circle-outline"
              title="Contact support"
              description="Contact the support team if you believe the decision was made by mistake."
              isLast
            />
          </View>

          <View style={styles.warningCard}>
            <View style={styles.warningIcon}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#C0787E"
              />
            </View>

            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>
                Professional access is unavailable
              </Text>

              <Text style={styles.warningText}>
                You cannot access child cases or send
                recommendations until your account is
                professionally verified.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleUpdateDocuments}
            disabled={openingDocuments}
            style={[
              styles.primaryButtonWrapper,
              openingDocuments &&
                styles.disabledButton,
            ]}
          >
            <LinearGradient
              colors={["#8DC0F0", "#F9A8A7"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.primaryButton}
            >
              {openingDocuments ? (
                <ActivityIndicator
                  color="#171A1E"
                />
              ) : (
                <>
                  <Ionicons
                    name="document-attach-outline"
                    size={19}
                    color="#171A1E"
                  />

                  <Text style={styles.primaryButtonText}>
                    Update Documents
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleContactSupport}
            style={styles.supportButton}
          >
            <Ionicons
              name="help-circle-outline"
              size={18}
              color="#6B94B5"
            />

            <Text style={styles.supportButtonText}>
              Contact Support
            </Text>
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
                color="#7A858E"
              />
            ) : (
              <>
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color="#7A858E"
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

function ActionExplanation({
  icon,
  title,
  description,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.actionRow,
        !isLast && styles.actionRowBorder,
      ]}
    >
      <View style={styles.actionIcon}>
        <Ionicons
          name={icon}
          size={19}
          color="#6999BF"
        />
      </View>

      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>
          {title}
        </Text>

        <Text style={styles.actionDescription}>
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

  rejectedBadgeIcon: {
    position: "absolute",
    right: 7,
    bottom: 9,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E25B63",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FDEDEE",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginBottom: 12,
  },

  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#C8474F",
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
    maxWidth: 335,
    marginTop: 10,
    fontSize: 11.5,
    lineHeight: 18,
    color: "#747B82",
    textAlign: "center",
  },

  reasonCard: {
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#F5D2D5",
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 13,
    marginBottom: 13,
  },

  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  reasonIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 10,
  },

  reasonHeaderContent: {
    flex: 1,
  },

  reasonTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#964C52",
  },

  reasonLabel: {
    marginTop: 4,
    fontSize: 8.5,
    color: "#B4797E",
  },

  reasonText: {
    marginTop: 12,
    fontSize: 10,
    lineHeight: 16,
    color: "#8D5A5F",
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
    fontSize: 9.5,
    color: "#7D838A",
  },

  detailValue: {
    fontSize: 10,
    fontWeight: "600",
    color: "#373C41",
  },

  lockedValue: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D6535B",
  },

  divider: {
    height: 1,
    backgroundColor: "#ECEEF0",
  },

  rejectedStatusBadge: {
    backgroundColor: "#FDEDEE",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  rejectedStatusBadgeText: {
    fontSize: 8.5,
    fontWeight: "600",
    color: "#CB4951",
  },

  nextStepsCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5EAEE",
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingTop: 14,
    paddingBottom: 4,
    marginBottom: 13,
  },

  actionRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
  },

  actionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#ECEEF0",
  },

  actionIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF6FD",
    marginRight: 10,
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#363B40",
  },

  actionDescription: {
    marginTop: 5,
    fontSize: 8.8,
    lineHeight: 14,
    color: "#858B91",
  },

  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF2F3",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 19,
  },

  warningIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 10,
  },

  warningContent: {
    flex: 1,
  },

  warningTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#92585D",
  },

  warningText: {
    marginTop: 5,
    fontSize: 9,
    lineHeight: 14,
    color: "#A3787C",
  },

  primaryButtonWrapper: {
    width: "100%",
  },

  disabledButton: {
    opacity: 0.65,
  },

  primaryButton: {
    height: 56,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#171A1E",
  },

  supportButton: {
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

  supportButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B94B5",
  },

  loginButton: {
    height: 47,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    marginTop: 7,
  },

  loginButtonText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#7A858E",
  },
});