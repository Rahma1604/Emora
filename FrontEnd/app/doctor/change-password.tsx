import React, { useMemo, useState } from "react";
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
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Errors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
};

type FeedbackType =
  | "success"
  | "incorrect"
  | "error"
  | null;

type DemoDoctorCredentials = {
  email: string;
  password: string;
};

const FRONTEND_ONLY_MODE = true;

export default function ChangePasswordScreen() {
  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [showCurrent, setShowCurrent] =
    useState(false);

  const [showNew, setShowNew] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [errors, setErrors] =
    useState<Errors>({});

  const [saving, setSaving] =
    useState(false);

  const [feedback, setFeedback] =
    useState<FeedbackType>(null);

  const passwordRules = useMemo(
    () => ({
      length: newPassword.length >= 8,

      uppercase:
        /[A-Z]/.test(newPassword),

      lowercase:
        /[a-z]/.test(newPassword),

      number:
        /\d/.test(newPassword),
    }),
    [newPassword]
  );

  const isStrongPassword =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number;

  const clearError = (
    field: keyof Errors
  ) => {
    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
      general: undefined,
    }));
  };

  const validate = () => {
    const nextErrors: Errors = {};

    if (!currentPassword) {
      nextErrors.currentPassword =
        "Current password is required";
    }

    if (!newPassword) {
      nextErrors.newPassword =
        "New password is required";
    } else if (!isStrongPassword) {
      nextErrors.newPassword =
        "Use at least 8 characters with uppercase, lowercase and a number";
    } else if (
      newPassword === currentPassword
    ) {
      nextErrors.newPassword =
        "Your new password must be different from your current password";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword =
        "Please confirm your new password";
    } else if (
      confirmPassword !== newPassword
    ) {
      nextErrors.confirmPassword =
        "Passwords do not match";
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length ===
      0
    );
  };

  const handleSave = async () => {
    if (saving || !validate()) return;

    try {
      setSaving(true);
      setErrors({});

      if (FRONTEND_ONLY_MODE) {
        const savedCredentials =
          await AsyncStorage.getItem(
            "demoDoctorCredentials"
          );

        if (!savedCredentials) {
          setErrors({
            general:
              "No saved doctor account was found. Please sign in again.",
          });

          return;
        }

        let credentials: DemoDoctorCredentials;

        try {
          credentials = JSON.parse(
            savedCredentials
          ) as DemoDoctorCredentials;
        } catch {
          setErrors({
            general:
              "The saved account data is invalid. Please sign in again.",
          });

          return;
        }

        if (
          credentials.password !==
          currentPassword
        ) {
          setFeedback("incorrect");

          return;
        }

        await AsyncStorage.setItem(
          "demoDoctorCredentials",
          JSON.stringify({
            ...credentials,
            password: newPassword,
          })
        );

        await AsyncStorage.setItem(
          "doctorPasswordUpdatedAt",
          new Date().toISOString()
        );

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setFeedback("success");

        return;
      }

      /*
        Backend mode:

        استبدل الجزء التجريبي الموجود فوق
        بطلب الـAPI الخاص بتغيير كلمة المرور.

        مثال:

        await API.patch(
          "/doctor/change-password",
          {
            currentPassword,
            newPassword,
            confirmPassword,
          }
        );
      */
    } catch (error) {
      console.log(
        "Change password error:",
        error
      );

      setFeedback("error");
    } finally {
      setSaving(false);
    }
  };

  const feedbackContent = useMemo(() => {
    if (feedback === "success") {
      return {
        icon:
          "checkmark-circle-outline" as const,

        colors: [
          "#DDF7E4",
          "#EAF5FF",
        ] as [string, string],

        iconColor: "#49AD5D",

        title: "Password updated",

        description:
          "Your password has been changed successfully. Use the new password the next time you sign in.",

        buttonText: "Done",
      };
    }

    if (feedback === "incorrect") {
      return {
        icon:
          "lock-closed-outline" as const,

        colors: [
          "#FFF1DE",
          "#FFE7E8",
        ] as [string, string],

        iconColor: "#D38A40",

        title:
          "Current password is incorrect",

        description:
          "The password you entered does not match your current account password.",

        buttonText: "Try Again",
      };
    }

    return {
      icon:
        "alert-circle-outline" as const,

      colors: [
        "#FFE4E6",
        "#FFF1F2",
      ] as [string, string],

      iconColor: "#D75A62",

      title:
        "Password was not changed",

      description:
        "Something went wrong while updating your password. Please try again.",

      buttonText: "Try Again",
    };
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
        locations={[0, 0.52, 1]}
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
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <ScrollView
            contentContainerStyle={
              styles.scrollContent
            }
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <Header title="Change Password" />

            {/* Introduction */}
            <View style={styles.introCard}>
              <LinearGradient
                colors={[
                  "#DDEFFF",
                  "#FFE4E6",
                ]}
                start={{
                  x: 0,
                  y: 0,
                }}
                end={{
                  x: 1,
                  y: 1,
                }}
                style={styles.introIcon}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={28}
                  color="#6D9EC8"
                />
              </LinearGradient>

              <View
                style={styles.introContent}
              >
                <Text
                  style={styles.pageTitle}
                >
                  Protect your account
                </Text>

                <Text
                  style={
                    styles.pageSubtitle
                  }
                >
                  Choose a strong password that
                  you do not use on other
                  accounts.
                </Text>
              </View>
            </View>

            {/* Password Form */}
            <View style={styles.formCard}>
              <PasswordField
                label="Current password"
                placeholder="Enter your current password"
                value={currentPassword}
                onChangeText={(value) => {
                  setCurrentPassword(value);
                  clearError(
                    "currentPassword"
                  );
                }}
                visible={showCurrent}
                onToggle={() =>
                  setShowCurrent(
                    (value) => !value
                  )
                }
                error={
                  errors.currentPassword
                }
                editable={!saving}
              />

              <PasswordField
                label="New password"
                placeholder="Create a new password"
                value={newPassword}
                onChangeText={(value) => {
                  setNewPassword(value);
                  clearError("newPassword");
                }}
                visible={showNew}
                onToggle={() =>
                  setShowNew(
                    (value) => !value
                  )
                }
                error={errors.newPassword}
                editable={!saving}
              />

              {/* Password Rules */}
              <View
                style={styles.rulesCard}
              >
                <RuleRow
                  label="At least 8 characters"
                  valid={
                    passwordRules.length
                  }
                />

                <RuleRow
                  label="One uppercase letter"
                  valid={
                    passwordRules.uppercase
                  }
                />

                <RuleRow
                  label="One lowercase letter"
                  valid={
                    passwordRules.lowercase
                  }
                />

                <RuleRow
                  label="One number"
                  valid={
                    passwordRules.number
                  }
                />
              </View>

              <PasswordField
                label="Confirm new password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(
                    value
                  );

                  clearError(
                    "confirmPassword"
                  );
                }}
                visible={showConfirm}
                onToggle={() =>
                  setShowConfirm(
                    (value) => !value
                  )
                }
                error={
                  errors.confirmPassword
                }
                editable={!saving}
              />
            </View>

            {/* Security Notice */}
            <View
              style={
                styles.securityNotice
              }
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={21}
                color="#648FB4"
              />

              <Text
                style={
                  styles.securityNoticeText
                }
              >
                After changing your password,
                any future login must use the
                new password. Your professional
                verification status will not be
                affected.
              </Text>
            </View>

            {errors.general ? (
              <View
                style={styles.generalError}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={19}
                  color="#D95A62"
                />

                <Text
                  style={
                    styles.generalErrorText
                  }
                >
                  {errors.general}
                </Text>
              </View>
            ) : null}

            {/* Save Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSave}
              disabled={saving}
              style={[
                styles.saveWrapper,
                saving &&
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
                style={styles.saveButton}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#25282B"
                  />
                ) : (
                  <>
                    <Text
                      style={
                        styles.saveButtonText
                      }
                    >
                      Update Password
                    </Text>

                    <Ionicons
                      name="checkmark-outline"
                      size={19}
                      color="#25282B"
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
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
        <View
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <LinearGradient
              colors={
                feedbackContent.colors
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
                name={
                  feedbackContent.icon
                }
                size={40}
                color={
                  feedbackContent.iconColor
                }
              />
            </LinearGradient>

            <Text
              style={styles.modalTitle}
            >
              {feedbackContent.title}
            </Text>

            <Text
              style={
                styles.modalDescription
              }
            >
              {
                feedbackContent.description
              }
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
                  {
                    feedbackContent.buttonText
                  }
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Header({
  title,
}: {
  title: string;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color="#1F2937"
        />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>
        {title}
      </Text>

      <View
        style={styles.headerPlaceholder}
      />
    </View>
  );
}

function PasswordField({
  label,
  placeholder,
  value,
  onChangeText,
  visible,
  onToggle,
  error,
  editable,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (
    value: string
  ) => void;
  visible: boolean;
  onToggle: () => void;
  error?: string;
  editable: boolean;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.inputLabel}>
        {label}
      </Text>

      <View
        style={[
          styles.inputContainer,
          error && styles.inputError,
        ]}
      >
        <Ionicons
          name="lock-closed-outline"
          size={19}
          color="#84919C"
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A6ABB1"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
          style={styles.input}
        />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onToggle}
        >
          <Ionicons
            name={
              visible
                ? "eye-off-outline"
                : "eye-outline"
            }
            size={19}
            color="#8F979E"
          />
        </TouchableOpacity>
      </View>

      {error ? (
        <Text style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function RuleRow({
  label,
  valid,
}: {
  label: string;
  valid: boolean;
}) {
  return (
    <View style={styles.ruleRow}>
      <Ionicons
        name={
          valid
            ? "checkmark-circle"
            : "ellipse-outline"
        }
        size={16}
        color={
          valid
            ? "#49AB5D"
            : "#B6BBC0"
        }
      />

      <Text
        style={[
          styles.ruleText,
          valid &&
            styles.ruleTextValid,
        ]}
      >
        {label}
      </Text>
    </View>
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

  introCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 18,
  },

  introIcon: {
    width: 56,
    height: 56,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  introContent: {
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

  formCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EBEF",
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingTop: 15,
    paddingBottom: 2,
    marginBottom: 14,
  },

  fieldBlock: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#4A5055",
    marginBottom: 7,
  },

  inputContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E2E7EA",
    borderRadius: 12,
    paddingHorizontal: 12,
  },

  inputError: {
    borderColor: "#EA666D",
  },

  input: {
    flex: 1,
    fontSize: 12,
    color: "#252A2E",
  },

  errorText: {
    marginTop: 5,
    marginLeft: 3,
    fontSize: 9,
    lineHeight: 13,
    color: "#DC535B",
  },

  rulesCard: {
    backgroundColor: "#F4F8FB",
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 10,
    marginTop: -4,
    marginBottom: 16,
    gap: 7,
  },

  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  ruleText: {
    fontSize: 9,
    color: "#8B9197",
  },

  ruleTextValid: {
    color: "#4F8C5B",
  },

  securityNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "#EAF5FF",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },

  securityNoticeText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 14,
    color: "#668098",
  },

  generalError: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FFF0F1",
    borderRadius: 12,
    padding: 11,
    marginBottom: 14,
  },

  generalErrorText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 14,
    color: "#B9575E",
  },

  saveWrapper: {
    width: "100%",
  },

  disabledButton: {
    opacity: 0.65,
  },

  saveButton: {
    height: 54,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  saveButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#25282B",
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
    elevation: 14,
  },

  modalIcon: {
    width: 91,
    height: 91,
    borderRadius: 46,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  modalTitle: {
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