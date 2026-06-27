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
  type Href,
} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

type IoniconName =
  keyof typeof Ionicons.glyphMap;

type SecurityPreferences = {
  biometricLock: boolean;
  twoStepVerification: boolean;
};

type ModalType =
  | "saved"
  | "save_error"
  | "sign_out_confirm"
  | "delete_confirm"
  | "delete_requested"
  | "data_request_submitted"
  | null;

type ModalContent = {
  icon: IoniconName;
  iconColor: string;
  colors: readonly [string, string];
  badge: string;
  badgeBackground: string;
  badgeColor: string;
  title: string;
  description: string;
  primaryText: string;
  secondaryText?: string;
  destructive?: boolean;
};

type ToggleRowProps = {
  icon: IoniconName;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (
    value: boolean
  ) => void;
  disabled?: boolean;
  last?: boolean;
};

type NavigationRowProps = {
  icon: IoniconName;
  title: string;
  description: string;
  onPress: () => void;
  last?: boolean;
};

type SettingsSectionProps = {
  title: string;
  children: React.ReactNode;
};

const SECURITY_STORAGE_KEY =
  "doctorSecuritySettings";

const DEFAULT_SECURITY_SETTINGS: SecurityPreferences =
  {
    biometricLock: false,
    twoStepVerification: false,
  };

export default function PrivacySecurityScreen() {
  const [
    securitySettings,
    setSecuritySettings,
  ] = useState<SecurityPreferences>(
    DEFAULT_SECURITY_SETTINGS
  );

  const [
    savedSecuritySettings,
    setSavedSecuritySettings,
  ] = useState<SecurityPreferences>(
    DEFAULT_SECURITY_SETTINGS
  );

  const [
    initialLoading,
    setInitialLoading,
  ] = useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    modalType,
    setModalType,
  ] = useState<ModalType>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSecuritySettings =
      async () => {
        try {
          const storedValue =
            await AsyncStorage.getItem(
              SECURITY_STORAGE_KEY
            );

          if (!isMounted) return;

          if (storedValue) {
            const parsedValue =
              JSON.parse(
                storedValue
              ) as Partial<SecurityPreferences>;

            const loadedSettings: SecurityPreferences =
              {
                ...DEFAULT_SECURITY_SETTINGS,
                ...parsedValue,
              };

            setSecuritySettings(
              loadedSettings
            );

            setSavedSecuritySettings(
              loadedSettings
            );
          }
        } catch (error) {
          console.log(
            "Load security settings error:",
            error
          );
        } finally {
          if (isMounted) {
            setInitialLoading(false);
          }
        }
      };

    loadSecuritySettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasChanges = useMemo(() => {
    return (
      JSON.stringify(
        securitySettings
      ) !==
      JSON.stringify(
        savedSecuritySettings
      )
    );
  }, [
    securitySettings,
    savedSecuritySettings,
  ]);

  const updateSetting = (
    key: keyof SecurityPreferences,
    value: boolean
  ) => {
    setSecuritySettings(
      (previousSettings) => ({
        ...previousSettings,
        [key]: value,
      })
    );
  };

  const handleBack = () => {
    if (saving) return;

    router.back();
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
        SECURITY_STORAGE_KEY,
        JSON.stringify(
          securitySettings
        )
      );

      setSavedSecuritySettings({
        ...securitySettings,
      });

      setModalType("saved");
    } catch (error) {
      console.log(
        "Save security settings error:",
        error
      );

      setModalType(
        "save_error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      /*
        بنمسح بيانات الـSession فقط.

        حالة التحقق Professional Verification
        وبيانات الحساب لا يتم حذفها.
      */
      await AsyncStorage.multiRemove([
        "token",
        "user",
        "doctorAccessEnabled",
        "verificationPreviewAccess",
      ]);

      setModalType(null);

      router.replace(
        "/auth/login" as Href
      );
    } catch (error) {
      console.log(
        "Sign out error:",
        error
      );

      setModalType(
        "save_error"
      );
    }
  };

  const handleDataRequest =
    async () => {
      try {
        await AsyncStorage.multiSet([
          [
            "doctorDataExportRequestStatus",
            "pending",
          ],
          [
            "doctorDataExportRequestedAt",
            new Date().toISOString(),
          ],
        ]);

        setModalType(
          "data_request_submitted"
        );
      } catch (error) {
        console.log(
          "Data request error:",
          error
        );

        setModalType(
          "save_error"
        );
      }
    };

  const handleDeleteRequest =
    async () => {
      try {
        /*
          ده طلب حذف تجريبي فقط.

          في نسخة الـBackend:
          لازم يتبعت Request للسيرفر
          ولا يتم حذف الحساب مباشرة
          من الموبايل.
        */
        await AsyncStorage.multiSet([
          [
            "accountDeletionRequestStatus",
            "pending",
          ],
          [
            "accountDeletionRequestedAt",
            new Date().toISOString(),
          ],
        ]);

        setModalType(
          "delete_requested"
        );
      } catch (error) {
        console.log(
          "Delete account request error:",
          error
        );

        setModalType(
          "save_error"
        );
      }
    };

  const handleModalPrimaryAction =
    () => {
      switch (modalType) {
        case "sign_out_confirm":
          handleSignOut();
          return;

        case "delete_confirm":
          handleDeleteRequest();
          return;

        default:
          setModalType(null);
      }
    };

  const modalContent =
    useMemo<ModalContent>(() => {
      switch (modalType) {
        case "saved":
          return {
            icon:
              "checkmark-circle-outline",

            iconColor:
              "#49AD5D",

            colors: [
              "#DDF7E4",
              "#EAF5FF",
            ],

            badge:
              "Security updated",

            badgeBackground:
              "#E7F8EB",

            badgeColor:
              "#439D56",

            title:
              "Settings saved",

            description:
              "Your account protection preferences have been updated successfully.",

            primaryText:
              "Done",
          };

        case "sign_out_confirm":
          return {
            icon:
              "log-out-outline",

            iconColor:
              "#D85A62",

            colors: [
              "#FFE4E6",
              "#FFF1F2",
            ],

            badge:
              "Sign out",

            badgeBackground:
              "#FFF0F1",

            badgeColor:
              "#C8545C",

            title:
              "Sign out of this device?",

            description:
              "You will need to enter your email and password to access your doctor account again.",

            primaryText:
              "Sign Out",

            secondaryText:
              "Cancel",

            destructive:
              true,
          };

        case "delete_confirm":
          return {
            icon:
              "trash-outline",

            iconColor:
              "#D85A62",

            colors: [
              "#FFE4E6",
              "#FFF1F2",
            ],

            badge:
              "Account deletion",

            badgeBackground:
              "#FFF0F1",

            badgeColor:
              "#C8545C",

            title:
              "Request account deletion?",

            description:
              "Your request will be submitted for review. Your account will not be deleted immediately.",

            primaryText:
              "Submit Request",

            secondaryText:
              "Cancel",

            destructive:
              true,
          };

        case "delete_requested":
          return {
            icon:
              "time-outline",

            iconColor:
              "#D38A40",

            colors: [
              "#FFF1DE",
              "#FFE7E8",
            ],

            badge:
              "Request pending",

            badgeBackground:
              "#FFF3E5",

            badgeColor:
              "#C47B37",

            title:
              "Deletion request submitted",

            description:
              "Your request is pending review. Support will contact you before any permanent action is taken.",

            primaryText:
              "Done",
          };

        case "data_request_submitted":
          return {
            icon:
              "download-outline",

            iconColor:
              "#6595BB",

            colors: [
              "#DDEFFF",
              "#FFE4E6",
            ],

            badge:
              "Data request",

            badgeBackground:
              "#EAF5FF",

            badgeColor:
              "#5C88AA",

            title:
              "Data request submitted",

            description:
              "Your request for a copy of your account data has been recorded.",

            primaryText:
              "Done",
          };

        case "save_error":
        default:
          return {
            icon:
              "alert-circle-outline",

            iconColor:
              "#D75A62",

            colors: [
              "#FFE4E6",
              "#FFF1F2",
            ],

            badge:
              "Action failed",

            badgeBackground:
              "#FFF0F1",

            badgeColor:
              "#C8545C",

            title:
              "Action could not be completed",

            description:
              "Something went wrong. Please try again.",

            primaryText:
              "Try Again",
          };
      }
    }, [modalType]);

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
              Loading security settings...
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
              activeOpacity={0.7}
              onPress={handleBack}
              disabled={saving}
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
              Privacy & Security
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
                name="shield-checkmark-outline"
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
                Keep your account secure
              </Text>

              <Text
                style={
                  styles.pageSubtitle
                }
              >
                Manage sign-in protection,
                active sessions and account
                data requests.
              </Text>
            </View>
          </View>

          {/* Sign-in Protection */}
          <SettingsSection
            title="Sign-in Protection"
          >
            <ToggleRow
              icon="finger-print-outline"
              title="Biometric lock"
              description="Require fingerprint or Face ID before opening the app."
              value={
                securitySettings.biometricLock
              }
              onValueChange={(
                value
              ) =>
                updateSetting(
                  "biometricLock",
                  value
                )
              }
              disabled={saving}
            />

            <ToggleRow
              icon="key-outline"
              title="Two-step verification"
              description="Use an additional verification code when signing in on a new device."
              value={
                securitySettings.twoStepVerification
              }
              onValueChange={(
                value
              ) =>
                updateSetting(
                  "twoStepVerification",
                  value
                )
              }
              disabled={saving}
              last
            />
          </SettingsSection>

          {/* Current Session */}
          <SettingsSection
            title="Current Session"
          >
            <View
              style={
                styles.sessionRow
              }
            >
              <View
                style={
                  styles.sessionIcon
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
                  styles.sessionContent
                }
              >
                <Text
                  style={
                    styles.sessionTitle
                  }
                >
                  Current mobile device
                </Text>

                <Text
                  style={
                    styles.sessionDescription
                  }
                >
                  Active now · This session
                </Text>
              </View>

              <View
                style={
                  styles.currentBadge
                }
              >
                <View
                  style={
                    styles.currentDot
                  }
                />

                <Text
                  style={
                    styles.currentBadgeText
                  }
                >
                  Current
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                setModalType(
                  "sign_out_confirm"
                )
              }
              style={
                styles.signOutButton
              }
            >
              <Ionicons
                name="log-out-outline"
                size={18}
                color="#D85A62"
              />

              <Text
                style={
                  styles.signOutButtonText
                }
              >
                Sign out this device
              </Text>
            </TouchableOpacity>
          </SettingsSection>

          {/* Data and Privacy */}
          <SettingsSection
            title="Data & Privacy"
          >
            <NavigationRow
              icon="document-text-outline"
              title="Terms & Conditions"
              description="Read the rules governing your use of Emora."
              onPress={() =>
                router.push(
                  "/doctor/settings/terms-conditions" as Href
                )
              }
            />

            <NavigationRow
              icon="eye-off-outline"
              title="Protected professional data"
              description="National ID, medical license and syndicate details remain private."
              onPress={() => undefined}
            />

            <NavigationRow
              icon="download-outline"
              title="Request a copy of your data"
              description="Request a downloadable copy of your account information."
              onPress={
                handleDataRequest
              }
              last
            />
          </SettingsSection>

          {/* Privacy Notice */}
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
                size={20}
                color="#648FB4"
              />
            </View>

            <View
              style={
                styles.privacyNoticeContent
              }
            >
              <Text
                style={
                  styles.privacyNoticeTitle
                }
              >
                Professional information is protected
              </Text>

              <Text
                style={
                  styles.privacyNoticeText
                }
              >
                Sensitive verification data
                is not displayed publicly and
                cannot be edited without a new
                verification review.
              </Text>
            </View>
          </View>

          {/* Danger Zone */}
          <View
            style={styles.dangerCard}
          >
            <View
              style={
                styles.dangerHeader
              }
            >
              <View
                style={
                  styles.dangerIcon
                }
              >
                <Ionicons
                  name="trash-outline"
                  size={21}
                  color="#D85A62"
                />
              </View>

              <View
                style={
                  styles.dangerContent
                }
              >
                <Text
                  style={
                    styles.dangerTitle
                  }
                >
                  Delete account request
                </Text>

                <Text
                  style={
                    styles.dangerDescription
                  }
                >
                  Submit a request to
                  permanently remove your
                  doctor account and associated
                  profile data.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                setModalType(
                  "delete_confirm"
                )
              }
              style={
                styles.deleteButton
              }
            >
              <Text
                style={
                  styles.deleteButtonText
                }
              >
                Request Account Deletion
              </Text>
            </TouchableOpacity>
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
                    Save Security Settings
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

      {/* Action Modal */}
      <Modal
        visible={
          modalType !== null
        }
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setModalType(null)
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
                modalContent.colors
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
                  modalContent.icon
                }
                size={40}
                color={
                  modalContent.iconColor
                }
              />
            </LinearGradient>

            <View
              style={[
                styles.modalBadge,
                {
                  backgroundColor:
                    modalContent.badgeBackground,
                },
              ]}
            >
              <View
                style={[
                  styles.modalBadgeDot,
                  {
                    backgroundColor:
                      modalContent.badgeColor,
                  },
                ]}
              />

              <Text
                style={[
                  styles.modalBadgeText,
                  {
                    color:
                      modalContent.badgeColor,
                  },
                ]}
              >
                {modalContent.badge}
              </Text>
            </View>

            <Text
              style={
                styles.modalTitle
              }
            >
              {modalContent.title}
            </Text>

            <Text
              style={
                styles.modalDescription
              }
            >
              {
                modalContent.description
              }
            </Text>

            <View
              style={
                styles.modalActions
              }
            >
              {modalContent.secondaryText ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    setModalType(null)
                  }
                  style={
                    styles.modalSecondaryButton
                  }
                >
                  <Text
                    style={
                      styles.modalSecondaryText
                    }
                  >
                    {
                      modalContent.secondaryText
                    }
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={
                  handleModalPrimaryAction
                }
                style={[
                  styles.modalPrimaryWrapper,
                  !modalContent.secondaryText &&
                    styles.modalPrimaryFullWidth,
                ]}
              >
                {modalContent.destructive ? (
                  <View
                    style={
                      styles.destructiveButton
                    }
                  >
                    <Text
                      style={
                        styles.destructiveButtonText
                      }
                    >
                      {
                        modalContent.primaryText
                      }
                    </Text>
                  </View>
                ) : (
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
                      styles.modalPrimaryButton
                    }
                  >
                    <Text
                      style={
                        styles.modalPrimaryText
                      }
                    >
                      {
                        modalContent.primaryText
                      }
                    </Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
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

function ToggleRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  disabled = false,
  last = false,
}: ToggleRowProps) {
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

function NavigationRow({
  icon,
  title,
  description,
  onPress,
  last = false,
}: NavigationRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.settingRow,
        !last &&
          styles.settingRowBorder,
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

      <Ionicons
        name="chevron-forward"
        size={19}
        color="#8F969D"
      />
    </TouchableOpacity>
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
    overflow: "hidden",
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
    opacity: 0.5,
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

  sessionRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  sessionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F7FD",
    marginRight: 10,
  },

  sessionContent: {
    flex: 1,
    paddingRight: 6,
  },

  sessionTitle: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#34393D",
  },

  sessionDescription: {
    marginTop: 4,
    fontSize: 8.5,
    color: "#8A9197",
  },

  currentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E7F8EB",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#43A257",
  },

  currentBadgeText: {
    fontSize: 7.5,
    fontWeight: "600",
    color: "#43A257",
  },

  signOutButton: {
    height: 48,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: "#ECEFF1",
  },

  signOutButtonText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#D85A62",
  },

  privacyNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EAF5FF",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 15,
  },

  privacyNoticeIcon: {
    width: 37,
    height: 37,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 9,
  },

  privacyNoticeContent: {
    flex: 1,
  },

  privacyNoticeTitle: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#59768C",
  },

  privacyNoticeText: {
    marginTop: 5,
    fontSize: 8.8,
    lineHeight: 14,
    color: "#6A8397",
  },

  dangerCard: {
    backgroundColor: "#FFF4F5",
    borderWidth: 1,
    borderColor: "#F3D1D4",
    borderRadius: 15,
    padding: 12,
    marginBottom: 15,
  },

  dangerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  dangerIcon: {
    width: 41,
    height: 41,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 10,
  },

  dangerContent: {
    flex: 1,
  },

  dangerTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8D4E53",
  },

  dangerDescription: {
    marginTop: 5,
    fontSize: 8.8,
    lineHeight: 14,
    color: "#A06B70",
  },

  deleteButton: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E46A71",
    borderRadius: 999,
    marginTop: 12,
  },

  deleteButtonText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#D85A62",
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
    width: 91,
    height: 91,
    borderRadius: 46,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  modalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginBottom: 12,
  },

  modalBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  modalBadgeText: {
    fontSize: 9,
    fontWeight: "700",
  },

  modalTitle: {
    maxWidth: 310,
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

  modalActions: {
    width: "100%",
    flexDirection: "row",
    gap: 9,
    marginTop: 21,
  },

  modalSecondaryButton: {
    flex: 1,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE3E7",
    borderRadius: 999,
  },

  modalSecondaryText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#6A7279",
  },

  modalPrimaryWrapper: {
    flex: 1,
  },

  modalPrimaryFullWidth: {
    flex: 0,
    width: "100%",
  },

  modalPrimaryButton: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
  },

  modalPrimaryText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#171A1E",
  },

  destructiveButton: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#E8656C",
  },

  destructiveButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});