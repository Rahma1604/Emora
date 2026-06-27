import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
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
} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

type NotificationPreferences = {
  pushEnabled: boolean;
  newCases: boolean;
  parentFollowUps: boolean;
  analysisUpdates: boolean;
  weeklySummary: boolean;
  accountSecurity: boolean;
  emailNotifications: boolean;
};

type FeedbackType =
  | "saved"
  | "error"
  | null;

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (
    value: boolean
  ) => void;
  disabled?: boolean;
  last?: boolean;
};

type SettingsSectionProps = {
  title: string;
  children: React.ReactNode;
};

const STORAGE_KEY =
  "doctorNotificationSettings";

const DEFAULT_SETTINGS: NotificationPreferences =
  {
    pushEnabled: true,
    newCases: true,
    parentFollowUps: true,
    analysisUpdates: true,
    weeklySummary: true,
    accountSecurity: true,
    emailNotifications: false,
  };

export default function NotificationSettingsScreen() {
  const [
    settings,
    setSettings,
  ] = useState<NotificationPreferences>(
    DEFAULT_SETTINGS
  );

  const [
    savedSettings,
    setSavedSettings,
  ] = useState<NotificationPreferences>(
    DEFAULT_SETTINGS
  );

  const [
    initialLoading,
    setInitialLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    feedback,
    setFeedback,
  ] = useState<FeedbackType>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const savedValue =
          await AsyncStorage.getItem(
            STORAGE_KEY
          );

        if (!isMounted) return;

        if (savedValue) {
          const parsedValue =
            JSON.parse(
              savedValue
            ) as Partial<NotificationPreferences>;

          const loadedSettings: NotificationPreferences =
            {
              ...DEFAULT_SETTINGS,
              ...parsedValue,
            };

          setSettings(
            loadedSettings
          );

          setSavedSettings(
            loadedSettings
          );
        }
      } catch (error) {
        console.log(
          "Load notification settings error:",
          error
        );
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasChanges = useMemo(() => {
    return (
      JSON.stringify(settings) !==
      JSON.stringify(savedSettings)
    );
  }, [
    settings,
    savedSettings,
  ]);

  const updateSetting = (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    setSettings(
      (previousSettings) => ({
        ...previousSettings,
        [key]: value,
      })
    );
  };

  const handlePushNotificationsChange = (
    value: boolean
  ) => {
    setSettings(
      (previousSettings) => ({
        ...previousSettings,
        pushEnabled: value,
      })
    );
  };

  const handleSave = async () => {
    if (
      saving ||
      !hasChanges
    ) {
      return;
    }

    try {
      setSaving(true);

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
      );

      setSavedSettings({
        ...settings,
      });

      setFeedback("saved");
    } catch (error) {
      console.log(
        "Save notification settings error:",
        error
      );

      setFeedback("error");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (saving) return;

    router.back();
  };

  if (initialLoading) {
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
            "#FFF8F8",
            "#F7FBFF",
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
            style={
              styles.loadingContainer
            }
          >
            <ActivityIndicator
              size="large"
              color="#8DC0F0"
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Loading notification settings...
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

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
          "#FFF8F8",
          "#F7FBFF",
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
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
          bounces={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={
                styles.backButton
              }
              activeOpacity={0.7}
              onPress={handleBack}
              disabled={saving}
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
              Notification Settings
            </Text>

            <View
              style={
                styles.headerPlaceholder
              }
            />
          </View>

          {/* Introduction */}
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
                name="notifications-outline"
                size={28}
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
                Stay informed
              </Text>

              <Text
                style={
                  styles.pageSubtitle
                }
              >
                Choose which case updates,
                follow-ups and account alerts
                you want to receive.
              </Text>
            </View>
          </View>

          {/* Master Push Setting */}
          <View
            style={
              styles.masterCard
            }
          >
            <View
              style={
                styles.masterIcon
              }
            >
              <Ionicons
                name="phone-portrait-outline"
                size={22}
                color="#6595BB"
              />
            </View>

            <View
              style={
                styles.settingContent
              }
            >
              <Text
                style={
                  styles.settingTitle
                }
              >
                Push notifications
              </Text>

              <Text
                style={
                  styles.settingDescription
                }
              >
                Receive alerts directly
                on this device.
              </Text>
            </View>

            <Switch
              value={
                settings.pushEnabled
              }
              onValueChange={
                handlePushNotificationsChange
              }
              disabled={saving}
              trackColor={{
                false: "#D8DCE0",
                true: "#B8DCF8",
              }}
              thumbColor={
                settings.pushEnabled
                  ? "#5C98C5"
                  : "#FFFFFF"
              }
              ios_backgroundColor="#D8DCE0"
            />
          </View>

          {/* Case Notifications */}
          <SettingsSection
            title="Case Notifications"
          >
            <SettingRow
              icon="medical-outline"
              title="New cases"
              description="Notify me when a new child case is assigned."
              value={
                settings.newCases
              }
              onValueChange={(
                value
              ) =>
                updateSetting(
                  "newCases",
                  value
                )
              }
              disabled={
                !settings.pushEnabled ||
                saving
              }
            />

            <SettingRow
              icon="chatbubble-ellipses-outline"
              title="Parent follow-ups"
              description="Receive alerts when parents add updates or additional information."
              value={
                settings.parentFollowUps
              }
              onValueChange={(
                value
              ) =>
                updateSetting(
                  "parentFollowUps",
                  value
                )
              }
              disabled={
                !settings.pushEnabled ||
                saving
              }
            />

            <SettingRow
              icon="analytics-outline"
              title="Analysis updates"
              description="Receive alerts for new analyses and important emotional changes."
              value={
                settings.analysisUpdates
              }
              onValueChange={(
                value
              ) =>
                updateSetting(
                  "analysisUpdates",
                  value
                )
              }
              disabled={
                !settings.pushEnabled ||
                saving
              }
              last
            />
          </SettingsSection>

          {/* Reports and Account */}
          <SettingsSection
            title="Reports & Account"
          >
            <SettingRow
              icon="calendar-outline"
              title="Weekly summary"
              description="Receive a notification when your weekly progress report is ready."
              value={
                settings.weeklySummary
              }
              onValueChange={(
                value
              ) =>
                updateSetting(
                  "weeklySummary",
                  value
                )
              }
              disabled={
                !settings.pushEnabled ||
                saving
              }
            />

            <SettingRow
              icon="shield-checkmark-outline"
              title="Account and security"
              description="Receive alerts about login, password and verification changes."
              value={
                settings.accountSecurity
              }
              onValueChange={(
                value
              ) =>
                updateSetting(
                  "accountSecurity",
                  value
                )
              }
              disabled={
                !settings.pushEnabled ||
                saving
              }
            />

            <SettingRow
              icon="mail-outline"
              title="Email notifications"
              description="Receive important account and weekly summaries by email."
              value={
                settings.emailNotifications
              }
              onValueChange={(
                value
              ) =>
                updateSetting(
                  "emailNotifications",
                  value
                )
              }
              disabled={saving}
              last
            />
          </SettingsSection>

          {/* Important Notice */}
          <View
            style={styles.noticeCard}
          >
            <View
              style={
                styles.noticeIcon
              }
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#648FB4"
              />
            </View>

            <Text
              style={
                styles.noticeText
              }
            >
              Critical security notices may
              still be sent even when optional
              notifications are disabled.
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSave}
            disabled={
              !hasChanges ||
              saving
            }
            style={[
              styles.saveButtonWrapper,
              (!hasChanges ||
                saving) &&
                styles.disabledButton,
            ]}
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
                styles.saveButton
              }
            >
              {saving ? (
                <ActivityIndicator
                  color="#25282B"
                />
              ) : (
                <>
                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    Save Preferences
                  </Text>

                  <Ionicons
                    name="checkmark-outline"
                    size={19}
                    color="#25282B"
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>

      {/* Feedback Modal */}
      <Modal
        visible={
          feedback !== null
        }
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setFeedback(null)
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={styles.modalCard}
          >
            <LinearGradient
              colors={
                feedback === "saved"
                  ? [
                      "#DDF7E4",
                      "#EAF5FF",
                    ]
                  : [
                      "#FFE4E6",
                      "#FFF1F2",
                    ]
              }
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              style={
                styles.modalIcon
              }
            >
              <Ionicons
                name={
                  feedback === "saved"
                    ? "checkmark-circle-outline"
                    : "alert-circle-outline"
                }
                size={40}
                color={
                  feedback === "saved"
                    ? "#49AD5D"
                    : "#D75A62"
                }
              />

              {feedback === "saved" ? (
                <View
                  style={
                    styles.successBadge
                  }
                >
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color="#FFFFFF"
                  />
                </View>
              ) : null}
            </LinearGradient>

            <View
              style={[
                styles.modalStatusBadge,
                feedback === "saved"
                  ? styles.successStatusBadge
                  : styles.errorStatusBadge,
              ]}
            >
              <View
                style={[
                  styles.modalStatusDot,
                  feedback === "saved"
                    ? styles.successStatusDot
                    : styles.errorStatusDot,
                ]}
              />

              <Text
                style={[
                  styles.modalStatusText,
                  feedback === "saved"
                    ? styles.successStatusText
                    : styles.errorStatusText,
                ]}
              >
                {feedback === "saved"
                  ? "Preferences updated"
                  : "Update failed"}
              </Text>
            </View>

            <Text
              style={
                styles.modalTitle
              }
            >
              {feedback === "saved"
                ? "Notifications updated"
                : "Could not save settings"}
            </Text>

            <Text
              style={
                styles.modalDescription
              }
            >
              {feedback === "saved"
                ? "Your notification preferences have been saved successfully."
                : "Something went wrong while saving your preferences. Please try again."}
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                setFeedback(null)
              }
              style={
                styles.modalButtonWrapper
              }
            >
              <LinearGradient
                colors={[
                  "#8DC0F0",
                  "#F9A8A7",
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
                  styles.modalButton
                }
              >
                <Text
                  style={
                    styles.modalButtonText
                  }
                >
                  {feedback === "saved"
                    ? "Done"
                    : "Try Again"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SettingsSection({
  title,
  children,
}: SettingsSectionProps) {
  return (
    <View
      style={styles.sectionBlock}
    >
      <Text
        style={styles.sectionTitle}
      >
        {title}
      </Text>

      <View
        style={styles.sectionCard}
      >
        {children}
      </View>
    </View>
  );
}

function SettingRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  disabled = false,
  last = false,
}: SettingRowProps) {
  return (
    <View
      style={[
        styles.settingRow,
        !last &&
          styles.settingRowBorder,
        disabled &&
          styles.settingRowDisabled,
      ]}
    >
      <View
        style={styles.settingIcon}
      >
        <Ionicons
          name={icon}
          size={20}
          color="#6C95B5"
        />
      </View>

      <View
        style={
          styles.settingContent
        }
      >
        <Text
          style={
            styles.settingTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.settingDescription
          }
        >
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={
          onValueChange
        }
        disabled={disabled}
        trackColor={{
          false: "#D8DCE0",
          true: "#B8DCF8",
        }}
        thumbColor={
          value
            ? "#5C98C5"
            : "#FFFFFF"
        }
        ios_backgroundColor="#D8DCE0"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  background: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },

  loadingText: {
    fontSize: 12,
    color: "#7D838A",
  },

  scrollContent: {
    paddingHorizontal: 18,
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

  headerPlaceholder: {
    width: 40,
  },

  introduction: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 18,
  },

  introductionIcon: {
    width: 56,
    height: 56,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  introductionContent: {
    flex: 1,
  },

  pageTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#24282C",
  },

  pageSubtitle: {
    marginTop: 5,
    fontSize: 9.5,
    lineHeight: 15,
    color: "#878D93",
  },

  masterCard: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF5FF",
    borderWidth: 1,
    borderColor: "#D9EAF7",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 19,
  },

  masterIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 10,
  },

  sectionBlock: {
    marginBottom: 17,
  },

  sectionTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#34393D",
    marginBottom: 9,
  },

  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7ECEF",
    borderRadius: 15,
    paddingHorizontal: 12,
  },

  settingRow: {
    minHeight: 80,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#ECEFF1",
  },

  settingRowDisabled: {
    opacity: 0.45,
  },

  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F7FD",
    marginRight: 10,
  },

  settingContent: {
    flex: 1,
    paddingRight: 8,
  },

  settingTitle: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#34393D",
  },

  settingDescription: {
    marginTop: 4,
    fontSize: 8.5,
    lineHeight: 13,
    color: "#8A9197",
  },

  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F0F7FD",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 15,
  },

  noticeIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 9,
  },

  noticeText: {
    flex: 1,
    fontSize: 8.8,
    lineHeight: 14,
    color: "#6B8498",
  },

  saveButtonWrapper: {
    width: "100%",
  },

  disabledButton: {
    opacity: 0.55,
  },

  saveButton: {
    height: 54,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  saveButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#25282B",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      "rgba(24,30,35,0.56)",
    paddingHorizontal: 22,
  },

  modalCard: {
    width: "100%",
    maxWidth: 390,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 14,
  },

  modalIcon: {
    position: "relative",
    width: 91,
    height: 91,
    borderRadius: 46,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  successBadge: {
    position: "absolute",
    right: 1,
    bottom: 3,
    width: 29,
    height: 29,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4DBA63",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  modalStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginBottom: 12,
  },

  successStatusBadge: {
    backgroundColor: "#E7F8EB",
  },

  errorStatusBadge: {
    backgroundColor: "#FFF0F1",
  },

  modalStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  successStatusDot: {
    backgroundColor: "#439D56",
  },

  errorStatusDot: {
    backgroundColor: "#C8545C",
  },

  modalStatusText: {
    fontSize: 9,
    fontWeight: "700",
  },

  successStatusText: {
    color: "#439D56",
  },

  errorStatusText: {
    color: "#C8545C",
  },

  modalTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    color: "#22262A",
    textAlign: "center",
  },

  modalDescription: {
    maxWidth: 320,
    marginTop: 9,
    fontSize: 11,
    lineHeight: 17,
    color: "#858B92",
    textAlign: "center",
  },

  modalButtonWrapper: {
    width: "100%",
    marginTop: 21,
  },

  modalButton: {
    height: 52,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  modalButtonText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#171A1E",
  },
});