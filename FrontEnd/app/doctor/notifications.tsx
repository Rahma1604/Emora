import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  router,
  type Href,
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
  | "review-case"
  | "insights"
  | "profile"
  | "privacy";

type ReviewCaseFocusSection =
  | "overview"
  | "analysis"
  | "parent-follow-up";

type CasePriority =
  | "normal"
  | "urgent";

type DoctorNotification = {
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

  childId?: string;
  childName?: string;

  caseId?: string;
  entryId?: string;

  focusSection?: ReviewCaseFocusSection;
  priority?: CasePriority;
};

const DOCTOR_NOTIFICATIONS_STORAGE_KEY =
  "doctor_notifications";

const DOCTOR_DARK_MODE_STORAGE_KEY =
  "doctorDarkMode";

const INITIAL_NOTIFICATIONS: DoctorNotification[] = [
  {
    id: "doctor-notification-1",
    title: "New Review Request",
    description:
      "A parent has requested your review for Lily’s latest emotional analysis.",
    time: "5 min ago",
    group: "Today",
    read: false,

    icon: "person-add-outline",
    iconColor: "#3976A4",
    iconBackground: "#EAF5FD",

    target: "review-case",

    childId: "child-lily",
    childName: "Lily",

    caseId: "case-1",
    entryId: "entry-1",

    focusSection: "overview",
    priority: "normal",
  },

  {
    id: "doctor-notification-2",
    title: "Urgent Review Required",
    description:
      "Samy’s latest analysis shows indicators that may require your attention.",
    time: "20 min ago",
    group: "Today",
    read: false,

    icon: "alert-circle-outline",
    iconColor: "#C75555",
    iconBackground: "#FFF0F1",

    target: "review-case",

    childId: "child-samy",
    childName: "Samy",

    caseId: "case-2",
    entryId: "entry-2",

    focusSection: "analysis",
    priority: "urgent",
  },

  {
    id: "doctor-notification-3",
    title: "New Parent Follow-up",
    description:
      "Lily’s parent added new information about her recent emotional behavior.",
    time: "1 hour ago",
    group: "Today",
    read: false,

    icon: "chatbubble-ellipses-outline",
    iconColor: "#8B74B8",
    iconBackground: "#F2ECFB",

    target: "review-case",

    childId: "child-lily",
    childName: "Lily",

    caseId: "case-1",
    entryId: "entry-1",

    focusSection: "parent-follow-up",
    priority: "normal",
  },

  {
    id: "doctor-notification-4",
    title: "Weekly Performance Summary",
    description:
      "Your weekly insights are ready. You reviewed 12 cases with an average review time of 8 minutes.",
    time: "3 hours ago",
    group: "Today",
    read: true,

    icon: "stats-chart-outline",
    iconColor: "#4D9A66",
    iconBackground: "#E7F7EC",

    target: "insights",
  },

  {
    id: "doctor-notification-5",
    title: "Professional Profile Reminder",
    description:
      "Review your professional information to make sure your profile is up to date.",
    time: "Yesterday",
    group: "Yesterday",
    read: true,

    icon: "shield-checkmark-outline",
    iconColor: "#3976A4",
    iconBackground: "#EAF5FD",

    target: "profile",
  },

  {
    id: "doctor-notification-6",
    title: "Privacy Policy Updated",
    description:
      "We updated some privacy and data protection information for specialists.",
    time: "Jun 20, 2026",
    group: "Earlier",
    read: true,

    icon: "document-text-outline",
    iconColor: "#687078",
    iconBackground: "#F1F2F4",

    target: "privacy",
  },
];

export default function DoctorNotificationsScreen() {
  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState<NotificationFilter>("All");

  const [
    notifications,
    setNotifications,
  ] = useState<DoctorNotification[]>([]);

  const [
    darkMode,
    setDarkMode,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    showPrivacyModal,
    setShowPrivacyModal,
  ] = useState(false);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);

      const [
        storedNotifications,
        storedDarkMode,
      ] = await Promise.all([
        AsyncStorage.getItem(
          DOCTOR_NOTIFICATIONS_STORAGE_KEY
        ),
        AsyncStorage.getItem(
          DOCTOR_DARK_MODE_STORAGE_KEY
        ),
      ]);

      setDarkMode(
        storedDarkMode === "true"
      );

      if (storedNotifications) {
        try {
          const parsedNotifications =
            JSON.parse(
              storedNotifications
            );

          if (
            Array.isArray(
              parsedNotifications
            )
          ) {
            const savedNotificationsById =
              new Map<
                string,
                Partial<DoctorNotification>
              >();

            parsedNotifications.forEach(
              (
                notification:
                  Partial<DoctorNotification>
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
              DOCTOR_NOTIFICATIONS_STORAGE_KEY,
              JSON.stringify(
                mergedNotifications
              )
            );

            return;
          }
        } catch (parseError) {
          console.log(
            "Doctor notifications parsing error:",
            parseError
          );
        }
      }

      setNotifications(
        INITIAL_NOTIFICATIONS
      );

      await AsyncStorage.setItem(
        DOCTOR_NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(
          INITIAL_NOTIFICATIONS
        )
      );
    } catch (error) {
      console.log(
        "Doctor notifications loading error:",
        error
      );

      setNotifications(
        INITIAL_NOTIFICATIONS
      );
    } finally {
      setLoading(false);
    }
  };

  const saveNotifications = async (
    updatedNotifications:
      DoctorNotification[]
  ) => {
    setNotifications(
      updatedNotifications
    );

    try {
      await AsyncStorage.setItem(
        DOCTOR_NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(
          updatedNotifications
        )
      );
    } catch (error) {
      console.log(
        "Doctor notifications saving error:",
        error
      );
    }
  };

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

  const openReviewCase = (
    notification: DoctorNotification
  ) => {
    router.push(
      {
        pathname:
          "/doctor/review-case",

        params: {
          caseId:
            notification.caseId || "",

          entryId:
            notification.entryId || "",

          childId:
            notification.childId || "",

          childName:
            notification.childName || "",

          focusSection:
            notification.focusSection ||
            "overview",

          priority:
            notification.priority ||
            "normal",

          source:
            "notification",
        },
      } as any
    );
  };

  const openNotificationTarget = (
    notification: DoctorNotification
  ) => {
    if (
      notification.target ===
      "review-case"
    ) {
      openReviewCase(
        notification
      );

      return;
    }

    if (
      notification.target ===
      "insights"
    ) {
      router.push(
        "/doctor/insights" as Href
      );

      return;
    }

    if (
      notification.target ===
      "profile"
    ) {
      router.push(
        "/doctor/profile" as Href
      );

      return;
    }

    if (
      notification.target ===
      "privacy"
    ) {
      setShowPrivacyModal(true);
    }
  };

  const handleNotificationPress =
    async (
      notification:
        DoctorNotification
    ) => {
      if (!notification.read) {
        await markNotificationAsRead(
          notification.id
        );
      }

      openNotificationTarget(
        notification
      );
    };

  const renderNotification = (
    notification:
      DoctorNotification
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

          darkMode &&
            styles.darkNotificationCard,

          !notification.read &&
            styles.unreadNotificationCard,

          !notification.read &&
            darkMode &&
            styles.darkUnreadNotificationCard,
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

                darkMode &&
                  styles.darkMainText,

                !notification.read &&
                  styles.unreadNotificationTitle,
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>

            <Text
              style={[
                styles.notificationTime,

                darkMode &&
                  styles.darkSecondaryText,
              ]}
            >
              {notification.time}
            </Text>
          </View>

          <Text
            style={[
              styles.notificationDescription,

              darkMode &&
                styles.darkSecondaryText,
            ]}
            numberOfLines={3}
          >
            {notification.description}
          </Text>

          {notification.childName ? (
            <View
              style={
                styles.childBadge
              }
            >
              <Ionicons
                name="person-outline"
                size={11}
                color="#5E88A7"
              />

              <Text
                style={
                  styles.childBadgeText
                }
              >
                {notification.childName}
              </Text>
            </View>
          ) : null}
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={
            darkMode
              ? "#747A82"
              : "#A7ABB0"
          }
          style={styles.chevronIcon}
        />
      </TouchableOpacity>
    );
  };

  const renderNotificationSection = (
    title: NotificationGroup,
    sectionNotifications:
      DoctorNotification[]
  ) => {
    if (
      sectionNotifications.length === 0
    ) {
      return null;
    }

    return (
      <View style={styles.section}>
        <View
          style={styles.sectionHeader}
        >
          <Text
            style={[
              styles.sectionTitle,

              darkMode &&
                styles.darkMainText,
            ]}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.sectionCount,

              darkMode &&
                styles.darkSecondaryText,
            ]}
          >
            {sectionNotifications.length}
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

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,

          darkMode &&
            styles.darkSafeArea,
        ]}
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color="#5E88A7"
          />

          <Text
            style={[
              styles.loadingText,

              darkMode &&
                styles.darkSecondaryText,
            ]}
          >
            Loading notifications...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,

        darkMode &&
          styles.darkSafeArea,
      ]}
      edges={["top"]}
    >
      <StatusBar
        barStyle={
          darkMode
            ? "light-content"
            : "dark-content"
        }
        backgroundColor={
          darkMode
            ? "#15171A"
            : "#FFFFFF"
        }
      />

      <LinearGradient
        colors={
          darkMode
            ? [
                "#15171A",
                "#1B1D21",
                "#17191C",
              ]
            : [
                "#FFFFFF",
                "#FFF9F9",
                "#F8FCFF",
              ]
        }
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
          {/* Header */}
          <View
            style={styles.header}
          >
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() =>
                router.back()
              }
              style={[
                styles.backButton,

                darkMode &&
                  styles.darkBackButton,
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={
                  darkMode
                    ? "#FFFFFF"
                    : "#24282C"
                }
              />
            </TouchableOpacity>

            <View
              style={
                styles.headerContent
              }
            >
              <Text
                style={[
                  styles.pageTitle,

                  darkMode &&
                    styles.darkMainText,
                ]}
              >
                Notifications
              </Text>

              <Text
                style={[
                  styles.pageSubtitle,

                  darkMode &&
                    styles.darkSecondaryText,
                ]}
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
              onPress={markAllAsRead}
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

          {/* Filters */}
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

                darkMode &&
                  styles.darkFilterButton,

                selectedFilter ===
                  "All" &&
                  styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,

                  darkMode &&
                    styles.darkSecondaryText,

                  selectedFilter ===
                    "All" &&
                    styles.filterTextActive,
                ]}
              >
                All
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
                  {notifications.length}
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

                darkMode &&
                  styles.darkFilterButton,

                selectedFilter ===
                  "Unread" &&
                  styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,

                  darkMode &&
                    styles.darkSecondaryText,

                  selectedFilter ===
                    "Unread" &&
                    styles.filterTextActive,
                ]}
              >
                Unread
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
                  {unreadCount}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Notifications */}
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
                  style={[
                    styles.emptyIcon,

                    darkMode &&
                      styles.darkEmptyIcon,
                  ]}
                >
                  <Ionicons
                    name="notifications-off-outline"
                    size={31}
                    color="#5E88A7"
                  />
                </View>

                <Text
                  style={[
                    styles.emptyTitle,

                    darkMode &&
                      styles.darkMainText,
                  ]}
                >
                  {selectedFilter ===
                  "Unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
                </Text>

                <Text
                  style={[
                    styles.emptyDescription,

                    darkMode &&
                      styles.darkSecondaryText,
                  ]}
                >
                  New review requests,
                  parent follow-ups and
                  review reminders will
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
                    style={[
                      styles.showAllButton,

                      darkMode &&
                        styles.darkShowAllButton,
                    ]}
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
                {renderNotificationSection(
                  "Today",
                  todayNotifications
                )}

                {renderNotificationSection(
                  "Yesterday",
                  yesterdayNotifications
                )}

                {renderNotificationSection(
                  "Earlier",
                  earlierNotifications
                )}
              </>
            )}

            <View
              style={styles.bottomSpace}
            />
          </ScrollView>
        </View>
      </LinearGradient>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="fade"
        statusBarTranslucent
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
            style={[
              styles.privacyModalContainer,

              darkMode &&
                styles.darkPrivacyModalContainer,
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                setShowPrivacyModal(false)
              }
              style={[
                styles.privacyModalCloseButton,

                darkMode &&
                  styles.darkPrivacyModalCloseButton,
              ]}
            >
              <Ionicons
                name="close"
                size={20}
                color={
                  darkMode
                    ? "#FFFFFF"
                    : "#555B61"
                }
              />
            </TouchableOpacity>

            <View
              style={
                styles.privacyModalIcon
              }
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={30}
                color="#3976A4"
              />
            </View>

            <Text
              style={[
                styles.privacyModalTitle,

                darkMode &&
                  styles.darkMainText,
              ]}
            >
              Privacy Policy Updated
            </Text>

            <Text
              style={[
                styles.privacyModalDescription,

                darkMode &&
                  styles.darkSecondaryText,
              ]}
            >
              We updated how child and
              guardian information is
              protected and displayed to
              specialists.
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
                <View
                  style={
                    styles.privacyPointIcon
                  }
                >
                  <Ionicons
                    name="checkmark"
                    size={13}
                    color="#4D9A66"
                  />
                </View>

                <Text
                  style={[
                    styles.privacyPointText,

                    darkMode &&
                      styles.darkSecondaryText,
                  ]}
                >
                  Parent names and personal
                  account details remain
                  hidden from specialists.
                </Text>
              </View>

              <View
                style={
                  styles.privacyPointRow
                }
              >
                <View
                  style={
                    styles.privacyPointIcon
                  }
                >
                  <Ionicons
                    name="checkmark"
                    size={13}
                    color="#4D9A66"
                  />
                </View>

                <Text
                  style={[
                    styles.privacyPointText,

                    darkMode &&
                      styles.darkSecondaryText,
                  ]}
                >
                  You only see the child
                  information needed to
                  complete the professional
                  review.
                </Text>
              </View>

              <View
                style={
                  styles.privacyPointRow
                }
              >
                <View
                  style={
                    styles.privacyPointIcon
                  }
                >
                  <Ionicons
                    name="checkmark"
                    size={13}
                    color="#4D9A66"
                  />
                </View>

                <Text
                  style={[
                    styles.privacyPointText,

                    darkMode &&
                      styles.darkSecondaryText,
                  ]}
                >
                  Case entries, analyses and
                  recommendations must remain
                  confidential.
                </Text>
              </View>

              <View
                style={
                  styles.privacyPointRow
                }
              >
                <View
                  style={
                    styles.privacyPointIcon
                  }
                >
                  <Ionicons
                    name="checkmark"
                    size={13}
                    color="#4D9A66"
                  />
                </View>

                <Text
                  style={[
                    styles.privacyPointText,

                    darkMode &&
                      styles.darkSecondaryText,
                  ]}
                >
                  Case information may only
                  be used for professional
                  review and support.
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.privacyNoticeBox,

                darkMode &&
                  styles.darkPrivacyNoticeBox,
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={17}
                color="#5E88A7"
              />

              <Text
                style={[
                  styles.privacyNoticeText,

                  darkMode &&
                    styles.darkSecondaryText,
                ]}
              >
                Continuing to use the
                specialist account means
                you agree to follow these
                privacy and confidentiality
                requirements.
              </Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  darkSafeArea: {
    backgroundColor: "#15171A",
  },

  background: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 9.5,
    color: "#92979E",
  },

  header: {
    minHeight: 75,
    paddingHorizontal: 18,
    paddingTop: 9,
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

  darkBackButton: {
    backgroundColor: "#282C31",
  },

  headerContent: {
    flex: 1,
  },

  pageTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
    color: "#24282C",
  },

  pageSubtitle: {
    marginTop: 3,
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
    marginTop: 4,
    marginBottom: 15,
    gap: 8,
  },

  filterButton: {
    minWidth: 82,
    height: 34,
    borderRadius: 999,
    paddingHorizontal: 13,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F0F5",
  },

  darkFilterButton: {
    backgroundColor: "#282C31",
  },

  filterButtonActive: {
    backgroundColor: "#DDEFF8",
  },

  filterText: {
    fontSize: 9.5,
    fontWeight: "500",
    color: "#777C82",
  },

  filterTextActive: {
    fontWeight: "600",
    color: "#4D788D",
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
    color: "#687078",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 28,
  },

  section: {
    marginBottom: 17,
  },

  sectionHeader: {
    minHeight: 29,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#292D31",
  },

  sectionCount: {
    marginLeft: 7,
    fontSize: 8,
    color: "#999EA4",
  },

  notificationCard: {
    position: "relative",
    minHeight: 92,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E4E9ED",
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

  darkNotificationCard: {
    backgroundColor: "#24272B",
    borderColor: "#32363B",
  },

  unreadNotificationCard: {
    backgroundColor: "#FBFDFF",
    borderColor: "#CFE2EF",
  },

  darkUnreadNotificationCard: {
    backgroundColor: "#24303A",
    borderColor: "#385063",
  },

  unreadDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#5E9ECD",
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
    paddingRight: 5,
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

  childBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF5FD",
  },

  childBadgeText: {
    marginLeft: 4,
    fontSize: 7.5,
    fontWeight: "600",
    color: "#5E88A7",
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
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EDF7FF",
    marginBottom: 14,
  },

  darkEmptyIcon: {
    backgroundColor: "#263640",
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

  darkShowAllButton: {
    backgroundColor: "#263640",
  },

  showAllButtonText: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "#5E88A7",
  },

  bottomSpace: {
    height: 15,
  },

  darkMainText: {
    color: "#FFFFFF",
  },

  darkSecondaryText: {
    color: "#ADB2B9",
  },

  privacyModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
    backgroundColor:
      "rgba(12,16,20,0.48)",
  },

  privacyModalContainer: {
    width: "100%",
    maxWidth: 370,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 21,
    paddingTop: 25,
    paddingBottom: 20,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },

  darkPrivacyModalContainer: {
    backgroundColor: "#24272B",
    borderWidth: 1,
    borderColor: "#34383E",
  },

  privacyModalCloseButton: {
    position: "absolute",
    top: 13,
    right: 13,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    zIndex: 2,
  },

  darkPrivacyModalCloseButton: {
    backgroundColor: "#34383E",
  },

  privacyModalIcon: {
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
    paddingHorizontal: 8,
    fontSize: 9.5,
    lineHeight: 15,
    color: "#777C82",
    textAlign: "center",
  },

  privacyPointsContainer: {
    width: "100%",
    marginTop: 19,
  },

  privacyPointRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  privacyPointIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E7F7EC",
    marginRight: 9,
  },

  privacyPointText: {
    flex: 1,
    paddingTop: 2,
    fontSize: 9.2,
    lineHeight: 14,
    color: "#555B61",
  },

  privacyNoticeBox: {
    width: "100%",
    marginTop: 3,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DCEAF4",
    backgroundColor: "#F6FAFD",
    paddingHorizontal: 11,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  darkPrivacyNoticeBox: {
    backgroundColor: "#29323A",
    borderColor: "#3A4A56",
  },

  privacyNoticeText: {
    flex: 1,
    marginLeft: 7,
    fontSize: 8,
    lineHeight: 12,
    color: "#6C7278",
  },

  privacyModalButton: {
    width: "100%",
    height: 46,
    borderRadius: 23,
    marginTop: 17,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#DDEFF8",
  },

  privacyModalButtonText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4D788D",
  },
});