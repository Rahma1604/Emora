import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
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
const girlPhoto = require("../../assets/images/images/girl.png");
const boyPhoto = require("../../assets/images/images/boy.png");

const DOCTOR_NOTIFICATIONS_STORAGE_KEY =
  "doctor_notifications";

type VerificationStatus =
  | "not_started"
  | "draft"
  | "pending"
  | "approved"
  | "rejected";

type DoctorUser = {
  id?: string | number;
  _id?: string;
  name?: string;
  fullName?: string;
  specialization?: string;
  professionalType?: string;
  email?: string;
  role?: string;
  profilePic?: string;
  verificationStatus?: string;
  verificationStep?: string;
  isVerified?: boolean;
};

type DashboardStats = {
  pendingCases: number;
  reviewedCases: number;
  newThisWeek: number;
  childrenFollowed: number;
};

type ChildData = {
  _id?: string;
  id?: string;
  name?: string;
  age?: number;
  gender?: string;
  parentId?: string;
};

type RecommendationData = {
  note?: string;
  date?: string;
};

type DoctorCase = {
  _id?: string;
  caseId?: string;
  childId?: ChildData | string | null;
  status?: string;
  priority?: string;
  dominantEmotion?: string;
  emotionPercentage?: number;
  aiDiagnosis?: string;
  aiSummary?: string;
  entriesCount?: number;
  lastAnalysisDate?: string;
  createdAt?: string;
  doctorRecommendation?: string;
  doctorRecommendations?: RecommendationData[];
};

type PendingCaseData = {
  caseId: string;
  childDatabaseId: string;
  name: string;
  childIdLabel: string;
  indicator: string;
  description: string;
  avatar: number;
  avatarBackground: string;
};

type ActivityItemData = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  date: string;
};

type StoredDoctorNotification = {
  id?: string;
  read?: boolean;
};

type StatCardProps = {
  title: string;
  value: string;
  valueColor?: string;
};

type BottomNavItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
};

const EMPTY_DASHBOARD_STATS: DashboardStats = {
  pendingCases: 0,
  reviewedCases: 0,
  newThisWeek: 0,
  childrenFollowed: 0,
};

const normalizeVerificationStatus = (
  value: unknown
): VerificationStatus => {
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

const getRequestErrorMessage = (
  error: unknown
): string => {
  if (axios.isAxiosError(error)) {
    return String(
      error.response?.data?.message ||
        error.response?.data?.msg ||
        error.response?.data?.error ||
        error.message ||
        "Could not load dashboard data."
    );
  }

  return error instanceof Error
    ? error.message
    : "Could not load dashboard data.";
};

const getChildFromCase = (
  caseItem: DoctorCase
): ChildData | null => {
  if (
    caseItem.childId &&
    typeof caseItem.childId === "object"
  ) {
    return caseItem.childId;
  }

  return null;
};

const getCaseId = (
  caseItem: DoctorCase
): string => {
  return String(
    caseItem._id ||
      caseItem.caseId ||
      ""
  );
};

const getChildDatabaseId = (
  caseItem: DoctorCase
): string => {
  const child = getChildFromCase(caseItem);

  if (child) {
    return String(
      child._id ||
        child.id ||
        ""
    );
  }

  if (
    typeof caseItem.childId === "string"
  ) {
    return caseItem.childId;
  }

  return "";
};

const getChildShortId = (
  childId: string
): string => {
  if (!childId) {
    return "#—";
  }

  const shortId = childId
    .slice(-6)
    .toUpperCase();

  return `#${shortId}`;
};

const getChildAvatar = (
  gender?: string
): {
  avatar: number;
  background: string;
} => {
  const normalizedGender = String(
    gender || ""
  ).toLowerCase();

  if (
    normalizedGender === "female" ||
    normalizedGender === "girl"
  ) {
    return {
      avatar: girlPhoto,
      background: "#FFF2F1",
    };
  }

  return {
    avatar: boyPhoto,
    background: "#EEF8F3",
  };
};

const createPendingCaseData = (
  caseItem: DoctorCase
): PendingCaseData => {
  const child =
    getChildFromCase(caseItem);

  const childDatabaseId =
    getChildDatabaseId(caseItem);

  const avatarData =
    getChildAvatar(child?.gender);

  let indicator =
    "Emotional Analysis";

  if (caseItem.dominantEmotion) {
    indicator =
      `${caseItem.dominantEmotion} Indicators`;
  } else if (caseItem.priority) {
    indicator =
      `${caseItem.priority} Priority`;
  } else if (caseItem.aiDiagnosis) {
    indicator =
      "AI Analysis Result";
  }

  const description =
    caseItem.aiSummary ||
    caseItem.aiDiagnosis ||
    "A new child case is ready for your professional review.";

  return {
    caseId:
      getCaseId(caseItem),

    childDatabaseId,

    name:
      child?.name ||
      "Child",

    childIdLabel:
      getChildShortId(
        childDatabaseId
      ),

    indicator,

    description,

    avatar:
      avatarData.avatar,

    avatarBackground:
      avatarData.background,
  };
};

const formatActivityDate = (
  value?: string
): string => {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Recently";
  }

  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const dateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const differenceInDays = Math.round(
    (todayStart.getTime() -
      dateStart.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const time = date.toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );

  if (differenceInDays === 0) {
    return `Today, ${time}`;
  }

  if (differenceInDays === 1) {
    return `Yesterday, ${time}`;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !==
        now.getFullYear()
          ? "numeric"
          : undefined,
    }
  );
};

const createActivityItem = (
  caseItem: DoctorCase,
  index: number
): ActivityItemData => {
  const child =
    getChildFromCase(caseItem);

  const childName =
    child?.name || "Child";

  const status =
    String(
      caseItem.status || ""
    ).toLowerCase();

  const recommendations =
    caseItem.doctorRecommendations ||
    [];

  const latestRecommendation =
    recommendations.length > 0
      ? recommendations[
          recommendations.length - 1
        ]
      : undefined;

  const eventDate =
    latestRecommendation?.date ||
    caseItem.lastAnalysisDate ||
    caseItem.createdAt;

  if (status === "reviewed") {
    return {
      id:
        getCaseId(caseItem) ||
        `reviewed-${index}`,

      icon:
        "checkmark-circle-outline",

      iconColor:
        "#3DAA6D",

      title:
        `${childName}'s case was reviewed`,

      date:
        formatActivityDate(eventDate),
    };
  }

  if (status === "closed") {
    return {
      id:
        getCaseId(caseItem) ||
        `closed-${index}`,

      icon:
        "lock-closed-outline",

      iconColor:
        "#7C8792",

      title:
        `${childName}'s case was closed`,

      date:
        formatActivityDate(eventDate),
    };
  }

  if (status === "improving") {
    return {
      id:
        getCaseId(caseItem) ||
        `improving-${index}`,

      icon:
        "trending-up-outline",

      iconColor:
        "#4F8F8A",

      title:
        `${childName}'s emotional progress is improving`,

      date:
        formatActivityDate(eventDate),
    };
  }

  return {
    id:
      getCaseId(caseItem) ||
      `pending-${index}`,

    icon:
      "document-text-outline",

    iconColor:
      "#5E92D6",

    title:
      `New case submitted for ${childName}`,

    date:
      formatActivityDate(eventDate),
  };
};

export default function DoctorHomeScreen() {
  const [doctorName, setDoctorName] =
    useState("Doctor");

  const [
    specialization,
    setSpecialization,
  ] = useState(
    "CHILD PSYCHOLOGY SPECIALIST"
  );

  const [
    checkingAccess,
    setCheckingAccess,
  ] = useState(true);

  const [
    dashboardLoading,
    setDashboardLoading,
  ] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    dashboardError,
    setDashboardError,
  ] = useState("");

  const [
    dashboardStats,
    setDashboardStats,
  ] = useState<DashboardStats>(
    EMPTY_DASHBOARD_STATS
  );

  const [
    pendingCases,
    setPendingCases,
  ] = useState<PendingCaseData[]>(
    []
  );

  const [
    recentActivities,
    setRecentActivities,
  ] = useState<ActivityItemData[]>(
    []
  );

  const [
    unreadNotifications,
    setUnreadNotifications,
  ] = useState(0);

  const statistics =
    useMemo<StatCardProps[]>(
      () => [
        {
          title:
            "Pending Cases",

          value:
            String(
              dashboardStats.pendingCases
            ),

          valueColor:
            "#2E86DE",
        },
        {
          title:
            "Reviewed Cases",

          value:
            String(
              dashboardStats.reviewedCases
            ),

          valueColor:
            "#16A34A",
        },
        {
          title:
            "New This Week",

          value:
            String(
              dashboardStats.newThisWeek
            ),

          valueColor:
            "#2E86DE",
        },
        {
          title:
            "Children Followed",

          value:
            String(
              dashboardStats.childrenFollowed
            ),

          valueColor:
            "#1F2937",
        },
      ],
      [dashboardStats]
    );

  const redirectToDraftStep = (
    currentStep?: string | null
  ) => {
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

      case "intro":
      default:
        router.replace(
          "/doctor/doctor-verification/intro" as Href
        );
    }
  };

  const clearDoctorSession =
    useCallback(async () => {
      await AsyncStorage.multiRemove([
        "token",
        "user",
        "verificationToken",
        "doctorAccessEnabled",
      ]);
    }, []);

  const loadDashboardData =
    useCallback(
      async (
        showInitialLoader = false
      ): Promise<boolean> => {
        if (showInitialLoader) {
          setDashboardLoading(true);
        }

        setDashboardError("");

        try {
          const [
            statsResponse,
            pendingResponse,
            historyResponse,
          ] = await Promise.all([
            API.get<DashboardStats>(
              "/doctor/dashboard-stats"
            ),

            API.get<DoctorCase[]>(
              "/doctor/pending-cases"
            ),

            API.get<DoctorCase[]>(
              "/doctor/home-history"
            ),
          ]);

          const stats =
            statsResponse.data ||
            EMPTY_DASHBOARD_STATS;

          const pendingData =
            Array.isArray(
              pendingResponse.data
            )
              ? pendingResponse.data
              : [];

          const historyData =
            Array.isArray(
              historyResponse.data
            )
              ? historyResponse.data
              : [];

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

          setPendingCases(
            pendingData
              .slice(0, 5)
              .map(
                createPendingCaseData
              )
          );

          setRecentActivities(
            historyData
              .slice(0, 3)
              .map(
                createActivityItem
              )
          );

          return true;
        } catch (error) {
          console.log(
            "LOAD DOCTOR DASHBOARD ERROR:",
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
            await clearDoctorSession();

            router.replace(
              "/auth/login" as Href
            );

            return false;
          }

          setDashboardError(
            getRequestErrorMessage(
              error
            )
          );

          return true;
        } finally {
          setDashboardLoading(false);
          setRefreshing(false);
        }
      },
      [clearDoctorSession]
    );

  useEffect(() => {
    let isMounted = true;

    const initializeDoctorHome =
      async () => {
        try {
          const storedValues =
            await AsyncStorage.multiGet([
              "token",
              "user",
              "role",
              "verificationStatus",
              "verificationCurrentStep",
              "doctorAccessEnabled",
            ]);

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

          let storedUser:
            | DoctorUser
            | null = null;

          if (storedData.user) {
            try {
              storedUser =
                JSON.parse(
                  storedData.user
                ) as DoctorUser;
            } catch (error) {
              console.log(
                "Could not parse stored doctor:",
                error
              );
            }
          }

          const response =
            await API.get<DoctorUser>(
              "/auth/profile"
            );

          const serverDoctor =
            response.data;

          const role =
            serverDoctor.role ||
            storedData.role ||
            storedUser?.role;

          if (role !== "doctor") {
            if (role === "parent") {
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

          const verificationStatus =
            normalizeVerificationStatus(
              serverDoctor.verificationStatus ||
                storedData.verificationStatus ||
                storedUser?.verificationStatus
            );

          const currentStep =
            serverDoctor.verificationStep ||
            storedData.verificationCurrentStep ||
            storedUser?.verificationStep ||
            null;

          const doctorAccessEnabled =
            storedData.doctorAccessEnabled;

          if (
            verificationStatus ===
            "not_started"
          ) {
            router.replace(
              "/doctor/doctor-verification/intro" as Href
            );

            return;
          }

          if (
            verificationStatus ===
            "draft"
          ) {
            redirectToDraftStep(
              currentStep
            );

            return;
          }

          if (
            verificationStatus ===
            "pending"
          ) {
            router.replace(
              "/doctor/doctor-verification/pending" as Href
            );

            return;
          }

          if (
            verificationStatus ===
            "rejected"
          ) {
            router.replace(
              "/doctor/doctor-verification/rejected" as Href
            );

            return;
          }

          if (
            verificationStatus ===
              "approved" &&
            doctorAccessEnabled !==
              "true"
          ) {
            router.replace(
              "/doctor/doctor-verification/approved" as Href
            );

            return;
          }

          if (
            verificationStatus !==
            "approved"
          ) {
            router.replace(
              "/auth/login" as Href
            );

            return;
          }

          const fullName =
            serverDoctor.fullName ||
            serverDoctor.name ||
            storedUser?.fullName ||
            storedUser?.name ||
            "Doctor";

          const cleanName =
            fullName.trim();

          const formattedName =
            cleanName
              .toLowerCase()
              .startsWith("dr.")
              ? cleanName
              : `Dr. ${cleanName}`;

          const doctorSpecialization =
            serverDoctor.specialization ||
            storedUser?.specialization ||
            "Child Psychology Specialist";

          if (isMounted) {
            setDoctorName(
              formattedName
            );

            setSpecialization(
              doctorSpecialization.toUpperCase()
            );
          }

          const approvedDoctor: DoctorUser =
            {
              ...storedUser,
              ...serverDoctor,

              id:
                serverDoctor.id ||
                serverDoctor._id ||
                storedUser?.id,

              name: fullName,
              fullName,

              role: "doctor",

              verificationStatus:
                "approved",

              verificationStep:
                currentStep ||
                "submitted",

              isVerified: true,
            };

          await AsyncStorage.multiSet([
            ["token", token],

            [
              "user",
              JSON.stringify(
                approvedDoctor
              ),
            ],

            ["role", "doctor"],

            [
              "verificationStatus",
              "approved",
            ],

            [
              "verificationCurrentStep",
              currentStep ||
                "submitted",
            ],

            [
              "doctorAccessEnabled",
              "true",
            ],

            [
              "hasSeenVerificationApproval",
              "true",
            ],
          ]);

          await AsyncStorage.removeItem(
            "verificationToken"
          );

          const dashboardAvailable =
            await loadDashboardData(
              true
            );

          if (
            dashboardAvailable &&
            isMounted
          ) {
            setCheckingAccess(
              false
            );
          }
        } catch (error) {
          console.log(
            "ERROR CHECKING DOCTOR ACCESS:",
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
            await clearDoctorSession();
          }

          router.replace(
            "/auth/login" as Href
          );
        }
      };

    initializeDoctorHome();

    return () => {
      isMounted = false;
    };
  }, [
    clearDoctorSession,
    loadDashboardData,
  ]);

  const loadUnreadNotifications =
    useCallback(async () => {
      try {
        const storedNotifications =
          await AsyncStorage.getItem(
            DOCTOR_NOTIFICATIONS_STORAGE_KEY
          );

        if (!storedNotifications) {
          setUnreadNotifications(0);
          return;
        }

        const parsedNotifications =
          JSON.parse(
            storedNotifications
          );

        if (
          !Array.isArray(
            parsedNotifications
          )
        ) {
          setUnreadNotifications(0);
          return;
        }

        const unreadCount = (
          parsedNotifications as StoredDoctorNotification[]
        ).filter(
          (notification) =>
            notification.read !== true
        ).length;

        setUnreadNotifications(
          unreadCount
        );
      } catch (error) {
        console.log(
          "Error loading doctor notifications:",
          error
        );

        setUnreadNotifications(0);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadUnreadNotifications();

      if (!checkingAccess) {
        loadDashboardData(false);
      }
    }, [
      checkingAccess,
      loadDashboardData,
      loadUnreadNotifications,
    ])
  );

  const handleRefresh =
    useCallback(async () => {
      setRefreshing(true);

      await Promise.all([
        loadDashboardData(false),
        loadUnreadNotifications(),
      ]);
    }, [
      loadDashboardData,
      loadUnreadNotifications,
    ]);

  const openCaseReview = (
    caseId: string,
    childDatabaseId: string,
    childName: string
  ) => {
    if (!caseId) {
      return;
    }

    const route =
      `/doctor/review-case` +
      `?caseId=${encodeURIComponent(
        caseId
      )}` +
      `&childId=${encodeURIComponent(
        childDatabaseId
      )}` +
      `&child=${encodeURIComponent(
        childName
      )}`;

    router.push(route as Href);
  };

  const openNotifications = () => {
    router.push(
      "/doctor/notifications" as Href
    );
  };

  const openWeeklySummary = () => {
    router.push(
      "/doctor/weekly-summary" as Href
    );
  };

  const openHistory = () => {
    router.push(
      "/doctor/history" as Href
    );
  };

  const openInsights = () => {
    router.push(
      "/doctor/insights" as Href
    );
  };

  const openProfile = () => {
    router.push(
      "/doctor/profile" as Href
    );
  };

  if (checkingAccess) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />

        <LinearGradient
          colors={[
            "#F1F8FF",
            "#FFF5F5",
            "#FFFFFF",
          ]}
          locations={[
            0,
            0.32,
            0.72,
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 0.12,
          }}
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
                name="shield-checkmark-outline"
                size={43}
                color="#6D9EC8"
              />
            </LinearGradient>

            <ActivityIndicator
              size="large"
              color="#8DC0F0"
              style={
                styles.loadingIndicator
              }
            />

            <Text
              style={
                styles.loadingTitle
              }
            >
              Preparing your dashboard
            </Text>

            <Text
              style={
                styles.loadingDescription
              }
            >
              Please wait while we load your
              cases and professional statistics.
            </Text>
          </View>
        </LinearGradient>
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

      <LinearGradient
        colors={[
          "#F1F8FF",
          "#FFF5F5",
          "#FFFFFF",
        ]}
        locations={[
          0,
          0.32,
          0.72,
        ]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 0.12,
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
            bounces
            refreshControl={
              <RefreshControl
                refreshing={
                  refreshing
                }
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
            <View style={styles.header}>
              <View
                style={
                  styles.doctorInfo
                }
              >
                <View
                  style={
                    styles.doctorAvatarWrapper
                  }
                >
                  <Image
                    source={
                      doctorPhoto
                    }
                    style={
                      styles.doctorAvatar
                    }
                    contentFit="cover"
                    transition={150}
                  />

                  <View
                    style={
                      styles.avatarVerifiedBadge
                    }
                  >
                    <Ionicons
                      name="checkmark"
                      size={10}
                      color="#FFFFFF"
                    />
                  </View>
                </View>

                <View
                  style={
                    styles.doctorTextContainer
                  }
                >
                  <Text
                    style={
                      styles.welcomeText
                    }
                  >
                    Welcome 👋
                  </Text>

                  <Text
                    style={
                      styles.doctorName
                    }
                    numberOfLines={1}
                  >
                    {doctorName}
                  </Text>

                  <Text
                    style={
                      styles.specialization
                    }
                    numberOfLines={1}
                  >
                    {specialization}
                  </Text>

                  <View
                    style={
                      styles.verifiedBadge
                    }
                  >
                    <Ionicons
                      name="shield-checkmark"
                      size={11}
                      color="#3FA955"
                    />

                    <Text
                      style={
                        styles.verifiedBadgeText
                      }
                    >
                      Verified Specialist
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={
                  styles.notificationButton
                }
                onPress={
                  openNotifications
                }
                activeOpacity={0.75}
              >
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color="#20252B"
                />

                {unreadNotifications >
                0 ? (
                  <View
                    style={
                      styles.notificationDot
                    }
                  />
                ) : null}
              </TouchableOpacity>
            </View>

            {dashboardError ? (
              <View
                style={
                  styles.dashboardErrorCard
                }
              >
                <View
                  style={
                    styles.dashboardErrorIcon
                  }
                >
                  <Ionicons
                    name="cloud-offline-outline"
                    size={21}
                    color="#C66D72"
                  />
                </View>

                <View
                  style={
                    styles.dashboardErrorContent
                  }
                >
                  <Text
                    style={
                      styles.dashboardErrorTitle
                    }
                  >
                    Dashboard data unavailable
                  </Text>

                  <Text
                    style={
                      styles.dashboardErrorText
                    }
                  >
                    {dashboardError}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    loadDashboardData(
                      true
                    )
                  }
                  style={
                    styles.retryButton
                  }
                >
                  <Text
                    style={
                      styles.retryButtonText
                    }
                  >
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {dashboardLoading ? (
              <View
                style={
                  styles.dataLoadingCard
                }
              >
                <ActivityIndicator
                  size="small"
                  color="#8DC0F0"
                />

                <Text
                  style={
                    styles.dataLoadingText
                  }
                >
                  Loading dashboard data...
                </Text>
              </View>
            ) : (
              <>
                <View
                  style={
                    styles.statisticsGrid
                  }
                >
                  {statistics.map(
                    (item) => (
                      <StatCard
                        key={
                          item.title
                        }
                        title={
                          item.title
                        }
                        value={
                          item.value
                        }
                        valueColor={
                          item.valueColor
                        }
                      />
                    )
                  )}
                </View>

                <View
                  style={
                    styles.sectionHeader
                  }
                >
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Recent Pending Cases
                  </Text>

                  {pendingCases.length >
                  0 ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={
                        openHistory
                      }
                    >
                      <Text
                        style={
                          styles.viewAllText
                        }
                      >
                        View All
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {pendingCases.length >
                0 ? (
                  <View
                    style={
                      styles.casesContainer
                    }
                  >
                    {pendingCases.map(
                      (item) => (
                        <PendingCaseCard
                          key={
                            item.caseId
                          }
                          {...item}
                          onReview={() =>
                            openCaseReview(
                              item.caseId,
                              item.childDatabaseId,
                              item.name
                            )
                          }
                        />
                      )
                    )}
                  </View>
                ) : (
                  <EmptyState
                    icon="file-tray-outline"
                    title="No pending cases"
                    description="New child cases assigned to you will appear here."
                  />
                )}

                <View
                  style={
                    styles.sectionHeader
                  }
                >
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Recent Activity
                  </Text>
                </View>

                {recentActivities.length >
                0 ? (
                  <View
                    style={
                      styles.activitiesContainer
                    }
                  >
                    {recentActivities.map(
                      (item) => (
                        <ActivityItem
                          key={
                            item.id
                          }
                          {...item}
                        />
                      )
                    )}
                  </View>
                ) : (
                  <EmptyState
                    icon="time-outline"
                    title="No recent activity"
                    description="Your latest case updates will appear here."
                  />
                )}

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={
                    openWeeklySummary
                  }
                  style={
                    styles.weeklyCardWrapper
                  }
                >
                  <LinearGradient
                    colors={[
                      "#263A48",
                      "#315D75",
                      "#78A8C7",
                    ]}
                    start={{
                      x: 0,
                      y: 1,
                    }}
                    end={{
                      x: 1,
                      y: 0,
                    }}
                    style={
                      styles.weeklyCard
                    }
                  >
                    <View
                      style={
                        styles.weeklyDecorationOne
                      }
                    />

                    <View
                      style={
                        styles.weeklyDecorationTwo
                      }
                    />

                    <View
                      style={
                        styles.weeklyIconCircle
                      }
                    >
                      <Ionicons
                        name="analytics-outline"
                        size={42}
                        color="rgba(255,255,255,0.88)"
                      />
                    </View>

                    <View
                      style={
                        styles.weeklyCardContent
                      }
                    >
                      <Text
                        style={
                          styles.weeklyTitle
                        }
                      >
                        Weekly Progress
                      </Text>

                      <Text
                        style={
                          styles.weeklyTitle
                        }
                      >
                        Summary
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={22}
                      color="#FFFFFF"
                      style={
                        styles.weeklyArrow
                      }
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>

          <View
            style={
              styles.bottomNavigation
            }
          >
            <BottomNavItem
              icon="home-outline"
              activeIcon="home"
              label="Home"
              active
              onPress={() =>
                undefined
              }
            />

            <BottomNavItem
              icon="document-text-outline"
              activeIcon="document-text"
              label="History"
              onPress={
                openHistory
              }
            />

            <BottomNavItem
              icon="stats-chart-outline"
              activeIcon="stats-chart"
              label="Insights"
              onPress={
                openInsights
              }
            />

            <BottomNavItem
              icon="person-outline"
              activeIcon="person"
              label="Profile"
              onPress={
                openProfile
              }
            />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

function StatCard({
  title,
  value,
  valueColor = "#1F2937",
}: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text
        style={
          styles.statTitle
        }
      >
        {title}
      </Text>

      <Text
        style={[
          styles.statValue,
          {
            color:
              valueColor,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function PendingCaseCard({
  name,
  childIdLabel,
  indicator,
  description,
  avatar,
  avatarBackground,
  onReview,
}: PendingCaseData & {
  onReview: () => void;
}) {
  return (
    <View style={styles.caseCard}>
      <View
        style={
          styles.caseTopRow
        }
      >
        <View
          style={
            styles.caseIdentity
          }
        >
          <View
            style={[
              styles.childAvatarWrapper,
              {
                backgroundColor:
                  avatarBackground,
              },
            ]}
          >
            <Image
              source={avatar}
              style={
                styles.childAvatarImage
              }
              contentFit="cover"
              transition={150}
            />
          </View>

          <View
            style={
              styles.childTextContainer
            }
          >
            <Text
              style={
                styles.childName
              }
            >
              {name}
            </Text>

            <Text
              style={
                styles.childId
              }
            >
              Child ID {childIdLabel}
            </Text>
          </View>
        </View>

        <View
          style={
            styles.pendingBadge
          }
        >
          <Text
            style={
              styles.pendingBadgeText
            }
          >
            Pending Review
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.indicatorText
        }
      >
        {indicator}
      </Text>

      <Text
        style={
          styles.caseDescription
        }
        numberOfLines={3}
      >
        {description}
      </Text>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onReview}
        style={
          styles.reviewButtonWrapper
        }
      >
        <LinearGradient
          colors={[
            "#9DCEF4",
            "#F5A8AC",
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
            styles.reviewButton
          }
        >
          <Text
            style={
              styles.reviewButtonText
            }
          >
            Review Case
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function ActivityItem({
  icon,
  iconColor,
  title,
  date,
}: ActivityItemData) {
  return (
    <View
      style={
        styles.activityItem
      }
    >
      <View
        style={[
          styles.activityIcon,
          {
            backgroundColor:
              `${iconColor}18`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={16}
          color={iconColor}
        />
      </View>

      <View
        style={
          styles.activityTextContainer
        }
      >
        <Text
          style={
            styles.activityTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.activityDate
          }
        >
          {date}
        </Text>
      </View>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View
      style={
        styles.emptyState
      }
    >
      <View
        style={
          styles.emptyStateIcon
        }
      >
        <Ionicons
          name={icon}
          size={24}
          color="#7799B3"
        />
      </View>

      <View
        style={
          styles.emptyStateContent
        }
      >
        <Text
          style={
            styles.emptyStateTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.emptyStateDescription
          }
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

function BottomNavItem({
  icon,
  activeIcon,
  label,
  active = false,
  onPress,
}: BottomNavItemProps) {
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
            : "#A2A6AC"
        }
      />

      <Text
        style={[
          styles.bottomNavLabel,
          active &&
            styles.bottomNavLabelActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal:
      28,
  },

  loadingIcon: {
    width: 105,
    height: 105,
    borderRadius: 53,
    justifyContent:
      "center",
    alignItems:
      "center",
  },

  loadingIndicator: {
    marginTop: 22,
  },

  loadingTitle: {
    marginTop: 17,
    fontSize: 20,
    fontWeight:
      "700",
    color:
      "#22262A",
    textAlign:
      "center",
  },

  loadingDescription: {
    marginTop: 9,
    maxWidth: 310,
    fontSize: 11,
    lineHeight: 17,
    color:
      "#858B92",
    textAlign:
      "center",
  },

  mainContainer: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal:
      18,
    paddingTop: 16,
    paddingBottom:
      24,
  },

  header: {
    flexDirection:
      "row",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    marginBottom:
      20,
  },

  doctorInfo: {
    flex: 1,
    flexDirection:
      "row",
    alignItems:
      "center",
  },

  doctorAvatarWrapper: {
    position:
      "relative",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor:
      "#EDF3F7",
    marginRight: 11,
    borderWidth: 1,
    borderColor:
      "#E0E9EF",
  },

  doctorAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },

  avatarVerifiedBadge: {
    position:
      "absolute",
    right: -2,
    bottom: -1,
    width: 17,
    height: 17,
    borderRadius: 9,
    justifyContent:
      "center",
    alignItems:
      "center",
    backgroundColor:
      "#45B75D",
    borderWidth: 2,
    borderColor:
      "#FFFFFF",
  },

  doctorTextContainer: {
    flex: 1,
  },

  welcomeText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight:
      "500",
    color:
      "#30343A",
  },

  doctorName: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight:
      "700",
    color:
      "#161A1E",
  },

  specialization: {
    marginTop: 1,
    fontSize: 8.2,
    letterSpacing:
      0.35,
    color:
      "#979CA4",
  },

  verifiedBadge: {
    marginTop: 4,
    alignSelf:
      "flex-start",
    flexDirection:
      "row",
    alignItems:
      "center",
    gap: 3,
    backgroundColor:
      "#EAF8ED",
    borderRadius: 999,
    paddingHorizontal:
      6,
    paddingVertical:
      3,
  },

  verifiedBadgeText: {
    fontSize: 7.5,
    fontWeight:
      "700",
    color:
      "#3F9E52",
  },

  notificationButton: {
    position:
      "relative",
    width: 40,
    height: 40,
    justifyContent:
      "center",
    alignItems:
      "center",
  },

  notificationDot: {
    position:
      "absolute",
    top: 9,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      "#F4A1A5",
    borderWidth: 1,
    borderColor:
      "#FFFFFF",
  },

  dashboardErrorCard: {
    flexDirection:
      "row",
    alignItems:
      "center",
    backgroundColor:
      "#FFF1F1",
    borderWidth: 1,
    borderColor:
      "#F3D1D3",
    borderRadius: 13,
    paddingHorizontal:
      11,
    paddingVertical:
      11,
    marginBottom: 14,
  },

  dashboardErrorIcon: {
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

  dashboardErrorContent: {
    flex: 1,
    paddingRight: 8,
  },

  dashboardErrorTitle: {
    fontSize: 10.5,
    fontWeight:
      "700",
    color:
      "#9A555A",
  },

  dashboardErrorText: {
    marginTop: 3,
    fontSize: 8.5,
    lineHeight: 13,
    color:
      "#AE7276",
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

  retryButtonText: {
    fontSize: 9,
    fontWeight:
      "700",
    color:
      "#B15F64",
  },

  dataLoadingCard: {
    minHeight: 110,
    justifyContent:
      "center",
    alignItems:
      "center",
    gap: 10,
    backgroundColor:
      "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor:
      "#E5EDF3",
    borderRadius: 14,
    marginBottom: 18,
  },

  dataLoadingText: {
    fontSize: 10.5,
    color:
      "#7D858D",
  },

  statisticsGrid: {
    flexDirection:
      "row",
    flexWrap:
      "wrap",
    justifyContent:
      "space-between",
    rowGap: 10,
    marginBottom: 22,
  },

  statCard: {
    width: "48.5%",
    minHeight: 66,
    backgroundColor:
      "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor:
      "#E5EDF3",
    borderRadius: 10,
    paddingHorizontal:
      11,
    paddingVertical:
      10,
    shadowColor:
      "#A5B5C0",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity:
      0.08,
    shadowRadius: 6,
    elevation: 1,
  },

  statTitle: {
    fontSize: 10,
    lineHeight: 14,
    color:
      "#5D636A",
  },

  statValue: {
    marginTop: 3,
    fontSize: 16,
    lineHeight: 20,
    fontWeight:
      "700",
  },

  sectionHeader: {
    flexDirection:
      "row",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight:
      "600",
    color:
      "#24282D",
  },

  viewAllText: {
    fontSize: 10,
    fontWeight:
      "600",
    color:
      "#6B9FC7",
  },

  casesContainer: {
    gap: 11,
    marginBottom: 21,
  },

  caseCard: {
    backgroundColor:
      "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor:
      "#E6E7EA",
    borderRadius: 18,
    paddingHorizontal:
      12,
    paddingTop: 11,
    paddingBottom: 9,
    shadowColor:
      "#9AA5AE",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity:
      0.08,
    shadowRadius: 7,
    elevation: 2,
  },

  caseTopRow: {
    flexDirection:
      "row",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
  },

  caseIdentity: {
    flex: 1,
    flexDirection:
      "row",
    alignItems:
      "center",
  },

  childAvatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent:
      "center",
    alignItems:
      "center",
    marginRight: 9,
    overflow:
      "hidden",
    borderWidth: 1,
    borderColor:
      "#E8E8E8",
  },

  childAvatarImage: {
    width: "100%",
    height: "100%",
  },

  childTextContainer: {
    flex: 1,
  },

  childName: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight:
      "700",
    color:
      "#22272C",
  },

  childId: {
    marginTop: 1,
    fontSize: 9,
    color:
      "#818891",
  },

  pendingBadge: {
    backgroundColor:
      "#FFF1DF",
    borderRadius: 999,
    paddingHorizontal:
      8,
    paddingVertical:
      4,
    marginLeft: 8,
  },

  pendingBadgeText: {
    fontSize: 8,
    fontWeight:
      "500",
    color:
      "#E99A3B",
  },

  indicatorText: {
    marginTop: 8,
    fontSize: 10,
    color:
      "#68A8DF",
  },

  caseDescription: {
    marginTop: 5,
    fontSize: 10.5,
    lineHeight: 15,
    color:
      "#3F454B",
  },

  reviewButtonWrapper: {
    marginTop: 10,
  },

  reviewButton: {
    height: 34,
    borderRadius: 999,
    justifyContent:
      "center",
    alignItems:
      "center",
  },

  reviewButtonText: {
    fontSize: 10,
    fontWeight:
      "700",
    color:
      "#2A2D31",
  },

  activitiesContainer: {
    gap: 11,
    marginBottom: 18,
  },

  activityItem: {
    flexDirection:
      "row",
    alignItems:
      "center",
  },

  activityIcon: {
    width: 27,
    height: 27,
    borderRadius: 8,
    justifyContent:
      "center",
    alignItems:
      "center",
    marginRight: 9,
  },

  activityTextContainer: {
    flex: 1,
  },

  activityTitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight:
      "500",
    color:
      "#30343A",
  },

  activityDate: {
    marginTop: 1,
    fontSize: 8.5,
    color:
      "#A1A4AA",
  },

  emptyState: {
    minHeight: 82,
    flexDirection:
      "row",
    alignItems:
      "center",
    backgroundColor:
      "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor:
      "#E5EDF3",
    borderRadius: 14,
    paddingHorizontal:
      12,
    paddingVertical:
      12,
    marginBottom: 20,
  },

  emptyStateIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent:
      "center",
    alignItems:
      "center",
    backgroundColor:
      "#EEF6FD",
    marginRight: 10,
  },

  emptyStateContent: {
    flex: 1,
  },

  emptyStateTitle: {
    fontSize: 11,
    fontWeight:
      "700",
    color:
      "#465159",
  },

  emptyStateDescription: {
    marginTop: 4,
    fontSize: 9,
    lineHeight: 14,
    color:
      "#848B91",
  },

  weeklyCardWrapper: {
    width: "100%",
    marginTop: 4,
  },

  weeklyCard: {
    position:
      "relative",
    height: 126,
    borderRadius: 12,
    overflow:
      "hidden",
    justifyContent:
      "flex-end",
    paddingHorizontal:
      10,
    paddingBottom:
      11,
  },

  weeklyDecorationOne: {
    position:
      "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    top: -82,
    right: -25,
    backgroundColor:
      "rgba(255,255,255,0.08)",
  },

  weeklyDecorationTwo: {
    position:
      "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -45,
    right: 65,
    backgroundColor:
      "rgba(255,255,255,0.06)",
  },

  weeklyIconCircle: {
    position:
      "absolute",
    top: 19,
    right: 42,
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent:
      "center",
    alignItems:
      "center",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.25)",
    backgroundColor:
      "rgba(255,255,255,0.08)",
  },

  weeklyCardContent: {
    zIndex: 2,
  },

  weeklyTitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight:
      "600",
    color:
      "#FFFFFF",
  },

  weeklyArrow: {
    position:
      "absolute",
    right: 10,
    bottom: 14,
  },

  bottomNavigation: {
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
});