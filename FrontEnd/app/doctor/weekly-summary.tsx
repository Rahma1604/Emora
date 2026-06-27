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

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import API from "../api";

const girlPhoto = require("../../assets/images/images/girl.png");
const boyPhoto = require("../../assets/images/images/boy.png");
const childPhoto = require("../../assets/images/images/child.png");

type IoniconName =
  keyof typeof Ionicons.glyphMap;

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

type PopulatedChild = {
  _id?: string;
  id?: string;
  name?: string;
  age?: number;
  gender?: string;
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
};

type WeeklyStatsResponse = {
  summary?: WeeklySummary;
  emotionStats?: EmotionStat[];
  attentionRequired?: RawAttentionCase[];
};

type EmotionItem = {
  name: string;
  value: number;
  count: number;
  emoji: string;
  color: string;
};

type AttentionCase = {
  caseId: string;
  childId: string;
  name: string;
  age: number | null;
  indicator: string;
  priority: string;
  avatar: number;
};

const EMOTION_COLORS = [
  "#F5B3B7",
  "#F7BABD",
  "#A9DEC9",
  "#8FD6B7",
  "#AFCDEB",
  "#D8C1ED",
  "#F3D5A8",
  "#C9D4DD",
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
  const normalized =
    String(gender || "")
      .trim()
      .toLowerCase();

  if (
    normalized === "female" ||
    normalized === "girl"
  ) {
    return girlPhoto;
  }

  if (
    normalized === "male" ||
    normalized === "boy"
  ) {
    return boyPhoto;
  }

  return childPhoto;
};

const getEmotionEmoji = (
  emotion?: string
): string => {
  const normalized =
    String(emotion || "")
      .trim()
      .toLowerCase();

  if (
    normalized.includes("happy")
  ) {
    return "🙂";
  }

  if (
    normalized.includes("calm")
  ) {
    return "😌";
  }

  if (
    normalized.includes("stress") ||
    normalized.includes("anxiety")
  ) {
    return "😟";
  }

  if (
    normalized.includes("sad")
  ) {
    return "😢";
  }

  if (
    normalized.includes("anger") ||
    normalized.includes("angry")
  ) {
    return "😠";
  }

  if (
    normalized.includes("fear")
  ) {
    return "😨";
  }

  return "🤔";
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

const getErrorMessage = (
  error: unknown
): string => {
  if (
    !axios.isAxiosError(
      error
    )
  ) {
    return (
      "The weekly summary could not be loaded."
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
    "The weekly summary could not be loaded."
  );
};

export default function WeeklySummaryScreen() {
  const [
    weeklyData,
    setWeeklyData,
  ] =
    useState<WeeklyStatsResponse>(
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

  const loadWeeklySummary =
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
          const response =
            await API.get<WeeklyStatsResponse>(
              "/doctor/weekly-stats"
            );

          setWeeklyData(
            response.data ||
            {}
          );
        } catch (error) {
          console.log(
            "LOAD WEEKLY SUMMARY ERROR:",
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
      void loadWeeklySummary(
        "initial"
      );
    }, [loadWeeklySummary])
  );

  const summary =
    weeklyData.summary ||
    {};

  const emotions =
    useMemo<EmotionItem[]>(
      () => {
        const source =
          Array.isArray(
            weeklyData.emotionStats
          )
            ? weeklyData.emotionStats
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

              emoji:
                getEmotionEmoji(
                  item.emotion
                ),

              color:
                EMOTION_COLORS[
                  index %
                    EMOTION_COLORS.length
                ],
            })
          )
          .sort(
            (
              first,
              second
            ) =>
              second.value -
              first.value
          );
      },
      [
        weeklyData.emotionStats,
      ]
    );

  const attentionCases =
    useMemo<
      AttentionCase[]
    >(() => {
      const source =
        Array.isArray(
          weeklyData.attentionRequired
        )
          ? weeklyData.attentionRequired
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

              indicator:
                item.aiDiagnosis ||
                item.aiSummary ||
                item.dominantEmotion ||
                "This case requires additional review.",

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
      weeklyData.attentionRequired,
    ]);

  const aiWeeklySummary =
    useMemo(() => {
      const topEmotion =
        emotions[0];

      if (!topEmotion) {
        return "No analyzed cases are available for this week yet.";
      }

      return `During the last 7 days, ${topEmotion.name.toLowerCase()} was the most common dominant emotion at ${topEmotion.value.toFixed(
        1
      )}%. ${Number(
        summary.reviewedCases || 0
      )} cases were reviewed and ${Number(
        summary.activeCases || 0
      )} cases remain active.`;
    }, [
      emotions,
      summary.activeCases,
      summary.reviewedCases,
    ]);

  const handleBack = () => {
    router.back();
  };

  const handleViewCase = (
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

  const handleViewAllCases = () => {
    router.push(
      "/doctor/all-cases" as Href
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
          Loading weekly summary...
        </Text>
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
                void loadWeeklySummary(
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
              Weekly Progress Summary
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
                void loadWeeklySummary(
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
                  void loadWeeklySummary(
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
              styles.overviewCard
            }
          >
            <Text
              style={
                styles.overviewTitle
              }
            >
              Weekly Overview
            </Text>

            <Text
              style={
                styles.overviewDescription
              }
            >
              Emotional and behavioral activity across cases assigned to you during the last seven days.
            </Text>

            <View
              style={
                styles.overviewDivider
              }
            />

            <View
              style={
                styles.overviewStats
              }
            >
              <OverviewStat
                value={String(
                  Number(
                    summary.newCases ||
                    0
                  )
                )}
                label="NEW CASES"
              />

              <View
                style={
                  styles.statDivider
                }
              />

              <OverviewStat
                value={String(
                  Number(
                    summary.reviewedCases ||
                    0
                  )
                )}
                label="REVIEWED"
              />

              <View
                style={
                  styles.statDivider
                }
              />

              <OverviewStat
                value={String(
                  Number(
                    summary.activeCases ||
                    0
                  )
                )}
                label="ACTIVE"
              />
            </View>
          </View>

          <View
            style={
              styles.sectionCard
            }
          >
            <View
              style={
                styles.sectionTitleRow
              }
            >
              <Ionicons
                name="stats-chart-outline"
                size={19}
                color="#6EB2EE"
              />

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Weekly Emotion Distribution
              </Text>
            </View>

            <View
              style={
                styles.cardDivider
              }
            />

            {emotions.length >
            0 ? (
              <View
                style={
                  styles.emotionsContainer
                }
              >
                {emotions.map(
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
              <EmptySection
                icon="stats-chart-outline"
                text="No emotion statistics are available for the current week."
              />
            )}
          </View>

          {attentionCases.length > 0 ? (
            <>
              <Text
                style={
                  styles.normalSectionTitle
                }
              >
                Children Requiring Attention
              </Text>

              <View
                style={
                  styles.attentionCasesContainer
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
                      item={item}
                      onViewDetails={() =>
                        handleViewCase(
                          item
                        )
                      }
                    />
                  )
                )}
              </View>
            </>
          ) : null}

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
                size={19}
                color="#3DB35A"
              />

              <Text
                style={
                  styles.aiTitle
                }
              >
                WEEKLY SUMMARY
              </Text>
            </View>

            <Text
              style={
                styles.aiText
              }
            >
              “{aiWeeklySummary}”
            </Text>
          </View>

          <Text
            style={
              styles.normalSectionTitle
            }
          >
            Weekly Activity
          </Text>

          <View
            style={
              styles.activityContainer
            }
          >
            <ActivityCard
              icon="add-circle-outline"
              title="New cases received"
              value={Number(
                summary.newCases ||
                0
              )}
              iconColor="#4E91C5"
              iconBackground="#E7F4FF"
            />

            <ActivityCard
              icon="checkmark-circle-outline"
              title="Cases reviewed"
              value={Number(
                summary.reviewedCases ||
                0
              )}
              iconColor="#40A958"
              iconBackground="#E2F7E7"
            />

            <ActivityCard
              icon="time-outline"
              title="Cases still active"
              value={Number(
                summary.activeCases ||
                0
              )}
              iconColor="#D58E38"
              iconBackground="#FFF3E4"
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={
              handleViewAllCases
            }
            style={
              styles.allCasesButtonWrapper
            }
          >
            <LinearGradient
              colors={[
                "#A5D2F7",
                "#F6ACB0",
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
                styles.allCasesButton
              }
            >
              <Text
                style={
                  styles.allCasesButtonText
                }
              >
                View All Cases
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function OverviewStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View
      style={
        styles.overviewStat
      }
    >
      <Text
        style={
          styles.overviewStatValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.overviewStatLabel
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
  count,
  emoji,
  color,
}: EmotionItem) {
  return (
    <View
      style={
        styles.emotionItem
      }
    >
      <View
        style={
          styles.emotionHeader
        }
      >
        <View
          style={
            styles.emotionNameRow
          }
        >
          <Text
            style={
              styles.emotionEmoji
            }
          >
            {emoji}
          </Text>

          <Text
            style={
              styles.emotionName
            }
          >
            {name}
          </Text>
        </View>

        <Text
          style={
            styles.emotionPercentage
          }
        >
          {value.toFixed(
            1
          )}
          % · {count}
        </Text>
      </View>

      <View
        style={
          styles.progressTrack
        }
      >
        <View
          style={[
            styles.progressFill,

            {
              width:
                `${Math.max(
                  2,
                  value
                )}%`,

              backgroundColor:
                color,
            },
          ]}
        />
      </View>
    </View>
  );
}

function AttentionCaseCard({
  item,
  onViewDetails,
}: {
  item: AttentionCase;
  onViewDetails: () => void;
}) {
  const priority =
    String(
      item.priority ||
      "High"
    );

  const highPriority =
    priority
      .toLowerCase()
      .includes(
        "high"
      );

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
          styles.caseTopRow
        }
      >
        <View
          style={
            styles.childInfo
          }
        >
          <View
            style={
              styles.childAvatarWrapper
            }
          >
            <Image
              source={
                item.avatar
              }
              style={
                styles.childAvatar
              }
              contentFit="cover"
            />
          </View>

          <View
            style={
              styles.childText
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
          style={[
            styles.priorityBadge,

            highPriority
              ? styles.highPriorityBadge
              : styles.mediumPriorityBadge,
          ]}
        >
          <Text
            style={[
              styles.priorityText,

              highPriority
                ? styles.highPriorityText
                : styles.mediumPriorityText,
            ]}
          >
            {priority} Priority
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.indicatorText
        }
        numberOfLines={3}
      >
        {item.indicator}
      </Text>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={
          onViewDetails
        }
        style={
          styles.detailsButtonWrapper
        }
      >
        <LinearGradient
          colors={[
            "#A3D1F6",
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
            View Details
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function ActivityCard({
  icon,
  title,
  value,
  iconColor,
  iconBackground,
}: {
  icon: IoniconName;
  title: string;
  value: number;
  iconColor: string;
  iconBackground: string;
}) {
  return (
    <View
      style={
        styles.activityCard
      }
    >
      <View
        style={[
          styles.activityIcon,

          {
            backgroundColor:
              iconBackground,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={21}
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
            styles.activityValue
          }
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function EmptySection({
  icon,
  text,
}: {
  icon: IoniconName;
  text: string;
}) {
  return (
    <View
      style={
        styles.emptySection
      }
    >
      <Ionicons
        name={icon}
        size={28}
        color="#78ACD5"
      />

      <Text
        style={
          styles.emptySectionText
        }
      >
        {text}
      </Text>
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
    },

    loadingText: {
      marginTop: 12,
      fontSize: 11,
      color: "#7A8087",
    },

    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 6,
      paddingBottom: 28,
    },

    header: {
      height: 54,
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

    refreshButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "flex-end",
    },

    headerTitle: {
      fontSize: 17,
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

    overviewCard: {
      backgroundColor: "#F8F8F9",
      borderLeftWidth: 2,
      borderLeftColor: "#F2B8BD",
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingTop: 14,
      paddingBottom: 12,
      marginBottom: 16,
    },

    overviewTitle: {
      fontSize: 17,
      fontWeight: "500",
      color: "#303438",
    },

    overviewDescription: {
      marginTop: 11,
      fontSize: 10,
      lineHeight: 15,
      color: "#9B9FA5",
    },

    overviewDivider: {
      height: 1,
      backgroundColor: "#C9CDD1",
      marginTop: 10,
      marginBottom: 12,
    },

    overviewStats: {
      flexDirection: "row",
      alignItems: "center",
    },

    overviewStat: {
      flex: 1,
      alignItems: "center",
    },

    overviewStatValue: {
      fontSize: 25,
      fontWeight: "500",
      color: "#78ACEE",
    },

    overviewStatLabel: {
      marginTop: 4,
      fontSize: 8,
      color: "#92979E",
    },

    statDivider: {
      width: 1,
      height: 47,
      backgroundColor: "#D6D9DC",
    },

    sectionCard: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#F1C1C5",
      borderRadius: 17,
      paddingHorizontal: 13,
      paddingTop: 14,
      paddingBottom: 13,
      marginBottom: 16,
    },

    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: "#252A2E",
    },

    cardDivider: {
      height: 1,
      backgroundColor: "#EBEDEF",
      marginTop: 12,
      marginBottom: 12,
    },

    emotionsContainer: {
      gap: 14,
    },

    emotionItem: {
      width: "100%",
    },

    emotionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 7,
    },

    emotionNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    emotionEmoji: {
      fontSize: 14,
    },

    emotionName: {
      fontSize: 10,
      color: "#44494E",
    },

    emotionPercentage: {
      fontSize: 9.5,
      color: "#292D31",
    },

    progressTrack: {
      width: "100%",
      height: 7,
      backgroundColor: "#ECEDEF",
      borderRadius: 999,
      overflow: "hidden",
    },

    progressFill: {
      height: 7,
      borderRadius: 999,
    },

    normalSectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: "#292D31",
      marginBottom: 11,
    },

    attentionCasesContainer: {
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
      width: 65,
      height: 65,
      borderRadius: 32.5,
      right: -17,
      top: -17,
      backgroundColor: "#FFF0F1",
    },

    caseTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },

    childInfo: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },

    childAvatarWrapper: {
      width: 43,
      height: 43,
      borderRadius: 21.5,
      backgroundColor: "#FFF1EC",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "#F0DFD8",
      marginRight: 9,
    },

    childAvatar: {
      width: "100%",
      height: "100%",
    },

    childText: {
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

    priorityBadge: {
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 5,
      zIndex: 2,
    },

    highPriorityBadge: {
      backgroundColor: "#FFE0E2",
    },

    mediumPriorityBadge: {
      backgroundColor: "#DDF8E2",
    },

    priorityText: {
      fontSize: 8,
      fontWeight: "500",
    },

    highPriorityText: {
      color: "#F05D65",
    },

    mediumPriorityText: {
      color: "#45B65D",
    },

    indicatorText: {
      marginTop: 8,
      fontSize: 10,
      lineHeight: 15,
      color: "#5D7080",
    },

    detailsButtonWrapper: {
      marginTop: 9,
    },

    detailsButton: {
      height: 34,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },

    detailsButtonText: {
      fontSize: 10,
      fontWeight: "600",
      color: "#25282C",
    },

    aiSummaryCard: {
      backgroundColor: "#DEF6EA",
      borderRadius: 15,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 16,
      marginBottom: 18,
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

    aiText: {
      marginTop: 13,
      fontSize: 10.5,
      lineHeight: 17,
      color: "#55B96A",
    },

    activityContainer: {
      gap: 10,
      marginBottom: 20,
    },

    activityCard: {
      minHeight: 61,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F7F7F8",
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },

    activityIcon: {
      width: 39,
      height: 39,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 11,
    },

    activityTextContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    activityTitle: {
      fontSize: 10,
      color: "#3D4247",
    },

    activityValue: {
      fontSize: 18,
      fontWeight: "700",
      color: "#272B2F",
    },

    emptySection: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 24,
      marginBottom: 17,
    },

    emptySectionText: {
      marginTop: 9,
      maxWidth: 260,
      fontSize: 9.5,
      lineHeight: 15,
      color: "#8D9399",
      textAlign: "center",
    },

    allCasesButtonWrapper: {
      width: "100%",
    },

    allCasesButton: {
      height: 51,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },

    allCasesButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#22262A",
    },
  });
