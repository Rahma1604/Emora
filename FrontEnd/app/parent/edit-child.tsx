import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  LinearGradient,
} from "expo-linear-gradient";

import {
  Feather,
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import API from "../api";

type Gender = "male" | "female";

type ChildData = {
  _id: string;
  name: string;
  age: number;
  gender: Gender;
  notes?: string;
};

type ApiErrorResponse = {
  msg?: string;
  message?: string;
  error?: string;
};

function getSingleParam(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

export default function EditChildScreen() {
  const params =
    useLocalSearchParams<{
      childId?:
        | string
        | string[];

      childName?:
        | string
        | string[];

      childAge?:
        | string
        | string[];

      childGender?:
        | string
        | string[];

      childNotes?:
        | string
        | string[];
    }>();

  const childId =
    getSingleParam(
      params.childId
    );

  const initialName =
    getSingleParam(
      params.childName
    );

  const initialAge =
    getSingleParam(
      params.childAge
    );

  const initialGender =
    getSingleParam(
      params.childGender
    );

  const initialNotes =
    getSingleParam(
      params.childNotes
    );

  const [name, setName] =
    useState(initialName);

  const [age, setAge] =
    useState(initialAge);

  const [gender, setGender] =
    useState<Gender>(
      initialGender === "female"
        ? "female"
        : "male"
    );

  const [notes, setNotes] =
    useState(initialNotes);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const ageNumber = useMemo(() => {
    return Number(age);
  }, [age]);

  const handleSessionExpired =
    useCallback(async () => {
      try {
        await AsyncStorage.multiRemove([
          "token",
          "user",
        ]);
      } catch (storageError) {
        console.log(
          "SESSION CLEANUP ERROR:",
          storageError
        );
      }

      router.replace(
        "/auth/login"
      );
    }, []);

  const getErrorMessage = (
    requestError: unknown,
    fallbackMessage: string
  ) => {
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
        fallbackMessage
      );
    }

    if (
      requestError instanceof Error
    ) {
      return requestError.message;
    }

    return fallbackMessage;
  };

  const fetchChild =
    useCallback(async () => {
      if (!childId) {
        setLoading(false);

        setError(
          "Child ID was not found. Please return and select the child again."
        );

        return;
      }

      try {
        setLoading(true);
        setError("");

        const token =
          await AsyncStorage.getItem(
            "token"
          );

        if (!token) {
          await handleSessionExpired();
          return;
        }

        const response =
          await API.get<ChildData>(
            `/children/${childId}`
          );

        const child =
          response.data;

        setName(
          child?.name || ""
        );

        setAge(
          child?.age !==
            undefined
            ? String(child.age)
            : ""
        );

        setGender(
          child?.gender ===
            "female"
            ? "female"
            : "male"
        );

        setNotes(
          child?.notes || ""
        );
      } catch (requestError) {
        console.log(
          "GET CHILD ERROR:",
          requestError
        );

        if (
          axios.isAxiosError(
            requestError
          ) &&
          requestError.response
            ?.status === 401
        ) {
          await handleSessionExpired();
          return;
        }

        setError(
          getErrorMessage(
            requestError,
            "Failed to load child information."
          )
        );
      } finally {
        setLoading(false);
      }
    }, [
      childId,
      handleSessionExpired,
    ]);

  useFocusEffect(
    useCallback(() => {
      fetchChild();
    }, [fetchChild])
  );

  const validateForm = () => {
    const cleanName =
      name.trim();

    if (!cleanName) {
      setError(
        "Child name is required."
      );

      return false;
    }

    if (
      cleanName.length < 2
    ) {
      setError(
        "Child name must be at least 2 characters."
      );

      return false;
    }

    if (!age.trim()) {
      setError(
        "Child age is required."
      );

      return false;
    }

    if (
      Number.isNaN(ageNumber) ||
      !Number.isInteger(ageNumber) ||
      ageNumber <= 0
    ) {
      setError(
        "Please enter a valid age."
      );

      return false;
    }

    return true;
  };

  const handleSaveChanges =
    async () => {
      if (saving) {
        return;
      }

      if (!childId) {
        setError(
          "Child ID was not found."
        );

        return;
      }

      const isValid =
        validateForm();

      if (!isValid) {
        return;
      }

      try {
        setSaving(true);
        setError("");

        const token =
          await AsyncStorage.getItem(
            "token"
          );

        if (!token) {
          await handleSessionExpired();
          return;
        }

        const response =
          await API.put(
            `/children/${childId}`,
            {
              name:
                name.trim(),

              age:
                ageNumber,

              gender,

              notes:
                notes.trim(),
            }
          );

        console.log(
          "UPDATE CHILD SUCCESS:",
          response.data
        );

        Alert.alert(
          "Success",
          "Child profile updated successfully.",
          [
            {
              text: "OK",
              onPress: () =>
                router.back(),
            },
          ]
        );
      } catch (requestError) {
        console.log(
          "UPDATE CHILD ERROR:",
          requestError
        );

        if (
          axios.isAxiosError(
            requestError
          ) &&
          requestError.response
            ?.status === 401
        ) {
          await handleSessionExpired();
          return;
        }

        setError(
          getErrorMessage(
            requestError,
            "Failed to update child profile."
          )
        );
      } finally {
        setSaving(false);
      }
    };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={styles.loadingContainer}
        >
          <ActivityIndicator
            size="large"
            color="#3976A4"
          />

          <Text
            style={styles.loadingText}
          >
            Loading child profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !name) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={styles.errorContainer}
        >
          <View
            style={styles.errorIcon}
          >
            <Ionicons
              name="alert-circle-outline"
              size={34}
              color="#C65D64"
            />
          </View>

          <Text
            style={styles.errorTitle}
          >
            Unable to load profile
          </Text>

          <Text
            style={styles.errorDescription}
          >
            {error}
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={fetchChild}
            style={styles.retryButton}
          >
            <Feather
              name="refresh-cw"
              size={16}
              color="#3976A4"
            />

            <Text
              style={styles.retryText}
            >
              Try Again
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              router.back()
            }
            style={styles.errorBackButton}
          >
            <Text
              style={styles.errorBackText}
            >
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <LinearGradient
          colors={[
            "#FFFFFF",
            "#FFF9F9",
            "#F8FCFF",
          ]}
          locations={[
            0,
            0.5,
            1,
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 1,
          }}
          style={styles.flex}
        >
          <View
            style={styles.header}
          >
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() =>
                router.back()
              }
              disabled={saving}
              style={styles.backButton}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color="#24282C"
              />
            </TouchableOpacity>

            <View
              style={styles.headerContent}
            >
              <Text
                style={styles.headerTitle}
              >
                Edit Child Profile
              </Text>

              <Text
                style={styles.headerSubtitle}
              >
                Update your child's basic information
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={
              styles.scrollContent
            }
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={styles.profileHeader}
            >
              <LinearGradient
                colors={
                  gender === "female"
                    ? [
                        "#FBC0BF",
                        "#F9D9DD",
                      ]
                    : [
                        "#B9D8F6",
                        "#D9EBFA",
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
                style={styles.avatar}
              >
                <Ionicons
                  name={
                    gender === "female"
                      ? "female"
                      : "male"
                  }
                  size={34}
                  color="#FFFFFF"
                />
              </LinearGradient>

              <Text
                style={styles.profileName}
              >
                {name.trim() ||
                  "Child Profile"}
              </Text>

              <Text
                style={styles.profileCaption}
              >
                Keep this information accurate
              </Text>
            </View>

            <View
              style={styles.formCard}
            >
              <View
                style={styles.inputBlock}
              >
                <Text
                  style={styles.label}
                >
                  Child Name
                </Text>

                <View
                  style={styles.inputContainer}
                >
                  <Feather
                    name="user"
                    size={17}
                    color="#8C9298"
                  />

                  <TextInput
                    value={name}
                    onChangeText={(text) => {
                      setName(text);

                      if (error) {
                        setError("");
                      }
                    }}
                    placeholder="Enter child name"
                    placeholderTextColor="#B2B6BA"
                    style={styles.input}
                    editable={!saving}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View
                style={styles.inputBlock}
              >
                <Text
                  style={styles.label}
                >
                  Age
                </Text>

                <View
                  style={styles.inputContainer}
                >
                  <Feather
                    name="calendar"
                    size={17}
                    color="#8C9298"
                  />

                  <TextInput
                    value={age}
                    onChangeText={(text) => {
                      const numbersOnly =
                        text.replace(
                          /[^0-9]/g,
                          ""
                        );

                      setAge(
                        numbersOnly
                      );

                      if (error) {
                        setError("");
                      }
                    }}
                    placeholder="Enter child age"
                    placeholderTextColor="#B2B6BA"
                    style={styles.input}
                    keyboardType="number-pad"
                    editable={!saving}
                    maxLength={2}
                  />
                </View>
              </View>

              <View
                style={styles.inputBlock}
              >
                <Text
                  style={styles.label}
                >
                  Gender
                </Text>

                <View
                  style={styles.genderRow}
                >
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={saving}
                    onPress={() => {
                      setGender("male");
                      setError("");
                    }}
                    style={[
                      styles.genderOption,
                      gender === "male" &&
                        styles.genderOptionSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.genderIcon,
                        gender === "male" &&
                          styles.maleIconSelected,
                      ]}
                    >
                      <Ionicons
                        name="male"
                        size={20}
                        color={
                          gender === "male"
                            ? "#3976A4"
                            : "#91979D"
                        }
                      />
                    </View>

                    <Text
                      style={[
                        styles.genderText,
                        gender === "male" &&
                          styles.genderTextSelected,
                      ]}
                    >
                      Male
                    </Text>

                    <View
                      style={[
                        styles.radioOuter,
                        gender === "male" &&
                          styles.radioOuterSelected,
                      ]}
                    >
                      {gender ===
                      "male" ? (
                        <View
                          style={
                            styles.radioInner
                          }
                        />
                      ) : null}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={saving}
                    onPress={() => {
                      setGender(
                        "female"
                      );
                      setError("");
                    }}
                    style={[
                      styles.genderOption,
                      gender ===
                        "female" &&
                        styles.genderOptionSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.genderIcon,
                        gender ===
                          "female" &&
                          styles.femaleIconSelected,
                      ]}
                    >
                      <Ionicons
                        name="female"
                        size={20}
                        color={
                          gender ===
                          "female"
                            ? "#B65A61"
                            : "#91979D"
                        }
                      />
                    </View>

                    <Text
                      style={[
                        styles.genderText,
                        gender ===
                          "female" &&
                          styles.genderTextSelected,
                      ]}
                    >
                      Female
                    </Text>

                    <View
                      style={[
                        styles.radioOuter,
                        gender ===
                          "female" &&
                          styles.radioOuterSelectedFemale,
                      ]}
                    >
                      {gender ===
                      "female" ? (
                        <View
                          style={[
                            styles.radioInner,
                            styles.radioInnerFemale,
                          ]}
                        />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <View
                style={[
                  styles.inputBlock,
                  styles.lastInputBlock,
                ]}
              >
                <View
                  style={styles.notesLabelRow}
                >
                  <Text
                    style={styles.label}
                  >
                    Notes
                  </Text>

                  <Text
                    style={styles.optionalText}
                  >
                    Optional
                  </Text>
                </View>

                <View
                  style={[
                    styles.inputContainer,
                    styles.notesContainer,
                  ]}
                >
                  <Feather
                    name="file-text"
                    size={17}
                    color="#8C9298"
                    style={styles.notesIcon}
                  />

                  <TextInput
                    value={notes}
                    onChangeText={(text) => {
                      setNotes(text);

                      if (error) {
                        setError("");
                      }
                    }}
                    placeholder="Add any important notes about your child"
                    placeholderTextColor="#B2B6BA"
                    style={[
                      styles.input,
                      styles.notesInput,
                    ]}
                    editable={!saving}
                    multiline
                    textAlignVertical="top"
                    maxLength={500}
                  />
                </View>

                <Text
                  style={styles.charactersCount}
                >
                  {notes.length}/500
                </Text>
              </View>

              {error ? (
                <View
                  style={styles.inlineError}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={17}
                    color="#C65D64"
                  />

                  <Text
                    style={styles.inlineErrorText}
                  >
                    {error}
                  </Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              disabled={saving}
              onPress={
                handleSaveChanges
              }
              style={styles.saveWrapper}
            >
              <LinearGradient
                colors={[
                  "#B9D8F6",
                  "#FBC0BF",
                ]}
                start={{
                  x: 0,
                  y: 0.5,
                }}
                end={{
                  x: 1,
                  y: 0.5,
                }}
                style={[
                  styles.saveButton,
                  saving &&
                    styles.saveButtonDisabled,
                ]}
              >
                {saving ? (
                  <ActivityIndicator
                    size="small"
                    color="#292D31"
                  />
                ) : (
                  <>
                    <Feather
                      name="save"
                      size={17}
                      color="#292D31"
                    />

                    <Text
                      style={styles.saveButtonText}
                    >
                      Save Changes
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={saving}
              onPress={() =>
                router.back()
              }
              style={styles.cancelButton}
            >
              <Text
                style={styles.cancelButtonText}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
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
      backgroundColor: "#FFFFFF",
    },

    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    loadingText: {
      marginTop: 12,
      fontSize: 10,
      color: "#8E949A",
    },

    errorContainer: {
      flex: 1,
      paddingHorizontal: 30,
      justifyContent: "center",
      alignItems: "center",
    },

    errorIcon: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: "#FFF0F1",
      justifyContent: "center",
      alignItems: "center",
    },

    errorTitle: {
      marginTop: 15,
      fontSize: 16,
      fontWeight: "700",
      color: "#292D31",
    },

    errorDescription: {
      marginTop: 7,
      fontSize: 9.5,
      lineHeight: 15,
      color: "#8E949A",
      textAlign: "center",
    },

    retryButton: {
      marginTop: 18,
      minHeight: 42,
      paddingHorizontal: 20,
      borderRadius: 21,
      backgroundColor: "#EDF7FF",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    retryText: {
      marginLeft: 7,
      fontSize: 9.5,
      fontWeight: "600",
      color: "#3976A4",
    },

    errorBackButton: {
      marginTop: 10,
      paddingHorizontal: 15,
      paddingVertical: 10,
    },

    errorBackText: {
      fontSize: 9.5,
      color: "#8E949A",
    },

    header: {
      minHeight: 74,
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 10,
      flexDirection: "row",
      alignItems: "center",
    },

    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "#F5F6F7",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },

    headerContent: {
      flex: 1,
    },

    headerTitle: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "600",
      color: "#24282C",
    },

    headerSubtitle: {
      marginTop: 2,
      fontSize: 8.5,
      color: "#92979E",
    },

    scrollContent: {
      paddingHorizontal: 18,
      paddingBottom: 35,
    },

    profileHeader: {
      alignItems: "center",
      marginTop: 8,
      marginBottom: 22,
    },

    avatar: {
      width: 78,
      height: 78,
      borderRadius: 39,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#7A8792",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.12,
      shadowRadius: 9,
      elevation: 4,
    },

    profileName: {
      marginTop: 12,
      fontSize: 15,
      fontWeight: "700",
      color: "#292D31",
    },

    profileCaption: {
      marginTop: 4,
      fontSize: 8.5,
      color: "#92979E",
    },

    formCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: "#E7E9EB",
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 17,
      shadowColor: "#9DA6AD",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.05,
      shadowRadius: 7,
      elevation: 2,
    },

    inputBlock: {
      marginBottom: 21,
    },

    lastInputBlock: {
      marginBottom: 0,
    },

    label: {
      marginBottom: 9,
      fontSize: 9.5,
      fontWeight: "600",
      color: "#62686E",
    },

    inputContainer: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: "#E4E6E8",
      borderRadius: 13,
      backgroundColor: "#FAFAFB",
      paddingHorizontal: 13,
      flexDirection: "row",
      alignItems: "center",
    },

    input: {
      flex: 1,
      height: 48,
      marginLeft: 10,
      paddingVertical: 0,
      fontSize: 10,
      color: "#292D31",
    },

    genderRow: {
      flexDirection: "row",
      gap: 10,
    },

    genderOption: {
      flex: 1,
      minHeight: 64,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: "#E4E6E8",
      backgroundColor: "#FAFAFB",
      paddingHorizontal: 11,
      flexDirection: "row",
      alignItems: "center",
    },

    genderOptionSelected: {
      borderColor: "#D5DDE5",
      backgroundColor: "#FFFFFF",
    },

    genderIcon: {
      width: 35,
      height: 35,
      borderRadius: 12,
      backgroundColor: "#F0F1F2",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },

    maleIconSelected: {
      backgroundColor: "#EAF5FD",
    },

    femaleIconSelected: {
      backgroundColor: "#FFF0F1",
    },

    genderText: {
      flex: 1,
      fontSize: 9.5,
      fontWeight: "500",
      color: "#777D83",
    },

    genderTextSelected: {
      color: "#292D31",
      fontWeight: "600",
    },

    radioOuter: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      borderColor: "#C6CACD",
      justifyContent: "center",
      alignItems: "center",
    },

    radioOuterSelected: {
      borderColor: "#78ACD5",
    },

    radioOuterSelectedFemale: {
      borderColor: "#D8868C",
    },

    radioInner: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: "#78ACD5",
    },

    radioInnerFemale: {
      backgroundColor: "#D8868C",
    },

    notesLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    optionalText: {
      marginBottom: 9,
      fontSize: 7.8,
      color: "#A2A7AC",
    },

    notesContainer: {
      minHeight: 112,
      alignItems: "flex-start",
      paddingTop: 13,
    },

    notesIcon: {
      marginTop: 1,
    },

    notesInput: {
      height: 90,
      paddingTop: 0,
      paddingBottom: 8,
      lineHeight: 15,
    },

    charactersCount: {
      marginTop: 6,
      fontSize: 7.5,
      color: "#A2A7AC",
      textAlign: "right",
    },

    inlineError: {
      marginTop: 16,
      minHeight: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#F3CFD2",
      backgroundColor: "#FFF3F4",
      paddingHorizontal: 11,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
    },

    inlineErrorText: {
      flex: 1,
      marginLeft: 7,
      fontSize: 8.5,
      lineHeight: 13,
      color: "#B65A61",
    },

    saveWrapper: {
      marginTop: 19,
    },

    saveButton: {
      height: 50,
      borderRadius: 25,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    saveButtonDisabled: {
      opacity: 0.7,
    },

    saveButtonText: {
      fontSize: 10,
      fontWeight: "600",
      color: "#292D31",
    },

    cancelButton: {
      height: 46,
      marginTop: 10,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: "#E1E3E5",
      backgroundColor: "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
    },

    cancelButtonText: {
      fontSize: 9.5,
      fontWeight: "600",
      color: "#70767C",
    },
  });