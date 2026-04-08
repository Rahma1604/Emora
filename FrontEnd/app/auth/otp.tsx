import React, { useEffect, useRef, useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";

const logoImage = require("../../assets/images/images/emora-logo.png");

export default function OtpScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(56);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(seconds, 0);
    return `00:${safeSeconds.toString().padStart(2, "0")}`;
  };

  const handleChange = (text: string, index: number) => {
    const cleanValue = text.replace(/[^0-9]/g, "").slice(-1);

    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    if (error) setError("");

    if (cleanValue && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
  const code = otp.join("");

  if (code.length < 4) {
    setError("Incorrect code. Please try Again");
    return;
  }

  setError("");
  setIsLoading(true);

  setTimeout(() => {
    setIsLoading(false);
    router.replace("/auth/login");
  }, 800);
};
  const handleResend = () => {
    if (secondsLeft > 0) return;

    setOtp(["", "", "", ""]);
    setError("");
    setSecondsLeft(56);
    inputRefs.current[0]?.focus();
  };

  const hasError = !!error;

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#eef7ff", "#fff6f6", "#ffffff"]}
        locations={[0, 0.32, 0.65]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.16 }}
        style={styles.background}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={23} color="#1F1F1F" />
            </TouchableOpacity>

            <View style={styles.content}>
              <Image
                source={logoImage}
                style={styles.logo}
                contentFit="contain"
              />

              <Text style={styles.title}>Verify your email</Text>

              <Text style={styles.subtitle}>
                Enter the verification code sent to your email to continue
              </Text>

              <View style={styles.otpRow}>
                {otp.map((digit, index) => (
                  <LinearGradient
                    key={index}
                    colors={
                      hasError
                        ? ["#FF8A8A", "#FFB3B3"]
                        : ["#8dc0f0", "#f9a8a7"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.otpGradientBorder}
                  >
                    <View style={styles.otpInnerBox}>
                      <TextInput
                        ref={(ref) => {
                          inputRefs.current[index] = ref;
                        }}
                        value={digit}
                        onChangeText={(text) => handleChange(text, index)}
                        onKeyPress={({ nativeEvent }) =>
                          handleKeyPress(nativeEvent.key, index)
                        }
                        keyboardType="number-pad"
                        maxLength={1}
                        textAlign="center"
                        style={[
                          styles.otpInput,
                          hasError && styles.otpInputError,
                        ]}
                        selectionColor={hasError ? "#EF4444" : "#8dc0f0"}
                      />
                    </View>
                  </LinearGradient>
                ))}
              </View>

              {hasError ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleVerify}
                style={styles.buttonWrapper}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={["#8dc0f0", "#f9a8a7"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.button}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Verify</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.resendLabel}>Didn&apos;t receive code ?</Text>

              <View style={styles.resendRow}>
                <Text
                  style={[
                    styles.resendText,
                    secondsLeft === 0 && styles.resendActive,
                  ]}
                  onPress={handleResend}
                >
                  Resend
                </Text>
                <Text style={styles.timerText}> - {formatTime(secondsLeft)}</Text>
              </View>
            </View>
          </View>
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

  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 14,
  },

  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 44,
  },

  logo: {
    width: 72,
    height: 72,
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F1F1F",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    width: "82%",
    fontSize: 12,
    lineHeight: 18,
    color: "#A1A1AA",
    textAlign: "center",
    marginBottom: 28,
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
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#F7F7F8",
    justifyContent: "center",
    alignItems: "center",
  },

  otpInput: {
    width: "100%",
    height: "100%",
    fontSize: 15,
    fontWeight: "500",
    color: "#444444",
    textAlign: "center",
    padding: 0,
  },

  otpInputError: {
    color: "#EF4444",
  },

  errorText: {
    marginBottom: 12,
    fontSize: 11,
    color: "#EF4444",
    textAlign: "center",
    fontWeight: "400",
  },

  buttonWrapper: {
    width: "100%",
    marginTop: 2,
  },

  button: {
    height: 34,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#111111",
  },

  resendLabel: {
    marginTop: 10,
    fontSize: 11,
    color: "#A1A1AA",
    textAlign: "center",
  },

  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  resendText: {
    fontSize: 11,
    color: "#8dc0f0",
    fontWeight: "500",
  },

  resendActive: {
    textDecorationLine: "underline",
  },

  timerText: {
    fontSize: 11,
    color: "#A1A1AA",
  },
});