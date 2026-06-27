import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  router,
  useLocalSearchParams,
  type Href,
} from "expo-router";

const girlPhoto = require("../../assets/images/images/girl.png");
const boyPhoto = require("../../assets/images/images/boy.png");

type IoniconName =
  keyof typeof Ionicons.glyphMap;

type EmotionalTrendItem = {
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
  emotion: string;
  date: string;
  status: "Reviewed" | "Closed";
  icon: IoniconName;
  iconColor: string;
  iconBackground: string;
};

type RecommendationItem = {
  date: string;
  text: string;
};

type ChildOverviewData = {
  name: string;
  childId: string;
  age: number;
  avatar: number;
  firstEntry: string;
  status: string;
  longTermSummary: string;
  currentStatusDescription: string;
  weeklyTrend: EmotionalTrendItem[];
  emotions: EmotionItem[];
  analysisTimeline: AnalysisItem[];
  recommendations: RecommendationItem[];
  patterns: string[];
  monitoringTitle: string;
  monitoringLevel: string;
  monitoringDescription: string;
};

const childrenData: Record<
  string,
  ChildOverviewData
> = {
  Lily: {
    name: "Lily",
    childId: "#1045",
    age: 5,
    avatar: girlPhoto,
    firstEntry: "Jan 15, 2026",
    status: "Improving",

    longTermSummary:
      "Over the last 30 days, Lily showed recurring anxiety indicators related to school attendance and social interaction. Recent entries suggest gradual improvement and increased emotional stability.",

    currentStatusDescription:
      "Showing positive emotional progress compared to previous weeks.",

    weeklyTrend: [
      {
        week: "W1",
        emoji: "😟",
        color: "#FFC4C6",
        emotion: "Anxiety",
      },
      {
        week: "W2",
        emoji: "😟",
        color: "#F6B9BC",
        emotion: "Stress",
      },
      {
        week: "W3",
        emoji: "😕",
        color: "#CDEDDC",
        emotion: "Improving",
      },
      {
        week: "W4",
        emoji: "🥲",
        color: "#A9E3C8",
        emotion: "Improving",
      },
    ],

    emotions: [
      {
        name: "Anxiety",
        value: 42,
        emoji: "😟",
        color: "#F7B5B9",
      },
      {
        name: "Stress",
        value: 31,
        emoji: "😟",
        color: "#F6B6BA",
      },
      {
        name: "Calm",
        value: 18,
        emoji: "😌",
        color: "#A9DFC9",
      },
      {
        name: "Happy",
        value: 9,
        emoji: "🥲",
        color: "#91D8BA",
      },
    ],

    analysisTimeline: [
      {
        emotion: "Anxiety",
        date: "May 12, 2026",
        status: "Reviewed",
        icon: "headset-outline",
        iconColor: "#EF555D",
        iconBackground: "#FFE7E8",
      },
      {
        emotion: "Calm",
        date: "May 8, 2026",
        status: "Reviewed",
        icon: "leaf-outline",
        iconColor: "#178D7B",
        iconBackground: "#DCF3EC",
      },
      {
        emotion: "Stress",
        date: "May 3, 2026",
        status: "Closed",
        icon: "warning-outline",
        iconColor: "#48837E",
        iconBackground: "#E7F0EF",
      },
    ],

    recommendations: [
      {
        date: "May 10, 2026",
        text: "Continue monitoring school-related stress and emotional reactions.",
      },
      {
        date: "April 28, 2026",
        text: "Encourage social interaction activities and structured routines.",
      },
    ],

    patterns: [
      "School Anxiety",
      "Sleep Disturbance",
      "Social Withdrawal",
    ],

    monitoringTitle:
      "Needs Monitoring",

    monitoringLevel:
      "Moderate Anxiety Risk",

    monitoringDescription:
      "Requires Continued Observation",
  },

  Sammy: {
    name: "Sammy",
    childId: "#11045",
    age: 5,
    avatar: boyPhoto,
    firstEntry: "Feb 2, 2026",
    status: "Improving",

    longTermSummary:
      "Over the last 30 days, Sammy showed emotional sensitivity related to routine changes and social situations. Recent entries indicate gradual emotional improvement.",

    currentStatusDescription:
      "Emotional responses are becoming calmer and more stable.",

    weeklyTrend: [
      {
        week: "W1",
        emoji: "😟",
        color: "#FFC4C6",
        emotion: "Stress",
      },
      {
        week: "W2",
        emoji: "😕",
        color: "#F7C7C9",
        emotion: "Stress",
      },
      {
        week: "W3",
        emoji: "😌",
        color: "#CDEDDC",
        emotion: "Calm",
      },
      {
        week: "W4",
        emoji: "🙂",
        color: "#A9E3C8",
        emotion: "Improving",
      },
    ],

    emotions: [
      {
        name: "Stress",
        value: 38,
        emoji: "😟",
        color: "#F7B5B9",
      },
      {
        name: "Anxiety",
        value: 27,
        emoji: "😕",
        color: "#F6B6BA",
      },
      {
        name: "Calm",
        value: 22,
        emoji: "😌",
        color: "#A9DFC9",
      },
      {
        name: "Happy",
        value: 13,
        emoji: "🙂",
        color: "#91D8BA",
      },
    ],

    analysisTimeline: [
      {
        emotion: "Stress",
        date: "May 15, 2026",
        status: "Reviewed",
        icon: "warning-outline",
        iconColor: "#EF555D",
        iconBackground: "#FFE7E8",
      },
      {
        emotion: "Calm",
        date: "May 10, 2026",
        status: "Reviewed",
        icon: "leaf-outline",
        iconColor: "#178D7B",
        iconBackground: "#DCF3EC",
      },
      {
        emotion: "Anxiety",
        date: "May 4, 2026",
        status: "Closed",
        icon: "headset-outline",
        iconColor: "#48837E",
        iconBackground: "#E7F0EF",
      },
    ],

    recommendations: [
      {
        date: "May 14, 2026",
        text: "Maintain a consistent daily routine and observe emotional reactions.",
      },
      {
        date: "May 3, 2026",
        text: "Use calming activities before stressful social situations.",
      },
    ],

    patterns: [
      "Routine Changes",
      "Emotional Stress",
      "Social Sensitivity",
    ],

    monitoringTitle:
      "Needs Monitoring",

    monitoringLevel:
      "Moderate Emotional Risk",

    monitoringDescription:
      "Requires Continued Observation",
  },
};

export default function ChildOverviewScreen() {
  const params = useLocalSearchParams<{
    child?: string | string[];
    childId?: string | string[];
  }>();

  const getParamValue = (
    value?: string | string[]
  ): string | undefined => {
    return Array.isArray(value)
      ? value[0]
      : value;
  };

  const childParam =
    getParamValue(params.child);

  const childIdParam =
    getParamValue(params.childId);

  const child =
    childParam &&
    childrenData[childParam]
      ? childrenData[childParam]
      : childrenData.Lily;

  const displayChildId =
    childIdParam || child.childId;

  const handleBack = () => {
    router.back();
  };

  const createAnalysisHistoryRoute = (
    item?: AnalysisItem
  ): Href => {
    const queryParameters = [
      `child=${encodeURIComponent(
        child.name
      )}`,

      `childId=${encodeURIComponent(
        displayChildId
      )}`,
    ];

    if (item) {
      queryParameters.push(
        `focusEmotion=${encodeURIComponent(
          item.emotion
        )}`
      );

      queryParameters.push(
        `focusDate=${encodeURIComponent(
          item.date
        )}`
      );
    }

    return `/doctor/child-analysis-history?${queryParameters.join(
      "&"
    )}` as Href;
  };

  const handleViewAnalysis = (
    item: AnalysisItem
  ) => {
    router.push(
      createAnalysisHistoryRoute(item)
    );
  };

  const handleViewAll = () => {
    router.push(
      createAnalysisHistoryRoute()
    );
  };

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
          "#FFFFFF",
          "#FFF9F9",
          "#F9FCFF",
        ]}
        locations={[0, 0.48, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#1F2937"
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              Child Overview
            </Text>

            <View
              style={styles.headerPlaceholder}
            />
          </View>

          {/* Child Main Card */}
          <View style={styles.childCard}>
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

            <View style={styles.avatarWrapper}>
              <Image
                source={child.avatar}
                style={styles.avatarImage}
                contentFit="cover"
              />
            </View>

            <View style={styles.statusBadge}>
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
                {child.status}
              </Text>
            </View>

            <Text style={styles.childName}>
              {child.name} ({child.age} Years)
            </Text>

            <Text style={styles.childId}>
              {displayChildId}
            </Text>

            <Text style={styles.firstEntry}>
              First entry · {child.firstEntry}
            </Text>
          </View>

          {/* Long-Term Summary */}
          <View style={styles.longTermCard}>
            <Text style={styles.cardTitle}>
              Long-Term Summary
            </Text>

            <Text
              style={styles.longTermText}
            >
              {child.longTermSummary}
            </Text>
          </View>

          {/* Current Status */}
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
                  {child.status}
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.currentStatusText
              }
            >
              {
                child.currentStatusDescription
              }
            </Text>
          </View>

          {/* Emotional Trend */}
          <View style={styles.sectionCard}>
            <View
              style={
                styles.sectionCardHeader
              }
            >
              <Text style={styles.cardTitle}>
                Emotional Trend
              </Text>

              <Text
                style={
                  styles.sectionSideText
                }
              >
                4 Week Timeline
              </Text>
            </View>

            <View style={styles.separator} />

            <View
              style={styles.weeklyTrendRow}
            >
              {child.weeklyTrend.map(
                (item) => (
                  <View
                    key={item.week}
                    style={styles.weekItem}
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
                        {item.emoji}
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

            <View style={styles.separator} />

            <View
              style={
                styles.legendContainer
              }
            >
              <LegendItem
                color="#F4AEB2"
                label="ANXIETY"
              />

              <LegendItem
                color="#F3B8BB"
                label="STRESS"
              />

              <LegendItem
                color="#A9DFC9"
                label="IMPROVING"
              />
            </View>
          </View>

          {/* Most Frequent Emotions */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>
              Most Frequent Emotions
            </Text>

            <View style={styles.separator} />

            <View
              style={
                styles.emotionsContainer
              }
            >
              {child.emotions.map(
                (emotion) => (
                  <EmotionProgress
                    key={emotion.name}
                    {...emotion}
                  />
                )
              )}
            </View>
          </View>

          {/* Analysis Timeline */}
          <View style={styles.timelineHeader}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleViewAll}
              style={
                styles.timelineTitleButton
              }
            >
              <Text style={styles.cardTitle}>
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
              onPress={handleViewAll}
              style={styles.viewAllButton}
            >
              <Text
                style={styles.viewAllText}
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
            {child.analysisTimeline.map(
              (item) => (
                <TouchableOpacity
                  key={`${item.emotion}-${item.date}`}
                  style={
                    styles.analysisItem
                  }
                  activeOpacity={0.8}
                  onPress={() =>
                    handleViewAnalysis(item)
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
                      name={item.icon}
                      size={20}
                      color={item.iconColor}
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
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.analysisStatus,
                      item.status ===
                        "Closed" &&
                        styles.closedStatus,
                    ]}
                  >
                    <Text
                      style={[
                        styles.analysisStatusText,
                        item.status ===
                          "Closed" &&
                          styles.closedStatusText,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#777F87"
                  />
                </TouchableOpacity>
              )
            )}
          </View>

          {/* Doctor Recommendations */}
          <LinearGradient
            colors={[
              "#FFF1F1",
              "#FFD9DA",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
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

              <Text style={styles.cardTitle}>
                Doctor Recommendations
              </Text>
            </View>

            <View
              style={
                styles.recommendationTimeline
              }
            >
              {child.recommendations.map(
                (
                  recommendation,
                  index
                ) => (
                  <View
                    key={
                      recommendation.date
                    }
                    style={[
                      styles.recommendationItem,
                      index !==
                        child.recommendations
                          .length -
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
          </LinearGradient>

          {/* Recurring Patterns */}
          <Text
            style={styles.patternsTitle}
          >
            Recurring Patterns
          </Text>

          <View
            style={
              styles.patternsContainer
            }
          >
            {child.patterns.map(
              (pattern) => (
                <View
                  key={pattern}
                  style={styles.patternChip}
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

          {/* Monitoring */}
          <View style={styles.monitoringCard}>
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
                {child.monitoringTitle}
              </Text>
            </View>

            <Text
              style={styles.monitoringLevel}
            >
              {child.monitoringLevel}
            </Text>

            <Text
              style={
                styles.monitoringDescription
              }
            >
              {
                child.monitoringDescription
              }
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

type LegendItemProps = {
  color: string;
  label: string;
};

function LegendItem({
  color,
  label,
}: LegendItemProps) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendDot,
          {
            backgroundColor: color,
          },
        ]}
      />

      <Text style={styles.legendText}>
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
          style={styles.emotionName}
        >
          {name}
        </Text>

        <Text
          style={
            styles.emotionPercentage
          }
        >
          {value}%
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressValueContainer,
            {
              width: `${value}%`,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: color,
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  background: {
    flex: 1,
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
    shadowColor: "#B9C0C5",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 1,
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
    marginTop: 5,
    fontSize: 8.5,
    color: "#90959B",
  },

  analysisStatus: {
    backgroundColor: "#D5F9D9",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginRight: 7,
  },

  analysisStatusText: {
    fontSize: 8,
    color: "#48BC59",
  },

  closedStatus: {
    backgroundColor: "#E9ECEF",
  },

  closedStatusText: {
    color: "#9299A1",
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
});