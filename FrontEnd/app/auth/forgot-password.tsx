import React, {
  useEffect,
  useMemo,
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
  KeyboardTypeOptions,
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
} from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import API from "../api";

type RoleType =
  | "doctor"
  | "parent"
  | null;

type ErrorsType = {
  email?: string;
  general?: string;
};

type RenderInputProps = {
  placeholder: string;
  value: string;
  onChangeText: (
    text: string
  ) => void;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
};

export default function ForgotPasswordScreen() {
  const [role, setRole] =
    useState<RoleType>(null);

  const [
    roleLoading,
    setRoleLoading,
  ] = useState(true);

  const [email, setEmail] =
    useState("");

  const [errors, setErrors] =
    useState<ErrorsType>({});

  const [loading, setLoading] =
    useState(false);

  const emailRegex = useMemo(
    () =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    []
  );

  useEffect(() => {
    let isMounted = true;

    const loadSelectedRole =
      async () => {
        try {
          const savedRole =
            await AsyncStorage.getItem(
              "role"
            );

          if (!isMounted) {
            return;
          }

          if (
            savedRole === "doctor" ||
            savedRole === "parent"
          ) {
            setRole(savedRole);
          } else {
            router.replace(
              "/role-selection"
            );
          }
        } catch (error) {
          console.log(
            "Error loading role:",
            error
          );

          if (isMounted) {
            router.replace(
              "/role-selection"
            );
          }
        } finally {
          if (isMounted) {
            setRoleLoading(false);
          }
        }
      };

    loadSelectedRole();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleEmailChange = (
    text: string
  ) => {
    setEmail(text);

    if (
      errors.email ||
      errors.general
    ) {
      setErrors({});
    }
  };

  const validateForm = () => {
    const newErrors: ErrorsType =
      {};

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    if (!cleanEmail) {
      newErrors.email =
        "Email address is required";
    } else if (
      !emailRegex.test(
        cleanEmail
      )
    ) {
      newErrors.email =
        "Please enter a valid email address";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors)
        .length === 0
    );
  };

  const handleContinue =
    async () => {
      if (
        !role ||
        loading
      ) {
        return;
      }

      const isValid =
        validateForm();

      if (!isValid) {
        return;
      }

      setLoading(true);
      setErrors({});

      try {
        const cleanEmail =
          email
            .trim()
            .toLowerCase();

        await API.post(
          "/auth/forgot-password",
          {
            email: cleanEmail,
          }
        );

        /*
         * حفظ الإيميل مؤقتًا حتى تستطيع
         * صفحة OTP وReset Password استرجاعه.
         */
        await AsyncStorage.setItem(
          "passwordResetEmail",
          cleanEmail
        );

        await AsyncStorage.setItem(
          "role",
          role
        );

        router.push(
          {
            pathname:
              "/auth/otp",

            params: {
              email:
                cleanEmail,

              role,

              mode:
                "forgot-password",
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
            "FULL FORGOT PASSWORD ERROR:",
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
            "Failed to send verification code";

          setErrors({
            general: message,
          });
        } else {
          console.log(
            "Unexpected forgot password error:",
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

  const renderInput = ({
    placeholder,
    value,
    onChangeText,
    error,
    keyboardType = "default",
  }: RenderInputProps) => {
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
            keyboardType={
              keyboardType
            }
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={
              handleContinue
            }
            style={styles.input}
          />
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

  if (
    roleLoading ||
    !role
  ) {
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
              styles.roleLoadingContainer
            }
          >
            <ActivityIndicator
              size="large"
              color="#8DC0F0"
            />

            <Text
              style={
                styles.roleLoadingText
              }
            >
              Preparing password
              recovery...
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

                <Text
                  style={styles.title}
                >
                  Forgot your password?
                </Text>

                <Text
                  style={
                    styles.subtitle
                  }
                >
                  Enter the email
                  address associated
                  with your{" "}
                  {isDoctor
                    ? "doctor"
                    : "parent"}{" "}
                  account and
                  we&apos;ll send you a
                  verification code to
                  reset your password.
                </Text>
              </View>

              <View
                style={
                  styles.formSection
                }
              >
                {renderInput({
                  placeholder:
                    "Email address",

                  value: email,

                  onChangeText:
                    handleEmailChange,

                  error:
                    errors.email,

                  keyboardType:
                    "email-address",
                })}

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
                  handleContinue
                }
                style={[
                  styles.buttonWrapper,

                  loading &&
                    styles.disabledButtonWrapper,
                ]}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Continue password recovery"
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
                        Continue
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={18}
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

    roleLoadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
      gap: 14,
    },

    roleLoadingText: {
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

    generalErrorBox: {
      marginTop: 4,
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