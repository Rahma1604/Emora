import React, {
  useEffect,
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

type RequirementCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  iconColor: string;
  iconBackground: string;
};

type VerificationStep =
  | "intro"
  | "professional-info"
  | "documents"
  | "review"
  | "status"
  | "pending";

export default function VerificationIntroScreen() {
  const [loading, setLoading] =
    useState(false);

  const [
    screenLoading,
    setScreenLoading,
  ] = useState(true);

  const [
    savedCurrentStep,
    setSavedCurrentStep,
  ] =
    useState<VerificationStep>("intro");

  useEffect(() => {
    let isMounted = true;

    const prepareVerification =
      async () => {
        try {
          const storedValues =
            await AsyncStorage.multiGet([
              "role",
              "verificationEmail",
              "verificationStatus",
              "verificationCurrentStep",
            ]);

          const values =
            Object.fromEntries(
              storedValues
            );

          const savedRole =
            values.role;

          const savedEmail =
            values.verificationEmail;

          const verificationStatus =
            values.verificationStatus;

          const currentStep =
            values.verificationCurrentStep as
              | VerificationStep
              | null;

          /*
            الصفحة مخصصة فقط للدكتور
            الذي بدأ التسجيل.
          */
          if (
            savedRole !== "doctor" ||
            !savedEmail
          ) {
            router.replace(
              "/auth/register" as Href
            );

            return;
          }

          /*
            لو الدكتور أرسل طلب التحقق
            بالفعل، لا نرجعه إلى البداية.
          */
          if (
            verificationStatus ===
              "pending" ||
            verificationStatus ===
              "submitted"
          ) {
            router.replace(
              "/doctor/doctor-verification/pending" as Href
            );

            return;
          }

          if (
            verificationStatus ===
            "approved"
          ) {
            router.replace(
              "/doctor/doctor-verification/approved" as Href
            );

            return;
          }

          if (
            verificationStatus ===
            "rejected"
          ) {
            router.replace(
              "/doctor/doctor-verification/rejected" as Href
            );

            return;
          }

          if (
            currentStep &&
            [
              "intro",
              "professional-info",
              "documents",
              "review",
              "status",
              "pending",
            ].includes(currentStep)
          ) {
            if (isMounted) {
              setSavedCurrentStep(
                currentStep
              );
            }
          } else {
            await AsyncStorage.setItem(
              "verificationCurrentStep",
              "intro"
            );

            if (isMounted) {
              setSavedCurrentStep(
                "intro"
              );
            }
          }
        } catch (error) {
          console.log(
            "Error preparing professional verification:",
            error
          );
        } finally {
          if (isMounted) {
            setScreenLoading(false);
          }
        }
      };

    prepareVerification();

    return () => {
      isMounted = false;
    };
  }, []);

  const getStepRoute = (
    step: VerificationStep
  ): Href => {
    switch (step) {
      case "documents":
        return "/doctor/doctor-verification/documents" as Href;

      case "review":
        return "/doctor/doctor-verification/review" as Href;

      case "status":
        return "/doctor/doctor-verification/status" as Href;

      case "pending":
        return "/doctor/doctor-verification/pending" as Href;

      case "professional-info":
      case "intro":
      default:
        return "/doctor/doctor-verification/professional-info" as Href;
    }
  };

  const handleBack = () => {
    if (loading) return;

    router.back();
  };

  const handleStartVerification =
    async () => {
      if (loading) return;

      try {
        setLoading(true);

        /*
          لو الدكتور بدأ الفلو قبل كده،
          نكمل من آخر خطوة محفوظة.
        */
        const nextStep:
          VerificationStep =
          savedCurrentStep === "intro"
            ? "professional-info"
            : savedCurrentStep;

        await AsyncStorage.multiSet([
          [
            "verificationStatus",
            "draft",
          ],
          [
            "verificationCurrentStep",
            nextStep,
          ],
        ]);

        router.push(
          getStepRoute(nextStep)
        );
      } catch (error) {
        console.log(
          "Error starting professional verification:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  const openSupport = () => {
    if (loading) return;

    router.push(
      "/contact-support" as Href
    );
  };

  const hasStartedVerification =
    savedCurrentStep !== "intro";

  if (screenLoading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />

        <LinearGradient
          colors={[
            "#EEF7FF",
            "#FFF5F6",
            "#FFFFFF",
          ]}
          locations={[
            0,
            0.38,
            0.72,
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 0.18,
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
              Preparing verification...
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <LinearGradient
        colors={[
          "#EEF7FF",
          "#FFF5F6",
          "#FFFFFF",
        ]}
        locations={[
          0,
          0.38,
          0.72,
        ]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 0.18,
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
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={handleBack}
              disabled={loading}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#1F2937"
              />
            </TouchableOpacity>

            <Text
              style={styles.headerTitle}
            >
              Professional Verification
            </Text>

            <View
              style={
                styles.headerPlaceholder
              }
            />
          </View>

          {/* Progress */}
          <View
            style={
              styles.progressSection
            }
          >
            <View
              style={
                styles.progressHeader
              }
            >
              <Text
                style={styles.stepText}
              >
                Step 1 of 4
              </Text>

              <Text
                style={
                  styles.progressPercentage
                }
              >
                25%
              </Text>
            </View>

            <View
              style={
                styles.progressTrack
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
                  styles.progressValue
                }
              />
            </View>
          </View>

          {/* Main Illustration */}
          <View
            style={styles.heroSection}
          >
            <LinearGradient
              colors={[
                "#DCEFFF",
                "#FFE4E5",
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
                styles.heroIconContainer
              }
            >
              <View
                style={
                  styles.heroInnerCircle
                }
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={54}
                  color="#6EA7D8"
                />
              </View>

              <View
                style={
                  styles.verifiedSmallBadge
                }
              >
                <Ionicons
                  name="checkmark"
                  size={14}
                  color="#FFFFFF"
                />
              </View>
            </LinearGradient>

            <View
              style={styles.accountBadge}
            >
              <Ionicons
                name="medkit-outline"
                size={15}
                color="#6B9BC6"
              />

              <Text
                style={
                  styles.accountBadgeText
                }
              >
                Doctor Verification
              </Text>
            </View>

            <Text style={styles.title}>
              Verify your professional identity
            </Text>

            <Text
              style={styles.subtitle}
            >
              To protect children and
              families, every doctor or
              specialist must verify their
              identity, professional license
              and qualifications before
              reviewing cases.
            </Text>
          </View>

          {/* Requirements */}
          <Text
            style={styles.sectionTitle}
          >
            What we&apos;ll verify
          </Text>

          <View
            style={
              styles.requirementsContainer
            }
          >
            <RequirementCard
              icon="person-outline"
              title="Your identity"
              description="A valid national ID and a recent personal photo."
              iconColor="#5C9BD2"
              iconBackground="#EAF5FF"
            />

            <RequirementCard
              icon="card-outline"
              title="Professional license"
              description="Your valid practice license and professional registration."
              iconColor="#E58A91"
              iconBackground="#FFF0F1"
            />

            <RequirementCard
              icon="school-outline"
              title="Your qualifications"
              description="Graduation and specialization certificates supporting your professional title."
              iconColor="#49A964"
              iconBackground="#EAF8EE"
            />
          </View>

          {/* Privacy Notice */}
          <View
            style={styles.privacyCard}
          >
            <View
              style={styles.privacyIcon}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#608DB4"
              />
            </View>

            <View
              style={
                styles.privacyContent
              }
            >
              <Text
                style={
                  styles.privacyTitle
                }
              >
                Your documents remain
                private
              </Text>

              <Text
                style={
                  styles.privacyText
                }
              >
                Documents are only used
                for verification and will
                never be displayed to
                parents or children.
              </Text>
            </View>
          </View>

          {/* Review Time */}
          <View
            style={
              styles.reviewTimeCard
            }
          >
            <View
              style={
                styles.reviewTimeLeft
              }
            >
              <View
                style={
                  styles.clockIcon
                }
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color="#E59B54"
                />
              </View>

              <View style={styles.flex}>
                <Text
                  style={
                    styles.reviewTimeTitle
                  }
                >
                  Estimated review time
                </Text>

                <Text
                  style={
                    styles.reviewTimeText
                  }
                >
                  Usually completed within
                  1–2 business days
                </Text>
              </View>
            </View>
          </View>

          {/* Restriction Notice */}
          <View
            style={
              styles.restrictionBox
            }
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#E18B90"
            />

            <Text
              style={
                styles.restrictionText
              }
            >
              You won&apos;t be able to
              access child cases or send
              professional recommendations
              until your account is
              approved.
            </Text>
          </View>

          {/* Main Button */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={
              handleStartVerification
            }
            disabled={loading}
            style={[
              styles.startButtonWrapper,
              loading &&
                styles.disabledButton,
            ]}
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
                styles.startButton
              }
            >
              {loading ? (
                <ActivityIndicator
                  color="#171A1E"
                />
              ) : (
                <>
                  <Text
                    style={
                      styles.startButtonText
                    }
                  >
                    {hasStartedVerification
                      ? "Continue Verification"
                      : "Start Verification"}
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={19}
                    color="#171A1E"
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Support */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={openSupport}
            disabled={loading}
            style={
              styles.supportButton
            }
          >
            <Ionicons
              name="help-circle-outline"
              size={17}
              color="#7DAAD1"
            />

            <Text
              style={
                styles.supportText
              }
            >
              Need help? Contact Support
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function RequirementCard({
  icon,
  title,
  description,
  iconColor,
  iconBackground,
}: RequirementCardProps) {
  return (
    <View
      style={styles.requirementCard}
    >
      <View
        style={[
          styles.requirementIcon,
          {
            backgroundColor:
              iconBackground,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={iconColor}
        />
      </View>

      <View
        style={
          styles.requirementContent
        }
      >
        <Text
          style={
            styles.requirementTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.requirementDescription
          }
        >
          {description}
        </Text>
      </View>

      <View
        style={styles.requiredBadge}
      >
        <Text
          style={
            styles.requiredBadgeText
          }
        >
          Required
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

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
    fontSize: 13,
    color: "#858B92",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 28,
  },

  header: {
    height: 54,
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
    fontSize: 16,
    fontWeight: "600",
    color: "#22262A",
  },

  headerPlaceholder: {
    width: 40,
  },

  progressSection: {
    marginTop: 5,
    marginBottom: 24,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  stepText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6E747B",
  },

  progressPercentage: {
    fontSize: 11,
    fontWeight: "600",
    color: "#E38D94",
  },

  progressTrack: {
    width: "100%",
    height: 7,
    backgroundColor: "#ECEEF1",
    borderRadius: 999,
    overflow: "hidden",
  },

  progressValue: {
    width: "25%",
    height: "100%",
    borderRadius: 999,
  },

  heroSection: {
    alignItems: "center",
    marginBottom: 28,
  },

  heroIconContainer: {
    position: "relative",
    width: 112,
    height: 112,
    borderRadius: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 17,
  },

  heroInnerCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      "rgba(255,255,255,0.72)",
  },

  verifiedSmallBadge: {
    position: "absolute",
    right: 8,
    bottom: 9,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#50C66A",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  accountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor:
      "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: "#E6EDF2",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    marginBottom: 12,
  },

  accountBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#65717C",
  },

  title: {
    maxWidth: 310,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "700",
    color: "#202428",
    textAlign: "center",
  },

  subtitle: {
    maxWidth: 325,
    marginTop: 11,
    fontSize: 12.5,
    lineHeight: 20,
    color: "#858B92",
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#292D31",
    marginBottom: 11,
  },

  requirementsContainer: {
    gap: 10,
    marginBottom: 18,
  },

  requirementCard: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "#E6ECF0",
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 11,
  },

  requirementIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  requirementContent: {
    flex: 1,
    paddingRight: 6,
  },

  requirementTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#292D31",
  },

  requirementDescription: {
    marginTop: 5,
    fontSize: 9.5,
    lineHeight: 14,
    color: "#7D838A",
  },

  requiredBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF0F1",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  requiredBadgeText: {
    fontSize: 7.5,
    color: "#E18991",
  },

  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EAF5FF",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 13,
    marginBottom: 11,
  },

  privacyIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 10,
  },

  privacyContent: {
    flex: 1,
  },

  privacyTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#4C6F8D",
  },

  privacyText: {
    marginTop: 5,
    fontSize: 9.5,
    lineHeight: 14,
    color: "#6F879A",
  },

  reviewTimeCard: {
    backgroundColor: "#FFF7EC",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 11,
  },

  reviewTimeLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  clockIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 10,
  },

  reviewTimeTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#7E654D",
  },

  reviewTimeText: {
    marginTop: 4,
    fontSize: 9.5,
    color: "#9B8269",
  },

  restrictionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFF1F2",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },

  restrictionText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 15,
    color: "#9A686D",
  },

  startButtonWrapper: {
    width: "100%",
  },

  disabledButton: {
    opacity: 0.7,
  },

  startButton: {
    height: 56,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  startButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#171A1E",
  },

  supportButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    paddingVertical: 16,
  },

  supportText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#7DAAD1",
  },
});