import React, {
  useCallback,
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
  ActivityIndicator,
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
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import API from "../api";

type EntryStatus =
  | "Pending Review"
  | "Reviewed"
  | "Closed"
  | "Improving";

type EntryFilter =
  | "All"
  | "Pending"
  | "Reviewed"
  | "Closed";

type BackendStatus =
  | "pending"
  | "reviewed"
  | "closed"
  | "improving";

type IoniconName =
  keyof typeof Ionicons.glyphMap;

type ChildInfo = {
  _id: string;
  name: string;
  age: number;
  gender?: "male" | "female";
  notes?: string;
};

type BackendEntry = {
  id: string;
  caseId?: string;
  date: string;
  type: string;
  emotion: string;
  description: string;
  status: BackendStatus;
  confidence: number;
  doctorResponseExists: boolean;
  imageUrl?: string;
};

type ChildEntry = {
  id: string;
  caseId?: string;
  date: string;
  rawDate: string;
  type: string;
  emotion: string;
  description: string;
  status: EntryStatus;
  confidence: number;
  doctorResponseExists: boolean;
  imageUrl?: string;
  icon: IoniconName;
  iconColor: string;
  iconBackground: string;
};

type EntriesResponse = {
  childInfo: ChildInfo;

  counts?: {
    all: number;
    pending: number;
    reviewed: number;
    closed: number;
  };

  entries: BackendEntry[];
};

type ApiErrorData = {
  error?: string;
  message?: string;
  msg?: string;
};

function getSingleParam(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function formatDate(
  value?: string
): string {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }
  );
}

function normalizeStatus(
  status?: BackendStatus
): EntryStatus {
  if (status === "reviewed") {
    return "Reviewed";
  }

  if (status === "closed") {
    return "Closed";
  }

  if (status === "improving") {
    return "Improving";
  }

  return "Pending Review";
}

function getEntryAppearance(
  type: string
): {
  icon: IoniconName;
  iconColor: string;
  iconBackground: string;
} {
  const normalizedType =
    type.toLowerCase();

  if (
    normalizedType.includes("drawing") ||
    normalizedType.includes("image")
  ) {
    return {
      icon: "image-outline",
      iconColor: "#B65A61",
      iconBackground: "#FFF0F1",
    };
  }

  if (
    normalizedType.includes("voice") ||
    normalizedType.includes("audio")
  ) {
    return {
      icon: "mic-outline",
      iconColor: "#8B74B8",
      iconBackground: "#F2ECFB",
    };
  }

  return {
    icon: "document-text-outline",
    iconColor: "#3976A4",
    iconBackground: "#EDF6FD",
  };
}

function getStatusStyle(
  status: EntryStatus
) {
  if (
    status === "Reviewed" ||
    status === "Improving"
  ) {
    return {
      backgroundColor: "#DDF5E5",
      textColor: "#397951",
      icon:
        "checkmark-circle-outline" as const,
    };
  }

  if (status === "Closed") {
    return {
      backgroundColor: "#EAF5FD",
      textColor: "#3976A4",
      icon:
        "lock-closed-outline" as const,
    };
  }

  return {
    backgroundColor: "#FDE3E2",
    textColor: "#A14D4B",
    icon: "time-outline" as const,
  };
}

export default function ChildEntriesScreen() {
  const params =
    useLocalSearchParams<{
      childId?:
        | string
        | string[];

      childName?:
        | string
        | string[];

      childAge?:
        | string
        | string[];
    }>();

  const childId =
    getSingleParam(
      params.childId
    );

  const fallbackChildName =
    getSingleParam(
      params.childName
    ) || "Child";

  const fallbackChildAge =
    getSingleParam(
      params.childAge
    ) || "";

  const [childInfo, setChildInfo] =
    useState<ChildInfo | null>(
      null
    );

  const [entries, setEntries] =
    useState<ChildEntry[]>([]);

  const [
    selectedFilter,
    setSelectedFilter,
  ] =
    useState<EntryFilter>("All");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const handleExpiredSession =
    useCallback(async () => {
      try {
        await AsyncStorage.multiRemove([
          "token",
          "user",
        ]);
      } catch (storageError) {
        console.log(
          "SESSION CLEANUP ERROR:",
          storageError
        );
      }

      router.replace(
        "/auth/login" as never
      );
    }, []);

  const getErrorMessage = (
    requestError: unknown
  ): string => {
    if (
      axios.isAxiosError(
        requestError
      )
    ) {
      const responseData =
        requestError.response
          ?.data as
          | ApiErrorData
          | undefined;

      return (
        responseData?.message ||
        responseData?.error ||
        responseData?.msg ||
        "Failed to load child entries."
      );
    }

    if (
      requestError instanceof Error
    ) {
      return requestError.message;
    }

    return "Failed to load child entries.";
  };

  const loadEntries =
    useCallback(async () => {
      if (!childId) {
        setLoading(false);

        setError(
          "Child ID was not found. Please return to the home page and select the child again."
        );

        return;
      }

      try {
        setLoading(true);
        setError("");

        const token =
          await AsyncStorage.getItem(
            "token"
          );

        if (!token) {
          await handleExpiredSession();
          return;
        }

        const response =
          await API.get<EntriesResponse>(
            `/children/${childId}/entries`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const responseEntries =
          Array.isArray(
            response.data.entries
          )
            ? response.data.entries
            : [];

        const formattedEntries =
          responseEntries.map(
            (
              entry
            ): ChildEntry => {
              const appearance =
                getEntryAppearance(
                  entry.type
                );

              return {
                id: entry.id,

                caseId:
                  entry.caseId,

                date: formatDate(
                  entry.date
                ),

                rawDate:
                  entry.date,

                type:
                  entry.type ||
                  "Text Entry",

                emotion:
                  entry.emotion ||
                  "Unknown",

                description:
                  entry.description ||
                  "No analysis description is available.",

                status:
                  normalizeStatus(
                    entry.status
                  ),

                confidence:
                  Number(
                    entry.confidence
                  ) || 0,

                doctorResponseExists:
                  Boolean(
                    entry.doctorResponseExists
                  ),

                imageUrl:
                  entry.imageUrl,

                ...appearance,
              };
            }
          );

        setChildInfo(
          response.data.childInfo
        );

        setEntries(
          formattedEntries
        );
      } catch (requestError) {
        console.log(
          "GET CHILD ENTRIES ERROR:",
          requestError
        );

        if (
          axios.isAxiosError(
            requestError
          ) &&
          requestError.response
            ?.status === 401
        ) {
          await handleExpiredSession();
          return;
        }

        setError(
          getErrorMessage(
            requestError
          )
        );
      } finally {
        setLoading(false);
      }
    }, [
      childId,
      handleExpiredSession,
    ]);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const childName =
    childInfo?.name ||
    fallbackChildName;

  const childAge =
    childInfo?.age !== undefined
      ? String(childInfo.age)
      : fallbackChildAge;

  const pendingCount =
    useMemo(() => {
      return entries.filter(
        (entry) =>
          entry.status ===
          "Pending Review"
      ).length;
    }, [entries]);

  const reviewedCount =
    useMemo(() => {
      return entries.filter(
        (entry) =>
          entry.status ===
            "Reviewed" ||
          entry.status ===
            "Improving"
      ).length;
    }, [entries]);

  const closedCount =
    useMemo(() => {
      return entries.filter(
        (entry) =>
          entry.status === "Closed"
      ).length;
    }, [entries]);

  const filteredEntries =
    useMemo(() => {
      if (
        selectedFilter === "Pending"
      ) {
        return entries.filter(
          (entry) =>
            entry.status ===
            "Pending Review"
        );
      }

      if (
        selectedFilter ===
        "Reviewed"
      ) {
        return entries.filter(
          (entry) =>
            entry.status ===
              "Reviewed" ||
            entry.status ===
              "Improving"
        );
      }

      if (
        selectedFilter === "Closed"
      ) {
        return entries.filter(
          (entry) =>
            entry.status ===
            "Closed"
        );
      }

      return entries;
    }, [
      entries,
      selectedFilter,
    ]);

  const getFilterCount = (
    filter: EntryFilter
  ) => {
    if (filter === "Pending") {
      return pendingCount;
    }

    if (filter === "Reviewed") {
      return reviewedCount;
    }

    if (filter === "Closed") {
      return closedCount;
    }

    return entries.length;
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

  const openEntryDetails = (
    entry: ChildEntry
  ) => {
    router.push(
      {
        pathname:
          "/parent/activity-details",

        params: {
          activityId:
            entry.id,

          caseId:
            entry.caseId || "",

          childId,

          childName,

          childAge,

          date:
            entry.date,

          type:
            entry.type,

          emotion:
            entry.emotion,

          description:
            entry.description,

          status:
            entry.status,

          confidence:
            String(
              entry.confidence
            ),

          entryCount:
            String(
              entries.length
            ),

          doctorResponseExists:
            String(
              entry.doctorResponseExists
            ),

          imageUrl:
            entry.imageUrl || "",
        },
      } as any
    );
  };

  const filters: EntryFilter[] = [
    "All",
    "Pending",
    "Reviewed",
    "Closed",
  ];

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={
            styles.centerState
          }
        >
          <ActivityIndicator
            size="large"
            color="#3976A4"
          />

          <Text
            style={styles.stateText}
          >
            Loading entries...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !childInfo) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={
            styles.centerState
          }
        >
          <View
            style={
              styles.errorIcon
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={34}
              color="#B65A61"
            />
          </View>

          <Text
            style={styles.errorTitle}
          >
            Unable to load entries
          </Text>

          <Text
            style={styles.stateText}
          >
            {error}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={loadEntries}
            style={styles.retryButton}
          >
            <Ionicons
              name="refresh-outline"
              size={17}
              color="#3976A4"
            />

            <Text
              style={
                styles.retryText
              }
            >
              Try Again
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              router.back()
            }
            style={
              styles.goBackButton
            }
          >
            <Text
              style={
                styles.goBackText
              }
            >
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <View style={styles.container}>
          <View style={styles.header}>
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

            <View
              style={
                styles.headerContent
              }
            >
              <Text
                style={styles.pageTitle}
              >
                {childName}'s Entries
              </Text>

              <Text
                style={
                  styles.pageSubtitle
                }
              >
                All emotional updates and analyses
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
                size={20}
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
            {error ? (
              <View
                style={
                  styles.inlineError
                }
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color="#B65A61"
                />

                <Text
                  style={
                    styles.inlineErrorText
                  }
                >
                  {error}
                </Text>
              </View>
            ) : null}

            <View
              style={styles.childCard}
            >
              <View
                style={
                  styles.childAvatar
                }
              >
                <Ionicons
                  name="happy-outline"
                  size={27}
                  color="#3976A4"
                />
              </View>

              <View
                style={styles.childInfo}
              >
                <Text
                  style={styles.childName}
                >
                  {childName}
                </Text>

                <Text
                  style={styles.childAge}
                >
                  {childAge
                    ? `${childAge} years old`
                    : ""}
                </Text>
              </View>

              <View
                style={
                  styles.totalEntriesBox
                }
              >
                <Text
                  style={
                    styles.totalEntriesValue
                  }
                >
                  {entries.length}
                </Text>

                <Text
                  style={
                    styles.totalEntriesLabel
                  }
                >
                  Entries
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openAddEntry}
              style={
                styles.addEntryWrapper
              }
            >
              <LinearGradient
                colors={[
                  "#B9D8F6",
                  "#FBC0BF",
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
                  styles.addEntryButton
                }
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color="#292D31"
                />

                <Text
                  style={
                    styles.addEntryText
                  }
                >
                  Add New Entry
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View
              style={
                styles.filtersContainer
              }
            >
              {filters.map(
                (filter) => {
                  const isActive =
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

                        isActive &&
                          styles.filterButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterText,

                          isActive &&
                            styles.filterTextActive,
                        ]}
                      >
                        {filter}
                      </Text>

                      <View
                        style={[
                          styles.filterCount,

                          isActive &&
                            styles.filterCountActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterCountText,

                            isActive &&
                              styles.filterCountTextActive,
                          ]}
                        >
                          {getFilterCount(
                            filter
                          )}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>

            <View
              style={styles.listHeader}
            >
              <View>
                <Text
                  style={styles.listTitle}
                >
                  Entries
                </Text>

                <Text
                  style={
                    styles.listSubtitle
                  }
                >
                  Newest entries appear first
                </Text>
              </View>

              <Text
                style={styles.listCount}
              >
                {filteredEntries.length}
              </Text>
            </View>

            {filteredEntries.length ===
            0 ? (
              <View
                style={styles.emptyState}
              >
                <View
                  style={styles.emptyIcon}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={30}
                    color="#78ACD5"
                  />
                </View>

                <Text
                  style={styles.emptyTitle}
                >
                  No entries found
                </Text>

                <Text
                  style={
                    styles.emptyDescription
                  }
                >
                  {entries.length === 0
                    ? "No analyses have been added for this child yet."
                    : "There are no entries matching this filter."}
                </Text>

                {entries.length === 0 ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={openAddEntry}
                    style={
                      styles.showAllButton
                    }
                  >
                    <Text
                      style={
                        styles.showAllText
                      }
                    >
                      Add First Entry
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      setSelectedFilter(
                        "All"
                      )
                    }
                    style={
                      styles.showAllButton
                    }
                  >
                    <Text
                      style={
                        styles.showAllText
                      }
                    >
                      Show All Entries
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredEntries.map(
                (entry) => {
                  const statusStyle =
                    getStatusStyle(
                      entry.status
                    );

                  return (
                    <TouchableOpacity
                      key={entry.id}
                      activeOpacity={0.84}
                      onPress={() =>
                        openEntryDetails(
                          entry
                        )
                      }
                      style={
                        styles.entryCard
                      }
                    >
                      <View
                        style={[
                          styles.entryIcon,

                          {
                            backgroundColor:
                              entry.iconBackground,
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            entry.icon
                          }
                          size={21}
                          color={
                            entry.iconColor
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.entryContent
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
                                styles.entryDate
                              }
                            >
                              {
                                entry.date
                              }
                            </Text>

                            <Text
                              style={
                                styles.entryTitle
                              }
                            >
                              {entry.type} ·{" "}
                              {entry.emotion}
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
                              size={11}
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
                              {
                                entry.status
                              }
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={
                            styles.entryDescription
                          }
                          numberOfLines={2}
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
                        </View>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#AAAAAA"
                        style={
                          styles.chevron
                        }
                      />
                    </TouchableOpacity>
                  );
                }
              )
            )}

            <View
              style={styles.bottomSpace}
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

    centerState: {
      flex: 1,
      paddingHorizontal: 30,
      justifyContent: "center",
      alignItems: "center",
    },

    stateText: {
      marginTop: 12,
      color: "#92979E",
      fontSize: 10,
      lineHeight: 15,
      textAlign: "center",
    },

    errorIcon: {
      width: 66,
      height: 66,
      borderRadius: 33,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFF0F1",
    },

    errorTitle: {
      marginTop: 14,
      fontSize: 16,
      fontWeight: "700",
      color: "#292D31",
    },

    retryButton: {
      marginTop: 18,
      minHeight: 42,
      paddingHorizontal: 20,
      borderRadius: 21,
      backgroundColor: "#EDF7FF",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    retryText: {
      marginLeft: 6,
      fontSize: 9,
      fontWeight: "600",
      color: "#3976A4",
    },

    goBackButton: {
      marginTop: 10,
      paddingHorizontal: 15,
      paddingVertical: 10,
    },

    goBackText: {
      fontSize: 9,
      color: "#92979E",
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

    inlineError: {
      marginBottom: 12,
      padding: 11,
      borderRadius: 12,
      backgroundColor: "#FFF0F1",
      borderWidth: 1,
      borderColor: "#FAD4D2",
      flexDirection: "row",
      alignItems: "center",
    },

    inlineErrorText: {
      flex: 1,
      marginLeft: 7,
      color: "#B65A61",
      fontSize: 8.5,
      lineHeight: 13,
    },

    childCard: {
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
      fontSize: 9,
      color: "#92979E",
    },

    totalEntriesBox: {
      minWidth: 55,
      minHeight: 48,
      borderRadius: 15,
      backgroundColor: "#F7F8FA",
      justifyContent: "center",
      alignItems: "center",
    },

    totalEntriesValue: {
      fontSize: 14,
      fontWeight: "700",
      color: "#3976A4",
    },

    totalEntriesLabel: {
      marginTop: 2,
      fontSize: 7.5,
      color: "#92979E",
    },

    addEntryWrapper: {
      marginTop: 14,
    },

    addEntryButton: {
      height: 46,
      borderRadius: 23,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 7,
    },

    addEntryText: {
      fontSize: 9.5,
      fontWeight: "600",
      color: "#292D31",
    },

    filtersContainer: {
      marginTop: 17,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
    },

    filterButton: {
      minHeight: 34,
      borderRadius: 17,
      paddingHorizontal: 11,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#F2F0F5",
    },

    filterButtonActive: {
      backgroundColor: "#F5C1C5",
    },

    filterText: {
      fontSize: 8.5,
      fontWeight: "500",
      color: "#777C82",
    },

    filterTextActive: {
      fontWeight: "600",
      color: "#6A5558",
    },

    filterCount: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      marginLeft: 5,
      paddingHorizontal: 4,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
    },

    filterCountActive: {
      backgroundColor:
        "rgba(255,255,255,0.7)",
    },

    filterCountText: {
      fontSize: 7,
      fontWeight: "600",
      color: "#858B92",
    },

    filterCountTextActive: {
      color: "#6A5558",
    },

    listHeader: {
      marginTop: 22,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    listTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: "#292D31",
    },

    listSubtitle: {
      marginTop: 3,
      fontSize: 8.5,
      color: "#92979E",
    },

    listCount: {
      minWidth: 26,
      height: 26,
      borderRadius: 13,
      textAlign: "center",
      textAlignVertical: "center",
      fontSize: 8.5,
      fontWeight: "600",
      color: "#3976A4",
      backgroundColor: "#EAF5FD",
    },

    entryCard: {
      minHeight: 112,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: "#E7E9EB",
      backgroundColor: "#FFFFFF",
      marginBottom: 12,
      padding: 13,
      flexDirection: "row",
      alignItems: "flex-start",
      shadowColor: "#9DA6AD",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },

    entryIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 11,
    },

    entryContent: {
      flex: 1,
    },

    entryTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },

    entryTitleContent: {
      flex: 1,
      paddingRight: 7,
    },

    entryDate: {
      fontSize: 8,
      color: "#92979E",
    },

    entryTitle: {
      marginTop: 4,
      fontSize: 10,
      fontWeight: "700",
      color: "#292D31",
    },

    statusBadge: {
      minHeight: 24,
      borderRadius: 12,
      paddingHorizontal: 7,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },

    statusText: {
      fontSize: 6.8,
      fontWeight: "600",
    },

    entryDescription: {
      marginTop: 9,
      fontSize: 8.8,
      lineHeight: 13,
      color: "#60666C",
    },

    entryFooter: {
      marginTop: 10,
      paddingTop: 9,
      borderTopWidth: 1,
      borderTopColor: "#F0F1F2",
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 12,
    },

    entryFooterItem: {
      flexDirection: "row",
      alignItems: "center",
    },

    entryFooterText: {
      marginLeft: 4,
      fontSize: 7.3,
      color: "#92979E",
    },

    chevron: {
      alignSelf: "center",
      marginLeft: 5,
    },

    emptyState: {
      minHeight: 260,
      borderRadius: 20,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7E9EB",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 30,
    },

    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#EDF7FF",
    },

    emptyTitle: {
      marginTop: 14,
      fontSize: 13,
      fontWeight: "700",
      color: "#292D31",
    },

    emptyDescription: {
      marginTop: 6,
      fontSize: 9,
      lineHeight: 14,
      color: "#92979E",
      textAlign: "center",
    },

    showAllButton: {
      marginTop: 16,
      minHeight: 40,
      borderRadius: 20,
      paddingHorizontal: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#EDF7FF",
    },

    showAllText: {
      fontSize: 9,
      fontWeight: "600",
      color: "#3976A4",
    },

    bottomSpace: {
      height: 25,
    },
  });