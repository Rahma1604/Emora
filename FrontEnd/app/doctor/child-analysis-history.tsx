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
  TextInput,
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

type TimelineFilter =
  | "All"
  | "Pending"
  | "Reviewed"
  | "Closed";

type ChildInfo = {
  id?: string;
  _id?: string;
  name?: string;
  age?: number;
  gender?: string;
};

type RawTimelineItem = {
  _id?: string;
  analysisId?: string;
  emotion?: string;
  diagnosis?: string;
  confidence?: number;
  date?: string;
  createdAt?: string;
  status?: string;
  modality?: string;
  type?: string;
  content?: string;
  text?: string;
  summary?: string;
  description?: string;
};

type ChildOverviewResponse = {
  childInfo?: ChildInfo;
  latestCaseId?: string;
  currentStatus?: string;
  analysisTimeline?: RawTimelineItem[];
};

type AnalysisItem = {
  id: string;
  emotion: string;
  diagnosis: string;
  confidence: number | null;
  rawDate: string;
  formattedDate: string;
  status: TimelineFilter;
  modality: string;
  content: string;
  icon: IoniconName;
  iconColor: string;
  iconBackground: string;
};

const filters: TimelineFilter[] = [
  "All",
  "Pending",
  "Reviewed",
  "Closed",
];

const getParamValue = (
  value?: string | string[]
): string => {
  return Array.isArray(value)
    ? value[0] || ""
    : value || "";
};

const normalizePercentage = (
  value?: number
): number | null => {
  if (
    value === undefined ||
    value === null ||
    Number.isNaN(Number(value))
  ) {
    return null;
  }

  const numberValue =
    Number(value);

  const percentage =
    numberValue <= 1
      ? numberValue * 100
      : numberValue;

  return Math.max(
    0,
    Math.min(100, percentage)
  );
};

const normalizeStatus = (
  value?: string
): TimelineFilter => {
  switch (
    String(value || "")
      .trim()
      .toLowerCase()
  ) {
    case "reviewed":
      return "Reviewed";

    case "closed":
      return "Closed";

    case "pending":
    default:
      return "Pending";
  }
};

const formatDate = (
  value?: string
): string => {
  if (!value) {
    return "Date unavailable";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Date unavailable";
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
      icon: IoniconName;
      iconColor: string;
      iconBackground: string;
    }
  > = {
    happy: {
      label: "Happy",
      icon: "happy-outline",
      iconColor: "#178D7B",
      iconBackground: "#DCF3EC",
    },

    happiness: {
      label: "Happy",
      icon: "happy-outline",
      iconColor: "#178D7B",
      iconBackground: "#DCF3EC",
    },

    sad: {
      label: "Sad",
      icon: "rainy-outline",
      iconColor: "#4D81B4",
      iconBackground: "#E7F1FB",
    },

    sadness: {
      label: "Sad",
      icon: "rainy-outline",
      iconColor: "#4D81B4",
      iconBackground: "#E7F1FB",
    },

    angry: {
      label: "Angry",
      icon: "flame-outline",
      iconColor: "#D85A62",
      iconBackground: "#FFE7E8",
    },

    anger: {
      label: "Angry",
      icon: "flame-outline",
      iconColor: "#D85A62",
      iconBackground: "#FFE7E8",
    },

    fear: {
      label: "Fear",
      icon: "alert-circle-outline",
      iconColor: "#EF555D",
      iconBackground: "#FFE7E8",
    },

    anxiety: {
      label: "Anxiety",
      icon: "headset-outline",
      iconColor: "#EF555D",
      iconBackground: "#FFE7E8",
    },

    stress: {
      label: "Stress",
      icon: "warning-outline",
      iconColor: "#EF555D",
      iconBackground: "#FFE7E8",
    },

    surprise: {
      label: "Surprise",
      icon: "sparkles-outline",
      iconColor: "#D28C34",
      iconBackground: "#FFF4E5",
    },

    disgust: {
      label: "Disgust",
      icon: "leaf-outline",
      iconColor: "#568B4F",
      iconBackground: "#EAF5E7",
    },

    neutral: {
      label: "Neutral",
      icon: "remove-circle-outline",
      iconColor: "#66717C",
      iconBackground: "#EEF1F4",
    },

    calm: {
      label: "Calm",
      icon: "leaf-outline",
      iconColor: "#178D7B",
      iconBackground: "#DCF3EC",
    },

    unknown: {
      label: "Unknown",
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

const getErrorMessage = (
  error: unknown
): string => {
  if (
    !axios.isAxiosError(error)
  ) {
    return (
      "The analysis history could not be loaded."
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
    "The analysis history could not be loaded."
  );
};

export default function ChildAnalysisHistoryScreen() {
  const params =
    useLocalSearchParams<{
      childId?:
        | string
        | string[];
      caseId?:
        | string
        | string[];
      focusEmotion?:
        | string
        | string[];
      focusDate?:
        | string
        | string[];
    }>();

  const childId =
    getParamValue(
      params.childId
    );

  const caseId =
    getParamValue(
      params.caseId
    );

  const focusEmotion =
    getParamValue(
      params.focusEmotion
    );

  const focusDate =
    getParamValue(
      params.focusDate
    );

  const [
    overview,
    setOverview,
  ] =
    useState<ChildOverviewResponse | null>(
      null
    );

  const [
    selectedFilter,
    setSelectedFilter,
  ] =
    useState<TimelineFilter>(
      "All"
    );

  const [
    searchText,
    setSearchText,
  ] =
    useState("");

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

  const loadHistory =
    useCallback(
      async (
        mode:
          | "initial"
          | "refresh" =
          "initial"
      ) => {
        if (!childId) {
          setScreenError(
            "Child ID is missing. Open this page from Child Overview."
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
              `/doctor/child-overview/${childId}`
            );

          setOverview(
            response.data
          );
        } catch (error) {
          console.log(
            "LOAD CHILD ANALYSIS HISTORY ERROR:",
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
        childId,
        handleExpiredSession,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      void loadHistory(
        "initial"
      );
    }, [loadHistory])
  );

  const childInfo =
    overview?.childInfo ||
    {};

  const latestCaseId =
    overview?.latestCaseId ||
    caseId;

  const analysisItems =
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

              const content =
                item.content ||
                item.text ||
                item.summary ||
                item.description ||
                item.diagnosis ||
                "No detailed analysis text is available.";

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
                  normalizePercentage(
                    item.confidence
                  ),

                rawDate,

                formattedDate:
                  formatDate(
                    rawDate
                  ),

                status:
                  normalizeStatus(
                    item.status ||
                    overview?.currentStatus
                  ),

                modality:
                  item.modality ||
                  item.type ||
                  "Analysis",

                content,

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

  const filteredItems =
    useMemo(() => {
      const normalizedSearch =
        searchText
          .trim()
          .toLowerCase();

      return analysisItems.filter(
        (
          item
        ) => {
          const matchesFilter =
            selectedFilter ===
              "All" ||
            item.status ===
              selectedFilter;

          const matchesSearch =
            !normalizedSearch ||
            item.emotion
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            item.diagnosis
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            item.modality
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            item.content
              .toLowerCase()
              .includes(
                normalizedSearch
              );

          return (
            matchesFilter &&
            matchesSearch
          );
        }
      );
    }, [
      analysisItems,
      searchText,
      selectedFilter,
    ]);

  const focusedItemId =
    useMemo(() => {
      if (
        !focusEmotion &&
        !focusDate
      ) {
        return "";
      }

      const normalizedEmotion =
        focusEmotion
          .trim()
          .toLowerCase();

      const normalizedDate =
        focusDate
          .trim()
          .toLowerCase();

      return (
        analysisItems.find(
          (
            item
          ) => {
            const emotionMatches =
              !normalizedEmotion ||
              item.emotion
                .toLowerCase() ===
                normalizedEmotion;

            const dateMatches =
              !normalizedDate ||
              item.rawDate
                .trim()
                .toLowerCase() ===
                normalizedDate ||
              item.formattedDate
                .trim()
                .toLowerCase() ===
                normalizedDate;

            return (
              emotionMatches &&
              dateMatches
            );
          }
        )?.id ||
        ""
      );
    }, [
      analysisItems,
      focusEmotion,
      focusDate,
    ]);

  const handleOpenCase =
    () => {
      if (
        !latestCaseId
      ) {
        return;
      }

      router.push(
        {
          pathname:
            "/doctor/review-case",

          params: {
            caseId:
              latestCaseId,
            childId,
          },
        } as Href
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
          Loading analysis history...
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
        <View
          style={
            styles.container
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
              Analysis History
            </Text>

            <TouchableOpacity
              style={
                styles.refreshButton
              }
              activeOpacity={0.7}
              onPress={() =>
                void loadHistory(
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

          {overview ? (
            <View
              style={
                styles.childCard
              }
            >
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
                  {
                    childInfo.name ||
                    "Unknown child"
                  }
                </Text>

                <Text
                  style={
                    styles.childMeta
                  }
                >
                  Child ID{" "}
                  {childId
                    ? `#${childId.slice(
                        -6
                      )}`
                    : "unavailable"}
                  {typeof childInfo.age ===
                  "number"
                    ? ` · ${childInfo.age} years old`
                    : ""}
                </Text>
              </View>

              <View
                style={
                  styles.totalBadge
                }
              >
                <Text
                  style={
                    styles.totalValue
                  }
                >
                  {
                    analysisItems.length
                  }
                </Text>

                <Text
                  style={
                    styles.totalLabel
                  }
                >
                  Analyses
                </Text>
              </View>
            </View>
          ) : null}

          <View
            style={
              styles.searchContainer
            }
          >
            <Ionicons
              name="search-outline"
              size={20}
              color="#969CA3"
            />

            <TextInput
              value={searchText}
              onChangeText={
                setSearchText
              }
              placeholder="Search emotion, diagnosis or analysis"
              placeholderTextColor="#A1A6AC"
              autoCorrect={false}
              style={
                styles.searchInput
              }
            />

            {searchText ? (
              <TouchableOpacity
                onPress={() =>
                  setSearchText(
                    ""
                  )
                }
              >
                <Ionicons
                  name="close-circle"
                  size={19}
                  color="#B4B8BD"
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.filtersRow
            }
          >
            {filters.map(
              (
                filter
              ) => {
                const selected =
                  selectedFilter ===
                  filter;

                return (
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

                      selected &&
                        styles.filterButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,

                        selected &&
                          styles.filterTextSelected,
                      ]}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </ScrollView>

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
                  void loadHistory(
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
              styles.resultHeader
            }
          >
            <Text
              style={
                styles.resultTitle
              }
            >
              Timeline
            </Text>

            <Text
              style={
                styles.resultCount
              }
            >
              {
                filteredItems.length
              }{" "}
              results
            </Text>
          </View>

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
                  void loadHistory(
                    "refresh"
                  )
                }
                tintColor="#6799C2"
              />
            }
          >
            {filteredItems.length >
            0 ? (
              filteredItems.map(
                (
                  item
                ) => (
                  <AnalysisCard
                    key={
                      item.id
                    }
                    item={item}
                    focused={
                      item.id ===
                      focusedItemId
                    }
                  />
                )
              )
            ) : (
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
                    name="analytics-outline"
                    size={34}
                    color="#78ACD5"
                  />
                </View>

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No analyses found
                </Text>

                <Text
                  style={
                    styles.emptyDescription
                  }
                >
                  {analysisItems.length ===
                  0
                    ? "No analysis timeline has been saved for this child yet."
                    : "Try changing the search text or selected filter."}
                </Text>
              </View>
            )}

            {latestCaseId ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={
                  handleOpenCase
                }
                style={
                  styles.openCaseWrapper
                }
              >
                <LinearGradient
                  colors={[
                    "#A5D2F7",
                    "#F6ADB1",
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
                    styles.openCaseButton
                  }
                >
                  <Text
                    style={
                      styles.openCaseText
                    }
                  >
                    Open Current Case
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color="#292D31"
                  />
                </LinearGradient>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

function AnalysisCard({
  item,
  focused,
}: {
  item: AnalysisItem;
  focused: boolean;
}) {
  const statusStyle =
    getStatusStyle(
      item.status
    );

  return (
    <View
      style={[
        styles.analysisCard,

        focused &&
          styles.focusedAnalysisCard,
      ]}
    >
      {focused ? (
        <View
          style={
            styles.focusedBadge
          }
        >
          <Ionicons
            name="locate-outline"
            size={12}
            color="#3976A4"
          />

          <Text
            style={
              styles.focusedBadgeText
            }
          >
            Selected Analysis
          </Text>
        </View>
      ) : null}

      <View
        style={
          styles.analysisTopRow
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
            size={21}
            color={
              item.iconColor
            }
          />
        </View>

        <View
          style={
            styles.analysisHeading
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
            {item.formattedDate}
            {item.modality
              ? ` · ${item.modality}`
              : ""}
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
                  statusStyle.textColor,
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      {item.confidence !==
      null ? (
        <View
          style={
            styles.confidenceContainer
          }
        >
          <View
            style={
              styles.confidenceTopRow
            }
          >
            <Text
              style={
                styles.confidenceLabel
              }
            >
              AI confidence
            </Text>

            <Text
              style={
                styles.confidenceValue
              }
            >
              {item.confidence.toFixed(
                0
              )}
              %
            </Text>
          </View>

          <View
            style={
              styles.confidenceTrack
            }
          >
            <View
              style={[
                styles.confidenceFill,

                {
                  width:
                    `${Math.max(
                      2,
                      item.confidence
                    )}%`,
                },
              ]}
            />
          </View>
        </View>
      ) : null}

      {item.diagnosis ? (
        <View
          style={
            styles.diagnosisBox
          }
        >
          <Ionicons
            name="sparkles-outline"
            size={16}
            color="#D2942F"
          />

          <Text
            style={
              styles.diagnosisText
            }
          >
            {item.diagnosis}
          </Text>
        </View>
      ) : null}

      <Text
        style={
          styles.analysisContent
        }
      >
        {item.content}
      </Text>
    </View>
  );
}

function getStatusStyle(
  status: TimelineFilter
) {
  if (
    status === "Reviewed"
  ) {
    return {
      backgroundColor:
        "#DDF8E2",
      textColor:
        "#46B65D",
    };
  }

  if (
    status === "Closed"
  ) {
    return {
      backgroundColor:
        "#E9ECEF",
      textColor:
        "#858C94",
    };
  }

  return {
    backgroundColor:
      "#FFF0DE",
    textColor:
      "#E79B42",
  };
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

    container: {
      flex: 1,
      paddingHorizontal: 18,
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

    header: {
      height: 55,
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

    childCard: {
      minHeight: 76,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#F0DFE2",
      borderRadius: 18,
      paddingHorizontal: 12,
      marginBottom: 12,
    },

    avatarWrapper: {
      width: 48,
      height: 48,
      borderRadius: 24,
      overflow: "hidden",
      backgroundColor: "#FFF1EC",
      borderWidth: 1,
      borderColor: "#EEDDD7",
      marginRight: 10,
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
      color: "#25292D",
    },

    childMeta: {
      marginTop: 4,
      fontSize: 8.5,
      color: "#7A8087",
    },

    totalBadge: {
      minWidth: 58,
      height: 50,
      borderRadius: 13,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#EAF5FD",
      paddingHorizontal: 8,
    },

    totalValue: {
      fontSize: 15,
      fontWeight: "800",
      color: "#3976A4",
    },

    totalLabel: {
      marginTop: 2,
      fontSize: 7.5,
      color: "#6B8498",
    },

    searchContainer: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F4F4F6",
      borderRadius: 13,
      paddingHorizontal: 13,
      gap: 9,
      marginBottom: 11,
    },

    searchInput: {
      flex: 1,
      fontSize: 11,
      color: "#25292D",
    },

    filtersRow: {
      gap: 7,
      paddingBottom: 13,
    },

    filterButton: {
      minWidth: 82,
      height: 34,
      borderRadius: 999,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F1F2F4",
      paddingHorizontal: 12,
    },

    filterButtonSelected: {
      backgroundColor: "#F9C7CA",
    },

    filterText: {
      fontSize: 9.5,
      color: "#777D84",
    },

    filterTextSelected: {
      color: "#B85359",
      fontWeight: "600",
    },

    errorBanner: {
      marginBottom: 10,
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

    resultHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 9,
    },

    resultTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: "#292D31",
    },

    resultCount: {
      fontSize: 9.5,
      color: "#989DA3",
    },

    scrollView: {
      flex: 1,
    },

    scrollContent: {
      paddingBottom: 28,
      gap: 11,
    },

    analysisCard: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7E8EA",
      borderRadius: 17,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },

    focusedAnalysisCard: {
      borderColor: "#7FB8E4",
      borderWidth: 1.5,
      backgroundColor: "#FBFDFF",
    },

    focusedBadge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#EAF5FD",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 5,
      marginBottom: 10,
    },

    focusedBadgeText: {
      fontSize: 8,
      fontWeight: "700",
      color: "#3976A4",
    },

    analysisTopRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    analysisIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },

    analysisHeading: {
      flex: 1,
    },

    analysisEmotion: {
      fontSize: 13,
      fontWeight: "700",
      color: "#2B3034",
    },

    analysisDate: {
      marginTop: 4,
      fontSize: 8.5,
      color: "#90959B",
      textTransform: "capitalize",
    },

    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 5,
      marginLeft: 8,
    },

    statusText: {
      fontSize: 8,
      fontWeight: "600",
    },

    confidenceContainer: {
      marginTop: 12,
    },

    confidenceTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },

    confidenceLabel: {
      fontSize: 8.5,
      color: "#747B82",
    },

    confidenceValue: {
      fontSize: 8.5,
      fontWeight: "700",
      color: "#3976A4",
    },

    confidenceTrack: {
      height: 6,
      borderRadius: 999,
      backgroundColor: "#EBEEF1",
      overflow: "hidden",
    },

    confidenceFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: "#8DC0F0",
    },

    diagnosisBox: {
      marginTop: 12,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 7,
      backgroundColor: "#FFF8E9",
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 9,
    },

    diagnosisText: {
      flex: 1,
      fontSize: 9,
      lineHeight: 14,
      color: "#7A6338",
    },

    analysisContent: {
      marginTop: 11,
      fontSize: 9.5,
      lineHeight: 15,
      color: "#50555B",
    },

    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 70,
      paddingHorizontal: 30,
    },

    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#EDF7FF",
      marginBottom: 14,
    },

    emptyTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: "#292D31",
    },

    emptyDescription: {
      marginTop: 7,
      fontSize: 10,
      lineHeight: 16,
      color: "#8F959C",
      textAlign: "center",
    },

    openCaseWrapper: {
      marginTop: 4,
    },

    openCaseButton: {
      height: 46,
      borderRadius: 999,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    openCaseText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#292D31",
    },
  });
