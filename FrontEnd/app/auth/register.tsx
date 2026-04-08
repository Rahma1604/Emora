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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";

const logoImage = require("../../assets/images/images/emora-logo.png");

type ErrorsType = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type RenderInputProps = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  showEye?: boolean;
  isPasswordVisible?: boolean;
  onToggleVisibility?: () => void;
  keyboardType?: KeyboardTypeOptions;
};

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<ErrorsType>({});

  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);

  const validateForm = () => {
    const newErrors: ErrorsType = {};

    if (!fullName.trim()) {
      newErrors.name = "Full name is required";
    } else if (fullName.trim().length < 3) {
      newErrors.name = "Full name must be at least 3 characters";
    }

    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm Password is required";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAccount = () => {
    const isValid = validateForm();

    if (!isValid) return;

    router.push({
      pathname: "/auth/otp",
      params: { email: email.trim() },
    });
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
  }: RenderInputProps) => {
    return (
      <View style={styles.inputBlock}>
        <View style={[styles.inputContainer, error ? styles.inputError : null]}>
          <TextInput
            placeholder={placeholder}
            placeholderTextColor="#A7A7A7"
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize="none"
            style={styles.input}
          />

          {showEye && (
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
          )}
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
            <View style={styles.topSection}>
              <Image
                source={logoImage}
                style={styles.logo}
                contentFit="contain"
              />

              <Text style={styles.title}>Create your account</Text>

              <Text style={styles.subtitle}>
                Sign up to start tracking and understanding your child's
                progress.
              </Text>
            </View>

            <View style={styles.formSection}>
              {renderInput({
                placeholder: "Full name",
                value: fullName,
                onChangeText: setFullName,
                error: errors.name,
              })}

              {renderInput({
                placeholder: "Email address",
                value: email,
                onChangeText: setEmail,
                error: errors.email,
                keyboardType: "email-address",
              })}

              {renderInput({
                placeholder: "Password",
                value: password,
                onChangeText: setPassword,
                error: errors.password,
                secureTextEntry: !showPassword,
                showEye: true,
                isPasswordVisible: showPassword,
                onToggleVisibility: () => setShowPassword((prev) => !prev),
              })}

              {renderInput({
                placeholder: "Confirm Password",
                value: confirmPassword,
                onChangeText: setConfirmPassword,
                error: errors.confirmPassword,
                secureTextEntry: !showConfirmPassword,
                showEye: true,
                isPasswordVisible: showConfirmPassword,
                onToggleVisibility: () =>
                  setShowConfirmPassword((prev) => !prev),
              })}
            </View>

            <View style={styles.bottomSection}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleCreateAccount}
                style={styles.buttonWrapper}
              >
                <LinearGradient
                  colors={["#8dc0f0", "#f9a8a7"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Create Account</Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.footerText}>
                Already Have An Account?{" "}
                <Text
                  style={styles.loginText}
                  onPress={() => router.push("/auth/login")}
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
    paddingTop: 34,
    paddingBottom: 28,
    justifyContent: "space-between",
  },

  topSection: {
    alignItems: "center",
    marginTop: 8,
  },

  logo: {
    width: 74,
    height: 74,
    marginBottom: 22,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F1F1F",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    width: "88%",
    fontSize: 14,
    lineHeight: 22,
    color: "#8D8D8D",
    textAlign: "center",
  },

  formSection: {
    marginTop: 28,
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
    marginTop: 34,
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
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },

  footerText: {
    marginTop: 22,
    textAlign: "center",
    fontSize: 13,
    color: "#A0A0A0",
  },

  loginText: {
    color: "#8dc0f0",
    fontWeight: "500",
  },
});