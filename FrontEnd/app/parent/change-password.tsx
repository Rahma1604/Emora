
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type PasswordRequirement = {
  id: string;
  label: string;
  isValid: boolean;
};

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] =
    useState(false);

  const passwordRequirements =
    useMemo<PasswordRequirement[]>(
      () => [
        {
          id: "length",
          label: "At least 8 characters",
          isValid:
            newPassword.length >= 8,
        },
        {
          id: "uppercase",
          label: "One uppercase letter",
          isValid: /[A-Z]/.test(
            newPassword
          ),
        },
        {
          id: "lowercase",
          label: "One lowercase letter",
          isValid: /[a-z]/.test(
            newPassword
          ),
        },
        {
          id: "number",
          label: "One number",
          isValid: /\d/.test(
            newPassword
          ),
        },
      ],
      [newPassword]
    );

  const allRequirementsValid =
    passwordRequirements.every(
      (requirement) =>
        requirement.isValid
    );

  const passwordsMatch =
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const clearError = () => {
    if (error) {
      setError("");
    }
  };

  const validateForm = (): boolean => {
    if (!currentPassword.trim()) {
      setError(
        "Please enter your current password."
      );
      return false;
    }

    if (!newPassword.trim()) {
      setError(
        "Please enter a new password."
      );
      return false;
    }

    if (!allRequirementsValid) {
      setError(
        "Your new password does not meet all password requirements."
      );
      return false;
    }

    if (
      currentPassword === newPassword
    ) {
      setError(
        "The new password must be different from your current password."
      );
      return false;
    }

    if (!confirmPassword.trim()) {
      setError(
        "Please confirm your new password."
      );
      return false;
    }

    if (!passwordsMatch) {
      setError(
        "The new password and confirmation do not match."
      );
      return false;
    }

    setError("");
    return true;
  };

  const handleUpdatePassword =
    async () => {
      if (!validateForm() || loading) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Frontend mock delay.
        // Replace this later with the backend API request.
        await new Promise<void>(
          (resolve) => {
            setTimeout(
              () => resolve(),
              800
            );
          }
        );

        Alert.alert(
          "Password Updated",
          "Your password has been updated successfully.",
          [
            {
              text: "OK",
              onPress: () =>
                router.back(),
            },
          ]
        );
      } catch (updateError) {
        console.log(
          "Update password error:",
          updateError
        );

        setError(
          "Failed to update your password. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View style={styles.container}>
          <View
            style={
              styles.topGradientWrapper
            }
          >
            <LinearGradient
              colors={[
                "rgba(185,216,246,0.20)",
                "rgba(255,255,255,0.10)",
                "rgba(251,192,191,0.22)",
              ]}
              locations={[
                0,
                0.5,
                1,
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
                StyleSheet.absoluteFillObject
              }
            />

            <LinearGradient
              colors={[
                "rgba(255,255,255,0)",
                "rgba(255,255,255,0.75)",
                "#FFFFFF",
              ]}
              locations={[
                0,
                0.65,
                1,
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 0,
                y: 1,
              }}
              style={
                StyleSheet.absoluteFillObject
              }
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={
              styles.scrollContent
            }
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() =>
                  router.back()
                }
                style={
                  styles.backButton
                }
                disabled={loading}
              >
                <Ionicons
                  name="chevron-back"
                  size={23}
                  color="#222222"
                />
              </TouchableOpacity>

              <Text
                style={
                  styles.headerTitle
                }
              >
                Change Password
              </Text>

              <View
                style={
                  styles.headerSpace
                }
              />
            </View>

            {/* Intro */}
            <View style={styles.introRow}>
              <LinearGradient
                colors={[
                  "#EDF7FF",
                  "#FDE8EA",
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
                  styles.introIconContainer
                }
              >
                <Feather
                  name="lock"
                  size={25}
                  color="#6E9CBD"
                />
              </LinearGradient>

              <View
                style={
                  styles.introContent
                }
              >
                <Text
                  style={
                    styles.introTitle
                  }
                >
                  Protect your account
                </Text>

                <Text
                  style={
                    styles.introDescription
                  }
                >
                  Choose a strong password
                  that you do not use on
                  other accounts.
                </Text>
              </View>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              {/* Current password */}
              <View
                style={
                  styles.inputBlock
                }
              >
                <Text
                  style={styles.label}
                >
                  Current password
                </Text>

                <View
                  style={[
                    styles.inputContainer,
                    error &&
                    !currentPassword
                      ? styles.inputContainerError
                      : null,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={17}
                    color="#93A0A8"
                  />

                  <TextInput
                    value={
                      currentPassword
                    }
                    onChangeText={(
                      value
                    ) => {
                      setCurrentPassword(
                        value
                      );
                      clearError();
                    }}
                    placeholder="Enter your current password"
                    placeholderTextColor="#AEB5BA"
                    style={
                      styles.textInput
                    }
                    secureTextEntry={
                      !showCurrentPassword
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="next"
                  />

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      setShowCurrentPassword(
                        (current) =>
                          !current
                      )
                    }
                    style={
                      styles.eyeButton
                    }
                  >
                    <Ionicons
                      name={
                        showCurrentPassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={20}
                      color="#93A0A8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New password */}
              <View
                style={
                  styles.inputBlock
                }
              >
                <Text
                  style={styles.label}
                >
                  New password
                </Text>

                <View
                  style={[
                    styles.inputContainer,
                    error &&
                    newPassword &&
                    !allRequirementsValid
                      ? styles.inputContainerError
                      : null,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={17}
                    color="#93A0A8"
                  />

                  <TextInput
                    value={newPassword}
                    onChangeText={(
                      value
                    ) => {
                      setNewPassword(
                        value
                      );
                      clearError();
                    }}
                    placeholder="Create a new password"
                    placeholderTextColor="#AEB5BA"
                    style={
                      styles.textInput
                    }
                    secureTextEntry={
                      !showNewPassword
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="next"
                  />

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      setShowNewPassword(
                        (current) =>
                          !current
                      )
                    }
                    style={
                      styles.eyeButton
                    }
                  >
                    <Ionicons
                      name={
                        showNewPassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={20}
                      color="#93A0A8"
                    />
                  </TouchableOpacity>
                </View>

                {/* Password rules */}
                <View
                  style={
                    styles.requirementsBox
                  }
                >
                  {passwordRequirements.map(
                    (requirement) => (
                      <View
                        key={
                          requirement.id
                        }
                        style={
                          styles.requirementRow
                        }
                      >
                        <Ionicons
                          name={
                            requirement.isValid
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={15}
                          color={
                            requirement.isValid
                              ? "#4FA66A"
                              : "#A6AFB5"
                          }
                        />

                        <Text
                          style={[
                            styles.requirementText,
                            requirement.isValid
                              ? styles.requirementTextValid
                              : null,
                          ]}
                        >
                          {
                            requirement.label
                          }
                        </Text>
                      </View>
                    )
                  )}
                </View>
              </View>

              {/* Confirm password */}
              <View
                style={[
                  styles.inputBlock,
                  styles.lastInputBlock,
                ]}
              >
                <Text
                  style={styles.label}
                >
                  Confirm new password
                </Text>

                <View
                  style={[
                    styles.inputContainer,
                    confirmPassword &&
                    !passwordsMatch
                      ? styles.inputContainerError
                      : null,
                    confirmPassword &&
                    passwordsMatch
                      ? styles.inputContainerSuccess
                      : null,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={17}
                    color="#93A0A8"
                  />

                  <TextInput
                    value={
                      confirmPassword
                    }
                    onChangeText={(
                      value
                    ) => {
                      setConfirmPassword(
                        value
                      );
                      clearError();
                    }}
                    placeholder="Re-enter your new password"
                    placeholderTextColor="#AEB5BA"
                    style={
                      styles.textInput
                    }
                    secureTextEntry={
                      !showConfirmPassword
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={
                      handleUpdatePassword
                    }
                  />

                  {confirmPassword &&
                  passwordsMatch ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#4FA66A"
                    />
                  ) : null}

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      setShowConfirmPassword(
                        (current) =>
                          !current
                      )
                    }
                    style={
                      styles.eyeButton
                    }
                  >
                    <Ionicons
                      name={
                        showConfirmPassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={20}
                      color="#93A0A8"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Error */}
            {error ? (
              <View
                style={
                  styles.errorContainer
                }
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={17}
                  color="#D9534F"
                />

                <Text
                  style={styles.errorText}
                >
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Information */}
            <View style={styles.infoCard}>
              <View
                style={
                  styles.infoIconContainer
                }
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="#5E8EAF"
                />
              </View>

              <Text style={styles.infoText}>
                After changing your
                password, any future login
                must use the new password.
                Your professional
                verification status will not
                be affected.
              </Text>
            </View>

            {/* Update button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={
                handleUpdatePassword
              }
              disabled={loading}
              style={
                styles.buttonWrapper
              }
            >
              <LinearGradient
                colors={[
                  "#9FD0F5",
                  "#F4A5AD",
                ]}
                start={{
                  x: 0,
                  y: 0.5,
                }}
                end={{
                  x: 1,
                  y: 0.5,
                }}
                style={[
                  styles.updateButton,
                  loading
                    ? styles.disabledButton
                    : null,
                ]}
              >
                {loading ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color="#25292D"
                    />

                    <Text
                      style={
                        styles.updateButtonText
                      }
                    >
                      Updating...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text
                      style={
                        styles.updateButtonText
                      }
                    >
                      Update Password
                    </Text>

                    <Ionicons
                      name="checkmark"
                      size={19}
                      color="#25292D"
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View
              style={styles.bottomSpace}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  keyboardContainer: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  topGradientWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 190,
    overflow: "hidden",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },

  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
    color: "#222222",
  },

  headerSpace: {
    width: 38,
  },

  introRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 1,
    marginBottom: 18,
  },

  introIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  introContent: {
    flex: 1,
  },

  introTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#292D31",
  },

  introDescription: {
    marginTop: 5,
    fontSize: 9.5,
    lineHeight: 14,
    color: "#858B92",
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6E8EA",
    paddingHorizontal: 13,
    paddingTop: 15,
    paddingBottom: 3,
    shadowColor: "#9DA6AD",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },

  inputBlock: {
    marginBottom: 18,
  },

  lastInputBlock: {
    marginBottom: 13,
  },

  label: {
    marginBottom: 8,
    fontSize: 9.5,
    fontWeight: "600",
    color: "#474C51",
  },

  inputContainer: {
    height: 53,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#DDE2E6",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  inputContainerError: {
    borderColor: "#E8A3A0",
    backgroundColor: "#FFF9F9",
  },

  inputContainerSuccess: {
    borderColor: "#A8D8B5",
    backgroundColor: "#F9FFFA",
  },

  textInput: {
    flex: 1,
    height: "100%",
    marginLeft: 11,
    fontSize: 10.5,
    color: "#25292D",
  },

  eyeButton: {
    width: 34,
    height: 34,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  requirementsBox: {
    borderRadius: 12,
    backgroundColor: "#F4F8FB",
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginTop: 11,
  },

  requirementRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
  },

  requirementText: {
    marginLeft: 8,
    fontSize: 8.5,
    color: "#858B92",
  },

  requirementTextValid: {
    color: "#4D8B62",
  },

  errorContainer: {
    minHeight: 43,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F4D1CF",
    backgroundColor: "#FFF4F3",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  errorText: {
    flex: 1,
    marginLeft: 7,
    fontSize: 9,
    lineHeight: 14,
    color: "#C04F4A",
  },

  infoCard: {
    minHeight: 55,
    borderRadius: 13,
    backgroundColor: "#EAF6FD",
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  infoIconContainer: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },

  infoText: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 13,
    color: "#658194",
  },

  buttonWrapper: {
    marginTop: 15,
  },

  updateButton: {
    height: 55,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 13,
  },

  disabledButton: {
    opacity: 0.7,
  },

  updateButtonText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#25292D",
  },

  bottomSpace: {
    height: 10,
  },
});

