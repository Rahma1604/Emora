import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
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

type ApiErrorResponse = {
  msg?: string;
  message?: string;
  error?: string;
};

const OTP_LENGTH = 4;
const RESEND_SECONDS = 56;

function getParamValue(
  value?: string | string[]
): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

export default function OtpScreen() {
  const params =
    useLocalSearchParams<{
      email?:
        | string
        | string[];

      mode?:
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

  const modeParam =
    getParamValue(
      params.mode
    );

  const roleParam =
    getParamValue(
      params.role
    );

  const isForgotPassword =
    modeParam ===
    "forgot-password";

  const [
    currentRole,
    setCurrentRole,
  ] = useState<RoleType>(null);

  const [
    resolvedEmail,
    setResolvedEmail,
  ] = useState("");

  const [
    screenLoading,
    setScreenLoading,
  ] = useState(true);

  const [otp, setOtp] =
    useState<string[]>(
      Array(OTP_LENGTH).fill("")
    );

  const [error, setError] =
    useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    secondsLeft,
    setSecondsLeft,
  ] = useState(
    RESEND_SECONDS
  );

  const inputRefs = useRef<
    Array<TextInput | null>
  >([]);

  /*
   * تجهيز البيانات المطلوبة للصفحة:
   *
   * 1- الحصول على الإيميل من params.
   * 2- أو استرجاعه من AsyncStorage.
   * 3- تحديد نوع الحساب.
   */
  useEffect(() => {
    let isMounted = true;

    const prepareOtpScreen =
      async () => {
        try {
          let finalEmail =
            emailParam
              .trim()
              .toLowerCase();

          /*
           * لو الإيميل غير موجود في params،
           * نحاول استرجاعه من التخزين.
           */
          if (!finalEmail) {
            const storageKey =
              isForgotPassword
                ? "passwordResetEmail"
                : "pendingVerificationEmail";

            const savedEmail =
              await AsyncStorage.getItem(
                storageKey
              );

            finalEmail =
              savedEmail
                ?.trim()
                .toLowerCase() ||
              "";
          }

          if (
            isMounted
          ) {
            setResolvedEmail(
              finalEmail
            );
          }

          /*
           * الاحتفاظ بالإيميل احتياطيًا
           * لاستخدامه في الصفحات التالية.
           */
          if (finalEmail) {
            const storageKey =
              isForgotPassword
                ? "passwordResetEmail"
                : "pendingVerificationEmail";

            await AsyncStorage.setItem(
              storageKey,
              finalEmail
            );
          }

          if (
            roleParam ===
              "doctor" ||
            roleParam ===
              "parent"
          ) {
            if (isMounted) {
              setCurrentRole(
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
              setCurrentRole(
                savedRole
              );
            }
          }
        } catch (
          prepareError
        ) {
          console.log(
            "PREPARE OTP SCREEN ERROR:",
            prepareError
          );

          if (isMounted) {
            setError(
              "Unable to prepare the verification screen. Please return and try again."
            );
          }
        } finally {
          if (isMounted) {
            setScreenLoading(
              false
            );
          }
        }
      };

    prepareOtpScreen();

    return () => {
      isMounted = false;
    };
  }, [
    emailParam,
    roleParam,
    isForgotPassword,
  ]);

  /*
   * Timer إعادة إرسال الكود.
   */
  useEffect(() => {
    if (
      secondsLeft <= 0
    ) {
      return;
    }

    const timeout =
      setTimeout(() => {
        setSecondsLeft(
          (
            previousSeconds
          ) =>
            Math.max(
              previousSeconds -
                1,
              0
            )
        );
      }, 1000);

    return () =>
      clearTimeout(timeout);
  }, [secondsLeft]);

  const formatTime = (
    seconds: number
  ) => {
    const safeSeconds =
      Math.max(seconds, 0);

    const minutes =
      Math.floor(
        safeSeconds / 60
      );

    const remainingSeconds =
      safeSeconds % 60;

    return `${minutes
      .toString()
      .padStart(
        2,
        "0"
      )}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const getErrorMessage = (
    requestError: unknown,
    fallbackMessage: string
  ): string => {
    if (
      axios.isAxiosError(
        requestError
      )
    ) {
      const responseData =
        requestError.response
          ?.data as
          | ApiErrorResponse
          | undefined;

      return (
        responseData?.msg ||
        responseData?.message ||
        responseData?.error ||
        requestError.message ||
        fallbackMessage
      );
    }

    if (
      requestError instanceof
      Error
    ) {
      return requestError.message;
    }

    return fallbackMessage;
  };

  /*
   * يدعم إدخال رقم واحد
   * أو لصق الكود كاملًا.
   */
  const handleChange = (
    text: string,
    index: number
  ) => {
    const digits =
      text.replace(
        /[^0-9]/g,
        ""
      );

    if (!digits) {
      const updatedOtp = [
        ...otp,
      ];

      updatedOtp[index] = "";

      setOtp(updatedOtp);

      if (error) {
        setError("");
      }

      return;
    }

    /*
     * في حالة لصق أكثر من رقم.
     */
    if (
      digits.length > 1
    ) {
      const updatedOtp = [
        ...otp,
      ];

      const pastedDigits =
        digits
          .slice(
            0,
            OTP_LENGTH -
              index
          )
          .split("");

      pastedDigits.forEach(
        (
          digit,
          digitIndex
        ) => {
          updatedOtp[
            index +
              digitIndex
          ] = digit;
        }
      );

      setOtp(updatedOtp);
      setError("");

      const finalIndex =
        Math.min(
          index +
            pastedDigits.length -
            1,
          OTP_LENGTH - 1
        );

      inputRefs.current[
        finalIndex
      ]?.focus();

      return;
    }

    /*
     * في حالة إدخال رقم واحد.
     */
    const updatedOtp = [
      ...otp,
    ];

    updatedOtp[index] =
      digits.slice(-1);

    setOtp(updatedOtp);

    if (error) {
      setError("");
    }

    if (
      index <
      OTP_LENGTH - 1
    ) {
      inputRefs.current[
        index + 1
      ]?.focus();
    }
  };

  const handleKeyPress = (
    key: string,
    index: number
  ) => {
    if (
      key === "Backspace" &&
      otp[index] === "" &&
      index > 0
    ) {
      const previousIndex =
        index - 1;

      const updatedOtp = [
        ...otp,
      ];

      updatedOtp[
        previousIndex
      ] = "";

      setOtp(updatedOtp);

      inputRefs.current[
        previousIndex
      ]?.focus();
    }
  };

  const clearOtp = () => {
    setOtp(
      Array(
        OTP_LENGTH
      ).fill("")
    );

    setTimeout(() => {
      inputRefs.current[
        0
      ]?.focus();
    }, 100);
  };

  /*
   * التحقق من كود OTP.
   */
  const handleVerify =
    async () => {
      if (
        isLoading ||
        screenLoading
      ) {
        return;
      }

      const code =
        otp.join("");

      if (
        code.length !==
        OTP_LENGTH
      ) {
        setError(
          `Please enter the complete ${OTP_LENGTH}-digit code.`
        );

        return;
      }

      if (!resolvedEmail) {
        setError(
          "Email is missing. Please return and restart the verification process."
        );

        return;
      }

      setError("");
      setIsLoading(true);

      try {
        /*
         * نسيان كلمة السر:
         *
         * POST /auth/verify-otp
         *
         * body:
         * email
         * otp
         */
        if (
          isForgotPassword
        ) {
          const response =
            await API.post(
              "/auth/verify-otp",
              {
                email:
                  resolvedEmail,

                otp: code,
              }
            );

          console.log(
            "FORGOT PASSWORD OTP VERIFIED:",
            response.data
          );

          await AsyncStorage.setItem(
            "passwordResetEmail",
            resolvedEmail
          );

          router.replace(
            {
              pathname:
                "/auth/reset-password",

              params: {
                email:
                  resolvedEmail,

                ...(currentRole
                  ? {
                      role:
                        currentRole,
                    }
                  : {}),
              },
            } as any
          );

          return;
        }

        /*
         * تفعيل حساب Parent:
         *
         * POST /auth/verify
         *
         * body:
         * email
         * code
         */
        const response =
          await API.post(
            "/auth/verify",
            {
              email:
                resolvedEmail,

              code,
            }
          );

        console.log(
          "ACCOUNT OTP VERIFIED:",
          response.data
        );

        if (currentRole) {
          await AsyncStorage.setItem(
            "role",
            currentRole
          );
        }

        await AsyncStorage.removeItem(
          "pendingVerificationEmail"
        );

        router.replace(
          {
            pathname:
              "/auth/login",

            params: {
              verified:
                "true",

              email:
                resolvedEmail,
            },
          } as any
        );
      } catch (
        verifyError
      ) {
        console.log(
          "VERIFY OTP ERROR:",
          verifyError
        );

        setError(
          getErrorMessage(
            verifyError,
            "Verification failed. Please try again."
          )
        );
      } finally {
        setIsLoading(false);
      }
    };

  /*
   * إعادة إرسال OTP.
   */
  const handleResend =
    async () => {
      if (
        secondsLeft > 0 ||
        isLoading ||
        screenLoading
      ) {
        return;
      }

      if (!resolvedEmail) {
        setError(
          "Email is missing. Please return and restart the verification process."
        );

        return;
      }

      setIsLoading(true);
      setError("");

      try {
        /*
         * إعادة إرسال OTP الخاص
         * بنسيان كلمة السر.
         */
        if (
          isForgotPassword
        ) {
          await API.post(
            "/auth/forgot-password",
            {
              email:
                resolvedEmail,
            }
          );

          await AsyncStorage.setItem(
            "passwordResetEmail",
            resolvedEmail
          );
        } else {
          /*
           * إعادة إرسال كود
           * تفعيل الحساب.
           */
          await API.post(
            "/auth/resend-code",
            {
              email:
                resolvedEmail,
            }
          );

          await AsyncStorage.setItem(
            "pendingVerificationEmail",
            resolvedEmail
          );
        }

        clearOtp();

        setSecondsLeft(
          RESEND_SECONDS
        );
      } catch (
        resendError
      ) {
        console.log(
          "RESEND OTP ERROR:",
          resendError
        );

        setError(
          getErrorMessage(
            resendError,
            "Failed to resend the verification code."
          )
        );
      } finally {
        setIsLoading(false);
      }
    };

  const hasError =
    Boolean(error);

  const isDoctor =
    currentRole ===
    "doctor";

  const canResend =
    secondsLeft === 0 &&
    !isLoading &&
    !screenLoading;

  const screenTitle =
    isForgotPassword
      ? "Verify reset code"
      : isDoctor
        ? "Verify your doctor email"
        : "Verify your email";

  const screenSubtitle =
    isForgotPassword
      ? "Enter the verification code sent to your email to reset your password."
      : isDoctor
        ? "Enter the verification code sent to your email to activate your professional account."
        : "Enter the verification code sent to your email to activate your account.";

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
            0.32,
            0.65,
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 0.16,
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
              Preparing verification...
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

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
          0.32,
          0.65,
        ]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 0.16,
        }}
        style={
          styles.background
        }
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
          <View
            style={
              styles.container
            }
          >
            <TouchableOpacity
              style={
                styles.backButton
              }
              onPress={() =>
                router.back()
              }
              activeOpacity={0.7}
              disabled={
                isLoading
              }
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons
                name="chevron-back"
                size={23}
                color="#1F1F1F"
              />
            </TouchableOpacity>

            <View
              style={
                styles.content
              }
            >
              <Image
                style={styles.logo}
                contentFit="contain"
              />

              {!isForgotPassword &&
              currentRole ? (
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
                    size={14}
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
                style={
                  styles.title
                }
              >
                {screenTitle}
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                {screenSubtitle}
              </Text>

              {resolvedEmail ? (
                <Text
                  style={
                    styles.emailText
                  }
                >
                  {resolvedEmail}
                </Text>
              ) : (
                <Text
                  style={
                    styles.missingEmailText
                  }
                >
                  Email address was not found.
                </Text>
              )}

              <View
                style={
                  styles.otpRow
                }
              >
                {otp.map(
                  (
                    digit,
                    index
                  ) => (
                    <LinearGradient
                      key={index}
                      colors={
                        hasError
                          ? [
                              "#FF8A8A",
                              "#FFB3B3",
                            ]
                          : [
                              "#8DC0F0",
                              "#F9A8A7",
                            ]
                      }
                      start={{
                        x: 0,
                        y: 0,
                      }}
                      end={{
                        x: 1,
                        y: 1,
                      }}
                      style={
                        styles.otpGradientBorder
                      }
                    >
                      <View
                        style={
                          styles.otpInnerBox
                        }
                      >
                        <TextInput
                          ref={(
                            reference
                          ) => {
                            inputRefs.current[
                              index
                            ] =
                              reference;
                          }}
                          value={
                            digit
                          }
                          onChangeText={(
                            text
                          ) =>
                            handleChange(
                              text,
                              index
                            )
                          }
                          onKeyPress={({
                            nativeEvent,
                          }) =>
                            handleKeyPress(
                              nativeEvent.key,
                              index
                            )
                          }
                          keyboardType="number-pad"
                          textContentType="oneTimeCode"
                          autoComplete={
                            Platform.OS ===
                            "android"
                              ? "sms-otp"
                              : "one-time-code"
                          }
                          maxLength={
                            OTP_LENGTH
                          }
                          textAlign="center"
                          editable={
                            !isLoading &&
                            Boolean(
                              resolvedEmail
                            )
                          }
                          autoFocus={
                            index ===
                              0 &&
                            Boolean(
                              resolvedEmail
                            )
                          }
                          style={[
                            styles.otpInput,

                            hasError &&
                              styles.otpInputError,
                          ]}
                          selectionColor={
                            hasError
                              ? "#EF4444"
                              : "#8DC0F0"
                          }
                        />
                      </View>
                    </LinearGradient>
                  )
                )}
              </View>

              {hasError ? (
                <View
                  style={
                    styles.errorContainer
                  }
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color="#EF4444"
                  />

                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {error}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={
                  handleVerify
                }
                style={[
                  styles.buttonWrapper,

                  (isLoading ||
                    !resolvedEmail) &&
                    styles.disabledButtonWrapper,
                ]}
                disabled={
                  isLoading ||
                  !resolvedEmail
                }
                accessibilityRole="button"
                accessibilityLabel="Verify code"
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
                  {isLoading ? (
                    <ActivityIndicator
                      size="small"
                      color="#111111"
                    />
                  ) : (
                    <Text
                      style={
                        styles.buttonText
                      }
                    >
                      Verify
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text
                style={
                  styles.resendLabel
                }
              >
                Didn&apos;t receive
                the code?
              </Text>

              <View
                style={
                  styles.resendRow
                }
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={
                    handleResend
                  }
                  disabled={
                    !canResend ||
                    !resolvedEmail
                  }
                >
                  <Text
                    style={[
                      styles.resendText,

                      canResend &&
                      resolvedEmail
                        ? styles.resendActive
                        : styles.resendDisabled,
                    ]}
                  >
                    Resend
                  </Text>
                </TouchableOpacity>

                {secondsLeft >
                0 ? (
                  <Text
                    style={
                      styles.timerText
                    }
                  >
                    {" "}
                    -{" "}
                    {formatTime(
                      secondsLeft
                    )}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
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
    },

    loadingText: {
      marginTop: 13,
      fontSize: 12,
      color: "#8D8D8D",
    },

    container: {
      flex: 1,
      paddingHorizontal: 28,
      paddingTop: 14,
    },

    backButton: {
      width: 36,
      height: 36,
      justifyContent:
        "center",
      alignItems:
        "flex-start",
    },

    content: {
      flex: 1,
      alignItems: "center",
      paddingTop: 38,
    },

    logo: {
      width: 72,
      height: 72,
      marginBottom: 14,
    },

    roleBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor:
        "rgba(255,255,255,0.8)",
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 999,
      marginBottom: 14,
    },

    roleBadgeText: {
      fontSize: 11,
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
      width: "86%",
      fontSize: 12,
      lineHeight: 18,
      color: "#A1A1AA",
      textAlign: "center",
    },

    emailText: {
      marginTop: 7,
      marginBottom: 24,
      fontSize: 12,
      fontWeight: "600",
      color: "#6B7280",
      textAlign: "center",
    },

    missingEmailText: {
      marginTop: 7,
      marginBottom: 24,
      fontSize: 11,
      fontWeight: "600",
      color: "#EF4444",
      textAlign: "center",
    },

    otpRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 10,
    },

    otpGradientBorder: {
      borderRadius: 10,
      padding: 1,
    },

    otpInnerBox: {
      width: 44,
      height: 44,
      borderRadius: 9,
      backgroundColor:
        "#F7F7F8",
      justifyContent:
        "center",
      alignItems: "center",
    },

    otpInput: {
      width: "100%",
      height: "100%",
      fontSize: 17,
      fontWeight: "600",
      color: "#444444",
      textAlign: "center",
      padding: 0,
    },

    otpInputError: {
      color: "#EF4444",
    },

    errorContainer: {
      maxWidth: "100%",
      flexDirection: "row",
      justifyContent:
        "center",
      alignItems: "center",
      gap: 5,
      marginBottom: 12,
    },

    errorText: {
      flexShrink: 1,
      fontSize: 11,
      lineHeight: 16,
      color: "#EF4444",
      textAlign: "center",
    },

    buttonWrapper: {
      width: "100%",
      marginTop: 4,
    },

    disabledButtonWrapper: {
      opacity: 0.7,
    },

    button: {
      height: 46,
      borderRadius: 999,
      justifyContent:
        "center",
      alignItems: "center",
    },

    buttonText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#111111",
    },

    resendLabel: {
      marginTop: 14,
      fontSize: 11,
      color: "#A1A1AA",
      textAlign: "center",
    },

    resendRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 5,
    },

    resendText: {
      fontSize: 11,
      fontWeight: "600",
    },

    resendActive: {
      color: "#8DC0F0",
      textDecorationLine:
        "underline",
    },

    resendDisabled: {
      color: "#A1A1AA",
    },

    timerText: {
      fontSize: 11,
      color: "#A1A1AA",
    },
  });