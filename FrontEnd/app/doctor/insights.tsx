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
  type Href,
} from "expo-router";

import Svg, {
  Circle,
  G,
} from "react-native-svg";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import API from "../api";

const girlPhoto = require("../../assets/images/images/girl.png");
const boyPhoto = require("../../assets/images/images/boy.png");
const childPhoto = require("../../assets/images/images/child.png");

type IoniconName =
  keyof typeof Ionicons.glyphMap;

type PopulatedChild = {
  _id?: string;
  id?: string;
  name?: string;
  age?: number;
  gender?: string;
};

type WeeklySummary = {
  newCases?: number;
  reviewedCases?: number;
  activeCases?: number;
};

type EmotionStat = {
  emotion?: string;
  count?: number;
  percentage?: number;
};

type RawAttentionCase = {
  _id: string;

  childId?:
    | string
    | PopulatedChild
    | null;

  dominantEmotion?: string;
  aiDiagnosis?: string;
  aiSummary?: string;
  priority?: string;
  status?: string;
  recurringPatterns?: string[];
};

type WeeklyStatsResponse = {
  summary?: WeeklySummary;
  emotionStats?: EmotionStat[];
  attentionRequired?: RawAttentionCase[];
};

type HistoryStatsResponse = {
  totalCases?: number;
  pending?: number;
  reviewed?: number;
  closed?: number;
  improving?: number;
  avgTimeMinutes?: number;
};

type DashboardStatsResponse = {
  pendingCases?: number;
  reviewedCases?: number;
  newThisWeek?: number;
  childrenFollowed?: number;
};

type DistributionItem = {
  name: string;
  value: number;
  count: number;
  color: string;
};

type PatternItem = {
  title: string;
  count: number;
  percentage: number;
  icon: IoniconName;
  iconColor: string;
  iconBackground: string;
};

type AttentionCase = {
  caseId: string;
  childId: string;
  name: string;
  age: number | null;
  gender: string;
  indicator: string;
  priority: string;
  avatar: number;
};

type BottomNavItemProps = {
  icon: IoniconName;
  activeIcon: IoniconName;
  label: string;
  active?: boolean;
  onPress: () => void;
};

const EMOTION_COLORS = [
  "#E85E66",
  "#F0A544",
  "#75AEE1",
  "#55B96A",
  "#9C7CC1",
  "#4EB4A7",
  "#C47D91",
  "#7B8793",
];

const getChildData = (
  childId:
    | RawAttentionCase["childId"]
): PopulatedChild => {
  if (
    childId &&
    typeof childId === "object"
  ) {
    return childId;
  }

  return {};
};

const getChildId = (
  childId:
    | RawAttentionCase["childId"]
): string => {
  if (
    typeof childId === "string"
  ) {
    return childId;
  }

  return (
    childId?._id ||
    childId?.id ||
    ""
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

const normalizePercentage = (
  value?: number
): number => {
  const numeric =
    Number(value || 0);

  if (
    !Number.isFinite(
      numeric
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      numeric
    )
  );
};

const formatNumber = (
  value?: number
): string => {
  const numeric =
    Number(value || 0);

  return Number.isFinite(
    numeric
  )
    ? String(numeric)
    : "0";
};

const getErrorMessage = (
  error: unknown
): string => {
  if (
    !axios.isAxiosError(
      error
    )
  ) {
    return (
      "Insights could not be loaded."
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
    "Insights could not be loaded."
  );
};

const getPatternIcon = (
  pattern: string
): {
  icon: IoniconName;
  iconColor: string;
  iconBackground: string;
} => {
  const value =
    pattern
      .toLowerCase();

  if (
    value.includes(
      "school"
    )
  ) {
    return {
      icon:
        "school-outline",
      iconColor:
        "#F15D65",
      iconBackground:
        "#FFE7E8",
    };
  }

  if (
    value.includes(
      "sleep"
    )
  ) {
    return {
      icon:
        "moon-outline",
      iconColor:
        "#338CF0",
      iconBackground:
        "#EAF4FF",
    };
  }

  if (
    value.includes(
      "social"
    )
  ) {
    return {
      icon:
        "people-outline",
      iconColor:
        "#43B25B",
      iconBackground:
        "#DDF8E2",
    };
  }

  if (
    value.includes(
      "anger"
    ) ||
    value.includes(
      "stress"
    )
  ) {
    return {
      icon:
        "warning-outline",
      iconColor:
        "#D99133",
      iconBackground:
        "#FFF5E8",
    };
  }

  return {
    icon:
      "pulse-outline",
    iconColor:
      "#6D9EC8",
    iconBackground:
      "#EAF5FD",
  };
};

export default function DoctorInsightsScreen() {
  const [
    weeklyStats,
    setWeeklyStats,
  ] =
    useState<WeeklyStatsResponse>(
      {}
    );

  const [
    historyStats,
    setHistoryStats,
  ] =
    useState<HistoryStatsResponse>(
      {}
    );

  const [
    dashboardStats,
    setDashboardStats,
  ] =
    useState<DashboardStatsResponse>(
      {}
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

  const loadInsights =
    useCallback(
      async (
        mode:
          | "initial"
          | "refresh" =
          "initial"
      ) => {
        if (
          mode === "refresh"
        ) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setScreenError("");

        try {
          const [
            weeklyResponse,
            historyResponse,
            dashboardResponse,
          ] =
            await Promise.all([
              API.get<WeeklyStatsResponse>(
                "/doctor/weekly-stats"
              ),

              API.get<HistoryStatsResponse>(
                "/doctor/history-stats"
              ),

              API.get<DashboardStatsResponse>(
                "/doctor/dashboard-stats"
              ),
            ]);

          setWeeklyStats(
            weeklyResponse.data ||
            {}
          );

          setHistoryStats(
            historyResponse.data ||
            {}
          );

          setDashboardStats(
            dashboardResponse.data ||
            {}
          );
        } catch (error) {
          console.log(
            "LOAD DOCTOR INSIGHTS ERROR:",
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
        handleExpiredSession,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      void loadInsights(
        "initial"
      );
    }, [loadInsights])
  );

  const distributionData =
    useMemo<
      DistributionItem[]
    >(() => {
      const source =
        Array.isArray(
          weeklyStats.emotionStats
        )
          ? weeklyStats.emotionStats
          : [];

      return source
        .filter(
          (
            item
          ) =>
            Boolean(
              String(
                item.emotion ||
                ""
              ).trim()
            )
        )
        .map(
          (
            item,
            index
          ) => ({
            name:
              String(
                item.emotion
              ),

            value:
              normalizePercentage(
                item.percentage
              ),

            count:
              Number(
                item.count || 0
              ),

            color:
              EMOTION_COLORS[
                index %
                  EMOTION_COLORS.length
              ],
          })
        );
    }, [
      weeklyStats.emotionStats,
    ]);

  const attentionCases =
    useMemo<
      AttentionCase[]
    >(() => {
      const source =
        Array.isArray(
          weeklyStats.attentionRequired
        )
          ? weeklyStats.attentionRequired
          : [];

      return source
        .filter(
          (
            item
          ) =>
            Boolean(
              item?._id
            ) &&
            Boolean(
              item?.childId
            )
        )
        .map(
          (
            item
          ) => {
            const child =
              getChildData(
                item.childId
              );

            return {
              caseId:
                item._id,

              childId:
                getChildId(
                  item.childId
                ),

              name:
                child.name ||
                "Unknown child",

              age:
                typeof child.age ===
                "number"
                  ? child.age
                  : null,

              gender:
                child.gender ||
                "",

              indicator:
                item.aiDiagnosis ||
                item.aiSummary ||
                item.dominantEmotion ||
                "High-priority case requires review.",

              priority:
                item.priority ||
                "High",

              avatar:
                getAvatar(
                  child.gender
                ),
            };
          }
        );
    }, [
      weeklyStats.attentionRequired,
    ]);

  const behavioralPatterns =
    useMemo<
      PatternItem[]
    >(() => {
      const source =
        Array.isArray(
          weeklyStats.attentionRequired
        )
          ? weeklyStats.attentionRequired
          : [];

      const counts =
        new Map<
          string,
          number
        >();

      source.forEach(
        (
          caseItem
        ) => {
          const patterns =
            Array.isArray(
              caseItem.recurringPatterns
            )
              ? caseItem.recurringPatterns
              : [];

          patterns.forEach(
            (
              pattern
            ) => {
              if (
                typeof pattern !==
                  "string" ||
                !pattern.trim()
              ) {
                return;
              }

              const cleanPattern =
                pattern.trim();

              counts.set(
                cleanPattern,
                (
                  counts.get(
                    cleanPattern
                  ) || 0
                ) + 1
              );
            }
          );
        }
      );

      const total =
        Math.max(
          1,
          source.length
        );

      return Array.from(
        counts.entries()
      )
        .sort(
          (
            first,
            second
          ) =>
            second[1] -
            first[1]
        )
        .slice(
          0,
          5
        )
        .map(
          ([
            title,
            count,
          ]) => ({
            title,
            count,

            percentage:
              Math.round(
                (
                  count /
                  total
                ) *
                100
              ),

            ...getPatternIcon(
              title
            ),
          })
        );
    }, [
      weeklyStats.attentionRequired,
    ]);

  const weeklySummary =
    weeklyStats.summary ||
    {};

  const aiSummary =
    useMemo(() => {
      if (
        distributionData.length ===
        0
      ) {
        return "No emotional distribution is available for the current week yet.";
      }

      const topEmotion =
        distributionData[0];

      return `${topEmotion.name} is the most frequent dominant emotion this week at ${topEmotion.value.toFixed(
        1
      )}%. ${Number(
        weeklySummary.reviewedCases ||
          0
      )} cases were reviewed, while ${Number(
        weeklySummary.activeCases ||
          0
      )} cases remain active.`;
    }, [
      distributionData,
      weeklySummary.activeCases,
      weeklySummary.reviewedCases,
    ]);

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

  const openProfile = () => {
    router.replace(
      "/doctor/profile" as Href
    );
  };

  const openWeeklyReport = () => {
    router.push(
      "/doctor/weekly-summary" as Href
    );
  };

  const openCase = (
    item: AttentionCase
  ) => {
    router.push(
      {
        pathname:
          "/doctor/review-case",

        params: {
          caseId:
            item.caseId,

          childId:
            item.childId,
        },
      } as Href
    );
  };

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
      edges={["top"]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

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
        style={
          styles.background
        }
      >
        <View
          style={
            styles.mainContainer
          }
        >
          {loading ? (
            <View
              style={
                styles.loadingState
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
                Loading insights...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={
                styles.scrollView
              }
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
                    void loadInsights(
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
                  activeOpacity={0.7}
                  onPress={() =>
                    router.back()
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
                  Insights
                </Text>

                <TouchableOpacity
                  style={
                    styles.refreshButton
                  }
                  activeOpacity={0.7}
                  disabled={
                    refreshing
                  }
                  onPress={() =>
                    void loadInsights(
                      "refresh"
                    )
                  }
                >
                  <Ionicons
                    name="refresh-outline"
                    size={21}
                    color="#1F2937"
                  />
                </TouchableOpacity>
              </View>

              {screenError ? (
                <View
                  style={
                    styles.errorBanner
                  }
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color="#C95860"
                  />

                  <Text
                    style={
                      styles.errorBannerText
                    }
                  >
                    {screenError}
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      void loadInsights(
                        "refresh"
                      )
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
                  styles.statisticsGrid
                }
              >
                <StatisticCard
                  title="TOTAL CASES"
                  value={formatNumber(
                    historyStats.totalCases
                  )}
                  valueColor="#2084D4"
                />

                <StatisticCard
                  title="ACTIVE CHILDREN"
                  value={formatNumber(
                    dashboardStats.childrenFollowed
                  )}
                  valueColor="#159647"
                />

                <StatisticCard
                  title="REVIEWED CASES"
                  value={formatNumber(
                    historyStats.reviewed
                  )}
                  valueColor="#2084D4"
                />

                <StatisticCard
                  title="PENDING CASES"
                  value={formatNumber(
                    historyStats.pending
                  )}
                  valueColor="#22262A"
                />
              </View>

              <View
                style={
                  styles.aiSummaryCard
                }
              >
                <View
                  style={
                    styles.aiTitleRow
                  }
                >
                  <Ionicons
                    name="sparkles"
                    size={20}
                    color="#40B75B"
                  />

                  <Text
                    style={
                      styles.aiTitle
                    }
                  >
                    WEEKLY INSIGHT SUMMARY
                  </Text>
                </View>

                <Text
                  style={
                    styles.aiSummaryText
                  }
                >
                  {aiSummary}
                </Text>
              </View>

              <View
                style={
                  styles.chartCard
                }
              >
                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  Emotional Distribution
                </Text>

                <Text
                  style={
                    styles.chartDescription
                  }
                >
                  Distribution of dominant emotions across cases created during the last seven days.
                </Text>

                {distributionData.length >
                0 ? (
                  <View
                    style={
                      styles.distributionContent
                    }
                  >
                    <DonutChart
                      data={
                        distributionData
                      }
                    />

                    <View
                      style={
                        styles.distributionLegend
                      }
                    >
                      {distributionData.map(
                        (
                          item
                        ) => (
                          <View
                            key={
                              item.name
                            }
                            style={
                              styles.legendItem
                            }
                          >
                            <View
                              style={[
                                styles.legendDot,

                                {
                                  backgroundColor:
                                    item.color,
                                },
                              ]}
                            />

                            <View
                              style={
                                styles.legendTextArea
                              }
                            >
                              <Text
                                style={
                                  styles.legendLabel
                                }
                              >
                                {
                                  item.name
                                }
                              </Text>

                              <Text
                                style={
                                  styles.legendValue
                                }
                              >
                                {item.value.toFixed(
                                  1
                                )}
                                % ·{" "}
                                {item.count}
                              </Text>
                            </View>
                          </View>
                        )
                      )}
                    </View>
                  </View>
                ) : (
                  <EmptyState
                    icon="pie-chart-outline"
                    title="No weekly emotion data"
                    description="Emotion distribution will appear after new cases are analyzed this week."
                  />
                )}
              </View>

              <WeeklyEmotionBreakdown
                data={
                  distributionData
                }
              />

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Patterns in High-Priority Cases
              </Text>

              {behavioralPatterns.length >
              0 ? (
                <View
                  style={
                    styles.patternsContainer
                  }
                >
                  {behavioralPatterns.map(
                    (
                      item
                    ) => (
                      <View
                        key={
                          item.title
                        }
                        style={
                          styles.patternItem
                        }
                      >
                        <View
                          style={[
                            styles.patternIcon,

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
                            size={21}
                            color={
                              item.iconColor
                            }
                          />
                        </View>

                        <View
                          style={
                            styles.patternTextContainer
                          }
                        >
                          <Text
                            style={
                              styles.patternTitle
                            }
                          >
                            {item.title}
                          </Text>

                          <Text
                            style={
                              styles.patternPrevalence
                            }
                          >
                            {item.count}{" "}
                            {item.count ===
                            1
                              ? "case"
                              : "cases"}{" "}
                            ·{" "}
                            {item.percentage}
                            %
                          </Text>
                        </View>
                      </View>
                    )
                  )}
                </View>
              ) : (
                <Text
                  style={
                    styles.emptyInlineText
                  }
                >
                  No recurring patterns are available in the current high-priority cases.
                </Text>
              )}

              <View
                style={
                  styles.achievementsCard
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Current Activity
                </Text>

                <View
                  style={
                    styles.achievementsContainer
                  }
                >
                  <AchievementChip
                    icon="shield-checkmark-outline"
                    label={`${formatNumber(
                      historyStats.reviewed
                    )} Cases Reviewed`}
                    backgroundColor="#E6E8FF"
                    color="#4852B8"
                  />

                  <AchievementChip
                    icon="add-circle-outline"
                    label={`${formatNumber(
                      weeklySummary.newCases
                    )} New This Week`}
                    backgroundColor="#E2F3FC"
                    color="#4C859E"
                  />

                  <AchievementChip
                    icon="people-outline"
                    label={`${formatNumber(
                      dashboardStats.childrenFollowed
                    )} Children Followed`}
                    backgroundColor="#E8F4E8"
                    color="#557A59"
                  />
                </View>
              </View>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Children Requiring Attention
              </Text>

              {attentionCases.length >
              0 ? (
                <View
                  style={
                    styles.attentionContainer
                  }
                >
                  {attentionCases.map(
                    (
                      item
                    ) => (
                      <AttentionCaseCard
                        key={
                          item.caseId
                        }
                        item={
                          item
                        }
                        onPress={() =>
                          openCase(
                            item
                          )
                        }
                      />
                    )
                  )}
                </View>
              ) : (
                <EmptyState
                  icon="checkmark-circle-outline"
                  title="No urgent cases"
                  description="There are no high-priority pending cases assigned to you right now."
                />
              )}

              <View
                style={
                  styles.performanceCard
                }
              >
                <Text
                  style={
                    styles.performanceTitle
                  }
                >
                  Your Performance
                </Text>

                <View
                  style={
                    styles.performanceStats
                  }
                >
                  <PerformanceItem
                    value={formatNumber(
                      weeklySummary.reviewedCases
                    )}
                    label="Reviewed This Week"
                    valueColor="#202F99"
                  />

                  <PerformanceItem
                    value={formatNumber(
                      weeklySummary.activeCases
                    )}
                    label="Active Cases"
                    valueColor="#202F99"
                  />

                  <PerformanceItem
                    value={`${formatNumber(
                      historyStats.avgTimeMinutes
                    )} min`}
                    label="Avg Review"
                    valueColor="#202522"
                  />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={
                  openWeeklyReport
                }
                style={
                  styles.weeklyReportButton
                }
              >
                <Text
                  style={
                    styles.weeklyReportButtonText
                  }
                >
                  View Weekly Report
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          <View
            style={
              styles.bottomNavigation
            }
          >
            <BottomNavItem
              icon="home-outline"
              activeIcon="home"
              label="Home"
              onPress={
                openHome
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
              active
              onPress={() =>
                undefined
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

function StatisticCard({
  title,
  value,
  valueColor,
}: {
  title: string;
  value: string;
  valueColor: string;
}) {
  return (
    <View
      style={
        styles.statisticCard
      }
    >
      <Text
        style={
          styles.statisticTitle
        }
      >
        {title}
      </Text>

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
    </View>
  );
}

function DonutChart({
  data,
}: {
  data:
    DistributionItem[];
}) {
  const size =
    126;

  const strokeWidth =
    28;

  const radius =
    (
      size -
      strokeWidth
    ) /
    2;

  const circumference =
    2 *
    Math.PI *
    radius;

  let accumulatedValue =
    0;

  return (
    <View
      style={
        styles.donutWrapper
      }
    >
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <G
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        >
          {data.map(
            (
              item
            ) => {
              const segmentLength =
                (
                  item.value /
                  100
                ) *
                circumference;

              const strokeDashoffset =
                -(
                  (
                    accumulatedValue /
                    100
                  ) *
                  circumference
                );

              accumulatedValue +=
                item.value;

              return (
                <Circle
                  key={
                    item.name
                  }
                  cx={
                    size /
                    2
                  }
                  cy={
                    size /
                    2
                  }
                  r={
                    radius
                  }
                  fill="transparent"
                  stroke={
                    item.color
                  }
                  strokeWidth={
                    strokeWidth
                  }
                  strokeDasharray={`${segmentLength} ${
                    circumference -
                    segmentLength
                  }`}
                  strokeDashoffset={
                    strokeDashoffset
                  }
                  strokeLinecap="butt"
                />
              );
            }
          )}
        </G>
      </Svg>

      <View
        style={
          styles.donutCenter
        }
      >
        <Text
          style={
            styles.donutCenterText
          }
        >
          {data.reduce(
            (
              total,
              item
            ) =>
              total +
              item.count,
            0
          )}
        </Text>

        <Text
          style={
            styles.donutCenterLabel
          }
        >
          cases
        </Text>
      </View>
    </View>
  );
}

function WeeklyEmotionBreakdown({
  data,
}: {
  data:
    DistributionItem[];
}) {
  return (
    <View
      style={
        styles.weeklyTrendCard
      }
    >
      <View
        style={
          styles.weeklyTrendHeader
        }
      >
        <View
          style={
            styles.weeklyTrendTitleArea
          }
        >
          <Text
            style={
              styles.cardTitle
            }
          >
            Weekly Emotion Breakdown
          </Text>

          <Text
            style={
              styles.weeklyTrendDescription
            }
          >
            Aggregated emotion counts returned by the weekly statistics endpoint.
          </Text>
        </View>

        <View
          style={
            styles.weeklyPeriodBadge
          }
        >
          <Ionicons
            name="calendar-outline"
            size={13}
            color="#66859D"
          />

          <Text
            style={
              styles.weeklyPeriodText
            }
          >
            Last 7 Days
          </Text>
        </View>
      </View>

      {data.length > 0 ? (
        <View
          style={
            styles.breakdownList
          }
        >
          {data.map(
            (
              item
            ) => (
              <View
                key={
                  item.name
                }
                style={
                  styles.breakdownItem
                }
              >
                <View
                  style={
                    styles.breakdownTopRow
                  }
                >
                  <View
                    style={
                      styles.breakdownNameRow
                    }
                  >
                    <View
                      style={[
                        styles.breakdownDot,

                        {
                          backgroundColor:
                            item.color,
                        },
                      ]}
                    />

                    <Text
                      style={
                        styles.breakdownName
                      }
                    >
                      {item.name}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.breakdownValue
                    }
                  >
                    {item.count} ·{" "}
                    {item.value.toFixed(
                      1
                    )}
                    %
                  </Text>
                </View>

                <View
                  style={
                    styles.breakdownTrack
                  }
                >
                  <View
                    style={[
                      styles.breakdownFill,

                      {
                        width:
                          `${Math.max(
                            2,
                            item.value
                          )}%`,

                        backgroundColor:
                          item.color,
                      },
                    ]}
                  />
                </View>
              </View>
            )
          )}
        </View>
      ) : (
        <Text
          style={
            styles.emptyInlineText
          }
        >
          No weekly emotion data is available yet.
        </Text>
      )}
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

function AttentionCaseCard({
  item,
  onPress,
}: {
  item:
    AttentionCase;
  onPress: () => void;
}) {
  return (
    <View
      style={
        styles.caseCard
      }
    >
      <View
        style={
          styles.caseDecoration
        }
      />

      <View
        style={
          styles.caseHeader
        }
      >
        <View
          style={
            styles.childInformation
          }
        >
          <View
            style={
              styles.avatarWrapper
            }
          >
            <Image
              source={
                item.avatar
              }
              style={
                styles.avatar
              }
              contentFit="cover"
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
              {item.name}
            </Text>

            <Text
              style={
                styles.childId
              }
            >
              Child ID{" "}
              {item.childId
                ? `#${item.childId.slice(
                    -6
                  )}`
                : "unavailable"}
              {item.age !==
              null
                ? ` · ${item.age} years`
                : ""}
            </Text>
          </View>
        </View>

        <View
          style={
            styles.highPriorityBadge
          }
        >
          <Text
            style={
              styles.highPriorityText
            }
          >
            {item.priority} Priority
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.indicatorText
        }
        numberOfLines={
          3
        }
      >
        {item.indicator}
      </Text>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={
          styles.detailsButtonWrapper
        }
      >
        <LinearGradient
          colors={[
            "#A4D1F6",
            "#F5ADB1",
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
            styles.detailsButton
          }
        >
          <Text
            style={
              styles.detailsButtonText
            }
          >
            Review Case
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function PerformanceItem({
  value,
  label,
  valueColor,
}: {
  value: string;
  label: string;
  valueColor: string;
}) {
  return (
    <View
      style={
        styles.performanceItem
      }
    >
      <Text
        style={[
          styles.performanceValue,

          {
            color:
              valueColor,
          },
        ]}
      >
        {value}
      </Text>

      <Text
        style={
          styles.performanceLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: IoniconName;
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
          styles.emptyIcon
        }
      >
        <Ionicons
          name={icon}
          size={30}
          color="#78ACD5"
        />
      </View>

      <Text
        style={
          styles.emptyTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.emptyDescription
        }
      >
        {description}
      </Text>
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

    mainContainer: {
      flex: 1,
    },

    loadingState: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      paddingBottom: 70,
    },

    loadingText: {
      marginTop: 12,
      fontSize: 11,
      color: "#7A8087",
    },

    scrollView: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 4,
      paddingBottom: 96,
    },

    header: {
      height: 54,
      flexDirection: "row",
      alignItems: "center",
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

    refreshButton: {
      width: 40,
      height: 40,
      justifyContent:
        "center",
      alignItems:
        "flex-end",
    },

    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: "#202428",
    },

    errorBanner: {
      marginBottom: 13,
      borderRadius: 12,
      backgroundColor: "#FFF0F1",
      paddingHorizontal: 11,
      paddingVertical: 9,
      flexDirection: "row",
      alignItems: "center",
    },

    errorBannerText: {
      flex: 1,
      marginHorizontal: 7,
      fontSize: 9.5,
      lineHeight: 14,
      color: "#925A60",
    },

    retryText: {
      fontSize: 9,
      fontWeight: "700",
      color: "#C95860",
    },

    statisticsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent:
        "space-between",
      rowGap: 9,
      marginBottom: 16,
    },

    statisticCard: {
      width: "48.5%",
      minHeight: 67,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E4EDF3",
      borderRadius: 10,
      paddingHorizontal: 11,
      paddingVertical: 10,
    },

    statisticTitle: {
      fontSize: 8.5,
      color: "#687078",
    },

    statisticValue: {
      marginTop: 5,
      fontSize: 17,
      fontWeight: "700",
    },

    aiSummaryCard: {
      backgroundColor: "#DEF6EA",
      borderRadius: 15,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 17,
      marginBottom: 17,
    },

    aiTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    aiTitle: {
      fontSize: 14,
      fontWeight: "500",
      color: "#36AF51",
    },

    aiSummaryText: {
      marginTop: 13,
      fontSize: 10.5,
      lineHeight: 17,
      color: "#55B96A",
    },

    chartCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingTop: 15,
      paddingBottom: 15,
      marginBottom: 17,
    },

    cardTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: "#292D31",
    },

    chartDescription: {
      marginTop: 5,
      fontSize: 8.5,
      lineHeight: 13,
      color: "#969CA2",
    },

    distributionContent: {
      marginTop: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-around",
    },

    donutWrapper: {
      width: 126,
      height: 126,
      justifyContent: "center",
      alignItems: "center",
    },

    donutCenter: {
      position: "absolute",
      width: 49,
      height: 49,
      borderRadius: 24.5,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
    },

    donutCenterText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#4E555B",
    },

    donutCenterLabel: {
      marginTop: 1,
      fontSize: 7,
      color: "#8B9197",
    },

    distributionLegend: {
      flex: 1,
      marginLeft: 15,
      gap: 9,
    },

    legendItem: {
      flexDirection: "row",
      alignItems: "center",
    },

    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 7,
    },

    legendTextArea: {
      flex: 1,
    },

    legendLabel: {
      fontSize: 9.5,
      color: "#34383C",
    },

    legendValue: {
      marginTop: 2,
      fontSize: 7.5,
      color: "#8A9096",
    },

    weeklyTrendCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 17,
      paddingHorizontal: 13,
      paddingTop: 15,
      paddingBottom: 14,
      marginBottom: 18,
    },

    weeklyTrendHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
    },

    weeklyTrendTitleArea: {
      flex: 1,
      paddingRight: 10,
    },

    weeklyTrendDescription: {
      marginTop: 5,
      fontSize: 8.5,
      lineHeight: 13,
      color: "#91989E",
    },

    weeklyPeriodBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#EEF6FD",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },

    weeklyPeriodText: {
      fontSize: 7.5,
      fontWeight: "600",
      color: "#66859D",
    },

    breakdownList: {
      marginTop: 17,
      gap: 14,
    },

    breakdownItem: {
      width: "100%",
    },

    breakdownTopRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 7,
    },

    breakdownNameRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    breakdownDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 7,
    },

    breakdownName: {
      fontSize: 9.5,
      color: "#464C52",
    },

    breakdownValue: {
      fontSize: 8.5,
      fontWeight: "600",
      color: "#727980",
    },

    breakdownTrack: {
      height: 8,
      borderRadius: 999,
      overflow: "hidden",
      backgroundColor: "#EDF0F2",
    },

    breakdownFill: {
      height: "100%",
      borderRadius: 999,
    },

    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: "#292D31",
      marginBottom: 11,
    },

    patternsContainer: {
      gap: 9,
      marginBottom: 17,
    },

    patternItem: {
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
      paddingHorizontal: 11,
    },

    patternIcon: {
      width: 42,
      height: 42,
      borderRadius: 11,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },

    patternTextContainer: {
      flex: 1,
    },

    patternTitle: {
      fontSize: 11.5,
      fontWeight: "600",
      color: "#292D31",
    },

    patternPrevalence: {
      marginTop: 4,
      fontSize: 9,
      color: "#6E747B",
    },

    emptyInlineText: {
      marginTop: -2,
      marginBottom: 18,
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 18,
      fontSize: 9.5,
      lineHeight: 15,
      color: "#8C9298",
      textAlign: "center",
    },

    achievementsCard: {
      backgroundColor: "#F7F7F8",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingTop: 13,
      paddingBottom: 13,
      marginBottom: 18,
    },

    achievementsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
    },

    achievementChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 7,
    },

    achievementText: {
      fontSize: 8.5,
      fontWeight: "500",
    },

    attentionContainer: {
      gap: 11,
      marginBottom: 17,
    },

    caseCard: {
      position: "relative",
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7E8EA",
      borderRadius: 17,
      paddingHorizontal: 11,
      paddingTop: 11,
      paddingBottom: 10,
      overflow: "hidden",
    },

    caseDecoration: {
      position: "absolute",
      width: 67,
      height: 67,
      borderRadius: 33.5,
      right: -18,
      top: -17,
      backgroundColor: "#FFF0F1",
    },

    caseHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
    },

    childInformation: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },

    avatarWrapper: {
      width: 43,
      height: 43,
      borderRadius: 21.5,
      backgroundColor: "#FFF1EC",
      borderWidth: 1,
      borderColor: "#EEDDD7",
      overflow: "hidden",
      marginRight: 9,
    },

    avatar: {
      width: "100%",
      height: "100%",
    },

    childTextContainer: {
      flex: 1,
    },

    childName: {
      fontSize: 15,
      fontWeight: "700",
      color: "#25282B",
    },

    childId: {
      marginTop: 2,
      fontSize: 8.5,
      color: "#777D84",
    },

    highPriorityBadge: {
      zIndex: 2,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 5,
      backgroundColor: "#FFE0E2",
    },

    highPriorityText: {
      fontSize: 8,
      color: "#F05D65",
    },

    indicatorText: {
      marginTop: 8,
      fontSize: 10,
      lineHeight: 15,
      color: "#5F7181",
    },

    detailsButtonWrapper: {
      marginTop: 9,
    },

    detailsButton: {
      height: 34,
      borderRadius: 999,
      justifyContent: "center",
      alignItems: "center",
    },

    detailsButtonText: {
      fontSize: 10,
      fontWeight: "600",
      color: "#25282C",
    },

    performanceCard: {
      backgroundColor: "#F2EEFF",
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingTop: 13,
      paddingBottom: 14,
      marginBottom: 13,
    },

    performanceTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: "#292D31",
    },

    performanceStats: {
      flexDirection: "row",
      marginTop: 17,
    },

    performanceItem: {
      flex: 1,
      alignItems: "center",
    },

    performanceValue: {
      fontSize: 19,
      fontWeight: "700",
    },

    performanceLabel: {
      marginTop: 4,
      paddingHorizontal: 3,
      fontSize: 8,
      color: "#60656B",
      textAlign: "center",
    },

    weeklyReportButton: {
      width: "100%",
      height: 52,
      borderRadius: 999,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#A9D0F3",
      marginBottom: 4,
    },

    weeklyReportButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#22262A",
    },

    emptyState: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: 14,
      paddingHorizontal: 20,
      paddingVertical: 25,
      marginBottom: 17,
    },

    emptyIcon: {
      width: 58,
      height: 58,
      borderRadius: 29,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#EDF7FF",
    },

    emptyTitle: {
      marginTop: 12,
      fontSize: 13,
      fontWeight: "700",
      color: "#30353A",
    },

    emptyDescription: {
      marginTop: 6,
      maxWidth: 260,
      fontSize: 9.5,
      lineHeight: 15,
      color: "#8D9399",
      textAlign: "center",
    },

    bottomNavigation: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 70,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-around",
      backgroundColor: "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor: "#E9EAED",
      paddingBottom: 6,
      elevation: 5,
    },

    bottomNavItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },

    bottomNavLabel: {
      fontSize: 9,
      color: "#A2A6AC",
    },

    bottomNavLabelActive: {
      color: "#5E88A7",
      fontWeight: "600",
    },
  });
