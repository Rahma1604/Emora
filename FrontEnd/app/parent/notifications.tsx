import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Modal,
  Pressable,
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
} from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import API from "../api";

type IoniconName =
  keyof typeof Ionicons.glyphMap;

type NotificationFilter =
  | "All"
  | "Unread";

type NotificationGroup =
  | "Today"
  | "Yesterday"
  | "Earlier";

type NotificationTarget =
  | "activity"
  | "progress"
  | "add-entry"
  | "privacy"
  | "none";

type ActivityFocusSection =
  | "analysis"
  | "doctor-response";

type BackendChild = {
  _id?: string;
  id?: string;
  name?: string;
  age?: number | string;
  gender?: string;
};

type BackendNotification = {
  _id?: string;
  id?: string;

  title?: string;
  message?: string;
  description?: string;

  type?: string;
  target?: string;
  focusSection?: string;

  isRead?: boolean;
  read?: boolean;

  createdAt?: string;
  updatedAt?: string;

  childId?:
    | string
    | BackendChild
    | null;

  caseId?: string;
  entryId?: string;
  activityId?: string;

  status?: string;
  emotion?: string;

  metadata?: {
    caseId?: string;
    entryId?: string;
    activityId?: string;
    emotion?: string;
    status?: string;
    activityType?: string;
    [key: string]: unknown;
  };

  [key: string]: unknown;
};

type NotificationItem = {
  id: string;

  title: string;
  description: string;

  time: string;
  group: NotificationGroup;
  read: boolean;

  icon: IoniconName;
  iconColor: string;
  iconBackground: string;

  target: NotificationTarget;
  focusSection?: ActivityFocusSection;

  childId?: string;
  childName?: string;
  childAge?: string;

  caseId?: string;
  activityId?: string;
  activityDate?: string;
  activityType?: string;
  emotion?: string;
  activityDescription?: string;

  status?:
    | "Pending Review"
    | "Reviewed"
    | "Closed";

  createdAtTimestamp: number;
};

const getErrorMessage = (
  error: unknown
): string => {
  if (
    axios.isAxiosError(error)
  ) {
    const responseData =
      error.response?.data as
        | {
            message?: unknown;
            error?: unknown;
            msg?: unknown;
          }
        | undefined;

    const message =
      responseData?.message ??
      responseData?.error ??
      responseData?.msg;

    if (
      typeof message === "string" &&
      message.trim()
    ) {
      return message;
    }

    if (
      typeof error.message === "string" &&
      error.message.trim()
    ) {
      return error.message;
    }
  }

  return "Could not load notifications.";
};

const getChildId = (
  value:
    | BackendNotification["childId"]
): string => {
  if (
    typeof value === "string"
  ) {
    return value;
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return (
      value._id ||
      value.id ||
      ""
    );
  }

  return "";
};

const getNotificationDate = (
  value?: string
): Date | null => {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
};

const isSameCalendarDay = (
  firstDate: Date,
  secondDate: Date
): boolean => {
  return (
    firstDate.getFullYear() ===
      secondDate.getFullYear() &&
    firstDate.getMonth() ===
      secondDate.getMonth() &&
    firstDate.getDate() ===
      secondDate.getDate()
  );
};

const getNotificationGroup = (
  createdAt?: string
): NotificationGroup => {
  const date =
    getNotificationDate(
      createdAt
    );

  if (!date) {
    return "Earlier";
  }

  const now =
    new Date();

  if (
    isSameCalendarDay(
      date,
      now
    )
  ) {
    return "Today";
  }

  const yesterday =
    new Date(now);

  yesterday.setDate(
    now.getDate() - 1
  );

  if (
    isSameCalendarDay(
      date,
      yesterday
    )
  ) {
    return "Yesterday";
  }

  return "Earlier";
};

const getNotificationTime = (
  createdAt?: string
): string => {
  const date =
    getNotificationDate(
      createdAt
    );

  if (!date) {
    return "";
  }

  const now =
    new Date();

  const difference =
    Math.max(
      0,
      now.getTime() -
        date.getTime()
    );

  const minutes =
    Math.floor(
      difference /
        60000
    );

  if (
    isSameCalendarDay(
      date,
      now
    )
  ) {
    if (
      minutes < 1
    ) {
      return "Just now";
    }

    if (
      minutes < 60
    ) {
      return `${minutes} min ago`;
    }

    const hours =
      Math.floor(
        minutes / 60
      );

    return `${hours} ${
      hours === 1
        ? "hour"
        : "hours"
    } ago`;
  }

  const yesterday =
    new Date(now);

  yesterday.setDate(
    now.getDate() - 1
  );

  if (
    isSameCalendarDay(
      date,
      yesterday
    )
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

const getNotificationVisual = (
  typeValue?: string,
  titleValue?: string
): {
  icon: IoniconName;
  iconColor: string;
  iconBackground: string;
} => {
  const value =
    `${typeValue || ""} ${
      titleValue || ""
    }`
      .trim()
      .toLowerCase();

  if (
    value.includes(
      "recommend"
    ) ||
    value.includes(
      "review"
    ) ||
    value.includes(
      "response"
    )
  ) {
    return {
      icon:
        "checkmark-circle-outline",
      iconColor:
        "#4D9A66",
      iconBackground:
        "#E7F7EC",
    };
  }

  if (
    value.includes(
      "analysis"
    ) ||
    value.includes(
      "ai"
    )
  ) {
    return {
      icon:
        "sparkles-outline",
      iconColor:
        "#3976A4",
      iconBackground:
        "#EAF5FD",
    };
  }

  if (
    value.includes(
      "progress"
    ) ||
    value.includes(
      "improv"
    )
  ) {
    return {
      icon:
        "trending-up-outline",
      iconColor:
        "#4D9A66",
      iconBackground:
        "#E7F7EC",
    };
  }

  if (
    value.includes(
      "reminder"
    ) ||
    value.includes(
      "check"
    )
  ) {
    return {
      icon:
        "calendar-outline",
      iconColor:
        "#B65A61",
      iconBackground:
        "#FFF0F1",
    };
  }

  if (
    value.includes(
      "privacy"
    )
  ) {
    return {
      icon:
        "shield-checkmark-outline",
      iconColor:
        "#3976A4",
      iconBackground:
        "#EAF5FD",
    };
  }

  return {
    icon:
      "notifications-outline",
    iconColor:
      "#8B74B8",
    iconBackground:
      "#F2ECFB",
  };
};

const getNotificationTarget = (
  notification:
    BackendNotification,
  childId: string
): NotificationTarget => {
  const explicitTarget =
    String(
      notification.target ||
      ""
    )
      .trim()
      .toLowerCase();

  if (
    explicitTarget ===
      "activity" ||
    explicitTarget ===
      "progress" ||
    explicitTarget ===
      "add-entry" ||
    explicitTarget ===
      "privacy"
  ) {
    return explicitTarget;
  }

  const value =
    `${notification.type || ""} ${
      notification.title || ""
    }`
      .trim()
      .toLowerCase();

  if (
    value.includes(
      "privacy"
    )
  ) {
    return "privacy";
  }

  if (
    value.includes(
      "reminder"
    ) ||
    value.includes(
      "check-in"
    ) ||
    value.includes(
      "check_in"
    ) ||
    value.includes(
      "weekly check"
    )
  ) {
    return childId
      ? "add-entry"
      : "none";
  }

  if (
    value.includes(
      "analysis"
    ) ||
    value.includes(
      "entry"
    ) ||
    value.includes(
      "ai result"
    )
  ) {
    return childId
      ? "activity"
      : "none";
  }

  if (
    value.includes(
      "recommend"
    ) ||
    value.includes(
      "review"
    ) ||
    value.includes(
      "response"
    ) ||
    value.includes(
      "progress"
    ) ||
    value.includes(
      "follow"
    )
  ) {
    return childId
      ? "progress"
      : "none";
  }

  return childId
    ? "progress"
    : "none";
};

const normalizeStatus = (
  value?: string
):
  | "Pending Review"
  | "Reviewed"
  | "Closed" => {
  const status =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    status === "closed"
  ) {
    return "Closed";
  }

  if (
    status === "reviewed" ||
    status === "improving"
  ) {
    return "Reviewed";
  }

  return "Pending Review";
};

const mapNotification = (
  notification:
    BackendNotification,
  childrenById:
    Map<string, BackendChild>
): NotificationItem | null => {
  const id =
    notification._id ||
    notification.id ||
    "";

  if (!id) {
    return null;
  }

  const childId =
    getChildId(
      notification.childId
    );

  const populatedChild =
    notification.childId &&
    typeof notification.childId ===
      "object"
      ? notification.childId
      : undefined;

  const child =
    populatedChild ||
    childrenById.get(
      childId
    );

  const createdAt =
    notification.createdAt ||
    notification.updatedAt ||
    "";

  const visual =
    getNotificationVisual(
      notification.type,
      notification.title
    );

  const metadata =
    notification.metadata ||
    {};

  const focusSectionValue =
    String(
      notification.focusSection ||
      ""
    )
      .trim()
      .toLowerCase();

  const focusSection:
    ActivityFocusSection =
      focusSectionValue ===
        "doctor-response" ||
      String(
        notification.type ||
        ""
      )
        .toLowerCase()
        .includes(
          "recommend"
        ) ||
      String(
        notification.title ||
        ""
      )
        .toLowerCase()
        .includes(
          "review"
        )
        ? "doctor-response"
        : "analysis";

  return {
    id,

    title:
      String(
        notification.title ||
        "New notification"
      ),

    description:
      String(
        notification.message ||
        notification.description ||
        "You have a new update."
      ),

    time:
      getNotificationTime(
        createdAt
      ),

    group:
      getNotificationGroup(
        createdAt
      ),

    read:
      Boolean(
        notification.isRead ??
        notification.read ??
        false
      ),

    ...visual,

    target:
      getNotificationTarget(
        notification,
        childId
      ),

    focusSection,

    childId:
      childId ||
      undefined,

    childName:
      child?.name ||
      undefined,

    childAge:
      child?.age !==
        undefined &&
      child?.age !== null
        ? String(
            child.age
          )
        : undefined,

    caseId:
      notification.caseId ||
      metadata.caseId ||
      undefined,

    activityId:
      notification.activityId ||
      notification.entryId ||
      metadata.activityId ||
      metadata.entryId ||
      undefined,

    activityDate:
      createdAt ||
      undefined,

    activityType:
      typeof metadata.activityType ===
        "string"
        ? metadata.activityType
        : notification.type ||
          "Update",

    emotion:
      notification.emotion ||
      (
        typeof metadata.emotion ===
          "string"
          ? metadata.emotion
          : undefined
      ),

    activityDescription:
      String(
        notification.message ||
        notification.description ||
        ""
      ),

    status:
      normalizeStatus(
        notification.status ||
        (
          typeof metadata.status ===
            "string"
            ? metadata.status
            : undefined
        )
      ),

    createdAtTimestamp:
      getNotificationDate(
        createdAt
      )?.getTime() ||
      0,
  };
};

export default function NotificationsScreen() {
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
      NotificationItem[]
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

  const [
    showPrivacyModal,
    setShowPrivacyModal,
  ] =
    useState(false);

  const handleExpiredSession =
    useCallback(
      async () => {
        await AsyncStorage.multiRemove(
          [
            "token",
            "user",
          ]
        );

        router.replace(
          "/auth/login" as any
        );
      },
      []
    );

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
            notificationResponse,
            childrenResponse,
          ] =
            await Promise.all([
              API.get<
                BackendNotification[]
              >(
                "/children/my-notifications"
              ),

              API.get<
                BackendChild[]
              >(
                "/children/all"
              ),
            ]);

          const backendNotifications =
            Array.isArray(
              notificationResponse.data
            )
              ? notificationResponse.data
              : [];

          const children =
            Array.isArray(
              childrenResponse.data
            )
              ? childrenResponse.data
              : [];

          const childrenById =
            new Map<
              string,
              BackendChild
            >();

          children.forEach(
            (
              child
            ) => {
              const childId =
                child._id ||
                child.id ||
                "";

              if (childId) {
                childrenById.set(
                  childId,
                  child
                );
              }
            }
          );

          const mappedNotifications =
            backendNotifications
              .map(
                (
                  notification
                ) =>
                  mapNotification(
                    notification,
                    childrenById
                  )
              )
              .filter(
                (
                  notification
                ): notification is NotificationItem =>
                  notification !==
                  null
              )
              .sort(
                (
                  first,
                  second
                ) =>
                  second.createdAtTimestamp -
                  first.createdAtTimestamp
              );

          setNotifications(
            mappedNotifications
          );
        } catch (error) {
          console.log(
            "LOAD PARENT NOTIFICATIONS ERROR:",
            error
          );

          if (
            axios.isAxiosError(
              error
            ) &&
            (
              error.response?.status ===
                401 ||
              error.response?.status ===
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
          !notification.read
      ).length;
    }, [
      notifications,
    ]);

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
            !notification.read
        );
      }

      return notifications;
    }, [
      notifications,
      selectedFilter,
    ]);

  const todayNotifications =
    useMemo(() => {
      return filteredNotifications.filter(
        (
          notification
        ) =>
          notification.group ===
          "Today"
      );
    }, [
      filteredNotifications,
    ]);

  const yesterdayNotifications =
    useMemo(() => {
      return filteredNotifications.filter(
        (
          notification
        ) =>
          notification.group ===
          "Yesterday"
      );
    }, [
      filteredNotifications,
    ]);

  const earlierNotifications =
    useMemo(() => {
      return filteredNotifications.filter(
        (
          notification
        ) =>
          notification.group ===
          "Earlier"
      );
    }, [
      filteredNotifications,
    ]);

  const markNotificationAsRead =
    useCallback(
      async (
        notificationId: string
      ) => {
        const previousNotifications =
          notifications;

        setNotifications(
          (
            currentNotifications
          ) =>
            currentNotifications.map(
              (
                notification
              ) =>
                notification.id ===
                notificationId
                  ? {
                      ...notification,
                      read: true,
                    }
                  : notification
            )
        );

        try {
          await API.patch(
            `/children/read/${notificationId}`
          );
        } catch (error) {
          console.log(
            "MARK PARENT NOTIFICATION READ ERROR:",
            error
          );

          setNotifications(
            previousNotifications
          );

          if (
            axios.isAxiosError(
              error
            ) &&
            (
              error.response?.status ===
                401 ||
              error.response?.status ===
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
        }
      },
      [
        handleExpiredSession,
        notifications,
      ]
    );

  const markAllAsRead =
    useCallback(
      async () => {
        if (
          markingAll ||
          unreadCount === 0
        ) {
          return;
        }

        const unreadIds =
          notifications
            .filter(
              (
                notification
              ) =>
                !notification.read
            )
            .map(
              (
                notification
              ) =>
                notification.id
            );

        setMarkingAll(true);
        setScreenError("");

        try {
          await Promise.all(
            unreadIds.map(
              (
                notificationId
              ) =>
                API.patch(
                  `/children/read/${notificationId}`
                )
            )
          );

          setNotifications(
            (
              currentNotifications
            ) =>
              currentNotifications.map(
                (
                  notification
                ) => ({
                  ...notification,
                  read: true,
                })
              )
          );
        } catch (error) {
          console.log(
            "MARK ALL PARENT NOTIFICATIONS READ ERROR:",
            error
          );

          if (
            axios.isAxiosError(
              error
            ) &&
            (
              error.response?.status ===
                401 ||
              error.response?.status ===
                403
            )
          ) {
            await handleExpiredSession();
            return;
          }

          setScreenError(
            "Some notifications could not be marked as read."
          );

          await loadNotifications(
            "refresh"
          );
        } finally {
          setMarkingAll(false);
        }
      },
      [
        handleExpiredSession,
        loadNotifications,
        markingAll,
        notifications,
        unreadCount,
      ]
    );

  const openActivityDetails = (
    notification:
      NotificationItem
  ) => {
    router.push(
      {
        pathname:
          "/parent/activity-details",

        params: {
          activityId:
            notification.activityId ||
            "",

          caseId:
            notification.caseId ||
            "",

          childId:
            notification.childId ||
            "",

          childName:
            notification.childName ||
            "",

          childAge:
            notification.childAge ||
            "",

          date:
            notification.activityDate ||
            "",

          type:
            notification.activityType ||
            "Update",

          emotion:
            notification.emotion ||
            "",

          description:
            notification.activityDescription ||
            notification.description,

          status:
            notification.status ||
            "Pending Review",

          focusSection:
            notification.focusSection ||
            "analysis",
        },
      } as any
    );
  };

  const openChildProgress = (
    notification:
      NotificationItem
  ) => {
    router.push(
      {
        pathname:
          "/parent/child-progress",

        params: {
          childId:
            notification.childId ||
            "",

          childName:
            notification.childName ||
            "",

          childAge:
            notification.childAge ||
            "",

          caseId:
            notification.caseId ||
            "",
        },
      } as any
    );
  };

  const openAddEntry = (
    notification:
      NotificationItem
  ) => {
    router.push(
      {
        pathname:
          "/parent/ai-chat",

        params: {
          childId:
            notification.childId ||
            "",

          childName:
            notification.childName ||
            "",

          childAge:
            notification.childAge ||
            "",

          source:
            "weekly-check-in",
        },
      } as any
    );
  };

  const handleNotificationPress =
    async (
      notification:
        NotificationItem
    ) => {
      if (
        !notification.read
      ) {
        await markNotificationAsRead(
          notification.id
        );
      }

      switch (
        notification.target
      ) {
        case "activity":
          openActivityDetails(
            notification
          );
          break;

        case "progress":
          openChildProgress(
            notification
          );
          break;

        case "add-entry":
          openAddEntry(
            notification
          );
          break;

        case "privacy":
          setShowPrivacyModal(
            true
          );
          break;

        default:
          break;
      }
    };

  const renderNotification = (
    notification:
      NotificationItem
  ) => {
    return (
      <TouchableOpacity
        key={
          notification.id
        }
        activeOpacity={0.82}
        onPress={() =>
          void handleNotificationPress(
            notification
          )
        }
        style={[
          styles.notificationCard,

          !notification.read &&
            styles.unreadNotificationCard,
        ]}
      >
        {!notification.read ? (
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
                notification.iconBackground,
            },
          ]}
        >
          <Ionicons
            name={
              notification.icon
            }
            size={20}
            color={
              notification.iconColor
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

                !notification.read &&
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
              {
                notification.time
              }
            </Text>
          </View>

          <Text
            style={
              styles.notificationDescription
            }
            numberOfLines={3}
          >
            {
              notification.description
            }
          </Text>
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

  const renderSection = (
    title:
      NotificationGroup,
    sectionNotifications:
      NotificationItem[]
  ) => {
    if (
      sectionNotifications.length ===
      0
    ) {
      return null;
    }

    return (
      <View
        style={
          styles.section
        }
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
            {
              sectionNotifications.length
            }
          </Text>
        </View>

        {
          sectionNotifications.map(
            renderNotification
          )
        }
      </View>
    );
  };

  const hasNoNotifications =
    filteredNotifications.length ===
    0;

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
            styles.container
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
                      unreadCount ===
                      1
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

                    unreadCount ===
                      0 &&
                      styles.markAllTextDisabled,
                  ]}
                >
                  Mark all as read
                </Text>
              )}
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

          <View
            style={
              styles.filtersContainer
            }
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                setSelectedFilter(
                  "All"
                )
              }
              style={[
                styles.filterButton,

                selectedFilter ===
                  "All" &&
                  styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,

                  selectedFilter ===
                    "All" &&
                    styles.filterTextActive,
                ]}
              >
                All
              </Text>

              <View
                style={[
                  styles.filterCount,

                  selectedFilter ===
                    "All" &&
                    styles.filterCountActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterCountText,

                    selectedFilter ===
                      "All" &&
                      styles.filterCountTextActive,
                  ]}
                >
                  {
                    notifications.length
                  }
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                setSelectedFilter(
                  "Unread"
                )
              }
              style={[
                styles.filterButton,

                selectedFilter ===
                  "Unread" &&
                  styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,

                  selectedFilter ===
                    "Unread" &&
                    styles.filterTextActive,
                ]}
              >
                Unread
              </Text>

              <View
                style={[
                  styles.filterCount,

                  selectedFilter ===
                    "Unread" &&
                    styles.filterCountActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterCountText,

                    selectedFilter ===
                      "Unread" &&
                      styles.filterCountTextActive,
                  ]}
                >
                  {
                    unreadCount
                  }
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View
              style={
                styles.loadingState
              }
            >
              <ActivityIndicator
                size="large"
                color="#78ACD5"
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
                  tintColor="#78ACD5"
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
                    New updates about your children, analyses and specialist reviews will appear here.
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
                    todayNotifications
                  )}

                  {renderSection(
                    "Yesterday",
                    yesterdayNotifications
                  )}

                  {renderSection(
                    "Earlier",
                    earlierNotifications
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

      <Modal
        visible={
          showPrivacyModal
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowPrivacyModal(
            false
          )
        }
      >
        <View
          style={
            styles.privacyModalOverlay
          }
        >
          <Pressable
            style={
              StyleSheet.absoluteFillObject
            }
            onPress={() =>
              setShowPrivacyModal(
                false
              )
            }
          />

          <View
            style={
              styles.privacyModalContainer
            }
          >
            <View
              style={
                styles.privacyIconContainer
              }
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={30}
                color="#3976A4"
              />
            </View>

            <Text
              style={
                styles.privacyModalTitle
              }
            >
              Your Privacy Is Protected
            </Text>

            <Text
              style={
                styles.privacyModalDescription
              }
            >
              Your personal identity and account information remain hidden when specialists review your child’s entries.
            </Text>

            <View
              style={
                styles.privacyPointsContainer
              }
            >
              <PrivacyPoint text="Specialists cannot see your real name or personal account details." />
              <PrivacyPoint text="They only see the child’s nickname or identification number." />
              <PrivacyPoint text="The specialist’s name and specialization remain visible to you." />
              <PrivacyPoint text="Your information is used only to provide emotional and behavioral support." />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                setShowPrivacyModal(
                  false
                )
              }
              style={
                styles.privacyModalButton
              }
            >
              <Text
                style={
                  styles.privacyModalButtonText
                }
              >
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function PrivacyPoint({
  text,
}: {
  text: string;
}) {
  return (
    <View
      style={
        styles.privacyPointRow
      }
    >
      <Ionicons
        name="checkmark-circle"
        size={17}
        color="#4D9A66"
      />

      <Text
        style={
          styles.privacyPointText
        }
      >
        {text}
      </Text>
    </View>
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
      minWidth: 78,
      minHeight: 32,
      alignItems: "flex-end",
      justifyContent: "center",
      paddingVertical: 7,
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

    errorBanner: {
      marginHorizontal: 18,
      marginBottom: 8,
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

    filterCountActive: {
      backgroundColor:
        "rgba(255,255,255,0.7)",
    },

    filterCountText: {
      fontSize: 7.5,
      fontWeight: "600",
      color: "#858B92",
    },

    filterCountTextActive: {
      color: "#6A5558",
    },

    loadingState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingBottom: 80,
    },

    loadingText: {
      marginTop: 11,
      fontSize: 10,
      color: "#858B92",
    },

    scrollView: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
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

    chevronIcon: {
      alignSelf: "center",
      marginLeft: 3,
    },

    emptyState: {
      flex: 1,
      minHeight: 340,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 35,
      paddingBottom: 60,
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

    privacyModalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
      backgroundColor:
        "rgba(20,25,35,0.38)",
    },

    privacyModalContainer: {
      width: "100%",
      maxWidth: 360,
      borderRadius: 24,
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 22,
      paddingTop: 26,
      paddingBottom: 20,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.14,
      shadowRadius: 14,
      elevation: 10,
    },

    privacyIconContainer: {
      width: 62,
      height: 62,
      borderRadius: 31,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#EAF5FD",
      marginBottom: 14,
    },

    privacyModalTitle: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "700",
      color: "#24282C",
      textAlign: "center",
    },

    privacyModalDescription: {
      marginTop: 8,
      fontSize: 10,
      lineHeight: 16,
      color: "#777C82",
      textAlign: "center",
      paddingHorizontal: 5,
    },

    privacyPointsContainer: {
      width: "100%",
      marginTop: 20,
    },

    privacyPointRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 12,
    },

    privacyPointText: {
      flex: 1,
      marginLeft: 9,
      fontSize: 9.5,
      lineHeight: 15,
      color: "#555B61",
    },

    privacyModalButton: {
      width: "100%",
      height: 46,
      borderRadius: 23,
      marginTop: 10,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#EDF7FF",
    },

    privacyModalButtonText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#5E88A7",
    },
  });
