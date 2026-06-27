import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const VALID_STATUSES: VerificationStatus[] = [
  "not_started",
  "draft",
  "under_review",
  "changes_required",
  "verified",
  "rejected",
  "expired",
  "suspended",
];

export default function VerificationStatusScreen() {
  const [checking, setChecking] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const normalizeStatus = (
    value: string | null
  ): VerificationStatus | null => {
    if (
      value &&
      VALID_STATUSES.includes(
        value as VerificationStatus
      )
    ) {
      return value as VerificationStatus;
    }

    return null;
  };

  const getDraftRoute = (
    currentStep?: string | null
  ): Href => {
    switch (currentStep) {
      case "documents":
        return "/doctor/doctor-verification/documents" as Href;

      case "review":
        return "/doctor/doctor-verification/review" as Href;

      case "professional-info":
      case "professional_info":
        return "/doctor/doctor-verification/professional-info" as Href;

      case "intro":
      default:
        return "/doctor/doctor-verification/intro" as Href;
    }
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

      case "under_review":
        router.replace(
          "/doctor/doctor-verification/pending" as Href
        );
        return;

      case "rejected":
      case "changes_required":
      case "expired":
      case "suspended":
        router.replace(
          "/doctor/doctor-verification/rejected" as Href
        );
        return;

      case "draft":
        router.replace(
          getDraftRoute(currentStep)
        );
        return;

      case "not_started":
      default:
        router.replace(
          "/doctor/doctor-verification/intro" as Href
        );
    }
  };

  const checkVerificationStatus = async () => {
    try {
      setChecking(true);
      setHasError(false);

      const storedValues =
        await AsyncStorage.multiGet([
          "verificationStatus",
          "verificationCurrentStep",
          "role",
        ]);

      const storedData = new Map(storedValues);

      const storedRole =
        storedData.get("role");

      if (storedRole !== "doctor") {
        router.replace(
          "/auth/login" as Href
        );

        return;
      }

      const status = normalizeStatus(
        storedData.get(
          "verificationStatus"
        ) || null
      );

      const currentStep =
        storedData.get(
          "verificationCurrentStep"
        );

      if (!status) {
        router.replace(
          "/auth/login" as Href
        );

        return;
      }

      await redirectByStatus(
        status,
        currentStep
      );
    } catch (error) {
      console.log(
        "Failed to check verification status:",
        error
      );

      setHasError(true);

      Alert.alert(
        "Unable to check status",
        "We could not load your verification status."
      );
    } finally {
      setChecking(false);
    }
  };

  const handleBackToLogin = async () => {
    try {
      await AsyncStorage.multiRemove([
        "token",
        "user",
      ]);

      await AsyncStorage.setItem(
        "role",
        "doctor"
      );

      router.replace(
        "/auth/login" as Href
      );
    } catch (error) {
      console.log(
        "Failed to return to login:",
        error
      );
    }
  };

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
        <View style={styles.container}>
          {checking && !hasError ? (
            <>
              <LinearGradient
                colors={[
                  "#DCEFFF",
                  "#FFE5E6",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={48}
                  color="#6D9EC8"
                />
              </LinearGradient>

              <ActivityIndicator
                size="large"
                color="#8DC0F0"
                style={styles.loader}
              />

              <Text style={styles.title}>
                Checking your verification status
              </Text>

              <Text style={styles.description}>
                Please wait while we prepare the correct
                page for your professional account.
              </Text>
            </>
          ) : (
            <>
              <View style={styles.errorIcon}>
                <Ionicons
                  name="alert-circle-outline"
                  size={45}
                  color="#D85A62"
                />
              </View>

              <Text style={styles.title}>
                We couldn&apos;t check your status
              </Text>

              <Text style={styles.description}>
                Please try again or return to the Login
                page.
              </Text>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={checkVerificationStatus}
                style={styles.retryButtonWrapper}
              >
                <LinearGradient
                  colors={[
                    "#8DC0F0",
                    "#F9A8A7",
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.retryButton}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={19}
                    color="#171A1E"
                  />

                  <Text
                    style={styles.retryButtonText}
                  >
                    Try Again
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleBackToLogin}
                style={styles.loginButton}
              >
                <Ionicons
                  name="log-in-outline"
                  size={18}
                  color="#6B94B5"
                />

                <Text
                  style={styles.loginButtonText}
                >
                  Back to Login
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>
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

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },

  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    justifyContent: "center",
    alignItems: "center",
  },

  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF0F1",
  },

  loader: {
    marginTop: 23,
  },

  title: {
    marginTop: 20,
    maxWidth: 320,
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    color: "#22262A",
    textAlign: "center",
  },

  description: {
    marginTop: 10,
    maxWidth: 330,
    fontSize: 11,
    lineHeight: 18,
    color: "#858B92",
    textAlign: "center",
  },

  retryButtonWrapper: {
    width: "100%",
    marginTop: 28,
  },

  retryButton: {
    height: 55,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  retryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#171A1E",
  },

  loginButton: {
    width: "100%",
    height: 51,
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D8E4ED",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },

  loginButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B94B5",
  },
});