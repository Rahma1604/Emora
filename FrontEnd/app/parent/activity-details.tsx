import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  Feather,
} from "@expo/vector-icons";
import {
  router,
  useLocalSearchParams,
} from "expo-router";

type ActivityStatus =
  | "Pending Review"
  | "Reviewed"
  | "Closed";

type FocusSection =
  | "analysis"
  | "doctor-response"
  | "";

function getSingleParam(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function getStatusStyle(status: string) {
  if (status === "Reviewed") {
    return {
      backgroundColor: "#DDF8E2",
      textColor: "#45A75A",
      icon: "checkmark-circle-outline" as const,
    };
  }

  if (status === "Closed") {
    return {
      backgroundColor: "#ECEFF8",
      textColor: "#6472A5",
      icon: "lock-closed-outline" as const,
    };
  }

  return {
    backgroundColor: "#FFF0DE",
    textColor: "#D98C35",
    icon: "time-outline" as const,
  };
}

export default function ActivityDetails() {
  const params = useLocalSearchParams<{
    activityId?: string | string[];
    childId?: string | string[];
    childName?: string | string[];
    childAge?: string | string[];
    date?: string | string[];
    type?: string | string[];
    emotion?: string | string[];
    description?: string | string[];
    status?: string | string[];
    confidence?: string | string[];
    focusSection?: string | string[];
    entryCount?: string | string[];
  }>();

  const scrollViewRef =
    useRef<ScrollView>(null);

  const hasAutoScrolledRef =
    useRef(false);

  const [
    analysisSectionY,
    setAnalysisSectionY,
  ] = useState<number | null>(null);

  const [
    doctorResponseSectionY,
    setDoctorResponseSectionY,
  ] = useState<number | null>(null);

  const activityId =
    getSingleParam(params.activityId) ||
    "1";

  const childId =
    getSingleParam(params.childId) ||
    "";

  const childName =
    getSingleParam(params.childName) ||
    "Lily";

  const childAge =
    getSingleParam(params.childAge) ||
    "5";

  const date =
    getSingleParam(params.date) ||
    "May 12, 2026";

  const type =
    getSingleParam(params.type) ||
    "Text Entry";

  const emotion =
    getSingleParam(params.emotion) ||
    "Anxiety";

  const description =
    getSingleParam(params.description) ||
    "The results indicate mild anxiety indicators related to the school environment. It is recommended to monitor sleep patterns during the upcoming week.";

  const status =
    (getSingleParam(params.status) ||
      "Pending Review") as ActivityStatus;

  const confidence =
    getSingleParam(params.confidence) ||
    "82";

  const focusSection =
    getSingleParam(
      params.focusSection
    ) as FocusSection;

  const parsedEntryCount = Number(
    getSingleParam(params.entryCount) ||
      "1"
  );

  const entryCount =
    Number.isFinite(parsedEntryCount) &&
    parsedEntryCount > 0
      ? parsedEntryCount
      : 1;

  const hasEnoughTrendInformation =
    entryCount > 1;

  const statusStyle =
    getStatusStyle(status);

  useEffect(() => {
    hasAutoScrolledRef.current = false;
  }, [activityId, focusSection]);

  useEffect(() => {
    if (
      hasAutoScrolledRef.current ||
      !focusSection
    ) {
      return;
    }

    let targetY: number | null = null;

    if (
      focusSection === "analysis" &&
      analysisSectionY !== null
    ) {
      targetY = analysisSectionY;
    }

    if (
      focusSection ===
        "doctor-response" &&
      doctorResponseSectionY !== null
    ) {
      targetY =
        doctorResponseSectionY;
    }

    if (targetY === null) {
      return;
    }

    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(targetY - 15, 0),
        animated: true,
      });

      hasAutoScrolledRef.current = true;
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [
    focusSection,
    analysisSectionY,
    doctorResponseSectionY,
  ]);

  const openAIChat = () => {
    router.push(
      {
        pathname:
          "/parent/ai-chat",
        params: {
          childId,
          childName,
          childAge,
          activityId,
          emotion,
        },
      } as any
    );
  };

  const openChildProfile = () => {
    router.push(
      {
        pathname:
          "/parent/childProfile",
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
    >
      <LinearGradient
        colors={[
          "#FFFFFF",
          "#FFF9F9",
          "#F8FCFF",
        ]}
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
          style={styles.container}
        >
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.scrollContent
            }
          >
            {/* Header */}
            <View
              style={styles.header}
            >
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() =>
                  router.back()
                }
                style={
                  styles.backButton
                }
              >
                <Ionicons
                  name="chevron-back"
                  size={22}
                  color="#24282C"
                />
              </TouchableOpacity>

              <Text
                style={
                  styles.headerTitle
                }
              >
                Activity Details
              </Text>

              <View
                style={
                  styles.headerSpace
                }
              />
            </View>

            {/* Child Information */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={
                openChildProfile
              }
              style={styles.childCard}
            >
              <View
                style={styles.avatar}
              >
                <Ionicons
                  name="happy-outline"
                  size={23}
                  color="#FFFFFF"
                />
              </View>

              <View
                style={styles.childInfo}
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
                    styles.childAge
                  }
                >
                  {childAge} years old
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
                <Ionicons
                  name={
                    statusStyle.icon
                  }
                  size={12}
                  color={
                    statusStyle.textColor
                  }
                />

                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        statusStyle.textColor,
                    },
                  ]}
                >
                  {status}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Activity Information */}
            <Text
              style={
                styles.sectionTitle
              }
            >
              Activity Information
            </Text>

            <View style={styles.card}>
              <View
                style={styles.infoRow}
              >
                <Text
                  style={
                    styles.infoLabel
                  }
                >
                  Entry Type
                </Text>

                <Text
                  style={
                    styles.infoValue
                  }
                >
                  {type}
                </Text>
              </View>

              <View
                style={styles.divider}
              />

              <View
                style={styles.infoRow}
              >
                <Text
                  style={
                    styles.infoLabel
                  }
                >
                  Detected Emotion
                </Text>

                <View
                  style={
                    styles.emotionValue
                  }
                >
                  <View
                    style={
                      styles.emotionDot
                    }
                  />

                  <Text
                    style={
                      styles.emotionText
                    }
                  >
                    {emotion}
                  </Text>
                </View>
              </View>

              <View
                style={styles.divider}
              />

              <View
                style={styles.infoRow}
              >
                <Text
                  style={
                    styles.infoLabel
                  }
                >
                  Analysis Date
                </Text>

                <Text
                  style={
                    styles.infoValue
                  }
                >
                  {date}
                </Text>
              </View>

              <View
                style={styles.divider}
              />

              <View
                style={styles.infoRow}
              >
                <Text
                  style={
                    styles.infoLabel
                  }
                >
                  Confidence
                </Text>

                <Text
                  style={
                    styles.infoValue
                  }
                >
                  {confidence}%
                </Text>
              </View>
            </View>

            {/* Parent Entry */}
            <Text
              style={
                styles.sectionTitle
              }
            >
              Parent Entry
            </Text>

            <View style={styles.card}>
              <View
                style={
                  styles.cardTitleRow
                }
              >
                <View
                  style={
                    styles.smallIconBox
                  }
                >
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color="#5E88A7"
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.cardTitle
                    }
                  >
                    {type}
                  </Text>

                  <Text
                    style={
                      styles.cardDate
                    }
                  >
                    Submitted on {date}
                  </Text>
                </View>
              </View>

              <Text
                style={
                  styles.entryDescription
                }
              >
                {description}
              </Text>
            </View>

            {/* AI Analysis */}
            <View
              onLayout={(event) => {
                setAnalysisSectionY(
                  event.nativeEvent.layout.y
                );
              }}
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                AI Analysis
              </Text>

              <View
                style={
                  styles.analysisCard
                }
              >
                <View
                  style={
                    styles.analysisHeader
                  }
                >
                  <View
                    style={
                      styles.analysisIcon
                    }
                  >
                    <Ionicons
                      name="sparkles-outline"
                      size={18}
                      color="#B65A61"
                    />
                  </View>

                  <View
                    style={
                      styles.analysisTitleContent
                    }
                  >
                    <Text
                      style={
                        styles.analysisTitle
                      }
                    >
                      Emotional Analysis
                      Summary
                    </Text>

                    <Text
                      style={
                        styles.analysisSubtitle
                      }
                    >
                      Generated from the
                      submitted entry
                    </Text>
                  </View>
                </View>

                <Text
                  style={
                    styles.analysisText
                  }
                >
                  The analysis indicates
                  mild{" "}
                  {emotion.toLowerCase()}{" "}
                  indicators. The
                  emotional response may
                  be connected to recent
                  daily activities or
                  changes in the child's
                  environment.
                </Text>

                <View
                  style={
                    styles.analysisDivider
                  }
                />

                <View
                  style={
                    styles.analysisRow
                  }
                >
                  <Text
                    style={
                      styles.analysisLabel
                    }
                  >
                    Emotional Level
                  </Text>

                  <Text
                    style={
                      styles.analysisValue
                    }
                  >
                    Mild
                  </Text>
                </View>

                <View
                  style={
                    styles.analysisRow
                  }
                >
                  <Text
                    style={
                      styles.analysisLabel
                    }
                  >
                    Long-term Trend
                  </Text>

                  <Text
                    style={
                      hasEnoughTrendInformation
                        ? styles.improvingText
                        : styles.notEnoughInformationText
                    }
                  >
                    {hasEnoughTrendInformation
                      ? "Improving"
                      : "Not enough information"}
                  </Text>
                </View>
              </View>
            </View>

            {/* AI Recommendations */}
            <Text
              style={
                styles.sectionTitle
              }
            >
              AI Recommendations
            </Text>

            <View style={styles.card}>
              <View
                style={
                  styles.recommendationsSourceRow
                }
              >
                <View
                  style={
                    styles.recommendationsSourceIcon
                  }
                >
                  <Ionicons
                    name="sparkles-outline"
                    size={16}
                    color="#5E88A7"
                  />
                </View>

                <View
                  style={
                    styles.recommendationsSourceContent
                  }
                >
                  <Text
                    style={
                      styles.recommendationsSourceTitle
                    }
                  >
                    AI-generated support
                    suggestions
                  </Text>

                  <Text
                    style={
                      styles.recommendationsSourceSubtitle
                    }
                  >
                    Based on the emotional
                    indicators found in
                    this entry
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.recommendationsDivider
                }
              />

              <View
                style={
                  styles.recommendationItem
                }
              >
                <View
                  style={
                    styles.recommendationNumber
                  }
                >
                  <Text
                    style={
                      styles.recommendationNumberText
                    }
                  >
                    1
                  </Text>
                </View>

                <Text
                  style={
                    styles.recommendationText
                  }
                >
                  Observe the child's mood
                  and behavior during the
                  upcoming week.
                </Text>
              </View>

              <View
                style={
                  styles.recommendationItem
                }
              >
                <View
                  style={
                    styles.recommendationNumber
                  }
                >
                  <Text
                    style={
                      styles.recommendationNumberText
                    }
                  >
                    2
                  </Text>
                </View>

                <Text
                  style={
                    styles.recommendationText
                  }
                >
                  Maintain a consistent
                  sleep schedule and
                  monitor any noticeable
                  changes.
                </Text>
              </View>

              <View
                style={
                  styles.recommendationItem
                }
              >
                <View
                  style={
                    styles.recommendationNumber
                  }
                >
                  <Text
                    style={
                      styles.recommendationNumberText
                    }
                  >
                    3
                  </Text>
                </View>

                <Text
                  style={
                    styles.recommendationText
                  }
                >
                  Encourage the child to
                  describe their feelings
                  in a calm and supportive
                  environment.
                </Text>
              </View>

              <View
                style={
                  styles.recommendationDisclaimer
                }
              >
                <Ionicons
                  name="information-circle-outline"
                  size={15}
                  color="#92979E"
                />

                <Text
                  style={
                    styles.recommendationDisclaimerText
                  }
                >
                  These AI-generated
                  suggestions do not
                  replace professional
                  medical or psychological
                  advice.
                </Text>
              </View>
            </View>

            {/* Specialist Review */}
            <View
              onLayout={(event) => {
                setDoctorResponseSectionY(
                  event.nativeEvent.layout.y
                );
              }}
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Specialist Review
              </Text>

              {status ===
              "Pending Review" ? (
                <View
                  style={
                    styles.pendingReviewCard
                  }
                >
                  <View
                    style={
                      styles.reviewIcon
                    }
                  >
                    <Ionicons
                      name="time-outline"
                      size={21}
                      color="#D98C35"
                    />
                  </View>

                  <View
                    style={
                      styles.reviewContent
                    }
                  >
                    <Text
                      style={
                        styles.reviewTitle
                      }
                    >
                      Waiting for
                      specialist review
                    </Text>

                    <Text
                      style={
                        styles.reviewDescription
                      }
                    >
                      A specialist has not
                      reviewed this
                      analysis yet. You
                      will receive an
                      update when the
                      review is completed.
                    </Text>
                  </View>
                </View>
              ) : (
                <View
                  style={styles.card}
                >
                  <View
                    style={
                      styles.doctorHeader
                    }
                  >
                    <View
                      style={
                        styles.doctorAvatar
                      }
                    >
                      <Feather
                        name="user"
                        size={21}
                        color="#3976A4"
                      />
                    </View>

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
                        Dr. Ahmed Hassan
                      </Text>

                      <Text
                        style={
                          styles.doctorRole
                        }
                      >
                        Child Psychology
                        Specialist
                      </Text>
                    </View>

                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#4CAF70"
                    />
                  </View>

                  <View
                    style={
                      styles.doctorNote
                    }
                  >
                    <Text
                      style={
                        styles.doctorNoteText
                      }
                    >
                      The current
                      indicators are mild.
                      Continue observing
                      sleep patterns,
                      school-related
                      behavior and social
                      interactions.
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.reviewDate
                    }
                  >
                    Reviewed on May 14,
                    2026
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={openAIChat}
              style={
                styles.primaryButtonWrapper
              }
            >
              <LinearGradient
                colors={[
                  "#A6D2F6",
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
                  styles.primaryButton
                }
              >
                <Ionicons
                  name="sparkles-outline"
                  size={17}
                  color="#292D31"
                />

                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Ask AI About This Result
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                router.replace(
                  "/parent/activity-history"
                )
              }
              style={
                styles.secondaryButton
              }
            >
              <Feather
                name="arrow-left"
                size={16}
                color="#5E88A7"
              />

              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                Back to Activity History
              </Text>
            </TouchableOpacity>

            <View
              style={
                styles.bottomSpace
              }
            />
          </ScrollView>
        </View>
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

    container: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 30,
    },

    header: {
      minHeight: 46,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 15,
    },

    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "#F5F6F7",
      justifyContent: "center",
      alignItems: "center",
    },

    headerTitle: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "600",
      color: "#24282C",
    },

    headerSpace: {
      width: 36,
    },

    childCard: {
      minHeight: 66,
      borderRadius: 16,
      paddingHorizontal: 13,
      paddingVertical: 11,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E8ECEF",
      marginBottom: 20,
      shadowColor: "#9DA6AD",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.06,
      shadowRadius: 5,
      elevation: 1,
    },

    avatar: {
      width: 43,
      height: 43,
      borderRadius: 22,
      backgroundColor: "#F5ADB1",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 11,
    },

    childInfo: {
      flex: 1,
    },

    childName: {
      fontSize: 14,
      fontWeight: "700",
      color: "#24282C",
    },

    childAge: {
      marginTop: 3,
      fontSize: 8.5,
      color: "#858B92",
    },

    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 5,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    statusText: {
      fontSize: 7.5,
      fontWeight: "500",
    },

    sectionTitle: {
      fontSize: 13,
      fontWeight: "500",
      color: "#373B3F",
      marginBottom: 10,
    },

    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#E7E9EB",
      paddingHorizontal: 13,
      paddingVertical: 12,
      marginBottom: 20,
      shadowColor: "#9DA6AD",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 1,
    },

    infoRow: {
      minHeight: 39,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    infoLabel: {
      fontSize: 9.5,
      color: "#7A8086",
    },

    infoValue: {
      fontSize: 9.5,
      fontWeight: "600",
      color: "#292D31",
    },

    divider: {
      height: 1,
      backgroundColor: "#F0F1F2",
    },

    emotionValue: {
      flexDirection: "row",
      alignItems: "center",
    },

    emotionDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "#F5ADB1",
      marginRight: 6,
    },

    emotionText: {
      fontSize: 9.5,
      fontWeight: "600",
      color: "#B65A61",
    },

    cardTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 11,
    },

    smallIconBox: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: "#EDF7FF",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },

    cardTitle: {
      fontSize: 10,
      fontWeight: "700",
      color: "#303438",
    },

    cardDate: {
      marginTop: 3,
      fontSize: 8,
      color: "#92979E",
    },

    entryDescription: {
      fontSize: 9.5,
      lineHeight: 14,
      color: "#4D5358",
    },

    analysisCard: {
      backgroundColor: "#FFF6F6",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#F7CFD1",
      paddingHorizontal: 13,
      paddingVertical: 13,
      marginBottom: 20,
    },

    analysisHeader: {
      flexDirection: "row",
      alignItems: "center",
    },

    analysisIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: "#FFE4E5",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },

    analysisTitleContent: {
      flex: 1,
    },

    analysisTitle: {
      fontSize: 10,
      fontWeight: "700",
      color: "#B65A61",
    },

    analysisSubtitle: {
      marginTop: 3,
      fontSize: 8,
      color: "#9A7779",
    },

    analysisText: {
      marginTop: 11,
      fontSize: 9.5,
      lineHeight: 14,
      color: "#595E63",
    },

    analysisDivider: {
      height: 1,
      backgroundColor: "#F3DCDD",
      marginVertical: 11,
    },

    analysisRow: {
      minHeight: 27,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    analysisLabel: {
      fontSize: 8.5,
      color: "#858B92",
    },

    analysisValue: {
      fontSize: 9,
      fontWeight: "600",
      color: "#B65A61",
    },

    improvingText: {
      fontSize: 9,
      fontWeight: "600",
      color: "#45A75A",
    },

    notEnoughInformationText: {
      fontSize: 9,
      fontWeight: "600",
      color: "#858B92",
    },

    recommendationsSourceRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    recommendationsSourceIcon: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor: "#EDF7FF",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 9,
    },

    recommendationsSourceContent: {
      flex: 1,
    },

    recommendationsSourceTitle: {
      fontSize: 9.5,
      fontWeight: "700",
      color: "#303438",
    },

    recommendationsSourceSubtitle: {
      marginTop: 3,
      fontSize: 8,
      lineHeight: 12,
      color: "#92979E",
    },

    recommendationsDivider: {
      height: 1,
      backgroundColor: "#F0F1F2",
      marginTop: 11,
      marginBottom: 13,
    },

    recommendationItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 12,
    },

    recommendationNumber: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#EDF7FF",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 9,
    },

    recommendationNumberText: {
      fontSize: 8.5,
      fontWeight: "700",
      color: "#5E88A7",
    },

    recommendationText: {
      flex: 1,
      fontSize: 9.5,
      lineHeight: 14,
      color: "#555B60",
    },

    recommendationDisclaimer: {
      marginTop: 2,
      paddingTop: 11,
      borderTopWidth: 1,
      borderTopColor: "#F0F1F2",
      flexDirection: "row",
      alignItems: "flex-start",
    },

    recommendationDisclaimerText: {
      flex: 1,
      marginLeft: 6,
      fontSize: 8,
      lineHeight: 12,
      color: "#92979E",
    },

    pendingReviewCard: {
      borderRadius: 16,
      backgroundColor: "#FFF8EF",
      borderWidth: 1,
      borderColor: "#F6DFC2",
      paddingHorizontal: 13,
      paddingVertical: 13,
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 20,
    },

    reviewIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#FFF0DE",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },

    reviewContent: {
      flex: 1,
    },

    reviewTitle: {
      fontSize: 10,
      fontWeight: "700",
      color: "#9C6C32",
    },

    reviewDescription: {
      marginTop: 5,
      fontSize: 9,
      lineHeight: 14,
      color: "#7F6A50",
    },

    doctorHeader: {
      flexDirection: "row",
      alignItems: "center",
    },

    doctorAvatar: {
      width: 43,
      height: 43,
      borderRadius: 22,
      backgroundColor: "#EDF7FF",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },

    doctorInfo: {
      flex: 1,
    },

    doctorName: {
      fontSize: 10,
      fontWeight: "700",
      color: "#303438",
    },

    doctorRole: {
      marginTop: 3,
      fontSize: 8,
      color: "#858B92",
    },

    doctorNote: {
      marginTop: 12,
      padding: 11,
      borderRadius: 12,
      backgroundColor: "#F6FAFD",
      borderWidth: 1,
      borderColor: "#DCEAF4",
    },

    doctorNoteText: {
      fontSize: 9,
      lineHeight: 14,
      color: "#60666C",
    },

    reviewDate: {
      marginTop: 9,
      textAlign: "right",
      fontSize: 8,
      color: "#92979E",
    },

    primaryButtonWrapper: {
      marginTop: 2,
    },

    primaryButton: {
      height: 46,
      borderRadius: 999,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 7,
    },

    primaryButtonText: {
      fontSize: 9.5,
      fontWeight: "600",
      color: "#292D31",
    },

    secondaryButton: {
      height: 44,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "#D8E7F2",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 7,
      marginTop: 10,
    },

    secondaryButtonText: {
      fontSize: 9.5,
      fontWeight: "600",
      color: "#5E88A7",
    },

    bottomSpace: {
      height: 15,
    },
  });