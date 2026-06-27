import React, {
  useMemo,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
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
  router,
  useLocalSearchParams,
} from "expo-router";

type IoniconName =
  keyof typeof Ionicons.glyphMap;

type TimeFilter =
  | "7 Days"
  | "30 Days"
  | "All Time";

type EntryStatus =
  | "Pending Review"
  | "Reviewed"
  | "Closed";

type TrendPoint = {
  id: string;
  label: string;
  value: number;
  emotion: string;
};

type ProgressEntry = {
  id: string;
  daysAgo: number;
  date: string;
  type: string;
  emotion: string;
  description: string;
  status: EntryStatus;
  doctorResponseExists: boolean;
  confidence: number;
  icon: IoniconName;
  iconBackground: string;
  iconColor: string;
};

const TREND_DATA: TrendPoint[] = [
  {
    id: "trend-1",
    label: "Jun 1",
    value: 58,
    emotion: "Anxiety",
  },
  {
    id: "trend-2",
    label: "Jun 5",
    value: 66,
    emotion: "Stress",
  },
  {
    id: "trend-3",
    label: "Jun 10",
    value: 48,
    emotion: "Calm",
  },
  {
    id: "trend-4",
    label: "Jun 15",
    value: 42,
    emotion: "Calm",
  },
  {
    id: "trend-5",
    label: "Jun 20",
    value: 34,
    emotion: "Stable",
  },
  {
    id: "trend-6",
    label: "Jun 22",
    value: 28,
    emotion: "Positive",
  },
];

const PROGRESS_ENTRIES: ProgressEntry[] = [
  {
    id: "activity-1",
    daysAgo: 1,
    date: "Jun 22, 2026",
    type: "Text Entry",
    emotion: "Calm",
    description:
      "The child appeared calmer during school preparation and responded more positively to the daily routine.",
    status: "Reviewed",
    doctorResponseExists: true,
    confidence: 88,
    icon: "happy-outline",
    iconBackground: "#E7F7EC",
    iconColor: "#4D9A66",
  },
  {
    id: "activity-2",
    daysAgo: 4,
    date: "Jun 19, 2026",
    type: "Text Entry",
    emotion: "Anxiety",
    description:
      "Mild anxiety indicators appeared before a school activity, with repeated questions about the new environment.",
    status: "Reviewed",
    doctorResponseExists: true,
    confidence: 81,
    icon: "alert-circle-outline",
    iconBackground: "#FFF0F1",
    iconColor: "#B65A61",
  },
  {
    id: "activity-3",
    daysAgo: 8,
    date: "Jun 15, 2026",
    type: "Text Entry",
    emotion: "Stable",
    description:
      "Emotional responses were generally stable, with improved communication and fewer sudden mood changes.",
    status: "Closed",
    doctorResponseExists: true,
    confidence: 86,
    icon: "checkmark-circle-outline",
    iconBackground: "#EAF5FD",
    iconColor: "#3976A4",
  },
  {
    id: "activity-4",
    daysAgo: 14,
    date: "Jun 9, 2026",
    type: "Text Entry",
    emotion: "Stress",
    description:
      "The child showed signs of stress after changes in sleeping time and school responsibilities.",
    status: "Reviewed",
    doctorResponseExists: true,
    confidence: 79,
    icon: "cloud-outline",
    iconBackground: "#F2ECFB",
    iconColor: "#8B74B8",
  },
  {
    id: "activity-5",
    daysAgo: 22,
    date: "Jun 1, 2026",
    type: "Text Entry",
    emotion: "Anxiety",
    description:
      "The entry indicated repeated worry and difficulty adjusting to changes in the daily routine.",
    status: "Pending Review",
    doctorResponseExists: false,
    confidence: 76,
    icon: "time-outline",
    iconBackground: "#FFF5E8",
    iconColor: "#B7833D",
  },
];

const SUMMARY_BY_FILTER: Record<
  TimeFilter,
  string
> = {
  "7 Days":
    "During the last 7 days, the child showed improved emotional stability, calmer responses and better adjustment to the daily routine.",

  "30 Days":
    "Over the last 30 days, anxiety indicators appeared occasionally, especially around school activities. Recent entries show noticeable improvement in emotional stability.",

  "All Time":
    "Across all recorded entries, the child has shown gradual improvement. Anxiety remains the most repeated indicator, but its intensity has decreased over time.",
};

function getSingleParam(
  value?: string | string[]
): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function getStatusStyle(
  status: EntryStatus
) {
  switch (status) {
    case "Reviewed":
      return {
        backgroundColor: "#E7F7EC",
        color: "#4D9A66",
      };

    case "Closed":
      return {
        backgroundColor: "#EAF5FD",
        color: "#3976A4",
      };

    case "Pending Review":
    default:
      return {
        backgroundColor: "#FFF5E8",
        color: "#A8732E",
      };
  }
}

export default function ChildProgressScreen() {
  const params = useLocalSearchParams<{
    childId?: string | string[];
    childName?: string | string[];
    childAge?: string | string[];
  }>();

  const childId =
    getSingleParam(params.childId) ||
    "nada-1";

  const childName =
    getSingleParam(params.childName) ||
    "Nada";

  const childAge =
    getSingleParam(params.childAge) ||
    "12";

  const [
    selectedFilter,
    setSelectedFilter,
  ] =
    useState<TimeFilter>("30 Days");

  const filteredEntries =
    useMemo(() => {
      if (
        selectedFilter === "7 Days"
      ) {
        return PROGRESS_ENTRIES.filter(
          (entry) =>
            entry.daysAgo <= 7
        );
      }

      if (
        selectedFilter === "30 Days"
      ) {
        return PROGRESS_ENTRIES.filter(
          (entry) =>
            entry.daysAgo <= 30
        );
      }

      return PROGRESS_ENTRIES;
    }, [selectedFilter]);

  const reviewedCount =
    useMemo(() => {
      return filteredEntries.filter(
        (entry) =>
          entry.status ===
            "Reviewed" ||
          entry.status === "Closed"
      ).length;
    }, [filteredEntries]);

  const doctorResponsesCount =
    useMemo(() => {
      return filteredEntries.filter(
        (entry) =>
          entry.doctorResponseExists
      ).length;
    }, [filteredEntries]);

  const averageConfidence =
    useMemo(() => {
      if (
        filteredEntries.length === 0
      ) {
        return 0;
      }

      const total =
        filteredEntries.reduce(
          (sum, entry) =>
            sum + entry.confidence,
          0
        );

      return Math.round(
        total /
          filteredEntries.length
      );
    }, [filteredEntries]);

  const openEntryDetails = (
    entry: ProgressEntry
  ) => {
    router.push(
      {
        pathname:
          "/parent/activity-details",

        params: {
          activityId: entry.id,
          childId,
          childName,
          childAge,
          date: entry.date,
          type: entry.type,
          emotion: entry.emotion,
          description:
            entry.description,
          status: entry.status,
          confidence: String(
            entry.confidence
          ),
          focusSection:
            entry.doctorResponseExists
              ? "doctor-response"
              : "analysis",
        },
      } as any
    );
  };

  const openAddEntry = () => {
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
          "#FFFFFF",
          "#FFF9F9",
          "#F8FCFF",
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
        style={styles.background}
      >
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() =>
              router.back()
            }
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color="#24282C"
            />
          </TouchableOpacity>

          <View
            style={
              styles.headerContent
            }
          >
            <Text
              style={styles.pageTitle}
            >
              Child Progress
            </Text>

            <Text
              style={
                styles.pageSubtitle
              }
            >
              Long-term emotional
              overview
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openAddEntry}
            style={
              styles.headerAddButton
            }
          >
            <Ionicons
              name="add"
              size={18}
              color="#3976A4"
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={
              styles.childInfoCard
            }
          >
            <View
              style={
                styles.childAvatar
              }
            >
              <Ionicons
                name="happy-outline"
                size={28}
                color="#3976A4"
              />
            </View>

            <View
              style={
                styles.childInfoContent
              }
            >
              <Text
                style={
                  styles.childName
                }
              >
                {childName}
              </Text>

              <Text
                style={
                  styles.childDetails
                }
              >
                {childAge} years old
              </Text>
            </View>

            <View
              style={
                styles.improvingBadge
              }
            >
              <Ionicons
                name="trending-up-outline"
                size={14}
                color="#4D9A66"
              />

              <Text
                style={
                  styles.improvingText
                }
              >
                Improving
              </Text>
            </View>
          </View>

          <View
            style={
              styles.filtersContainer
            }
          >
            {(
              [
                "7 Days",
                "30 Days",
                "All Time",
              ] as TimeFilter[]
            ).map((filter) => (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.8}
                onPress={() =>
                  setSelectedFilter(
                    filter
                  )
                }
                style={[
                  styles.filterButton,

                  selectedFilter ===
                    filter &&
                    styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,

                    selectedFilter ===
                      filter &&
                      styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View
            style={
              styles.summaryCard
            }
          >
            <View
              style={
                styles.cardTitleRow
              }
            >
              <View
                style={
                  styles.summaryIcon
                }
              >
                <Ionicons
                  name="sparkles-outline"
                  size={19}
                  color="#3976A4"
                />
              </View>

              <View
                style={
                  styles.cardTitleContent
                }
              >
                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  Long-term Summary
                </Text>

                <Text
                  style={
                    styles.cardSubtitle
                  }
                >
                  AI-generated overview
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.summaryText
              }
            >
              {
                SUMMARY_BY_FILTER[
                  selectedFilter
                ]
              }
            </Text>

            <View
              style={
                styles.summaryFooter
              }
            >
              <Ionicons
                name="information-circle-outline"
                size={14}
                color="#92979E"
              />

              <Text
                style={
                  styles.summaryFooterText
                }
              >
                Emotional indicators are
                not a medical diagnosis.
              </Text>
            </View>
          </View>

          <View
            style={
              styles.statisticsRow
            }
          >
            <View
              style={[
                styles.statisticCard,
                styles.statisticCardMargin,
              ]}
            >
              <Ionicons
                name="documents-outline"
                size={20}
                color="#3976A4"
              />

              <Text
                style={
                  styles.statisticValue
                }
              >
                {
                  filteredEntries.length
                }
              </Text>

              <Text
                style={
                  styles.statisticLabel
                }
              >
                Entries
              </Text>
            </View>

            <View
              style={[
                styles.statisticCard,
                styles.statisticCardMargin,
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#4D9A66"
              />

              <Text
                style={
                  styles.statisticValue
                }
              >
                {reviewedCount}
              </Text>

              <Text
                style={
                  styles.statisticLabel
                }
              >
                Reviewed
              </Text>
            </View>

            <View
              style={
                styles.statisticCard
              }
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color="#8B74B8"
              />

              <Text
                style={
                  styles.statisticValue
                }
              >
                {
                  doctorResponsesCount
                }
              </Text>

              <Text
                style={
                  styles.statisticLabel
                }
              >
                Insights
              </Text>
            </View>
          </View>

          <View
            style={styles.trendCard}
          >
            <View
              style={
                styles.trendHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  Emotional Trend
                </Text>

                <Text
                  style={
                    styles.cardSubtitle
                  }
                >
                  Lower values indicate
                  calmer responses
                </Text>
              </View>

              <View
                style={
                  styles.confidenceContainer
                }
              >
                <Text
                  style={
                    styles.confidenceValue
                  }
                >
                  {averageConfidence}%
                </Text>

                <Text
                  style={
                    styles.confidenceLabel
                  }
                >
                  Avg. confidence
                </Text>
              </View>
            </View>

            <View
              style={
                styles.chartContainer
              }
            >
              {TREND_DATA.map(
                (point, index) => (
                  <View
                    key={point.id}
                    style={
                      styles.chartItem
                    }
                  >
                    <View
                      style={
                        styles.chartBarArea
                      }
                    >
                      <LinearGradient
                        colors={
                          index <
                          TREND_DATA.length /
                            2
                            ? [
                                "#FBC0BF",
                                "#F5D5D4",
                              ]
                            : [
                                "#B9D8F6",
                                "#DDF5E5",
                              ]
                        }
                        start={{
                          x: 0,
                          y: 1,
                        }}
                        end={{
                          x: 0,
                          y: 0,
                        }}
                        style={[
                          styles.chartBar,
                          {
                            height:
                              point.value,
                          },
                        ]}
                      />
                    </View>

                    <Text
                      style={
                        styles.chartLabel
                      }
                    >
                      {point.label}
                    </Text>
                  </View>
                )
              )}
            </View>

            <View
              style={
                styles.trendResultRow
              }
            >
              <View
                style={
                  styles.trendResultIcon
                }
              >
                <Ionicons
                  name="trending-down-outline"
                  size={18}
                  color="#4D9A66"
                />
              </View>

              <Text
                style={
                  styles.trendResultText
                }
              >
                Anxiety indicators have
                decreased in the latest
                entries.
              </Text>
            </View>
          </View>

          <View
            style={
              styles.patternsCard
            }
          >
            <Text
              style={styles.cardTitle}
            >
              Recurring Patterns
            </Text>

            <Text
              style={
                styles.cardSubtitle
              }
            >
              Common indicators found in
              recent entries
            </Text>

            <View
              style={
                styles.patternsContainer
              }
            >
              <View
                style={[
                  styles.patternBadge,
                  styles.patternPink,
                ]}
              >
                <Ionicons
                  name="school-outline"
                  size={14}
                  color="#A8555C"
                />

                <Text
                  style={
                    styles.patternText
                  }
                >
                  School anxiety
                </Text>
              </View>

              <View
                style={[
                  styles.patternBadge,
                  styles.patternBlue,
                ]}
              >
                <Ionicons
                  name="moon-outline"
                  size={14}
                  color="#3976A4"
                />

                <Text
                  style={
                    styles.patternText
                  }
                >
                  Sleep routine
                </Text>
              </View>

              <View
                style={[
                  styles.patternBadge,
                  styles.patternGreen,
                ]}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={14}
                  color="#4D9A66"
                />

                <Text
                  style={
                    styles.patternText
                  }
                >
                  Better communication
                </Text>
              </View>
            </View>
          </View>

          <View
            style={
              styles.doctorInsightCard
            }
          >
            <View
              style={
                styles.doctorInsightHeader
              }
            >
              <View
                style={
                  styles.doctorIcon
                }
              >
                <Ionicons
                  name="medical-outline"
                  size={20}
                  color="#8B74B8"
                />
              </View>

              <View
                style={
                  styles.doctorHeaderContent
                }
              >
                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  Latest Doctor Insight
                </Text>

                <Text
                  style={
                    styles.cardSubtitle
                  }
                >
                  Jun 22, 2026
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.doctorName
              }
            >
              Dr. Ahmed Hassan
            </Text>

            <Text
              style={
                styles.doctorSpecialization
              }
            >
              Child Psychology Specialist
            </Text>

            <Text
              style={
                styles.doctorInsightText
              }
            >
              The recent improvement is
              encouraging. Continue
              maintaining a consistent
              sleep routine and allow the
              child to discuss school
              concerns without pressure.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                const latestEntry =
                  filteredEntries.find(
                    (entry) =>
                      entry.doctorResponseExists
                  );

                if (latestEntry) {
                  openEntryDetails(
                    latestEntry
                  );
                }
              }}
              style={
                styles.viewInsightButton
              }
            >
              <Text
                style={
                  styles.viewInsightText
                }
              >
                View Full Recommendation
              </Text>

              <Ionicons
                name="arrow-forward"
                size={16}
                color="#8B74B8"
              />
            </TouchableOpacity>
          </View>

          <View
            style={
              styles.timelineHeader
            }
          >
            <View>
              <Text
                style={
                  styles.timelineTitle
                }
              >
                Entry Timeline
              </Text>

              <Text
                style={
                  styles.timelineSubtitle
                }
              >
                All emotional updates in
                chronological order
              </Text>
            </View>

            <Text
              style={
                styles.timelineCount
              }
            >
              {
                filteredEntries.length
              }
            </Text>
          </View>

          {filteredEntries.length ===
          0 ? (
            <View
              style={
                styles.emptyTimeline
              }
            >
              <View
                style={
                  styles.emptyTimelineIcon
                }
              >
                <Ionicons
                  name="document-text-outline"
                  size={29}
                  color="#78ACD5"
                />
              </View>

              <Text
                style={
                  styles.emptyTimelineTitle
                }
              >
                No progress data yet
              </Text>

              <Text
                style={
                  styles.emptyTimelineText
                }
              >
                Add a new entry to start
                tracking emotional
                progress.
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={openAddEntry}
                style={
                  styles.emptyAddButton
                }
              >
                <Text
                  style={
                    styles.emptyAddButtonText
                  }
                >
                  Add Entry
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredEntries.map(
              (entry, index) => {
                const statusStyle =
                  getStatusStyle(
                    entry.status
                  );

                return (
                  <View
                    key={entry.id}
                    style={
                      styles.timelineItemWrapper
                    }
                  >
                    <View
                      style={
                        styles.timelineIndicatorColumn
                      }
                    >
                      <View
                        style={[
                          styles.timelineIcon,
                          {
                            backgroundColor:
                              entry.iconBackground,
                          },
                        ]}
                      >
                        <Ionicons
                          name={entry.icon}
                          size={18}
                          color={
                            entry.iconColor
                          }
                        />
                      </View>

                      {index !==
                      filteredEntries.length -
                        1 ? (
                        <View
                          style={
                            styles.timelineLine
                          }
                        />
                      ) : null}
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.82}
                      onPress={() =>
                        openEntryDetails(
                          entry
                        )
                      }
                      style={
                        styles.timelineCard
                      }
                    >
                      <View
                        style={
                          styles.entryTopRow
                        }
                      >
                        <View
                          style={
                            styles.entryTitleContent
                          }
                        >
                          <Text
                            style={
                              styles.entryEmotion
                            }
                          >
                            {
                              entry.emotion
                            }
                          </Text>

                          <Text
                            style={
                              styles.entryDate
                            }
                          >
                            {entry.date} •{" "}
                            {entry.type}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                statusStyle.backgroundColor,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              {
                                color:
                                  statusStyle.color,
                              },
                            ]}
                          >
                            {entry.status}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={
                          styles.entryDescription
                        }
                        numberOfLines={3}
                      >
                        {
                          entry.description
                        }
                      </Text>

                      <View
                        style={
                          styles.entryFooter
                        }
                      >
                        <View
                          style={
                            styles.entryFooterItem
                          }
                        >
                          <Ionicons
                            name="analytics-outline"
                            size={14}
                            color="#92979E"
                          />

                          <Text
                            style={
                              styles.entryFooterText
                            }
                          >
                            {
                              entry.confidence
                            }
                            % confidence
                          </Text>
                        </View>

                        <View
                          style={
                            styles.entryFooterItem
                          }
                        >
                          <Ionicons
                            name={
                              entry.doctorResponseExists
                                ? "chatbubble-ellipses-outline"
                                : "time-outline"
                            }
                            size={14}
                            color={
                              entry.doctorResponseExists
                                ? "#8B74B8"
                                : "#92979E"
                            }
                          />

                          <Text
                            style={
                              styles.entryFooterText
                            }
                          >
                            {entry.doctorResponseExists
                              ? "Doctor response"
                              : "Awaiting review"}
                          </Text>
                        </View>

                        <Ionicons
                          name="chevron-forward"
                          size={17}
                          color="#A7ABB0"
                        />
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              }
            )
          )}

          <View
            style={
              styles.bottomSpace
            }
          />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },

    background: {
      flex: 1,
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
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F5F6F7",
      marginRight: 10,
    },

    headerContent: {
      flex: 1,
    },

    pageTitle: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "600",
      color: "#24282C",
    },

    pageSubtitle: {
      marginTop: 2,
      fontSize: 8.5,
      color: "#92979E",
    },

    headerAddButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#EAF5FD",
    },

    scrollView: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal: 18,
      paddingBottom: 30,
    },

    childInfoCard: {
      minHeight: 78,
      borderRadius: 20,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7E9EB",
      paddingHorizontal: 15,
      paddingVertical: 13,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#9DA6AD",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 1,
    },

    childAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#EAF5FD",
      marginRight: 12,
    },

    childInfoContent: {
      flex: 1,
    },

    childName: {
      fontSize: 14,
      fontWeight: "700",
      color: "#24282C",
    },

    childDetails: {
      marginTop: 3,
      fontSize: 9,
      color: "#92979E",
    },

    improvingBadge: {
      height: 28,
      borderRadius: 14,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#E7F7EC",
    },

    improvingText: {
      marginLeft: 4,
      fontSize: 8.5,
      fontWeight: "600",
      color: "#4D9A66",
    },

    filtersContainer: {
      marginTop: 16,
      flexDirection: "row",
      gap: 8,
    },

    filterButton: {
      flex: 1,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F2F0F5",
    },

    filterButtonActive: {
      backgroundColor: "#F5C1C5",
    },

    filterText: {
      fontSize: 9,
      fontWeight: "500",
      color: "#777C82",
    },

    filterTextActive: {
      fontWeight: "600",
      color: "#6A5558",
    },

    summaryCard: {
      marginTop: 16,
      borderRadius: 20,
      padding: 16,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7E9EB",
    },

    cardTitleRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    summaryIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#EAF5FD",
      marginRight: 10,
    },

    cardTitleContent: {
      flex: 1,
    },

    cardTitle: {
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700",
      color: "#292D31",
    },

    cardSubtitle: {
      marginTop: 2,
      fontSize: 8.5,
      lineHeight: 12,
      color: "#92979E",
    },

    summaryText: {
      marginTop: 14,
      fontSize: 10,
      lineHeight: 16,
      color: "#555B61",
    },

    summaryFooter: {
      marginTop: 13,
      paddingTop: 11,
      borderTopWidth: 1,
      borderTopColor: "#F0F1F2",
      flexDirection: "row",
      alignItems: "center",
    },

    summaryFooterText: {
      flex: 1,
      marginLeft: 6,
      fontSize: 8,
      lineHeight: 12,
      color: "#92979E",
    },

    statisticsRow: {
      marginTop: 14,
      flexDirection: "row",
    },

    statisticCard: {
      flex: 1,
      minHeight: 92,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7E9EB",
    },

    statisticCardMargin: {
      marginRight: 9,
    },

    statisticValue: {
      marginTop: 6,
      fontSize: 16,
      fontWeight: "700",
      color: "#292D31",
    },

    statisticLabel: {
      marginTop: 2,
      fontSize: 8,
      color: "#92979E",
    },

    trendCard: {
      marginTop: 16,
      borderRadius: 20,
      padding: 16,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7E9EB",
    },

    trendHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },

    confidenceContainer: {
      alignItems: "flex-end",
    },

    confidenceValue: {
      fontSize: 13,
      fontWeight: "700",
      color: "#3976A4",
    },

    confidenceLabel: {
      marginTop: 2,
      fontSize: 7.5,
      color: "#92979E",
    },

    chartContainer: {
      height: 115,
      marginTop: 18,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: "#E7E9EB",
    },

    chartItem: {
      flex: 1,
      alignItems: "center",
    },

    chartBarArea: {
      height: 82,
      justifyContent: "flex-end",
      alignItems: "center",
    },

    chartBar: {
      width: 18,
      minHeight: 8,
      borderTopLeftRadius: 7,
      borderTopRightRadius: 7,
    },

    chartLabel: {
      marginTop: 6,
      marginBottom: 5,
      fontSize: 7,
      color: "#92979E",
    },

    trendResultRow: {
      marginTop: 14,
      flexDirection: "row",
      alignItems: "center",
    },

    trendResultIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#E7F7EC",
      marginRight: 9,
    },

    trendResultText: {
      flex: 1,
      fontSize: 9,
      lineHeight: 14,
      color: "#555B61",
    },

    patternsCard: {
      marginTop: 16,
      borderRadius: 20,
      padding: 16,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7E9EB",
    },

    patternsContainer: {
      marginTop: 13,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    patternBadge: {
      minHeight: 32,
      borderRadius: 16,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
    },

    patternPink: {
      backgroundColor: "#FFF0F1",
    },

    patternBlue: {
      backgroundColor: "#EAF5FD",
    },

    patternGreen: {
      backgroundColor: "#E7F7EC",
    },

    patternText: {
      marginLeft: 5,
      fontSize: 8.5,
      fontWeight: "500",
      color: "#555B61",
    },

    doctorInsightCard: {
      marginTop: 16,
      borderRadius: 20,
      padding: 16,
      backgroundColor: "#FAF7FE",
      borderWidth: 1,
      borderColor: "#E7DDF3",
    },

    doctorInsightHeader: {
      flexDirection: "row",
      alignItems: "center",
    },

    doctorIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F2ECFB",
      marginRight: 10,
    },

    doctorHeaderContent: {
      flex: 1,
    },

    doctorName: {
      marginTop: 14,
      fontSize: 11,
      fontWeight: "700",
      color: "#292D31",
    },

    doctorSpecialization: {
      marginTop: 2,
      fontSize: 8.5,
      color: "#8B74B8",
    },

    doctorInsightText: {
      marginTop: 11,
      fontSize: 9.5,
      lineHeight: 15,
      color: "#555B61",
    },

    viewInsightButton: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: "#E7DDF3",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    viewInsightText: {
      fontSize: 9,
      fontWeight: "600",
      color: "#8B74B8",
    },

    timelineHeader: {
      marginTop: 22,
      marginBottom: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    timelineTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: "#292D31",
    },

    timelineSubtitle: {
      marginTop: 3,
      fontSize: 8.5,
      color: "#92979E",
    },

    timelineCount: {
      minWidth: 25,
      height: 25,
      borderRadius: 13,
      textAlign: "center",
      textAlignVertical: "center",
      fontSize: 8.5,
      fontWeight: "600",
      color: "#3976A4",
      backgroundColor: "#EAF5FD",
    },

    timelineItemWrapper: {
      flexDirection: "row",
    },

    timelineIndicatorColumn: {
      width: 42,
      alignItems: "center",
    },

    timelineIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2,
    },

    timelineLine: {
      flex: 1,
      width: 1,
      minHeight: 112,
      backgroundColor: "#DDE1E5",
    },

    timelineCard: {
      flex: 1,
      marginLeft: 7,
      marginBottom: 13,
      borderRadius: 17,
      padding: 13,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7E9EB",
    },

    entryTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },

    entryTitleContent: {
      flex: 1,
      paddingRight: 8,
    },

    entryEmotion: {
      fontSize: 11,
      fontWeight: "700",
      color: "#292D31",
    },

    entryDate: {
      marginTop: 3,
      fontSize: 8,
      color: "#92979E",
    },

    statusBadge: {
      minHeight: 24,
      borderRadius: 12,
      paddingHorizontal: 8,
      justifyContent: "center",
      alignItems: "center",
    },

    statusText: {
      fontSize: 7,
      fontWeight: "600",
    },

    entryDescription: {
      marginTop: 10,
      fontSize: 9,
      lineHeight: 14,
      color: "#60666C",
    },

    entryFooter: {
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: "#F0F1F2",
      flexDirection: "row",
      alignItems: "center",
    },

    entryFooterItem: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 12,
    },

    entryFooterText: {
      marginLeft: 4,
      fontSize: 7.5,
      color: "#92979E",
    },

    emptyTimeline: {
      paddingVertical: 35,
      paddingHorizontal: 24,
      borderRadius: 20,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7E9EB",
      alignItems: "center",
    },

    emptyTimelineIcon: {
      width: 62,
      height: 62,
      borderRadius: 31,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#EDF7FF",
    },

    emptyTimelineTitle: {
      marginTop: 13,
      fontSize: 13,
      fontWeight: "700",
      color: "#292D31",
    },

    emptyTimelineText: {
      marginTop: 6,
      fontSize: 9,
      lineHeight: 14,
      color: "#92979E",
      textAlign: "center",
    },

    emptyAddButton: {
      height: 40,
      borderRadius: 20,
      marginTop: 16,
      paddingHorizontal: 22,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#EAF5FD",
    },

    emptyAddButtonText: {
      fontSize: 9,
      fontWeight: "600",
      color: "#3976A4",
    },

    bottomSpace: {
      height: 35,
    },
  });