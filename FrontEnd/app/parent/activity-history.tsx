import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
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
  router,
  useFocusEffect,
} from "expo-router";

import {
  Feather,
  Ionicons,
} from "@expo/vector-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import API from "../api";

type ActivityStatus =
  | "Pending Review"
  | "Reviewed"
  | "Closed";

type ActivityItem = {
  id: string;
  caseId: string;
  childId: string;
  childName: string;
  childAge: number;
  childGender?: string;
  date: string;
  rawDate: string;
  timestamp: number;
  type: string;
  emotion: string;
  description: string;
  status: ActivityStatus;
  confidence: number;
  avatarColor: string;
};

type Child = {
  _id: string;
  name: string;
  age: number;
  gender?: string;
};

type BackendEntry = {
  id?: string;
  caseId?: string;
  date?: string;
  type?: string;
  emotion?: string;
  description?: string;
  status?: string;
  confidence?: number;
  doctorResponseExists?: boolean;
  imageUrl?: string;
  audioUrl?: string;
};

type ChildEntriesResponse = {
  childInfo?: Child;
  counts?: {
    all?: number;
    pending?: number;
    reviewed?: number;
    closed?: number;
  };
  entries?: BackendEntry[];
};

const STATUS_COLORS: Record<
  ActivityStatus,
  string
> = {
  "Pending Review": "#FBC0BF",
  Reviewed: "#B8F0C8",
  Closed: "#D0D8F0",
};

const STATUS_TEXT_COLORS: Record<
  ActivityStatus,
  string
> = {
  "Pending Review": "#C0504D",
  Reviewed: "#2E7D32",
  Closed: "#5C6BC0",
};

const FILTERS = [
  "All Children",
  "All Statuses",
  "Last 30 Days",
] as const;

type FilterName =
  (typeof FILTERS)[number];

const normalizeStatus = (
  status?: string
): ActivityStatus => {
  const normalized =
    String(status || "")
      .trim()
      .toLowerCase();

  if (normalized === "closed") {
    return "Closed";
  }

  if (
    normalized === "reviewed" ||
    normalized === "improving"
  ) {
    return "Reviewed";
  }

  return "Pending Review";
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
};

const getErrorMessage = (
  error: unknown
): string => {
  if (
    axios.isAxiosError(error)
  ) {
    const data =
      error.response?.data as
        | {
            msg?: unknown;
            message?: unknown;
            error?: unknown;
          }
        | undefined;

    const message =
      data?.msg ??
      data?.message ??
      data?.error;

    if (
      typeof message === "string" &&
      message.trim()
    ) {
      return message;
    }
  }

  return "Failed to load activity history.";
};

export default function ActivityHistory() {
  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<FilterName>(
      "All Children"
    );

  const [
    children,
    setChildren,
  ] =
    useState<Child[]>([]);

  const [
    activities,
    setActivities,
  ] =
    useState<ActivityItem[]>(
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

  const [
    showEntryChildPicker,
    setShowEntryChildPicker,
  ] =
    useState(false);

  const [
    showSearchModal,
    setShowSearchModal,
  ] =
    useState(false);

  const [
    searchQuery,
    setSearchQuery,
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
        "/auth/login" as any
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
          const childrenResponse =
            await API.get<Child[]>(
              "/children/all"
            );

          const childrenData =
            Array.isArray(
              childrenResponse.data
            )
              ? childrenResponse.data
              : [];

          setChildren(
            childrenData
          );

          if (
            childrenData.length ===
            0
          ) {
            setActivities([]);
            return;
          }

          const entryResponses =
            await Promise.all(
              childrenData.map(
                (
                  child
                ) =>
                  API.get<ChildEntriesResponse>(
                    `/children/${child._id}/entries`
                  )
              )
            );

          const combinedActivities:
            ActivityItem[] =
              [];

          entryResponses.forEach(
            (
              response,
              responseIndex
            ) => {
              const fallbackChild =
                childrenData[
                  responseIndex
                ];

              const child =
                response.data
                  ?.childInfo ||
                fallbackChild;

              const entries =
                Array.isArray(
                  response.data
                    ?.entries
                )
                  ? response.data
                      .entries
                  : [];

              entries.forEach(
                (
                  entry,
                  entryIndex
                ) => {
                  const rawDate =
                    entry.date ||
                    "";

                  const timestamp =
                    rawDate
                      ? new Date(
                          rawDate
                        ).getTime()
                      : 0;

                  combinedActivities.push(
                    {
                      id:
                        entry.id ||
                        `${child._id}-${entryIndex}`,

                      caseId:
                        entry.caseId ||
                        "",

                      childId:
                        child._id,

                      childName:
                        child.name ||
                        "Child",

                      childAge:
                        Number(
                          child.age ||
                          0
                        ),

                      childGender:
                        child.gender,

                      date:
                        formatDate(
                          rawDate
                        ),

                      rawDate,

                      timestamp:
                        Number.isFinite(
                          timestamp
                        )
                          ? timestamp
                          : 0,

                      type:
                        entry.type ||
                        "Entry",

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
                          entry.confidence ||
                          0
                        ),

                      avatarColor:
                        String(
                          child.gender ||
                          ""
                        )
                          .toLowerCase()
                          .includes(
                            "female"
                          )
                          ? "#FBC0BF"
                          : "#B9D8F6",
                    }
                  );
                }
              );
            }
          );

          combinedActivities.sort(
            (
              first,
              second
            ) =>
              second.timestamp -
              first.timestamp
          );

          setActivities(
            combinedActivities
          );
        } catch (error) {
          console.log(
            "ACTIVITY HISTORY ERROR:",
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

  const filteredActivities =
    useMemo(() => {
      if (
        activeFilter !==
        "Last 30 Days"
      ) {
        return activities;
      }

      const cutoff =
        new Date();

      cutoff.setDate(
        cutoff.getDate() -
          30
      );

      return activities.filter(
        (
          activity
        ) =>
          activity.timestamp >=
          cutoff.getTime()
      );
    }, [
      activities,
      activeFilter,
    ]);

  const filteredChildren =
    useMemo(() => {
      const normalizedQuery =
        searchQuery
          .trim()
          .toLowerCase();

      if (
        !normalizedQuery
      ) {
        return children;
      }

      return children.filter(
        (
          child
        ) =>
          child.name
            .toLowerCase()
            .includes(
              normalizedQuery
            )
      );
    }, [
      children,
      searchQuery,
    ]);

  const openActivityDetails = (
    item: ActivityItem
  ) => {
    const childEntryCount =
      activities.filter(
        (
          activity
        ) =>
          activity.childId ===
          item.childId
      ).length;

    router.push(
      {
        pathname:
          "/parent/activity-details",

        params: {
          activityId:
            item.id,

          caseId:
            item.caseId,

          childId:
            item.childId,

          childName:
            item.childName,

          childAge:
            String(
              item.childAge
            ),

          date:
            item.date,

          rawDate:
            item.rawDate,

          type:
            item.type,

          emotion:
            item.emotion,

          description:
            item.description,

          status:
            item.status,

          confidence:
            String(
              item.confidence
            ),

          entryCount:
            String(
              childEntryCount
            ),
        },
      } as any
    );
  };

  const openAddEntryForChild = (
    child: Child
  ) => {
    setShowEntryChildPicker(
      false
    );

    router.push(
      {
        pathname:
          "/parent/ai-chat",

        params: {
          childId:
            child._id,

          childName:
            child.name,

          childAge:
            String(
              child.age
            ),
        },
      } as any
    );
  };

  const openChildProfile = (
    child: Child
  ) => {
    setShowSearchModal(
      false
    );

    setSearchQuery("");

    router.push(
      {
        pathname:
          "/parent/childProfile",

        params: {
          childId:
            child._id,

          childName:
            child.name,

          childAge:
            String(
              child.age
            ),
        },
      } as any
    );
  };

  const showAddChildAlert = (
    message: string
  ) => {
    Alert.alert(
      "Add a child first",
      message,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Add Child",
          onPress: () =>
            router.push(
              "/parent/add-child"
            ),
        },
      ]
    );
  };

  const handleAddEntryPress =
    () => {
      if (loading) {
        return;
      }

      if (screenError) {
        void loadHistory(
          "refresh"
        );
        return;
      }

      if (
        children.length ===
        0
      ) {
        showAddChildAlert(
          "You need to add a child profile before adding an entry."
        );
        return;
      }

      if (
        children.length ===
        1
      ) {
        openAddEntryForChild(
          children[0]
        );
        return;
      }

      setShowEntryChildPicker(
        true
      );
    };

  const handleSearchPress =
    () => {
      if (loading) {
        return;
      }

      if (
        children.length ===
        0
      ) {
        showAddChildAlert(
          "You need to add a child profile before searching."
        );
        return;
      }

      setSearchQuery("");
      setShowSearchModal(
        true
      );
    };

  const getChildIcon = (
    child: Child
  ) => {
    const gender =
      child.gender
        ?.toLowerCase();

    if (
      gender === "female"
    ) {
      return "female";
    }

    if (
      gender === "male"
    ) {
      return "male";
    }

    return "happy-outline";
  };

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      <View
        style={
          styles.container
        }
      >
        <View
          style={
            styles.topGradientWrapper
          }
        >
          <LinearGradient
            colors={[
              "rgba(185,216,246,0.35)",
              "rgba(255,255,255,0.10)",
              "rgba(251,192,191,0.35)",
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
              y: 0,
            }}
            style={
              StyleSheet.absoluteFillObject
            }
          />

          <LinearGradient
            colors={[
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.6)",
              "rgba(255,255,255,1)",
            ]}
            locations={[
              0,
              0.6,
              1,
            ]}
            start={{
              x: 0,
              y: 0,
            }}
            end={{
              x: 0,
              y: 1,
            }}
            style={
              StyleSheet.absoluteFillObject
            }
          />
        </View>

        <View
          style={
            styles.header
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            Activity History
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            Track All Previous Analyses And Updates
          </Text>
        </View>

        <View
          style={
            styles.filterRow
          }
        >
          {FILTERS.map(
            (
              filter
            ) => (
              <TouchableOpacity
                key={
                  filter
                }
                activeOpacity={0.7}
                onPress={() =>
                  setActiveFilter(
                    filter
                  )
                }
                style={
                  styles.filterTab
                }
              >
                <Text
                  style={[
                    styles.filterText,

                    activeFilter ===
                      filter &&
                      styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>

                {activeFilter ===
                filter ? (
                  <View
                    style={
                      styles.filterUnderline
                    }
                  />
                ) : null}
              </TouchableOpacity>
            )
          )}
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

        {loading ? (
          <View
            style={
              styles.loadingState
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
              Loading activity history...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={
              styles.list
            }
            contentContainerStyle={
              styles.listContent
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
                tintColor="#7BB8E8"
              />
            }
          >
            {filteredActivities.length >
            0 ? (
              filteredActivities.map(
                (
                  item
                ) => (
                  <TouchableOpacity
                    key={`${item.caseId}-${item.id}`}
                    activeOpacity={0.88}
                    style={
                      styles.card
                    }
                    onPress={() =>
                      openActivityDetails(
                        item
                      )
                    }
                  >
                    <View
                      style={
                        styles.cardHeader
                      }
                    >
                      <View
                        style={
                          styles.cardLeft
                        }
                      >
                        <View
                          style={[
                            styles.avatar,

                            {
                              backgroundColor:
                                item.avatarColor,
                            },
                          ]}
                        >
                          <Ionicons
                            name="happy"
                            size={22}
                            color="#FFFFFF"
                          />
                        </View>

                        <View>
                          <Text
                            style={
                              styles.childName
                            }
                          >
                            {
                              item.childName
                            }
                          </Text>

                          <Text
                            style={
                              styles.dateText
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
                              STATUS_COLORS[
                                item.status
                              ] +
                              "55",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,

                            {
                              color:
                                STATUS_TEXT_COLORS[
                                  item.status
                                ],
                            },
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={
                        styles.typeText
                      }
                    >
                      {item.type} ·{" "}
                      <Text
                        style={
                          styles.emotionText
                        }
                      >
                        {item.emotion}
                      </Text>
                    </Text>

                    <Text
                      style={
                        styles.descText
                      }
                      numberOfLines={4}
                    >
                      {
                        item.description
                      }
                    </Text>

                    <View
                      style={
                        styles.cardFooter
                      }
                    >
                      <Text
                        style={
                          styles.viewDetailsText
                        }
                      >
                        View Details
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={17}
                        color="#7BB8E8"
                      />
                    </View>
                  </TouchableOpacity>
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
                    name="document-text-outline"
                    size={31}
                    color="#7BB8E8"
                  />
                </View>

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No activities yet
                </Text>

                <Text
                  style={
                    styles.emptyDescription
                  }
                >
                  New text, drawing and voice analyses will appear here after you add entries for your children.
                </Text>
              </View>
            )}

            <View
              style={
                styles.listBottomSpace
              }
            />
          </ScrollView>
        )}

        <View
          style={
            styles.bottomNav
          }
        >
          <TouchableOpacity
            activeOpacity={0.7}
            style={
              styles.navItem
            }
            onPress={() =>
              router.push(
                "/parent/parentHome"
              )
            }
          >
            <Feather
              name="home"
              size={20}
              color="#999"
            />

            <Text
              style={
                styles.navText
              }
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={
              styles.navItem
            }
          >
            <Feather
              name="list"
              size={20}
              color="#222"
            />

            <Text
              style={[
                styles.navText,
                styles.activeNavText,
              ]}
            >
              History
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={
              styles.centerButtonWrapper
            }
            onPress={
              handleAddEntryPress
            }
            disabled={
              loading
            }
          >
            <LinearGradient
              colors={[
                "#B9D8F6",
                "#FBC0BF",
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 0,
              }}
              style={
                styles.centerButton
              }
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Ionicons
                  name="add"
                  size={28}
                  color="#FFFFFF"
                />
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={
              styles.navItem
            }
            onPress={
              handleSearchPress
            }
            disabled={
              loading
            }
          >
            <Feather
              name="search"
              size={20}
              color="#999"
            />

            <Text
              style={
                styles.navText
              }
            >
              Search
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={
              styles.navItem
            }
            onPress={() =>
              router.push(
                "/parent/profile"
              )
            }
          >
            <Feather
              name="user"
              size={20}
              color="#999"
            />

            <Text
              style={
                styles.navText
              }
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={
            showEntryChildPicker
          }
          transparent
          animationType="fade"
          onRequestClose={() =>
            setShowEntryChildPicker(
              false
            )
          }
        >
          <View
            style={
              styles.modalOverlay
            }
          >
            <Pressable
              style={
                StyleSheet.absoluteFillObject
              }
              onPress={() =>
                setShowEntryChildPicker(
                  false
                )
              }
            />

            <View
              style={
                styles.childPickerContainer
              }
            >
              <View
                style={
                  styles.modalHandle
                }
              />

              <View
                style={
                  styles.modalHeader
                }
              >
                <View
                  style={
                    styles.modalTitleRow
                  }
                >
                  <View
                    style={
                      styles.modalAddIcon
                    }
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color="#4C8DBF"
                    />
                  </View>

                  <View
                    style={
                      styles.modalTitleContent
                    }
                  >
                    <Text
                      style={
                        styles.modalTitle
                      }
                    >
                      Add an entry for
                    </Text>

                    <Text
                      style={
                        styles.modalSubtitle
                      }
                    >
                      Select a child to add a new emotional update.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    setShowEntryChildPicker(
                      false
                    )
                  }
                  style={
                    styles.modalCloseButton
                  }
                >
                  <Ionicons
                    name="close"
                    size={21}
                    color="#555"
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={
                  styles.modalChildrenList
                }
                showsVerticalScrollIndicator={
                  false
                }
              >
                {children.map(
                  (
                    child,
                    index
                  ) => (
                    <TouchableOpacity
                      key={
                        child._id
                      }
                      activeOpacity={0.8}
                      onPress={() =>
                        openAddEntryForChild(
                          child
                        )
                      }
                      style={
                        styles.modalChildItem
                      }
                    >
                      <View
                        style={[
                          styles.modalChildAvatar,

                          {
                            backgroundColor:
                              index %
                                2 ===
                              0
                                ? "rgba(251,192,191,0.45)"
                                : "rgba(185,216,246,0.55)",
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            getChildIcon(
                              child
                            )
                          }
                          size={22}
                          color="#333"
                        />
                      </View>

                      <View
                        style={
                          styles.modalChildInfo
                        }
                      >
                        <Text
                          style={
                            styles.modalChildName
                          }
                        >
                          {child.name}
                        </Text>

                        <Text
                          style={
                            styles.modalChildAge
                          }
                        >
                          {child.age} years old
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={21}
                        color="#999"
                      />
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  setShowEntryChildPicker(
                    false
                  )
                }
                style={
                  styles.cancelModalButton
                }
              >
                <Text
                  style={
                    styles.cancelModalText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={
            showSearchModal
          }
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowSearchModal(
              false
            );
            setSearchQuery("");
          }}
        >
          <View
            style={
              styles.modalOverlay
            }
          >
            <Pressable
              style={
                StyleSheet.absoluteFillObject
              }
              onPress={() => {
                setShowSearchModal(
                  false
                );
                setSearchQuery("");
              }}
            />

            <View
              style={
                styles.searchModalContainer
              }
            >
              <View
                style={
                  styles.modalHandle
                }
              />

              <View
                style={
                  styles.modalHeader
                }
              >
                <View
                  style={
                    styles.modalTitleRow
                  }
                >
                  <View
                    style={
                      styles.modalSearchIcon
                    }
                  >
                    <Feather
                      name="search"
                      size={19}
                      color="#4C8DBF"
                    />
                  </View>

                  <View
                    style={
                      styles.modalTitleContent
                    }
                  >
                    <Text
                      style={
                        styles.modalTitle
                      }
                    >
                      Search Children
                    </Text>

                    <Text
                      style={
                        styles.modalSubtitle
                      }
                    >
                      Search by name to open a child profile.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowSearchModal(
                      false
                    );
                    setSearchQuery("");
                  }}
                  style={
                    styles.modalCloseButton
                  }
                >
                  <Ionicons
                    name="close"
                    size={21}
                    color="#555"
                  />
                </TouchableOpacity>
              </View>

              <View
                style={
                  styles.searchInputContainer
                }
              >
                <Feather
                  name="search"
                  size={18}
                  color="#8A8A8A"
                />

                <TextInput
                  value={
                    searchQuery
                  }
                  onChangeText={
                    setSearchQuery
                  }
                  placeholder="Search by child name"
                  placeholderTextColor="#AAAAAA"
                  style={
                    styles.searchInput
                  }
                  autoCapitalize="none"
                  autoCorrect={
                    false
                  }
                  autoFocus
                  returnKeyType="search"
                />

                {searchQuery.length >
                0 ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      setSearchQuery(
                        ""
                      )
                    }
                    style={
                      styles.clearSearchButton
                    }
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color="#AAAAAA"
                    />
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView
                style={
                  styles.searchResultsList
                }
                contentContainerStyle={
                  styles.searchResultsContent
                }
                showsVerticalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="handled"
              >
                {filteredChildren.length >
                0 ? (
                  filteredChildren.map(
                    (
                      child,
                      index
                    ) => (
                      <TouchableOpacity
                        key={
                          child._id
                        }
                        activeOpacity={0.8}
                        onPress={() =>
                          openChildProfile(
                            child
                          )
                        }
                        style={
                          styles.modalChildItem
                        }
                      >
                        <View
                          style={[
                            styles.modalChildAvatar,

                            {
                              backgroundColor:
                                index %
                                  2 ===
                                0
                                  ? "rgba(251,192,191,0.45)"
                                  : "rgba(185,216,246,0.55)",
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              getChildIcon(
                                child
                              )
                            }
                            size={22}
                            color="#333"
                          />
                        </View>

                        <View
                          style={
                            styles.modalChildInfo
                          }
                        >
                          <Text
                            style={
                              styles.modalChildName
                            }
                          >
                            {child.name}
                          </Text>

                          <Text
                            style={
                              styles.modalChildAge
                            }
                          >
                            {child.age} years old
                          </Text>
                        </View>

                        <Ionicons
                          name="chevron-forward"
                          size={21}
                          color="#999"
                        />
                      </TouchableOpacity>
                    )
                  )
                ) : (
                  <View
                    style={
                      styles.emptySearchContainer
                    }
                  >
                    <View
                      style={
                        styles.emptySearchIcon
                      }
                    >
                      <Feather
                        name="search"
                        size={25}
                        color="#7BB8E8"
                      />
                    </View>

                    <Text
                      style={
                        styles.emptySearchTitle
                      }
                    >
                      No children found
                    </Text>

                    <Text
                      style={
                        styles.emptySearchText
                      }
                    >
                      Try searching with a different name.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  topGradientWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    overflow: "hidden",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    zIndex: 2,
  },

  headerTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 10.5,
    lineHeight: 16,
    color: "#9A9A9A",
  },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    zIndex: 2,
    gap: 20,
  },

  filterTab: {
    alignItems: "center",
    paddingBottom: 6,
  },

  filterText: {
    fontSize: 9.5,
    color: "#9A9A9A",
    fontWeight: "500",
  },

  filterTextActive: {
    color: "#222",
    fontWeight: "600",
  },

  filterUnderline: {
    marginTop: 4,
    height: 2,
    width: "100%",
    backgroundColor: "#FBC0BF",
    borderRadius: 2,
  },

  errorBanner: {
    marginHorizontal: 16,
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
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 95,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 10,
    color: "#8A8A8A",
  },

  list: {
    flex: 1,
    paddingHorizontal: 16,
  },

  listContent: {
    flexGrow: 1,
    paddingTop: 4,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },

  childName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },

  dateText: {
    fontSize: 8.5,
    color: "#9A9A9A",
    marginTop: 2,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 7.5,
    fontWeight: "500",
  },

  typeText: {
    fontSize: 9.5,
    color: "#7BB8E8",
    fontWeight: "500",
    marginBottom: 8,
  },

  emotionText: {
    color: "#7BB8E8",
  },

  descText: {
    fontSize: 9.5,
    color: "#555",
    lineHeight: 14,
  },

  cardFooter: {
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },

  viewDetailsText: {
    fontSize: 8.5,
    fontWeight: "600",
    color: "#7BB8E8",
  },

  emptyState: {
    flex: 1,
    minHeight: 350,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
    paddingBottom: 80,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF6FD",
  },

  emptyTitle: {
    marginTop: 13,
    fontSize: 14,
    fontWeight: "700",
    color: "#222222",
  },

  emptyDescription: {
    marginTop: 7,
    maxWidth: 290,
    fontSize: 9.5,
    lineHeight: 15,
    color: "#8A8A8A",
    textAlign: "center",
  },

  listBottomSpace: {
    height: 110,
  },

  bottomNav: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    height: 78,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    paddingHorizontal: 8,
    zIndex: 3,
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 55,
  },

  navText: {
    fontSize: 9,
    color: "#999",
    marginTop: 4,
  },

  activeNavText: {
    color: "#222",
    fontWeight: "600",
  },

  centerButtonWrapper: {
    marginTop: -30,
  },

  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor:
      "rgba(20,25,35,0.35)",
  },

  childPickerContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: "72%",
  },

  searchModalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    height: "72%",
  },

  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D9D9D9",
    marginBottom: 20,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  modalTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingRight: 10,
  },

  modalAddIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EDF6FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  modalSearchIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EDF6FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  modalTitleContent: {
    flex: 1,
  },

  modalTitle: {
    fontSize: 14,
    lineHeight: 19,
    color: "#222",
    fontWeight: "700",
  },

  modalSubtitle: {
    marginTop: 4,
    fontSize: 9.5,
    lineHeight: 14,
    color: "#8A8A8A",
  },

  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },

  modalChildrenList: {
    maxHeight: 310,
  },

  modalChildItem: {
    minHeight: 68,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    paddingHorizontal: 13,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  modalChildAvatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  modalChildInfo: {
    flex: 1,
  },

  modalChildName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#222",
  },

  modalChildAge: {
    marginTop: 3,
    fontSize: 8.5,
    color: "#8A8A8A",
  },

  cancelModalButton: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 9,
  },

  cancelModalText: {
    fontSize: 9.5,
    color: "#555",
    fontWeight: "600",
  },

  searchInputContainer: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EA",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  searchInput: {
    flex: 1,
    height: 46,
    marginLeft: 9,
    paddingVertical: 0,
    fontSize: 10.5,
    color: "#222222",
  },

  clearSearchButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  searchResultsList: {
    flex: 1,
  },

  searchResultsContent: {
    paddingBottom: 10,
  },

  emptySearchContainer: {
    minHeight: 230,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  emptySearchIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#EDF6FD",
    alignItems: "center",
    justifyContent: "center",
  },

  emptySearchTitle: {
    marginTop: 13,
    fontSize: 13,
    fontWeight: "700",
    color: "#222222",
  },

  emptySearchText: {
    marginTop: 6,
    fontSize: 9.5,
    lineHeight: 14,
    color: "#8A8A8A",
    textAlign: "center",
  },
});
