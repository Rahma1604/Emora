import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

type RoleType = "doctor" | "parent" | null;

const doctorImage = require("../assets/images/images/doctor-role.jpg");
const parentImage = require("../assets/images/images/parent-role.jpg");

export default function RoleSelectionScreen() {
  const [selectedRole, setSelectedRole] = useState<RoleType>("parent");

  const handleBack = () => {
    router.back();
  };

 const handleGetStarted = () => {
  router.push("/auth/register");
};

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="chevron-back" size={24} color="#1F2937" />
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Choose your role</Text>

        <Text style={styles.subtitle}>
          Select how you want to use the app so we can personalize your
          experience.
        </Text>

        {/* Roles */}
        <View style={styles.rolesContainer}>
          {/* Doctor */}
          <TouchableOpacity
            onPress={() => setSelectedRole("doctor")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={
                selectedRole === "doctor"
                  ? ["#8dc0f0", "#f9a8a7"]
                  : ["#E5E5E5", "#E5E5E5"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBorder}
            >
              <View style={styles.innerCard}>
                <Image
                  source={doctorImage}
                  style={styles.roleImage}
                  contentFit="contain"
                />
                <Text style={styles.roleText}>Doctor</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Parent */}
          <TouchableOpacity
            onPress={() => setSelectedRole("parent")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={
                selectedRole === "parent"
                  ? ["#8dc0f0", "#f9a8a7"]
                  : ["#E5E5E5", "#E5E5E5"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBorder}
            >
              <View style={styles.innerCard}>
                <Image
                  source={parentImage}
                  style={styles.roleImage}
                  contentFit="contain"
                />
                <Text style={styles.roleText}>Parent</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Button */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.buttonWrapper}
        onPress={handleGetStarted}
      >
        <LinearGradient
          colors={["#8dc0f0", "#f9a8a7"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={18} color="#111827" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 34,
    justifyContent: "space-between",
  },

  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    flex: 1,
    alignItems: "center",
    marginTop: 36,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222222",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#8A8A8A",
    textAlign: "center",
    maxWidth: 290,
    marginBottom: 34,
  },

  rolesContainer: {
    flexDirection: "row",
    gap: 16,
  },

  gradientBorder: {
    borderRadius: 12,
    padding: 1.5, 
  },

  innerCard: {
    width: 132,
    height: 136,
    backgroundColor: "#F3F4F6",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },

  roleImage: {
    width: 72,
    height: 72,
    marginBottom: 10,
  },

  roleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
  },

  buttonWrapper: {
    width: "100%",
  },

  button: {
    height: 56,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
});