import React, { useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import API from "../api";

const logoImage = require("../../assets/images/images/emora-logo.png");

type ErrorsType = {
  password?: string;
  confirmPassword?: string;
};

type RenderPasswordInputProps = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  isPasswordVisible: boolean;
  onToggleVisibility: () => void;
};

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<ErrorsType>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: ErrorsType = {};

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm Password is required";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    const isValid = validateForm();
    if (!isValid) return;

    if (!email) {
      setErrors({
        password: "Email is missing. Please try again.",
      });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await API.post("/auth/reset-password", {
        email: String(email).trim().toLowerCase(),
        newPassword: password,
      });

      router.replace("/auth/login");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("FULL RESET PASSWORD ERROR:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
        });

        const message =
          error.response?.data?.msg ||
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to reset password";

        setErrors({
          password: message,
        });
      } else {
        setErrors({
          password: "Something went wrong",
        });

        console.log("Unexpected error:", error);
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
  }: RenderPasswordInputProps) => {
    return (
      <View style={styles.inputBlock}>
        <View style={[styles.inputContainer, error ? styles.inputError : null]}>
          <TextInput
            placeholder={placeholder}
            placeholderTextColor="#A7A7A7"
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={!isPasswordVisible}
            autoCapitalize="none"
            style={styles.input}
          />

          <TouchableOpacity
            onPress={onToggleVisibility}
            activeOpacity={0.7}
            style={styles.eyeButton}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={18}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#eef7ff", "#fff6f6", "#ffffff"]}
        locations={[0, 0.35, 0.65]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.18 }}
        style={styles.background}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#111111" />
            </TouchableOpacity>

            <View style={styles.contentWrapper}>
              <View style={styles.topSection}>
                <Image source={logoImage} style={styles.logo} contentFit="contain" />

                <Text style={styles.title}>Reset password</Text>

                <Text style={styles.subtitle}>
                  Sign up to start tracking and understanding your child&apos;s
                  progress.
                </Text>
              </View>

              <View style={styles.formSection}>
                {renderPasswordInput({
                  placeholder: "Password",
                  value: password,
                  onChangeText: setPassword,
                  error: errors.password,
                  isPasswordVisible: showPassword,
                  onToggleVisibility: () => setShowPassword((prev) => !prev),
                })}

                {renderPasswordInput({
                  placeholder: "Confirm Password",
                  value: confirmPassword,
                  onChangeText: setConfirmPassword,
                  error: errors.confirmPassword,
                  isPasswordVisible: showConfirmPassword,
                  onToggleVisibility: () =>
                    setShowConfirmPassword((prev) => !prev),
                })}
              </View>
            </View>

            <View style={styles.bottomSection}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleSubmit}
                style={styles.buttonWrapper}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#8dc0f0", "#f9a8a7"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.button}
                >
                  {loading ? (
                    <ActivityIndicator color="#111111" />
                  ) : (
                    <Text style={styles.buttonText}>Submit</Text>
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
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 42,
    paddingBottom: 28,
    justifyContent: "space-between",
  },

  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  contentWrapper: {
    flex: 1,
    justifyContent: "flex-start",
  },

  topSection: {
    alignItems: "center",
    marginTop: 36,
  },

  logo: {
    width: 74,
    height: 74,
    marginBottom: 18,
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
    backgroundColor: "#F4F4F6",
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
    borderColor: "#EF4444",
  },

  errorText: {
    marginTop: 6,
    marginLeft: 4,
    color: "#EF4444",
    fontSize: 11,
    lineHeight: 15,
  },

  bottomSection: {
    paddingBottom: 6,
  },

  buttonWrapper: {
    width: "100%",
  },

  button: {
    height: 56,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
});