import React, {
  useCallback,
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

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  LinearGradient,
} from "expo-linear-gradient";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  Image,
} from "expo-image";

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
  type Href,
} from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import API from "../api";

const girlPhoto = require("../../assets/images/images/girl.png");
const boyPhoto = require("../../assets/images/images/boy.png");
const childPhoto = require("../../assets/images/images/child.png");

type IoniconName =
  keyof typeof Ionicons.glyphMap;

type ChildInfo = {
  id?: string;
  _id?: string;
  name?: string;
  age?: number;
  gender?: string;
  parentId?: string;
};

type RawTrendItem = {
  week?: string;
  label?: string;
  date?: string;
  emotion?: string;
  name?: string;
  value?: number;
  percentage?: number;
  score?: number;
  color?: string;
};

type RawEmotionItem = {
  emotion?: string;
  name?: string;
  value?: number;
  percentage?: number;
  count?: number;
  color?: string;
};

type RawTimelineItem = {
  _id?: string;
  analysisId?: string;
  diagnosis?: string;
  emotion?: string;
  confidence?: number;
  date?: string;
  createdAt?: string;
  status?: string;
};

type RawRecommendationItem = {
  _id?: string;
  date?: string;
  createdAt?: string;
  note?: string;
  text?: string;
};

type ChildOverviewResponse = {
  childInfo?: ChildInfo;
  latestCaseId?: string;
  longTermSummary?: string;
  currentStatus?: string;
  priority?: string;
  emotionalTrend?: RawTrendItem[];
  mostFrequentEmotions?: RawEmotionItem[];
  analysisTimeline?: RawTimelineItem[];
  childProgress?: string;
  doctorRecommendation?: string;
  doctorRecommendations?: RawRecommendationItem[];
  recurringPatterns?: string[];
};

type EmotionalTrendItem = {
  id: string;
  week: string;
  emoji: string;
  color: string;
  emotion: string;
};

type EmotionItem = {
  name: string;
  value: number;
  emoji: string;
  color: string;
};

type AnalysisItem = {
  id: string;
  emotion: string;
  diagnosis: string;
  confidence: number | null;
  date: string;
  rawDate: string;
  status: string;
  icon: IoniconName;
  iconColor: string;
  iconBackground: string;
};

type RecommendationItem = {
  id: string;
  date: string;
  text: string;
};

const getParamValue = (
  value?: string | string[]
): string => {
  return Array.isArray(value)
    ? value[0] || ""
    : value || "";
};

const normalizePercentage = (
  value?: number
): number => {
  if (
    value === undefined ||
    value === null ||
    Number.isNaN(Number(value))
  ) {
    return 0;
  }

  const numericValue =
    Number(value);

  const percentage =
    numericValue <= 1
      ? numericValue * 100
      : numericValue;

  return Math.max(
    0,
    Math.min(100, percentage)
  );
};

const formatDate = (
  value?: string
): string => {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not available";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
};

const getEmotionMeta = (
  emotionValue?: string
) => {
  const emotion =
    String(
      emotionValue || "unknown"
    )
      .trim()
      .toLowerCase();

  const values: Record<
    string,
    {
      label: string;
      emoji: string;
      color: string;
      icon: IoniconName;
      iconColor: string;
      iconBackground: string;
    }
  > = {
    happy: {
      label: "Happy",
      emoji: "🙂",
      color: "#91D8BA",
      icon: "happy-outline",
      iconColor: "#178D7B",
      iconBackground: "#DCF3EC",
    },

    happiness: {
      label: "Happy",
      emoji: "🙂",
      color: "#91D8BA",
      icon: "happy-outline",
      iconColor: "#178D7B",
      iconBackground: "#DCF3EC",
    },

    sad: {
      label: "Sad",
      emoji: "😢",
      color: "#AFCDEB",
      icon: "rainy-outline",
      iconColor: "#4D81B4",
      iconBackground: "#E7F1FB",
    },

    sadness: {
      label: "Sad",
      emoji: "😢",
      color: "#AFCDEB",
      icon: "rainy-outline",
      iconColor: "#4D81B4",
      iconBackground: "#E7F1FB",
    },

    angry: {
      label: "Angry",
      emoji: "😠",
      color: "#F4A7A9",
      icon: "flame-outline",
      iconColor: "#D85A62",
      iconBackground: "#FFE7E8",
    },

    anger: {
      label: "Angry",
      emoji: "😠",
      color: "#F4A7A9",
      icon: "flame-outline",
      iconColor: "#D85A62",
      iconBackground: "#FFE7E8",
    },

    fear: {
      label: "Fear",
      emoji: "😨",
      color: "#F6B9BC",
      icon: "alert-circle-outline",
      iconColor: "#EF555D",
      iconBackground: "#FFE7E8",
    },

    anxiety: {
      label: "Anxiety",
      emoji: "😟",
      color: "#F7B5B9",
      icon: "headset-outline",
      iconColor: "#EF555D",
      iconBackground: "#FFE7E8",
    },

    stress: {
      label: "Stress",
      emoji: "😟",
      color: "#F6B6BA",
      icon: "warning-outline",
      iconColor: "#EF555D",
      iconBackground: "#FFE7E8",
    },

    surprise: {
      label: "Surprise",
      emoji: "😲",
      color: "#F6D29D",
      icon: "sparkles-outline",
      iconColor: "#D28C34",
      iconBackground: "#FFF4E5",
    },

    disgust: {
      label: "Disgust",
      emoji: "🤢",
      color: "#B5D8B1",
      icon: "leaf-outline",
      iconColor: "#568B4F",
      iconBackground: "#EAF5E7",
    },

    neutral: {
      label: "Neutral",
      emoji: "😐",
      color: "#C9D4DD",
      icon: "remove-circle-outline",
      iconColor: "#66717C",
      iconBackground: "#EEF1F4",
    },

    calm: {
      label: "Calm",
      emoji: "😌",
      color: "#A9DFC9",
      icon: "leaf-outline",
      iconColor: "#178D7B",
      iconBackground: "#DCF3EC",
    },

    improving: {
      label: "Improving",
      emoji: "🙂",
      color: "#A9E3C8",
      icon: "trending-up-outline",
      iconColor: "#45AF57",
      iconBackground: "#E1F8EB",
    },

    unknown: {
      label: "Unknown",
      emoji: "🤔",
      color: "#D7DDE2",
      icon: "help-circle-outline",
      iconColor: "#737C84",
      iconBackground: "#EDF0F2",
    },
  };

  return (
    values[emotion] ||
    {
      ...values.unknown,
      label:
        emotionValue || "Unknown",
    }
  );
};

const getAvatar = (
  gender?: string
): number => {
  const value =
    String(gender || "")
      .trim()
      .toLowerCase();

  if (
    value === "female" ||
    value === "girl"
  ) {
    return girlPhoto;
  }

  if (
    value === "male" ||
    value === "boy"
  ) {
    return boyPhoto;
  }

  return childPhoto;
};

const getErrorMessage = (
  error: unknown
): string => {
  if (
    !axios.isAxiosError(error)
  ) {
    return (
      "The child overview could not be loaded."
    );
  }

  const data =
    error.response?.data as
      | {
          message?: unknown;
          error?: unknown;
          detail?: unknown;
        }
      | undefined;

  const message =
    data?.message ??
    data?.error ??
    data?.detail;

  if (
    typeof message === "string" &&
    message.trim()
  ) {
    return message;
  }

  return (
    "The child overview could not be loaded."
  );
};

export default function ChildOverviewScreen() {
  const params =
    useLocalSearchParams<{
      childId?:
        | string
        | string[];
      caseId?:
        | string
        | string[];
    }>();

  const childIdParam =
    getParamValue(
      params.childId
    );

  const caseIdParam =
    getParamValue(
      params.caseId
    );

  const [
    overview,
    setOverview,
  ] =
    useState<ChildOverviewResponse | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    screenError,
    setScreenError,
  ] =
    useState("");

  const handleExpiredSession =
    useCallback(async () => {
      await AsyncStorage.multiRemove(
        [
          "token",
          "user",
        ]
      );

      router.replace(
        "/auth/login" as Href
      );
    }, []);

  const loadOverview =
    useCallback(
      async (
        mode:
          | "initial"
          | "refresh" =
          "initial"
      ) => {
        if (
          !childIdParam
        ) {
          setScreenError(
            "Child ID is missing. Open this page from a case."
          );
          setLoading(false);
          setRefreshing(false);
          return;
        }

        if (
          mode === "refresh"
        ) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setScreenError("");

        try {
          const response =
            await API.get<ChildOverviewResponse>(
              `/doctor/child-overview/${childIdParam}`
            );

          setOverview(
            response.data
          );
        } catch (error) {
          console.log(
            "LOAD CHILD OVERVIEW ERROR:",
            error
          );

          if (
            axios.isAxiosError(
              error
            ) &&
            error.response?.status ===
              401
          ) {
            await handleExpiredSession();
            return;
          }

          setScreenError(
            getErrorMessage(
              error
            )
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        childIdParam,
        handleExpiredSession,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      void loadOverview(
        "initial"
      );
    }, [loadOverview])
  );

  const childInfo =
    overview?.childInfo ||
    {};

  const childId =
    childInfo.id ||
    childInfo._id ||
    childIdParam;

  const latestCaseId =
    overview?.latestCaseId ||
    caseIdParam;

  const childName =
    childInfo.name ||
    "Unknown child";

  const childAge =
    childInfo.age;

  const childStatus =
    overview?.childProgress ||
    overview?.currentStatus ||
    "Under Monitoring";

  const longTermSummary =
    overview?.longTermSummary ||
    "No long-term AI summary is available yet.";

  const emotionalTrend =
    useMemo<EmotionalTrendItem[]>(
      () => {
        const source =
          Array.isArray(
            overview?.emotionalTrend
          )
            ? overview?.emotionalTrend
            : [];

        return source
          .slice(-4)
          .map(
            (
              item,
              index
            ) => {
              const emotionValue =
                item.emotion ||
                item.name ||
                item.label ||
                "unknown";

              const meta =
                getEmotionMeta(
                  emotionValue
                );

              return {
                id:
                  `${item.date || item.week || index}-${emotionValue}`,

                week:
                  item.week ||
                  item.label ||
                  `W${index + 1}`,

                emoji:
                  meta.emoji,

                color:
                  item.color ||
                  meta.color,

                emotion:
                  meta.label,
              };
            }
          );
      },
      [overview]
    );

  const frequentEmotions =
    useMemo<EmotionItem[]>(
      () => {
        const source =
          Array.isArray(
            overview?.mostFrequentEmotions
          )
            ? overview?.mostFrequentEmotions
            : [];

        const totalCount =
          source.reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.count || 0
              ),
            0
          );

        return source
          .map(
            (
              item
            ) => {
              const emotionValue =
                item.emotion ||
                item.name ||
                "unknown";

              const meta =
                getEmotionMeta(
                  emotionValue
                );

              const rawValue =
                item.percentage ??
                item.value ??
                (
                  totalCount > 0
                    ? (
                        Number(
                          item.count || 0
                        ) /
                        totalCount
                      ) *
                      100
                    : 0
                );

              return {
                name:
                  meta.label,

                value:
                  normalizePercentage(
                    rawValue
                  ),

                emoji:
                  meta.emoji,

                color:
                  item.color ||
                  meta.color,
              };
            }
          )
          .sort(
            (
              first,
              second
            ) =>
              second.value -
              first.value
          )
          .slice(0, 5);
      },
      [overview]
    );

  const analysisTimeline =
    useMemo<AnalysisItem[]>(
      () => {
        const source =
          Array.isArray(
            overview?.analysisTimeline
          )
            ? overview?.analysisTimeline
            : [];

        return source
          .map(
            (
              item,
              index
            ) => {
              const meta =
                getEmotionMeta(
                  item.emotion
                );

              const rawDate =
                item.date ||
                item.createdAt ||
                "";

              return {
                id:
                  item._id ||
                  item.analysisId ||
                  `${rawDate}-${index}`,

                emotion:
                  meta.label,

                diagnosis:
                  item.diagnosis ||
                  "",

                confidence:
                  item.confidence ===
                    undefined
                    ? null
                    : normalizePercentage(
                        item.confidence
                      ),

                date:
                  formatDate(
                    rawDate
                  ),

                rawDate,

                status:
                  item.status ||
                  overview?.currentStatus ||
                  "Pending",

                icon:
                  meta.icon,

                iconColor:
                  meta.iconColor,

                iconBackground:
                  meta.iconBackground,
              };
            }
          )
          .sort(
            (
              first,
              second
            ) =>
              new Date(
                second.rawDate
              ).getTime() -
              new Date(
                first.rawDate
              ).getTime()
          );
      },
      [overview]
    );

  const recommendations =
    useMemo<RecommendationItem[]>(
      () => {
        const source =
          Array.isArray(
            overview?.doctorRecommendations
          )
            ? overview?.doctorRecommendations
            : [];

        const mapped =
          source
            .map(
              (
                item,
                index
              ) => {
                const text =
                  item.note ||
                  item.text ||
                  "";

                const rawDate =
                  item.date ||
                  item.createdAt ||
                  "";

                return {
                  id:
                    item._id ||
                    `${rawDate}-${index}`,

                  date:
                    formatDate(
                      rawDate
                    ),

                  text,
                };
              }
            )
            .filter(
              (
                item
              ) =>
                Boolean(
                  item.text.trim()
                )
            );

        if (
          mapped.length === 0 &&
          overview?.doctorRecommendation
        ) {
          mapped.push({
            id:
              "latest-recommendation",

            date:
              "Latest recommendation",

            text:
              overview.doctorRecommendation,
          });
        }

        return mapped;
      },
      [overview]
    );

  const recurringPatterns =
    useMemo(() => {
      const source =
        Array.isArray(
          overview?.recurringPatterns
        )
          ? overview?.recurringPatterns
          : [];

      return source.filter(
        (
          item
        ): item is string =>
          typeof item === "string" &&
          Boolean(
            item.trim()
          )
      );
    }, [overview]);

  const firstEntryDate =
    useMemo(() => {
      if (
        analysisTimeline.length ===
        0
      ) {
        return "Not available";
      }

      const validDates =
        analysisTimeline
          .map(
            (
              item
            ) =>
              new Date(
                item.rawDate
              )
          )
          .filter(
            (
              date
            ) =>
              !Number.isNaN(
                date.getTime()
              )
          )
          .sort(
            (
              first,
              second
            ) =>
              first.getTime() -
              second.getTime()
          );

      return validDates.length > 0
        ? formatDate(
            validDates[0].toISOString()
          )
        : "Not available";
    }, [analysisTimeline]);

  const currentStatusDescription =
    overview?.priority
      ? `Current priority is ${overview.priority}. Continue reviewing the child's new analyses and progress.`
      : "Continue reviewing the child's new analyses and emotional progress.";

  const monitoringTitle =
    childStatus ||
    "Needs Monitoring";

  const monitoringLevel =
    overview?.priority
      ? `${overview.priority} Priority`
      : "Monitoring Required";

  const monitoringDescription =
    overview?.currentStatus
      ? `Current case status: ${overview.currentStatus}.`
      : "Requires continued observation.";

  const handleBack = () => {
    router.back();
  };

  const createAnalysisHistoryRoute =
    (
      item?: AnalysisItem
    ): Href => {
      return {
        pathname:
          "/doctor/child-analysis-history",

        params: {
          childId,
          caseId:
            latestCaseId,
          focusEmotion:
            item?.emotion ||
            "",
          focusDate:
            item?.rawDate ||
            "",
        },
      } as Href;
    };

  const handleViewAnalysis =
    (
      item: AnalysisItem
    ) => {
      router.push(
        createAnalysisHistoryRoute(
          item
        )
      );
    };

  const handleViewAll = () => {
    router.push(
      createAnalysisHistoryRoute()
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.centerState
        }
      >
        <ActivityIndicator
          size="large"
          color="#6799C2"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading child overview...
        </Text>
      </SafeAreaView>
    );
  }

  if (
    screenError ||
    !overview
  ) {
    return (
      <SafeAreaView
        style={
          styles.safeArea
        }
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />

        <View
          style={
            styles.errorHeader
          }
        >
          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={
              handleBack
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
            Child Overview
          </Text>

          <View
            style={
              styles.headerPlaceholder
            }
          />
        </View>

        <View
          style={
            styles.centerState
          }
        >
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color="#D95C64"
          />

          <Text
            style={
              styles.errorTitle
            }
          >
            Overview unavailable
          </Text>

          <Text
            style={
              styles.errorMessage
            }
          >
            {screenError}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            style={
              styles.retryButton
            }
            onPress={() =>
              void loadOverview(
                "initial"
              )
            }
          >
            <Text
              style={
                styles.retryButtonText
              }
            >
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
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
          "#FFF9F9",
          "#F9FCFF",
        ]}
        locations={[
          0,
          0.48,
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
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={() =>
                void loadOverview(
                  "refresh"
                )
              }
              tintColor="#6799C2"
            />
          }
        >
          <View
            style={
              styles.header
            }
          >
            <TouchableOpacity
              style={
                styles.backButton
              }
              onPress={
                handleBack
              }
              activeOpacity={0.7}
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
              Child Overview
            </Text>

            <TouchableOpacity
              style={
                styles.headerRefresh
              }
              activeOpacity={0.7}
              onPress={() =>
                void loadOverview(
                  "refresh"
                )
              }
              disabled={
                refreshing
              }
            >
              <Ionicons
                name="refresh-outline"
                size={21}
                color="#1F2937"
              />
            </TouchableOpacity>
          </View>

          <View
            style={
              styles.childCard
            }
          >
            <View
              style={
                styles.decorationTopLeft
              }
            />

            <View
              style={
                styles.decorationTopRight
              }
            />

            <View
              style={
                styles.decorationBottomLeft
              }
            />

            <View
              style={
                styles.decorationBottomRight
              }
            />

            <View
              style={
                styles.avatarWrapper
              }
            >
              <Image
                source={
                  getAvatar(
                    childInfo.gender
                  )
                }
                style={
                  styles.avatarImage
                }
                contentFit="cover"
              />
            </View>

            <View
              style={
                styles.statusBadge
              }
            >
              <Ionicons
                name="trending-up-outline"
                size={11}
                color="#44B35A"
              />

              <Text
                style={
                  styles.statusBadgeText
                }
              >
                {childStatus}
              </Text>
            </View>

            <Text
              style={
                styles.childName
              }
            >
              {childName}
              {typeof childAge ===
              "number"
                ? ` (${childAge} Years)`
                : ""}
            </Text>

            <Text
              style={
                styles.childId
              }
            >
              {childId
                ? `#${childId.slice(
                    -6
                  )}`
                : "Child ID unavailable"}
            </Text>

            <Text
              style={
                styles.firstEntry
              }
            >
              First analysis ·{" "}
              {firstEntryDate}
            </Text>
          </View>

          <View
            style={
              styles.longTermCard
            }
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              Long-Term Summary
            </Text>

            <Text
              style={
                styles.longTermText
              }
            >
              {longTermSummary}
            </Text>
          </View>

          <View
            style={
              styles.currentStatusCard
            }
          >
            <View
              style={
                styles.currentStatusHeader
              }
            >
              <Text
                style={
                  styles.currentStatusTitle
                }
              >
                Current Status
              </Text>

              <View
                style={
                  styles.currentStatusBadge
                }
              >
                <Ionicons
                  name="trending-up-outline"
                  size={12}
                  color="#45AF57"
                />

                <Text
                  style={
                    styles.currentStatusBadgeText
                  }
                >
                  {childStatus}
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.currentStatusText
              }
            >
              {
                currentStatusDescription
              }
            </Text>
          </View>

          <View
            style={
              styles.sectionCard
            }
          >
            <View
              style={
                styles.sectionCardHeader
              }
            >
              <Text
                style={
                  styles.cardTitle
                }
              >
                Emotional Trend
              </Text>

              <Text
                style={
                  styles.sectionSideText
                }
              >
                Latest Timeline
              </Text>
            </View>

            <View
              style={
                styles.separator
              }
            />

            {emotionalTrend.length >
            0 ? (
              <>
                <View
                  style={
                    styles.weeklyTrendRow
                  }
                >
                  {emotionalTrend.map(
                    (
                      item
                    ) => (
                      <View
                        key={
                          item.id
                        }
                        style={
                          styles.weekItem
                        }
                      >
                        <View
                          style={[
                            styles.weekEmotionBox,

                            {
                              backgroundColor:
                                item.color,
                            },
                          ]}
                        >
                          <Text
                            style={
                              styles.weekEmoji
                            }
                          >
                            {
                              item.emoji
                            }
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.weekLabel
                          }
                        >
                          {item.week}
                        </Text>
                      </View>
                    )
                  )}
                </View>

                <View
                  style={
                    styles.separator
                  }
                />

                <View
                  style={
                    styles.legendContainer
                  }
                >
                  {emotionalTrend.map(
                    (
                      item
                    ) => (
                      <LegendItem
                        key={
                          `legend-${item.id}`
                        }
                        color={
                          item.color
                        }
                        label={
                          item.emotion.toUpperCase()
                        }
                      />
                    )
                  )}
                </View>
              </>
            ) : (
              <EmptySectionText text="No emotional trend data is available yet." />
            )}
          </View>

          <View
            style={
              styles.sectionCard
            }
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              Most Frequent Emotions
            </Text>

            <View
              style={
                styles.separator
              }
            />

            {frequentEmotions.length >
            0 ? (
              <View
                style={
                  styles.emotionsContainer
                }
              >
                {frequentEmotions.map(
                  (
                    emotion
                  ) => (
                    <EmotionProgress
                      key={
                        emotion.name
                      }
                      {...emotion}
                    />
                  )
                )}
              </View>
            ) : (
              <EmptySectionText text="No frequent emotion data is available yet." />
            )}
          </View>

          <View
            style={
              styles.timelineHeader
            }
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={
                handleViewAll
              }
              style={
                styles.timelineTitleButton
              }
            >
              <Text
                style={
                  styles.cardTitle
                }
              >
                Analysis Timeline
              </Text>

              <Ionicons
                name="chevron-forward"
                size={16}
                color="#7C848B"
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={
                handleViewAll
              }
              style={
                styles.viewAllButton
              }
            >
              <Text
                style={
                  styles.viewAllText
                }
              >
                VIEW ALL
              </Text>

              <Ionicons
                name="arrow-forward"
                size={12}
                color="#F2A5AA"
              />
            </TouchableOpacity>
          </View>

          <View
            style={
              styles.timelineContainer
            }
          >
            {analysisTimeline.length >
            0 ? (
              analysisTimeline
                .slice(0, 4)
                .map(
                  (
                    item
                  ) => (
                    <TouchableOpacity
                      key={
                        item.id
                      }
                      style={
                        styles.analysisItem
                      }
                      activeOpacity={0.8}
                      onPress={() =>
                        handleViewAnalysis(
                          item
                        )
                      }
                    >
                      <View
                        style={[
                          styles.analysisIcon,

                          {
                            backgroundColor:
                              item.iconBackground,
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            item.icon
                          }
                          size={20}
                          color={
                            item.iconColor
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.analysisTextContainer
                        }
                      >
                        <Text
                          style={
                            styles.analysisEmotion
                          }
                        >
                          {item.emotion}
                        </Text>

                        <Text
                          style={
                            styles.analysisDate
                          }
                        >
                          {item.date}
                          {item.confidence !==
                          null
                            ? ` · ${item.confidence.toFixed(
                                0
                              )}%`
                            : ""}
                        </Text>

                        {item.diagnosis ? (
                          <Text
                            style={
                              styles.analysisDiagnosis
                            }
                            numberOfLines={
                              1
                            }
                          >
                            {
                              item.diagnosis
                            }
                          </Text>
                        ) : null}
                      </View>

                      <View
                        style={
                          styles.analysisStatus
                        }
                      >
                        <Text
                          style={
                            styles.analysisStatusText
                          }
                        >
                          {
                            item.status
                          }
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#777F87"
                      />
                    </TouchableOpacity>
                  )
                )
            ) : (
              <EmptySectionText text="No analyses are available yet." />
            )}
          </View>

          <LinearGradient
            colors={[
              "#FFF1F1",
              "#FFD9DA",
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
              styles.recommendationsCard
            }
          >
            <View
              style={
                styles.recommendationTitleRow
              }
            >
              <Ionicons
                name="clipboard-outline"
                size={19}
                color="#30353A"
              />

              <Text
                style={
                  styles.cardTitle
                }
              >
                Doctor Recommendations
              </Text>
            </View>

            {recommendations.length >
            0 ? (
              <View
                style={
                  styles.recommendationTimeline
                }
              >
                {recommendations.map(
                  (
                    recommendation,
                    index
                  ) => (
                    <View
                      key={
                        recommendation.id
                      }
                      style={[
                        styles.recommendationItem,

                        index !==
                          recommendations.length -
                            1 &&
                          styles.recommendationItemSpacing,
                      ]}
                    >
                      <View
                        style={
                          styles.recommendationLine
                        }
                      />

                      <View
                        style={
                          styles.recommendationContent
                        }
                      >
                        <Text
                          style={
                            styles.recommendationDate
                          }
                        >
                          {
                            recommendation.date
                          }
                        </Text>

                        <Text
                          style={
                            styles.recommendationText
                          }
                        >
                          {
                            recommendation.text
                          }
                        </Text>
                      </View>
                    </View>
                  )
                )}
              </View>
            ) : (
              <EmptySectionText text="No doctor recommendations have been added yet." />
            )}
          </LinearGradient>

          <Text
            style={
              styles.patternsTitle
            }
          >
            Recurring Patterns
          </Text>

          {recurringPatterns.length >
          0 ? (
            <View
              style={
                styles.patternsContainer
              }
            >
              {recurringPatterns.map(
                (
                  pattern
                ) => (
                  <View
                    key={
                      pattern
                    }
                    style={
                      styles.patternChip
                    }
                  >
                    <View
                      style={
                        styles.patternDot
                      }
                    />

                    <Text
                      style={
                        styles.patternText
                      }
                    >
                      {pattern}
                    </Text>
                  </View>
                )
              )}
            </View>
          ) : (
            <EmptySectionText text="No recurring patterns have been identified yet." />
          )}

          <View
            style={
              styles.monitoringCard
            }
          >
            <View
              style={
                styles.monitoringTitleRow
              }
            >
              <Ionicons
                name="eye-outline"
                size={18}
                color="#657954"
              />

              <Text
                style={
                  styles.monitoringTitle
                }
              >
                {monitoringTitle}
              </Text>
            </View>

            <Text
              style={
                styles.monitoringLevel
              }
            >
              {monitoringLevel}
            </Text>

            <Text
              style={
                styles.monitoringDescription
              }
            >
              {
                monitoringDescription
              }
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function EmptySectionText({
  text,
}: {
  text: string;
}) {
  return (
    <Text
      style={
        styles.emptySectionText
      }
    >
      {text}
    </Text>
  );
}

function LegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <View
      style={
        styles.legendItem
      }
    >
      <View
        style={[
          styles.legendDot,

          {
            backgroundColor:
              color,
          },
        ]}
      />

      <Text
        style={
          styles.legendText
        }
      >
        {label}
      </Text>
    </View>
  );
}

function EmotionProgress({
  name,
  value,
  emoji,
  color,
}: EmotionItem) {
  return (
    <View
      style={
        styles.emotionProgressItem
      }
    >
      <View
        style={
          styles.emotionProgressHeader
        }
      >
        <Text
          style={
            styles.emotionName
          }
        >
          {name}
        </Text>

        <Text
          style={
            styles.emotionPercentage
          }
        >
          {value.toFixed(
            0
          )}
          %
        </Text>
      </View>

      <View
        style={
          styles.progressTrack
        }
      >
        <View
          style={[
            styles.progressValueContainer,

            {
              width:
                `${Math.max(
                  2,
                  value
                )}%`,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,

              {
                backgroundColor:
                  color,
              },
            ]}
          />

          <View
            style={
              styles.progressEmoji
            }
          >
            <Text
              style={
                styles.progressEmojiText
              }
            >
              {emoji}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        "#FFFFFF",
    },

    background: {
      flex: 1,
    },

    centerState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 30,
    },

    loadingText: {
      marginTop: 12,
      fontSize: 11,
      color: "#7A8087",
    },

    errorHeader: {
      height: 58,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    errorTitle: {
      marginTop: 12,
      fontSize: 17,
      fontWeight: "700",
      color: "#292D31",
      textAlign: "center",
    },

    errorMessage: {
      marginTop: 8,
      fontSize: 11,
      lineHeight: 17,
      color: "#858B92",
      textAlign: "center",
    },

    retryButton: {
      marginTop: 20,
      borderRadius: 999,
      backgroundColor: "#6799C2",
      paddingHorizontal: 24,
      paddingVertical: 12,
    },

    retryButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
    },

    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 5,
      paddingBottom: 28,
    },

    header: {
      height: 53,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    backButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "flex-start",
    },

    headerTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: "#22262A",
    },

    headerPlaceholder: {
      width: 40,
    },

    headerRefresh: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "flex-end",
    },

    childCard: {
      position: "relative",
      minHeight: 171,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#F5BFC2",
      borderRadius: 19,
      overflow: "hidden",
      marginBottom: 14,
      paddingTop: 13,
      paddingBottom: 13,
    },

    decorationTopLeft: {
      position: "absolute",
      top: -20,
      left: -16,
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: "#FFF0F1",
    },

    decorationTopRight: {
      position: "absolute",
      top: -20,
      right: -16,
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: "#FFF0F1",
    },

    decorationBottomLeft: {
      position: "absolute",
      bottom: -22,
      left: -15,
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "#FFF0F1",
    },

    decorationBottomRight: {
      position: "absolute",
      bottom: -22,
      right: -15,
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "#FFF0F1",
    },

    avatarWrapper: {
      width: 73,
      height: 73,
      borderRadius: 36.5,
      backgroundColor: "#FFF1E9",
      overflow: "hidden",
      borderWidth: 2,
      borderColor: "#E9D6CA",
    },

    avatarImage: {
      width: "100%",
      height: "100%",
    },

    statusBadge: {
      marginTop: -5,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: "#CFF7D6",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
      zIndex: 2,
    },

    statusBadgeText: {
      fontSize: 8.5,
      fontWeight: "500",
      color: "#44B35A",
      textTransform: "capitalize",
    },

    childName: {
      marginTop: 8,
      fontSize: 16,
      fontWeight: "500",
      color: "#25282B",
    },

    childId: {
      marginTop: 3,
      fontSize: 10,
      color: "#4F555B",
    },

    firstEntry: {
      marginTop: 8,
      fontSize: 9,
      color: "#9A9EA4",
    },

    longTermCard: {
      backgroundColor: "#FFFFFF",
      borderLeftWidth: 2,
      borderLeftColor: "#F0B9BD",
      borderRadius: 9,
      paddingHorizontal: 12,
      paddingTop: 13,
      paddingBottom: 14,
      marginBottom: 14,
    },

    cardTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: "#252A2E",
    },

    longTermText: {
      marginTop: 12,
      fontSize: 10,
      lineHeight: 15,
      color: "#3F454A",
    },

    currentStatusCard: {
      backgroundColor: "#E1F8EB",
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 13,
      marginBottom: 16,
    },

    currentStatusHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    currentStatusTitle: {
      fontSize: 14,
      fontWeight: "500",
      color: "#3CB657",
    },

    currentStatusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: "#C5F4CF",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },

    currentStatusBadgeText: {
      fontSize: 8,
      color: "#45AF57",
      textTransform: "capitalize",
    },

    currentStatusText: {
      marginTop: 10,
      fontSize: 9.5,
      lineHeight: 14,
      color: "#55B869",
    },

    sectionCard: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#F3C2C5",
      borderRadius: 17,
      paddingHorizontal: 13,
      paddingTop: 14,
      paddingBottom: 13,
      marginBottom: 16,
    },

    sectionCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    sectionSideText: {
      fontSize: 9,
      color: "#F0A9AD",
    },

    separator: {
      height: 1,
      backgroundColor: "#EEEEEF",
      marginTop: 12,
      marginBottom: 12,
    },

    weeklyTrendRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },

    weekItem: {
      width: "23%",
      alignItems: "center",
    },

    weekEmotionBox: {
      width: "100%",
      height: 29,
      borderTopLeftRadius: 9,
      borderTopRightRadius: 9,
      justifyContent: "center",
      alignItems: "center",
    },

    weekEmoji: {
      fontSize: 14,
    },

    weekLabel: {
      marginTop: 7,
      fontSize: 9,
      fontWeight: "600",
      color: "#363A3E",
    },

    legendContainer: {
      flexDirection: "row",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: 12,
    },

    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    legendDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },

    legendText: {
      fontSize: 7,
      color: "#666C72",
    },

    emotionsContainer: {
      gap: 12,
    },

    emotionProgressItem: {
      width: "100%",
    },

    emotionProgressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },

    emotionName: {
      fontSize: 10,
      color: "#44494E",
    },

    emotionPercentage: {
      fontSize: 10,
      color: "#292D31",
    },

    progressTrack: {
      width: "100%",
      height: 7,
      borderRadius: 999,
      backgroundColor: "#ECEDEF",
    },

    progressValueContainer: {
      position: "relative",
      height: 7,
    },

    progressFill: {
      width: "100%",
      height: 7,
      borderRadius: 999,
    },

    progressEmoji: {
      position: "absolute",
      right: -7,
      top: -6,
      width: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: "center",
      alignItems: "center",
    },

    progressEmojiText: {
      fontSize: 13,
    },

    timelineHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 2,
      marginBottom: 11,
    },

    timelineTitleButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingVertical: 4,
    },

    viewAllButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 5,
      paddingVertical: 5,
    },

    viewAllText: {
      fontSize: 9,
      color: "#F2A5AA",
    },

    timelineContainer: {
      gap: 10,
      marginBottom: 17,
    },

    analysisItem: {
      minHeight: 61,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F7F7F8",
      borderRadius: 14,
      paddingHorizontal: 11,
      paddingVertical: 9,
    },

    analysisIcon: {
      width: 39,
      height: 39,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 11,
    },

    analysisTextContainer: {
      flex: 1,
    },

    analysisEmotion: {
      fontSize: 12,
      fontWeight: "600",
      color: "#2B3034",
    },

    analysisDate: {
      marginTop: 4,
      fontSize: 8.5,
      color: "#90959B",
    },

    analysisDiagnosis: {
      marginTop: 3,
      fontSize: 8,
      color: "#72787E",
    },

    analysisStatus: {
      backgroundColor: "#D5F9D9",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 5,
      marginRight: 7,
      maxWidth: 80,
    },

    analysisStatusText: {
      fontSize: 7.5,
      color: "#48BC59",
      textTransform: "capitalize",
    },

    recommendationsCard: {
      borderRadius: 13,
      paddingHorizontal: 12,
      paddingTop: 13,
      paddingBottom: 14,
      marginBottom: 18,
    },

    recommendationTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginBottom: 13,
    },

    recommendationTimeline: {
      paddingLeft: 4,
    },

    recommendationItem: {
      position: "relative",
      flexDirection: "row",
    },

    recommendationItemSpacing: {
      marginBottom: 13,
    },

    recommendationLine: {
      width: 2,
      backgroundColor: "#44484D",
      marginRight: 12,
    },

    recommendationContent: {
      flex: 1,
      paddingBottom: 2,
    },

    recommendationDate: {
      fontSize: 9,
      fontWeight: "600",
      color: "#44484D",
    },

    recommendationText: {
      marginTop: 4,
      fontSize: 9.5,
      lineHeight: 14,
      color: "#454A4F",
    },

    patternsTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: "#292D31",
      marginBottom: 11,
    },

    patternsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 18,
    },

    patternChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#FFE7E8",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },

    patternDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: "#333333",
    },

    patternText: {
      fontSize: 9.5,
      color: "#44484D",
    },

    monitoringCard: {
      backgroundColor: "#F0F9E8",
      borderWidth: 1,
      borderColor: "#D1E7BC",
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingTop: 13,
      paddingBottom: 15,
    },

    monitoringTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    monitoringTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: "#60764E",
      textTransform: "capitalize",
    },

    monitoringLevel: {
      marginTop: 13,
      marginLeft: 25,
      fontSize: 10,
      color: "#506143",
    },

    monitoringDescription: {
      marginTop: 8,
      marginLeft: 25,
      fontSize: 9.5,
      color: "#657457",
    },

    emptySectionText: {
      paddingVertical: 12,
      fontSize: 9.5,
      lineHeight: 15,
      color: "#92979E",
      textAlign: "center",
    },
  });
