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
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  | "privacy";

type ActivityFocusSection =
  | "analysis"
  | "doctor-response";

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

  activityId?: string;
  activityDate?: string;
  activityType?: string;
  emotion?: string;
  activityDescription?: string;

  status?:
    | "Pending Review"
    | "Reviewed"
    | "Closed";
};

const NOTIFICATIONS_STORAGE_KEY =
  "parent_notifications";

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notification-1",
    title: "Analysis Reviewed",
    description:
      "Dr. Ahmed reviewed Nada’s latest analysis and added a new recommendation.",
    time: "10 min ago",
    group: "Today",
    read: false,

    icon: "checkmark-circle-outline",
    iconColor: "#4D9A66",
    iconBackground: "#E7F7EC",

    target: "activity",
    focusSection: "doctor-response",

    childId: "nada-1",
    childName: "Nada",
    childAge: "12",

    activityId: "activity-1",
    activityDate: "Jun 22, 2026",
    activityType: "Text Entry",
    emotion: "Anxiety",

    activityDescription:
      "The results indicate mild anxiety indicators related to the school environment. It is recommended to monitor sleep patterns during the upcoming week.",

    status: "Reviewed",
  },

  {
    id: "notification-2",
    title: "New Analysis Ready",
    description:
      "The emotional analysis for Jojo’s latest entry is now available.",
    time: "25 min ago",
    group: "Today",
    read: false,

    icon: "sparkles-outline",
    iconColor: "#3976A4",
    iconBackground: "#EAF5FD",

    target: "activity",
    focusSection: "analysis",

    childId: "jojo-1",
    childName: "Jojo",
    childAge: "11",

    activityId: "activity-2",
    activityDate: "Jun 22, 2026",
    activityType: "Text Entry",
    emotion: "Calm",

    activityDescription:
      "The latest entry shows a calm emotional state with improved focus and more stable behavioral responses.",

    status: "Pending Review",
  },

  {
    id: "notification-3",
    title: "Positive Progress",
    description:
      "Nada’s recent entries show improvement in emotional stability and daily behavior.",
    time: "2 hours ago",
    group: "Today",
    read: false,

    icon: "trending-up-outline",
    iconColor: "#4D9A66",
    iconBackground: "#E7F7EC",

    target: "progress",

    childId: "nada-1",
    childName: "Nada",
    childAge: "12",
  },

  {
    id: "notification-4",
    title: "Weekly Check-in",
    description:
      "It’s time to add a new update about Jojo’s feelings and behavior this week.",
    time: "Yesterday",
    group: "Yesterday",
    read: true,

    icon: "calendar-outline",
    iconColor: "#B65A61",
    iconBackground: "#FFF0F1",

    target: "add-entry",

    childId: "jojo-1",
    childName: "Jojo",
    childAge: "11",
  },

  {
    id: "notification-5",
    title: "Specialist Recommendation",
    description:
      "A specialist added a recommendation to Nada’s previous emotional analysis.",
    time: "Jun 20, 2026",
    group: "Earlier",
    read: true,

    icon: "document-text-outline",
    iconColor: "#8B74B8",
    iconBackground: "#F2ECFB",

    target: "activity",
    focusSection: "doctor-response",

    childId: "nada-1",
    childName: "Nada",
    childAge: "12",

    activityId: "activity-3",
    activityDate: "Jun 20, 2026",
    activityType: "Text Entry",
    emotion: "Stress",

    activityDescription:
      "The analysis indicates stress-related signs connected to changes in the child’s daily routine and school activities.",

    status: "Closed",
  },

  {
    id: "notification-6",
    title: "Privacy Reminder",
    description:
      "Your identity remains hidden when specialists review your child’s entries.",
    time: "Jun 18, 2026",
    group: "Earlier",
    read: true,

    icon: "shield-checkmark-outline",
    iconColor: "#3976A4",
    iconBackground: "#EAF5FD",

    target: "privacy",
  },
];

export default function NotificationsScreen() {
  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState<NotificationFilter>("All");

  const [
    notifications,
    setNotifications,
  ] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS
  );

  const [
    showPrivacyModal,
    setShowPrivacyModal,
  ] = useState(false);

  const saveNotifications = async (
    updatedNotifications: NotificationItem[]
  ) => {
    setNotifications(updatedNotifications);

    try {
      await AsyncStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(updatedNotifications)
      );
    } catch (storageError) {
      console.log(
        "Save notifications error:",
        storageError
      );
    }
  };

  const loadNotifications = async () => {
    try {
      const savedNotifications =
        await AsyncStorage.getItem(
          NOTIFICATIONS_STORAGE_KEY
        );

      if (!savedNotifications) {
        await AsyncStorage.setItem(
          NOTIFICATIONS_STORAGE_KEY,
          JSON.stringify(
            INITIAL_NOTIFICATIONS
          )
        );

        setNotifications(
          INITIAL_NOTIFICATIONS
        );

        return;
      }

      const parsedNotifications =
        JSON.parse(savedNotifications);

      if (
        !Array.isArray(
          parsedNotifications
        )
      ) {
        await AsyncStorage.setItem(
          NOTIFICATIONS_STORAGE_KEY,
          JSON.stringify(
            INITIAL_NOTIFICATIONS
          )
        );

        setNotifications(
          INITIAL_NOTIFICATIONS
        );

        return;
      }

      const savedNotificationsById =
        new Map<
          string,
          Partial<NotificationItem>
        >();

      parsedNotifications.forEach(
        (
          notification:
            Partial<NotificationItem>
        ) => {
          if (notification.id) {
            savedNotificationsById.set(
              notification.id,
              notification
            );
          }
        }
      );

      const mergedNotifications =
        INITIAL_NOTIFICATIONS.map(
          (notification) => {
            const savedNotification =
              savedNotificationsById.get(
                notification.id
              );

            return {
              ...notification,

              read:
                typeof savedNotification?.read ===
                "boolean"
                  ? savedNotification.read
                  : notification.read,
            };
          }
        );

      setNotifications(
        mergedNotifications
      );

      await AsyncStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(
          mergedNotifications
        )
      );
    } catch (storageError) {
      console.log(
        "Load notifications error:",
        storageError
      );

      setNotifications(
        INITIAL_NOTIFICATIONS
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const unreadCount = useMemo(() => {
    return notifications.filter(
      (notification) =>
        !notification.read
    ).length;
  }, [notifications]);

  const filteredNotifications =
    useMemo(() => {
      if (
        selectedFilter === "Unread"
      ) {
        return notifications.filter(
          (notification) =>
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
        (notification) =>
          notification.group ===
          "Today"
      );
    }, [filteredNotifications]);

  const yesterdayNotifications =
    useMemo(() => {
      return filteredNotifications.filter(
        (notification) =>
          notification.group ===
          "Yesterday"
      );
    }, [filteredNotifications]);

  const earlierNotifications =
    useMemo(() => {
      return filteredNotifications.filter(
        (notification) =>
          notification.group ===
          "Earlier"
      );
    }, [filteredNotifications]);

  const markNotificationAsRead =
    async (
      notificationId: string
    ) => {
      const updatedNotifications =
        notifications.map(
          (notification) =>
            notification.id ===
            notificationId
              ? {
                  ...notification,
                  read: true,
                }
              : notification
        );

      await saveNotifications(
        updatedNotifications
      );
    };

  const markAllAsRead = async () => {
    const updatedNotifications =
      notifications.map(
        (notification) => ({
          ...notification,
          read: true,
        })
      );

    await saveNotifications(
      updatedNotifications
    );
  };

  const openActivityDetails = (
    notification: NotificationItem
  ) => {
    router.push(
      {
        pathname:
          "/parent/activity-details",

        params: {
          activityId:
            notification.activityId ||
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
            "Text Entry",

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
    notification: NotificationItem
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
        },
      } as any
    );
  };

  const openAddEntry = (
    notification: NotificationItem
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

  const openPrivacyModal = () => {
    setShowPrivacyModal(true);
  };

  const handleNotificationPress =
    async (
      notification: NotificationItem
    ) => {
      if (!notification.read) {
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
          openPrivacyModal();
          break;

        default:
          break;
      }
    };

  const renderNotification = (
    notification: NotificationItem
  ) => {
    return (
      <TouchableOpacity
        key={notification.id}
        activeOpacity={0.82}
        onPress={() =>
          handleNotificationPress(
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
            style={styles.unreadDot}
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
            name={notification.icon}
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
              {notification.title}
            </Text>

            <Text
              style={
                styles.notificationTime
              }
            >
              {notification.time}
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
          style={styles.chevronIcon}
        />
      </TouchableOpacity>
    );
  };

  const renderSection = (
    title: NotificationGroup,
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
      <View style={styles.section}>
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

        {sectionNotifications.map(
          renderNotification
        )}
      </View>
    );
  };

  const hasNoNotifications =
    filteredNotifications.length ===
    0;

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
              onPress={
                markAllAsRead
              }
              disabled={
                unreadCount === 0
              }
              style={
                styles.markAllButton
              }
            >
              <Text
                style={[
                  styles.markAllText,

                  unreadCount === 0 &&
                    styles.markAllTextDisabled,
                ]}
              >
                Mark all as read
              </Text>
            </TouchableOpacity>
          </View>

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
                  {unreadCount}
                </Text>
              </View>
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
            bounces={false}
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
                  New updates about your
                  children, analyses and
                  specialist reviews will
                  appear here.
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
                      Show all
                      notifications
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
        </View>
      </LinearGradient>

      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowPrivacyModal(false)
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
              setShowPrivacyModal(false)
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
              Your personal identity and
              account information remain
              hidden when specialists
              review your child’s entries.
            </Text>

            <View
              style={
                styles.privacyPointsContainer
              }
            >
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
                  Specialists cannot see
                  your real name or personal
                  account details.
                </Text>
              </View>

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
                  They only see the child’s
                  nickname or identification
                  number.
                </Text>
              </View>

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
                  The specialist’s name and
                  specialization remain
                  visible to you.
                </Text>
              </View>

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
                  Your information is used
                  only to provide emotional
                  and behavioral support.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                setShowPrivacyModal(false)
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