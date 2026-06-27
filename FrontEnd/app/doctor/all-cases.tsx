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

type CaseStatus =
  | "pending"
  | "reviewed"
  | "closed"
  | "improving"
  | string;

type FilterStatus =
  | "All"
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

type BackendCase = {
  _id: string;

  childId?:
    | string
    | PopulatedChild
    | null;

  aiDiagnosis?: string;
  aiSummary?: string;
  dominantEmotion?: string;
  emotionPercentage?: number;

  status?: CaseStatus;
  priority?: string;

  lastAnalysisDate?: string | null;
  updatedAt?: string;
  createdAt?: string;

  childProgress?: string;
  recurringPatterns?: string[];
};

type DisplayCase = {
  caseId: string;
  childId: string;
  name: string;
  age: number | null;
  gender: string;

  indicator: string;
  summary: string;

  status: FilterStatus;
  priority: string;
  avatar: number;
  lastUpdated: string;
};

const filters: FilterStatus[] = [
  "All",
  "Pending",
  "Reviewed",
  "Closed",
  "Improving",
];

const normalizeStatus = (
  value?: string
): FilterStatus => {
  switch (
    String(value || "")
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

const getChildData = (
  childId:
    | BackendCase["childId"]
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
    | BackendCase["childId"]
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

const formatDate = (
  value?: string | null
): string => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

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
    !axios.isAxiosError(
      error
    )
  ) {
    return "Cases could not be loaded.";
  }

  const data =
    error.response?.data as
      | {
          message?: unknown;
          error?: unknown;
        }
      | undefined;

  const message =
    data?.message ??
    data?.error;

  if (
    typeof message === "string" &&
    message.trim()
  ) {
    return message;
  }

  return "Cases could not be loaded.";
};

const mapCaseToDisplay = (
  item: BackendCase
): DisplayCase => {
  const child =
    getChildData(item.childId);

  const childId =
    getChildId(item.childId);

  const status =
    normalizeStatus(item.status);

  const priorityValue =
    String(
      item.priority || "Low"
    ).trim();

  const indicator =
    item.aiDiagnosis ||
    item.dominantEmotion ||
    item.childProgress ||
    "General emotional indicators";

  const summary =
    item.aiSummary ||
    item.aiDiagnosis ||
    "No AI summary is available for this case.";

  return {
    caseId: item._id,
    childId,
    name:
      child.name ||
      "Unknown child",
    age:
      typeof child.age === "number"
        ? child.age
        : null,
    gender:
      child.gender || "",
    indicator,
    summary,
    status,
    priority:
      `${priorityValue} Priority`,
    avatar:
      getAvatar(child.gender),
    lastUpdated:
      formatDate(
        item.lastAnalysisDate ||
        item.updatedAt ||
        item.createdAt
      ),
  };
};

export default function AllCasesScreen() {
  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    selectedFilter,
    setSelectedFilter,
  ] =
    useState<FilterStatus>(
      "All"
    );

  const [
    cases,
    setCases,
  ] =
    useState<DisplayCase[]>(
      []
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

  const loadCases =
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

          const responseItems =
            Array.isArray(
              response.data
            )
              ? response.data
              : [];

          const mappedCases =
            responseItems
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
                mapCaseToDisplay
              );

          setCases(
            mappedCases
          );
        } catch (error) {
          console.log(
            "LOAD ALL CASES ERROR:",
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
      void loadCases(
        "initial"
      );
    }, [loadCases])
  );

  const filteredCases =
    useMemo(() => {
      const cleanSearch =
        searchText
          .trim()
          .toLowerCase();

      return cases.filter(
        (item) => {
          const matchesFilter =
            selectedFilter ===
              "All" ||
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
            item.indicator
              .toLowerCase()
              .includes(
                cleanSearch
              ) ||
            item.summary
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
      cases,
      searchText,
      selectedFilter,
    ]);

  const handleBack = () => {
    router.back();
  };

  const handleOpenCase = (
    item: DisplayCase
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
      style={styles.safeArea}
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
          style={styles.container}
        >
          <View
            style={styles.header}
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
              All Cases
            </Text>

            <TouchableOpacity
              style={
                styles.refreshButton
              }
              activeOpacity={0.7}
              onPress={() =>
                void loadCases(
                  "refresh"
                )
              }
              disabled={refreshing}
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
              placeholder="Search by child name, ID or indicator"
              placeholderTextColor="#A1A6AC"
              autoCorrect={false}
              style={
                styles.searchInput
              }
            />

            {searchText.length >
            0 ? (
              <TouchableOpacity
                onPress={() =>
                  setSearchText(
                    ""
                  )
                }
                activeOpacity={0.7}
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

          {cases.length > 0 ||
          searchText.trim().length > 0 ||
          selectedFilter !== "All" ? (
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
                Cases
              </Text>

              <Text
                style={
                  styles.resultCount
                }
              >
                {
                  filteredCases.length
                }{" "}
                results
              </Text>
            </View>
          ) : null}

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
                  void loadCases(
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
                Loading cases...
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
                    void loadCases(
                      "refresh"
                    )
                  }
                  tintColor="#6799C2"
                />
              }
            >
              {filteredCases.length >
              0 ? (
                filteredCases.map(
                  (
                    item
                  ) => (
                    <CaseCard
                      key={
                        item.caseId
                      }
                      item={item}
                      onPress={() =>
                        handleOpenCase(
                          item
                        )
                      }
                    />
                  )
                )
              ) : screenError ? null : (
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
                      size={37}
                      color="#80B7E6"
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
                    {cases.length ===
                    0
                      ? "No cases are currently assigned to your account."
                      : "Try changing the search text or selected filter."}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

function CaseCard({
  item,
  onPress,
}: {
  item: DisplayCase;
  onPress: () => void;
}) {
  const statusStyle =
    getStatusStyle(
      item.status
    );

  return (
    <View
      style={styles.caseCard}
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
              source={item.avatar}
              style={
                styles.avatar
              }
              contentFit="cover"
            />
          </View>

          <View
            style={
              styles.childDetails
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
                styles.childMeta
              }
            >
              Child ID{" "}
              {item.childId
                ? `#${item.childId.slice(
                    -6
                  )}`
                : "Not available"}{" "}
              ·{" "}
              {item.age ??
                "—"}{" "}
              years old
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
            {item.status}
          </Text>
        </View>
      </View>

      <View
        style={
          styles.indicatorRow
        }
      >
        <Ionicons
          name="pulse-outline"
          size={16}
          color="#72ACE0"
        />

        <Text
          style={
            styles.indicatorText
          }
          numberOfLines={2}
        >
          {item.indicator}
        </Text>
      </View>

      <Text
        style={
          styles.caseSummary
        }
        numberOfLines={3}
      >
        {item.summary}
      </Text>

      <View
        style={
          styles.caseFooter
        }
      >
        <Text
          style={
            styles.lastUpdated
          }
        >
          Last updated:{" "}
          {item.lastUpdated}
        </Text>

        <Text
          style={
            styles.priorityText
          }
        >
          {item.priority}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={
          styles.viewCaseButtonWrapper
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
            styles.viewCaseButton
          }
        >
          <Text
            style={
              styles.viewCaseButtonText
            }
          >
            View Case
          </Text>

          <Ionicons
            name="arrow-forward"
            size={17}
            color="#292D31"
          />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function getStatusStyle(
  status: FilterStatus
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

  if (
    status === "Improving"
  ) {
    return {
      backgroundColor:
        "#E7F4FF",
      textColor:
        "#4C8DBF",
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

    header: {
      height: 55,
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
      fontSize: 17,
      fontWeight: "600",
      color: "#202428",
    },

    searchContainer: {
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F4F4F6",
      borderRadius: 13,
      paddingHorizontal: 13,
      gap: 9,
      marginBottom: 12,
    },

    searchInput: {
      flex: 1,
      fontSize: 12,
      color: "#25292D",
    },

    filtersRow: {
      gap: 7,
      paddingBottom: 15,
    },

    filterButton: {
      minWidth: 82,
      height: 35,
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

    resultHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 10,
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

    loadingState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
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
      flexGrow: 1,
      paddingBottom: 25,
      gap: 11,
    },

    caseCard: {
      position: "relative",
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7E8EA",
      borderRadius: 17,
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 10,
      overflow: "hidden",
    },

    caseDecoration: {
      position: "absolute",
      width: 75,
      height: 75,
      borderRadius: 37.5,
      right: -22,
      top: -20,
      backgroundColor: "#FFF0F1",
    },

    caseHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "flex-start",
    },

    childInfo: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },

    avatarWrapper: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: "#FFF1EC",
      borderWidth: 1,
      borderColor: "#EEDDD7",
      overflow: "hidden",
      marginRight: 10,
    },

    avatar: {
      width: "100%",
      height: "100%",
    },

    childDetails: {
      flex: 1,
    },

    childName: {
      fontSize: 15,
      fontWeight: "700",
      color: "#25292D",
    },

    childMeta: {
      marginTop: 3,
      fontSize: 8.5,
      color: "#7A8087",
    },

    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 5,
      marginLeft: 8,
      zIndex: 2,
    },

    statusText: {
      fontSize: 8,
      fontWeight: "500",
    },

    indicatorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 11,
    },

    indicatorText: {
      flex: 1,
      fontSize: 10.5,
      lineHeight: 15,
      color: "#6EA9DF",
    },

    caseSummary: {
      marginTop: 7,
      fontSize: 10,
      lineHeight: 15,
      color: "#50555B",
    },

    caseFooter: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      marginTop: 10,
      gap: 8,
    },

    lastUpdated: {
      flex: 1,
      fontSize: 8.5,
      color: "#9A9FA5",
    },

    priorityText: {
      fontSize: 8.5,
      color: "#E89845",
    },

    viewCaseButtonWrapper: {
      marginTop: 11,
    },

    viewCaseButton: {
      height: 36,
      borderRadius: 999,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    viewCaseButtonText: {
      fontSize: 10,
      fontWeight: "600",
      color: "#292D31",
    },

    emptyState: {
      flex: 1,
      minHeight: 300,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 30,
      paddingBottom: 45,
    },

    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "#EDF7FF",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 14,
    },

    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: "#292D31",
    },

    emptyDescription: {
      marginTop: 7,
      fontSize: 11,
      lineHeight: 17,
      color: "#8F959C",
      textAlign: "center",
    },
  });
