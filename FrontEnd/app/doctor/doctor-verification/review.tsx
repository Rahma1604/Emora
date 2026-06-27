
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import API from "../../api";

type DocumentKey =
  | "nationalIdFront"
  | "nationalIdBack"
  | "practiceLicense"
  | "syndicateCard"
  | "graduationCertificate"
  | "specializationCertificate"
  | "selfie";

type UploadedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  source: "camera" | "gallery" | "file" | "server";
};

type UploadedDocuments = Partial<
  Record<DocumentKey, UploadedFile>
>;

type ServerDocuments = Partial<
  Record<DocumentKey, string>
>;

type VerificationData = {
  fullName: string;
  nationalId: string;
  professionalType: string;
  specialization: string;
  licenseNumber: string;
  syndicateNumber: string;
  university: string;
  graduationYear: string;
  experienceYears: string;
};

type InformationRowProps = {
  label: string;
  value: string;
  isLast?: boolean;
};

type VerificationProfileResponse = {
  doctor: VerificationData & {
    id?: string;
    email?: string;
    role?: "doctor";
    verificationStatus?: string;
    verificationStep?: string;
  };
};

type VerificationDocumentsResponse = {
  documents: ServerDocuments;
  verificationStatus?: string;
  verificationStep?: string;
};

type SubmitVerificationResponse = {
  status: "VERIFICATION_APPROVED";
  message: string;
  token: string;
  verificationStatus: "approved";
  verificationStep: "submitted";
  verificationSubmittedAt?: string;

  user: {
    id: string;
    name?: string;
    fullName: string;
    email: string;
    role: "doctor";
    profilePic?: string;
    specialization?: string;
    professionalType?: string;
    isVerified: boolean;
    verificationStatus: "approved";
    verificationStep: "submitted";
  };
};

const STORAGE_KEYS = {
  verificationToken: "verificationToken",
  fullName: "verificationFullName",
  nationalId: "verificationNationalId",
  professionalType: "verificationProfessionalType",
  specialization: "verificationSpecialization",
  licenseNumber: "verificationLicenseNumber",
  syndicateNumber: "verificationSyndicateNumber",
  university: "verificationUniversity",
  graduationYear: "verificationGraduationYear",
  experienceYears: "verificationExperienceYears",
  documents: "verificationDocuments",
  status: "verificationStatus",
  currentStep: "verificationCurrentStep",
  submittedAt: "verificationSubmittedAt",
};

const DOCUMENT_LABELS: Record<DocumentKey, string> = {
  nationalIdFront: "National ID – Front",
  nationalIdBack: "National ID – Back",
  practiceLicense: "Practice License",
  syndicateCard: "Syndicate Card",
  graduationCertificate: "Graduation Certificate",
  specializationCertificate: "Specialization Certificate",
  selfie: "Recent Selfie",
};

const EMPTY_VERIFICATION_DATA: VerificationData = {
  fullName: "",
  nationalId: "",
  professionalType: "",
  specialization: "",
  licenseNumber: "",
  syndicateNumber: "",
  university: "",
  graduationYear: "",
  experienceYears: "",
};

const getRequestErrorMessage = (
  error: unknown
): string => {
  if (axios.isAxiosError(error)) {
    return String(
      error.response?.data?.msg ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "An unexpected error occurred."
    );
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
};

const getFileNameFromUrl = (
  url: string,
  key: DocumentKey
): string => {
  try {
    const cleanUrl = url.split("?")[0];

    const lastPart =
      cleanUrl.split("/").pop() ||
      `${key}-uploaded`;

    return decodeURIComponent(lastPart);
  } catch {
    return `${key}-uploaded`;
  }
};

const getMimeTypeFromUrl = (
  url: string
): string => {
  const cleanUrl = url
    .split("?")[0]
    .toLowerCase();

  if (cleanUrl.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (cleanUrl.endsWith(".png")) {
    return "image/png";
  }

  if (
    cleanUrl.endsWith(".jpg") ||
    cleanUrl.endsWith(".jpeg")
  ) {
    return "image/jpeg";
  }

  return "image/jpeg";
};

const convertServerDocuments = (
  serverDocuments?: ServerDocuments
): UploadedDocuments => {
  const converted: UploadedDocuments = {};

  if (!serverDocuments) {
    return converted;
  }

  (
    Object.keys(
      serverDocuments
    ) as DocumentKey[]
  ).forEach((key) => {
    const url = serverDocuments[key];

    if (!url) {
      return;
    }

    converted[key] = {
      uri: url,
      name: getFileNameFromUrl(url, key),
      mimeType: getMimeTypeFromUrl(url),
      source: "server",
    };
  });

  return converted;
};

export default function VerificationReviewScreen() {
  const [
    verificationToken,
    setVerificationToken,
  ] = useState("");

  const [
    verificationData,
    setVerificationData,
  ] = useState<VerificationData>(
    EMPTY_VERIFICATION_DATA
  );

  const [documents, setDocuments] =
    useState<UploadedDocuments>({});

  const [confirmed, setConfirmed] =
    useState(false);

  const [
    initialLoading,
    setInitialLoading,
  ] = useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [
    submissionModalVisible,
    setSubmissionModalVisible,
  ] = useState(false);

  useEffect(() => {
    loadVerificationData();
  }, []);

  const uploadedDocuments = useMemo(() => {
    return (
      Object.entries(documents) as Array<
        [DocumentKey, UploadedFile]
      >
    ).filter(([, file]) => Boolean(file));
  }, [documents]);

  const maskedNationalId = useMemo(() => {
    if (!verificationData.nationalId) {
      return "Not provided";
    }

    return `••••••••••${verificationData.nationalId.slice(
      -4
    )}`;
  }, [verificationData.nationalId]);

  const maskedLicenseNumber = useMemo(() => {
    const value =
      verificationData.licenseNumber;

    if (!value) {
      return "Not provided";
    }

    if (value.length <= 4) {
      return value;
    }

    return `•••• ${value.slice(-4)}`;
  }, [verificationData.licenseNumber]);

  const loadVerificationData = async () => {
    try {
      const token =
        await AsyncStorage.getItem(
          STORAGE_KEYS.verificationToken
        );

      if (!token) {
        Alert.alert(
          "Session expired",
          "Please login again to continue your professional verification."
        );

        router.replace(
          "/auth/login" as Href
        );

        return;
      }

      setVerificationToken(token);

      const [
        profileResponse,
        documentsResponse,
      ] = await Promise.all([
        API.get<VerificationProfileResponse>(
          "/auth/doctor-verification/profile",
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        ),

        API.get<VerificationDocumentsResponse>(
          "/auth/doctor-verification/documents",
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        ),
      ]);

      const doctor =
        profileResponse.data.doctor;

      const serverDocuments =
        convertServerDocuments(
          documentsResponse.data.documents
        );

      const nextVerificationData: VerificationData =
        {
          fullName:
            doctor.fullName || "",

          nationalId:
            doctor.nationalId || "",

          professionalType:
            doctor.professionalType || "",

          specialization:
            doctor.specialization || "",

          licenseNumber:
            doctor.licenseNumber || "",

          syndicateNumber:
            doctor.syndicateNumber || "",

          university:
            doctor.university || "",

          graduationYear:
            doctor.graduationYear || "",

          experienceYears:
            doctor.experienceYears || "",
        };

      setVerificationData(
        nextVerificationData
      );

      setDocuments(serverDocuments);

      await AsyncStorage.multiSet([
        [
          STORAGE_KEYS.fullName,
          nextVerificationData.fullName,
        ],
        [
          STORAGE_KEYS.nationalId,
          nextVerificationData.nationalId,
        ],
        [
          STORAGE_KEYS.professionalType,
          nextVerificationData.professionalType,
        ],
        [
          STORAGE_KEYS.specialization,
          nextVerificationData.specialization,
        ],
        [
          STORAGE_KEYS.licenseNumber,
          nextVerificationData.licenseNumber,
        ],
        [
          STORAGE_KEYS.syndicateNumber,
          nextVerificationData.syndicateNumber,
        ],
        [
          STORAGE_KEYS.university,
          nextVerificationData.university,
        ],
        [
          STORAGE_KEYS.graduationYear,
          nextVerificationData.graduationYear,
        ],
        [
          STORAGE_KEYS.experienceYears,
          nextVerificationData.experienceYears,
        ],
        [
          STORAGE_KEYS.documents,
          JSON.stringify(serverDocuments),
        ],
        [
          STORAGE_KEYS.status,
          doctor.verificationStatus ||
            "draft",
        ],
        [
          STORAGE_KEYS.currentStep,
          doctor.verificationStep ||
            "review",
        ],
      ]);

      const verificationStatus =
        doctor.verificationStatus;

      if (
        verificationStatus === "pending"
      ) {
        router.replace(
          "/doctor/doctor-verification/pending" as Href
        );

        return;
      }

      if (
        verificationStatus === "approved"
      ) {
        router.replace(
          "/doctor/doctor-verification/approved" as Href
        );

        return;
      }

      if (
        verificationStatus === "rejected"
      ) {
        router.replace(
          "/doctor/doctor-verification/rejected" as Href
        );
      }
    } catch (error) {
      console.log(
        "FAILED TO LOAD VERIFICATION REVIEW:",
        error
      );

      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 401 ||
          error.response?.status === 403)
      ) {
        await AsyncStorage.removeItem(
          STORAGE_KEYS.verificationToken
        );

        Alert.alert(
          "Session expired",
          "Please login again to continue your professional verification."
        );

        router.replace(
          "/auth/login" as Href
        );

        return;
      }

      Alert.alert(
        "Loading failed",
        getRequestErrorMessage(error)
      );
    } finally {
      setInitialLoading(false);
    }
  };

  const handleEditInformation = () => {
    if (submitting) {
      return;
    }

    router.push(
      "/doctor/doctor-verification/professional-info" as Href
    );
  };

  const handleEditDocuments = () => {
    if (submitting) {
      return;
    }

    router.push(
      "/doctor/doctor-verification/documents" as Href
    );
  };

  const handleContinueAfterApproval = () => {
    setSubmissionModalVisible(false);

    router.replace(
      "/doctor/doctor-verification/approved" as Href
    );
  };

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    if (!confirmed) {
      Alert.alert(
        "Confirmation required",
        "Please confirm that all submitted information and documents are authentic."
      );

      return;
    }

    if (uploadedDocuments.length === 0) {
      Alert.alert(
        "Documents missing",
        "Please upload your required documents before submitting."
      );

      return;
    }

    if (!verificationToken) {
      Alert.alert(
        "Session expired",
        "Please login again to continue your professional verification."
      );

      router.replace(
        "/auth/login" as Href
      );

      return;
    }

    try {
      setSubmitting(true);

      const response =
        await API.post<SubmitVerificationResponse>(
          "/auth/doctor-verification/submit",
          {},
          {
            headers: {
              Authorization:
                `Bearer ${verificationToken}`,
            },
          }
        );

      const submittedAt =
        response.data.verificationSubmittedAt ||
        new Date().toISOString();

      await AsyncStorage.multiSet([
        [
          "token",
          response.data.token,
        ],
        [
          "user",
          JSON.stringify(
            response.data.user
          ),
        ],
        ["role", "doctor"],
        [
          STORAGE_KEYS.status,
          "approved",
        ],
        [
          STORAGE_KEYS.currentStep,
          "submitted",
        ],
        [
          STORAGE_KEYS.submittedAt,
          submittedAt,
        ],
        [
          "doctorAccessEnabled",
          "true",
        ],
        [
          "hasSeenVerificationApproval",
          "false",
        ],
        [
          "verificationApprovedAt",
          submittedAt,
        ],
      ]);

      await AsyncStorage.multiRemove([
        STORAGE_KEYS.verificationToken,
        "verificationPreviewAccess",
        "verificationRejectedAt",
        "verificationRejectionReason",
      ]);

      setVerificationToken("");

      setSubmissionModalVisible(true);
    } catch (error) {
      console.log(
        "FAILED TO SUBMIT VERIFICATION REQUEST:",
        error
      );

      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 401 ||
          error.response?.status === 403)
      ) {
        await AsyncStorage.removeItem(
          STORAGE_KEYS.verificationToken
        );

        Alert.alert(
          "Session expired",
          "Please login again to continue your professional verification."
        );

        router.replace(
          "/auth/login" as Href
        );

        return;
      }

      Alert.alert(
        "Submission failed",
        getRequestErrorMessage(error)
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
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
          locations={[0, 0.38, 0.72]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.18 }}
          style={styles.background}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#8DC0F0"
            />

            <Text style={styles.loadingText}>
              Preparing your application...
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
        locations={[0, 0.38, 0.72]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.18 }}
        style={styles.background}
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }


          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerBackButton}
              activeOpacity={0.7}
              onPress={() => router.back()}
              disabled={submitting}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#1F2937"
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              Review & Submit
            </Text>

            <View
              style={styles.headerPlaceholder}
            />
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressStep}>
                Step 4 of 4
              </Text>

              <Text
                style={styles.progressPercentage}
              >
                100%
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <LinearGradient
                colors={[
                  "#8DC0F0",
                  "#F9A8A7",
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.progressFill}
              />
            </View>
          </View>

          <View style={styles.introduction}>
            <LinearGradient
              colors={[
                "#DDEFFF",
                "#FFE5E6",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.introductionIcon}
            >
              <Ionicons
                name="document-text-outline"
                size={31}
                color="#6D9EC8"
              />
            </LinearGradient>

            <View
              style={
                styles.introductionContent
              }
            >
              <Text style={styles.pageTitle}>
                Review your application
              </Text>

              <Text style={styles.pageSubtitle}>
                Make sure your information is
                correct before submitting it for
                verification.
              </Text>
            </View>
          </View>

          <View style={styles.noticeCard}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#648FB4"
            />

            <Text style={styles.noticeText}>
              After submitting, your verification
              will be completed and your doctor
              account will be activated.
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View
                style={styles.sectionTitleRow}
              >
                <View
                  style={[
                    styles.sectionIcon,
                    styles.blueSectionIcon,
                  ]}
                >
                  <Ionicons
                    name="briefcase-outline"
                    size={20}
                    color="#6397C2"
                  />
                </View>

                <Text
                  style={styles.sectionTitle}
                >
                  Professional Information
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={
                  handleEditInformation
                }
                disabled={submitting}
                style={styles.editButton}
              >
                <Ionicons
                  name="pencil-outline"
                  size={15}
                  color="#699DC7"
                />

                <Text
                  style={
                    styles.editButtonText
                  }
                >
                  Edit
                </Text>
              </TouchableOpacity>
            </View>

            <InformationRow
              label="Full legal name"
              value={
                verificationData.fullName ||
                "Not provided"
              }
            />

            <InformationRow
              label="National ID"
              value={maskedNationalId}
            />

            <InformationRow
              label="Professional type"
              value={
                verificationData.professionalType ||
                "Not provided"
              }
            />

            <InformationRow
              label="Specialization"
              value={
                verificationData.specialization ||
                "Not provided"
              }
            />

            <InformationRow
              label="Practice license"
              value={maskedLicenseNumber}
            />

            {verificationData.syndicateNumber ? (
              <InformationRow
                label="Syndicate number"
                value={`•••• ${verificationData.syndicateNumber.slice(
                  -4
                )}`}
              />
            ) : null}

            <InformationRow
              label="University"
              value={
                verificationData.university ||
                "Not provided"
              }
            />

            <InformationRow
              label="Graduation year"
              value={
                verificationData.graduationYear ||
                "Not provided"
              }
            />

            <InformationRow
              label="Experience"
              value={
                verificationData.experienceYears
                  ? `${verificationData.experienceYears} years`
                  : "Not provided"
              }
              isLast
            />
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View
                style={styles.sectionTitleRow}
              >
                <View
                  style={[
                    styles.sectionIcon,
                    styles.pinkSectionIcon,
                  ]}
                >
                  <Ionicons
                    name="folder-open-outline"
                    size={20}
                    color="#DF8990"
                  />
                </View>

                <View>
                  <Text
                    style={styles.sectionTitle}
                  >
                    Uploaded Documents
                  </Text>

                  <Text
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    {uploadedDocuments.length} files
                    uploaded
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleEditDocuments}
                disabled={submitting}
                style={styles.editButton}
              >
                <Ionicons
                  name="pencil-outline"
                  size={15}
                  color="#699DC7"
                />

                <Text
                  style={
                    styles.editButtonText
                  }
                >
                  Edit
                </Text>
              </TouchableOpacity>
            </View>

            {uploadedDocuments.length > 0 ? (
              <View
                style={styles.documentsList}
              >
                {uploadedDocuments.map(
                  ([key, file]) => (
                    <View
                      key={key}
                      style={styles.documentRow}
                    >
                      <View
                        style={
                          styles.documentIcon
                        }
                      >
                        <Ionicons
                          name={
                            file.mimeType?.startsWith(
                              "image/"
                            )
                              ? "image-outline"
                              : "document-text-outline"
                          }
                          size={20}
                          color="#6497C1"
                        />
                      </View>

                      <View
                        style={
                          styles.documentInformation
                        }
                      >
                        <Text
                          style={
                            styles.documentTitle
                          }
                        >
                          {DOCUMENT_LABELS[key]}
                        </Text>

                        <Text
                          style={
                            styles.documentName
                          }
                          numberOfLines={1}
                        >
                          {file.name}
                        </Text>
                      </View>

                      <Ionicons
                        name="checkmark-circle"
                        size={21}
                        color="#4DB762"
                      />
                    </View>
                  )
                )}
              </View>
            ) : (
              <View
                style={
                  styles.emptyDocuments
                }
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={21}
                  color="#DF8C91"
                />

                <Text
                  style={
                    styles.emptyDocumentsText
                  }
                >
                  No documents have been uploaded.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.privacyCard}>
            <View style={styles.privacyIcon}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#638EB2"
              />
            </View>

            <View style={styles.privacyContent}>
              <Text style={styles.privacyTitle}>
                Your information remains private
              </Text>

              <Text style={styles.privacyText}>
                Your ID, license number and
                documents will only be accessed by
                the verification team.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              setConfirmed(
                (current) => !current
              )
            }
            disabled={submitting}
            style={[
              styles.confirmationCard,
              confirmed &&
                styles.confirmationCardSelected,
            ]}
          >
            <View
              style={[
                styles.checkbox,
                confirmed &&
                  styles.checkboxSelected,
              ]}
            >
              {confirmed ? (
                <Ionicons
                  name="checkmark"
                  size={15}
                  color="#FFFFFF"
                />
              ) : null}
            </View>

            <Text
              style={styles.confirmationText}
            >
              I confirm that all submitted
              information and documents are
              authentic, accurate and belong to me.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSubmit}
            disabled={submitting}
            style={[
              styles.submitButtonWrapper,
              submitting &&
                styles.disabledButton,
            ]}
          >
            <LinearGradient
              colors={[
                "#8DC0F0",
                "#F9A8A7",
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.submitButton}
            >
              {submitting ? (
                <ActivityIndicator
                  color="#171A1E"
                />
              ) : (
                <>
                  <Text
                    style={
                      styles.submitButtonText
                    }
                  >
                    Submit for Review
                  </Text>

                  <Ionicons
                    name="send-outline"
                    size={18}
                    color="#171A1E"
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            disabled={submitting}
            style={styles.backButton}
          >
            <Text
              style={styles.backButtonText}
            >
              Back to Documents
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>

      <Modal
        visible={submissionModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => undefined}
      >
        <View
          style={
            styles.submissionModalOverlay
          }
        >
          <View
            style={
              styles.submissionModalCard
            }
          >
            <LinearGradient
              colors={[
                "#DCEFFF",
                "#E5F7E9",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={
                styles.submissionModalIcon
              }
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={43}
                color="#5C9A69"
              />

              <View
                style={
                  styles.submissionSuccessBadge
                }
              >
                <Ionicons
                  name="checkmark"
                  size={15}
                  color="#FFFFFF"
                />
              </View>
            </LinearGradient>

            <View
              style={
                styles.submissionStatusBadge
              }
            >
              <View
                style={
                  styles.submissionStatusDot
                }
              />

              <Text
                style={
                  styles.submissionStatusText
                }
              >
                Account Approved
              </Text>
            </View>

            <Text
              style={
                styles.submissionModalTitle
              }
            >
              Your doctor account is active
            </Text>

            <Text
              style={
                styles.submissionModalDescription
              }
            >
              Your professional information and
              documents were submitted
              successfully, and your account has
              been approved.
            </Text>

            <View
              style={
                styles.submissionReviewCard
              }
            >
              <View
                style={
                  styles.submissionReviewIcon
                }
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={23}
                  color="#4DAE62"
                />
              </View>

              <View
                style={
                  styles.submissionReviewContent
                }
              >
                <Text
                  style={
                    styles.submissionReviewTitle
                  }
                >
                  Verification status
                </Text>

                <Text
                  style={
                    styles.submissionReviewValue
                  }
                >
                  Approved
                </Text>

                <Text
                  style={
                    styles.submissionReviewDescription
                  }
                >
                  You can now continue to your
                  doctor account and use the
                  professional features.
                </Text>
              </View>
            </View>

            <View
              style={
                styles.submissionSecurityCard
              }
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#648FB4"
              />

              <Text
                style={
                  styles.submissionSecurityText
                }
              >
                Your login session has been created
                securely and professional access is
                now enabled.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={
                handleContinueAfterApproval
              }
              style={
                styles.submissionLoginButtonWrapper
              }
            >
              <LinearGradient
                colors={[
                  "#8DC0F0",
                  "#F9A8A7",
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={
                  styles.submissionLoginButton
                }
              >
                <Text
                  style={
                    styles.submissionLoginButtonText
                  }
                >
                  Continue
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#171A1E"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InformationRow({
  label,
  value,
  isLast = false,
}: InformationRowProps) {
  return (
    <View
      style={[
        styles.informationRow,
        !isLast &&
          styles.informationRowBorder,
      ]}
    >
      <Text style={styles.informationLabel}>
        {label}
      </Text>

      <Text
        style={styles.informationValue}
        numberOfLines={2}
      >
        {value}
      </Text>
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
    fontSize: 13,
    color: "#7D838A",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 30,
  },

  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerBackButton: {
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
    marginBottom: 22,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  progressStep: {
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
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#ECEEF1",
  },

  progressFill: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },

  introduction: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 17,
  },

  introductionIcon: {
    width: 57,
    height: 57,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  introductionContent: {
    flex: 1,
  },

  pageTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "700",
    color: "#22262A",
  },

  pageSubtitle: {
    marginTop: 5,
    fontSize: 10.5,
    lineHeight: 16,
    color: "#858B92",
  },

  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#EAF5FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 15,
  },

  noticeText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 15,
    color: "#658098",
  },

  sectionCard: {
    backgroundColor:
      "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "#E5EAEE",
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingTop: 13,
    paddingBottom: 6,
    marginBottom: 13,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 11,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },

  blueSectionIcon: {
    backgroundColor: "#EAF5FF",
  },

  pinkSectionIcon: {
    backgroundColor: "#FFF0F1",
  },

  sectionTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#292D31",
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 8.5,
    color: "#8B9197",
  },

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  editButtonText: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "#699DC7",
  },

  informationRow: {
    minHeight: 47,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
  },

  informationRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#ECEEF0",
  },

  informationLabel: {
    flex: 1,
    fontSize: 9.5,
    color: "#7D838A",
  },

  informationValue: {
    flex: 1.3,
    fontSize: 10,
    fontWeight: "600",
    color: "#30353A",
    textAlign: "right",
  },

  documentsList: {
    marginBottom: 7,
  },

  documentRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ECEEF0",
  },

  documentIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF6FD",
    marginRight: 9,
  },

  documentInformation: {
    flex: 1,
    paddingRight: 8,
  },

  documentTitle: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#34393E",
  },

  documentName: {
    marginTop: 4,
    fontSize: 8.5,
    color: "#8A9096",
  },

  emptyDocuments: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF3F3",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 11,
    marginBottom: 9,
  },

  emptyDocumentsText: {
    flex: 1,
    fontSize: 9.5,
    color: "#A36B70",
  },

  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EEF6FF",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 13,
  },

  privacyIcon: {
    width: 35,
    height: 35,
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
    fontSize: 11,
    fontWeight: "700",
    color: "#56748C",
  },

  privacyText: {
    marginTop: 5,
    fontSize: 9,
    lineHeight: 14,
    color: "#688198",
  },

  confirmationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E6EA",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 13,
    marginBottom: 19,
  },

  confirmationCardSelected: {
    backgroundColor: "#F2FAF4",
    borderColor: "#A8DCB2",
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#BCC2C7",
    backgroundColor: "#FFFFFF",
    marginRight: 10,
  },

  checkboxSelected: {
    borderColor: "#54B868",
    backgroundColor: "#54B868",
  },

  confirmationText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 15,
    color: "#626970",
  },

  submitButtonWrapper: {
    width: "100%",
  },

  disabledButton: {
    opacity: 0.65,
  },

  submitButton: {
    height: 55,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  submitButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#171A1E",
  },

  backButton: {
    height: 47,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },

  backButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#7B8288",
  },

  submissionModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      "rgba(31, 38, 44, 0.52)",
    paddingHorizontal: 22,
  },

  submissionModalCard: {
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
      height: 10,
    },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },

  submissionModalIcon: {
    position: "relative",
    width: 95,
    height: 95,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  submissionSuccessBadge: {
    position: "absolute",
    right: 2,
    bottom: 4,
    width: 29,
    height: 29,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4DBA63",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  submissionStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8F8EC",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginBottom: 12,
  },

  submissionStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#4DBA63",
  },

  submissionStatusText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#359B4C",
  },

  submissionModalTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    color: "#22262A",
    textAlign: "center",
  },

  submissionModalDescription: {
    maxWidth: 300,
    marginTop: 8,
    fontSize: 11,
    lineHeight: 17,
    color: "#858B92",
    textAlign: "center",
  },

  submissionReviewCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EAF8EE",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 13,
    marginTop: 20,
  },

  submissionReviewIcon: {
    width: 41,
    height: 41,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 10,
  },

  submissionReviewContent: {
    flex: 1,
  },

  submissionReviewTitle: {
    fontSize: 9,
    color: "#5C8064",
  },

  submissionReviewValue: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: "#3F6849",
  },

  submissionReviewDescription: {
    marginTop: 5,
    fontSize: 8.8,
    lineHeight: 14,
    color: "#6E8F75",
  },

  submissionSecurityCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#EEF6FF",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 11,
    marginBottom: 18,
  },

  submissionSecurityText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 14,
    color: "#668198",
  },

  submissionLoginButtonWrapper: {
    width: "100%",
  },

  submissionLoginButton: {
    height: 54,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  submissionLoginButtonText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#171A1E",
  },
});

