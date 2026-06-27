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

type LanguageCode =
  | "en"
  | "ar";

type TextDirection =
  | "LTR"
  | "RTL";

type FeedbackType =
  | "saved"
  | "error"
  | null;

type LanguageItem = {
  code: LanguageCode;
  name: string;
  nativeName: string;
  description: string;
  direction: TextDirection;
  iconText: string;
};

const LANGUAGE_STORAGE_KEY =
  "appLanguage";

const DIRECTION_STORAGE_KEY =
  "appTextDirection";

const languages: LanguageItem[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    description:
      "Use Emora in English.",
    direction: "LTR",
    iconText: "EN",
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    description:
      "استخدام تطبيق Emora باللغة العربية.",
    direction: "RTL",
    iconText: "AR",
  },
];

export default function LanguageSettingsScreen() {
  const [
    selectedLanguage,
    setSelectedLanguage,
  ] = useState<LanguageCode>("en");

  const [
    savedLanguage,
    setSavedLanguage,
  ] = useState<LanguageCode>("en");

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

    const loadLanguage =
      async () => {
        try {
          const savedValue =
            await AsyncStorage.getItem(
              LANGUAGE_STORAGE_KEY
            );

          if (!isMounted) return;

          if (
            savedValue === "en" ||
            savedValue === "ar"
          ) {
            setSelectedLanguage(
              savedValue
            );

            setSavedLanguage(
              savedValue
            );
          }
        } catch (error) {
          console.log(
            "Load language error:",
            error
          );
        } finally {
          if (isMounted) {
            setInitialLoading(false);
          }
        }
      };

    loadLanguage();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasChanges =
    selectedLanguage !==
    savedLanguage;

  const selectedLanguageData =
    useMemo(() => {
      return (
        languages.find(
          (language) =>
            language.code ===
            selectedLanguage
        ) || languages[0]
      );
    }, [selectedLanguage]);

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

      await AsyncStorage.multiSet([
        [
          LANGUAGE_STORAGE_KEY,
          selectedLanguage,
        ],
        [
          DIRECTION_STORAGE_KEY,
          selectedLanguageData.direction,
        ],
      ]);

      setSavedLanguage(
        selectedLanguage
      );

      setFeedback("saved");
    } catch (error) {
      console.log(
        "Save language error:",
        error
      );

      setFeedback("error");
    } finally {
      setSaving(false);
    }
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
              Loading language settings...
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
              Language
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
                name="language-outline"
                size={29}
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
                Choose app language
              </Text>

              <Text
                style={
                  styles.pageSubtitle
                }
              >
                Select the language you want
                to use across your doctor
                account.
              </Text>
            </View>
          </View>

          {/* Languages */}
          <View
            style={
              styles.languagesContainer
            }
          >
            {languages.map(
              (language) => {
                const isSelected =
                  selectedLanguage ===
                  language.code;

                return (
                  <TouchableOpacity
                    key={
                      language.code
                    }
                    activeOpacity={0.85}
                    onPress={() =>
                      setSelectedLanguage(
                        language.code
                      )
                    }
                    disabled={saving}
                    style={[
                      styles.languageCard,
                      isSelected &&
                        styles.languageCardSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.languageIcon,
                        isSelected &&
                          styles.languageIconSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.languageIconText,
                          isSelected &&
                            styles.languageIconTextSelected,
                        ]}
                      >
                        {
                          language.iconText
                        }
                      </Text>
                    </View>

                    <View
                      style={
                        styles.languageContent
                      }
                    >
                      <Text
                        style={
                          styles.languageName
                        }
                      >
                        {language.name}
                      </Text>

                      <Text
                        style={
                          styles.languageNativeName
                        }
                      >
                        {
                          language.nativeName
                        }
                      </Text>

                      <Text
                        style={
                          styles.languageDescription
                        }
                      >
                        {
                          language.description
                        }
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.radioOuter,
                        isSelected &&
                          styles.radioOuterSelected,
                      ]}
                    >
                      {isSelected ? (
                        <View
                          style={
                            styles.radioInner
                          }
                        />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }
            )}
          </View>

          {/* Preview */}
          <View
            style={
              styles.previewCard
            }
          >
            <View
              style={
                styles.previewHeader
              }
            >
              <View
                style={
                  styles.previewIcon
                }
              >
                <Ionicons
                  name="eye-outline"
                  size={19}
                  color="#648FB4"
                />
              </View>

              <View
                style={
                  styles.previewHeaderContent
                }
              >
                <Text
                  style={
                    styles.previewTitle
                  }
                >
                  Selection preview
                </Text>

                <Text
                  style={
                    styles.previewSubtitle
                  }
                >
                  How your selected language
                  will be displayed
                </Text>
              </View>
            </View>

            <View
              style={
                styles.previewContent
              }
            >
              <Text
                style={[
                  styles.previewLanguage,
                  selectedLanguage ===
                    "ar" &&
                    styles.arabicPreviewText,
                ]}
              >
                {
                  selectedLanguageData.nativeName
                }
              </Text>

              <View
                style={
                  styles.directionBadge
                }
              >
                <Ionicons
                  name={
                    selectedLanguageData.direction ===
                    "RTL"
                      ? "arrow-back-outline"
                      : "arrow-forward-outline"
                  }
                  size={14}
                  color="#66859D"
                />

                <Text
                  style={
                    styles.directionText
                  }
                >
                  {
                    selectedLanguageData.direction
                  }
                </Text>
              </View>
            </View>
          </View>

          {/* Important Note */}
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

            <View
              style={
                styles.noticeContent
              }
            >
              <Text
                style={
                  styles.noticeTitle
                }
              >
                Language integration notice
              </Text>

              <Text
                style={
                  styles.noticeText
                }
              >
                The selected preference will
                be saved now. Full screen
                translation and automatic RTL
                layout will work after the
                localization system is
                connected.
              </Text>
            </View>
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
                    Save Language
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
                  ? "Language updated"
                  : "Update failed"}
              </Text>
            </View>

            <Text
              style={
                styles.modalTitle
              }
            >
              {feedback === "saved"
                ? "Language preference saved"
                : "Could not save language"}
            </Text>

            <Text
              style={
                styles.modalDescription
              }
            >
              {feedback === "saved"
                ? `${selectedLanguageData.nativeName} is now your selected app language.`
                : "Something went wrong while saving your language preference. Please try again."}
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

  languagesContainer: {
    gap: 11,
    marginBottom: 16,
  },

  languageCard: {
    minHeight: 108,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7ECEF",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 13,
    shadowColor: "#9DABB5",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },

  languageCardSelected: {
    borderColor: "#9BC8EB",
    backgroundColor: "#F4FAFF",
  },

  languageIcon: {
    width: 49,
    height: 49,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F2F4",
    marginRight: 11,
  },

  languageIconSelected: {
    backgroundColor: "#DCEFFF",
  },

  languageIconText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#747C83",
  },

  languageIconTextSelected: {
    color: "#5E91B8",
  },

  languageContent: {
    flex: 1,
    paddingRight: 9,
  },

  languageName: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#30353A",
  },

  languageNativeName: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "600",
    color: "#5E6972",
  },

  languageDescription: {
    marginTop: 5,
    fontSize: 8.8,
    lineHeight: 14,
    color: "#8D949A",
  },

  radioOuter: {
    width: 23,
    height: 23,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#BDC3C8",
  },

  radioOuterSelected: {
    borderColor: "#75AADB",
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#75AADB",
  },

  previewCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7ECEF",
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 13,
    marginBottom: 13,
  },

  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  previewIcon: {
    width: 37,
    height: 37,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EAF5FF",
    marginRight: 9,
  },

  previewHeaderContent: {
    flex: 1,
  },

  previewTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#4A555E",
  },

  previewSubtitle: {
    marginTop: 3,
    fontSize: 8.5,
    color: "#92989E",
  },

  previewContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
    marginTop: 12,
  },

  previewLanguage: {
    flex: 1,
    fontSize: 21,
    fontWeight: "700",
    color: "#2F3438",
  },

  arabicPreviewText: {
    textAlign: "right",
  },

  directionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EAF5FF",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginLeft: 10,
  },

  directionText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#66859D",
  },

  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EAF5FF",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 15,
  },

  noticeIcon: {
    width: 37,
    height: 37,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 9,
  },

  noticeContent: {
    flex: 1,
  },

  noticeTitle: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#59768C",
  },

  noticeText: {
    marginTop: 5,
    fontSize: 8.8,
    lineHeight: 14,
    color: "#6A8397",
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

  modalButtonWrapper: {
    width: "100%",
    marginTop: 21,
  },

  modalButton: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
  },

  modalButtonText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#171A1E",
  },
});