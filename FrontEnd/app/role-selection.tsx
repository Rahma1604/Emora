
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

type RoleType = "doctor" | "parent" | null;

const doctorImage = require("../assets/images/images/doctor-role.jpg");
const parentImage = require("../assets/images/images/parent-role.jpg");

export default function RoleSelectionScreen() {
  const [selectedRole, setSelectedRole] =
    useState<RoleType>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleGetStarted = async () => {
    if (!selectedRole || isLoading) return;

    try {
      setIsLoading(true);

      // حفظ نوع المستخدم
      await AsyncStorage.setItem(
        "role",
        selectedRole
      );

      // الـ Parent والـ Doctor يستخدمان نفس صفحة التسجيل
      router.push("/auth/register");
    } catch (error) {
      console.log("Error saving role:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isRoleSelected =
    selectedRole !== null;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons
          name="chevron-back"
          size={26}
          color="#1F2937"
        />
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>
          Choose your role
        </Text>

        <Text style={styles.subtitle}>
          Select how you want to use the app so
          we can personalize your experience.
        </Text>

        {/* Roles */}
        <View style={styles.rolesContainer}>
          {/* Doctor Card */}
          <TouchableOpacity
            onPress={() =>
              setSelectedRole("doctor")
            }
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Select doctor role"
            accessibilityState={{
              selected:
                selectedRole === "doctor",
            }}
            style={styles.roleTouchable}
          >
            <LinearGradient
              colors={
                selectedRole === "doctor"
                  ? ["#8DC0F0", "#F9A8A7"]
                  : ["#E5E7EB", "#E5E7EB"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBorder}
            >
              <View style={styles.innerCard}>
                {selectedRole === "doctor" && (
                  <View
                    style={styles.selectedIcon}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color="#82B9EC"
                    />
                  </View>
                )}

                <Image
                  source={doctorImage}
                  style={styles.roleImage}
                  contentFit="contain"
                />

                <Text style={styles.roleText}>
                  Doctor
                </Text>

                <View
                  style={
                    styles.descriptionContainer
                  }
                >
                  <Text
                    style={styles.roleDescription}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                  >
                    Review child cases and provide
                    guidance.
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Parent Card */}
          <TouchableOpacity
            onPress={() =>
              setSelectedRole("parent")
            }
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Select parent role"
            accessibilityState={{
              selected:
                selectedRole === "parent",
            }}
            style={styles.roleTouchable}
          >
            <LinearGradient
              colors={
                selectedRole === "parent"
                  ? ["#8DC0F0", "#F9A8A7"]
                  : ["#E5E7EB", "#E5E7EB"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBorder}
            >
              <View style={styles.innerCard}>
                {selectedRole === "parent" && (
                  <View
                    style={styles.selectedIcon}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color="#F39B9B"
                    />
                  </View>
                )}

                <Image
                  source={parentImage}
                  style={styles.roleImage}
                  contentFit="contain"
                />

                <Text style={styles.roleText}>
                  Parent
                </Text>

                <View
                  style={
                    styles.descriptionContainer
                  }
                >
                  <Text
                    style={styles.roleDescription}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                  >
                    Track your child’s emotional
                    progress.
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Get Started Button */}
      <TouchableOpacity
        activeOpacity={
          isRoleSelected ? 0.9 : 1
        }
        style={styles.buttonWrapper}
        onPress={handleGetStarted}
        disabled={
          !isRoleSelected || isLoading
        }
        accessibilityRole="button"
        accessibilityLabel="Get started"
        accessibilityState={{
          disabled:
            !isRoleSelected || isLoading,
        }}
      >
        {isRoleSelected ? (
          <LinearGradient
            colors={[
              "#8DC0F0",
              "#F9A8A7",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.button}
          >
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color="#111827"
              />
            ) : (
              <>
                <Text
                  style={styles.buttonText}
                >
                  Get Started
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#111827"
                />
              </>
            )}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.button,
              styles.disabledButton,
            ]}
          >
            <Text
              style={
                styles.disabledButtonText
              }
            >
              Select a role first
            </Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color="#9CA3AF"
            />
          </View>
        )}
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
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    flex: 1,
    alignItems: "center",
    marginTop: 38,
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
    maxWidth: 310,
    marginBottom: 36,
  },

  rolesContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "stretch",
    gap: 14,
  },

  roleTouchable: {
    flex: 1,
    maxWidth: 155,
  },

  gradientBorder: {
    borderRadius: 16,
    padding: 1.5,
  },

  innerCard: {
    position: "relative",
    width: "100%",
    height: 200,
    backgroundColor: "#F8F9FA",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 16,
  },

  selectedIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },

  roleImage: {
    width: 72,
    height: 72,
    marginBottom: 10,
  },

  roleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
    textAlign: "center",
    marginBottom: 8,
  },

  descriptionContainer: {
    height: 42,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  roleDescription: {
    width: "100%",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "400",
    color: "#777777",
    textAlign: "center",
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

  disabledButton: {
    backgroundColor: "#F1F3F5",
  },

  disabledButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
  },
});

