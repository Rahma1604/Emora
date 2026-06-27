import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
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
  Feather,
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import API from "../api";

type ActivityStatus =
  | "Pending Review"
  | "Reviewed"
  | "Closed";

type FocusSection =
  | "analysis"
  | "doctor-response"
  | "";

type ChildInfo = {
  _id?: string;
  name?: string;
  age?: number | string;
  gender?: string;
};

type DoctorInfo = {
  _id?: string;
  fullName?: string;
  specialization?: string;
  profilePic?: string;
  isVerified?: boolean;
};

type Recommendation = {
  date?: string;
  note?: string;
};

type CaseData = {
  _id?: string;
  status?: string;
  priority?: string;
  childProgress?: string;
  entriesCount?: number;
  createdAt?: string;
  lastAnalysisDate?: string;
  dominantEmotion?: string;
  emotionPercentage?: number;
  aiDiagnosis?: string;
  aiSummary?: string;
  doctorRecommendation?: string;
  doctorRecommendations?: Recommendation[];
  recurringPatterns?: string[];
  analysisTimeline?: Array<{
    diagnosis?: string;
    emotion?: string;
    confidence?: number;
    date?: string;
  }>;
  doctor?: DoctorInfo | null;
};

type SelectedEntry = {
  id?: string;
  caseId?: string;
  type?: string;
  date?: string;
  content?: string;
  analysisResult?: string;
  description?: string;
  emotion?: string;
  confidence?: number;
  imageUrl?: string;
  audioUrl?: string;
};

type CaseDetailsResponse = {
  childInfo?: ChildInfo;
  caseData?: CaseData | null;
  selectedEntry?: SelectedEntry | null;
  entries?: SelectedEntry[];
};

type ChildOverviewResponse = {
  childInfo?: ChildInfo;
  caseData?: CaseData | null;
  recentEntries?: SelectedEntry[];
};

type ChildEntriesResponse = {
  childInfo?: ChildInfo;
  entries?: SelectedEntry[];
};

function getSingleParam(
  value:
    | string
    | string[]
    | undefined
): string {
  if (
    Array.isArray(value)
  ) {
    return value[0] || "";
  }

  return value || "";
}

function normalizeStatus(
  value?: string
): ActivityStatus {
  const status =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    status === "reviewed" ||
    status === "improving"
  ) {
    return "Reviewed";
  }

  if (
    status === "closed"
  ) {
    return "Closed";
  }

  return "Pending Review";
}

function getStatusStyle(
  status: ActivityStatus
) {
  if (
    status === "Reviewed"
  ) {
    return {
      backgroundColor:
        "#DDF8E2",
      textColor:
        "#45A75A",
      icon:
        "checkmark-circle-outline" as const,
    };
  }

  if (
    status === "Closed"
  ) {
    return {
      backgroundColor:
        "#ECEFF8",
      textColor:
        "#6472A5",
      icon:
        "lock-closed-outline" as const,
    };
  }

  return {
    backgroundColor:
      "#FFF0DE",
    textColor:
      "#D98C35",
    icon:
      "time-outline" as const,
  };
}

function formatDate(
  value?: string,
  fallback = "Date unavailable"
): string {
  if (!value) {
    return fallback;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function getErrorMessage(
  error: unknown
): string {
  if (
    axios.isAxiosError(error)
  ) {
    const data =
      error.response?.data as
        | {
            message?: unknown;
            error?: unknown;
            msg?: unknown;
          }
        | undefined;

    const message =
      data?.message ??
      data?.error ??
      data?.msg;

    if (
      typeof message === "string" &&
      message.trim()
    ) {
      return message;
    }
  }

  return "Could not load activity details.";
}

function getEmotionalLevel(
  confidence: number
): string {
  if (
    confidence >= 70
  ) {
    return "High";
  }

  if (
    confidence >= 40
  ) {
    return "Moderate";
  }

  if (
    confidence > 0
  ) {
    return "Mild";
  }

  return "Not available";
}

export default function ActivityDetails() {
  const params =
    useLocalSearchParams<{
      activityId?:
        | string
        | string[];

      caseId?:
        | string
        | string[];

      childId?:
        | string
        | string[];

      childName?:
        | string
        | string[];

      childAge?:
        | string
        | string[];

      date?:
        | string
        | string[];

      rawDate?:
        | string
        | string[];

      type?:
        | string
        | string[];

      emotion?:
        | string
        | string[];

      description?:
        | string
        | string[];

      status?:
        | string
        | string[];

      confidence?:
        | string
        | string[];

      focusSection?:
        | string
        | string[];

      entryCount?:
        | string
        | string[];
    }>();

  const scrollViewRef =
    useRef<ScrollView>(
      null
    );

  const hasAutoScrolledRef =
    useRef(false);

  const [
    analysisSectionY,
    setAnalysisSectionY,
  ] =
    useState<number | null>(
      null
    );

  const [
    doctorResponseSectionY,
    setDoctorResponseSectionY,
  ] =
    useState<number | null>(
      null
    );

  const [
    details,
    setDetails,
  ] =
    useState<CaseDetailsResponse>(
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

  const activityId =
    getSingleParam(
      params.activityId
    );

  const caseId =
    getSingleParam(
      params.caseId
    );

  const fallbackChildId =
    getSingleParam(
      params.childId
    );

  const fallbackChildName =
    getSingleParam(
      params.childName
    ) ||
    "Child";

  const fallbackChildAge =
    getSingleParam(
      params.childAge
    );

  const fallbackDate =
    getSingleParam(
      params.rawDate
    ) ||
    getSingleParam(
      params.date
    );

  const fallbackType =
    getSingleParam(
      params.type
    ) ||
    "Entry";

  const fallbackEmotion =
    getSingleParam(
      params.emotion
    ) ||
    "Unknown";

  const fallbackDescription =
    getSingleParam(
      params.description
    ) ||
    "No entry details are available.";

  const fallbackStatus =
    normalizeStatus(
      getSingleParam(
        params.status
      )
    );

  const fallbackConfidence =
    Number(
      getSingleParam(
        params.confidence
      ) ||
      0
    );

  const focusSection =
    getSingleParam(
      params.focusSection
    ) as FocusSection;

  const handleExpiredSession =
    useCallback(async () => {
      await AsyncStorage.multiRemove(
        [
          "token",
          "user",
        ]
      );

      router.replace(
        "/auth/login" as any
      );
    }, []);

  const loadDetails =
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
          let loadedDetails:
            CaseDetailsResponse |
            null = null;

          /*
            First try the dedicated case-details route when caseId exists.
            Some backend versions do not contain this route yet, so a 404
            automatically falls back to the already-existing child routes.
          */
          if (caseId) {
            try {
              const caseResponse =
                await API.get<CaseDetailsResponse>(
                  `/children/case/${caseId}/details`,
                  {
                    params: {
                      entryId:
                        activityId ||
                        undefined,
                    },
                  }
                );

              loadedDetails =
                caseResponse.data ||
                {};
            } catch (caseRouteError) {
              if (
                axios.isAxiosError(
                  caseRouteError
                ) &&
                (
                  caseRouteError.response
                    ?.status ===
                    401 ||
                  caseRouteError.response
                    ?.status ===
                    403
                )
              ) {
                throw caseRouteError;
              }

              const isMissingRoute =
                axios.isAxiosError(
                  caseRouteError
                ) &&
                (
                  caseRouteError.response
                    ?.status ===
                    404 ||
                  String(
                    caseRouteError.response
                      ?.data?.message ||
                    caseRouteError.response
                      ?.data?.error ||
                    ""
                  )
                    .toLowerCase()
                    .includes(
                      "route not found"
                    )
                );

              if (!isMissingRoute) {
                console.log(
                  "CASE DETAILS ROUTE ERROR, USING FALLBACK:",
                  caseRouteError
                );
              }
            }
          }

          /*
            Fallback used for:
            - Activity History when the new backend route is not deployed.
            - Recent Entries inside Child Profile where caseId may be absent.
          */
          if (!loadedDetails) {
            if (!fallbackChildId) {
              throw new Error(
                "Child ID is missing. Open this page from Activity History or Child Profile."
              );
            }

            const [
              overviewResponse,
              entriesResponse,
            ] =
              await Promise.all([
                API.get<ChildOverviewResponse>(
                  `/children/${fallbackChildId}/overview`
                ),

                API.get<ChildEntriesResponse>(
                  `/children/${fallbackChildId}/entries`
                ),
              ]);

            const allEntries =
              Array.isArray(
                entriesResponse.data
                  ?.entries
              )
                ? entriesResponse.data
                    .entries
                : [];

            const recentEntries =
              Array.isArray(
                overviewResponse.data
                  ?.recentEntries
              )
                ? overviewResponse.data
                    .recentEntries
                : [];

            const matchingEntry =
              (
                activityId
                  ? allEntries.find(
                      (
                        entry
                      ) =>
                        entry.id ===
                        activityId
                    )
                  : null
              ) ||
              (
                activityId
                  ? recentEntries.find(
                      (
                        entry
                      ) =>
                        entry.id ===
                        activityId
                    )
                  : null
              ) ||
              allEntries[0] ||
              recentEntries[0] ||
              null;

            loadedDetails = {
              childInfo:
                overviewResponse.data
                  ?.childInfo ||
                entriesResponse.data
                  ?.childInfo,

              caseData:
                overviewResponse.data
                  ?.caseData ||
                null,

              selectedEntry:
                matchingEntry,

              entries:
                allEntries.length > 0
                  ? allEntries
                  : recentEntries,
            };
          }

          setDetails(
            loadedDetails ||
            {}
          );
        } catch (error) {
          console.log(
            "ACTIVITY DETAILS ERROR:",
            error
          );

          if (
            axios.isAxiosError(
              error
            ) &&
            (
              error.response
                ?.status ===
                401 ||
              error.response
                ?.status ===
                403
            )
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
        activityId,
        caseId,
        handleExpiredSession,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      void loadDetails(
        "initial"
      );
    }, [loadDetails])
  );

  useEffect(() => {
    hasAutoScrolledRef.current =
      false;
  }, [
    activityId,
    focusSection,
  ]);

  useEffect(() => {
    if (
      hasAutoScrolledRef.current ||
      !focusSection
    ) {
      return;
    }

    let targetY:
      | number
      | null =
      null;

    if (
      focusSection ===
        "analysis" &&
      analysisSectionY !==
        null
    ) {
      targetY =
        analysisSectionY;
    }

    if (
      focusSection ===
        "doctor-response" &&
      doctorResponseSectionY !==
        null
    ) {
      targetY =
        doctorResponseSectionY;
    }

    if (
      targetY === null
    ) {
      return;
    }

    const timer =
      setTimeout(() => {
        scrollViewRef.current?.scrollTo(
          {
            y: Math.max(
              targetY! -
                15,
              0
            ),

            animated: true,
          }
        );

        hasAutoScrolledRef.current =
          true;
      }, 350);

    return () =>
      clearTimeout(
        timer
      );
  }, [
    focusSection,
    analysisSectionY,
    doctorResponseSectionY,
  ]);

  const child =
    details.childInfo ||
    {};

  const caseData =
    details.caseData ||
    {};

  const selectedEntry =
    details.selectedEntry ||
    {};

  const childId =
    child._id ||
    fallbackChildId;

  const childName =
    child.name ||
    fallbackChildName;

  const childAge =
    child.age !==
      undefined &&
    child.age !== null
      ? String(
          child.age
        )
      : fallbackChildAge ||
        "—";

  const type =
    selectedEntry.type ||
    fallbackType;

  const emotion =
    selectedEntry.emotion ||
    caseData.dominantEmotion ||
    fallbackEmotion;

  const confidence =
    Number(
      selectedEntry.confidence ??
      caseData.emotionPercentage ??
      fallbackConfidence ??
      0
    );

  const status =
    normalizeStatus(
      caseData.status ||
      fallbackStatus
    );

  const statusStyle =
    getStatusStyle(
      status
    );

  const rawDate =
    selectedEntry.date ||
    caseData.lastAnalysisDate ||
    fallbackDate;

  const date =
    formatDate(
      rawDate,
      getSingleParam(
        params.date
      ) ||
      "Date unavailable"
    );

  const parentEntryText =
    selectedEntry.content ||
    selectedEntry.description ||
    fallbackDescription;

  const analysisText =
    caseData.aiSummary ||
    selectedEntry.analysisResult ||
    selectedEntry.description ||
    fallbackDescription;

  const diagnosis =
    caseData.aiDiagnosis ||
    "No diagnosis is available.";

  const childProgress =
    caseData.childProgress ||
    "no enough data yet";

  const latestRecommendation =
    useMemo(() => {
      const recommendations =
        Array.isArray(
          caseData.doctorRecommendations
        )
          ? caseData.doctorRecommendations
          : [];

      return (
        recommendations[0] ||
        null
      );
    }, [
      caseData.doctorRecommendations,
    ]);

  const specialistNote =
    caseData.doctorRecommendation ||
    latestRecommendation?.note ||
    "";

  const reviewDate =
    latestRecommendation?.date ||
    caseData.lastAnalysisDate ||
    caseData.createdAt;

  const doctor =
    caseData.doctor ||
    null;

  const doctorName =
    doctor?.fullName ||
    "Assigned Specialist";

  const doctorRole =
    doctor?.specialization ||
    "Mental Health Specialist";

  const patterns =
    Array.isArray(
      caseData.recurringPatterns
    )
      ? caseData.recurringPatterns.filter(
          (
            item
          ) =>
            typeof item ===
              "string" &&
            item.trim()
        )
      : [];

  const entryCount =
    Number(
      caseData.entriesCount ||
      getSingleParam(
        params.entryCount
      ) ||
      0
    );

  const hasEnoughTrendInformation =
    entryCount > 1;

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
          caseId,
          emotion,
        },
      } as any
    );
  };

  const openChildProfile =
    () => {
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

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.centerState
        }
      >
        <ActivityIndicator
          size="large"
          color="#7BB8E8"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading activity details...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
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
            styles.container
          }
        >
          <ScrollView
            ref={
              scrollViewRef
            }
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.scrollContent
            }
            refreshControl={
              <RefreshControl
                refreshing={
                  refreshing
                }
                onRefresh={() =>
                  void loadDetails(
                    "refresh"
                  )
                }
                tintColor="#7BB8E8"
              />
            }
          >
            <View
              style={
                styles.header
              }
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
                    void loadDetails(
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

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={
                openChildProfile
              }
              disabled={
                !childId
              }
              style={
                styles.childCard
              }
            >
              <View
                style={
                  styles.avatar
                }
              >
                <Ionicons
                  name="happy-outline"
                  size={23}
                  color="#FFFFFF"
                />
              </View>

              <View
                style={
                  styles.childInfo
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

            <Text
              style={
                styles.sectionTitle
              }
            >
              Activity Information
            </Text>

            <View
              style={
                styles.card
              }
            >
              <InfoRow
                label="Entry Type"
                value={type}
              />

              <View
                style={
                  styles.divider
                }
              />

              <View
                style={
                  styles.infoRow
                }
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
                style={
                  styles.divider
                }
              />

              <InfoRow
                label="Analysis Date"
                value={date}
              />

              <View
                style={
                  styles.divider
                }
              />

              <InfoRow
                label="Confidence"
                value={`${confidence}%`}
              />
            </View>

            <Text
              style={
                styles.sectionTitle
              }
            >
              Parent Entry
            </Text>

            <View
              style={
                styles.card
              }
            >
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
                {parentEntryText}
              </Text>
            </View>

            <View
              onLayout={(
                event
              ) => {
                setAnalysisSectionY(
                  event.nativeEvent
                    .layout.y
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
                      Emotional Analysis Summary
                    </Text>

                    <Text
                      style={
                        styles.analysisSubtitle
                      }
                    >
                      Generated from the submitted entry
                    </Text>
                  </View>
                </View>

                <Text
                  style={
                    styles.analysisText
                  }
                >
                  {analysisText}
                </Text>

                <Text
                  style={
                    styles.diagnosisText
                  }
                >
                  {diagnosis}
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
                    {
                      getEmotionalLevel(
                        confidence
                      )
                    }
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
                      ? childProgress
                      : "Not enough information"}
                  </Text>
                </View>
              </View>
            </View>

            <Text
              style={
                styles.sectionTitle
              }
            >
              AI Observations
            </Text>

            <View
              style={
                styles.card
              }
            >
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
                    Patterns detected by AI
                  </Text>

                  <Text
                    style={
                      styles.recommendationsSourceSubtitle
                    }
                  >
                    Saved observations associated with this case
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.recommendationsDivider
                }
              />

              {patterns.length >
              0 ? (
                patterns.map(
                  (
                    pattern,
                    index
                  ) => (
                    <View
                      key={`${pattern}-${index}`}
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
                          {index + 1}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.recommendationText
                        }
                      >
                        {pattern}
                      </Text>
                    </View>
                  )
                )
              ) : (
                <Text
                  style={
                    styles.noDataText
                  }
                >
                  No AI observations were saved for this case.
                </Text>
              )}

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
                  AI observations do not replace professional medical or psychological advice.
                </Text>
              </View>
            </View>

            <View
              onLayout={(
                event
              ) => {
                setDoctorResponseSectionY(
                  event.nativeEvent
                    .layout.y
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

              {!specialistNote &&
              status ===
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
                      Waiting for specialist review
                    </Text>

                    <Text
                      style={
                        styles.reviewDescription
                      }
                    >
                      A specialist has not reviewed this analysis yet. You will receive an update when the review is completed.
                    </Text>
                  </View>
                </View>
              ) : (
                <View
                  style={
                    styles.card
                  }
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
                        {doctorName}
                      </Text>

                      <Text
                        style={
                          styles.doctorRole
                        }
                      >
                        {doctorRole}
                      </Text>
                    </View>

                    {doctor?.isVerified ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#4CAF70"
                      />
                    ) : null}
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
                      {specialistNote ||
                        "The specialist reviewed this case without adding a written recommendation."}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.reviewDate
                    }
                  >
                    {reviewDate
                      ? `Reviewed on ${formatDate(
                          reviewDate
                        )}`
                      : "Review date unavailable"}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={
                openAIChat
              }
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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.infoRow
      }
    >
      <Text
        style={
          styles.infoLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.infoValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  loadingText: {
    marginTop: 11,
    fontSize: 10,
    color: "#858B92",
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
    justifyContent: "space-between",
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
  },

  infoRow: {
    minHeight: 39,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  infoLabel: {
    fontSize: 9.5,
    color: "#7A8086",
  },

  infoValue: {
    maxWidth: "62%",
    fontSize: 9.5,
    fontWeight: "600",
    color: "#292D31",
    textAlign: "right",
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

  diagnosisText: {
    marginTop: 8,
    fontSize: 9,
    lineHeight: 14,
    color: "#7A6264",
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
    justifyContent: "space-between",
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
    maxWidth: "62%",
    fontSize: 9,
    fontWeight: "600",
    color: "#45A75A",
    textAlign: "right",
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

  noDataText: {
    marginBottom: 12,
    fontSize: 9.5,
    lineHeight: 14,
    color: "#858B92",
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
