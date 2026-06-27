import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  LinearGradient,
} from "expo-linear-gradient";

import {
  Ionicons,
  Feather,
} from "@expo/vector-icons";

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import API from "../api";

type ChildData = {
  _id: string;
  name: string;
  age: number;
  gender: "male" | "female";
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

type DoctorInfo = {
  _id: string;
  fullName: string;
  specialization?: string;
  profilePic?: string;
  isVerified?: boolean;
};

type DoctorRecommendation = {
  _id?: string;
  date?: string;
  note: string;
};

type CaseData = {
  _id: string;

  status:
    | "pending"
    | "reviewed"
    | "closed"
    | "improving";

  priority?:
    | "Low"
    | "Medium"
    | "High";

  entriesCount?: number;
  lastAnalysisDate?: string;
  dominantEmotion?: string;
  emotionPercentage?: number;
  aiDiagnosis?: string;
  aiSummary?: string;
  doctorRecommendation?: string;

  emotionalTrend?: {
    week: string;
    emotion: string;
    value: number;
  }[];

  frequentEmotions?: {
    label: string;
    percentage: number;
  }[];

  recurringPatterns?: string[];

  doctorRecommendations?: DoctorRecommendation[];

  analysisTimeline?: {
    type: string;
    date: string;
    status: string;
  }[];

  doctor?: DoctorInfo | null;
};

type RecentEntry = {
  id: string;
  date: string;
  type: string;
  emotion: string;
  description: string;
  status: string;
  confidence: number;
};

type OverviewResponse = {
  childInfo: ChildData;
  caseData: CaseData | null;
  recentEntries: RecentEntry[];
};

type ApiErrorData = {
  error?: string;
  message?: string;
  msg?: string;
};

function getSingleParam(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function formatDate(
  value?: string
): string {
  if (!value) {
    return "No analysis yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No analysis yet";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }
  );
}

function formatStatus(
  status?: string
): string {
  switch (status) {
    case "pending":
      return "Pending Review";

    case "reviewed":
      return "Reviewed";

    case "closed":
      return "Closed";

    case "improving":
      return "Improving";

    default:
      return "Pending Review";
  }
}

function getTrendText(
  status?: string
): string {
  switch (status) {
    case "improving":
      return "Improving";

    case "reviewed":
      return "Stable";

    case "pending":
      return "Under Review";

    case "closed":
      return "Closed";

    default:
      return "No trend yet";
  }
}

export default function ChildProfile() {
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
    }>();

  const childId =
    getSingleParam(
      params.childId
    );

  const fallbackName =
    getSingleParam(
      params.childName
    ) || "Child";

  const fallbackAge =
    getSingleParam(
      params.childAge
    ) || "";

  const [overview, setOverview] =
    useState<OverviewResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleExpiredSession =
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
        "/auth/login" as never
      );
    }, []);

  const getErrorMessage = (
    requestError: unknown,
    fallbackMessage: string
  ): string => {
    if (
      axios.isAxiosError(
        requestError
      )
    ) {
      const responseData =
        requestError.response
          ?.data as
          | ApiErrorData
          | undefined;

      return (
        responseData?.message ||
        responseData?.error ||
        responseData?.msg ||
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

  const loadOverview =
    useCallback(async () => {
      if (!childId) {
        setLoading(false);

        setError(
          "Child ID was not found. Please return to the home page and select the child again."
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
          await handleExpiredSession();
          return;
        }

        const response =
          await API.get<OverviewResponse>(
            `/children/${childId}/overview`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        setOverview(response.data);
      } catch (requestError) {
        console.log(
          "GET CHILD OVERVIEW ERROR:",
          requestError
        );

        if (
          axios.isAxiosError(
            requestError
          ) &&
          requestError.response
            ?.status === 401
        ) {
          await handleExpiredSession();
          return;
        }

        setError(
          getErrorMessage(
            requestError,
            "Failed to load the child profile. Please try again."
          )
        );
      } finally {
        setLoading(false);
      }
    }, [
      childId,
      handleExpiredSession,
    ]);

  useFocusEffect(
    useCallback(() => {
      loadOverview();
    }, [loadOverview])
  );

  const child =
    overview?.childInfo;

  const caseData =
    overview?.caseData;

  const recentEntries =
    overview?.recentEntries || [];

  const childName =
    child?.name || fallbackName;

  const childAge =
    child?.age !== undefined
      ? String(child.age)
      : fallbackAge;

  const childNotes =
    child?.notes?.trim() || "";

  const totalEntries =
    caseData?.entriesCount ??
    recentEntries.length;

  const currentEmotion =
    caseData?.dominantEmotion ||
    "No data yet";

  const confidence =
    Number(
      caseData?.emotionPercentage
    ) || 0;

  const trendText =
    getTrendText(
      caseData?.status
    );

  const latestDoctorRecommendation =
    useMemo(() => {
      const recommendations =
        caseData
          ?.doctorRecommendations ||
        [];

      if (
        recommendations.length === 0
      ) {
        return null;
      }

      return [...recommendations]
        .sort((first, second) => {
          return (
            new Date(
              second.date || 0
            ).getTime() -
            new Date(
              first.date || 0
            ).getTime()
          );
        })[0];
    }, [
      caseData?.doctorRecommendations,
    ]);

  const doctorInsight =
    caseData
      ?.doctorRecommendation
      ?.trim() ||
    latestDoctorRecommendation
      ?.note
      ?.trim() ||
    "";

  const doctorInsightDate =
    latestDoctorRecommendation
      ?.date ||
    caseData?.lastAnalysisDate;

  const doctor =
    caseData?.doctor || null;

  const doctorImageSource =
    doctor?.profilePic &&
    /^https?:\/\//i.test(
      doctor.profilePic
    )
      ? {
          uri: doctor.profilePic,
        }
      : require("../../assets/images/images/doctorPhoto.png");

  const openEditChild = () => {
    if (!childId) {
      Alert.alert(
        "Unable to edit profile",
        "Child ID was not found. Please return and select the child again."
      );

      return;
    }

    router.push(
      {
        pathname:
          "/parent/edit-child",

        params: {
          childId,

          childName,

          childAge,

          childGender:
            child?.gender || "male",

          childNotes:
            child?.notes || "",
        },
      } as any
    );
  };

  const openAIChat = () => {
    router.push(
      {
        pathname:
          "/parent/ai-chat",

        params: {
          childId,
          childName,
          childAge,
        },
      } as any
    );
  };

  const openProgress = () => {
    router.push(
      {
        pathname:
          "/parent/child-progress",

        params: {
          childId,
          childName,
          childAge,
        },
      } as any
    );
  };

  const openChildEntries = () => {
    router.push(
      {
        pathname:
          "/parent/child-entries",

        params: {
          childId,
          childName,
          childAge,
        },
      } as any
    );
  };

  const openEntryDetails = (
    entry: RecentEntry
  ) => {
    router.push(
      {
        pathname:
          "/parent/activity-details",

        params: {
          activityId:
            entry.id,

          childId,

          childName,

          childAge,

          date:
            formatDate(
              entry.date
            ),

          type:
            entry.type,

          emotion:
            entry.emotion,

          description:
            entry.description,

          status:
            formatStatus(
              entry.status
            ),

          confidence:
            String(
              entry.confidence ||
                0
            ),

          entryCount:
            String(
              totalEntries
            ),
        },
      } as any
    );
  };

  const deleteChild =
    async () => {
      if (
        !childId ||
        deleting
      ) {
        return;
      }

      try {
        setDeleting(true);
        setError("");

        const token =
          await AsyncStorage.getItem(
            "token"
          );

        if (!token) {
          await handleExpiredSession();
          return;
        }

        await API.delete(
          `/children/${childId}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        router.replace(
          "/parent/parentHome" as never
        );
      } catch (requestError) {
        console.log(
          "DELETE CHILD ERROR:",
          requestError
        );

        if (
          axios.isAxiosError(
            requestError
          ) &&
          requestError.response
            ?.status === 401
        ) {
          await handleExpiredSession();
          return;
        }

        setError(
          getErrorMessage(
            requestError,
            "Failed to delete the child profile. Please try again."
          )
        );
      } finally {
        setDeleting(false);
      }
    };

  const confirmDeleteChild =
    () => {
      Alert.alert(
        "Delete Child Profile",

        `Are you sure you want to delete ${childName}'s profile? This action cannot be undone.`,

        [
          {
            text: "Cancel",
            style: "cancel",
          },

          {
            text: "Delete",
            style: "destructive",
            onPress:
              deleteChild,
          },
        ]
      );
    };

  const openProfileOptions =
    () => {
      Alert.alert(
        "Child Profile",

        `Manage ${childName}'s profile.`,

        [
          {
            text: "Edit Profile",
            onPress:
              openEditChild,
          },

          {
            text: "Delete Child",
            style: "destructive",
            onPress:
              confirmDeleteChild,
          },

          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={
            styles.centerContainer
          }
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
            Loading child profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (
    error &&
    !overview
  ) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={
            styles.errorScreen
          }
        >
          <View
            style={
              styles.errorIcon
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={35}
              color="#B65A61"
            />
          </View>

          <Text
            style={
              styles.errorTitle
            }
          >
            Unable to load profile
          </Text>

          <Text
            style={
              styles.errorDescription
            }
          >
            {error}
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={
              loadOverview
            }
            style={
              styles.retryButton
            }
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color="#3976A4"
            />

            <Text
              style={
                styles.retryButtonText
              }
            >
              Try Again
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              router.back()
            }
            style={
              styles.goBackButton
            }
          >
            <Text
              style={
                styles.goBackButtonText
              }
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
    >
      <View
        style={styles.container}
      >
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.scrollContent
          }
        >
          <View
            style={styles.header}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                router.back()
              }
              style={
                styles.backButton
              }
              disabled={deleting}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#222222"
              />
            </TouchableOpacity>

            <Text
              style={
                styles.headerTitle
              }
            >
              Child Profile
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              style={
                styles.moreButton
              }
              onPress={
                openProfileOptions
              }
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator
                  size="small"
                  color="#555555"
                />
              ) : (
                <Ionicons
                  name="ellipsis-horizontal"
                  size={22}
                  color="#555555"
                />
              )}
            </TouchableOpacity>
          </View>

          {error ? (
            <View
              style={
                styles.inlineErrorContainer
              }
            >
              <Ionicons
                name="alert-circle-outline"
                size={17}
                color="#D9534F"
              />

              <Text
                style={
                  styles.inlineErrorText
                }
              >
                {error}
              </Text>
            </View>
          ) : null}

          <View
            style={
              styles.childSection
            }
          >
            <View
              style={
                styles.childImageWrapper
              }
            >
              <Image
                source={require("../../assets/images/images/childPhoto.png")}
                style={
                  styles.childImage
                }
              />

              <View
                style={
                  styles.statusDot
                }
              />
            </View>

            <Text
              style={
                styles.childName
              }
            >
              {childName}
            </Text>

            <Text
              style={
                styles.childAge
              }
            >
              {childAge
                ? `(${childAge} years old)`
                : ""}
            </Text>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={
                openEditChild
              }
              disabled={deleting}
              style={
                styles.editChildWrapper
              }
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
                style={
                  styles.editChildButton
                }
              >
                <Feather
                  name="edit-2"
                  size={13}
                  color="#292D31"
                />

                <Text
                  style={
                    styles.editChildButtonText
                  }
                >
                  Edit Profile
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View
              style={
                styles.trendBadge
              }
            >
              <Ionicons
                name={
                  caseData?.status ===
                  "improving"
                    ? "trending-up-outline"
                    : "analytics-outline"
                }
                size={15}
                color="#3976A4"
              />

              <Text
                style={
                  styles.trendBadgeText
                }
              >
                {trendText}
              </Text>
            </View>

            <Text
              style={
                styles.childDescription
              }
            >
              {childNotes ||
                `No parent notes have been added for ${childName} yet.`}
            </Text>
          </View>

          <Text
            style={
              styles.sectionTitle
            }
          >
            Quick Actions
          </Text>

          <View
            style={
              styles.quickActionsContainer
            }
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={
                openAIChat
              }
              style={
                styles.quickActionWrapper
              }
            >
              <LinearGradient
                colors={[
                  "#B9D8F6",
                  "#DDF6F1",
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
                  styles.quickActionCard
                }
              >
                <View
                  style={
                    styles.quickActionIcon
                  }
                >
                  <Ionicons
                    name="sparkles"
                    size={22}
                    color="#3976A4"
                  />
                </View>

                <View
                  style={
                    styles.quickActionContent
                  }
                >
                  <Text
                    style={
                      styles.quickActionTitle
                    }
                  >
                    Talk to AI
                  </Text>

                  <Text
                    style={
                      styles.quickActionDescription
                    }
                    numberOfLines={2}
                  >
                    Discuss {childName}'s
                    feelings and behavior.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#3976A4"
                />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={
                openProgress
              }
              style={
                styles.quickActionWrapper
              }
            >
              <LinearGradient
                colors={[
                  "#E7F7EC",
                  "#F2FBF5",
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
                  styles.quickActionCard
                }
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    styles.progressActionIcon,
                  ]}
                >
                  <Ionicons
                    name="analytics-outline"
                    size={22}
                    color="#4D8B67"
                  />
                </View>

                <View
                  style={
                    styles.quickActionContent
                  }
                >
                  <Text
                    style={
                      styles.quickActionTitle
                    }
                  >
                    View Progress
                  </Text>

                  <Text
                    style={
                      styles.quickActionDescription
                    }
                    numberOfLines={2}
                  >
                    Track {childName}'s
                    emotional changes and
                    long-term trends.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#4D8B67"
                />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={
                openChildEntries
              }
              style={
                styles.quickActionWrapper
              }
            >
              <LinearGradient
                colors={[
                  "#FDE3E2",
                  "#FFF3F2",
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
                  styles.quickActionCard
                }
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    styles.historyActionIcon,
                  ]}
                >
                  <Feather
                    name="clock"
                    size={21}
                    color="#B65A61"
                  />
                </View>

                <View
                  style={
                    styles.quickActionContent
                  }
                >
                  <Text
                    style={
                      styles.quickActionTitle
                    }
                  >
                    View History
                  </Text>

                  <Text
                    style={
                      styles.quickActionDescription
                    }
                    numberOfLines={2}
                  >
                    Review previous entries
                    and updates.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#B65A61"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text
            style={
              styles.sectionTitle
            }
          >
            Quick Summary
          </Text>

          <View
            style={styles.card}
          >
            <View
              style={styles.row}
            >
              <Text
                style={styles.label}
              >
                Current Emotion
              </Text>

              <View
                style={
                  styles.emotionValue
                }
              >
                {caseData ? (
                  <View
                    style={
                      styles.calmDot
                    }
                  />
                ) : null}

                <Text
                  style={
                    caseData
                      ? styles.value
                      : styles.emptyValue
                  }
                >
                  {currentEmotion}
                </Text>
              </View>
            </View>

            <View
              style={styles.row}
            >
              <Text
                style={styles.label}
              >
                Long-term Trend
              </Text>

              <Text
                style={
                  caseData?.status ===
                  "improving"
                    ? styles.improvingValue
                    : styles.value
                }
              >
                {trendText}
              </Text>
            </View>

            <View
              style={styles.row}
            >
              <Text
                style={styles.label}
              >
                Total Entries
              </Text>

              <Text
                style={styles.value}
              >
                {totalEntries}
              </Text>
            </View>

            <View
              style={[
                styles.row,
                styles.lastRow,
              ]}
            >
              <Text
                style={styles.label}
              >
                Last Analysis
              </Text>

              <Text
                style={
                  caseData
                    ? styles.value
                    : styles.emptyValue
                }
              >
                {formatDate(
                  caseData
                    ?.lastAnalysisDate
                )}
              </Text>
            </View>
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
              Latest Analysis
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={
                openAIChat
              }
            >
              <Text
                style={
                  styles.askAIText
                }
              >
                Ask AI
              </Text>
            </TouchableOpacity>
          </View>

          {caseData ? (
            <View
              style={styles.card}
            >
              <View
                style={styles.row}
              >
                <Text
                  style={styles.label}
                >
                  Dominant Emotion
                </Text>

                <Text
                  style={styles.value}
                >
                  {caseData
                    .dominantEmotion ||
                    "Unknown"}
                </Text>
              </View>

              <View
                style={styles.row}
              >
                <Text
                  style={styles.label}
                >
                  Confidence
                </Text>

                <Text
                  style={styles.value}
                >
                  {confidence}%
                </Text>
              </View>

              <View
                style={[
                  styles.row,
                  styles.lastRow,
                ]}
              >
                <Text
                  style={styles.label}
                >
                  Status
                </Text>

                <View
                  style={
                    caseData.status ===
                    "reviewed"
                      ? styles.reviewedBadge
                      : styles.pendingBadge
                  }
                >
                  <Text
                    style={
                      caseData.status ===
                      "reviewed"
                        ? styles.reviewedText
                        : styles.pendingText
                    }
                  >
                    {formatStatus(
                      caseData.status
                    )}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.summaryBox
                }
              >
                <View
                  style={
                    styles.summaryTitleRow
                  }
                >
                  <Ionicons
                    name="sparkles-outline"
                    size={15}
                    color="#B65A61"
                  />

                  <Text
                    style={
                      styles.summaryTitle
                    }
                  >
                    AI Summary
                  </Text>
                </View>

                <Text
                  style={
                    styles.summaryText
                  }
                >
                  {caseData.aiSummary ||
                    caseData.aiDiagnosis ||
                    "The AI summary has not been generated yet."}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={
                  openAIChat
                }
                style={
                  styles.discussResultButton
                }
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={17}
                  color="#3976A4"
                />

                <Text
                  style={
                    styles.discussResultText
                  }
                >
                  Ask AI About This Result
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={17}
                  color="#3976A4"
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={
                styles.emptyStateCard
              }
            >
              <View
                style={
                  styles.emptyStateIcon
                }
              >
                <Ionicons
                  name="sparkles-outline"
                  size={25}
                  color="#3976A4"
                />
              </View>

              <Text
                style={
                  styles.emptyStateTitle
                }
              >
                No analysis available
              </Text>

              <Text
                style={
                  styles.emptyStateDescription
                }
              >
                Start a conversation with
                the AI to create the first
                emotional analysis for{" "}
                {childName}.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={
                  openAIChat
                }
                style={
                  styles.emptyStateButton
                }
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={17}
                  color="#3976A4"
                />

                <Text
                  style={
                    styles.emptyStateButtonText
                  }
                >
                  Talk to AI
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text
            style={
              styles.sectionTitle
            }
          >
            Latest Doctor Insight
          </Text>

          {doctorInsight ? (
            <View
              style={styles.card}
            >
              <View
                style={
                  styles.doctorRow
                }
              >
                <Image
                  source={
                    doctorImageSource
                  }
                  style={
                    styles.doctorImage
                  }
                />

                <View
                  style={
                    styles.doctorInfo
                  }
                >
                  <Text
                    style={
                      styles.doctorName
                    }
                  >
                    {doctor?.fullName ||
                      "Assigned Specialist"}
                  </Text>

                  <Text
                    style={
                      styles.doctorRole
                    }
                  >
                    {doctor
                      ?.specialization ||
                      "Child Psychology Specialist"}
                  </Text>
                </View>

                {doctor?.isVerified ? (
                  <View
                    style={
                      styles.verifiedBadge
                    }
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#4CAF70"
                    />
                  </View>
                ) : null}
              </View>

              <View
                style={
                  styles.doctorSummaryBox
                }
              >
                <Text
                  style={
                    styles.doctorSummaryText
                  }
                >
                  {doctorInsight}
                </Text>
              </View>

              <Text
                style={styles.date}
              >
                {formatDate(
                  doctorInsightDate
                )}
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.emptyStateCard
              }
            >
              <View
                style={[
                  styles.emptyStateIcon,
                  styles.doctorEmptyIcon,
                ]}
              >
                <Ionicons
                  name="medical-outline"
                  size={25}
                  color="#4D8B67"
                />
              </View>

              <Text
                style={
                  styles.emptyStateTitle
                }
              >
                No doctor insight yet
              </Text>

              <Text
                style={
                  styles.emptyStateDescription
                }
              >
                A specialist's
                recommendation will appear
                here after reviewing the
                child's case.
              </Text>
            </View>
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
              Recent Entries
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={
                openChildEntries
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
          </View>

          {recentEntries.length >
          0 ? (
            recentEntries
              .slice(0, 2)
              .map((entry) => {
                const isReviewed =
                  entry.status ===
                    "reviewed" ||
                  entry.status ===
                    "closed";

                return (
                  <TouchableOpacity
                    key={entry.id}
                    activeOpacity={0.85}
                    onPress={() =>
                      openEntryDetails(
                        entry
                      )
                    }
                    style={
                      styles.entryCard
                    }
                  >
                    <View
                      style={[
                        styles.entryIcon,

                        isReviewed &&
                          styles.reviewedEntryIcon,
                      ]}
                    >
                      <Ionicons
                        name={
                          entry.type ===
                          "Drawing Entry"
                            ? "image-outline"
                            : "document-text-outline"
                        }
                        size={20}
                        color={
                          isReviewed
                            ? "#4D8B67"
                            : "#3976A4"
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.entryContent
                      }
                    >
                      <View
                        style={
                          styles.entryHeader
                        }
                      >
                        <Text
                          style={
                            styles.entryDate
                          }
                        >
                          {formatDate(
                            entry.date
                          )}
                        </Text>

                        <View
                          style={
                            isReviewed
                              ? styles.reviewedBadge
                              : styles.pendingBadge
                          }
                        >
                          <Text
                            style={
                              isReviewed
                                ? styles.reviewedText
                                : styles.pendingText
                            }
                          >
                            {formatStatus(
                              entry.status
                            )}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={
                          styles.entryText
                        }
                      >
                        {entry.type} ·{" "}
                        {entry.emotion}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#AAAAAA"
                    />
                  </TouchableOpacity>
                );
              })
          ) : (
            <View
              style={
                styles.emptyEntriesCard
              }
            >
              <View
                style={
                  styles.entryIcon
                }
              >
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#3976A4"
                />
              </View>

              <View
                style={
                  styles.entryContent
                }
              >
                <Text
                  style={
                    styles.emptyEntryTitle
                  }
                >
                  No entries yet
                </Text>

                <Text
                  style={
                    styles.emptyEntryDescription
                  }
                >
                  New text, image, and
                  voice entries will appear
                  here.
                </Text>
              </View>
            </View>
          )}

          <View
            style={
              styles.bottomSpace
            }
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },

    container: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },

    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 30,
    },

    loadingText: {
      marginTop: 14,
      fontSize: 11,
      color: "#777777",
    },

    errorScreen: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 28,
    },

    errorIcon: {
      width: 70,
      height: 70,
      borderRadius: 35,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFF1F1",
    },

    errorTitle: {
      marginTop: 18,
      fontSize: 18,
      fontWeight: "700",
      color: "#222222",
    },

    errorDescription: {
      marginTop: 8,
      fontSize: 10.5,
      lineHeight: 16,
      textAlign: "center",
      color: "#777777",
    },

    retryButton: {
      marginTop: 22,
      minWidth: 145,
      height: 46,
      borderRadius: 23,
      backgroundColor: "#EDF6FD",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },

    retryButtonText: {
      marginLeft: 7,
      fontSize: 10,
      fontWeight: "600",
      color: "#3976A4",
    },

    goBackButton: {
      marginTop: 12,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },

    goBackButtonText: {
      fontSize: 10,
      color: "#777777",
    },

    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 35,
    },

    header: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 18,
    },

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#F7F8FA",
    },

    moreButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#F7F8FA",
    },

    headerTitle: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "600",
      color: "#222222",
    },

    inlineErrorContainer: {
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

    inlineErrorText: {
      flex: 1,
      marginLeft: 7,
      color: "#D9534F",
      fontSize: 9.5,
      lineHeight: 14,
    },

    childSection: {
      alignItems: "center",
      marginBottom: 25,
    },

    childImageWrapper: {
      position: "relative",
      marginBottom: 10,
    },

    childImage: {
      width: 90,
      height: 90,
      borderRadius: 45,
      borderWidth: 4,
      borderColor: "#F2F5F8",
    },

    statusDot: {
      position: "absolute",
      right: 3,
      bottom: 5,
      width: 17,
      height: 17,
      borderRadius: 9,
      backgroundColor: "#6FD195",
      borderWidth: 3,
      borderColor: "#FFFFFF",
    },

    childName: {
      fontSize: 14,
      fontWeight: "700",
      color: "#222222",
    },

    childAge: {
      fontSize: 8.5,
      color: "#666666",
      marginTop: 3,
    },

    editChildWrapper: {
      marginTop: 10,
      borderRadius: 18,
      shadowColor: "#7A8792",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.08,
      shadowRadius: 5,
      elevation: 2,
    },

    editChildButton: {
      height: 35,
      paddingHorizontal: 17,
      borderRadius: 18,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },

    editChildButtonText: {
      marginLeft: 6,
      fontSize: 8.8,
      fontWeight: "600",
      color: "#292D31",
    },

    trendBadge: {
      marginTop: 10,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#EDF6FD",
    },

    trendBadgeText: {
      marginLeft: 5,
      fontSize: 8.5,
      fontWeight: "600",
      color: "#3976A4",
    },

    childDescription: {
      width: "85%",
      marginTop: 9,
      textAlign: "center",
      color: "#777777",
      fontSize: 9.5,
      lineHeight: 14,
    },

    sectionTitle: {
      fontSize: 13,
      fontWeight: "500",
      marginBottom: 12,
      color: "#222222",
    },

    sectionHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "flex-start",
    },

    askAIText: {
      fontSize: 8.5,
      color: "#3976A4",
      fontWeight: "600",
    },

    viewAllText: {
      fontSize: 8.5,
      color: "#3976A4",
      fontWeight: "600",
    },

    quickActionsContainer: {
      marginBottom: 23,
    },

    quickActionWrapper: {
      marginBottom: 10,
    },

    quickActionCard: {
      minHeight: 74,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
    },

    quickActionIcon: {
      width: 43,
      height: 43,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor:
        "rgba(255,255,255,0.65)",
    },

    progressActionIcon: {
      backgroundColor:
        "rgba(255,255,255,0.55)",
    },

    historyActionIcon: {
      backgroundColor:
        "rgba(255,255,255,0.55)",
    },

    quickActionContent: {
      flex: 1,
      marginHorizontal: 12,
    },

    quickActionTitle: {
      fontSize: 10,
      fontWeight: "700",
      color: "#222222",
    },

    quickActionDescription: {
      marginTop: 3,
      fontSize: 8.5,
      lineHeight: 13,
      color: "#5D6872",
    },

    card: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#ECECEC",
      borderRadius: 18,
      padding: 15,
      marginBottom: 22,
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
    },

    row: {
      minHeight: 42,
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: "#F1F1F1",
    },

    lastRow: {
      borderBottomWidth: 0,
    },

    label: {
      color: "#888888",
      fontSize: 9.5,
    },

    value: {
      color: "#222222",
      fontSize: 9.5,
      fontWeight: "600",
    },

    emptyValue: {
      color: "#999999",
      fontSize: 9,
      fontWeight: "500",
    },

    improvingValue: {
      color: "#3976A4",
      fontSize: 9.5,
      fontWeight: "700",
    },

    emotionValue: {
      flexDirection: "row",
      alignItems: "center",
    },

    calmDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "#6FD195",
      marginRight: 6,
    },

    pendingBadge: {
      backgroundColor: "#FDE3E2",
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 20,
    },

    pendingText: {
      color: "#A14D4B",
      fontSize: 7.5,
      fontWeight: "500",
    },

    reviewedBadge: {
      backgroundColor: "#DDF5E5",
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 20,
    },

    reviewedText: {
      color: "#397951",
      fontSize: 7.5,
      fontWeight: "500",
    },

    summaryBox: {
      backgroundColor: "#FFF4F4",
      borderColor: "#FBC0BF",
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      marginTop: 15,
    },

    summaryTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },

    summaryTitle: {
      marginLeft: 5,
      color: "#B65A61",
      fontSize: 8.5,
      fontWeight: "600",
    },

    summaryText: {
      color: "#666666",
      fontSize: 9,
      lineHeight: 14,
    },

    discussResultButton: {
      minHeight: 44,
      borderRadius: 14,
      marginTop: 13,
      paddingHorizontal: 13,
      backgroundColor: "#EDF6FD",
      flexDirection: "row",
      alignItems: "center",
    },

    discussResultText: {
      flex: 1,
      marginLeft: 7,
      fontSize: 9,
      fontWeight: "600",
      color: "#3976A4",
    },

    doctorRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    doctorImage: {
      width: 55,
      height: 55,
      borderRadius: 28,
    },

    doctorInfo: {
      flex: 1,
      marginLeft: 12,
    },

    doctorName: {
      fontSize: 10,
      fontWeight: "700",
      color: "#222222",
    },

    doctorRole: {
      fontSize: 8.5,
      color: "#777777",
      marginTop: 4,
    },

    verifiedBadge: {
      marginLeft: 8,
    },

    doctorSummaryBox: {
      backgroundColor: "#F6FAFD",
      borderColor: "#DCEAF4",
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      marginTop: 15,
    },

    doctorSummaryText: {
      color: "#666666",
      fontSize: 9,
      lineHeight: 14,
    },

    date: {
      textAlign: "right",
      color: "#999999",
      fontSize: 8.5,
      marginTop: 12,
    },

    entryCard: {
      minHeight: 76,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#ECECEC",
      borderRadius: 16,
      padding: 12,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
    },

    entryIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: "#EDF6FD",
      justifyContent: "center",
      alignItems: "center",
    },

    reviewedEntryIcon: {
      backgroundColor: "#EAF8EF",
    },

    entryContent: {
      flex: 1,
      marginLeft: 11,
      marginRight: 6,
    },

    entryHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    entryDate: {
      color: "#999999",
      fontSize: 8.5,
    },

    entryText: {
      marginTop: 7,
      fontSize: 9.5,
      fontWeight: "600",
      color: "#222222",
    },

    emptyStateCard: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#ECECEC",
      borderRadius: 18,
      paddingHorizontal: 18,
      paddingVertical: 22,
      marginBottom: 22,
      alignItems: "center",
    },

    emptyStateIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#EDF6FD",
    },

    doctorEmptyIcon: {
      backgroundColor: "#EAF8EF",
    },

    emptyStateTitle: {
      marginTop: 12,
      fontSize: 11,
      fontWeight: "700",
      color: "#333333",
    },

    emptyStateDescription: {
      marginTop: 6,
      maxWidth: 270,
      textAlign: "center",
      fontSize: 9,
      lineHeight: 14,
      color: "#888888",
    },

    emptyStateButton: {
      marginTop: 14,
      minHeight: 40,
      borderRadius: 20,
      paddingHorizontal: 18,
      backgroundColor: "#EDF6FD",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    emptyStateButtonText: {
      marginLeft: 7,
      fontSize: 9,
      fontWeight: "600",
      color: "#3976A4",
    },

    emptyEntriesCard: {
      minHeight: 76,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#ECECEC",
      borderRadius: 16,
      padding: 12,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
    },

    emptyEntryTitle: {
      fontSize: 9.5,
      fontWeight: "700",
      color: "#333333",
    },

    emptyEntryDescription: {
      marginTop: 5,
      fontSize: 8.5,
      lineHeight: 13,
      color: "#888888",
    },

    bottomSpace: {
      height: 20,
    },
  });