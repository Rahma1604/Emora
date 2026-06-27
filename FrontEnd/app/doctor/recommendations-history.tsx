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

type RecommendationStatus =
  | "active"
  | "completed";

type RecommendationFilter =
  | "all"
  | RecommendationStatus;

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

type BackendCase = {
  _id: string;

  childId?:
    | string
    | PopulatedChild
    | null;

  dominantEmotion?: string;
  aiDiagnosis?: string;
  aiSummary?: string;
  status?: string;
  priority?: string;

  doctorRecommendation?: string;
  doctorRecommendations?: DoctorRecommendation[];

  recurringPatterns?: string[];

  createdAt?: string;
  updatedAt?: string;
};

type RecommendationItem = {
  id: string;
  caseId: string;

  childName: string;
  childId: string;
  age: number | null;
  avatar: number;

  date: string;
  timestamp: number;

  caseEmotion: string;
  recommendation: string;

  status: RecommendationStatus;

  relatedIndicators: string[];
};

const filterOptions: {
  label: string;
  value: RecommendationFilter;
}[] = [
  {
    label: "All",
    value: "all",
  },
  {
    label: "Active",
    value: "active",
  },
  {
    label: "Completed",
    value: "completed",
  },
];

const getChildData = (
  childId: BackendCase["childId"]
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
  childId: BackendCase["childId"]
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

const formatDate = (
  value?: string
): string => {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

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

const getTimestamp = (
  value?: string
): number => {
  if (!value) {
    return 0;
  }

  const timestamp =
    new Date(value).getTime();

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
};

const getRecommendationStatus = (
  caseStatus?: string
): RecommendationStatus => {
  return String(caseStatus || "")
    .trim()
    .toLowerCase() === "closed"
    ? "completed"
    : "active";
};

const getErrorMessage = (
  error: unknown
): string => {
  if (
    !axios.isAxiosError(error)
  ) {
    return (
      "Recommendations could not be loaded."
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
    "Recommendations could not be loaded."
  );
};

const extractRecommendations = (
  cases: BackendCase[]
): RecommendationItem[] => {
  const recommendations: RecommendationItem[] =
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

      const caseEmotion =
        caseItem.dominantEmotion ||
        caseItem.aiDiagnosis ||
        "General analysis";

      const relatedIndicators =
        Array.isArray(
          caseItem.recurringPatterns
        )
          ? caseItem.recurringPatterns.filter(
              (
                item
              ): item is string =>
                typeof item === "string" &&
                Boolean(
                  item.trim()
                )
            )
          : [];

      const savedRecommendations =
        Array.isArray(
          caseItem.doctorRecommendations
        )
          ? caseItem.doctorRecommendations
          : [];

      savedRecommendations.forEach(
        (
          recommendation,
          index
        ) => {
          const recommendationText =
            recommendation.note ||
            recommendation.text ||
            "";

          if (
            !recommendationText.trim()
          ) {
            return;
          }

          const rawDate =
            recommendation.date ||
            recommendation.createdAt ||
            caseItem.updatedAt ||
            caseItem.createdAt ||
            "";

          recommendations.push({
            id:
              recommendation._id ||
              `${caseItem._id}-${rawDate}-${index}`,

            caseId:
              caseItem._id,

            childName,
            childId,

            age:
              typeof child.age === "number"
                ? child.age
                : null,

            avatar:
              getAvatar(
                child.gender
              ),

            date:
              formatDate(
                rawDate
              ),

            timestamp:
              getTimestamp(
                rawDate
              ),

            caseEmotion,

            recommendation:
              recommendationText,

            status:
              getRecommendationStatus(
                caseItem.status
              ),

            relatedIndicators,
          });
        }
      );

      if (
        savedRecommendations.length ===
          0 &&
        caseItem.doctorRecommendation
          ?.trim()
      ) {
        const rawDate =
          caseItem.updatedAt ||
          caseItem.createdAt ||
          "";

        recommendations.push({
          id:
            `${caseItem._id}-latest`,

          caseId:
            caseItem._id,

          childName,
          childId,

          age:
            typeof child.age === "number"
              ? child.age
              : null,

          avatar:
            getAvatar(
              child.gender
            ),

          date:
            formatDate(
              rawDate
            ),

          timestamp:
            getTimestamp(
              rawDate
            ),

          caseEmotion,

          recommendation:
            caseItem.doctorRecommendation,

          status:
            getRecommendationStatus(
              caseItem.status
            ),

          relatedIndicators,
        });
      }
    }
  );

  return recommendations.sort(
    (
      firstItem,
      secondItem
    ) =>
      secondItem.timestamp -
      firstItem.timestamp
  );
};

export default function RecommendationsHistoryScreen() {
  const [
    searchText,
    setSearchText,
  ] =
    useState("");

  const [
    selectedFilter,
    setSelectedFilter,
  ] =
    useState<RecommendationFilter>(
      "all"
    );

  const [
    recommendations,
    setRecommendations,
  ] =
    useState<
      RecommendationItem[]
    >([]);

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

  const loadRecommendations =
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
            await API.get<
              BackendCase[]
            >(
              "/doctor/history"
            );

          const cases =
            Array.isArray(
              response.data
            )
              ? response.data
              : [];

          setRecommendations(
            extractRecommendations(
              cases
            )
          );
        } catch (error) {
          console.log(
            "LOAD RECOMMENDATIONS HISTORY ERROR:",
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
      void loadRecommendations(
        "initial"
      );
    }, [loadRecommendations])
  );

  const counts =
    useMemo(() => {
      return {
        total:
          recommendations.length,

        active:
          recommendations.filter(
            (
              item
            ) =>
              item.status ===
              "active"
          ).length,

        completed:
          recommendations.filter(
            (
              item
            ) =>
              item.status ===
              "completed"
          ).length,
      };
    }, [recommendations]);

  const filteredRecommendations =
    useMemo(() => {
      const normalizedSearch =
        searchText
          .trim()
          .toLowerCase();

      return recommendations.filter(
        (
          item
        ) => {
          const matchesFilter =
            selectedFilter ===
              "all" ||
            item.status ===
              selectedFilter;

          const matchesSearch =
            !normalizedSearch ||
            item.childName
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            item.childId
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            item.caseEmotion
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            item.recommendation
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            item.relatedIndicators.some(
              (
                indicator
              ) =>
                indicator
                  .toLowerCase()
                  .includes(
                    normalizedSearch
                  )
            );

          return (
            matchesFilter &&
            matchesSearch
          );
        }
      );
    }, [
      recommendations,
      searchText,
      selectedFilter,
    ]);

  const handleBack = () => {
    router.back();
  };

  const handleViewChild = (
    recommendation:
      RecommendationItem
  ) => {
    if (
      !recommendation.childId
    ) {
      return;
    }

    router.push(
      {
        pathname:
          "/doctor/child-overview",

        params: {
          childId:
            recommendation.childId,

          caseId:
            recommendation.caseId,
        },
      } as Href
    );
  };

  const handleOpenCase = (
    recommendation:
      RecommendationItem
  ) => {
    router.push(
      {
        pathname:
          "/doctor/review-case",

        params: {
          caseId:
            recommendation.caseId,

          childId:
            recommendation.childId,
        },
      } as Href
    );
  };

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
          "#F7FBFF",
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
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={() =>
                void loadRecommendations(
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
              activeOpacity={0.7}
              onPress={
                handleBack
              }
              style={
                styles.backButton
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
              All Recommendations
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                void loadRecommendations(
                  "refresh"
                )
              }
              disabled={
                refreshing
              }
              style={
                styles.headerRefresh
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
              styles.introduction
            }
          >
            <LinearGradient
              colors={[
                "#DDEFFF",
                "#FFE3E5",
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
                styles.introductionIcon
              }
            >
              <Ionicons
                name="clipboard-outline"
                size={27}
                color="#6D9EC8"
              />
            </LinearGradient>

            <View
              style={
                styles.introductionContent
              }
            >
              <Text
                style={
                  styles.pageTitle
                }
              >
                Recommendation History
              </Text>

              <Text
                style={
                  styles.pageSubtitle
                }
              >
                Review all professional recommendations saved for your assigned cases.
              </Text>
            </View>
          </View>

          <View
            style={
              styles.overviewGrid
            }
          >
            <OverviewCard
              label="Total"
              value={
                counts.total
              }
              valueColor="#438BC7"
            />

            <OverviewCard
              label="Active"
              value={
                counts.active
              }
              valueColor="#3AAE59"
            />

            <OverviewCard
              label="Completed"
              value={
                counts.completed
              }
              valueColor="#777F87"
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
                  void loadRecommendations(
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
              color="#98A0A7"
            />

            <TextInput
              value={searchText}
              onChangeText={
                setSearchText
              }
              placeholder="Search child, ID or recommendation..."
              placeholderTextColor="#A6ABB1"
              autoCapitalize="none"
              autoCorrect={false}
              style={
                styles.searchInput
              }
            />

            {searchText ? (
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
                  size={19}
                  color="#A5ABB1"
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
            {filterOptions.map(
              (
                filter
              ) => {
                const isSelected =
                  selectedFilter ===
                  filter.value;

                return (
                  <TouchableOpacity
                    key={
                      filter.value
                    }
                    activeOpacity={0.8}
                    onPress={() =>
                      setSelectedFilter(
                        filter.value
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
                      {
                        filter.label
                      }
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </ScrollView>

          <View
            style={
              styles.listHeader
            }
          >
            <View>
              <Text
                style={
                  styles.listTitle
                }
              >
                Your Recommendations
              </Text>

              <Text
                style={
                  styles.listSubtitle
                }
              >
                Ordered from newest to oldest
              </Text>
            </View>

            <Text
              style={
                styles.resultsText
              }
            >
              {
                filteredRecommendations.length
              }{" "}
              results
            </Text>
          </View>

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
                Loading recommendations...
              </Text>
            </View>
          ) : filteredRecommendations.length >
            0 ? (
            <View
              style={
                styles.recommendationsList
              }
            >
              {filteredRecommendations.map(
                (
                  recommendation
                ) => (
                  <RecommendationCard
                    key={
                      recommendation.id
                    }
                    recommendation={
                      recommendation
                    }
                    onViewChild={() =>
                      handleViewChild(
                        recommendation
                      )
                    }
                    onOpenCase={() =>
                      handleOpenCase(
                        recommendation
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
              <LinearGradient
                colors={[
                  "#E5F3FF",
                  "#FFF0F1",
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
                  styles.emptyIcon
                }
              >
                <Ionicons
                  name="document-text-outline"
                  size={31}
                  color="#6F9DC1"
                />
              </LinearGradient>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No recommendations found
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                {recommendations.length ===
                0
                  ? "No doctor recommendations have been saved yet."
                  : "Try changing your search text or selected filter."}
              </Text>
            </View>
          )}

          <View
            style={
              styles.privacyNotice
            }
          >
            <View
              style={
                styles.privacyNoticeIcon
              }
            >
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color="#648FB4"
              />
            </View>

            <Text
              style={
                styles.privacyNoticeText
              }
            >
              These recommendations are returned only for cases assigned to the signed-in doctor.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function OverviewCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: number;
  valueColor: string;
}) {
  return (
    <View
      style={
        styles.overviewCard
      }
    >
      <Text
        style={
          styles.overviewLabel
        }
      >
        {label}
      </Text>

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
    </View>
  );
}

function RecommendationCard({
  recommendation,
  onViewChild,
  onOpenCase,
}: {
  recommendation:
    RecommendationItem;
  onViewChild: () => void;
  onOpenCase: () => void;
}) {
  const statusData =
    getStatusData(
      recommendation.status
    );

  return (
    <View
      style={
        styles.recommendationCard
      }
    >
      <View
        style={
          styles.childHeader
        }
      >
        <View
          style={
            styles.childIdentity
          }
        >
          <View
            style={
              styles.childAvatarWrapper
            }
          >
            <Image
              source={
                recommendation.avatar
              }
              style={
                styles.childAvatar
              }
              contentFit="cover"
            />
          </View>

          <View
            style={
              styles.childInformation
            }
          >
            <Text
              style={
                styles.childName
              }
            >
              {
                recommendation.childName
              }
            </Text>

            <Text
              style={
                styles.childDetails
              }
            >
              Child ID{" "}
              {recommendation.childId
                ? `#${recommendation.childId.slice(
                    -6
                  )}`
                : "unavailable"}
              {recommendation.age !==
              null
                ? ` · ${recommendation.age} years old`
                : ""}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,

            {
              backgroundColor:
                statusData.backgroundColor,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,

              {
                backgroundColor:
                  statusData.textColor,
              },
            ]}
          />

          <Text
            style={[
              styles.statusText,

              {
                color:
                  statusData.textColor,
              },
            ]}
          >
            {
              statusData.label
            }
          </Text>
        </View>
      </View>

      <View
        style={
          styles.metadataRow
        }
      >
        <View
          style={
            styles.metadataItem
          }
        >
          <Ionicons
            name="calendar-outline"
            size={14}
            color="#7891A4"
          />

          <Text
            style={
              styles.metadataText
            }
          >
            {recommendation.date}
          </Text>
        </View>

        <View
          style={
            styles.metadataDivider
          }
        />

        <View
          style={
            styles.metadataItem
          }
        >
          <Ionicons
            name="folder-open-outline"
            size={14}
            color="#7891A4"
          />

          <Text
            style={
              styles.metadataText
            }
          >
            Case recommendation
          </Text>
        </View>
      </View>

      <View
        style={
          styles.emotionRow
        }
      >
        <View
          style={
            styles.emotionIcon
          }
        >
          <Ionicons
            name="heart-outline"
            size={17}
            color="#DD8188"
          />
        </View>

        <View
          style={
            styles.emotionContent
          }
        >
          <Text
            style={
              styles.emotionLabel
            }
          >
            Related case
          </Text>

          <Text
            style={
              styles.emotionValue
            }
          >
            {
              recommendation.caseEmotion
            }
          </Text>
        </View>
      </View>

      <LinearGradient
        colors={[
          "#FFF5F5",
          "#F4F9FD",
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
          styles.recommendationTextCard
        }
      >
        <View
          style={
            styles.quoteIconContainer
          }
        >
          <Ionicons
            name="clipboard-outline"
            size={18}
            color="#D67C83"
          />
        </View>

        <View
          style={
            styles.recommendationContent
          }
        >
          <Text
            style={
              styles.recommendationLabel
            }
          >
            Doctor Recommendation
          </Text>

          <Text
            style={
              styles.recommendationText
            }
          >
            {
              recommendation.recommendation
            }
          </Text>
        </View>
      </LinearGradient>

      {recommendation.relatedIndicators.length >
      0 ? (
        <View
          style={
            styles.indicatorsContainer
          }
        >
          {recommendation.relatedIndicators.map(
            (
              indicator
            ) => (
              <View
                key={
                  indicator
                }
                style={
                  styles.indicatorChip
                }
              >
                <View
                  style={
                    styles.indicatorDot
                  }
                />

                <Text
                  style={
                    styles.indicatorText
                  }
                >
                  {indicator}
                </Text>
              </View>
            )
          )}
        </View>
      ) : null}

      <View
        style={
          styles.actionsRow
        }
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={
            onViewChild
          }
          disabled={
            !recommendation.childId
          }
          style={
            styles.secondaryButton
          }
        >
          <Ionicons
            name="person-outline"
            size={16}
            color="#6595BB"
          />

          <Text
            style={
              styles.secondaryButtonText
            }
          >
            View Child
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={
            onOpenCase
          }
          style={
            styles.primaryButtonWrapper
          }
        >
          <LinearGradient
            colors={[
              "#A8D4F7",
              "#F7A8AC",
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
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Open Case
            </Text>

            <Ionicons
              name="arrow-forward"
              size={16}
              color="#25282B"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getStatusData(
  status: RecommendationStatus
) {
  if (
    status === "completed"
  ) {
    return {
      label: "Completed",
      backgroundColor: "#ECEFF2",
      textColor: "#778089",
    };
  }

  return {
    label: "Active",
    backgroundColor: "#E9F8ED",
    textColor: "#45A95A",
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

    scrollContent: {
      paddingHorizontal: 17,
      paddingTop: 4,
      paddingBottom: 30,
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

    headerTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: "#22262A",
    },

    headerRefresh: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "flex-end",
    },

    introduction: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 5,
      marginBottom: 17,
    },

    introductionIcon: {
      width: 55,
      height: 55,
      borderRadius: 17,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 11,
    },

    introductionContent: {
      flex: 1,
    },

    pageTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: "#24282C",
    },

    pageSubtitle: {
      marginTop: 5,
      fontSize: 9.5,
      lineHeight: 15,
      color: "#878D93",
    },

    overviewGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 7,
      marginBottom: 14,
    },

    overviewCard: {
      flex: 1,
      minHeight: 58,
      justifyContent: "center",
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E5ECF1",
      borderRadius: 11,
      paddingHorizontal: 8,
    },

    overviewLabel: {
      fontSize: 7.5,
      color: "#828990",
    },

    overviewValue: {
      marginTop: 4,
      fontSize: 16,
      fontWeight: "700",
    },

    errorBanner: {
      marginBottom: 11,
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
      height: 50,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#F7F9FA",
      borderWidth: 1,
      borderColor: "#E1E7EB",
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 11,
    },

    searchInput: {
      flex: 1,
      fontSize: 11.5,
      color: "#252A2E",
    },

    filtersContainer: {
      gap: 8,
      paddingBottom: 17,
    },

    filterButton: {
      minWidth: 74,
      alignItems: "center",
      backgroundColor: "#F0F1F3",
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },

    filterButtonSelected: {
      backgroundColor: "#F8C4C7",
    },

    filterText: {
      fontSize: 9,
      fontWeight: "500",
      color: "#6C737A",
    },

    filterTextSelected: {
      fontWeight: "700",
      color: "#5B4144",
    },

    listHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 12,
    },

    listTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#292E32",
    },

    listSubtitle: {
      marginTop: 4,
      fontSize: 8.5,
      color: "#969CA2",
    },

    resultsText: {
      fontSize: 8.5,
      color: "#E49A9F",
    },

    loadingState: {
      minHeight: 260,
      justifyContent: "center",
      alignItems: "center",
    },

    loadingText: {
      marginTop: 12,
      fontSize: 10.5,
      color: "#7A8087",
    },

    recommendationsList: {
      gap: 13,
    },

    recommendationCard: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E9ECEF",
      borderRadius: 17,
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 11,
    },

    childHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },

    childIdentity: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      paddingRight: 8,
    },

    childAvatarWrapper: {
      width: 45,
      height: 45,
      borderRadius: 23,
      overflow: "hidden",
      backgroundColor: "#FFF1EA",
      borderWidth: 1,
      borderColor: "#E9DDD4",
      marginRight: 9,
    },

    childAvatar: {
      width: "100%",
      height: "100%",
    },

    childInformation: {
      flex: 1,
    },

    childName: {
      fontSize: 14,
      fontWeight: "700",
      color: "#282D31",
    },

    childDetails: {
      marginTop: 4,
      fontSize: 8.5,
      color: "#848B91",
    },

    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },

    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },

    statusText: {
      fontSize: 7.5,
      fontWeight: "600",
    },

    metadataRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F8FAFB",
      borderRadius: 9,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginTop: 11,
    },

    metadataItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },

    metadataText: {
      fontSize: 8.5,
      color: "#71808C",
    },

    metadataDivider: {
      width: 1,
      height: 15,
      backgroundColor: "#DDE3E7",
      marginHorizontal: 10,
    },

    emotionRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 11,
    },

    emotionIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFF0F1",
      marginRight: 8,
    },

    emotionContent: {
      flex: 1,
    },

    emotionLabel: {
      fontSize: 7.5,
      color: "#979DA3",
    },

    emotionValue: {
      marginTop: 3,
      fontSize: 10.5,
      fontWeight: "600",
      color: "#4A5055",
    },

    recommendationTextCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      borderRadius: 12,
      paddingHorizontal: 11,
      paddingVertical: 11,
      marginTop: 11,
    },

    quoteIconContainer: {
      width: 34,
      height: 34,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      marginRight: 9,
    },

    recommendationContent: {
      flex: 1,
    },

    recommendationLabel: {
      fontSize: 8.5,
      fontWeight: "700",
      color: "#865A5F",
    },

    recommendationText: {
      marginTop: 6,
      fontSize: 9.5,
      lineHeight: 15,
      color: "#555C62",
    },

    indicatorsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 10,
    },

    indicatorChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "#FFF0F1",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },

    indicatorDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: "#D87B82",
    },

    indicatorText: {
      fontSize: 7.5,
      color: "#74575A",
    },

    actionsRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
    },

    secondaryButton: {
      flex: 1,
      height: 43,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#B9D4E8",
      borderRadius: 999,
    },

    secondaryButtonText: {
      fontSize: 9.5,
      fontWeight: "600",
      color: "#6595BB",
    },

    primaryButtonWrapper: {
      flex: 1,
    },

    primaryButton: {
      height: 43,
      borderRadius: 999,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
    },

    primaryButtonText: {
      fontSize: 9.5,
      fontWeight: "700",
      color: "#25282B",
    },

    emptyState: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: 17,
      paddingHorizontal: 20,
      paddingVertical: 31,
    },

    emptyIcon: {
      width: 65,
      height: 65,
      borderRadius: 33,
      justifyContent: "center",
      alignItems: "center",
    },

    emptyTitle: {
      marginTop: 14,
      fontSize: 14,
      fontWeight: "700",
      color: "#30353A",
    },

    emptyDescription: {
      maxWidth: 250,
      marginTop: 7,
      fontSize: 9.5,
      lineHeight: 15,
      color: "#8D9399",
      textAlign: "center",
    },

    privacyNotice: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: "#EAF5FF",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 11,
      marginTop: 17,
    },

    privacyNoticeIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      marginRight: 9,
    },

    privacyNoticeText: {
      flex: 1,
      fontSize: 9,
      lineHeight: 14,
      color: "#668098",
    },
  });
