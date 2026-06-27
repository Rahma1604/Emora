import React, {
  useCallback,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
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
  useFocusEffect,
} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import API from "../api";

const doctorPhoto = require("../../assets/images/images/doctor.png");

type IoniconName =
  keyof typeof Ionicons.glyphMap;

type DoctorData = {
  id?: string | number;
  _id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: string;
  profilePic?: string;

  specialization?: string;
  professionalType?: string;
  university?: string;

  graduationYear?: number | string;
  yearsOfExperience?: number | string;

  practiceLicenseNumber?: string;
  syndicateRegistrationNumber?: string;

  verificationStatus?: string;
  verificationStep?: string;
  isVerified?: boolean;

  [key: string]: unknown;
};

type HistoryStats = {
  totalCases: number;
  pending: number;
  reviewed: number;
  closed: number;
  improving: number;
  avgTimeMinutes: number;
};

type DashboardStats = {
  pendingCases: number;
  reviewedCases: number;
  newThisWeek: number;
  childrenFollowed: number;
};

type BottomNavItemProps = {
  icon: IoniconName;
  activeIcon: IoniconName;
  label: string;
  active?: boolean;
  onPress: () => void;
};

type SettingRowProps = {
  icon: IoniconName;
  title: string;
  onPress?: () => void;
  rightText?: string;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (
    value: boolean
  ) => void;
  isLast?: boolean;
  darkMode?: boolean;
};

const EMPTY_HISTORY_STATS: HistoryStats = {
  totalCases: 0,
  pending: 0,
  reviewed: 0,
  closed: 0,
  improving: 0,
  avgTimeMinutes: 0,
};

const EMPTY_DASHBOARD_STATS: DashboardStats = {
  pendingCases: 0,
  reviewedCases: 0,
  newThisWeek: 0,
  childrenFollowed: 0,
};

const getErrorMessage = (
  error: unknown
): string => {
  if (axios.isAxiosError(error)) {
    return String(
      error.response?.data?.msg ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Could not load your profile."
    );
  }

  return error instanceof Error
    ? error.message
    : "Could not load your profile.";
};

const normalizeStatus = (
  value: unknown
):
  | "approved"
  | "pending"
  | "rejected"
  | "draft"
  | "not_started" => {
  if (
    value === "approved" ||
    value === "verified"
  ) {
    return "approved";
  }

  if (
    value === "pending" ||
    value === "under_review"
  ) {
    return "pending";
  }

  if (
    value === "rejected" ||
    value === "changes_required" ||
    value === "expired" ||
    value === "suspended"
  ) {
    return "rejected";
  }

  if (value === "draft") {
    return "draft";
  }

  return "not_started";
};

const formatDoctorName = (
  value?: string
): string => {
  const cleanName = String(
    value || "Doctor"
  ).trim();

  if (
    cleanName
      .toLowerCase()
      .startsWith("dr.")
  ) {
    return cleanName;
  }

  return `Dr. ${cleanName}`;
};

const getDisplayValue = (
  value: unknown,
  fallback = "Not provided"
): string => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return String(value);
};

export default function DoctorProfileScreen() {
  const [doctor, setDoctor] =
    useState<DoctorData>({});

  const [doctorName, setDoctorName] =
    useState("Doctor");

  const [doctorEmail, setDoctorEmail] =
    useState("");

  const [
    specialization,
    setSpecialization,
  ] = useState(
    "Not provided"
  );

  const [
    professionalType,
    setProfessionalType,
  ] = useState(
    "Not provided"
  );

  const [university, setUniversity] =
    useState("Not provided");

  const [
    graduationYear,
    setGraduationYear,
  ] = useState("Not provided");

  const [
    experienceYears,
    setExperienceYears,
  ] = useState("0");

  const [
    profilePicture,
    setProfilePicture,
  ] = useState("");

  const [
    historyStats,
    setHistoryStats,
  ] = useState<HistoryStats>(
    EMPTY_HISTORY_STATS
  );

  const [
    dashboardStats,
    setDashboardStats,
  ] = useState<DashboardStats>(
    EMPTY_DASHBOARD_STATS
  );

  const [
    initialLoading,
    setInitialLoading,
  ] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    profileError,
    setProfileError,
  ] = useState("");

  const [darkMode, setDarkMode] =
    useState(false);

  const [
    logoutModalVisible,
    setLogoutModalVisible,
  ] = useState(false);

  const [
    logoutLoading,
    setLogoutLoading,
  ] = useState(false);

  const applyDoctorData =
    useCallback(
      (doctorData: DoctorData) => {
        const rawName =
          doctorData.fullName ||
          doctorData.name ||
          "Doctor";

        setDoctor(doctorData);

        setDoctorName(
          formatDoctorName(rawName)
        );

        setDoctorEmail(
          getDisplayValue(
            doctorData.email,
            "No email available"
          )
        );

        setSpecialization(
          getDisplayValue(
            doctorData.specialization
          )
        );

        setProfessionalType(
          getDisplayValue(
            doctorData.professionalType
          )
        );

        setUniversity(
          getDisplayValue(
            doctorData.university
          )
        );

        setGraduationYear(
          getDisplayValue(
            doctorData.graduationYear
          )
        );

        setExperienceYears(
          getDisplayValue(
            doctorData.yearsOfExperience,
            "0"
          )
        );

        setProfilePicture(
          typeof doctorData.profilePic ===
            "string"
            ? doctorData.profilePic
            : ""
        );
      },
      []
    );

  const redirectInvalidDoctor =
    useCallback(
      (
        status: ReturnType<
          typeof normalizeStatus
        >,
        currentStep?: string
      ) => {
        if (status === "pending") {
          router.replace(
            "/doctor/doctor-verification/pending" as Href
          );

          return;
        }

        if (status === "rejected") {
          router.replace(
            "/doctor/doctor-verification/rejected" as Href
          );

          return;
        }

        if (status === "draft") {
          switch (currentStep) {
            case "documents":
              router.replace(
                "/doctor/doctor-verification/documents" as Href
              );
              return;

            case "review":
            case "submitted":
              router.replace(
                "/doctor/doctor-verification/review" as Href
              );
              return;

            case "professional-info":
            case "professional_info":
              router.replace(
                "/doctor/doctor-verification/professional-info" as Href
              );
              return;

            default:
              router.replace(
                "/doctor/doctor-verification/intro" as Href
              );
              return;
          }
        }

        router.replace(
          "/doctor/doctor-verification/intro" as Href
        );
      },
      []
    );

  const loadProfileData =
    useCallback(async () => {
      setProfileError("");

      try {
        const [
          token,
          storedUserValue,
          storedDarkMode,
        ] =
          await Promise.all([
            AsyncStorage.getItem(
              "token"
            ),
            AsyncStorage.getItem(
              "user"
            ),
            AsyncStorage.getItem(
              "doctorDarkMode"
            ),
          ]);

        if (
          storedDarkMode !== null
        ) {
          setDarkMode(
            storedDarkMode === "true"
          );
        }

        let cachedDoctor: DoctorData =
          {};

        if (storedUserValue) {
          try {
            cachedDoctor =
              JSON.parse(
                storedUserValue
              ) as DoctorData;

            if (
              cachedDoctor.role ===
                "doctor" ||
              !cachedDoctor.role
            ) {
              applyDoctorData(
                cachedDoctor
              );
            }
          } catch (error) {
            console.log(
              "Could not parse cached doctor:",
              error
            );
          }
        }

        if (!token) {
          router.replace(
            "/auth/login" as Href
          );

          return;
        }

        const profileResponse =
          await API.get<DoctorData>(
            "/auth/profile"
          );

        const serverDoctor =
          profileResponse.data;

        if (
          serverDoctor.role !==
          "doctor"
        ) {
          if (
            serverDoctor.role ===
            "parent"
          ) {
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

        const status =
          normalizeStatus(
            serverDoctor.verificationStatus
          );

        if (status !== "approved") {
          redirectInvalidDoctor(
            status,
            serverDoctor.verificationStep
          );

          return;
        }

        const mergedDoctor: DoctorData =
          {
            ...cachedDoctor,
            ...serverDoctor,

            id:
              serverDoctor.id ||
              serverDoctor._id ||
              cachedDoctor.id,

            role: "doctor",

            verificationStatus:
              "approved",

            isVerified: true,
          };

        applyDoctorData(
          mergedDoctor
        );

        await AsyncStorage.multiSet([
          [
            "user",
            JSON.stringify(
              mergedDoctor
            ),
          ],
          ["role", "doctor"],
          [
            "verificationStatus",
            "approved",
          ],
        ]);

        const [
          historyResult,
          dashboardResult,
        ] = await Promise.allSettled([
          API.get<HistoryStats>(
            "/doctor/history-stats"
          ),
          API.get<DashboardStats>(
            "/doctor/dashboard-stats"
          ),
        ]);

        if (
          historyResult.status ===
          "fulfilled"
        ) {
          const stats =
            historyResult.value.data;

          setHistoryStats({
            totalCases:
              Number(
                stats.totalCases
              ) || 0,

            pending:
              Number(
                stats.pending
              ) || 0,

            reviewed:
              Number(
                stats.reviewed
              ) || 0,

            closed:
              Number(
                stats.closed
              ) || 0,

            improving:
              Number(
                stats.improving
              ) || 0,

            avgTimeMinutes:
              Number(
                stats.avgTimeMinutes
              ) || 0,
          });
        } else {
          console.log(
            "Could not load history stats:",
            historyResult.reason
          );
        }

        if (
          dashboardResult.status ===
          "fulfilled"
        ) {
          const stats =
            dashboardResult.value.data;

          setDashboardStats({
            pendingCases:
              Number(
                stats.pendingCases
              ) || 0,

            reviewedCases:
              Number(
                stats.reviewedCases
              ) || 0,

            newThisWeek:
              Number(
                stats.newThisWeek
              ) || 0,

            childrenFollowed:
              Number(
                stats.childrenFollowed
              ) || 0,
          });
        } else {
          console.log(
            "Could not load dashboard stats:",
            dashboardResult.reason
          );
        }
      } catch (error) {
        console.log(
          "LOAD DOCTOR PROFILE ERROR:",
          error
        );

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

        setProfileError(
          getErrorMessage(error)
        );
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }, [
      applyDoctorData,
      redirectInvalidDoctor,
    ]);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  const handleRefresh =
    useCallback(async () => {
      setRefreshing(true);

      await loadProfileData();
    }, [loadProfileData]);

  const handleDarkModeChange =
    async (value: boolean) => {
      setDarkMode(value);

      try {
        await AsyncStorage.setItem(
          "doctorDarkMode",
          String(value)
        );
      } catch (error) {
        console.log(
          "Error saving dark mode setting:",
          error
        );
      }
    };

  const openDoctorScreen = (
    screen: string
  ) => {
    router.push(
      `/doctor/${screen}` as Href
    );
  };

  const openHome = () => {
    router.replace(
      "/doctor/home" as Href
    );
  };

  const openHistory = () => {
    router.replace(
      "/doctor/history" as Href
    );
  };

  const openInsights = () => {
    router.replace(
      "/doctor/insights" as Href
    );
  };

  const openPersonalInformation =
    () => {
      openDoctorScreen(
        "personal-information"
      );
    };

  const openChangePassword = () => {
    openDoctorScreen(
      "change-password"
    );
  };

  const openNotificationSettings =
    () => {
      openDoctorScreen(
        "notification-settings"
      );
    };

  const openPrivacySecurity = () => {
    openDoctorScreen(
      "privacy-security"
    );
  };

  const openLanguage = () => {
    openDoctorScreen("language");
  };

  const openHelpSupport = () => {
    openDoctorScreen(
      "help-support"
    );
  };

  const openTermsConditions = () => {
    openDoctorScreen(
      "terms-conditions"
    );
  };

  const handleLogout = async () => {
    if (logoutLoading) {
      return;
    }

    try {
      setLogoutLoading(true);

      await AsyncStorage.multiRemove([
        "token",
        "user",
        "verificationToken",
        "doctorAccessEnabled",
        "pendingVerificationEmail",
      ]);

      await AsyncStorage.setItem(
        "role",
        "doctor"
      );

      setLogoutModalVisible(false);

      router.replace(
        "/auth/login" as Href
      );
    } catch (error) {
      console.log(
        "Logout error:",
        error
      );

      Alert.alert(
        "Logout failed",
        "Something went wrong while logging out. Please try again."
      );
    } finally {
      setLogoutLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          darkMode &&
            styles.darkSafeArea,
        ]}
        edges={["top", "bottom"]}
      >
        <StatusBar
          barStyle={
            darkMode
              ? "light-content"
              : "dark-content"
          }
          backgroundColor={
            darkMode
              ? "#15171A"
              : "#FFFFFF"
          }
        />

        <LinearGradient
          colors={
            darkMode
              ? [
                  "#15171A",
                  "#1B1D21",
                  "#17191C",
                ]
              : [
                  "#FFFFFF",
                  "#FFF9F9",
                  "#F8FCFF",
                ]
          }
          style={styles.background}
        >
          <View
            style={
              styles.loadingContainer
            }
          >
            <LinearGradient
              colors={[
                "#DCEFFF",
                "#FFE5E6",
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
                styles.loadingIcon
              }
            >
              <Ionicons
                name="person-outline"
                size={42}
                color="#6D9EC8"
              />
            </LinearGradient>

            <ActivityIndicator
              size="large"
              color="#8DC0F0"
              style={{
                marginTop: 20,
              }}
            />

            <Text
              style={[
                styles.loadingTitle,
                darkMode &&
                  styles.darkMainText,
              ]}
            >
              Loading your profile
            </Text>

            <Text
              style={[
                styles.loadingDescription,
                darkMode &&
                  styles.darkSecondaryText,
              ]}
            >
              Please wait while we load
              your professional information.
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const reviewedCases =
    historyStats.reviewed ||
    dashboardStats.reviewedCases;

  const averageReviewTime =
    historyStats.avgTimeMinutes;

  const averageReviewTimeValue =
    Number.isInteger(
      averageReviewTime
    )
      ? String(averageReviewTime)
      : averageReviewTime.toFixed(1);

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        darkMode &&
          styles.darkSafeArea,
      ]}
      edges={["top"]}
    >
      <StatusBar
        barStyle={
          darkMode
            ? "light-content"
            : "dark-content"
        }
        backgroundColor={
          darkMode
            ? "#15171A"
            : "#FFFFFF"
        }
      />

      <LinearGradient
        colors={
          darkMode
            ? [
                "#15171A",
                "#1B1D21",
                "#17191C",
              ]
            : [
                "#FFFFFF",
                "#FFF9F9",
                "#F8FCFF",
              ]
        }
        locations={[0, 0.5, 1]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 1,
        }}
        style={styles.background}
      >
        <View
          style={
            styles.mainContainer
          }
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={
              styles.scrollContent
            }
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={
                  handleRefresh
                }
                tintColor="#8DC0F0"
                colors={[
                  "#8DC0F0",
                ]}
              />
            }
          >
            <View
              style={styles.header}
            >
              <TouchableOpacity
                style={
                  styles.backButton
                }
                activeOpacity={0.7}
                onPress={() =>
                  router.back()
                }
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={
                    darkMode
                      ? "#FFFFFF"
                      : "#1F2937"
                  }
                />
              </TouchableOpacity>

              <Text
                style={[
                  styles.headerTitle,
                  darkMode &&
                    styles.darkMainText,
                ]}
              >
                Profile
              </Text>

              <View
                style={
                  styles.headerPlaceholder
                }
              />
            </View>

            {profileError ? (
              <View
                style={[
                  styles.errorCard,
                  darkMode &&
                    styles.darkErrorCard,
                ]}
              >
                <Ionicons
                  name="cloud-offline-outline"
                  size={20}
                  color="#C86469"
                />

                <View
                  style={
                    styles.errorContent
                  }
                >
                  <Text
                    style={
                      styles.errorTitle
                    }
                  >
                    Could not refresh profile
                  </Text>

                  <Text
                    style={[
                      styles.errorDescription,
                      darkMode &&
                        styles.darkSecondaryText,
                    ]}
                  >
                    {profileError}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={
                    handleRefresh
                  }
                  style={
                    styles.retryButton
                  }
                >
                  <Text
                    style={
                      styles.retryText
                    }
                  >
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View
              style={
                styles.profileHeader
              }
            >
              <View
                style={
                  styles.avatarContainer
                }
              >
                <Image
                  source={
                    profilePicture
                      ? {
                          uri:
                            profilePicture,
                        }
                      : doctorPhoto
                  }
                  style={
                    styles.doctorAvatar
                  }
                  contentFit="cover"
                  transition={150}
                />

                <View
                  style={
                    styles.verifiedAvatarBadge
                  }
                >
                  <Ionicons
                    name="checkmark"
                    size={10}
                    color="#FFFFFF"
                  />
                </View>
              </View>

              <Text
                style={[
                  styles.doctorName,
                  darkMode &&
                    styles.darkMainText,
                ]}
              >
                {doctorName}
              </Text>

              <Text
                style={[
                  styles.specialization,
                  darkMode &&
                    styles.darkSecondaryText,
                ]}
              >
                {specialization}
              </Text>

              <View
                style={styles.emailRow}
              >
                <Ionicons
                  name="mail-outline"
                  size={13}
                  color={
                    darkMode
                      ? "#ADB2B9"
                      : "#5F656B"
                  }
                />

                <Text
                  style={[
                    styles.emailText,
                    darkMode &&
                      styles.darkSecondaryText,
                  ]}
                >
                  {doctorEmail}
                </Text>
              </View>

              <View
                style={
                  styles.verifiedBadge
                }
              >
                <Text
                  style={
                    styles.verifiedBadgeText
                  }
                >
                  VERIFIED SPECIALIST
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.sectionTitle,
                darkMode &&
                  styles.darkMainText,
              ]}
            >
              Professional Overview
            </Text>

            <View
              style={
                styles.statisticsGrid
              }
            >
              <StatisticCard
                title="Cases Reviewed"
                value={String(
                  reviewedCases
                )}
                valueColor="#1D83D4"
                darkMode={darkMode}
              />

              <StatisticCard
                title="Pending Cases"
                value={String(
                  historyStats.pending ||
                    dashboardStats.pendingCases
                )}
                valueColor="#E49A3C"
                darkMode={darkMode}
              />

              <StatisticCard
                title="Children Followed"
                value={String(
                  dashboardStats.childrenFollowed
                )}
                valueColor="#159647"
                darkMode={darkMode}
              />

              <StatisticCard
                title="Avg Review Time"
                value={
                  averageReviewTimeValue
                }
                suffix="min"
                valueColor={
                  darkMode
                    ? "#FFFFFF"
                    : "#202428"
                }
                darkMode={darkMode}
              />
            </View>

            <View
              style={[
                styles.infoCard,
                darkMode &&
                  styles.darkCard,
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  darkMode &&
                    styles.darkMainText,
                ]}
              >
                About
              </Text>

              <Text
                style={[
                  styles.aboutText,
                  darkMode &&
                    styles.darkSecondaryText,
                ]}
              >
                Experienced {specialization} dedicated to
                supporting children&apos;s emotional
                well-being, behavioral development and
                mental health through professional
                assessment and guidance.
              </Text>
            </View>

            <ProfessionalDetailsCard
              specialization={
                specialization
              }
              professionalType={
                professionalType
              }
              experienceYears={
                experienceYears
              }
              university={university}
              graduationYear={
                graduationYear
              }
              verificationStatus={
                doctor.verificationStatus
              }
              darkMode={darkMode}
            />

            <View
              style={[
                styles.infoCard,
                darkMode &&
                  styles.darkCard,
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  darkMode &&
                    styles.darkMainText,
                ]}
              >
                Achievements
              </Text>

              <View
                style={
                  styles.achievementsContainer
                }
              >
                <AchievementChip
                  icon="shield-checkmark-outline"
                  label={`${reviewedCases} Cases Reviewed`}
                  backgroundColor="#E6E4FF"
                  color="#4851B4"
                />

                <AchievementChip
                  icon="people-outline"
                  label={`${dashboardStats.childrenFollowed} Children Followed`}
                  backgroundColor="#DDEFF8"
                  color="#4D788D"
                />

                <AchievementChip
                  icon="ribbon-outline"
                  label="Verified Specialist"
                  backgroundColor="#E1F0E2"
                  color="#4E7352"
                />
              </View>
            </View>

            <View
              style={[
                styles.settingsCard,
                darkMode &&
                  styles.darkCard,
              ]}
            >
              <Text
                style={[
                  styles.settingsTitle,
                  darkMode &&
                    styles.darkMainText,
                ]}
              >
                Account Settings
              </Text>

              <SettingRow
                icon="person-outline"
                title="Personal Information"
                onPress={
                  openPersonalInformation
                }
                darkMode={darkMode}
              />

              <SettingRow
                icon="lock-closed-outline"
                title="Change Password"
                onPress={
                  openChangePassword
                }
                darkMode={darkMode}
              />

              <SettingRow
                icon="notifications-outline"
                title="Notification Settings"
                onPress={
                  openNotificationSettings
                }
                darkMode={darkMode}
              />

              <SettingRow
                icon="shield-checkmark-outline"
                title="Privacy & Security"
                onPress={
                  openPrivacySecurity
                }
                darkMode={darkMode}
              />

              <SettingRow
                icon="language-outline"
                title="Language"
                rightText="English"
                isLast
                onPress={
                  openLanguage
                }
                darkMode={darkMode}
              />
            </View>

            <View
              style={[
                styles.settingsCard,
                darkMode &&
                  styles.darkCard,
              ]}
            >
              <Text
                style={[
                  styles.settingsTitle,
                  darkMode &&
                    styles.darkMainText,
                ]}
              >
                App Settings
              </Text>

              <SettingRow
                icon="moon-outline"
                title="Dark Mode"
                showSwitch
                switchValue={darkMode}
                onSwitchChange={
                  handleDarkModeChange
                }
                darkMode={darkMode}
              />

              <SettingRow
                icon="help-circle-outline"
                title="Help & Support"
                onPress={
                  openHelpSupport
                }
                darkMode={darkMode}
              />

              <SettingRow
                icon="document-text-outline"
                title="Terms & Conditions"
                isLast
                onPress={
                  openTermsConditions
                }
                darkMode={darkMode}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() =>
                setLogoutModalVisible(
                  true
                )
              }
              style={
                styles.logoutButtonWrapper
              }
            >
              <LinearGradient
                colors={
                  darkMode
                    ? [
                        "#302426",
                        "#38282B",
                      ]
                    : [
                        "#FFF7F7",
                        "#FFF1F2",
                      ]
                }
                start={{
                  x: 0,
                  y: 0,
                }}
                end={{
                  x: 1,
                  y: 0,
                }}
                style={[
                  styles.logoutButton,
                  darkMode &&
                    styles.darkLogoutButton,
                ]}
              >
                <View
                  style={[
                    styles.logoutIconWrapper,
                    darkMode &&
                      styles.darkLogoutIconWrapper,
                  ]}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={19}
                    color="#D65A59"
                  />
                </View>

                <View
                  style={
                    styles.logoutContent
                  }
                >
                  <Text
                    style={
                      styles.logoutText
                    }
                  >
                    Logout
                  </Text>

                  <Text
                    style={[
                      styles.logoutDescription,
                      darkMode &&
                        styles.darkLogoutDescription,
                    ]}
                  >
                    Sign out of your account
                  </Text>
                </View>

                <View
                  style={[
                    styles.logoutArrow,
                    darkMode &&
                      styles.darkLogoutArrow,
                  ]}
                >
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#D65A59"
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>

          <View
            style={[
              styles.bottomNavigation,
              darkMode &&
                styles.darkBottomNavigation,
            ]}
          >
            <BottomNavItem
              icon="home-outline"
              activeIcon="home"
              label="Home"
              onPress={openHome}
              darkMode={darkMode}
            />

            <BottomNavItem
              icon="document-text-outline"
              activeIcon="document-text"
              label="History"
              onPress={openHistory}
              darkMode={darkMode}
            />

            <BottomNavItem
              icon="stats-chart-outline"
              activeIcon="stats-chart"
              label="Insights"
              onPress={openInsights}
              darkMode={darkMode}
            />

            <BottomNavItem
              icon="person-outline"
              activeIcon="person"
              label="Profile"
              active
              onPress={() =>
                undefined
              }
              darkMode={darkMode}
            />
          </View>

          <Modal
            visible={
              logoutModalVisible
            }
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => {
              if (!logoutLoading) {
                setLogoutModalVisible(
                  false
                );
              }
            }}
          >
            <Pressable
              style={
                styles.logoutModalOverlay
              }
              onPress={() => {
                if (!logoutLoading) {
                  setLogoutModalVisible(
                    false
                  );
                }
              }}
            >
              <Pressable
                style={[
                  styles.logoutModalCard,
                  darkMode &&
                    styles.darkLogoutModalCard,
                ]}
                onPress={(event) =>
                  event.stopPropagation()
                }
              >
                <LinearGradient
                  colors={
                    darkMode
                      ? [
                          "#313D47",
                          "#473035",
                        ]
                      : [
                          "#EAF5FD",
                          "#FFF0F1",
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
                  style={
                    styles.logoutModalIcon
                  }
                >
                  <Ionicons
                    name="log-out-outline"
                    size={27}
                    color="#D65A59"
                  />
                </LinearGradient>

                <Text
                  style={[
                    styles.logoutModalTitle,
                    darkMode &&
                      styles.darkMainText,
                  ]}
                >
                  Logout?
                </Text>

                <Text
                  style={[
                    styles.logoutModalDescription,
                    darkMode &&
                      styles.darkSecondaryText,
                  ]}
                >
                  Are you sure you want to log out of your
                  account?
                </Text>

                <View
                  style={[
                    styles.logoutModalInfo,
                    darkMode &&
                      styles.darkLogoutModalInfo,
                  ]}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={17}
                    color="#5E88A7"
                  />

                  <Text
                    style={[
                      styles.logoutModalInfoText,
                      darkMode &&
                        styles.darkLogoutModalInfoText,
                    ]}
                  >
                    You will need to sign in again to access
                    your cases, reviews and professional
                    profile.
                  </Text>
                </View>

                <View
                  style={
                    styles.logoutModalActions
                  }
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={
                      logoutLoading
                    }
                    style={[
                      styles.logoutCancelButton,
                      darkMode &&
                        styles.darkLogoutCancelButton,
                    ]}
                    onPress={() =>
                      setLogoutModalVisible(
                        false
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.logoutCancelText,
                        darkMode &&
                          styles.darkMainText,
                      ]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    disabled={
                      logoutLoading
                    }
                    style={
                      styles.logoutConfirmWrapper
                    }
                    onPress={
                      handleLogout
                    }
                  >
                    <LinearGradient
                      colors={[
                        "#F7B7BB",
                        "#F3949C",
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
                        styles.logoutConfirmButton,
                        logoutLoading &&
                          styles.logoutConfirmDisabled,
                      ]}
                    >
                      {logoutLoading ? (
                        <ActivityIndicator
                          size="small"
                          color="#FFFFFF"
                        />
                      ) : (
                        <>
                          <Ionicons
                            name="log-out-outline"
                            size={17}
                            color="#FFFFFF"
                          />

                          <Text
                            style={
                              styles.logoutConfirmText
                            }
                          >
                            Logout
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

function StatisticCard({
  title,
  value,
  suffix,
  valueColor,
  darkMode,
}: {
  title: string;
  value: string;
  suffix?: string;
  valueColor: string;
  darkMode: boolean;
}) {
  return (
    <View
      style={[
        styles.statisticCard,
        darkMode &&
          styles.darkCard,
      ]}
    >
      <Text
        style={[
          styles.statisticTitle,
          darkMode &&
            styles.darkSecondaryText,
        ]}
      >
        {title}
      </Text>

      <View
        style={
          styles.statisticValueRow
        }
      >
        <Text
          style={[
            styles.statisticValue,
            {
              color:
                valueColor,
            },
          ]}
        >
          {value}
        </Text>

        {suffix ? (
          <Text
            style={[
              styles.statisticSuffix,
              darkMode &&
                styles.darkSecondaryText,
            ]}
          >
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function ProfessionalDetailsCard({
  specialization,
  professionalType,
  experienceYears,
  university,
  graduationYear,
  verificationStatus,
  darkMode,
}: {
  specialization: string;
  professionalType: string;
  experienceYears: string;
  university: string;
  graduationYear: string;
  verificationStatus?: string;
  darkMode: boolean;
}) {
  const isApproved =
    normalizeStatus(
      verificationStatus
    ) === "approved";

  return (
    <View
      style={[
        styles.infoCard,
        darkMode &&
          styles.darkCard,
      ]}
    >
      <Text
        style={[
          styles.cardTitle,
          darkMode &&
            styles.darkMainText,
        ]}
      >
        Professional Details
      </Text>

      <DetailRow
        label="Professional Type"
        value={professionalType}
        darkMode={darkMode}
      />

      <DetailRow
        label="Specialization"
        value={specialization}
        darkMode={darkMode}
      />

      <DetailRow
        label="Experience"
        value={`${experienceYears} Years`}
        darkMode={darkMode}
      />

      <DetailRow
        label="University"
        value={university}
        darkMode={darkMode}
      />

      <DetailRow
        label="Graduation Year"
        value={graduationYear}
        darkMode={darkMode}
      />

      <View
        style={
          styles.detailRow
        }
      >
        <Text
          style={[
            styles.detailLabel,
            darkMode &&
              styles.darkSecondaryText,
          ]}
        >
          License Status
        </Text>

        <View
          style={
            isApproved
              ? styles.licenseBadge
              : styles.pendingLicenseBadge
          }
        >
          <Text
            style={
              isApproved
                ? styles.licenseBadgeText
                : styles.pendingLicenseBadgeText
            }
          >
            {isApproved
              ? "Verified"
              : "Pending"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
  darkMode,
}: {
  label: string;
  value: string;
  darkMode: boolean;
}) {
  return (
    <View
      style={
        styles.detailRow
      }
    >
      <Text
        style={[
          styles.detailLabel,
          darkMode &&
            styles.darkSecondaryText,
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.detailValue,
          darkMode &&
            styles.darkMainText,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function AchievementChip({
  icon,
  label,
  backgroundColor,
  color,
}: {
  icon: IoniconName;
  label: string;
  backgroundColor: string;
  color: string;
}) {
  return (
    <View
      style={[
        styles.achievementChip,
        {
          backgroundColor,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={14}
        color={color}
      />

      <Text
        style={[
          styles.achievementText,
          {
            color,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function SettingRow({
  icon,
  title,
  onPress,
  rightText,
  showSwitch = false,
  switchValue = false,
  onSwitchChange,
  isLast = false,
  darkMode = false,
}: SettingRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={
        showSwitch
          ? 1
          : 0.75
      }
      onPress={
        showSwitch
          ? undefined
          : onPress
      }
      style={[
        styles.settingRow,
        !isLast &&
          styles.settingRowBorder,
        !isLast &&
          darkMode &&
          styles.darkSettingRowBorder,
      ]}
    >
      <View
        style={
          styles.settingLeft
        }
      >
        <View
          style={[
            styles.settingIconWrapper,
            darkMode &&
              styles.darkSettingIconWrapper,
          ]}
        >
          <Ionicons
            name={icon}
            size={19}
            color={
              darkMode
                ? "#FFFFFF"
                : "#34393E"
            }
          />
        </View>

        <Text
          style={[
            styles.settingText,
            darkMode &&
              styles.darkMainText,
          ]}
        >
          {title}
        </Text>
      </View>

      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={
            onSwitchChange
          }
          trackColor={{
            false:
              "#C8CBD0",
            true:
              "#8DC0F0",
          }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#C8CBD0"
        />
      ) : (
        <View
          style={
            styles.settingRight
          }
        >
          {rightText ? (
            <Text
              style={[
                styles.settingRightText,
                darkMode &&
                  styles.darkSecondaryText,
              ]}
            >
              {rightText}
            </Text>
          ) : null}

          <Ionicons
            name="chevron-forward"
            size={19}
            color={
              darkMode
                ? "#FFFFFF"
                : "#262B2F"
            }
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

function BottomNavItem({
  icon,
  activeIcon,
  label,
  active = false,
  onPress,
  darkMode = false,
}: BottomNavItemProps & {
  darkMode?: boolean;
}) {
  const inactiveColor =
    darkMode
      ? "#747A82"
      : "#A2A6AC";

  return (
    <TouchableOpacity
      style={
        styles.bottomNavItem
      }
      activeOpacity={0.75}
      onPress={onPress}
    >
      <Ionicons
        name={
          active
            ? activeIcon
            : icon
        }
        size={20}
        color={
          active
            ? "#5E88A7"
            : inactiveColor
        }
      />

      <Text
        style={[
          styles.bottomNavLabel,
          darkMode && {
            color:
              inactiveColor,
          },
          active &&
            styles.bottomNavLabelActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        "#FFFFFF",
    },

    darkSafeArea: {
      backgroundColor:
        "#15171A",
    },

    background: {
      flex: 1,
    },

    mainContainer: {
      flex: 1,
    },

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      paddingHorizontal:
        28,
    },

    loadingIcon: {
      width: 104,
      height: 104,
      borderRadius: 52,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    loadingTitle: {
      marginTop: 16,
      fontSize: 19,
      fontWeight:
        "700",
      color:
        "#25292D",
    },

    loadingDescription: {
      maxWidth: 290,
      marginTop: 8,
      fontSize: 11,
      lineHeight: 17,
      color:
        "#858B92",
      textAlign:
        "center",
    },

    scrollView: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal:
        18,
      paddingTop: 4,
      paddingBottom:
        98,
    },

    header: {
      height: 53,
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
        "#202428",
    },

    headerPlaceholder: {
      width: 40,
    },

    errorCard: {
      marginBottom: 12,
      borderRadius: 13,
      backgroundColor:
        "#FFF1F1",
      borderWidth: 1,
      borderColor:
        "#F0CED0",
      paddingHorizontal:
        11,
      paddingVertical:
        10,
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    darkErrorCard: {
      backgroundColor:
        "#39272A",
      borderColor:
        "#594044",
    },

    errorContent: {
      flex: 1,
      marginLeft: 8,
      paddingRight: 7,
    },

    errorTitle: {
      fontSize: 10,
      fontWeight:
        "700",
      color:
        "#A8555A",
    },

    errorDescription: {
      marginTop: 3,
      fontSize: 8.5,
      lineHeight: 13,
      color:
        "#A77578",
    },

    retryButton: {
      borderRadius: 999,
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal:
        10,
      paddingVertical:
        7,
    },

    retryText: {
      fontSize: 8.5,
      fontWeight:
        "700",
      color:
        "#B35B60",
    },

    profileHeader: {
      alignItems:
        "center",
      paddingTop: 7,
      paddingBottom:
        20,
    },

    avatarContainer: {
      position:
        "relative",
      width: 78,
      height: 78,
      borderRadius: 39,
      backgroundColor:
        "#E3F9EA",
      borderWidth: 2,
      borderColor:
        "#B7F1C5",
      overflow:
        "visible",
    },

    doctorAvatar: {
      width: "100%",
      height: "100%",
      borderRadius: 39,
    },

    verifiedAvatarBadge: {
      position:
        "absolute",
      right: -1,
      bottom: 2,
      width: 19,
      height: 19,
      borderRadius: 9.5,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#4BC963",
      borderWidth: 2,
      borderColor:
        "#FFFFFF",
    },

    doctorName: {
      marginTop: 11,
      fontSize: 18,
      fontWeight:
        "700",
      color:
        "#23272B",
    },

    specialization: {
      marginTop: 5,
      fontSize: 11,
      color:
        "#747A81",
    },

    emailRow: {
      marginTop: 7,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    emailText: {
      fontSize: 10,
      color:
        "#5F656B",
    },

    verifiedBadge: {
      marginTop: 8,
      backgroundColor:
        "#CFF8D8",
      borderRadius: 999,
      paddingHorizontal:
        10,
      paddingVertical: 5,
    },

    verifiedBadgeText: {
      fontSize: 8,
      fontWeight:
        "500",
      color:
        "#45B55A",
    },

    sectionTitle: {
      fontSize: 14,
      fontWeight:
        "600",
      color:
        "#292D31",
      marginBottom: 11,
    },

    statisticsGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      justifyContent:
        "space-between",
      rowGap: 9,
      marginBottom: 16,
    },

    statisticCard: {
      width: "48.5%",
      minHeight: 67,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E4EDF3",
      borderRadius: 10,
      paddingHorizontal:
        11,
      paddingVertical:
        10,
      shadowColor:
        "#9DABB5",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity:
        0.06,
      shadowRadius: 5,
      elevation: 1,
    },

    statisticTitle: {
      fontSize: 8.5,
      color:
        "#687078",
    },

    statisticValueRow: {
      marginTop: 5,
      flexDirection:
        "row",
      alignItems:
        "flex-end",
      gap: 3,
    },

    statisticValue: {
      fontSize: 17,
      fontWeight:
        "700",
    },

    statisticSuffix: {
      marginBottom: 2,
      fontSize: 8,
      color:
        "#777D84",
    },

    infoCard: {
      backgroundColor:
        "#F5F5F6",
      borderRadius: 11,
      paddingHorizontal:
        13,
      paddingTop: 14,
      paddingBottom:
        15,
      marginBottom: 16,
    },

    darkCard: {
      backgroundColor:
        "#24272B",
      borderColor:
        "#32363B",
    },

    cardTitle: {
      fontSize: 13,
      fontWeight:
        "600",
      color:
        "#292D31",
    },

    aboutText: {
      marginTop: 12,
      fontSize: 10.5,
      lineHeight: 16,
      color:
        "#42484E",
    },

    detailRow: {
      marginTop: 14,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: 15,
    },

    detailLabel: {
      fontSize: 9.5,
      color:
        "#777D84",
    },

    detailValue: {
      flex: 1,
      fontSize: 10,
      fontWeight:
        "600",
      color:
        "#25292D",
      textAlign:
        "right",
    },

    licenseBadge: {
      backgroundColor:
        "#CFF8D8",
      borderRadius: 999,
      paddingHorizontal:
        8,
      paddingVertical: 4,
    },

    licenseBadgeText: {
      fontSize: 7.5,
      color:
        "#45B55A",
    },

    pendingLicenseBadge: {
      backgroundColor:
        "#FFF0DA",
      borderRadius: 999,
      paddingHorizontal:
        8,
      paddingVertical: 4,
    },

    pendingLicenseBadgeText: {
      fontSize: 7.5,
      color:
        "#D58D34",
    },

    achievementsContainer: {
      marginTop: 13,
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 7,
    },

    achievementChip: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
      borderRadius: 999,
      paddingHorizontal:
        9,
      paddingVertical: 7,
    },

    achievementText: {
      fontSize: 8,
      fontWeight:
        "500",
    },

    settingsCard: {
      backgroundColor:
        "#F4F4F5",
      borderRadius: 11,
      paddingHorizontal:
        12,
      paddingTop: 14,
      marginBottom: 16,
    },

    settingsTitle: {
      marginBottom: 8,
      fontSize: 13,
      fontWeight:
        "600",
      color:
        "#292D31",
    },

    settingRow: {
      minHeight: 53,
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
    },

    settingRowBorder: {
      borderBottomWidth:
        1,
      borderBottomColor:
        "#E2E3E5",
    },

    darkSettingRowBorder: {
      borderBottomColor:
        "#383C42",
    },

    settingLeft: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    settingIconWrapper: {
      width: 34,
      height: 34,
      borderRadius: 7,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#FFFFFF",
      marginRight: 9,
    },

    darkSettingIconWrapper: {
      backgroundColor:
        "#30343A",
    },

    settingText: {
      fontSize: 11,
      color:
        "#292D31",
    },

    settingRight: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    settingRightText: {
      fontSize: 9.5,
      color:
        "#9A9FA5",
    },

    logoutButtonWrapper: {
      marginTop: 1,
      marginBottom: 4,
      borderRadius: 18,
      shadowColor:
        "#D65A59",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity:
        0.08,
      shadowRadius: 8,
      elevation: 2,
    },

    logoutButton: {
      minHeight: 64,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#F6CFD1",
      paddingHorizontal:
        13,
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    darkLogoutButton: {
      borderColor:
        "#56383C",
    },

    logoutIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor:
        "#FFE5E6",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    darkLogoutIconWrapper: {
      backgroundColor:
        "#4A3034",
    },

    logoutContent: {
      flex: 1,
      marginLeft: 11,
    },

    logoutText: {
      color:
        "#C94F50",
      fontSize: 10,
      fontWeight:
        "700",
    },

    logoutDescription: {
      marginTop: 3,
      color:
        "#A97779",
      fontSize: 8.5,
    },

    darkLogoutDescription: {
      color:
        "#C89498",
    },

    logoutArrow: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor:
        "rgba(255,255,255,0.72)",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    darkLogoutArrow: {
      backgroundColor:
        "#452E32",
    },

    bottomNavigation: {
      position:
        "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 70,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-around",
      backgroundColor:
        "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor:
        "#E9EAED",
      paddingBottom: 6,
      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity:
        0.04,
      shadowRadius: 4,
      elevation: 5,
    },

    darkBottomNavigation: {
      backgroundColor:
        "#202327",
      borderTopColor:
        "#32363B",
    },

    bottomNavItem: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 4,
    },

    bottomNavLabel: {
      fontSize: 9,
      color:
        "#A2A6AC",
    },

    bottomNavLabelActive: {
      color:
        "#5E88A7",
      fontWeight:
        "600",
    },

    darkMainText: {
      color:
        "#FFFFFF",
    },

    darkSecondaryText: {
      color:
        "#ADB2B9",
    },

    logoutModalOverlay: {
      flex: 1,
      backgroundColor:
        "rgba(27,31,36,0.52)",
      justifyContent:
        "center",
      alignItems:
        "center",
      paddingHorizontal:
        26,
    },

    logoutModalCard: {
      width: "100%",
      maxWidth: 360,
      borderRadius: 24,
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal:
        20,
      paddingTop: 24,
      paddingBottom:
        18,
      alignItems:
        "center",
      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity:
        0.16,
      shadowRadius: 18,
      elevation: 10,
    },

    darkLogoutModalCard: {
      backgroundColor:
        "#24272B",
    },

    logoutModalIcon: {
      width: 62,
      height: 62,
      borderRadius: 20,
      justifyContent:
        "center",
      alignItems:
        "center",
      marginBottom: 14,
    },

    logoutModalTitle: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight:
        "700",
      color:
        "#25292D",
    },

    logoutModalDescription: {
      marginTop: 7,
      paddingHorizontal:
        12,
      fontSize: 10,
      lineHeight: 15,
      color:
        "#72787E",
      textAlign:
        "center",
    },

    logoutModalInfo: {
      width: "100%",
      borderRadius: 13,
      backgroundColor:
        "#EDF7FF",
      paddingHorizontal:
        11,
      paddingVertical:
        10,
      marginTop: 16,
      flexDirection:
        "row",
      alignItems:
        "flex-start",
    },

    darkLogoutModalInfo: {
      backgroundColor:
        "#2B3943",
    },

    logoutModalInfoText: {
      flex: 1,
      marginLeft: 7,
      fontSize: 8.5,
      lineHeight: 13,
      color:
        "#658194",
    },

    darkLogoutModalInfoText: {
      color:
        "#A8C0D1",
    },

    logoutModalActions: {
      width: "100%",
      flexDirection:
        "row",
      marginTop: 18,
      gap: 10,
    },

    logoutCancelButton: {
      flex: 1,
      height: 46,
      borderRadius: 23,
      borderWidth: 1,
      borderColor:
        "#DDE2E6",
      backgroundColor:
        "#FFFFFF",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    darkLogoutCancelButton: {
      backgroundColor:
        "#30343A",
      borderColor:
        "#43484F",
    },

    logoutCancelText: {
      fontSize: 9.5,
      fontWeight:
        "600",
      color:
        "#62686E",
    },

    logoutConfirmWrapper: {
      flex: 1,
    },

    logoutConfirmButton: {
      height: 46,
      borderRadius: 23,
      flexDirection:
        "row",
      justifyContent:
        "center",
      alignItems:
        "center",
      gap: 7,
    },

    logoutConfirmDisabled: {
      opacity: 0.7,
    },

    logoutConfirmText: {
      fontSize: 9.5,
      fontWeight:
        "700",
      color:
        "#FFFFFF",
    },
  });