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
  router,
  useFocusEffect,
  type Href,
} from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import API from "../api";

type NotificationFilter =
  | "All"
  | "Unread";

type NotificationGroup =
  | "Today"
  | "Yesterday"
  | "Earlier";

type NotificationType =
  | "review"
  | "urgent"
  | "follow_up"
  | "summary"
  | "reminder"
  | "system"
  | string;

type PopulatedChild = {
  _id?: string;
  id?: string;
  name?: string;
  age?: number;
};

type DoctorNotification = {
  _id: string;
  doctorId?: string;
  childId?:
    | string
    | PopulatedChild
    | null;

  /*
    caseId is not present in the current backend schema,
    but this keeps the screen ready if it is added later.
  */
  caseId?:
    | string
    | null;

  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
};

type NotificationVisuals = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
};

const LOCAL_READ_STORAGE_PREFIX =
  "doctor_read_notification_ids";

const getChildId = (
  notification: DoctorNotification
): string => {
  if (
    typeof notification.childId ===
    "string"
  ) {
    return notification.childId;
  }

  return (
    notification.childId?._id ||
    notification.childId?.id ||
    ""
  );
};

const getChildName = (
  notification: DoctorNotification
): string => {
  if (
    notification.childId &&
    typeof notification.childId ===
      "object"
  ) {
    return (
      notification.childId.name ||
      ""
    );
  }

  return "";
};

const getGroup = (
  createdAt: string
): NotificationGroup => {
  const date =
    new Date(createdAt);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Earlier";
  }

  const now =
    new Date();

  const startOfToday =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

  const startOfYesterday =
    new Date(startOfToday);

  startOfYesterday.setDate(
    startOfYesterday.getDate() - 1
  );

  if (
    date >= startOfToday
  ) {
    return "Today";
  }

  if (
    date >= startOfYesterday
  ) {
    return "Yesterday";
  }

  return "Earlier";
};

const formatTime = (
  createdAt: string
): string => {
  const date =
    new Date(createdAt);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const now =
    new Date();

  const differenceMs =
    now.getTime() -
    date.getTime();

  const minute =
    60 * 1000;

  const hour =
    60 * minute;

  const day =
    24 * hour;

  if (
    differenceMs <
    minute
  ) {
    return "Just now";
  }

  if (
    differenceMs <
    hour
  ) {
    const minutes =
      Math.max(
        1,
        Math.floor(
          differenceMs /
          minute
        )
      );

    return `${minutes} min ago`;
  }

  if (
    differenceMs <
    day
  ) {
    const hours =
      Math.max(
        1,
        Math.floor(
          differenceMs /
          hour
        )
      );

    return `${hours} ${
      hours === 1
        ? "hour"
        : "hours"
    } ago`;
  }

  if (
    getGroup(createdAt) ===
    "Yesterday"
  ) {
    return "Yesterday";
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

const getVisuals = (
  type: NotificationType
): NotificationVisuals => {
  switch (
    String(type).toLowerCase()
  ) {
    case "urgent":
      return {
        icon:
          "alert-circle-outline",
        iconColor:
          "#D85A62",
        iconBackground:
          "#FFF0F1",
      };

    case "review":
      return {
        icon:
          "document-text-outline",
        iconColor:
          "#8B74B8",
        iconBackground:
          "#F2ECFB",
      };

    case "follow_up":
      return {
        icon:
          "calendar-outline",
        iconColor:
          "#B65A61",
        iconBackground:
          "#FFF0F1",
      };

    case "summary":
      return {
        icon:
          "sparkles-outline",
        iconColor:
          "#3976A4",
        iconBackground:
          "#EAF5FD",
      };

    case "reminder":
      return {
        icon:
          "time-outline",
        iconColor:
          "#D28C34",
        iconBackground:
          "#FFF4E5",
      };

    case "system":
      return {
        icon:
          "settings-outline",
        iconColor:
          "#66717C",
        iconBackground:
          "#EEF1F4",
      };

    default:
      return {
        icon:
          "notifications-outline",
        iconColor:
          "#3976A4",
        iconBackground:
          "#EAF5FD",
      };
  }
};

const getErrorMessage = (
  error: unknown
): string => {
  if (
    !axios.isAxiosError(
      error
    )
  ) {
    return (
      "Notifications could not be loaded."
    );
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
    typeof message ===
      "string" &&
    message.trim()
  ) {
    return message;
  }

  return (
    "Notifications could not be loaded."
  );
};

export default function DoctorNotificationsScreen() {
  const [
    selectedFilter,
    setSelectedFilter,
  ] =
    useState<NotificationFilter>(
      "All"
    );

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      DoctorNotification[]
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
    markingAll,
    setMarkingAll,
  ] =
    useState(false);

  const [
    screenError,
    setScreenError,
  ] =
    useState("");

  const getStorageKey =
    useCallback(async () => {
      try {
        const userValue =
          await AsyncStorage.getItem(
            "user"
          );

        if (!userValue) {
          return `${LOCAL_READ_STORAGE_PREFIX}_default`;
        }

        const user =
          JSON.parse(
            userValue
          );

        const doctorId =
          String(
            user?._id ||
            user?.id ||
            "default"
          );

        return `${LOCAL_READ_STORAGE_PREFIX}_${doctorId}`;
      } catch {
        return `${LOCAL_READ_STORAGE_PREFIX}_default`;
      }
    }, []);

  const readLocalReadIds =
    useCallback(async () => {
      try {
        const storageKey =
          await getStorageKey();

        const stored =
          await AsyncStorage.getItem(
            storageKey
          );

        if (!stored) {
          return new Set<string>();
        }

        const parsed =
          JSON.parse(stored);

        if (
          !Array.isArray(
            parsed
          )
        ) {
          return new Set<string>();
        }

        return new Set(
          parsed.filter(
            (
              value
            ): value is string =>
              typeof value ===
              "string"
          )
        );
      } catch {
        return new Set<string>();
      }
    }, [getStorageKey]);

  const saveLocalReadIds =
    useCallback(
      async (
        ids: Set<string>
      ) => {
        try {
          const storageKey =
            await getStorageKey();

          await AsyncStorage.setItem(
            storageKey,
            JSON.stringify(
              Array.from(ids)
            )
          );
        } catch (
          storageError
        ) {
          console.log(
            "SAVE LOCAL READ IDS ERROR:",
            storageError
          );
        }
      },
      [getStorageKey]
    );

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

  const loadNotifications =
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
            response,
            locallyReadIds,
          ] =
            await Promise.all([
              API.get<
                DoctorNotification[]
              >(
                "/doctor/notifications"
              ),

              readLocalReadIds(),
            ]);

          const responseItems =
            Array.isArray(
              response.data
            )
              ? response.data
              : [];

          const mergedItems =
            responseItems.map(
              (
                notification
              ) => ({
                ...notification,

                isRead:
                  Boolean(
                    notification.isRead
                  ) ||
                  locallyReadIds.has(
                    notification._id
                  ),
              })
            );

          setNotifications(
            mergedItems
          );
        } catch (error) {
          console.log(
            "LOAD DOCTOR NOTIFICATIONS ERROR:",
            error
          );

          if (
            axios.isAxiosError(
              error
            ) &&
            error.response
              ?.status ===
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
        readLocalReadIds,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      void loadNotifications(
        "initial"
      );
    }, [loadNotifications])
  );

  const unreadCount =
    useMemo(() => {
      return notifications.filter(
        (
          notification
        ) =>
          !notification.isRead
      ).length;
    }, [notifications]);

  const filteredNotifications =
    useMemo(() => {
      if (
        selectedFilter ===
        "Unread"
      ) {
        return notifications.filter(
          (
            notification
          ) =>
            !notification.isRead
        );
      }

      return notifications;
    }, [
      notifications,
      selectedFilter,
    ]);

  const groupedNotifications =
    useMemo(() => {
      const groups: Record<
        NotificationGroup,
        DoctorNotification[]
      > = {
        Today: [],
        Yesterday: [],
        Earlier: [],
      };

      filteredNotifications.forEach(
        (
          notification
        ) => {
          groups[
            getGroup(
              notification.createdAt
            )
          ].push(
            notification
          );
        }
      );

      return groups;
    }, [
      filteredNotifications,
    ]);

  const markNotificationLocally =
    useCallback(
      async (
        notificationId: string
      ) => {
        setNotifications(
          (
            currentItems
          ) =>
            currentItems.map(
              (
                notification
              ) =>
                notification._id ===
                notificationId
                  ? {
                      ...notification,
                      isRead: true,
                    }
                  : notification
            )
        );

        const readIds =
          await readLocalReadIds();

        readIds.add(
          notificationId
        );

        await saveLocalReadIds(
          readIds
        );
      },
      [
        readLocalReadIds,
        saveLocalReadIds,
      ]
    );

  const markAllAsRead =
    async () => {
      if (
        unreadCount === 0 ||
        markingAll
      ) {
        return;
      }

      try {
        setMarkingAll(true);

        await API.put(
          "/doctor/notifications/mark-all-read"
        );

        setNotifications(
          (
            currentItems
          ) =>
            currentItems.map(
              (
                notification
              ) => ({
                ...notification,
                isRead: true,
              })
            )
        );

        const allIds =
          new Set(
            notifications.map(
              (
                notification
              ) =>
                notification._id
            )
          );

        await saveLocalReadIds(
          allIds
        );
      } catch (error) {
        console.log(
          "MARK ALL NOTIFICATIONS ERROR:",
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
        setMarkingAll(false);
      }
    };

  const handleNotificationPress =
    async (
      notification:
        DoctorNotification
    ) => {
      if (
        !notification.isRead
      ) {
        await markNotificationLocally(
          notification._id
        );
      }

      const childId =
        getChildId(
          notification
        );

      const caseId =
        String(
          notification.caseId ||
          ""
        );

      /*
        The current Notification schema does not contain caseId.
        Review Case supports childId as a fallback and resolves
        the latest case assigned to the signed-in doctor.
      */
      if (
        caseId ||
        childId
      ) {
        router.push(
          {
            pathname:
              "/doctor/review-case",

            params: {
              caseId,
              childId,
            },
          } as Href
        );
      }
    };

  const renderNotification =
    (
      notification:
        DoctorNotification
    ) => {
      const visuals =
        getVisuals(
          notification.type
        );

      const childName =
        getChildName(
          notification
        );

      return (
        <TouchableOpacity
          key={
            notification._id
          }
          activeOpacity={0.82}
          onPress={() =>
            void handleNotificationPress(
              notification
            )
          }
          style={[
            styles.notificationCard,

            !notification.isRead &&
              styles.unreadNotificationCard,
          ]}
        >
          {!notification.isRead ? (
            <View
              style={
                styles.unreadDot
              }
            />
          ) : null}

          <View
            style={[
              styles.notificationIcon,
              {
                backgroundColor:
                  visuals.iconBackground,
              },
            ]}
          >
            <Ionicons
              name={
                visuals.icon
              }
              size={20}
              color={
                visuals.iconColor
              }
            />
          </View>

          <View
            style={
              styles.notificationContent
            }
          >
            <View
              style={
                styles.notificationTopRow
              }
            >
              <Text
                style={[
                  styles.notificationTitle,

                  !notification.isRead &&
                    styles.unreadNotificationTitle,
                ]}
                numberOfLines={1}
              >
                {
                  notification.title
                }
              </Text>

              <Text
                style={
                  styles.notificationTime
                }
              >
                {formatTime(
                  notification.createdAt
                )}
              </Text>
            </View>

            <Text
              style={
                styles.notificationDescription
              }
              numberOfLines={3}
            >
              {
                notification.message
              }
            </Text>

            {childName ? (
              <Text
                style={
                  styles.childLabel
                }
              >
                Child:{" "}
                {childName}
              </Text>
            ) : null}
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color="#A7ABB0"
            style={
              styles.chevronIcon
            }
          />
        </TouchableOpacity>
      );
    };

  const renderSection =
    (
      title:
        NotificationGroup,
      items:
        DoctorNotification[]
    ) => {
      if (
        items.length === 0
      ) {
        return null;
      }

      return (
        <View
          style={styles.section}
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              {title}
            </Text>

            <Text
              style={
                styles.sectionCount
              }
            >
              {items.length}
            </Text>
          </View>

          {items.map(
            renderNotification
          )}
        </View>
      );
    };

  const hasNoNotifications =
    filteredNotifications
      .length === 0;

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
        style={styles.background}
      >
        <View
          style={styles.container}
        >
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

            <View
              style={
                styles.headerContent
              }
            >
              <Text
                style={
                  styles.pageTitle
                }
              >
                Notifications
              </Text>

              <Text
                style={
                  styles.pageSubtitle
                }
              >
                {unreadCount > 0
                  ? `${unreadCount} unread ${
                      unreadCount === 1
                        ? "notification"
                        : "notifications"
                    }`
                  : "You’re all caught up"}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                void markAllAsRead()
              }
              disabled={
                unreadCount === 0 ||
                markingAll
              }
              style={
                styles.markAllButton
              }
            >
              {markingAll ? (
                <ActivityIndicator
                  size="small"
                  color="#5E88A7"
                />
              ) : (
                <Text
                  style={[
                    styles.markAllText,

                    unreadCount === 0 &&
                      styles.markAllTextDisabled,
                  ]}
                >
                  Mark all as read
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View
            style={
              styles.filtersContainer
            }
          >
            {(
              [
                "All",
                "Unread",
              ] as NotificationFilter[]
            ).map(
              (
                filter
              ) => {
                const count =
                  filter === "All"
                    ? notifications.length
                    : unreadCount;

                const active =
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

                      active &&
                        styles.filterButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,

                        active &&
                          styles.filterTextActive,
                      ]}
                    >
                      {filter}
                    </Text>

                    <View
                      style={
                        styles.filterCount
                      }
                    >
                      <Text
                        style={
                          styles.filterCountText
                        }
                      >
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }
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
                  void loadNotifications(
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
                Loading notifications...
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
              refreshControl={
                <RefreshControl
                  refreshing={
                    refreshing
                  }
                  onRefresh={() =>
                    void loadNotifications(
                      "refresh"
                    )
                  }
                  tintColor="#6799C2"
                />
              }
            >
              {hasNoNotifications ? (
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
                      name="notifications-off-outline"
                      size={32}
                      color="#78ACD5"
                    />
                  </View>

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    {selectedFilter ===
                    "Unread"
                      ? "No unread notifications"
                      : "No notifications yet"}
                  </Text>

                  <Text
                    style={
                      styles.emptyDescription
                    }
                  >
                    New AI-analyzed cases assigned to you will appear here.
                  </Text>

                  {selectedFilter ===
                  "Unread" ? (
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
                          styles.showAllButtonText
                        }
                      >
                        Show all notifications
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <>
                  {renderSection(
                    "Today",
                    groupedNotifications.Today
                  )}

                  {renderSection(
                    "Yesterday",
                    groupedNotifications.Yesterday
                  )}

                  {renderSection(
                    "Earlier",
                    groupedNotifications.Earlier
                  )}
                </>
              )}

              <View
                style={
                  styles.bottomSpace
                }
              />
            </ScrollView>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
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

    markAllButton: {
      minWidth: 88,
      minHeight: 32,
      alignItems: "flex-end",
      justifyContent: "center",
      paddingLeft: 8,
    },

    markAllText: {
      fontSize: 8.5,
      fontWeight: "600",
      color: "#5E88A7",
    },

    markAllTextDisabled: {
      color: "#B8BCC0",
    },

    filtersContainer: {
      flexDirection: "row",
      paddingHorizontal: 18,
      marginTop: 5,
      marginBottom: 15,
      gap: 8,
    },

    filterButton: {
      minWidth: 83,
      height: 34,
      borderRadius: 999,
      paddingHorizontal: 13,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F2F0F5",
    },

    filterButtonActive: {
      backgroundColor: "#F5C1C5",
    },

    filterText: {
      fontSize: 9.5,
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
      marginLeft: 6,
      paddingHorizontal: 4,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
    },

    filterCountText: {
      fontSize: 7.5,
      fontWeight: "600",
      color: "#6A5558",
    },

    errorBanner: {
      marginHorizontal: 18,
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
      paddingHorizontal: 18,
      paddingBottom: 30,
    },

    section: {
      marginBottom: 17,
    },

    sectionHeader: {
      minHeight: 30,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 7,
    },

    sectionTitle: {
      fontSize: 13,
      fontWeight: "500",
      color: "#373B3F",
    },

    sectionCount: {
      marginLeft: 7,
      fontSize: 8,
      color: "#999EA4",
    },

    notificationCard: {
      position: "relative",
      minHeight: 88,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#E7E9EB",
      backgroundColor: "#FFFFFF",
      marginBottom: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "flex-start",
      shadowColor: "#9DA6AD",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 1,
    },

    unreadNotificationCard: {
      backgroundColor: "#FBFDFF",
      borderColor: "#DCEAF4",
    },

    unreadDot: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "#78B7E5",
    },

    notificationIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 11,
    },

    notificationContent: {
      flex: 1,
      paddingRight: 6,
    },

    notificationTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },

    notificationTitle: {
      flex: 1,
      paddingRight: 8,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "600",
      color: "#3E4348",
    },

    unreadNotificationTitle: {
      fontWeight: "700",
      color: "#24282C",
    },

    notificationTime: {
      marginTop: 1,
      paddingRight: 8,
      fontSize: 8,
      color: "#92979E",
    },

    notificationDescription: {
      marginTop: 5,
      fontSize: 9.5,
      lineHeight: 14,
      color: "#60666C",
    },

    childLabel: {
      marginTop: 6,
      fontSize: 8,
      fontWeight: "600",
      color: "#7B8FA0",
    },

    chevronIcon: {
      alignSelf: "center",
      marginLeft: 3,
    },

    emptyState: {
      alignItems: "center",
      paddingHorizontal: 35,
      paddingTop: 80,
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
      fontSize: 14,
      fontWeight: "700",
      color: "#292D31",
    },

    emptyDescription: {
      marginTop: 7,
      fontSize: 9.5,
      lineHeight: 15,
      color: "#92979E",
      textAlign: "center",
    },

    showAllButton: {
      height: 40,
      borderRadius: 20,
      marginTop: 18,
      paddingHorizontal: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#EDF7FF",
    },

    showAllButtonText: {
      fontSize: 9.5,
      fontWeight: "600",
      color: "#5E88A7",
    },

    bottomSpace: {
      height: 15,
    },
  });
