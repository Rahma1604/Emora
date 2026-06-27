import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  router,
  type Href,
} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import API from "../api";

type IoniconName =
  keyof typeof Ionicons.glyphMap;

type ProfileErrors = {
  displayName?: string;
  email?: string;
  phone?: string;
  city?: string;
  bio?: string;
  general?: string;
};

type StoredUser = {
  id?: string | number;
  _id?: string;
  fullName?: string;
  displayName?: string;
  email?: string;
  role?: string;
  specialization?: string;
  phone?: string;
  city?: string;
  bio?: string;
  profilePic?: string | null;
  profileImage?: string | null;
  avatar?: string | null;
  verificationStatus?: string;
  [key: string]: unknown;
};

type ProfileSnapshot = {
  displayName: string;
  email: string;
  phone: string;
  city: string;
  bio: string;
  profileImage: string | null;
};

type FeedbackModalType =
  | "saved"
  | "save_error"
  | "discard_changes"
  | "permission_denied"
  | null;

type FeedbackModalContent = {
  icon: IoniconName;
  iconColor: string;
  gradient: [string, string];
  badge: string;
  badgeBackground: string;
  badgeColor: string;
  title: string;
  description: string;
  primaryText: string;
  secondaryText?: string;
};

type ProfileApiResponse = {
  success?: boolean;
  msg?: string;
  message?: string;
  user?: StoredUser;
  data?: StoredUser;
};

const STORAGE_KEYS = {
  displayName: "doctorDisplayName",
  phone: "doctorPhone",
  city: "doctorCity",
  bio: "doctorBio",
  profileImage: "doctorProfileImage",
  verificationSpecialization:
    "verificationSpecialization",
};

const normalizeEmail = (
  value?: string | null
) => {
  return value?.trim().toLowerCase() || "";
};

const normalizePhone = (
  value: string
) => {
  return value.replace(/[^\d+]/g, "");
};

const parseStoredUser = (
  value?: string | null
): StoredUser => {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(
      value
    ) as StoredUser;
  } catch {
    return {};
  }
};

const extractUserFromResponse = (
  responseData:
    | StoredUser
    | ProfileApiResponse
    | undefined
    | null
): StoredUser => {
  if (!responseData) {
    return {};
  }

  const possibleResponse =
    responseData as ProfileApiResponse;

  if (
    possibleResponse.user &&
    typeof possibleResponse.user ===
      "object"
  ) {
    return possibleResponse.user;
  }

  if (
    possibleResponse.data &&
    typeof possibleResponse.data ===
      "object"
  ) {
    return possibleResponse.data;
  }

  return responseData as StoredUser;
};

const getRequestErrorMessage = (
  error: unknown
): string => {
  if (axios.isAxiosError(error)) {
    return String(
      error.response?.data?.message ||
        error.response?.data?.msg ||
        error.response?.data?.error ||
        error.message ||
        "Could not update your profile."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Could not update your profile.";
};

const isLocalImageUri = (
  uri?: string | null
) => {
  if (!uri) {
    return false;
  }

  return (
    uri.startsWith("file://") ||
    uri.startsWith("content://") ||
    uri.startsWith("ph://")
  );
};

const getImageUploadData = (
  uri: string
) => {
  const cleanUri =
    uri.split("?")[0];

  const originalName =
    cleanUri.split("/").pop() ||
    `doctor-profile-${Date.now()}.jpg`;

  const hasExtension =
    /\.[a-zA-Z0-9]+$/.test(
      originalName
    );

  const name = hasExtension
    ? originalName
    : `${originalName}.jpg`;

  const extension =
    name
      .split(".")
      .pop()
      ?.toLowerCase() || "jpg";

  let type = "image/jpeg";

  if (extension === "png") {
    type = "image/png";
  }

  if (extension === "webp") {
    type = "image/webp";
  }

  return {
    uri,
    name,
    type,
  };
};

export default function PersonalInformationScreen() {
  const [
    displayName,
    setDisplayName,
  ] = useState("");

  const [email, setEmail] =
    useState("");

  const [
    specialization,
    setSpecialization,
  ] = useState("");

  const [phone, setPhone] =
    useState("");

  const [city, setCity] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [
    profileImage,
    setProfileImage,
  ] = useState<string | null>(
    null
  );

  const [
    savedSnapshot,
    setSavedSnapshot,
  ] = useState<ProfileSnapshot>({
    displayName: "",
    email: "",
    phone: "",
    city: "",
    bio: "",
    profileImage: null,
  });

  const [errors, setErrors] =
    useState<ProfileErrors>({});

  const [
    initialLoading,
    setInitialLoading,
  ] = useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    imageSourceModalVisible,
    setImageSourceModalVisible,
  ] = useState(false);

  const [
    feedbackModal,
    setFeedbackModal,
  ] =
    useState<FeedbackModalType>(
      null
    );

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const storedValues =
          await AsyncStorage.multiGet([
            "token",
            "user",
            STORAGE_KEYS.displayName,
            STORAGE_KEYS.phone,
            STORAGE_KEYS.city,
            STORAGE_KEYS.bio,
            STORAGE_KEYS.profileImage,
            STORAGE_KEYS.verificationSpecialization,
          ]);

        if (!isMounted) {
          return;
        }

        const storedData =
          Object.fromEntries(
            storedValues
          ) as Record<
            string,
            string | null
          >;

        const token =
          storedData.token;

        if (!token) {
          router.replace(
            "/auth/login" as Href
          );

          return;
        }

        const cachedUser =
          parseStoredUser(
            storedData.user
          );

        const response =
          await API.get<
            | StoredUser
            | ProfileApiResponse
          >("/auth/profile");

        const serverUser =
          extractUserFromResponse(
            response.data
          );

        const userRole =
          serverUser.role ||
          cachedUser.role;

        if (userRole !== "doctor") {
          if (userRole === "parent") {
            router.replace(
              "/parent/parentHome" as Href
            );
          } else {
            router.replace(
              "/role-selection" as Href
            );
          }

          return;
        }

        const loadedDisplayName =
          String(
            serverUser.fullName ||
              serverUser.displayName ||
              cachedUser.fullName ||
              cachedUser.displayName ||
              storedData[
                STORAGE_KEYS.displayName
              ] ||
              ""
          ).trim();

        const loadedEmail =
          normalizeEmail(
            String(
              serverUser.email ||
                cachedUser.email ||
                ""
            )
          );

        const loadedSpecialization =
          String(
            serverUser.specialization ||
              cachedUser.specialization ||
              storedData[
                STORAGE_KEYS.verificationSpecialization
              ] ||
              "Child & Adolescent Psychiatry"
          );

        /*
          الحقول دي لسه محفوظة محليًا
          لأن Endpoint التعديل الحالي
          بيدعم الاسم والإيميل والصورة.
        */
        const loadedPhone =
          storedData[
            STORAGE_KEYS.phone
          ] ||
          String(
            serverUser.phone ||
              cachedUser.phone ||
              ""
          );

        const loadedCity =
          storedData[
            STORAGE_KEYS.city
          ] ||
          String(
            serverUser.city ||
              cachedUser.city ||
              ""
          );

        const loadedBio =
          storedData[
            STORAGE_KEYS.bio
          ] ||
          String(
            serverUser.bio ||
              cachedUser.bio ||
              ""
          );

        const loadedProfileImage =
          String(
            serverUser.profilePic ||
              serverUser.profileImage ||
              serverUser.avatar ||
              cachedUser.profilePic ||
              cachedUser.profileImage ||
              cachedUser.avatar ||
              storedData[
                STORAGE_KEYS.profileImage
              ] ||
              ""
          ) || null;

        const mergedUser: StoredUser =
          {
            ...cachedUser,
            ...serverUser,

            role: "doctor",

            fullName:
              loadedDisplayName,

            displayName:
              loadedDisplayName,

            email:
              loadedEmail,

            specialization:
              loadedSpecialization,

            phone:
              loadedPhone,

            city:
              loadedCity,

            bio:
              loadedBio,

            profilePic:
              loadedProfileImage,

            profileImage:
              loadedProfileImage,

            avatar:
              loadedProfileImage,
          };

        const snapshot: ProfileSnapshot =
          {
            displayName:
              loadedDisplayName,

            email:
              loadedEmail,

            phone:
              loadedPhone,

            city:
              loadedCity,

            bio:
              loadedBio,

            profileImage:
              loadedProfileImage,
          };

        if (!isMounted) {
          return;
        }

        setDisplayName(
          loadedDisplayName
        );

        setEmail(
          loadedEmail
        );

        setSpecialization(
          loadedSpecialization
        );

        setPhone(
          loadedPhone
        );

        setCity(
          loadedCity
        );

        setBio(
          loadedBio
        );

        setProfileImage(
          loadedProfileImage
        );

        setSavedSnapshot(
          snapshot
        );

        await AsyncStorage.setItem(
          "user",
          JSON.stringify(
            mergedUser
          )
        );
      } catch (error) {
        console.log(
          "LOAD PERSONAL INFORMATION ERROR:",
          error
        );

        if (
          axios.isAxiosError(
            error
          ) &&
          (error.response?.status ===
            401 ||
            error.response?.status ===
              403)
        ) {
          await AsyncStorage.multiRemove([
            "token",
            "user",
            "verificationToken",
            "doctorAccessEnabled",
          ]);

          router.replace(
            "/auth/login" as Href
          );

          return;
        }

        if (isMounted) {
          setErrors({
            general:
              getRequestErrorMessage(
                error
              ),
          });
        }
      } finally {
        if (isMounted) {
          setInitialLoading(
            false
          );
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const currentSnapshot =
    useMemo<ProfileSnapshot>(
      () => ({
        displayName:
          displayName.trim(),

        email:
          normalizeEmail(email),

        phone:
          phone.trim(),

        city:
          city.trim(),

        bio:
          bio.trim(),

        profileImage,
      }),
      [
        displayName,
        email,
        phone,
        city,
        bio,
        profileImage,
      ]
    );

  const hasUnsavedChanges =
    useMemo(() => {
      return (
        currentSnapshot.displayName !==
          savedSnapshot.displayName ||
        currentSnapshot.email !==
          savedSnapshot.email ||
        currentSnapshot.phone !==
          savedSnapshot.phone ||
        currentSnapshot.city !==
          savedSnapshot.city ||
        currentSnapshot.bio !==
          savedSnapshot.bio ||
        currentSnapshot.profileImage !==
          savedSnapshot.profileImage
      );
    }, [
      currentSnapshot,
      savedSnapshot,
    ]);

  const clearError = (
    field: keyof ProfileErrors
  ) => {
    setErrors(
      (previousErrors) => ({
        ...previousErrors,
        [field]: undefined,
        general: undefined,
      })
    );
  };

  const handleDisplayNameChange = (
    value: string
  ) => {
    setDisplayName(value);
    clearError("displayName");
  };

  const handleEmailChange = (
    value: string
  ) => {
    setEmail(value);
    clearError("email");
  };

  const handlePhoneChange = (
    value: string
  ) => {
    setPhone(
      normalizePhone(value)
    );

    clearError("phone");
  };

  const handleCityChange = (
    value: string
  ) => {
    setCity(value);
    clearError("city");
  };

  const handleBioChange = (
    value: string
  ) => {
    setBio(value);
    clearError("bio");
  };

  const handleBack = () => {
    if (saving) {
      return;
    }

    if (hasUnsavedChanges) {
      setFeedbackModal(
        "discard_changes"
      );

      return;
    }

    router.back();
  };

  const validateForm = () => {
    const newErrors: ProfileErrors =
      {};

    const cleanName =
      displayName.trim();

    const cleanEmail =
      normalizeEmail(email);

    const cleanPhone =
      phone.trim();

    const cleanCity =
      city.trim();

    const cleanBio =
      bio.trim();

    const phoneDigits =
      cleanPhone.replace(
        /\D/g,
        ""
      );

    if (!cleanName) {
      newErrors.displayName =
        "Display name is required";
    } else if (
      cleanName.length < 3
    ) {
      newErrors.displayName =
        "Please enter your complete name";
    } else if (
      cleanName.length > 80
    ) {
      newErrors.displayName =
        "Name must not exceed 80 characters";
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail) {
      newErrors.email =
        "Email address is required";
    } else if (
      !emailRegex.test(
        cleanEmail
      )
    ) {
      newErrors.email =
        "Please enter a valid email address";
    }

    if (
      cleanPhone &&
      (phoneDigits.length < 10 ||
        phoneDigits.length > 15)
    ) {
      newErrors.phone =
        "Please enter a valid phone number";
    }

    if (
      cleanCity.length > 60
    ) {
      newErrors.city =
        "City must not exceed 60 characters";
    }

    if (
      cleanBio.length > 500
    ) {
      newErrors.bio =
        "About section must not exceed 500 characters";
    }

    setErrors(
      newErrors
    );

    return (
      Object.keys(
        newErrors
      ).length === 0
    );
  };

  const pickImageFromGallery =
    async () => {
      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          setImageSourceModalVisible(
            false
          );

          setFeedbackModal(
            "permission_denied"
          );

          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes:
                ImagePicker
                  .MediaTypeOptions
                  .Images,

              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            }
          );

        if (
          !result.canceled &&
          result.assets[0]?.uri
        ) {
          setProfileImage(
            result.assets[0].uri
          );

          clearError(
            "general"
          );
        }
      } catch (error) {
        console.log(
          "GALLERY IMAGE ERROR:",
          error
        );

        setErrors({
          general:
            "Could not open your photo library.",
        });
      } finally {
        setImageSourceModalVisible(
          false
        );
      }
    };

  const takeProfilePhoto =
    async () => {
      try {
        const permission =
          await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          setImageSourceModalVisible(
            false
          );

          setFeedbackModal(
            "permission_denied"
          );

          return;
        }

        const result =
          await ImagePicker.launchCameraAsync(
            {
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            }
          );

        if (
          !result.canceled &&
          result.assets[0]?.uri
        ) {
          setProfileImage(
            result.assets[0].uri
          );

          clearError(
            "general"
          );
        }
      } catch (error) {
        console.log(
          "CAMERA IMAGE ERROR:",
          error
        );

        setErrors({
          general:
            "Could not open your camera.",
        });
      } finally {
        setImageSourceModalVisible(
          false
        );
      }
    };

  const removeSelectedPhoto =
    () => {
      setProfileImage(
        savedSnapshot.profileImage
      );

      setImageSourceModalVisible(
        false
      );
    };

  const handleSave = async () => {
  if (saving) {
    return;
  }

  if (!validateForm()) {
    return;
  }

  try {
    setSaving(true);
    setErrors({});

    const selectedNewImage =
      Boolean(currentSnapshot.profileImage) &&
      currentSnapshot.profileImage !==
        savedSnapshot.profileImage &&
      isLocalImageUri(
        currentSnapshot.profileImage
      );

    let response;

    /*
      لو مفيش صورة جديدة:
      نبعت JSON عادي لتجنب مشكلة
      multipart Network Error.
    */
    if (
      !selectedNewImage ||
      !currentSnapshot.profileImage
    ) {
      response = await API.put<
        StoredUser | ProfileApiResponse
      >(
        "/auth/update-profile",
        {
          fullName:
            currentSnapshot.displayName,

          email:
            currentSnapshot.email,

          phone:
            currentSnapshot.phone,

          city:
            currentSnapshot.city,

          bio:
            currentSnapshot.bio,
        },
        {
          headers: {
            "Content-Type":
              "application/json",
          },

          timeout: 30000,
        }
      );
    } else {
      /*
        نستخدم FormData فقط
        عند اختيار صورة جديدة.
      */
      const formData =
        new FormData();

      formData.append(
        "fullName",
        currentSnapshot.displayName
      );

      formData.append(
        "email",
        currentSnapshot.email
      );

      formData.append(
        "phone",
        currentSnapshot.phone
      );

      formData.append(
        "city",
        currentSnapshot.city
      );

      formData.append(
        "bio",
        currentSnapshot.bio
      );

      formData.append(
        "profilePic",
        getImageUploadData(
          currentSnapshot.profileImage
        ) as any
      );

      response = await API.put<
        StoredUser | ProfileApiResponse
      >(
        "/auth/update-profile",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },

          /*
            رفع الصورة إلى Cloudinary
            قد يحتاج وقتًا أطول.
          */
          timeout: 60000,
        }
      );
    }

    const returnedUser =
      extractUserFromResponse(
        response.data
      );

    const currentStoredUser =
      parseStoredUser(
        await AsyncStorage.getItem(
          "user"
        )
      );

    const savedProfileImage =
      String(
        returnedUser.profilePic ||
          returnedUser.profileImage ||
          returnedUser.avatar ||
          (selectedNewImage
            ? currentSnapshot.profileImage
            : savedSnapshot.profileImage) ||
          ""
      ) || null;

    const mergedUser: StoredUser = {
      ...currentStoredUser,
      ...returnedUser,

      role: "doctor",

      fullName:
        currentSnapshot.displayName,

      displayName:
        currentSnapshot.displayName,

      email:
        currentSnapshot.email,

      specialization,

      phone:
        currentSnapshot.phone,

      city:
        currentSnapshot.city,

      bio:
        currentSnapshot.bio,

      profilePic:
        savedProfileImage,

      profileImage:
        savedProfileImage,

      avatar:
        savedProfileImage,
    };

    const updatedSnapshot: ProfileSnapshot =
      {
        displayName:
          currentSnapshot.displayName,

        email:
          currentSnapshot.email,

        phone:
          currentSnapshot.phone,

        city:
          currentSnapshot.city,

        bio:
          currentSnapshot.bio,

        profileImage:
          savedProfileImage,
      };

    await AsyncStorage.multiSet([
      [
        "user",
        JSON.stringify(
          mergedUser
        ),
      ],

      [
        STORAGE_KEYS.displayName,
        currentSnapshot.displayName,
      ],

      [
        STORAGE_KEYS.phone,
        currentSnapshot.phone,
      ],

      [
        STORAGE_KEYS.city,
        currentSnapshot.city,
      ],

      [
        STORAGE_KEYS.bio,
        currentSnapshot.bio,
      ],

      [
        STORAGE_KEYS.profileImage,
        savedProfileImage || "",
      ],
    ]);

    setDisplayName(
      updatedSnapshot.displayName
    );

    setEmail(
      updatedSnapshot.email
    );

    setPhone(
      updatedSnapshot.phone
    );

    setCity(
      updatedSnapshot.city
    );

    setBio(
      updatedSnapshot.bio
    );

    setProfileImage(
      updatedSnapshot.profileImage
    );

    setSavedSnapshot(
      updatedSnapshot
    );

    setFeedbackModal("saved");
  } catch (error) {
    console.log(
      "SAVE PERSONAL INFORMATION ERROR:",
      error
    );

    if (
      axios.isAxiosError(error)
    ) {
      console.log(
        "UPDATE PROFILE DETAILS:",
        {
          message:
            error.message,

          status:
            error.response?.status,

          data:
            error.response?.data,

          url:
            error.config?.url,

          baseURL:
            error.config?.baseURL,
        }
      );
    }

    const errorMessage =
      getRequestErrorMessage(error);

    setErrors({
      general:
        errorMessage,
    });

    if (
      axios.isAxiosError(error) &&
      (error.response?.status ===
        401 ||
        error.response?.status ===
          403)
    ) {
      await AsyncStorage.multiRemove([
        "token",
        "user",
        "verificationToken",
        "doctorAccessEnabled",
      ]);

      router.replace(
        "/auth/login" as Href
      );

      return;
    }

    setFeedbackModal(
      "save_error"
    );
  } finally {
    setSaving(false);
  }
};

  const closeFeedbackModal =
    () => {
      setFeedbackModal(
        null
      );
    };

  const handleFeedbackPrimaryAction =
    () => {
      if (
        feedbackModal ===
        "discard_changes"
      ) {
        setFeedbackModal(
          null
        );

        setTimeout(() => {
          router.back();
        }, 150);

        return;
      }

      if (
        feedbackModal ===
        "saved"
      ) {
        setFeedbackModal(
          null
        );

        setTimeout(() => {
          router.back();
        }, 150);

        return;
      }

      if (
        feedbackModal ===
        "save_error"
      ) {
        setFeedbackModal(
          null
        );

        setTimeout(() => {
          handleSave();
        }, 150);

        return;
      }

      closeFeedbackModal();
    };

  const feedbackContent =
    useMemo<FeedbackModalContent>(
      () => {
        switch (
          feedbackModal
        ) {
          case "saved":
            return {
              icon:
                "checkmark-circle-outline",

              iconColor:
                "#48AD5D",

              gradient: [
                "#DDF7E4",
                "#EAF5FF",
              ],

              badge:
                "Profile updated",

              badgeBackground:
                "#E7F8EB",

              badgeColor:
                "#439D56",

              title:
                "Changes saved",

              description:
                "Your personal information has been updated successfully.",

              primaryText:
                "Done",
            };

          case "save_error":
            return {
              icon:
                "alert-circle-outline",

              iconColor:
                "#D85B63",

              gradient: [
                "#FFE5E7",
                "#FFF3F4",
              ],

              badge:
                "Update failed",

              badgeBackground:
                "#FFF0F1",

              badgeColor:
                "#C8545C",

              title:
                "We could not save your changes",

              description:
                errors.general ||
                "Something went wrong while updating your profile. Please try again.",

              primaryText:
                "Try Again",

              secondaryText:
                "Cancel",
            };

          case "discard_changes":
            return {
              icon:
                "document-text-outline",

              iconColor:
                "#D58A42",

              gradient: [
                "#FFF1DE",
                "#FFE9E9",
              ],

              badge:
                "Unsaved changes",

              badgeBackground:
                "#FFF3E5",

              badgeColor:
                "#C47B37",

              title:
                "Discard your changes?",

              description:
                "The information you changed will not be saved.",

              primaryText:
                "Discard Changes",

              secondaryText:
                "Keep Editing",
            };

          case "permission_denied":
            return {
              icon:
                "lock-closed-outline",

              iconColor:
                "#6799C2",

              gradient: [
                "#DCEFFF",
                "#FFE4E6",
              ],

              badge:
                "Permission required",

              badgeBackground:
                "#EAF5FF",

              badgeColor:
                "#5C88AA",

              title:
                "Access permission is needed",

              description:
                "Allow camera or photo library access from your device settings to update your profile image.",

              primaryText:
                "Got It",
            };

          default:
            return {
              icon:
                "information-circle-outline",

              iconColor:
                "#6799C2",

              gradient: [
                "#DCEFFF",
                "#FFE4E6",
              ],

              badge:
                "Profile",

              badgeBackground:
                "#EAF5FF",

              badgeColor:
                "#5C88AA",

              title:
                "Personal information",

              description:
                "Update your profile information.",

              primaryText:
                "Done",
            };
        }
      },
      [
        feedbackModal,
        errors.general,
      ]
    );

  if (initialLoading) {
    return (
      <SafeAreaView
        style={
          styles.safeArea
        }
        edges={[
          "top",
          "bottom",
        ]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />

        <LinearGradient
          colors={[
            "#FFFFFF",
            "#FFF8F8",
            "#F7FBFF",
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
          style={
            styles.background
          }
        >
          <View
            style={
              styles.loadingContainer
            }
          >
            <ActivityIndicator
              size="large"
              color="#8DC0F0"
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Loading your profile...
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
      edges={[
        "top",
        "bottom",
      ]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <LinearGradient
        colors={[
          "#FFFFFF",
          "#FFF8F8",
          "#F7FBFF",
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
        style={
          styles.background
        }
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <ScrollView
            contentContainerStyle={
              styles.scrollContent
            }
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View
              style={styles.header}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleBack}
                disabled={saving}
                style={
                  styles.backButton
                }
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color="#1F2937"
                />
              </TouchableOpacity>

              <Text
                style={
                  styles.headerTitle
                }
              >
                Personal Information
              </Text>

              <View
                style={
                  styles.headerPlaceholder
                }
              />
            </View>

            <View
              style={
                styles.introductionCard
              }
            >
              <LinearGradient
                colors={[
                  "#DDEFFF",
                  "#FFE3E5",
                ]}
                start={{
                  x: 0,
                  y: 0,
                }}
                end={{
                  x: 1,
                  y: 1,
                }}
                style={
                  styles.introductionIcon
                }
              >
                <Ionicons
                  name="person-outline"
                  size={27}
                  color="#6D9EC8"
                />
              </LinearGradient>

              <View
                style={
                  styles.introductionContent
                }
              >
                <Text
                  style={
                    styles.pageTitle
                  }
                >
                  Update your profile
                </Text>

                <Text
                  style={
                    styles.pageSubtitle
                  }
                >
                  Manage the personal information shown
                  across your doctor account.
                </Text>
              </View>
            </View>

            <View
              style={
                styles.avatarSection
              }
            >
              <View
                style={
                  styles.avatarOuterRing
                }
              >
                <View
                  style={
                    styles.avatarContainer
                  }
                >
                  {profileImage ? (
                    <Image
                      source={{
                        uri:
                          profileImage,
                      }}
                      style={
                        styles.avatarImage
                      }
                      contentFit="cover"
                      transition={150}
                    />
                  ) : (
                    <LinearGradient
                      colors={[
                        "#E8F4FF",
                        "#FFE9EA",
                      ]}
                      start={{
                        x: 0,
                        y: 0,
                      }}
                      end={{
                        x: 1,
                        y: 1,
                      }}
                      style={
                        styles.avatarPlaceholder
                      }
                    >
                      <Ionicons
                        name="person"
                        size={45}
                        color="#7DA5C4"
                      />
                    </LinearGradient>
                  )}
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    setImageSourceModalVisible(
                      true
                    )
                  }
                  disabled={saving}
                  style={
                    styles.editPhotoButton
                  }
                >
                  <Ionicons
                    name="camera"
                    size={17}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  setImageSourceModalVisible(
                    true
                  )
                }
                disabled={saving}
                style={
                  styles.changePhotoButton
                }
              >
                <Text
                  style={
                    styles.changePhotoText
                  }
                >
                  Change profile photo
                </Text>
              </TouchableOpacity>

              <Text
                style={
                  styles.photoHelper
                }
              >
                Use a clear professional photo of yourself.
              </Text>
            </View>

            <View
              style={
                styles.formCard
              }
            >
              <SectionHeader
                icon="person-outline"
                title="Personal Details"
                subtitle="Information used inside your profile"
              />

              <InputField
                label="Display name"
                placeholder="Enter your full name"
                value={displayName}
                onChangeText={
                  handleDisplayNameChange
                }
                error={
                  errors.displayName
                }
                icon="person-outline"
                required
                editable={!saving}
                maxLength={80}
                helperText="This name will appear across your doctor account."
              />

              <InputField
                label="Email address"
                placeholder="Enter your email address"
                value={email}
                onChangeText={
                  handleEmailChange
                }
                error={
                  errors.email
                }
                icon="mail-outline"
                keyboardType="email-address"
                required
                editable={!saving}
                maxLength={120}
                autoCapitalize="none"
                helperText="Changing this email changes the email used for your next login."
              />

              <InputField
                label="Phone number"
                placeholder="Enter your phone number"
                value={phone}
                onChangeText={
                  handlePhoneChange
                }
                error={
                  errors.phone
                }
                icon="call-outline"
                keyboardType="phone-pad"
                editable={!saving}
                maxLength={16}
              />

              <InputField
                label="City"
                placeholder="Enter your city"
                value={city}
                onChangeText={
                  handleCityChange
                }
                error={
                  errors.city
                }
                icon="location-outline"
                editable={!saving}
                maxLength={60}
              />
            </View>

            <View
              style={
                styles.formCard
              }
            >
              <SectionHeader
                icon="id-card-outline"
                title="Public Profile"
                subtitle="Details visible on your doctor profile"
                pink
              />

              <ReadOnlyField
                label="Medical specialty"
                value={
                  specialization ||
                  "Child & Adolescent Psychiatry"
                }
                icon="medkit-outline"
                helperText="Professional information is managed separately and may require reverification."
              />

              <View
                style={
                  styles.fieldBlock
                }
              >
                <View
                  style={
                    styles.labelRow
                  }
                >
                  <Text
                    style={
                      styles.inputLabel
                    }
                  >
                    About you
                  </Text>

                  <Text
                    style={
                      styles.optionalLabel
                    }
                  >
                    Optional
                  </Text>
                </View>

                <View
                  style={[
                    styles.bioContainer,
                    errors.bio
                      ? styles.inputError
                      : null,
                  ]}
                >
                  <TextInput
                    value={bio}
                    onChangeText={
                      handleBioChange
                    }
                    placeholder="Write a short professional introduction..."
                    placeholderTextColor="#A6ABB1"
                    multiline
                    textAlignVertical="top"
                    maxLength={500}
                    editable={!saving}
                    style={
                      styles.bioInput
                    }
                  />

                  <Text
                    style={
                      styles.characterCounter
                    }
                  >
                    {bio.length}/500
                  </Text>
                </View>

                {errors.bio ? (
                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {errors.bio}
                  </Text>
                ) : (
                  <Text
                    style={
                      styles.helperText
                    }
                  >
                    This introduction may be visible to
                    parents viewing your verified profile.
                  </Text>
                )}
              </View>
            </View>

            <View
              style={
                styles.privacyCard
              }
            >
              <View
                style={
                  styles.privacyIcon
                }
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="#648FB4"
                />
              </View>

              <View
                style={
                  styles.privacyContent
                }
              >
                <Text
                  style={
                    styles.privacyTitle
                  }
                >
                  Your verified details are protected
                </Text>

                <Text
                  style={
                    styles.privacyText
                  }
                >
                  Your National ID, license number and
                  Medical Syndicate information cannot be
                  edited from this page.
                </Text>
              </View>
            </View>

            {errors.general ? (
              <View
                style={
                  styles.generalError
                }
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={19}
                  color="#D95A62"
                />

                <Text
                  style={
                    styles.generalErrorText
                  }
                >
                  {errors.general}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSave}
              disabled={
                saving ||
                !hasUnsavedChanges
              }
              style={[
                styles.saveButtonWrapper,

                (!hasUnsavedChanges ||
                  saving) &&
                  styles.disabledButton,
              ]}
            >
              <LinearGradient
                colors={[
                  "#A8D4F7",
                  "#F7A8AC",
                ]}
                start={{
                  x: 0,
                  y: 0.5,
                }}
                end={{
                  x: 1,
                  y: 0.5,
                }}
                style={
                  styles.saveButton
                }
              >
                {saving ? (
                  <ActivityIndicator
                    color="#25282B"
                  />
                ) : (
                  <>
                    <Text
                      style={
                        styles.saveButtonText
                      }
                    >
                      Save Changes
                    </Text>

                    <Ionicons
                      name="checkmark-outline"
                      size={19}
                      color="#25282B"
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      <Modal
        visible={
          imageSourceModalVisible
        }
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setImageSourceModalVisible(
            false
          )
        }
      >
        <Pressable
          style={
            styles.sheetOverlay
          }
          onPress={() =>
            setImageSourceModalVisible(
              false
            )
          }
        >
          <Pressable
            style={
              styles.imageSheet
            }
            onPress={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <View
              style={
                styles.sheetHandle
              }
            />

            <Text
              style={
                styles.sheetTitle
              }
            >
              Update profile photo
            </Text>

            <Text
              style={
                styles.sheetSubtitle
              }
            >
              Choose how you would like to update your
              profile image.
            </Text>

            <ImageOption
              icon="camera-outline"
              title="Take a photo"
              description="Use your device camera"
              iconColor="#6597BF"
              iconBackground="#EAF5FF"
              onPress={
                takeProfilePhoto
              }
            />

            <ImageOption
              icon="images-outline"
              title="Choose from gallery"
              description="Select an existing photo"
              iconColor="#D78289"
              iconBackground="#FFF0F1"
              onPress={
                pickImageFromGallery
              }
            />

            {profileImage &&
            profileImage !==
              savedSnapshot.profileImage &&
            isLocalImageUri(
              profileImage
            ) ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={
                  removeSelectedPhoto
                }
                style={
                  styles.removePhotoOption
                }
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color="#D85860"
                />

                <Text
                  style={
                    styles.removePhotoText
                  }
                >
                  Remove selected photo
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                setImageSourceModalVisible(
                  false
                )
              }
              style={
                styles.cancelSheetButton
              }
            >
              <Text
                style={
                  styles.cancelSheetText
                }
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={
          feedbackModal !== null
        }
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={
          closeFeedbackModal
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            <LinearGradient
              colors={
                feedbackContent.gradient
              }
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              style={
                styles.modalIcon
              }
            >
              <Ionicons
                name={
                  feedbackContent.icon
                }
                size={39}
                color={
                  feedbackContent.iconColor
                }
              />

              {feedbackModal ===
              "saved" ? (
                <View
                  style={
                    styles.successBadge
                  }
                >
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color="#FFFFFF"
                  />
                </View>
              ) : null}
            </LinearGradient>

            <View
              style={[
                styles.modalBadge,

                {
                  backgroundColor:
                    feedbackContent.badgeBackground,
                },
              ]}
            >
              <View
                style={[
                  styles.modalBadgeDot,

                  {
                    backgroundColor:
                      feedbackContent.badgeColor,
                  },
                ]}
              />

              <Text
                style={[
                  styles.modalBadgeText,

                  {
                    color:
                      feedbackContent.badgeColor,
                  },
                ]}
              >
                {feedbackContent.badge}
              </Text>
            </View>

            <Text
              style={
                styles.modalTitle
              }
            >
              {feedbackContent.title}
            </Text>

            <Text
              style={
                styles.modalDescription
              }
            >
              {feedbackContent.description}
            </Text>

            <View
              style={
                styles.modalActions
              }
            >
              {feedbackContent.secondaryText ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={
                    closeFeedbackModal
                  }
                  style={
                    styles.modalSecondaryButton
                  }
                >
                  <Text
                    style={
                      styles.modalSecondaryText
                    }
                  >
                    {feedbackContent.secondaryText}
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={
                  handleFeedbackPrimaryAction
                }
                style={[
                  styles.modalPrimaryWrapper,

                  !feedbackContent.secondaryText &&
                    styles.modalPrimaryFullWidth,
                ]}
              >
                {feedbackModal ===
                "discard_changes" ? (
                  <View
                    style={
                      styles.discardButton
                    }
                  >
                    <Text
                      style={
                        styles.discardButtonText
                      }
                    >
                      {feedbackContent.primaryText}
                    </Text>
                  </View>
                ) : (
                  <LinearGradient
                    colors={[
                      "#8DC0F0",
                      "#F9A8A7",
                    ]}
                    start={{
                      x: 0,
                      y: 0.5,
                    }}
                    end={{
                      x: 1,
                      y: 0.5,
                    }}
                    style={
                      styles.modalPrimaryButton
                    }
                  >
                    <Text
                      style={
                        styles.modalPrimaryText
                      }
                    >
                      {feedbackContent.primaryText}
                    </Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type InputFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (
    value: string
  ) => void;
  error?: string;
  icon: IoniconName;
  required?: boolean;
  editable?: boolean;
  keyboardType?:
    | "default"
    | "email-address"
    | "phone-pad"
    | "number-pad";
  maxLength?: number;
  helperText?: string;
  autoCapitalize?:
    | "none"
    | "sentences"
    | "words"
    | "characters";
};

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  icon,
  required = false,
  editable = true,
  keyboardType = "default",
  maxLength,
  helperText,
  autoCapitalize = "words",
}: InputFieldProps) {
  return (
    <View
      style={
        styles.fieldBlock
      }
    >
      <View
        style={
          styles.labelRow
        }
      >
        <Text
          style={
            styles.inputLabel
          }
        >
          {label}
        </Text>

        {required ? (
          <Text
            style={
              styles.requiredStar
            }
          >
            *
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.inputContainer,

          error
            ? styles.inputError
            : null,

          !editable
            ? styles.inputDisabled
            : null,
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color="#84919C"
        />

        <TextInput
          value={value}
          onChangeText={
            onChangeText
          }
          placeholder={
            placeholder
          }
          placeholderTextColor="#A6ABB1"
          editable={editable}
          keyboardType={
            keyboardType
          }
          autoCapitalize={
            autoCapitalize
          }
          autoCorrect={false}
          maxLength={
            maxLength
          }
          style={
            styles.input
          }
        />
      </View>

      {error ? (
        <Text
          style={
            styles.errorText
          }
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={
            styles.helperText
          }
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

function ReadOnlyField({
  label,
  value,
  icon,
  helperText,
}: {
  label: string;
  value: string;
  icon: IoniconName;
  helperText?: string;
}) {
  return (
    <View
      style={
        styles.fieldBlock
      }
    >
      <Text
        style={
          styles.inputLabel
        }
      >
        {label}
      </Text>

      <View
        style={
          styles.readOnlyContainer
        }
      >
        <Ionicons
          name={icon}
          size={19}
          color="#959DA4"
        />

        <Text
          style={
            styles.readOnlyValue
          }
          numberOfLines={2}
        >
          {value}
        </Text>

        <View
          style={
            styles.lockBadge
          }
        >
          <Ionicons
            name="lock-closed"
            size={12}
            color="#72818D"
          />
        </View>
      </View>

      {helperText ? (
        <Text
          style={
            styles.helperText
          }
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  pink = false,
}: {
  icon: IoniconName;
  title: string;
  subtitle: string;
  pink?: boolean;
}) {
  return (
    <View
      style={
        styles.sectionTitleRow
      }
    >
      <View
        style={[
          styles.sectionIcon,

          pink &&
            styles.pinkSectionIcon,
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color={
            pink
              ? "#D98289"
              : "#6798BF"
          }
        />
      </View>

      <View
        style={
          styles.sectionTitleContent
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.sectionSubtitle
          }
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function ImageOption({
  icon,
  title,
  description,
  iconColor,
  iconBackground,
  onPress,
}: {
  icon: IoniconName;
  title: string;
  description: string;
  iconColor: string;
  iconBackground: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={
        styles.imageOption
      }
    >
      <View
        style={[
          styles.imageOptionIcon,

          {
            backgroundColor:
              iconBackground,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={
            iconColor
          }
        />
      </View>

      <View
        style={
          styles.imageOptionContent
        }
      >
        <Text
          style={
            styles.imageOptionTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.imageOptionDescription
          }
        >
          {description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={19}
        color="#92999F"
      />
    </TouchableOpacity>
  );
}

const styles =
  StyleSheet.create({
    flex: {
      flex: 1,
    },

    safeArea: {
      flex: 1,
      backgroundColor:
        "#FFFFFF",
    },

    background: {
      flex: 1,
    },

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      gap: 13,
    },

    loadingText: {
      fontSize: 13,
      color:
        "#7D838A",
    },

    scrollContent: {
      paddingHorizontal:
        18,
      paddingTop: 4,
      paddingBottom:
        30,
    },

    header: {
      height: 55,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    backButton: {
      width: 40,
      height: 40,
      justifyContent:
        "center",
      alignItems:
        "flex-start",
    },

    headerTitle: {
      fontSize: 17,
      fontWeight:
        "600",
      color:
        "#22262A",
    },

    headerPlaceholder: {
      width: 40,
    },

    introductionCard: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop: 5,
      marginBottom:
        20,
    },

    introductionIcon: {
      width: 55,
      height: 55,
      borderRadius: 17,
      justifyContent:
        "center",
      alignItems:
        "center",
      marginRight: 11,
    },

    introductionContent: {
      flex: 1,
    },

    pageTitle: {
      fontSize: 18,
      fontWeight:
        "700",
      color:
        "#24282C",
    },

    pageSubtitle: {
      marginTop: 5,
      fontSize: 9.5,
      lineHeight: 15,
      color:
        "#878D93",
    },

    avatarSection: {
      alignItems:
        "center",
      marginBottom:
        22,
    },

    avatarOuterRing: {
      position:
        "relative",
      width: 112,
      height: 112,
      borderRadius: 56,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#E2F8E8",
    },

    avatarContainer: {
      width: 102,
      height: 102,
      borderRadius: 51,
      overflow:
        "hidden",
      backgroundColor:
        "#F2F4F5",
      borderWidth: 3,
      borderColor:
        "#FFFFFF",
    },

    avatarImage: {
      width: "100%",
      height: "100%",
    },

    avatarPlaceholder: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    editPhotoButton: {
      position:
        "absolute",
      right: 2,
      bottom: 5,
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#68A0C8",
      borderWidth: 3,
      borderColor:
        "#FFFFFF",
    },

    changePhotoButton: {
      marginTop: 11,
      paddingHorizontal:
        10,
      paddingVertical: 5,
    },

    changePhotoText: {
      fontSize: 11.5,
      fontWeight:
        "700",
      color:
        "#6395BC",
    },

    photoHelper: {
      marginTop: 2,
      fontSize: 8.5,
      color:
        "#999FA5",
    },

    formCard: {
      backgroundColor:
        "rgba(255,255,255,0.94)",
      borderWidth: 1,
      borderColor:
        "#E7ECEF",
      borderRadius: 16,
      paddingHorizontal:
        13,
      paddingTop: 14,
      paddingBottom: 1,
      marginBottom: 13,
    },

    sectionTitleRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 17,
    },

    sectionIcon: {
      width: 39,
      height: 39,
      borderRadius: 11,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#EAF5FF",
      marginRight: 9,
    },

    pinkSectionIcon: {
      backgroundColor:
        "#FFF0F1",
    },

    sectionTitleContent: {
      flex: 1,
    },

    sectionTitle: {
      fontSize: 13,
      fontWeight:
        "700",
      color:
        "#30353A",
    },

    sectionSubtitle: {
      marginTop: 3,
      fontSize: 8.5,
      color:
        "#90969C",
    },

    fieldBlock: {
      marginBottom: 16,
    },

    labelRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 7,
    },

    inputLabel: {
      fontSize: 10.5,
      fontWeight:
        "600",
      color:
        "#4A5055",
    },

    requiredStar: {
      marginLeft: 3,
      fontSize: 12,
      color:
        "#E98D94",
    },

    optionalLabel: {
      marginLeft: 7,
      fontSize: 8,
      color:
        "#A2A7AC",
    },

    inputContainer: {
      minHeight: 52,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 9,
      backgroundColor:
        "#F8F9FA",
      borderWidth: 1,
      borderColor:
        "#E2E7EA",
      borderRadius: 12,
      paddingHorizontal:
        12,
    },

    inputDisabled: {
      opacity: 0.6,
    },

    input: {
      flex: 1,
      fontSize: 12,
      color:
        "#252A2E",
    },

    inputError: {
      borderColor:
        "#EA666D",
    },

    errorText: {
      marginTop: 5,
      marginLeft: 3,
      fontSize: 9,
      lineHeight: 13,
      color:
        "#DC535B",
    },

    helperText: {
      marginTop: 5,
      marginLeft: 3,
      fontSize: 8,
      lineHeight: 12,
      color:
        "#969CA2",
    },

    readOnlyContainer: {
      minHeight: 52,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 9,
      backgroundColor:
        "#F1F3F4",
      borderWidth: 1,
      borderColor:
        "#E1E5E8",
      borderRadius: 12,
      paddingHorizontal:
        12,
    },

    readOnlyValue: {
      flex: 1,
      fontSize: 11.5,
      color:
        "#6A7178",
    },

    lockBadge: {
      width: 26,
      height: 26,
      borderRadius: 8,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#E5E9EC",
    },

    bioContainer: {
      minHeight: 145,
      backgroundColor:
        "#F8F9FA",
      borderWidth: 1,
      borderColor:
        "#E2E7EA",
      borderRadius: 12,
      paddingHorizontal:
        12,
      paddingTop: 11,
      paddingBottom:
        28,
    },

    bioInput: {
      minHeight: 95,
      fontSize: 11.5,
      lineHeight: 18,
      color:
        "#292E32",
    },

    characterCounter: {
      position:
        "absolute",
      right: 11,
      bottom: 9,
      fontSize: 8,
      color:
        "#969CA2",
    },

    privacyCard: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      backgroundColor:
        "#EAF5FF",
      borderRadius: 13,
      paddingHorizontal:
        12,
      paddingVertical:
        12,
      marginBottom: 14,
    },

    privacyIcon: {
      width: 37,
      height: 37,
      borderRadius: 10,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#FFFFFF",
      marginRight: 9,
    },

    privacyContent: {
      flex: 1,
    },

    privacyTitle: {
      fontSize: 10.5,
      fontWeight:
        "700",
      color:
        "#59768C",
    },

    privacyText: {
      marginTop: 5,
      fontSize: 8.8,
      lineHeight: 14,
      color:
        "#6A8397",
    },

    generalError: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      gap: 8,
      backgroundColor:
        "#FFF0F1",
      borderRadius: 12,
      paddingHorizontal:
        12,
      paddingVertical:
        11,
      marginBottom: 14,
    },

    generalErrorText: {
      flex: 1,
      fontSize: 9.5,
      lineHeight: 14,
      color:
        "#B9575E",
    },

    saveButtonWrapper: {
      width: "100%",
    },

    disabledButton: {
      opacity: 0.55,
    },

    saveButton: {
      height: 54,
      borderRadius: 999,
      flexDirection:
        "row",
      justifyContent:
        "center",
      alignItems:
        "center",
      gap: 8,
    },

    saveButtonText: {
      fontSize: 13,
      fontWeight:
        "700",
      color:
        "#25282B",
    },

    sheetOverlay: {
      flex: 1,
      justifyContent:
        "flex-end",
      backgroundColor:
        "rgba(24,30,35,0.48)",
    },

    imageSheet: {
      backgroundColor:
        "#FFFFFF",
      borderTopLeftRadius:
        27,
      borderTopRightRadius:
        27,
      paddingHorizontal:
        19,
      paddingTop: 11,
      paddingBottom: 27,
    },

    sheetHandle: {
      width: 46,
      height: 5,
      alignSelf:
        "center",
      borderRadius: 999,
      backgroundColor:
        "#D5D9DC",
      marginBottom: 18,
    },

    sheetTitle: {
      fontSize: 18,
      fontWeight:
        "700",
      color:
        "#252A2E",
    },

    sheetSubtitle: {
      marginTop: 6,
      marginBottom: 17,
      fontSize: 10,
      lineHeight: 15,
      color:
        "#898F95",
    },

    imageOption: {
      minHeight: 65,
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#F8F9FA",
      borderWidth: 1,
      borderColor:
        "#E9ECEF",
      borderRadius: 14,
      paddingHorizontal:
        11,
      marginBottom: 9,
    },

    imageOptionIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      justifyContent:
        "center",
      alignItems:
        "center",
      marginRight: 10,
    },

    imageOptionContent: {
      flex: 1,
    },

    imageOptionTitle: {
      fontSize: 12,
      fontWeight:
        "600",
      color:
        "#353A3E",
    },

    imageOptionDescription: {
      marginTop: 4,
      fontSize: 8.5,
      color:
        "#92989E",
    },

    removePhotoOption: {
      minHeight: 50,
      flexDirection:
        "row",
      justifyContent:
        "center",
      alignItems:
        "center",
      gap: 7,
      backgroundColor:
        "#FFF0F1",
      borderRadius: 13,
      marginTop: 2,
    },

    removePhotoText: {
      fontSize: 11,
      fontWeight:
        "600",
      color:
        "#D85860",
    },

    cancelSheetButton: {
      height: 48,
      justifyContent:
        "center",
      alignItems:
        "center",
      marginTop: 7,
    },

    cancelSheetText: {
      fontSize: 11.5,
      fontWeight:
        "600",
      color:
        "#747B82",
    },

    modalOverlay: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "rgba(24,30,35,0.56)",
      paddingHorizontal:
        22,
    },

    modalCard: {
      width: "100%",
      maxWidth: 390,
      alignItems:
        "center",
      backgroundColor:
        "#FFFFFF",
      borderRadius: 26,
      paddingHorizontal:
        20,
      paddingTop: 25,
      paddingBottom: 20,
      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 14,
    },

    modalIcon: {
      position:
        "relative",
      width: 91,
      height: 91,
      borderRadius: 46,
      justifyContent:
        "center",
      alignItems:
        "center",
      marginBottom: 14,
    },

    successBadge: {
      position:
        "absolute",
      right: 1,
      bottom: 3,
      width: 29,
      height: 29,
      borderRadius: 15,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#4DBA63",
      borderWidth: 3,
      borderColor:
        "#FFFFFF",
    },

    modalBadge: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
      borderRadius: 999,
      paddingHorizontal:
        11,
      paddingVertical: 7,
      marginBottom: 12,
    },

    modalBadgeDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },

    modalBadgeText: {
      fontSize: 9,
      fontWeight:
        "700",
    },

    modalTitle: {
      maxWidth: 310,
      fontSize: 21,
      lineHeight: 28,
      fontWeight:
        "700",
      color:
        "#22262A",
      textAlign:
        "center",
    },

    modalDescription: {
      maxWidth: 320,
      marginTop: 9,
      fontSize: 11,
      lineHeight: 17,
      color:
        "#858B92",
      textAlign:
        "center",
    },

    modalActions: {
      width: "100%",
      flexDirection:
        "row",
      gap: 9,
      marginTop: 21,
    },

    modalSecondaryButton: {
      flex: 1,
      height: 52,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#DDE3E7",
      borderRadius: 999,
    },

    modalSecondaryText: {
      fontSize: 11.5,
      fontWeight:
        "600",
      color:
        "#6A7279",
    },

    modalPrimaryWrapper: {
      flex: 1,
    },

    modalPrimaryFullWidth: {
      flex: 0,
      width: "100%",
    },

    modalPrimaryButton: {
      height: 52,
      justifyContent:
        "center",
      alignItems:
        "center",
      borderRadius: 999,
    },

    modalPrimaryText: {
      fontSize: 12.5,
      fontWeight:
        "700",
      color:
        "#171A1E",
    },

    discardButton: {
      height: 52,
      justifyContent:
        "center",
      alignItems:
        "center",
      borderRadius: 999,
      backgroundColor:
        "#E8656C",
    },

    discardButtonText: {
      fontSize: 12,
      fontWeight:
        "700",
      color:
        "#FFFFFF",
    },
  });