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

type CaseStatus =
  | "pending"
  | "reviewed"
  | "closed"
  | "improving"
  | string;

type FilterType =
  | "All Cases"
  | "Pending"
  | "Reviewed"
  | "Closed"
  | "Improving";

type PopulatedChild = {
  _id?: string;
  id?: string;
  name?: string;
  age?: number;
  gender?: string;
};

type DoctorRecommendation = {
  _id?: string;
  note?: string;
  text?: string;
  date?: string;
  createdAt?: string;
};

type BackendHistoryCase = {
  _id: string;

  childId?:
    | string
    | PopulatedChild
    | null;

  dominantEmotion?: string;
  aiDiagnosis?: string;
  aiSummary?: string;
  status?: CaseStatus;
  priority?: string;

  lastAnalysisDate?: string | null;
  updatedAt?: string;
  createdAt?: string;

  doctorRecommendation?: string;
  doctorRecommendations?: DoctorRecommendation[];
};

type HistoryStats = {
  totalCases?: number;
  pending?: number;
  reviewed?: number;
  closed?: number;
  improving?: number;
  avgTimeMinutes?: number;
};

type HistoryCase = {
  caseId: string;
  name: string;
  childId: string;
  date: string;
  rawDate: string;
  emotion: string;
  description: string;
  status: FilterType;
  avatar: number;
};

type Recommendation = {
  id: string;
  caseId: string;
  childName: string;
  childId: string;
  date: string;
  rawDate: string;
  description: string;
};

type BottomNavItemProps = {
  icon: IoniconName;
  activeIcon: IoniconName;
  label: string;
  active?: boolean;
  onPress: () => void;
};

const filters: FilterType[] = [
  "All Cases",
  "Pending",
  "Reviewed",
  "Closed",
  "Improving",
];

const getChildData = (
  childId:
    | BackendHistoryCase["childId"]
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
    | BackendHistoryCase["childId"]
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

const normalizeStatus = (
  status?: string
): FilterType => {
  switch (
    String(status || "")
      .trim()
      .toLowerCase()
  ) {
    case "reviewed":
      return "Reviewed";

    case "closed":
      return "Closed";

    case "improving":
      return "Improving";

    case "pending":
    default:
      return "Pending";
  }
};

const formatDate = (
  value?: string | null
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
      "History could not be loaded."
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
    "History could not be loaded."
  );
};

const mapHistoryCase = (
  item: BackendHistoryCase
): HistoryCase => {
  const child =
    getChildData(
      item.childId
    );

  const childId =
    getChildId(
      item.childId
    );

  const rawDate =
    item.lastAnalysisDate ||
    item.updatedAt ||
    item.createdAt ||
    "";

  return {
    caseId:
      item._id,

    name:
      child.name ||
      "Unknown child",

    childId,

    date:
      formatDate(
        rawDate
      ),

    rawDate,

    emotion:
      item.dominantEmotion ||
      item.aiDiagnosis ||
      "General Analysis",

    description:
      item.aiSummary ||
      item.aiDiagnosis ||
      "No AI summary is available for this case.",

    status:
      normalizeStatus(
        item.status
      ),

    avatar:
      getAvatar(
        child.gender
      ),
  };
};

const extractRecommendations = (
  cases:
    BackendHistoryCase[]
): Recommendation[] => {
  const result: Recommendation[] =
    [];

  cases.forEach(
    (
      caseItem
    ) => {
      const child =
        getChildData(
          caseItem.childId
        );

      const childId =
        getChildId(
          caseItem.childId
        );

      const childName =
        child.name ||
        "Unknown child";

      const savedItems =
        Array.isArray(
          caseItem.doctorRecommendations
        )
          ? caseItem.doctorRecommendations
          : [];

      savedItems.forEach(
        (
          recommendation,
          index
        ) => {
          const text =
            recommendation.note ||
            recommendation.text ||
            "";

          if (!text.trim()) {
            return;
          }

          const rawDate =
            recommendation.date ||
            recommendation.createdAt ||
            caseItem.updatedAt ||
            caseItem.createdAt ||
            "";

          result.push({
            id:
              recommendation._id ||
              `${caseItem._id}-${rawDate}-${index}`,

            caseId:
              caseItem._id,

            childName,
            childId,

            date:
              formatDate(
                rawDate
              ),

            rawDate,

            description:
              text,
          });
        }
      );

      if (
        savedItems.length === 0 &&
        caseItem.doctorRecommendation
          ?.trim()
      ) {
        const rawDate =
          caseItem.updatedAt ||
          caseItem.createdAt ||
          "";

        result.push({
          id:
            `${caseItem._id}-latest`,

          caseId:
            caseItem._id,

          childName,
          childId,

          date:
            formatDate(
              rawDate
            ),

          rawDate,

          description:
            caseItem.doctorRecommendation,
        });
      }
    }
  );

  return result.sort(
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
};

export default function DoctorHistoryScreen() {
  const [
    searchText,
    setSearchText,
  ] =
    useState("");

  const [
    selectedFilter,
    setSelectedFilter,
  ] =
    useState<FilterType>(
      "All Cases"
    );

  const [
    backendCases,
    setBackendCases,
  ] =
    useState<
      BackendHistoryCase[]
    >([]);

  const [
    stats,
    setStats,
  ] =
    useState<HistoryStats>(
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

  const loadHistory =
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
            historyResponse,
            statsResponse,
          ] =
            await Promise.all([
              API.get<
                BackendHistoryCase[]
              >(
                "/doctor/history"
              ),

              API.get<HistoryStats>(
                "/doctor/history-stats"
              ),
            ]);

          setBackendCases(
            Array.isArray(
              historyResponse.data
            )
              ? historyResponse.data
              : []
          );

          setStats(
            statsResponse.data ||
            {}
          );
        } catch (error) {
          console.log(
            "LOAD DOCTOR HISTORY ERROR:",
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
      void loadHistory(
        "initial"
      );
    }, [loadHistory])
  );

  const historyCases =
    useMemo(
      () =>
        backendCases
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
            mapHistoryCase
          ),
      [backendCases]
    );

  const recommendations =
    useMemo(
      () =>
        extractRecommendations(
          backendCases
        ),
      [backendCases]
    );

  const filteredCases =
    useMemo(() => {
      const cleanSearch =
        searchText
          .trim()
          .toLowerCase();

      return historyCases.filter(
        (
          item
        ) => {
          const matchesFilter =
            selectedFilter ===
              "All Cases" ||
            item.status ===
              selectedFilter;

          const matchesSearch =
            !cleanSearch ||
            item.name
              .toLowerCase()
              .includes(
                cleanSearch
              ) ||
            item.childId
              .toLowerCase()
              .includes(
                cleanSearch
              ) ||
            item.emotion
              .toLowerCase()
              .includes(
                cleanSearch
              ) ||
            item.description
              .toLowerCase()
              .includes(
                cleanSearch
              );

          return (
            matchesFilter &&
            matchesSearch
          );
        }
      );
    }, [
      historyCases,
      searchText,
      selectedFilter,
    ]);

  const handleOpenCase = (
    item: HistoryCase
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

  const handleOpenRecommendation =
    (
      item: Recommendation
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

  const handleViewAllRecommendations =
    () => {
      router.push(
        "/doctor/recommendations-history" as Href
      );
    };

  const openHome = () => {
    router.replace(
      "/doctor/home" as Href
    );
  };

  const openInsights = () => {
    router.replace(
      "/doctor/insights" as Href
    );
  };

  const openProfile = () => {
    router.replace(
      "/doctor/profile" as Href
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
                Loading history...
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
              keyboardShouldPersistTaps="handled"
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
              <View
                style={
                  styles.titleRow
                }
              >
                <Text
                  style={
                    styles.pageTitle
                  }
                >
                  History
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={
                    styles.refreshButton
                  }
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
                    color="#24282C"
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
                  styles.searchContainer
                }
              >
                <Ionicons
                  name="search-outline"
                  size={19}
                  color="#A1A7AE"
                />

                <TextInput
                  value={searchText}
                  onChangeText={
                    setSearchText
                  }
                  placeholder="Search child name, ID, emotion..."
                  placeholderTextColor="#A8ADB3"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={
                    styles.searchInput
                  }
                />

                {searchText.length >
                0 ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      setSearchText(
                        ""
                      )
                    }
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
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
                  styles.filtersContainer
                }
              >
                {filters.map(
                  (
                    filter
                  ) => {
                    const isSelected =
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

                          isSelected &&
                            styles.filterButtonSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterText,

                            isSelected &&
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

              <Text
                style={
                  styles.sectionTitle
                }
              >
                History Overview
              </Text>

              <View
                style={
                  styles.overviewGrid
                }
              >
                <OverviewCard
                  title="TOTAL CASES"
                  value={String(
                    stats.totalCases ??
                    historyCases.length
                  )}
                  valueColor="#2E8ED7"
                />

                <OverviewCard
                  title="PENDING"
                  value={String(
                    stats.pending ??
                    0
                  )}
                  valueColor="#14A84B"
                  trend
                />

                <OverviewCard
                  title="CLOSED"
                  value={String(
                    stats.closed ??
                    0
                  )}
                  valueColor="#2E8ED7"
                />

                <OverviewCard
                  title="AVG TIME"
                  value={String(
                    stats.avgTimeMinutes ??
                    0
                  )}
                  suffix="min"
                  valueColor="#25292D"
                />
              </View>

              <View
                style={
                  styles.sectionHeaderRow
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Detailed Timeline
                </Text>

                <Text
                  style={
                    styles.resultsCount
                  }
                >
                  {
                    filteredCases.length
                  }{" "}
                  results
                </Text>
              </View>

              {filteredCases.length >
              0 ? (
                <View
                  style={
                    styles.timelineContainer
                  }
                >
                  <View
                    style={
                      styles.timelineLine
                    }
                  />

                  {filteredCases.map(
                    (
                      item,
                      index
                    ) => (
                      <TimelineCaseCard
                        key={
                          item.caseId
                        }
                        item={
                          item
                        }
                        index={
                          index
                        }
                        onPress={() =>
                          handleOpenCase(
                            item
                          )
                        }
                      />
                    )
                  )}
                </View>
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
                      name="folder-open-outline"
                      size={34}
                      color="#75AFE1"
                    />
                  </View>

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    No cases found
                  </Text>

                  <Text
                    style={
                      styles.emptyDescription
                    }
                  >
                    {historyCases.length ===
                    0
                      ? "No case history is available for this doctor yet."
                      : "Try changing the search text or the selected filter."}
                  </Text>
                </View>
              )}

              <View
                style={
                  styles.recommendationsHeader
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Recent Recommendations
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={
                    handleViewAllRecommendations
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
                    color="#F1A4A8"
                  />
                </TouchableOpacity>
              </View>

              {recommendations.length >
              0 ? (
                <View
                  style={
                    styles.recommendationsContainer
                  }
                >
                  {recommendations
                    .slice(0, 3)
                    .map(
                      (
                        item
                      ) => (
                        <RecommendationCard
                          key={
                            item.id
                          }
                          item={
                            item
                          }
                          onPress={() =>
                            handleOpenRecommendation(
                              item
                            )
                          }
                        />
                      )
                    )}
                </View>
              ) : (
                <Text
                  style={
                    styles.noRecommendationsText
                  }
                >
                  No doctor recommendations have been saved yet.
                </Text>
              )}
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
              onPress={openHome}
            />

            <BottomNavItem
              icon="document-text-outline"
              activeIcon="document-text"
              label="History"
              active
              onPress={() =>
                undefined
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

function OverviewCard({
  title,
  value,
  suffix,
  valueColor,
  trend = false,
}: {
  title: string;
  value: string;
  suffix?: string;
  valueColor: string;
  trend?: boolean;
}) {
  return (
    <View
      style={
        styles.overviewCard
      }
    >
      <Text
        style={
          styles.overviewCardTitle
        }
      >
        {title}
      </Text>

      <View
        style={
          styles.overviewValueRow
        }
      >
        <Text
          style={[
            styles.overviewValue,

            {
              color:
                valueColor,
            },
          ]}
        >
          {value}
        </Text>

        {trend ? (
          <Ionicons
            name="trending-down-outline"
            size={15}
            color="#EA6A70"
          />
        ) : null}

        {suffix ? (
          <Text
            style={
              styles.overviewSuffix
            }
          >
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function TimelineCaseCard({
  item,
  index,
  onPress,
}: {
  item: HistoryCase;
  index: number;
  onPress: () => void;
}) {
  const statusStyle =
    getStatusStyle(
      item.status
    );

  const markerColor =
    item.status === "Pending"
      ? "#F9C5C9"
      : item.status ===
          "Reviewed"
        ? "#B8DCF8"
        : item.status ===
            "Improving"
          ? "#B9E5CF"
          : "#C7CBD1";

  const buttonColors: readonly [
    string,
    string,
  ] =
    item.status === "Closed"
      ? [
          "#E8EAEC",
          "#D9DBDE",
        ]
      : [
          "#A6D2F6",
          "#F5ADB1",
        ];

  const buttonText =
    item.status === "Pending"
      ? "Review Case"
      : "View Case";

  return (
    <View
      style={
        styles.timelineItem
      }
    >
      <View
        style={[
          styles.timelineMarker,

          {
            backgroundColor:
              markerColor,
          },
        ]}
      />

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
              styles.childInfo
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
                  styles.caseDate
                }
              >
                {item.date}
              </Text>
            </View>
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
              {
                statusStyle.label
              }
            </Text>
          </View>
        </View>

        <Text
          style={
            styles.emotionText
          }
        >
          {item.emotion}
        </Text>

        <Text
          style={
            styles.caseDescription
          }
          numberOfLines={3}
        >
          {item.description}
        </Text>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          style={
            styles.viewCaseButtonWrapper
          }
        >
          <LinearGradient
            colors={
              buttonColors
            }
            start={{
              x: 0,
              y: 0.5,
            }}
            end={{
              x: 1,
              y: 0.5,
            }}
            style={
              styles.viewCaseButton
            }
          >
            <Text
              style={[
                styles.viewCaseButtonText,

                item.status ===
                  "Closed" &&
                  styles.closedButtonText,
              ]}
            >
              {buttonText}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RecommendationCard({
  item,
  onPress,
}: {
  item: Recommendation;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={
        styles.recommendationCard
      }
    >
      <View
        style={
          styles.recommendationIcon
        }
      >
        <Ionicons
          name="bulb-outline"
          size={20}
          color="#F0525B"
        />
      </View>

      <View
        style={
          styles.recommendationContent
        }
      >
        <View
          style={
            styles.recommendationTopRow
          }
        >
          <View
            style={
              styles.recommendationChildInfo
            }
          >
            <Text
              style={
                styles.recommendationChildName
              }
            >
              {
                item.childName
              }
            </Text>

            <Text
              style={
                styles.recommendationChildId
              }
            >
              Child ID{" "}
              {item.childId
                ? `#${item.childId.slice(
                    -6
                  )}`
                : "unavailable"}
            </Text>
          </View>

          <Text
            style={
              styles.recommendationDate
            }
          >
            {item.date}
          </Text>
        </View>

        <Text
          style={
            styles.recommendationText
          }
          numberOfLines={4}
        >
          “{item.description}”
        </Text>
      </View>
    </TouchableOpacity>
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

function getStatusStyle(
  status: FilterType
) {
  if (
    status === "Reviewed"
  ) {
    return {
      label:
        "Reviewed",
      backgroundColor:
        "#DDF8E2",
      textColor:
        "#45B65D",
    };
  }

  if (
    status === "Closed"
  ) {
    return {
      label:
        "Closed",
      backgroundColor:
        "#ECEFF2",
      textColor:
        "#8C939A",
    };
  }

  if (
    status === "Improving"
  ) {
    return {
      label:
        "Improving",
      backgroundColor:
        "#E7F4FF",
      textColor:
        "#4C8DBF",
    };
  }

  return {
    label:
      "Pending Review",
    backgroundColor:
      "#FFF0DE",
    textColor:
      "#E59A42",
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

    mainContainer: {
      flex: 1,
    },

    loadingState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
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
      paddingTop: 16,
      paddingBottom: 95,
    },

    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18,
    },

    pageTitle: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "600",
      color: "#24282C",
    },

    refreshButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F5F6F7",
    },

    errorBanner: {
      marginBottom: 12,
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

    searchContainer: {
      height: 48,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F7FAFC",
      borderWidth: 1,
      borderColor: "#DCE5EB",
      borderRadius: 11,
      paddingHorizontal: 12,
      gap: 8,
      marginBottom: 13,
    },

    searchInput: {
      flex: 1,
      fontSize: 11,
      color: "#25292D",
    },

    filtersContainer: {
      gap: 7,
      paddingBottom: 18,
    },

    filterButton: {
      minWidth: 82,
      height: 34,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F2F0F5",
      borderRadius: 999,
      paddingHorizontal: 12,
    },

    filterButtonSelected: {
      backgroundColor: "#F5C1C5",
    },

    filterText: {
      fontSize: 8.5,
      color: "#5D6065",
    },

    filterTextSelected: {
      fontWeight: "600",
      color: "#6A5558",
    },

    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    sectionTitle: {
      fontSize: 13,
      fontWeight: "500",
      color: "#373B3F",
      marginBottom: 10,
    },

    resultsCount: {
      marginBottom: 10,
      fontSize: 8.5,
      color: "#999EA4",
    },

    overviewGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 9,
      marginBottom: 19,
    },

    overviewCard: {
      width: "48.5%",
      minHeight: 65,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E5EDF2",
      borderRadius: 10,
      paddingHorizontal: 11,
      paddingVertical: 9,
    },

    overviewCardTitle: {
      fontSize: 8,
      color: "#6C737A",
    },

    overviewValueRow: {
      marginTop: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    overviewValue: {
      fontSize: 16,
      fontWeight: "700",
    },

    overviewSuffix: {
      marginTop: 3,
      fontSize: 8,
      color: "#858B92",
    },

    timelineContainer: {
      position: "relative",
      paddingLeft: 27,
      gap: 13,
      marginBottom: 21,
    },

    timelineLine: {
      position: "absolute",
      left: 8,
      top: 5,
      bottom: 5,
      width: 1.5,
      backgroundColor: "#D5E7F5",
    },

    timelineItem: {
      position: "relative",
    },

    timelineMarker: {
      position: "absolute",
      left: -24,
      top: 12,
      width: 13,
      height: 13,
      borderRadius: 6.5,
      borderWidth: 2,
      borderColor: "#FFFFFF",
      zIndex: 3,
    },

    caseCard: {
      position: "relative",
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7E9EB",
      borderRadius: 19,
      paddingHorizontal: 11,
      paddingTop: 11,
      paddingBottom: 9,
      overflow: "hidden",
    },

    caseDecoration: {
      position: "absolute",
      width: 67,
      height: 67,
      borderRadius: 33.5,
      right: -18,
      top: -16,
      backgroundColor: "#FFF0F1",
    },

    caseHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },

    childInfo: {
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
      borderColor: "#EEDCD6",
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
      fontSize: 14,
      fontWeight: "700",
      color: "#24282C",
    },

    caseDate: {
      marginTop: 3,
      fontSize: 8.5,
      color: "#71777D",
    },

    statusBadge: {
      zIndex: 2,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginLeft: 8,
    },

    statusText: {
      fontSize: 7.5,
      fontWeight: "500",
    },

    emotionText: {
      marginTop: 8,
      fontSize: 9.5,
      color: "#70ACE2",
    },

    caseDescription: {
      marginTop: 5,
      fontSize: 9.5,
      lineHeight: 14,
      color: "#464B50",
    },

    viewCaseButtonWrapper: {
      marginTop: 9,
    },

    viewCaseButton: {
      height: 34,
      borderRadius: 999,
      justifyContent: "center",
      alignItems: "center",
    },

    viewCaseButtonText: {
      fontSize: 9.5,
      fontWeight: "600",
      color: "#292D31",
    },

    closedButtonText: {
      color: "#777D84",
    },

    emptyState: {
      alignItems: "center",
      paddingVertical: 45,
      paddingHorizontal: 30,
    },

    emptyIcon: {
      width: 68,
      height: 68,
      borderRadius: 34,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#EDF7FF",
      marginBottom: 13,
    },

    emptyTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: "#292D31",
    },

    emptyDescription: {
      marginTop: 7,
      fontSize: 10.5,
      lineHeight: 16,
      color: "#92979E",
      textAlign: "center",
    },

    recommendationsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    viewAllButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 5,
      paddingVertical: 4,
      marginBottom: 10,
    },

    viewAllText: {
      fontSize: 8,
      fontWeight: "600",
      color: "#F1A4A8",
    },

    recommendationsContainer: {
      gap: 10,
    },

    noRecommendationsText: {
      paddingVertical: 20,
      fontSize: 9.5,
      lineHeight: 15,
      color: "#92979E",
      textAlign: "center",
    },

    recommendationCard: {
      minHeight: 100,
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: "#F8F8F9",
      borderRadius: 14,
      paddingHorizontal: 11,
      paddingVertical: 12,
    },

    recommendationIcon: {
      width: 39,
      height: 39,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFE7E8",
      marginRight: 11,
    },

    recommendationContent: {
      flex: 1,
    },

    recommendationTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 10,
    },

    recommendationChildInfo: {
      flex: 1,
    },

    recommendationChildName: {
      fontSize: 10,
      fontWeight: "700",
      color: "#303438",
    },

    recommendationChildId: {
      marginTop: 3,
      fontSize: 7.5,
      color: "#8A9096",
    },

    recommendationDate: {
      fontSize: 8.5,
      fontWeight: "600",
      color: "#71777D",
      textAlign: "right",
    },

    recommendationText: {
      marginTop: 8,
      fontSize: 9,
      lineHeight: 14,
      color: "#60666C",
    },

    bottomNavigation: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 70,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
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
