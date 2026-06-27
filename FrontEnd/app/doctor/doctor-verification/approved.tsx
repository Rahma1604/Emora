import React, { useEffect, useState } from "react";
import {
ActivityIndicator,
Alert,
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

type VerificationStatus =
| "not_started"
| "draft"
| "pending"
| "approved"
| "rejected"
| "under_review"
| "verified"
| "changes_required"
| "expired"
| "suspended";

type StoredDoctor = {
id?: string | number;
_id?: string;
fullName?: string;
name?: string;
specialization?: string;
professionalType?: string;
email?: string;
role?: string;
profilePic?: string;
verificationStatus?: string;
verificationStep?: string;
verificationSubmittedAt?: string;
isVerified?: boolean;
[key: string]: unknown;
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
"We could not load your approved account."
);
}

return error instanceof Error
? error.message
: "We could not load your approved account.";
};

export default function VerificationApprovedScreen() {
const [doctorName, setDoctorName] =
useState("Doctor");

const [specialization, setSpecialization] =
useState("Verified Specialist");

const [approvedDate, setApprovedDate] =
useState("");

const [initialLoading, setInitialLoading] =
useState(true);

const [openingDashboard, setOpeningDashboard] =
useState(false);

useEffect(() => {
loadApprovedAccount();
}, []);

const getDraftRoute = (
currentStep?: string | null
): Href => {
switch (currentStep) {
case "documents":
return "/doctor/doctor-verification/documents" as Href;


  case "review":
    return "/doctor/doctor-verification/review" as Href;

  case "professional-info":
  case "professional_info":
    return "/doctor/doctor-verification/professional-info" as Href;

  case "intro":
  default:
    return "/doctor/doctor-verification/intro" as Href;
}


};

const redirectInvalidStatus = (
status: VerificationStatus | string | null,
currentStep?: string | null
) => {
switch (status) {
case "pending":
case "under_review":
router.replace(
"/doctor/doctor-verification/pending" as Href
);
return;


  case "rejected":
  case "changes_required":
  case "expired":
  case "suspended":
    router.replace(
      "/doctor/doctor-verification/rejected" as Href
    );
    return;

  case "draft":
    router.replace(
      getDraftRoute(currentStep)
    );
    return;

  case "not_started":
    router.replace(
      "/doctor/doctor-verification/intro" as Href
    );
    return;

  default:
    router.replace(
      "/auth/login" as Href
    );
}


};

const loadApprovedAccount = async () => {
try {
const storedValues =
await AsyncStorage.multiGet([
"token",
"user",
"role",
"verificationStatus",
"verificationCurrentStep",
"verificationFullName",
"verificationSpecialization",
"verificationApprovedAt",
]);

  const storedData =
    Object.fromEntries(
      storedValues
    ) as Record<string, string | null>;

  const token = storedData.token;

  if (!token) {
    router.replace(
      "/auth/login" as Href
    );

    return;
  }

  let storedUser: StoredDoctor | null = null;

  if (storedData.user) {
    try {
      storedUser = JSON.parse(
        storedData.user
      ) as StoredDoctor;
    } catch (error) {
      console.log(
        "Could not parse stored doctor:",
        error
      );
    }
  }

  const response =
    await API.get<StoredDoctor>(
      "/auth/profile",
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  const serverDoctor =
    response.data;

  const role =
    serverDoctor.role ||
    storedData.role ||
    storedUser?.role;

  if (role !== "doctor") {
    router.replace(
      "/auth/login" as Href
    );

    return;
  }

  const verificationStatus =
    (
      serverDoctor.verificationStatus ||
      storedData.verificationStatus ||
      storedUser?.verificationStatus ||
      ""
    ) as VerificationStatus;

  const currentStep =
    serverDoctor.verificationStep ||
    storedData.verificationCurrentStep ||
    storedUser?.verificationStep ||
    null;

  const isApproved =
    verificationStatus === "approved" ||
    verificationStatus === "verified";

  if (!isApproved) {
    redirectInvalidStatus(
      verificationStatus,
      currentStep
    );

    return;
  }

  const savedName =
    serverDoctor.fullName ||
    serverDoctor.name ||
    storedUser?.fullName ||
    storedUser?.name ||
    storedData.verificationFullName ||
    "Doctor";

  const savedSpecialization =
    serverDoctor.specialization ||
    storedUser?.specialization ||
    storedData.verificationSpecialization ||
    "Verified Specialist";

  const approvedAt =
    storedData.verificationApprovedAt ||
    serverDoctor.verificationSubmittedAt ||
    storedUser?.verificationSubmittedAt ||
    new Date().toISOString();

  const normalizedUser: StoredDoctor = {
    ...storedUser,
    ...serverDoctor,
    id:
      serverDoctor.id ||
      serverDoctor._id ||
      storedUser?.id,
    name: savedName,
    fullName: savedName,
    role: "doctor",
    specialization:
      savedSpecialization,
    verificationStatus:
      "approved",
    verificationStep:
      currentStep || "submitted",
    isVerified: true,
  };

  await AsyncStorage.multiSet([
    ["token", token],
    [
      "user",
      JSON.stringify(
        normalizedUser
      ),
    ],
    ["role", "doctor"],
    [
      "verificationStatus",
      "approved",
    ],
    [
      "verificationCurrentStep",
      currentStep || "submitted",
    ],
    [
      "verificationFullName",
      savedName,
    ],
    [
      "verificationSpecialization",
      savedSpecialization,
    ],
    [
      "verificationApprovedAt",
      approvedAt,
    ],
    [
      "doctorAccessEnabled",
      "true",
    ],
  ]);

  const parsedApprovedDate =
    new Date(approvedAt);

  const formattedDate =
    Number.isNaN(
      parsedApprovedDate.getTime()
    )
      ? "Today"
      : parsedApprovedDate.toLocaleDateString(
          "en-US",
          {
            day: "numeric",
            month: "long",
            year: "numeric",
          }
        );

  setDoctorName(savedName);
  setSpecialization(
    savedSpecialization
  );
  setApprovedDate(formattedDate);
} catch (error) {
  console.log(
    "FAILED TO LOAD APPROVED ACCOUNT:",
    error
  );

  if (
    axios.isAxiosError(error) &&
    (error.response?.status === 401 ||
      error.response?.status === 403)
  ) {
    await AsyncStorage.multiRemove([
      "token",
      "verificationToken",
      "doctorAccessEnabled",
    ]);

    Alert.alert(
      "Session expired",
      "Please login again to continue.",
      [
        {
          text: "Back to Login",
          onPress: () =>
            router.replace(
              "/auth/login" as Href
            ),
        },
      ]
    );

    return;
  }

  Alert.alert(
    "Loading failed",
    getRequestErrorMessage(error),
    [
      {
        text: "Try Again",
        onPress:
          loadApprovedAccount,
      },
      {
        text: "Back to Login",
        onPress: () =>
          router.replace(
            "/auth/login" as Href
          ),
      },
    ]
  );
} finally {
  setInitialLoading(false);
}


};

const handleContinue = async () => {
if (openingDashboard) {
return;
}


try {
  setOpeningDashboard(true);

  const storedValues =
    await AsyncStorage.multiGet([
      "token",
      "user",
      "verificationStatus",
    ]);

  const storedData =
    Object.fromEntries(
      storedValues
    ) as Record<string, string | null>;

  const token = storedData.token;

  if (!token) {
    router.replace(
      "/auth/login" as Href
    );

    return;
  }

  const response =
    await API.get<StoredDoctor>(
      "/auth/profile",
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  const doctor =
    response.data;

  if (
    doctor.role !== "doctor" ||
    doctor.verificationStatus !==
      "approved"
  ) {
    redirectInvalidStatus(
      doctor.verificationStatus ||
        storedData.verificationStatus,
      doctor.verificationStep
    );

    return;
  }

  let storedUser: StoredDoctor = {};

  if (storedData.user) {
    try {
      storedUser = JSON.parse(
        storedData.user
      ) as StoredDoctor;
    } catch (error) {
      console.log(
        "Could not parse stored user:",
        error
      );
    }
  }

  const updatedUser: StoredDoctor = {
    ...storedUser,
    ...doctor,
    id:
      doctor.id ||
      doctor._id ||
      storedUser.id,
    name:
      doctor.fullName ||
      doctor.name ||
      doctorName,
    fullName:
      doctor.fullName ||
      doctor.name ||
      doctorName,
    role: "doctor",
    verificationStatus:
      "approved",
    verificationStep:
      doctor.verificationStep ||
      "submitted",
    isVerified: true,
  };

  await AsyncStorage.multiSet([
    [
      "user",
      JSON.stringify(
        updatedUser
      ),
    ],
    ["role", "doctor"],
    [
      "verificationStatus",
      "approved",
    ],
    [
      "verificationCurrentStep",
      doctor.verificationStep ||
        "submitted",
    ],
    [
      "hasSeenVerificationApproval",
      "true",
    ],
    [
      "doctorAccessEnabled",
      "true",
    ],
  ]);

  await AsyncStorage.removeItem(
    "verificationToken"
  );

  router.replace(
    "/doctor/home" as Href
  );
} catch (error) {
  console.log(
    "COULD NOT OPEN DOCTOR DASHBOARD:",
    error
  );

  if (
    axios.isAxiosError(error) &&
    (error.response?.status === 401 ||
      error.response?.status === 403)
  ) {
    await AsyncStorage.removeItem(
      "token"
    );

    router.replace(
      "/auth/login" as Href
    );

    return;
  }

  Alert.alert(
    "Navigation failed",
    getRequestErrorMessage(error)
  );
} finally {
  setOpeningDashboard(false);
}


};




if (initialLoading) {
return (
<SafeAreaView
style={styles.safeArea}
edges={["top", "bottom"]}
> <StatusBar
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
          Preparing your verified account...
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
> <StatusBar
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
      <View style={styles.heroSection}>
        <LinearGradient
          colors={[
            "#D9EEFF",
            "#FFE2E4",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.outerCircle}
        >
          <View style={styles.innerCircle}>
            <Ionicons
              name="shield-checkmark-outline"
              size={57}
              color="#6D9EC8"
            />
          </View>

          <View style={styles.successBadge}>
            <Ionicons
              name="checkmark"
              size={22}
              color="#FFFFFF"
            />
          </View>
        </LinearGradient>

        <View style={styles.approvedBadge}>
          <Ionicons
            name="checkmark-circle"
            size={15}
            color="#3DAD57"
          />

          <Text
            style={styles.approvedBadgeText}
          >
            Verification Approved
          </Text>
        </View>

        <Text style={styles.title}>
          You&apos;re verified!
        </Text>

        <Text style={styles.subtitle}>
          Congratulations, {doctorName}. Your
          professional account has been approved
          successfully.
        </Text>

        <Text style={styles.description}>
          You can now access child cases, review
          emotional analyses and provide professional
          recommendations.
        </Text>
      </View>

      <View style={styles.doctorCard}>
        <LinearGradient
          colors={[
            "#E8F4FF",
            "#FFF0F1",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.doctorAvatar}
        >
          <Ionicons
            name="person-outline"
            size={29}
            color="#6999C1"
          />
        </LinearGradient>

        <View style={styles.doctorInformation}>
          <Text style={styles.doctorName}>
            {doctorName}
          </Text>

          <Text
            style={styles.doctorSpecialization}
          >
            {specialization}
          </Text>

          <View style={styles.verifiedTitleRow}>
            <Ionicons
              name="shield-checkmark"
              size={14}
              color="#43B45B"
            />

            <Text
              style={styles.verifiedTitleText}
            >
              Verified Specialist
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>
          Verification Details
        </Text>

        <VerificationDetail
          icon="person-outline"
          iconColor="#6199C8"
          iconBackground="#EAF5FF"
          title="Identity verified"
          description="Your personal identity has been confirmed."
        />

        <View style={styles.divider} />

        <VerificationDetail
          icon="medkit-outline"
          iconColor="#DF8990"
          iconBackground="#FFF0F1"
          title="Professional license verified"
          description="Your professional license has been approved."
        />

        <View style={styles.divider} />

        <VerificationDetail
          icon="school-outline"
          iconColor="#49A966"
          iconBackground="#EAF8EE"
          title="Qualifications approved"
          description="Your education and specialization have been confirmed."
        />
      </View>

      <View style={styles.approvalDateCard}>
        <View style={styles.approvalDateIcon}>
          <Ionicons
            name="calendar-outline"
            size={21}
            color="#6B95B8"
          />
        </View>

        <View style={styles.approvalDateContent}>
          <Text
            style={styles.approvalDateLabel}
          >
            Account approved on
          </Text>

          <Text
            style={styles.approvalDateValue}
          >
            {approvedDate || "Today"}
          </Text>
        </View>

        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />

          <Text
            style={styles.activeBadgeText}
          >
            Active
          </Text>
        </View>
      </View>

      <View style={styles.accessCard}>
        <Text style={styles.sectionTitle}>
          Your professional access is ready
        </Text>

        <AccessItem
          icon="document-text-outline"
          text="Review submitted child cases"
        />

        <AccessItem
          icon="analytics-outline"
          text="View AI emotional analyses"
        />

        <AccessItem
          icon="time-outline"
          text="Follow each child’s progress and history"
        />

        <AccessItem
          icon="chatbubble-ellipses-outline"
          text="Send professional recommendations"
          isLast
        />
      </View>

      <View style={styles.privacyCard}>
        <View style={styles.privacyIcon}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#628EB3"
          />
        </View>

        <View style={styles.privacyContent}>
          <Text style={styles.privacyTitle}>
            Your documents remain private
          </Text>

          <Text style={styles.privacyText}>
            Parents will only see your verified name,
            specialization and professional badge.
            Your submitted documents will remain
            private.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleContinue}
        disabled={openingDashboard}
        style={[
          styles.continueButtonWrapper,
          openingDashboard &&
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
          style={styles.continueButton}
        >
          {openingDashboard ? (
            <ActivityIndicator
              color="#171A1E"
            />
          ) : (
            <>
              <Text
                style={styles.continueButtonText}
              >
                Continue to Doctor Dashboard
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
    </ScrollView>
  </LinearGradient>
</SafeAreaView>


);
}

function VerificationDetail({
icon,
iconColor,
iconBackground,
title,
description,
}: {
icon: keyof typeof Ionicons.glyphMap;
iconColor: string;
iconBackground: string;
title: string;
description: string;
}) {
return ( <View style={styles.detailRow}>
<View
style={[
styles.detailIcon,
{
backgroundColor: iconBackground,
},
]}
> <Ionicons
       name={icon}
       size={19}
       color={iconColor}
     /> </View>


  <View style={styles.detailContent}>
    <Text style={styles.detailTitle}>
      {title}
    </Text>

    <Text style={styles.detailDescription}>
      {description}
    </Text>
  </View>

  <Ionicons
    name="checkmark-circle"
    size={21}
    color="#48B45D"
  />
</View>


);
}

function AccessItem({
icon,
text,
isLast = false,
}: {
icon: keyof typeof Ionicons.glyphMap;
text: string;
isLast?: boolean;
}) {
return (
<View
style={[
styles.accessItem,
!isLast && styles.accessItemBorder,
]}
> <View style={styles.accessItemIcon}> <Ionicons
       name={icon}
       size={18}
       color="#6598C1"
     /> </View>


  <Text style={styles.accessItemText}>
    {text}
  </Text>

  <Ionicons
    name="checkmark-circle"
    size={19}
    color="#4CB461"
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
flexGrow: 1,
paddingHorizontal: 22,
paddingTop: 27,
paddingBottom: 30,
},

heroSection: {
alignItems: "center",
marginBottom: 21,
},

outerCircle: {
position: "relative",
width: 132,
height: 132,
borderRadius: 66,
justifyContent: "center",
alignItems: "center",
marginBottom: 17,
},

innerCircle: {
width: 96,
height: 96,
borderRadius: 48,
justifyContent: "center",
alignItems: "center",
backgroundColor: "rgba(255,255,255,0.76)",
},

successBadge: {
position: "absolute",
right: 7,
bottom: 9,
width: 36,
height: 36,
borderRadius: 18,
justifyContent: "center",
alignItems: "center",
backgroundColor: "#4CC365",
borderWidth: 3,
borderColor: "#FFFFFF",
},

approvedBadge: {
flexDirection: "row",
alignItems: "center",
gap: 5,
backgroundColor: "#E9F8ED",
borderRadius: 999,
paddingHorizontal: 11,
paddingVertical: 7,
marginBottom: 12,
},

approvedBadgeText: {
fontSize: 9.5,
fontWeight: "700",
color: "#3D9B50",
},

title: {
fontSize: 26,
lineHeight: 32,
fontWeight: "700",
color: "#202428",
textAlign: "center",
},

subtitle: {
maxWidth: 330,
marginTop: 10,
fontSize: 12,
lineHeight: 18,
color: "#6E757C",
textAlign: "center",
},

description: {
maxWidth: 330,
marginTop: 7,
fontSize: 10.5,
lineHeight: 17,
color: "#90959B",
textAlign: "center",
},

doctorCard: {
flexDirection: "row",
alignItems: "center",
backgroundColor: "rgba(255,255,255,0.95)",
borderWidth: 1,
borderColor: "#E4EAEE",
borderRadius: 15,
paddingHorizontal: 13,
paddingVertical: 13,
marginBottom: 13,
},

doctorAvatar: {
width: 57,
height: 57,
borderRadius: 17,
justifyContent: "center",
alignItems: "center",
marginRight: 12,
},

doctorInformation: {
flex: 1,
},

doctorName: {
fontSize: 14,
fontWeight: "700",
color: "#292D31",
},

doctorSpecialization: {
marginTop: 5,
fontSize: 10,
color: "#7E858B",
},

verifiedTitleRow: {
flexDirection: "row",
alignItems: "center",
gap: 4,
marginTop: 7,
},

verifiedTitleText: {
fontSize: 9,
fontWeight: "600",
color: "#3F9E52",
},

detailsCard: {
backgroundColor: "rgba(255,255,255,0.95)",
borderWidth: 1,
borderColor: "#E4EAEE",
borderRadius: 15,
paddingHorizontal: 13,
paddingTop: 14,
paddingBottom: 3,
marginBottom: 13,
},

sectionTitle: {
fontSize: 12.5,
fontWeight: "700",
color: "#292D31",
marginBottom: 9,
},

detailRow: {
minHeight: 66,
flexDirection: "row",
alignItems: "center",
},

detailIcon: {
width: 39,
height: 39,
borderRadius: 11,
justifyContent: "center",
alignItems: "center",
marginRight: 10,
},

detailContent: {
flex: 1,
paddingRight: 7,
},

detailTitle: {
fontSize: 10.5,
fontWeight: "700",
color: "#363B40",
},

detailDescription: {
marginTop: 4,
fontSize: 8.5,
lineHeight: 13,
color: "#888E94",
},

divider: {
height: 1,
backgroundColor: "#ECEEF0",
},

approvalDateCard: {
minHeight: 70,
flexDirection: "row",
alignItems: "center",
backgroundColor: "#EAF5FF",
borderRadius: 14,
paddingHorizontal: 12,
marginBottom: 13,
},

approvalDateIcon: {
width: 40,
height: 40,
borderRadius: 11,
justifyContent: "center",
alignItems: "center",
backgroundColor: "#FFFFFF",
marginRight: 10,
},

approvalDateContent: {
flex: 1,
},

approvalDateLabel: {
fontSize: 9,
color: "#74899A",
},

approvalDateValue: {
marginTop: 4,
fontSize: 11,
fontWeight: "700",
color: "#55738A",
},

activeBadge: {
flexDirection: "row",
alignItems: "center",
gap: 5,
backgroundColor: "#FFFFFF",
borderRadius: 999,
paddingHorizontal: 9,
paddingVertical: 6,
},

activeDot: {
width: 7,
height: 7,
borderRadius: 3.5,
backgroundColor: "#4DB662",
},

activeBadgeText: {
fontSize: 8.5,
fontWeight: "600",
color: "#439D54",
},

accessCard: {
backgroundColor: "#FFFFFF",
borderWidth: 1,
borderColor: "#E4EAEE",
borderRadius: 15,
paddingHorizontal: 13,
paddingTop: 14,
paddingBottom: 3,
marginBottom: 13,
},

accessItem: {
minHeight: 55,
flexDirection: "row",
alignItems: "center",
},

accessItemBorder: {
borderBottomWidth: 1,
borderBottomColor: "#ECEEF0",
},

accessItemIcon: {
width: 35,
height: 35,
borderRadius: 10,
justifyContent: "center",
alignItems: "center",
backgroundColor: "#EEF6FD",
marginRight: 9,
},

accessItemText: {
flex: 1,
fontSize: 9.5,
fontWeight: "600",
color: "#535A60",
paddingRight: 8,
},

privacyCard: {
flexDirection: "row",
alignItems: "flex-start",
backgroundColor: "#EEF6FF",
borderRadius: 13,
paddingHorizontal: 12,
paddingVertical: 12,
marginBottom: 19,
},

privacyIcon: {
width: 36,
height: 36,
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

continueButtonWrapper: {
width: "100%",
},

disabledButton: {
opacity: 0.65,
},

continueButton: {
height: 56,
borderRadius: 999,
flexDirection: "row",
justifyContent: "center",
alignItems: "center",
gap: 8,
},

continueButtonText: {
fontSize: 13.5,
fontWeight: "700",
color: "#171A1E",
},
});

