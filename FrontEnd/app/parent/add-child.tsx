
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import API from "../api";

type Gender = "male" | "female" | "";

type ApiErrorData = {
  success?: boolean;
  error?: string;
  message?: string;
  msg?: string;
};

export default function AddChild() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const trimmedName = name.trim();
    const trimmedNotes = notes.trim();
    const numericAge = Number(age);

    if (!trimmedName) {
      setError("Please enter the child's name");
      return false;
    }

    if (trimmedName.length > 30) {
      setError("Child name cannot exceed 30 characters");
      return false;
    }

    if (!age.trim()) {
      setError("Please enter the child's age");
      return false;
    }

    if (
      Number.isNaN(numericAge) ||
      !Number.isInteger(numericAge) ||
      numericAge < 1 ||
      numericAge > 18
    ) {
      setError("Please enter a valid age between 1 and 18");
      return false;
    }

    if (!gender) {
      setError("Please select the child's gender");
      return false;
    }

    if (trimmedNotes.length > 300) {
      setError("Parent notes cannot exceed 300 characters");
      return false;
    }

    setError("");
    return true;
  };

  const handleExpiredSession = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user"]);
    } catch (storageError) {
      console.log("Session cleanup error:", storageError);
    }

    router.replace("/auth/login" as never);
  };

  const handleAddChild = async () => {
    if (!validateForm() || loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        await handleExpiredSession();
        return;
      }

      const response = await API.post(
        "/children/add",
        {
          name: name.trim(),
          age: Number(age),
          gender,
          notes: notes.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("ADD CHILD RESPONSE:", response.data);

      router.replace("/parent/parentHome" as never);
    } catch (requestError) {
      console.log("ADD CHILD ERROR:", requestError);

      if (axios.isAxiosError(requestError)) {
        const status = requestError.response?.status;

        const responseData = requestError.response?.data as
          | ApiErrorData
          | undefined;

        if (status === 401) {
          await handleExpiredSession();
          return;
        }

        const message =
          responseData?.message ||
          responseData?.error ||
          responseData?.msg ||
          "Failed to save the child profile. Please try again.";

        setError(message);
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to save the child profile. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <View style={styles.topGradientWrapper}>
            <LinearGradient
              colors={[
                "rgba(185,216,246,0.32)",
                "rgba(255,255,255,0.10)",
                "rgba(251,192,191,0.32)",
              ]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.topHorizontalGradient}
            />

            <LinearGradient
              colors={[
                "rgba(255,255,255,0)",
                "rgba(255,255,255,0.40)",
                "rgba(255,255,255,0.78)",
                "rgba(255,255,255,1)",
              ]}
              locations={[0, 0.45, 0.75, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.topFadeGradient}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Feather
                name="chevron-left"
                size={23}
                color="#222"
              />
            </TouchableOpacity>

            <Text style={styles.title}>
              Add New Child Profile
            </Text>

            <Text style={styles.subtitle}>
              Add a nickname or first name to protect your
              child's privacy.
            </Text>

            <View style={styles.form}>
              <Text style={styles.fieldLabel}>
                Child's Name
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="happy-outline"
                  size={19}
                  color="#999"
                />

                <TextInput
                  placeholder="Nickname / First Name"
                  placeholderTextColor="#B8B8B8"
                  style={styles.textInput}
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    setError("");
                  }}
                  maxLength={30}
                  editable={!loading}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              <Text style={styles.fieldLabel}>
                Age
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={19}
                  color="#999"
                />

                <TextInput
                  placeholder="Enter age"
                  placeholderTextColor="#B8B8B8"
                  style={styles.textInput}
                  keyboardType="number-pad"
                  value={age}
                  onChangeText={(value) => {
                    const numericValue = value.replace(
                      /[^0-9]/g,
                      ""
                    );

                    setAge(numericValue);
                    setError("");
                  }}
                  maxLength={2}
                  editable={!loading}
                />
              </View>

              <Text style={styles.fieldLabel}>
                Gender
              </Text>

              <View style={styles.genderContainer}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={loading}
                  onPress={() => {
                    setGender("male");
                    setError("");
                  }}
                  style={[
                    styles.genderButton,
                    gender === "male" &&
                      styles.selectedGenderButton,
                  ]}
                >
                  <Ionicons
                    name="male"
                    size={19}
                    color={
                      gender === "male"
                        ? "#3976A4"
                        : "#999"
                    }
                  />

                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === "male" &&
                        styles.selectedGenderText,
                    ]}
                  >
                    Male
                  </Text>

                  {gender === "male" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#3976A4"
                    />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={loading}
                  onPress={() => {
                    setGender("female");
                    setError("");
                  }}
                  style={[
                    styles.genderButton,
                    gender === "female" &&
                      styles.selectedFemaleButton,
                  ]}
                >
                  <Ionicons
                    name="female"
                    size={19}
                    color={
                      gender === "female"
                        ? "#B65A61"
                        : "#999"
                    }
                  />

                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === "female" &&
                        styles.selectedFemaleText,
                    ]}
                  >
                    Female
                  </Text>

                  {gender === "female" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#B65A61"
                    />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>
                Parent's Notes
              </Text>

              <View
                style={[
                  styles.inputContainer,
                  styles.notesContainer,
                ]}
              >
                <Ionicons
                  name="document-text-outline"
                  size={19}
                  color="#999"
                  style={styles.notesIcon}
                />

                <TextInput
                  placeholder="Add any useful notes about your child..."
                  placeholderTextColor="#B8B8B8"
                  style={[
                    styles.textInput,
                    styles.notesInput,
                  ]}
                  multiline
                  textAlignVertical="top"
                  value={notes}
                  onChangeText={(value) => {
                    setNotes(value);
                    setError("");
                  }}
                  maxLength={300}
                  editable={!loading}
                />
              </View>

              <View style={styles.notesFooter}>
                <Text style={styles.optionalText}>
                  Optional
                </Text>

                <Text style={styles.characterCounter}>
                  {notes.length}/300
                </Text>
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={17}
                    color="#D9534F"
                  />

                  <Text style={styles.errorText}>
                    {error}
                  </Text>
                </View>
              ) : null}

              <View style={styles.privacyNote}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={19}
                  color="#3976A4"
                />

                <Text style={styles.privacyText}>
                  Your identity remains hidden from
                  specialists. Only the child's nickname or
                  first name will be shown.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleAddChild}
              disabled={loading}
              style={
                loading
                  ? styles.disabledButton
                  : undefined
              }
            >
              <LinearGradient
                colors={["#B9D8F6", "#FBC0BF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButton}
              >
                {loading ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color="#222"
                    />

                    <Text style={styles.loadingButtonText}>
                      Saving...
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="person-add-outline"
                      size={19}
                      color="#222"
                    />

                    <Text style={styles.addButtonText}>
                      Add Child
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  keyboardContainer: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  topGradientWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 170,
    overflow: "hidden",
  },

  topHorizontalGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  topFadeGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 130,
  },

  backButton: {
    marginTop: 6,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.65)",
    zIndex: 2,
  },

  title: {
    marginTop: 15,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
    color: "#222",
    zIndex: 2,
  },

  subtitle: {
    marginTop: 7,
    width: "90%",
    fontSize: 10.5,
    lineHeight: 16,
    color: "#7D7D7D",
    zIndex: 2,
  },

  form: {
    marginTop: 24,
    zIndex: 2,
  },

  fieldLabel: {
    marginBottom: 7,
    marginLeft: 2,
    fontSize: 10,
    fontWeight: "500",
    color: "#444",
  },

  inputContainer: {
    minHeight: 52,
    backgroundColor: "#F5F5F7",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 17,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F2",
  },

  textInput: {
    flex: 1,
    height: 50,
    marginLeft: 10,
    fontSize: 10.5,
    color: "#222",
  },

  genderContainer: {
    flexDirection: "row",
    marginBottom: 17,
  },

  genderButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F5F5F7",
    borderWidth: 1,
    borderColor: "#F0F0F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },

  selectedGenderButton: {
    backgroundColor: "#EDF6FD",
    borderColor: "#B9D8F6",
  },

  selectedFemaleButton: {
    backgroundColor: "#FFF1F1",
    borderColor: "#FBC0BF",
  },

  genderButtonText: {
    marginHorizontal: 7,
    fontSize: 9.5,
    color: "#888",
    fontWeight: "500",
  },

  selectedGenderText: {
    color: "#3976A4",
  },

  selectedFemaleText: {
    color: "#B65A61",
  },

  notesContainer: {
    height: 112,
    alignItems: "flex-start",
    paddingTop: 13,
    marginBottom: 4,
  },

  notesIcon: {
    marginTop: 2,
  },

  notesInput: {
    height: 90,
    paddingTop: 0,
    paddingBottom: 8,
  },

  notesFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 15,
  },

  optionalText: {
    fontSize: 8,
    color: "#A0A0A0",
  },

  characterCounter: {
    fontSize: 8,
    color: "#A0A0A0",
  },

  errorContainer: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#FFF1F1",
    borderWidth: 1,
    borderColor: "#FAD4D2",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  errorText: {
    flex: 1,
    marginLeft: 7,
    color: "#D9534F",
    fontSize: 9.5,
    lineHeight: 14,
  },

  privacyNote: {
    borderRadius: 14,
    backgroundColor: "#F1F7FC",
    borderWidth: 1,
    borderColor: "#DCEAF4",
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  privacyText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 9,
    lineHeight: 14,
    color: "#607080",
  },

  buttonWrapper: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 14,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
    zIndex: 5,
  },

  addButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  addButtonText: {
    marginLeft: 8,
    color: "#222",
    fontSize: 9.5,
    fontWeight: "600",
  },

  loadingButtonText: {
    marginLeft: 8,
    color: "#222",
    fontSize: 9.5,
    fontWeight: "600",
  },

  disabledButton: {
    opacity: 0.7,
  },
});

