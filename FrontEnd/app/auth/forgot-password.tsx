import React, { useMemo, useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import axios from "axios";
import API from "../api";

const logoImage = require("../../assets/images/images/emora-logo.png");

type ErrorsType = {
  email?: string;
};

type RenderInputProps = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
};

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<ErrorsType>({});
  const [loading, setLoading] = useState(false);

  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);

  const validateForm = () => {
    const newErrors: ErrorsType = {};

    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    const isValid = validateForm();
    if (!isValid) return;

    setLoading(true);
    setErrors({});

    try {
      const cleanEmail = email.trim().toLowerCase();

      await API.post("/auth/forgot-password", {
        email: cleanEmail,
      });

      router.push({
        pathname: "/auth/otp",
        params: {
          email: cleanEmail,
          mode: "forgot-password",
        },
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("FULL FORGOT PASSWORD ERROR:", {
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
          "Failed to send OTP";

        setErrors({
          email: message,
        });
      } else {
        setErrors({
          email: "Something went wrong",
        });

        console.log("Unexpected error:", error);
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
      <View style={styles.inputBlock}>
        <View style={[styles.inputContainer, error ? styles.inputError : null]}>
          <TextInput
            placeholder={placeholder}
            placeholderTextColor="#A7A7A7"
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoCapitalize="none"
            style={styles.input}
          />
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

                <Text style={styles.title}>Forget password</Text>

                <Text style={styles.subtitle}>
                  Sign up to start tracking and understanding your child&apos;s
                  progress.
                </Text>
              </View>

              <View style={styles.formSection}>
                {renderInput({
                  placeholder: "Email address",
                  value: email,
                  onChangeText: setEmail,
                  error: errors.email,
                  keyboardType: "email-address",
                })}
              </View>
            </View>

            <View style={styles.bottomSection}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleContinue}
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
                    <Text style={styles.buttonText}>Continue</Text>
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