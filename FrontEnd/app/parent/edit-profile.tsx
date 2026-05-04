import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import API from "../api";

export default function EditProfileScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePic, setProfilePic] = useState("");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/auth/profile");

      setName(response.data.fullName || "");
      setEmail(response.data.email || "");
      setProfilePic(response.data.profilePic || "");
    } catch (err) {
      setError("Failed to load profile");
      console.log("Edit profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      setUpdating(true);
      setError("");

      await API.put("/auth/update-profile", {
        fullName: name.trim(),
      });

      router.back();
    } catch (err) {
      setError("Failed to update profile");
      console.log("Update profile error:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#222" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            style={styles.backButton}
          >
            <Feather name="chevron-left" size={24} color="#222" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Edit My Profile</Text>
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={
                profilePic
                  ? { uri: profilePic }
                  : require("../../assets/images/images/image 119.png")
              }
              style={styles.avatar}
            />
          </View>

          <TouchableOpacity activeOpacity={0.8}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#B0B0B0"
            />
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              style={[styles.input, styles.disabledInput]}
              placeholder="Enter your email"
              placeholderTextColor="#B0B0B0"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleUpdateProfile}
            disabled={updating}
          >
            <LinearGradient
              colors={["#B9D8F6", "#FBC0BF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.updateButton}
            >
              {updating ? (
                <ActivityIndicator color="#222" />
              ) : (
                <Text style={styles.updateButtonText}>Update My Profile</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  loaderBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  backButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "flex-start",
    marginRight: 4,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
  },

  avatarSection: {
    alignItems: "center",
    marginTop: 48,
  },

  avatarWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#F4F4F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },

  changePhotoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },

  form: {
    marginTop: 42,
  },

  inputBlock: {
    marginBottom: 26,
  },

  label: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 10,
    fontWeight: "500",
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#222",
    backgroundColor: "#FFFFFF",
  },

  disabledInput: {
    color: "#8E8E93",
    backgroundColor: "#F7F7F8",
  },

  errorText: {
    color: "#EF4444",
    fontSize: 13,
    marginTop: -8,
  },

  buttonWrapper: {
    marginTop: "auto",
    marginBottom: 18,
  },

  updateButton: {
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
  },

  updateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
});