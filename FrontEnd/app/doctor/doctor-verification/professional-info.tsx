import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  KeyboardTypeOptions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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

type ErrorsType = {
  fullName?: string;
  nationalId?: string;
  specialization?: string;
  licenseNumber?: string;
  syndicateNumber?: string;
  university?: string;
  graduationYear?: string;
  experienceYears?: string;
  general?: string;
};

type InputFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  required?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  helperText?: string;
  editable?: boolean;
};

type DoctorVerificationProfile = {
  id: string;
  fullName: string;
  email: string;
  role?: string;
  professionalType?: string;
  nationalId?: string;
  specialization?: string;
  licenseNumber?: string;
  syndicateNumber?: string;
  university?: string;
  graduationYear?: string;
  experienceYears?: string;
  verificationStatus?: string;
  verificationStep?: string;
};

type DoctorProfileResponse = {
  doctor: DoctorVerificationProfile;
};

type SaveProfessionalInfoResponse = {
  message: string;
  nextStep: string;
  doctor: DoctorVerificationProfile;
};

const FIXED_PROFESSIONAL_TYPE = "Child Psychiatrist";

const STORAGE_KEYS = {
  verificationToken: "verificationToken",
  ownerEmail: "verificationOwnerEmail",
  accountEmail: "verificationEmail",
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
  approvedAt: "verificationApprovedAt",
  rejectedAt: "verificationRejectedAt",
  rejectionReason: "verificationRejectionReason",
};

const PROFESSIONAL_INFORMATION_KEYS = [
  STORAGE_KEYS.fullName,
  STORAGE_KEYS.nationalId,
  STORAGE_KEYS.professionalType,
  STORAGE_KEYS.specialization,
  STORAGE_KEYS.licenseNumber,
  STORAGE_KEYS.syndicateNumber,
  STORAGE_KEYS.university,
  STORAGE_KEYS.graduationYear,
  STORAGE_KEYS.experienceYears,
];

const normalizeEmail = (value?: string | null) => {
  return value?.trim().toLowerCase() || "";
};

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return String(
      error.response?.data?.msg ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Request failed"
    );
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
};

export default function ProfessionalInfoScreen() {
  const [verificationToken, setVerificationToken] =
    useState("");

  const [ownerEmail, setOwnerEmail] = useState("");

  const [fullName, setFullName] = useState("");

  const [nationalId, setNationalId] = useState("");

  const [specialization, setSpecialization] =
    useState("");

  const [licenseNumber, setLicenseNumber] =
    useState("");

  const [syndicateNumber, setSyndicateNumber] =
    useState("");

  const [university, setUniversity] = useState("");

  const [graduationYear, setGraduationYear] =
    useState("");

  const [experienceYears, setExperienceYears] =
    useState("");

  const [errors, setErrors] =
    useState<ErrorsType>({});

  const [loading, setLoading] = useState(false);

  const [initialLoading, setInitialLoading] =
    useState(true);

  const setFieldsFromData = (
    data: Partial<DoctorVerificationProfile>,
    localData?: Record<string, string | null>
  ) => {
    setFullName(
      data.fullName ||
        localData?.[STORAGE_KEYS.fullName] ||
        ""
    );

    setNationalId(
      data.nationalId ||
        localData?.[STORAGE_KEYS.nationalId] ||
        ""
    );

    setSpecialization(
      data.specialization ||
        localData?.[STORAGE_KEYS.specialization] ||
        ""
    );

    setLicenseNumber(
      data.licenseNumber ||
        localData?.[STORAGE_KEYS.licenseNumber] ||
        ""
    );

    setSyndicateNumber(
      data.syndicateNumber ||
        localData?.[STORAGE_KEYS.syndicateNumber] ||
        ""
    );

    setUniversity(
      data.university ||
        localData?.[STORAGE_KEYS.university] ||
        ""
    );

    setGraduationYear(
      data.graduationYear ||
        localData?.[STORAGE_KEYS.graduationYear] ||
        ""
    );

    setExperienceYears(
      data.experienceYears ||
        localData?.[STORAGE_KEYS.experienceYears] ||
        ""
    );
  };

  const saveLocalProfessionalInfo = async (
    data: DoctorVerificationProfile,
    token: string
  ) => {
    const cleanEmail = normalizeEmail(data.email);

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.verificationToken, token],

      [STORAGE_KEYS.ownerEmail, cleanEmail],

      [STORAGE_KEYS.accountEmail, cleanEmail],

      [STORAGE_KEYS.fullName, data.fullName || ""],

      [STORAGE_KEYS.nationalId, data.nationalId || ""],

      [
        STORAGE_KEYS.professionalType,
        data.professionalType ||
          FIXED_PROFESSIONAL_TYPE,
      ],

      [
        STORAGE_KEYS.specialization,
        data.specialization || "",
      ],

      [
        STORAGE_KEYS.licenseNumber,
        data.licenseNumber || "",
      ],

      [
        STORAGE_KEYS.syndicateNumber,
        data.syndicateNumber || "",
      ],

      [
        STORAGE_KEYS.university,
        data.university || "",
      ],

      [
        STORAGE_KEYS.graduationYear,
        data.graduationYear || "",
      ],

      [
        STORAGE_KEYS.experienceYears,
        data.experienceYears || "",
      ],

      [
        STORAGE_KEYS.status,
        data.verificationStatus || "draft",
      ],

      [
        STORAGE_KEYS.currentStep,
        data.verificationStep ||
          "professional-info",
      ],
    ]);
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfessionalInformation =
      async () => {
        try {
          const storedValues =
            await AsyncStorage.multiGet([
              "role",
              STORAGE_KEYS.verificationToken,
              STORAGE_KEYS.ownerEmail,
              STORAGE_KEYS.accountEmail,
              ...PROFESSIONAL_INFORMATION_KEYS,
            ]);

          if (!isMounted) {
            return;
          }

          const savedData =
            Object.fromEntries(
              storedValues
            ) as Record<string, string | null>;

          const savedRole = savedData.role;

          const token =
            savedData[
              STORAGE_KEYS.verificationToken
            ] || "";

          const savedEmail =
            normalizeEmail(
              savedData[
                STORAGE_KEYS.accountEmail
              ]
            );

          if (savedRole !== "doctor") {
            router.replace(
              "/role-selection" as Href
            );

            return;
          }

          if (!token) {
            setErrors({
              general:
                "Your verification session has expired. Please login again.",
            });

            router.replace(
              "/auth/login" as Href
            );

            return;
          }

          setVerificationToken(token);

          setOwnerEmail(savedEmail);

          /*
            نظهر البيانات المحلية الأول
            لحد ما بيانات السيرفر توصل.
          */
          setFieldsFromData({}, savedData);

          const response =
            await API.get<DoctorProfileResponse>(
              "/auth/doctor-verification/profile",
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          if (!isMounted) {
            return;
          }

          const doctor =
            response.data.doctor;

          setOwnerEmail(
            normalizeEmail(doctor.email)
          );

          setFieldsFromData(
            doctor,
            savedData
          );

          await saveLocalProfessionalInfo(
            doctor,
            token
          );
        } catch (error) {
          console.log(
            "LOAD PROFESSIONAL INFO ERROR:",
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

            if (isMounted) {
              setErrors({
                general:
                  "Your verification session has expired. Please login again.",
              });
            }

            router.replace(
              "/auth/login" as Href
            );

            return;
          }

          if (isMounted) {
            setErrors({
              general:
                "Could not sync your saved information with the server. You can review it and try again.",
            });
          }
        } finally {
          if (isMounted) {
            setInitialLoading(false);
          }
        }
      };

    loadProfessionalInformation();

    return () => {
      isMounted = false;
    };
  }, []);

  const clearError = (
    field: keyof ErrorsType
  ) => {
    setErrors((previousErrors) => ({
      ...previousErrors,
      [field]: undefined,
      general: undefined,
    }));
  };

  const handleFullNameChange = (
    text: string
  ) => {
    setFullName(text);
    clearError("fullName");
  };

  const handleNationalIdChange = (
    text: string
  ) => {
    const numericValue =
      text.replace(/\D/g, "");

    setNationalId(numericValue);
    clearError("nationalId");
  };

  const handleSpecializationChange = (
    text: string
  ) => {
    setSpecialization(text);
    clearError("specialization");
  };

  const handleLicenseNumberChange = (
    text: string
  ) => {
    setLicenseNumber(text);
    clearError("licenseNumber");
  };

  const handleSyndicateNumberChange = (
    text: string
  ) => {
    setSyndicateNumber(text);
    clearError("syndicateNumber");
  };

  const handleUniversityChange = (
    text: string
  ) => {
    setUniversity(text);
    clearError("university");
  };

  const handleGraduationYearChange = (
    text: string
  ) => {
    const numericValue =
      text.replace(/\D/g, "");

    setGraduationYear(numericValue);

    clearError("graduationYear");
  };

  const handleExperienceYearsChange = (
    text: string
  ) => {
    const numericValue =
      text.replace(/\D/g, "");

    setExperienceYears(numericValue);

    clearError("experienceYears");
  };

  const validateForm = () => {
    const newErrors: ErrorsType = {};

    const cleanName = fullName.trim();

    const cleanSpecialization =
      specialization.trim();

    const cleanLicenseNumber =
      licenseNumber.trim();

    const cleanSyndicateNumber =
      syndicateNumber.trim();

    const cleanUniversity =
      university.trim();

    const currentYear =
      new Date().getFullYear();

    const graduationYearNumber =
      Number(graduationYear);

    const experienceNumber =
      Number(experienceYears);

    if (!verificationToken) {
      newErrors.general =
        "Your verification session has expired. Please login again.";
    }

    if (!ownerEmail) {
      newErrors.general =
        "Your doctor account could not be identified. Please login again.";
    }

    if (!cleanName) {
      newErrors.fullName =
        "Full legal name is required";
    } else if (cleanName.length < 3) {
      newErrors.fullName =
        "Please enter your complete legal name";
    }

    if (!nationalId) {
      newErrors.nationalId =
        "National ID is required";
    } else if (nationalId.length !== 14) {
      newErrors.nationalId =
        "National ID must contain 14 digits";
    }

    if (!cleanSpecialization) {
      newErrors.specialization =
        "Medical specialty is required";
    } else if (
      cleanSpecialization.length < 3
    ) {
      newErrors.specialization =
        "Please enter a valid medical specialty";
    }

    if (!cleanLicenseNumber) {
      newErrors.licenseNumber =
        "Practice license number is required";
    }

    if (!cleanSyndicateNumber) {
      newErrors.syndicateNumber =
        "Medical syndicate number is required";
    }

    if (!cleanUniversity) {
      newErrors.university =
        "University name is required";
    }

    if (!graduationYear) {
      newErrors.graduationYear =
        "Graduation year is required";
    } else if (
      graduationYearNumber < 1950 ||
      graduationYearNumber > currentYear
    ) {
      newErrors.graduationYear =
        "Please enter a valid graduation year";
    }

    if (!experienceYears) {
      newErrors.experienceYears =
        "Years of experience are required";
    } else if (
      experienceNumber < 0 ||
      experienceNumber > 70
    ) {
      newErrors.experienceYears =
        "Please enter valid years of experience";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  const handleContinue = async () => {
    if (loading) {
      return;
    }

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    try {
      setLoading(true);

      setErrors({});

      const response =
        await API.put<SaveProfessionalInfoResponse>(
          "/auth/doctor-verification/professional-info",
          {
            fullName: fullName.trim(),

            nationalId,

            professionalType:
              FIXED_PROFESSIONAL_TYPE,

            specialization:
              specialization.trim(),

            licenseNumber:
              licenseNumber.trim(),

            syndicateNumber:
              syndicateNumber.trim(),

            university:
              university.trim(),

            graduationYear,

            experienceYears,
          },
          {
            headers: {
              Authorization:
                `Bearer ${verificationToken}`,
            },
          }
        );

      const doctor =
        response.data.doctor;

      await saveLocalProfessionalInfo(
        doctor,
        verificationToken
      );

      await AsyncStorage.multiSet([
        [
          STORAGE_KEYS.status,
          doctor.verificationStatus ||
            "draft",
        ],

        [
          STORAGE_KEYS.currentStep,
          response.data.nextStep ||
            "documents",
        ],
      ]);

      router.push(
        "/doctor/doctor-verification/documents" as Href
      );
    } catch (error) {
      console.log(
        "SAVE PROFESSIONAL INFO ERROR:",
        error
      );

      const message =
        getErrorMessage(error);

      setErrors({
        general: message,
      });

      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        await AsyncStorage.removeItem(
          STORAGE_KEYS.verificationToken
        );

        router.replace(
          "/auth/login" as Href
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (loading) {
      return;
    }

    router.back();
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
              style={styles.loadingText}
            >
              Preparing your information...
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
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <ScrollView
            contentContainerStyle={
              styles.scrollContent
            }
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
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
                Professional Information
              </Text>

              <View
                style={
                  styles.headerPlaceholder
                }
              />
            </View>

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
                  Step 2 of 4
                </Text>

                <Text
                  style={
                    styles.progressPercentage
                  }
                >
                  50%
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

            <View
              style={styles.introSection}
            >
              <View
                style={styles.introIcon}
              >
                <Ionicons
                  name="medkit-outline"
                  size={27}
                  color="#6E9FCB"
                />
              </View>

              <View
                style={styles.introContent}
              >
                <Text style={styles.title}>
                  Tell us about your medical
                  profession
                </Text>

                <Text
                  style={styles.subtitle}
                >
                  Enter your medical
                  information exactly as it
                  appears on your official
                  documents.
                </Text>
              </View>
            </View>

            <View
              style={styles.noticeBox}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#648FB4"
              />

              <Text
                style={styles.noticeText}
              >
                Emora is currently available
                to licensed doctors who
                provide psychiatric and
                mental health support for
                children.
              </Text>
            </View>

            <View
              style={
                styles.fixedRoleCard
              }
            >
              <View
                style={
                  styles.fixedRoleIcon
                }
              >
                <Ionicons
                  name="medkit-outline"
                  size={22}
                  color="#6799C2"
                />
              </View>

              <View
                style={
                  styles.fixedRoleContent
                }
              >
                <Text
                  style={
                    styles.fixedRoleLabel
                  }
                >
                  Professional role
                </Text>

                <Text
                  style={
                    styles.fixedRoleValue
                  }
                >
                  Child Psychiatrist
                </Text>

                <Text
                  style={
                    styles.fixedRoleDescription
                  }
                >
                  This account type is
                  reserved for licensed
                  medical doctors.
                </Text>
              </View>

              <Ionicons
                name="checkmark-circle"
                size={21}
                color="#4DB762"
              />
            </View>

            <View
              style={styles.formSection}
            >
              <InputField
                label="Full legal name"
                placeholder="As shown on your official documents"
                value={fullName}
                onChangeText={
                  handleFullNameChange
                }
                error={errors.fullName}
                required
                editable={!loading}
                helperText="Make sure this name matches your National ID and medical license."
              />

              <InputField
                label="National ID"
                placeholder="Enter your 14-digit National ID"
                value={nationalId}
                onChangeText={
                  handleNationalIdChange
                }
                error={errors.nationalId}
                keyboardType="number-pad"
                maxLength={14}
                required
                editable={!loading}
              />

              <InputField
                label="Medical specialty"
                placeholder="e.g. Child & Adolescent Psychiatry"
                value={specialization}
                onChangeText={
                  handleSpecializationChange
                }
                error={
                  errors.specialization
                }
                required
                editable={!loading}
                helperText="Enter the medical specialty shown on your professional documents."
              />

              <InputField
                label="Practice license number"
                placeholder="Enter your medical practice license number"
                value={licenseNumber}
                onChangeText={
                  handleLicenseNumberChange
                }
                error={
                  errors.licenseNumber
                }
                required
                editable={!loading}
              />

              <InputField
                label="Medical syndicate number"
                placeholder="Enter your Medical Syndicate number"
                value={syndicateNumber}
                onChangeText={
                  handleSyndicateNumberChange
                }
                error={
                  errors.syndicateNumber
                }
                required
                editable={!loading}
                helperText="This number will be checked during professional verification."
              />

              <InputField
                label="Medical school or university"
                placeholder="Enter your university name"
                value={university}
                onChangeText={
                  handleUniversityChange
                }
                error={
                  errors.university
                }
                required
                editable={!loading}
              />

              <View
                style={styles.twoColumns}
              >
                <View
                  style={styles.column}
                >
                  <InputField
                    label="Graduation year"
                    placeholder="e.g. 2018"
                    value={graduationYear}
                    onChangeText={
                      handleGraduationYearChange
                    }
                    error={
                      errors.graduationYear
                    }
                    keyboardType="number-pad"
                    maxLength={4}
                    required
                    editable={!loading}
                  />
                </View>

                <View
                  style={styles.column}
                >
                  <InputField
                    label="Experience"
                    placeholder="Years"
                    value={experienceYears}
                    onChangeText={
                      handleExperienceYearsChange
                    }
                    error={
                      errors.experienceYears
                    }
                    keyboardType="number-pad"
                    maxLength={2}
                    required
                    editable={!loading}
                  />
                </View>
              </View>

              {errors.general ? (
                <View
                  style={
                    styles.generalErrorBox
                  }
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={19}
                    color="#DC2626"
                  />

                  <Text
                    style={
                      styles.generalErrorText
                    }
                  >
                    {errors.general}
                  </Text>
                </View>
              ) : null}
            </View>

            <View
              style={styles.privacyBox}
            >
              <View
                style={styles.privacyIcon}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color="#6C97BC"
                />
              </View>

              <Text
                style={styles.privacyText}
              >
                Your National ID, license
                number and Medical Syndicate
                details will remain private.
                Parents will only see your
                verified name and medical
                specialty.
              </Text>
            </View>

            <View
              style={
                styles.actionsContainer
              }
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleBack}
                disabled={loading}
                style={
                  styles.backActionButton
                }
              >
                <Text
                  style={
                    styles.backActionText
                  }
                >
                  Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleContinue}
                disabled={loading}
                style={[
                  styles.continueButtonWrapper,
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
                    styles.continueButton
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
                          styles.continueButtonText
                        }
                      >
                        Continue
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#171A1E"
                      />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  required = false,
  keyboardType = "default",
  maxLength,
  helperText,
  editable = true,
}: InputFieldProps) {
  return (
    <View style={styles.fieldBlock}>
      <View style={styles.labelRow}>
        <Text
          style={styles.inputLabel}
        >
          {label}
        </Text>

        {required ? (
          <Text
            style={
              styles.requiredStar
            }
          >
            *
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.inputContainer,

          error
            ? styles.inputError
            : null,

          !editable
            ? styles.inputContainerDisabled
            : null,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A6ABB1"
          keyboardType={keyboardType}
          maxLength={maxLength}
          editable={editable}
          autoCapitalize={
            keyboardType ===
            "number-pad"
              ? "none"
              : "words"
          }
          autoCorrect={false}
          style={styles.input}
        />
      </View>

      {error ? (
        <Text
          style={styles.errorText}
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={styles.helperText}
        >
          {helperText}
        </Text>
      ) : null}
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
    gap: 13,
  },

  loadingText: {
    fontSize: 13,
    color: "#7D838A",
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
    marginBottom: 22,
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
    width: "50%",
    height: "100%",
    borderRadius: 999,
  },

  introSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  introIcon: {
    width: 53,
    height: 53,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E9F4FE",
    marginRight: 12,
  },

  introContent: {
    flex: 1,
  },

  title: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "700",
    color: "#22262A",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 10.5,
    lineHeight: 16,
    color: "#858B92",
  },

  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#EAF5FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 14,
  },

  noticeText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 15,
    color: "#658098",
  },

  fixedRoleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "#DDEAF3",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },

  fixedRoleIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EAF5FF",
    marginRight: 10,
  },

  fixedRoleContent: {
    flex: 1,
    paddingRight: 8,
  },

  fixedRoleLabel: {
    fontSize: 8.5,
    color: "#8A9096",
  },

  fixedRoleValue: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: "#3E586E",
  },

  fixedRoleDescription: {
    marginTop: 4,
    fontSize: 8.5,
    lineHeight: 13,
    color: "#858B92",
  },

  formSection: {
    width: "100%",
  },

  fieldBlock: {
    marginBottom: 15,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  inputLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#454A50",
  },

  requiredStar: {
    marginLeft: 3,
    fontSize: 12,
    color: "#E98D94",
  },

  inputContainer: {
    minHeight: 53,
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "#E4E9ED",
    borderRadius: 12,
    paddingHorizontal: 14,
  },

  inputContainerDisabled: {
    opacity: 0.55,
    backgroundColor: "#F2F3F4",
  },

  input: {
    fontSize: 13,
    color: "#22262A",
  },

  inputError: {
    borderColor: "#EF4444",
  },

  errorText: {
    marginTop: 5,
    marginLeft: 3,
    fontSize: 10,
    lineHeight: 14,
    color: "#EF4444",
  },

  helperText: {
    marginTop: 5,
    marginLeft: 3,
    fontSize: 8.5,
    lineHeight: 13,
    color: "#93999F",
  },

  twoColumns: {
    flexDirection: "row",
    gap: 10,
  },

  column: {
    flex: 1,
  },

  generalErrorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 15,
  },

  generalErrorText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 15,
    color: "#DC2626",
  },

  privacyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF6FF",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 1,
    marginBottom: 20,
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

  privacyText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 15,
    color: "#668199",
  },

  actionsContainer: {
    flexDirection: "row",
    gap: 10,
  },

  backActionButton: {
    width: 96,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE4E9",
    borderRadius: 999,
  },

  backActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6C737A",
  },

  continueButtonWrapper: {
    flex: 1,
  },

  disabledButton: {
    opacity: 0.7,
  },

  continueButton: {
    height: 54,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  continueButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#171A1E",
  },
});