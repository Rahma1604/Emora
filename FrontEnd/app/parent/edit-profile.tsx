import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  Feather,
} from "@expo/vector-icons";

import {
  LinearGradient,
} from "expo-linear-gradient";

import {
  router,
  useFocusEffect,
} from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";

import API from "../api";

type ProfileData = {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  profilePic?: string;
  role?: string;
  isVerified?: boolean;
  verificationStatus?: string;
};

type SelectedImage = {
  uri: string;
  name: string;
  type: string;
};

export default function EditProfileScreen() {
  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [profilePic, setProfilePic] =
    useState("");

  const [
    selectedImage,
    setSelectedImage,
  ] =
    useState<SelectedImage | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [updating, setUpdating] =
    useState(false);

  const [error, setError] =
    useState("");

  const emailRegex = useMemo(
    () =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    []
  );

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

  const fetchProfile =
    useCallback(async () => {
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
          await API.get<ProfileData>(
            "/auth/profile"
          );

        console.log(
          "PROFILE DATA:",
          response.data
        );

        setName(
          response.data?.fullName ||
            response.data?.name ||
            ""
        );

        setEmail(
          response.data?.email || ""
        );

        setProfilePic(
          response.data?.profilePic ||
            ""
        );

        setSelectedImage(null);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          console.log(
            "FETCH PROFILE ERROR:",
            {
              message: err.message,
              status:
                err.response?.status,
              data:
                err.response?.data,
              url: err.config?.url,
              baseURL:
                err.config?.baseURL,
            }
          );

          if (
            err.response?.status ===
            401
          ) {
            await handleSessionExpired();
            return;
          }

          const message =
            err.response?.data?.msg ||
            err.response?.data
              ?.message ||
            err.response?.data
              ?.error ||
            "Failed to load profile";

          setError(message);
        } else {
          console.log(
            "Unexpected fetch profile error:",
            err
          );

          setError(
            "Failed to load profile"
          );
        }
      } finally {
        setLoading(false);
      }
    }, [handleSessionExpired]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const chooseProfilePhoto =
    async () => {
      try {
        setError("");

        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (
          !permissionResult.granted
        ) {
          Alert.alert(
            "Permission Required",
            "Please allow access to your photos to change your profile picture."
          );

          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes: [
                "images",
              ],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            }
          );

        if (result.canceled) {
          return;
        }

        const image =
          result.assets[0];

        if (!image?.uri) {
          setError(
            "The selected image could not be loaded."
          );

          return;
        }

        const uriParts =
          image.uri.split(".");

        const extension =
          uriParts[
            uriParts.length - 1
          ]?.toLowerCase() ||
          "jpg";

        const validExtension =
          extension === "png" ||
          extension === "jpeg" ||
          extension === "jpg"
            ? extension
            : "jpg";

        const imageType =
          image.mimeType ||
          (validExtension === "png"
            ? "image/png"
            : "image/jpeg");

        const imageName =
          image.fileName ||
          `profile-${Date.now()}.${validExtension}`;

        setSelectedImage({
          uri: image.uri,
          name: imageName,
          type: imageType,
        });
      } catch (pickerError) {
        console.log(
          "IMAGE PICKER ERROR:",
          pickerError
        );

        setError(
          "Failed to select the image."
        );
      }
    };

  const validateForm = () => {
    const cleanName =
      name.trim();

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    if (!cleanName) {
      setError(
        "Name is required"
      );

      return false;
    }

    if (
      cleanName.length < 3
    ) {
      setError(
        "Name must be at least 3 characters"
      );

      return false;
    }

    if (!cleanEmail) {
      setError(
        "Email is required"
      );

      return false;
    }

    if (
      !emailRegex.test(
        cleanEmail
      )
    ) {
      setError(
        "Please enter a valid email address"
      );

      return false;
    }

    return true;
  };

  const handleUpdateProfile =
    async () => {
      if (updating) {
        return;
      }

      const isValid =
        validateForm();

      if (!isValid) {
        return;
      }

      try {
        setUpdating(true);
        setError("");

        const token =
          await AsyncStorage.getItem(
            "token"
          );

        if (!token) {
          await handleSessionExpired();
          return;
        }

        const cleanName =
          name.trim();

        const cleanEmail =
          email
            .trim()
            .toLowerCase();

        const formData =
          new FormData();

        formData.append(
          "fullName",
          cleanName
        );

        formData.append(
          "email",
          cleanEmail
        );

        if (selectedImage) {
          formData.append(
            "profilePic",
            {
              uri:
                selectedImage.uri,
              name:
                selectedImage.name,
              type:
                selectedImage.type,
            } as any
          );
        }

        const response =
          await API.put(
            "/auth/update-profile",
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

        console.log(
          "UPDATE PROFILE SUCCESS:",
          response.data
        );

        const updatedUser =
          response.data?.user;

        if (updatedUser) {
          const storedUser =
            await AsyncStorage.getItem(
              "user"
            );

          let oldUser = {};

          if (storedUser) {
            try {
              oldUser =
                JSON.parse(
                  storedUser
                );
            } catch (
              parseError
            ) {
              console.log(
                "STORED USER PARSE ERROR:",
                parseError
              );
            }
          }

          const mergedUser = {
            ...oldUser,
            ...updatedUser,
            name:
              updatedUser.fullName ||
              cleanName,
            fullName:
              updatedUser.fullName ||
              cleanName,
            email:
              updatedUser.email ||
              cleanEmail,
            profilePic:
              updatedUser.profilePic ||
              profilePic ||
              "",
          };

          await AsyncStorage.setItem(
            "user",
            JSON.stringify(
              mergedUser
            )
          );

          setName(
            mergedUser.fullName
          );

          setEmail(
            mergedUser.email
          );

          setProfilePic(
            mergedUser.profilePic
          );

          setSelectedImage(null);
        }

        Alert.alert(
          "Success",
          "Profile updated successfully",
          [
            {
              text: "OK",
              onPress: () =>
                router.back(),
            },
          ]
        );
      } catch (err) {
        if (
          axios.isAxiosError(err)
        ) {
          console.log(
            "UPDATE PROFILE ERROR:",
            {
              message:
                err.message,
              status:
                err.response
                  ?.status,
              data:
                err.response?.data,
              url:
                err.config?.url,
              baseURL:
                err.config
                  ?.baseURL,
            }
          );

          if (
            err.response?.status ===
            401
          ) {
            await handleSessionExpired();
            return;
          }

          const message =
            err.response?.data
              ?.msg ||
            err.response?.data
              ?.message ||
            err.response?.data
              ?.error ||
            err.message ||
            "Failed to update profile";

          setError(message);
        } else {
          setError(
            "Something went wrong"
          );

          console.log(
            "Unexpected update profile error:",
            err
          );
        }
      } finally {
        setUpdating(false);
      }
    };

  const displayedImage =
    selectedImage?.uri ||
    profilePic;

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={styles.loaderBox}
        >
          <ActivityIndicator
            size="large"
            color="#3976A4"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading your profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          style={styles.safeArea}
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={styles.container}
          >
            <View
              style={styles.header}
            >
              <TouchableOpacity
                onPress={() =>
                  router.back()
                }
                activeOpacity={0.8}
                style={
                  styles.backButton
                }
                disabled={updating}
              >
                <Feather
                  name="chevron-left"
                  size={24}
                  color="#222"
                />
              </TouchableOpacity>

              <Text
                style={
                  styles.headerTitle
                }
              >
                Edit My Profile
              </Text>
            </View>

            <View
              style={
                styles.avatarSection
              }
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={
                  chooseProfilePhoto
                }
                disabled={updating}
                style={
                  styles.avatarTouchable
                }
              >
                <View
                  style={
                    styles.avatarWrapper
                  }
                >
                  <Image
                    source={
                      displayedImage
                        ? {
                            uri:
                              displayedImage,
                          }
                        : require("../../assets/images/images/image 119.png")
                    }
                    style={styles.avatar}
                  />

                  <View
                    style={
                      styles.cameraBadge
                    }
                  >
                    <Feather
                      name="camera"
                      size={14}
                      color="#FFFFFF"
                    />
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={
                  chooseProfilePhoto
                }
                disabled={updating}
              >
                <Text
                  style={
                    styles.changePhotoText
                  }
                >
                  Change Photo
                </Text>
              </TouchableOpacity>

              {selectedImage ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    setSelectedImage(
                      null
                    )
                  }
                  disabled={updating}
                >
                  <Text
                    style={
                      styles.cancelPhotoText
                    }
                  >
                    Cancel selected photo
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View
              style={styles.form}
            >
              <View
                style={
                  styles.inputBlock
                }
              >
                <Text
                  style={styles.label}
                >
                  Name
                </Text>

                <View
                  style={
                    styles.inputContainer
                  }
                >
                  <Feather
                    name="user"
                    size={17}
                    color="#8E8E93"
                  />

                  <TextInput
                    value={name}
                    onChangeText={(
                      text
                    ) => {
                      setName(text);

                      if (error) {
                        setError("");
                      }
                    }}
                    style={
                      styles.input
                    }
                    placeholder="Enter your name"
                    placeholderTextColor="#B0B0B0"
                    editable={
                      !updating
                    }
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View
                style={
                  styles.inputBlock
                }
              >
                <Text
                  style={styles.label}
                >
                  Email
                </Text>

                <View
                  style={
                    styles.inputContainer
                  }
                >
                  <Feather
                    name="mail"
                    size={17}
                    color="#8E8E93"
                  />

                  <TextInput
                    value={email}
                    onChangeText={(
                      text
                    ) => {
                      setEmail(text);

                      if (error) {
                        setError("");
                      }
                    }}
                    style={
                      styles.input
                    }
                    placeholder="Enter your email"
                    placeholderTextColor="#B0B0B0"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={
                      !updating
                    }
                    returnKeyType="done"
                  />
                </View>
              </View>

              {error ? (
                <View
                  style={
                    styles.errorBox
                  }
                >
                  <Feather
                    name="alert-circle"
                    size={15}
                    color="#D65A59"
                  />

                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {error}
                  </Text>
                </View>
              ) : null}
            </View>

            <View
              style={
                styles.buttonWrapper
              }
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={
                  handleUpdateProfile
                }
                disabled={updating}
              >
                <LinearGradient
                  colors={[
                    "#B9D8F6",
                    "#FBC0BF",
                  ]}
                  start={{
                    x: 0,
                    y: 0,
                  }}
                  end={{
                    x: 1,
                    y: 0,
                  }}
                  style={[
                    styles.updateButton,
                    updating &&
                      styles.disabledButton,
                  ]}
                >
                  {updating ? (
                    <ActivityIndicator
                      color="#222"
                      size="small"
                    />
                  ) : (
                    <>
                      <Feather
                        name="save"
                        size={16}
                        color="#222"
                      />

                      <Text
                        style={
                          styles.updateButtonText
                        }
                      >
                        Update My Profile
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },

    loaderBox: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    loadingText: {
      marginTop: 12,
      fontSize: 10,
      color: "#8E8E93",
    },

    scrollContent: {
      flexGrow: 1,
    },

    container: {
      flex: 1,
      minHeight: "100%",
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 24,
      paddingTop: 10,
      paddingBottom: 18,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
    },

    backButton: {
      width: 34,
      height: 34,
      justifyContent: "center",
      alignItems: "flex-start",
      marginRight: 4,
    },

    headerTitle: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "600",
      color: "#222",
    },

    avatarSection: {
      alignItems: "center",
      marginTop: 48,
    },

    avatarTouchable: {
      borderRadius: 46,
    },

    avatarWrapper: {
      width: 92,
      height: 92,
      borderRadius: 46,
      backgroundColor: "#F4F4F5",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 10,
      position: "relative",
    },

    avatar: {
      width: 82,
      height: 82,
      borderRadius: 41,
    },

    cameraBadge: {
      position: "absolute",
      right: 0,
      bottom: 5,
      width: 29,
      height: 29,
      borderRadius: 15,
      backgroundColor: "#3976A4",
      borderWidth: 3,
      borderColor: "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
    },

    changePhotoText: {
      fontSize: 9.5,
      fontWeight: "600",
      color: "#3976A4",
    },

    cancelPhotoText: {
      marginTop: 7,
      fontSize: 8.5,
      color: "#D65A59",
    },

    form: {
      marginTop: 42,
    },

    inputBlock: {
      marginBottom: 26,
    },

    label: {
      fontSize: 10,
      color: "#8E8E93",
      marginBottom: 10,
      fontWeight: "500",
    },

    inputContainer: {
      height: 52,
      borderWidth: 1,
      borderColor: "#E6E6E6",
      borderRadius: 10,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
    },

    input: {
      flex: 1,
      height: 50,
      marginLeft: 10,
      paddingVertical: 0,
      fontSize: 10.5,
      color: "#222",
    },

    errorBox: {
      minHeight: 42,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: "#FFF0F1",
      borderWidth: 1,
      borderColor: "#F6D1D3",
      flexDirection: "row",
      alignItems: "center",
      marginTop: -8,
    },

    errorText: {
      flex: 1,
      color: "#D65A59",
      fontSize: 9,
      lineHeight: 14,
      marginLeft: 7,
    },

    buttonWrapper: {
      marginTop: "auto",
      paddingTop: 40,
    },

    updateButton: {
      height: 54,
      borderRadius: 27,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
    },

    disabledButton: {
      opacity: 0.7,
    },

    updateButtonText: {
      fontSize: 9.5,
      fontWeight: "600",
      color: "#222",
    },
  });