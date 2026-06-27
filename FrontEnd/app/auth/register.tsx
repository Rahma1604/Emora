
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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  KeyboardTypeOptions,
  ActivityIndicator,
  StatusBar,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  LinearGradient,
} from "expo-linear-gradient";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
  type Href,
} from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import API from "../api";

type RoleType =
  | "doctor"
  | "parent"
  | null;

type AutoCapitalizeType =
  | "none"
  | "sentences"
  | "words"
  | "characters";

type ErrorsType = {
  name?: string;
  email?: string;
  specialization?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};

type RenderInputProps = {
  placeholder: string;
  value: string;

  onChangeText: (
    text: string
  ) => void;

  error?: string;

  secureTextEntry?: boolean;

  showEye?: boolean;

  isPasswordVisible?: boolean;

  onToggleVisibility?: () => void;

  keyboardType?: KeyboardTypeOptions;

  autoCapitalize?: AutoCapitalizeType;
};

type DoctorRegistrationResponse = {
  status: string;

  message: string;

  verificationToken: string;

  doctor: {
    id: string;

    fullName: string;

    email: string;

    role: "doctor";

    specialization?: string;

    verificationStatus:
      | "not_started"
      | "draft"
      | "pending"
      | "approved"
      | "rejected";

    verificationStep:
      | "intro"
      | "professional-info"
      | "documents"
      | "review"
      | "submitted";
  };
};

export default function RegisterScreen() {
  const [
    role,
    setRole,
  ] = useState<RoleType>(null);

  const [
    roleLoading,
    setRoleLoading,
  ] = useState(true);

  const [
    fullName,
    setFullName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    specialization,
    setSpecialization,
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

  const [
    errors,
    setErrors,
  ] = useState<ErrorsType>({});

  const [
    loading,
    setLoading,
  ] = useState(false);

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
              "/role-selection" as Href
            );
          }
        } catch (error) {
          console.log(
            "Error loading selected role:",
            error
          );

          if (isMounted) {
            router.replace(
              "/role-selection" as Href
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

  const clearError = (
    field: keyof ErrorsType
  ) => {
    setErrors(
      (previousErrors) => ({
        ...previousErrors,

        [field]: undefined,

        general: undefined,
      })
    );
  };

  const handleFullNameChange = (
    text: string
  ) => {
    setFullName(text);

    clearError("name");
  };

  const handleEmailChange = (
    text: string
  ) => {
    setEmail(text);

    clearError("email");
  };

  const handleSpecializationChange = (
    text: string
  ) => {
    setSpecialization(text);

    clearError(
      "specialization"
    );
  };

  const handlePasswordChange = (
    text: string
  ) => {
    setPassword(text);

    clearError("password");

    if (confirmPassword) {
      clearError(
        "confirmPassword"
      );
    }
  };

  const handleConfirmPasswordChange = (
    text: string
  ) => {
    setConfirmPassword(text);

    clearError(
      "confirmPassword"
    );
  };

  const validateForm = () => {
    const newErrors: ErrorsType =
      {};

    const cleanName =
      fullName.trim();

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    const cleanSpecialization =
      specialization.trim();

    if (!cleanName) {
      newErrors.name =
        "Full name is required";
    } else if (
      cleanName.length < 3
    ) {
      newErrors.name =
        "Full name must be at least 3 characters";
    }

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

    if (role === "doctor") {
      if (
        !cleanSpecialization
      ) {
        newErrors.specialization =
          "Specialization is required";
      } else if (
        cleanSpecialization.length <
        3
      ) {
        newErrors.specialization =
          "Please enter a valid specialization";
      }
    }

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
      Object.keys(
        newErrors
      ).length === 0
    );
  };

  const clearOldSession =
    async () => {
      await AsyncStorage.multiRemove([
        "token",
        "user",
        "pendingRegistrationEmail",

        "verificationToken",
        "doctorRegistrationId",
        "verificationOwnerEmail",
        "verificationEmail",
        "verificationFullName",
        "verificationSpecialization",
        "verificationProfessionalType",
        "verificationNationalId",
        "verificationLicenseNumber",
        "verificationSyndicateNumber",
        "verificationUniversity",
        "verificationGraduationYear",
        "verificationExperienceYears",
        "verificationDocuments",
        "verificationStatus",
        "verificationCurrentStep",
        "verificationSubmittedAt",
        "verificationApprovedAt",
        "verificationRejectedAt",
        "verificationRejectionReason",

        "hasSeenVerificationApproval",
        "doctorAccessEnabled",
        "verificationPreviewAccess",

        "demoDoctorCredentials",
        "demoDoctorProfile",
      ]);
    };

  const registerParent =
    async () => {
      const cleanEmail =
        email
          .trim()
          .toLowerCase();

      await API.post(
        "/auth/register",
        {
          fullName:
            fullName.trim(),

          email:
            cleanEmail,

          password,

          confirmPassword,
        }
      );

      await clearOldSession();

      await AsyncStorage.multiSet([
        [
          "role",
          "parent",
        ],

        [
          "pendingRegistrationEmail",
          cleanEmail,
        ],
      ]);

      router.push({
        pathname:
          "/auth/otp",

        params: {
          email:
            cleanEmail,

          role:
            "parent",

          mode:
            "register",
        },
      });
    };

  const registerDoctor =
    async () => {
      const cleanName =
        fullName.trim();

      const cleanEmail =
        email
          .trim()
          .toLowerCase();

      const cleanSpecialization =
        specialization.trim();

      const response =
        await API.post<DoctorRegistrationResponse>(
          "/auth/register-doctor",
          {
            fullName:
              cleanName,

            email:
              cleanEmail,

            specialization:
              cleanSpecialization,

            password,

            confirmPassword,
          }
        );

      const {
        verificationToken,
        doctor,
      } = response.data;

      if (
        !verificationToken ||
        !doctor?.id
      ) {
        throw new Error(
          "Doctor verification session was not created"
        );
      }

      await clearOldSession();

      await AsyncStorage.multiSet([
        [
          "role",
          "doctor",
        ],

        [
          "verificationToken",
          verificationToken,
        ],

        [
          "doctorRegistrationId",
          doctor.id,
        ],

        [
          "verificationStatus",
          doctor.verificationStatus ||
            "not_started",
        ],

        [
          "verificationCurrentStep",
          doctor.verificationStep ||
            "intro",
        ],

        [
          "verificationOwnerEmail",
          doctor.email ||
            cleanEmail,
        ],

        [
          "verificationEmail",
          doctor.email ||
            cleanEmail,
        ],

        [
          "verificationFullName",
          doctor.fullName ||
            cleanName,
        ],

        [
          "verificationSpecialization",
          doctor.specialization ||
            cleanSpecialization,
        ],

        [
          "verificationProfessionalType",
          "Child Psychiatrist",
        ],
      ]);

      router.replace(
        "/doctor/doctor-verification/intro" as Href
      );
    };

  const handleCreateAccount =
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
        if (
          role === "doctor"
        ) {
          await registerDoctor();
        } else {
          await registerParent();
        }
      } catch (error) {
        if (
          axios.isAxiosError(
            error
          )
        ) {
          console.log(
            "FULL REGISTER ERROR:",
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
            "Registration failed";

          setErrors({
            general:
              String(message),
          });
        } else {
          console.log(
            "Unexpected register error:",
            error
          );

          setErrors({
            general:
              error instanceof Error
                ? error.message
                : "Something went wrong. Please try again.",
          });
        }
      } finally {
        setLoading(false);
      }
    };

  const handleChangeRole =
    async () => {
      if (loading) {
        return;
      }

      try {
        await AsyncStorage.removeItem(
          "role"
        );

        router.replace(
          "/role-selection" as Href
        );
      } catch (error) {
        console.log(
          "Error changing role:",
          error
        );
      }
    };

  const handleOpenLogin = () => {
    if (loading) {
      return;
    }

    router.push(
      "/auth/login" as Href
    );
  };

  const renderInput = ({
    placeholder,
    value,
    onChangeText,
    error,
    secureTextEntry = false,
    showEye = false,
    isPasswordVisible = false,
    onToggleVisibility,
    keyboardType = "default",
    autoCapitalize =
      "sentences",
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
            secureTextEntry={
              secureTextEntry
            }
            keyboardType={
              keyboardType
            }
            autoCapitalize={
              autoCapitalize
            }
            autoCorrect={false}
            editable={!loading}
            style={styles.input}
          />

          {showEye ? (
            <TouchableOpacity
              onPress={
                onToggleVisibility
              }
              activeOpacity={0.7}
              style={
                styles.eyeButton
              }
              disabled={loading}
            >
              <Ionicons
                name={
                  isPasswordVisible
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={19}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          ) : null}
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
        style={
          styles.safeArea
        }
        edges={[
          "top",
          "bottom",
        ]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />

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
              Preparing registration...
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
      style={
        styles.safeArea
      }
      edges={[
        "top",
        "bottom",
      ]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

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
        <KeyboardAvoidingView
          style={
            styles.flex
          }
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
                  style={
                    styles.title
                  }
                >
                  {isDoctor
                    ? "Create your doctor account"
                    : "Create your parent account"}
                </Text>

                <Text
                  style={
                    styles.subtitle
                  }
                >
                  {isDoctor
                    ? "Create your professional account, complete verification and wait for approval before accessing child cases."
                    : "Sign up to start tracking and understanding your child’s emotional progress."}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={
                    handleChangeRole
                  }
                  disabled={loading}
                  style={
                    styles.changeRoleButton
                  }
                >
                  <Text
                    style={
                      styles.changeRoleText
                    }
                  >
                    Change role
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={
                  styles.formSection
                }
              >
                {renderInput({
                  placeholder:
                    "Full name",

                  value:
                    fullName,

                  onChangeText:
                    handleFullNameChange,

                  error:
                    errors.name,

                  autoCapitalize:
                    "words",
                })}

                {renderInput({
                  placeholder:
                    "Email address",

                  value:
                    email,

                  onChangeText:
                    handleEmailChange,

                  error:
                    errors.email,

                  keyboardType:
                    "email-address",

                  autoCapitalize:
                    "none",
                })}

                {isDoctor
                  ? renderInput({
                      placeholder:
                        "Specialization, e.g. Child Psychology",

                      value:
                        specialization,

                      onChangeText:
                        handleSpecializationChange,

                      error:
                        errors.specialization,

                      autoCapitalize:
                        "words",
                    })
                  : null}

                {renderInput({
                  placeholder:
                    "Password",

                  value:
                    password,

                  onChangeText:
                    handlePasswordChange,

                  error:
                    errors.password,

                  secureTextEntry:
                    !showPassword,

                  showEye: true,

                  isPasswordVisible:
                    showPassword,

                  onToggleVisibility:
                    () =>
                      setShowPassword(
                        (
                          previous
                        ) =>
                          !previous
                      ),

                  autoCapitalize:
                    "none",
                })}

                {renderInput({
                  placeholder:
                    "Confirm Password",

                  value:
                    confirmPassword,

                  onChangeText:
                    handleConfirmPasswordChange,

                  error:
                    errors.confirmPassword,

                  secureTextEntry:
                    !showConfirmPassword,

                  showEye: true,

                  isPasswordVisible:
                    showConfirmPassword,

                  onToggleVisibility:
                    () =>
                      setShowConfirmPassword(
                        (
                          previous
                        ) =>
                          !previous
                      ),

                  autoCapitalize:
                    "none",
                })}

                <View
                  style={[
                    styles.infoBox,

                    isDoctor
                      ? styles.doctorInfoBox
                      : styles.parentInfoBox,
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={
                      isDoctor
                        ? "#729FD0"
                        : "#E98E92"
                    }
                  />

                  <Text
                    style={
                      styles.infoText
                    }
                  >
                    {isDoctor
                      ? "After registration, complete your professional verification. Once submitted, you’ll return to Login and see the approval result after signing in."
                      : "Your identity will remain hidden from specialists when they review your child’s entries."}
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
                      {
                        errors.general
                      }
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
                  handleCreateAccount
                }
                style={[
                  styles.buttonWrapper,

                  loading &&
                    styles.disabledButtonWrapper,
                ]}
                disabled={loading}
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
                        Create Account
                      </Text>

                      {isDoctor ? (
                        <Ionicons
                          name="arrow-forward"
                          size={18}
                          color="#111111"
                        />
                      ) : null}
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text
                style={
                  styles.footerText
                }
              >
                Already have an
                account?{" "}

                <Text
                  style={
                    styles.loginText
                  }
                  onPress={
                    handleOpenLogin
                  }
                >
                  Login
                </Text>
              </Text>
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
      alignItems:
        "center",
      gap: 12,
    },

    roleLoadingText: {
      fontSize: 14,
      color: "#8D8D8D",
    },

    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 28,
      paddingTop: 38,
      paddingBottom: 18,
      justifyContent:
        "space-between",
    },

    contentWrapper: {
      width: "100%",
    },

    topSection: {
      alignItems:
        "center",
      marginTop: 6,
    },

    roleBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor:
        "rgba(255,255,255,0.84)",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
      marginBottom: 12,
    },

    roleBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#555555",
    },

    title: {
      fontSize: 21,
      lineHeight: 28,
      fontWeight: "700",
      color: "#1F1F1F",
      textAlign: "center",
      marginBottom: 7,
    },

    subtitle: {
      width: "94%",
      fontSize: 13,
      lineHeight: 19,
      color: "#8D8D8D",
      textAlign: "center",
    },

    changeRoleButton: {
      marginTop: 7,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },

    changeRoleText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#7AAEE0",
      textDecorationLine:
        "underline",
    },

    formSection: {
      marginTop: 21,
    },

    inputBlock: {
      marginBottom: 11,
    },

    inputContainer: {
      minHeight: 54,
      backgroundColor:
        "#F4F4F6",
      borderRadius: 12,
      paddingHorizontal: 15,
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
      paddingVertical: 5,
    },

    inputError: {
      borderWidth: 1,
      borderColor: "#EF4444",
    },

    errorText: {
      marginTop: 5,
      marginLeft: 4,
      color: "#EF4444",
      fontSize: 10.5,
      lineHeight: 14,
    },

    infoBox: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      borderRadius: 12,
      paddingHorizontal: 13,
      paddingVertical: 10,
      gap: 9,
    },

    doctorInfoBox: {
      backgroundColor:
        "#EEF6FF",
    },

    parentInfoBox: {
      backgroundColor:
        "#FFF3F3",
    },

    infoText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 16,
      color: "#666666",
    },

    generalErrorBox: {
      marginTop: 10,
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: 8,
      backgroundColor:
        "#FEF2F2",
      borderRadius: 11,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },

    generalErrorText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 16,
      color: "#DC2626",
    },

    bottomSection: {
      width: "100%",
      marginTop: 17,
    },

    buttonWrapper: {
      width: "100%",
    },

    disabledButtonWrapper: {
      opacity: 0.7,
    },

    button: {
      height: 55,
      borderRadius: 999,
      flexDirection: "row",
      justifyContent:
        "center",
      alignItems: "center",
      gap: 8,
    },

    buttonText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#111111",
    },

    footerText: {
      marginTop: 14,
      textAlign: "center",
      fontSize: 12.5,
      color: "#A0A0A0",
    },

    loginText: {
      color: "#8DC0F0",
      fontWeight: "600",
    },
  });

