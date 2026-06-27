import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import {
  LinearGradient,
} from "expo-linear-gradient";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  Image,
} from "expo-image";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import API from "../api";

type RoleType =
  | "doctor"
  | "parent"
  | null;

type ErrorsType = {
  password?: string;
  confirmPassword?: string;
  general?: string;
};

type RenderPasswordInputProps = {
  placeholder: string;
  value: string;
  onChangeText: (
    text: string
  ) => void;
  error?: string;
  isPasswordVisible: boolean;
  onToggleVisibility: () => void;
  onSubmitEditing?: () => void;
  returnKeyType?:
    | "next"
    | "done";
};

function getParamValue(
  value?:
    | string
    | string[]
): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

export default function ResetPasswordScreen() {
  const params =
    useLocalSearchParams<{
      email?:
        | string
        | string[];

      role?:
        | string
        | string[];
    }>();

  const emailParam =
    getParamValue(
      params.email
    );

  const roleParam =
    getParamValue(
      params.role
    );

  const [role, setRole] =
    useState<RoleType>(null);

  const [
    screenLoading,
    setScreenLoading,
  ] = useState(true);

  const [
    resetEmail,
    setResetEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [errors, setErrors] =
    useState<ErrorsType>({});

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    let isMounted = true;

    const prepareResetScreen =
      async () => {
        try {
          /*
           * أولًا نحاول الحصول على
           * الإيميل من navigation params.
           */
          if (emailParam) {
            const cleanEmail =
              emailParam
                .trim()
                .toLowerCase();

            if (isMounted) {
              setResetEmail(
                cleanEmail
              );
            }

            await AsyncStorage.setItem(
              "passwordResetEmail",
              cleanEmail
            );
          } else {
            /*
             * لو الإيميل ضاع من params،
             * نسترجعه من AsyncStorage.
             */
            const savedEmail =
              await AsyncStorage.getItem(
                "passwordResetEmail"
              );

            if (
              isMounted &&
              savedEmail
            ) {
              setResetEmail(
                savedEmail
                  .trim()
                  .toLowerCase()
              );
            }
          }

          if (
            roleParam ===
              "doctor" ||
            roleParam ===
              "parent"
          ) {
            if (isMounted) {
              setRole(
                roleParam
              );
            }

            await AsyncStorage.setItem(
              "role",
              roleParam
            );
          } else {
            const savedRole =
              await AsyncStorage.getItem(
                "role"
              );

            if (
              isMounted &&
              (savedRole ===
                "doctor" ||
                savedRole ===
                  "parent")
            ) {
              setRole(
                savedRole
              );
            }
          }
        } catch (error) {
          console.log(
            "Error preparing reset password screen:",
            error
          );
        } finally {
          if (isMounted) {
            setScreenLoading(
              false
            );
          }
        }
      };

    prepareResetScreen();

    return () => {
      isMounted = false;
    };
  }, [
    emailParam,
    roleParam,
  ]);

  const clearError = (
    field: keyof ErrorsType
  ) => {
    setErrors(
      (
        previousErrors
      ) => ({
        ...previousErrors,

        [field]:
          undefined,

        general:
          undefined,
      })
    );
  };

  const handlePasswordChange =
    (text: string) => {
      setPassword(text);

      clearError(
        "password"
      );

      if (confirmPassword) {
        clearError(
          "confirmPassword"
        );
      }
    };

  const handleConfirmPasswordChange =
    (text: string) => {
      setConfirmPassword(
        text
      );

      clearError(
        "confirmPassword"
      );
    };

  const validateForm = () => {
    const newErrors: ErrorsType =
      {};

    if (!password) {
      newErrors.password =
        "Password is required";
    } else if (
      password.length < 8
    ) {
      newErrors.password =
        "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword =
        "Confirm password is required";
    } else if (
      password !==
      confirmPassword
    ) {
      newErrors.confirmPassword =
        "Passwords do not match";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors)
        .length === 0
    );
  };

  const handleSubmit =
    async () => {
      if (loading) {
        return;
      }

      const isValid =
        validateForm();

      if (!isValid) {
        return;
      }

      if (!resetEmail) {
        setErrors({
          general:
            "Email is missing. Please restart the password recovery process.",
        });

        return;
      }

      setLoading(true);
      setErrors({});

      try {
        await API.post(
          "/auth/reset-password",
          {
            email:
              resetEmail,

            newPassword:
              password,
          }
        );

        /*
         * حذف الإيميل المؤقت بعد
         * نجاح تغيير كلمة السر.
         */
        await AsyncStorage.removeItem(
          "passwordResetEmail"
        );

        if (role) {
          await AsyncStorage.setItem(
            "role",
            role
          );
        }

        router.replace(
          {
            pathname:
              "/auth/login",

            params: {
              passwordReset:
                "true",
            },
          } as any
        );
      } catch (error) {
        if (
          axios.isAxiosError(
            error
          )
        ) {
          console.log(
            "FULL RESET PASSWORD ERROR:",
            {
              message:
                error.message,

              status:
                error.response
                  ?.status,

              data:
                error.response
                  ?.data,

              url:
                error.config
                  ?.url,

              baseURL:
                error.config
                  ?.baseURL,
            }
          );

          const message =
            error.response?.data
              ?.msg ||
            error.response?.data
              ?.message ||
            error.response?.data
              ?.error ||
            error.message ||
            "Failed to reset password";

          setErrors({
            general: message,
          });
        } else {
          console.log(
            "Unexpected reset password error:",
            error
          );

          setErrors({
            general:
              "Something went wrong. Please try again.",
          });
        }
      } finally {
        setLoading(false);
      }
    };

  const renderPasswordInput = ({
    placeholder,
    value,
    onChangeText,
    error,
    isPasswordVisible,
    onToggleVisibility,
    onSubmitEditing,
    returnKeyType = "next",
  }: RenderPasswordInputProps) => {
    return (
      <View
        style={
          styles.inputBlock
        }
      >
        <View
          style={[
            styles.inputContainer,

            error
              ? styles.inputError
              : null,
          ]}
        >
          <TextInput
            placeholder={
              placeholder
            }
            placeholderTextColor="#A7A7A7"
            value={value}
            onChangeText={
              onChangeText
            }
            secureTextEntry={
              !isPasswordVisible
            }
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            returnKeyType={
              returnKeyType
            }
            onSubmitEditing={
              onSubmitEditing
            }
            style={styles.input}
          />

          <TouchableOpacity
            onPress={
              onToggleVisibility
            }
            activeOpacity={0.7}
            style={
              styles.eyeButton
            }
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={
              isPasswordVisible
                ? "Hide password"
                : "Show password"
            }
          >
            <Ionicons
              name={
                isPasswordVisible
                  ? "eye-off-outline"
                  : "eye-outline"
              }
              size={18}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>

        {error ? (
          <Text
            style={
              styles.errorText
            }
          >
            {error}
          </Text>
        ) : null}
      </View>
    );
  };

  if (screenLoading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <LinearGradient
          colors={[
            "#EEF7FF",
            "#FFF6F6",
            "#FFFFFF",
          ]}
          locations={[
            0,
            0.35,
            0.65,
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 0.18,
          }}
          style={
            styles.background
          }
        >
          <View
            style={
              styles.loadingContainer
            }
          >
            <ActivityIndicator
              size="large"
              color="#8DC0F0"
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Preparing password
              reset...
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const isDoctor =
    role === "doctor";

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <LinearGradient
        colors={[
          "#EEF7FF",
          "#FFF6F6",
          "#FFFFFF",
        ]}
        locations={[
          0,
          0.35,
          0.65,
        ]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 0.18,
        }}
        style={styles.background}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={
            Platform.OS ===
            "ios"
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
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              activeOpacity={0.7}
              style={
                styles.backButton
              }
              onPress={() =>
                router.back()
              }
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#111111"
              />
            </TouchableOpacity>

            <View
              style={
                styles.contentWrapper
              }
            >
              <View
                style={
                  styles.topSection
                }
              >
                <Image
                  style={styles.logo}
                  contentFit="contain"
                />

                {role ? (
                  <View
                    style={
                      styles.roleBadge
                    }
                  >
                    <Ionicons
                      name={
                        isDoctor
                          ? "medkit-outline"
                          : "people-outline"
                      }
                      size={15}
                      color={
                        isDoctor
                          ? "#729FD0"
                          : "#E98E92"
                      }
                    />

                    <Text
                      style={
                        styles.roleBadgeText
                      }
                    >
                      {isDoctor
                        ? "Doctor Account"
                        : "Parent Account"}
                    </Text>
                  </View>
                ) : null}

                <Text
                  style={styles.title}
                >
                  Reset your password
                </Text>

                <Text
                  style={
                    styles.subtitle
                  }
                >
                  Create a new secure
                  password for your
                  account. Your new
                  password must contain
                  at least 8 characters.
                </Text>
              </View>

              <View
                style={
                  styles.formSection
                }
              >
                {renderPasswordInput({
                  placeholder:
                    "New Password",

                  value:
                    password,

                  onChangeText:
                    handlePasswordChange,

                  error:
                    errors.password,

                  isPasswordVisible:
                    showPassword,

                  onToggleVisibility:
                    () =>
                      setShowPassword(
                        (
                          previousValue
                        ) =>
                          !previousValue
                      ),

                  returnKeyType:
                    "next",
                })}

                {renderPasswordInput({
                  placeholder:
                    "Confirm New Password",

                  value:
                    confirmPassword,

                  onChangeText:
                    handleConfirmPasswordChange,

                  error:
                    errors.confirmPassword,

                  isPasswordVisible:
                    showConfirmPassword,

                  onToggleVisibility:
                    () =>
                      setShowConfirmPassword(
                        (
                          previousValue
                        ) =>
                          !previousValue
                      ),

                  returnKeyType:
                    "done",

                  onSubmitEditing:
                    handleSubmit,
                })}

                <View
                  style={
                    styles.passwordHint
                  }
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color="#7AAEE0"
                  />

                  <Text
                    style={
                      styles.passwordHintText
                    }
                  >
                    Use at least 8
                    characters and avoid
                    using an old
                    password.
                  </Text>
                </View>

                {errors.general ? (
                  <View
                    style={
                      styles.generalErrorBox
                    }
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={19}
                      color="#DC2626"
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
              </View>
            </View>

            <View
              style={
                styles.bottomSection
              }
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={
                  handleSubmit
                }
                style={[
                  styles.buttonWrapper,

                  loading &&
                    styles.disabledButtonWrapper,
                ]}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Reset password"
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
                  style={
                    styles.button
                  }
                >
                  {loading ? (
                    <ActivityIndicator
                      color="#111111"
                    />
                  ) : (
                    <>
                      <Text
                        style={
                          styles.buttonText
                        }
                      >
                        Reset Password
                      </Text>

                      <Ionicons
                        name="checkmark"
                        size={19}
                        color="#111111"
                      />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
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

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
      gap: 14,
    },

    loadingText: {
      fontSize: 14,
      color: "#8D8D8D",
    },

    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 28,
      paddingTop: 42,
      paddingBottom: 28,
      justifyContent:
        "space-between",
    },

    backButton: {
      width: 36,
      height: 36,
      justifyContent:
        "center",
      alignItems:
        "flex-start",
    },

    contentWrapper: {
      flex: 1,
      justifyContent:
        "flex-start",
    },

    topSection: {
      alignItems: "center",
      marginTop: 36,
    },

    logo: {
      width: 74,
      height: 74,
      marginBottom: 14,
    },

    roleBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor:
        "rgba(255,255,255,0.78)",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
      marginBottom: 14,
    },

    roleBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#555555",
    },

    title: {
      fontSize: 22,
      fontWeight: "700",
      color: "#1F1F1F",
      textAlign: "center",
      marginBottom: 10,
    },

    subtitle: {
      width: "90%",
      fontSize: 13,
      lineHeight: 20,
      color: "#8D8D8D",
      textAlign: "center",
    },

    formSection: {
      marginTop: 30,
    },

    inputBlock: {
      marginBottom: 14,
    },

    inputContainer: {
      minHeight: 54,
      backgroundColor:
        "#F4F4F6",
      borderRadius: 11,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
    },

    input: {
      flex: 1,
      fontSize: 14,
      color: "#1F1F1F",
    },

    eyeButton: {
      paddingLeft: 10,
      paddingVertical: 4,
    },

    inputError: {
      borderWidth: 1,
      borderColor:
        "#EF4444",
    },

    errorText: {
      marginTop: 6,
      marginLeft: 4,
      color: "#EF4444",
      fontSize: 11,
      lineHeight: 15,
    },

    passwordHint: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: 8,
      backgroundColor:
        "#EEF6FF",
      borderRadius: 11,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },

    passwordHintText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 17,
      color: "#666666",
    },

    generalErrorBox: {
      marginTop: 14,
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: 8,
      backgroundColor:
        "#FEF2F2",
      borderRadius: 11,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },

    generalErrorText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 17,
      color: "#DC2626",
    },

    bottomSection: {
      paddingBottom: 6,
    },

    buttonWrapper: {
      width: "100%",
    },

    disabledButtonWrapper: {
      opacity: 0.7,
    },

    button: {
      height: 56,
      borderRadius: 999,
      flexDirection: "row",
      justifyContent:
        "center",
      alignItems: "center",
      gap: 8,
    },

    buttonText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#111111",
    },
  });