import React, {
useEffect,
useMemo,
useState,
} from "react";
import {
View,
Text,
StyleSheet,
TextInput,
TouchableOpacity,
SafeAreaView,
KeyboardAvoidingView,
Platform,
ScrollView,
KeyboardTypeOptions,
ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
router,
type Href,
} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import API from "../api";

type RoleType =
| "doctor"
| "parent"
| null;

type VerificationStatus =
| "not_started"
| "draft"
| "pending"
| "approved"
| "rejected";

type ErrorsType = {
email?: string;
password?: string;
general?: string;
};

type RenderInputProps = {
placeholder: string;
value: string;
onChangeText: (
text: string
) => void;
error?: string;
secureTextEntry?: boolean;
showEye?: boolean;
isPasswordVisible?: boolean;
onToggleVisibility?: () => void;
keyboardType?: KeyboardTypeOptions;
};

type BackendUser = {
id?: string | number;
_id?: string;
name?: string;
fullName?: string;
email?: string;
role?: "doctor" | "parent";
specialization?: string;
professionalType?: string;
profilePic?: string;
isVerified?: boolean;

verificationStatus?: string;
professionalVerificationStatus?: string;
verification_status?: string;

verificationStep?: string;
verificationCurrentStep?: string;
currentVerificationStep?: string;

verificationSubmittedAt?: string;
verificationApprovedAt?: string;
verifiedAt?: string;

[key: string]: unknown;

};

type BackendLoginResponse = {
status?: string;
msg?: string;
message?: string;
error?: string;
token?: string;
verificationToken?: string;
user?: BackendUser;
};

export default function LoginScreen() {
const [role, setRole] =
useState<RoleType>(null);

const [
roleLoading,
setRoleLoading,
] = useState(true);

const [email, setEmail] =
useState("");

const [password, setPassword] =
useState("");

const [
showPassword,
setShowPassword,
] = useState(false);

const [errors, setErrors] =
useState<ErrorsType>({});

const [loading, setLoading] =
useState(false);

const [
needsEmailVerification,
setNeedsEmailVerification,
] = useState(false);

const [
resendingVerificationCode,
setResendingVerificationCode,
] = useState(false);

const emailRegex = useMemo(
() =>
/^[^\s@]+@[^\s@]+.[^\s@]+$/,
[]
);

useEffect(() => {
let isMounted = true;


const loadSelectedRole =
  async () => {
    try {
      const savedRole =
        await AsyncStorage.getItem(
          "role"
        );

      if (!isMounted) {
        return;
      }

      if (
        savedRole === "doctor" ||
        savedRole === "parent"
      ) {
        setRole(savedRole);
      } else {
        router.replace(
          "/role-selection" as Href
        );
      }
    } catch (error) {
      console.log(
        "Error loading role:",
        error
      );

      if (isMounted) {
        router.replace(
          "/role-selection" as Href
        );
      }
    } finally {
      if (isMounted) {
        setRoleLoading(false);
      }
    }
  };

loadSelectedRole();

return () => {
  isMounted = false;
};


}, []);

const clearError = (
field: keyof ErrorsType
) => {
setErrors(
(previousErrors) => ({
...previousErrors,
[field]: undefined,
general: undefined,
})
);
};

const handleEmailChange = (
text: string
) => {
setEmail(text);


setNeedsEmailVerification(
  false
);

clearError("email");


};

const handlePasswordChange = (
text: string
) => {
setPassword(text);


setNeedsEmailVerification(
  false
);

clearError("password");


};

const validateForm = () => {
const newErrors: ErrorsType =
{};


const cleanEmail = email
  .trim()
  .toLowerCase();

if (!cleanEmail) {
  newErrors.email =
    "Email address is required";
} else if (
  !emailRegex.test(cleanEmail)
) {
  newErrors.email =
    "Please enter a valid email address";
}

if (!password) {
  newErrors.password =
    "Password is required";
}

setErrors(newErrors);

return (
  Object.keys(newErrors).length ===
  0
);


};

const normalizeStatus = (
value: unknown
): VerificationStatus => {
if (
value === "approved" ||
value === "verified"
) {
return "approved";
}


if (
  value === "pending" ||
  value === "under_review"
) {
  return "pending";
}

if (
  value === "rejected" ||
  value === "changes_required" ||
  value === "expired" ||
  value === "suspended"
) {
  return "rejected";
}

if (value === "draft") {
  return "draft";
}

return "not_started";


};

const getDoctorCurrentStep = (
user?: BackendUser
): string | null => {
if (
typeof user?.verificationStep ===
"string"
) {
return user.verificationStep;
}


if (
  typeof user?.verificationCurrentStep ===
  "string"
) {
  return user.verificationCurrentStep;
}

if (
  typeof user?.currentVerificationStep ===
  "string"
) {
  return user.currentVerificationStep;
}

return null;


};

const getDraftRoute = (
currentStep?: string | null
): Href => {
switch (currentStep) {
case "documents":
return "/doctor/doctor-verification/documents" as Href;


  case "review":
  case "submitted":
    return "/doctor/doctor-verification/review" as Href;

  case "professional-info":
  case "professional_info":
    return "/doctor/doctor-verification/professional-info" as Href;

  case "intro":
  default:
    return "/doctor/doctor-verification/intro" as Href;
}


};

const routeDoctorByStatus =
async (
status: VerificationStatus,
currentStep?: string | null
) => {
switch (status) {
case "approved": {
const hasSeenApproval =
await AsyncStorage.getItem(
"hasSeenVerificationApproval"
);


      const doctorAccessEnabled =
        await AsyncStorage.getItem(
          "doctorAccessEnabled"
        );

      if (
        hasSeenApproval === "true" &&
        doctorAccessEnabled === "true"
      ) {
        router.replace(
          "/doctor/home" as Href
        );
      } else {
        router.replace(
          "/doctor/doctor-verification/approved" as Href
        );
      }

      return;
    }

    case "pending":
      router.replace(
        "/doctor/doctor-verification/pending" as Href
      );

      return;

    case "rejected":
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
    default:
      router.replace(
        "/doctor/doctor-verification/intro" as Href
      );
  }
};


const storeDoctorVerificationSession =
async ({
user,
verificationStatus,
currentStep,
verificationToken,
}: {
user: BackendUser;
verificationStatus: VerificationStatus;
currentStep?: string | null;
verificationToken?: string;
}) => {
const fullName =
user.fullName ||
user.name ||
"";


  const valuesToStore: [
    string,
    string,
  ][] = [
    ["role", "doctor"],
    [
      "user",
      JSON.stringify({
        ...user,
        role: "doctor",
        verificationStatus,
        verificationStep:
          currentStep || "",
      }),
    ],
    [
      "verificationStatus",
      verificationStatus,
    ],
    [
      "verificationCurrentStep",
      currentStep || "",
    ],
  ];

  if (fullName) {
    valuesToStore.push([
      "verificationFullName",
      fullName,
    ]);
  }

  if (user.specialization) {
    valuesToStore.push([
      "verificationSpecialization",
      user.specialization,
    ]);
  }

  if (verificationToken) {
    valuesToStore.push([
      "verificationToken",
      verificationToken,
    ]);
  }

  await AsyncStorage.multiSet(
    valuesToStore
  );

  await AsyncStorage.removeItem(
    "token"
  );

  if (!verificationToken) {
    await AsyncStorage.removeItem(
      "verificationToken"
    );
  }

  if (
    verificationStatus !==
    "approved"
  ) {
    await AsyncStorage.multiRemove([
      "hasSeenVerificationApproval",
      "doctorAccessEnabled",
      "verificationApprovedAt",
    ]);
  }
};


const handleVerifyEmail =
async () => {
if (
loading ||
resendingVerificationCode
) {
return;
}


  const cleanEmail = email
    .trim()
    .toLowerCase();

  if (!cleanEmail) {
    setErrors({
      email:
        "Email address is required",
    });

    return;
  }

  if (
    !emailRegex.test(cleanEmail)
  ) {
    setErrors({
      email:
        "Please enter a valid email address",
    });

    return;
  }

  setResendingVerificationCode(
    true
  );

  setErrors({});

  try {
    await API.post(
      "/auth/resend-code",
      {
        email: cleanEmail,
      }
    );

    await AsyncStorage.multiSet([
      [
        "role",
        "parent",
      ],
      [
        "pendingVerificationEmail",
        cleanEmail,
      ],
    ]);

    router.push({
      pathname:
        "/auth/otp",

      params: {
        email:
          cleanEmail,
        role:
          "parent",
        mode:
          "register",
      },
    });
  } catch (error) {
    if (
      axios.isAxiosError(
        error
      )
    ) {
      console.log(
        "FULL RESEND VERIFICATION ERROR:",
        {
          message:
            error.message,

          status:
            error.response
              ?.status,

          data:
            error.response
              ?.data,

          url:
            error.config
              ?.url,

          baseURL:
            error.config
              ?.baseURL,
        }
      );

      const message =
        error.response
          ?.data?.msg ||
        error.response
          ?.data
          ?.message ||
        error.response
          ?.data
          ?.error ||
        error.message ||
        "Failed to send a new verification code.";

      setErrors({
        general:
          message,
      });
    } else {
      console.log(
        "Unexpected resend verification error:",
        error
      );

      setErrors({
        general:
          error instanceof
            Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    }
  } finally {
    setResendingVerificationCode(
      false
    );
  }
};














const handleLogin = async () => {
if (!role || loading) {
return;
}

const isValid =
  validateForm();

if (!isValid) {
  return;
}

const cleanEmail = email
  .trim()
  .toLowerCase();

setLoading(true);
setErrors({});

setNeedsEmailVerification(
  false
);

try {
  const response =
    await API.post<BackendLoginResponse>(
      "/auth/login",
      {
        email: cleanEmail,
        password,
      },
      {
        validateStatus: (
          status
        ) =>
          status >= 200 &&
          status < 500,
      }
    );

  console.log(
    "LOGIN RESPONSE:",
    {
      httpStatus:
        response.status,
      data:
        response.data,
    }
  );

  const data =
    response.data || {};

  const user =
    data.user;

  const backendStatus =
    data.status || "";

  const message =
    data.msg ||
    data.message ||
    data.error ||
    "Login failed";

  if (
    user?.role &&
    user.role !== role
  ) {
    setErrors({
      general:
        user.role === "doctor"
          ? "This email belongs to a doctor account. Please change the selected role."
          : "This email belongs to a parent account. Please change the selected role.",
    });

    return;
  }

  if (role === "parent") {
    if (
      response.status === 200 &&
      data.token &&
      user?.role === "parent"
    ) {
      await AsyncStorage.multiSet([
        ["token", data.token],
        [
          "user",
          JSON.stringify(user),
        ],
        ["role", "parent"],
      ]);

      await AsyncStorage.multiRemove([
        "verificationToken",
        "pendingVerificationEmail",
      ]);

      router.replace(
        "/parent/parentHome" as Href
      );

      return;
    }

    const isVerificationRequired =
      typeof message === "string" &&
      message
        .toLowerCase()
        .includes(
          "verify your email"
        );

    if (
      isVerificationRequired
    ) {
      setNeedsEmailVerification(
        true
      );

      setErrors({
        general:
          "Your email is not verified yet. Send a new code to continue.",
      });

      return;
    }

    setErrors({
      general: message,
    });

    return;
  }

  if (
    backendStatus ===
    "VERIFICATION_INCOMPLETE"
  ) {
    if (
      !user ||
      user.role !== "doctor" ||
      !data.verificationToken
    ) {
      throw new Error(
        "The server returned incomplete doctor verification data."
      );
    }

    const verificationStatus =
      normalizeStatus(
        user.verificationStatus
      );

    const currentStep =
      getDoctorCurrentStep(user);

    await storeDoctorVerificationSession({
      user,
      verificationStatus,
      currentStep,
      verificationToken:
        data.verificationToken,
    });

    await routeDoctorByStatus(
      verificationStatus,
      currentStep
    );

    return;
  }

  if (
    backendStatus ===
    "PENDING_VERIFICATION"
  ) {
    if (
      !user ||
      user.role !== "doctor"
    ) {
      throw new Error(
        "The server returned incomplete pending verification data."
      );
    }

    const currentStep =
      getDoctorCurrentStep(user) ||
      "submitted";

    await storeDoctorVerificationSession({
      user,
      verificationStatus:
        "pending",
      currentStep,
    });

    await routeDoctorByStatus(
      "pending",
      currentStep
    );

    return;
  }

  if (
    backendStatus ===
    "VERIFICATION_REJECTED"
  ) {
    if (
      !user ||
      user.role !== "doctor"
    ) {
      throw new Error(
        "The server returned incomplete rejected verification data."
      );
    }

    const currentStep =
      getDoctorCurrentStep(user);

    await storeDoctorVerificationSession({
      user,
      verificationStatus:
        "rejected",
      currentStep,
      verificationToken:
        data.verificationToken,
    });

    await routeDoctorByStatus(
      "rejected",
      currentStep
    );

    return;
  }

  if (
    response.status === 200 &&
    data.token &&
    user?.role === "doctor"
  ) {
    const verificationStatus =
      normalizeStatus(
        user.verificationStatus ??
          user.professionalVerificationStatus ??
          user.verification_status
      );

    const currentStep =
      getDoctorCurrentStep(user);

    if (
      verificationStatus !==
      "approved"
    ) {
      await storeDoctorVerificationSession({
        user,
        verificationStatus,
        currentStep,
      });

      await routeDoctorByStatus(
        verificationStatus,
        currentStep
      );

      return;
    }

    const approvedAt =
      typeof user.verificationApprovedAt ===
      "string"
        ? user.verificationApprovedAt
        : typeof user.verificationSubmittedAt ===
            "string"
          ? user.verificationSubmittedAt
          : typeof user.verifiedAt ===
              "string"
            ? user.verifiedAt
            : "";

    const fullName =
      user.fullName ||
      user.name ||
      "";

    const valuesToStore: [
      string,
      string,
    ][] = [
      ["token", data.token],
      [
        "user",
        JSON.stringify({
          ...user,
          role: "doctor",
          verificationStatus:
            "approved",
          verificationStep:
            currentStep ||
            "submitted",
          isVerified: true,
        }),
      ],
      ["role", "doctor"],
      [
        "verificationStatus",
        "approved",
      ],
      [
        "verificationCurrentStep",
        currentStep ||
          "submitted",
      ],
      [
        "doctorAccessEnabled",
        "true",
      ],
    ];

    if (fullName) {
      valuesToStore.push([
        "verificationFullName",
        fullName,
      ]);
    }

    if (user.specialization) {
      valuesToStore.push([
        "verificationSpecialization",
        user.specialization,
      ]);
    }

    if (approvedAt) {
      valuesToStore.push([
        "verificationApprovedAt",
        approvedAt,
      ]);
    }

    await AsyncStorage.multiSet(
      valuesToStore
    );

    await AsyncStorage.multiRemove([
      "verificationToken",
      "pendingVerificationEmail",
      "verificationRejectedAt",
      "verificationRejectionReason",
    ]);

    await routeDoctorByStatus(
      "approved",
      currentStep ||
        "submitted"
    );

    return;
  }

  setErrors({
    general: message,
  });
} catch (error) {
  if (
    axios.isAxiosError(
      error
    )
  ) {
    console.log(
      "FULL LOGIN ERROR:",
      {
        message:
          error.message,

        status:
          error.response
            ?.status,

        data:
          error.response
            ?.data,

        url:
          error.config
            ?.url,

        baseURL:
          error.config
            ?.baseURL,
      }
    );

    const message =
      error.response
        ?.data?.msg ||
      error.response
        ?.data?.message ||
      error.response
        ?.data?.error ||
      error.message ||
      "Login failed";

    setErrors({
      general:
        String(message),
    });
  } else {
    console.log(
      "Unexpected login error:",
      error
    );

    setErrors({
      general:
        error instanceof
          Error
          ? error.message
          : "Something went wrong. Please try again.",
    });
  }
} finally {
  setLoading(false);
}


};

const handleChangeRole =
async () => {
if (loading) {
return;
}


  try {
    await AsyncStorage.removeItem(
      "role"
    );

    router.replace(
      "/role-selection" as Href
    );
  } catch (error) {
    console.log(
      "Error changing role:",
      error
    );
  }
};


const renderInput = ({
placeholder,
value,
onChangeText,
error,
secureTextEntry = false,
showEye = false,
isPasswordVisible = false,
onToggleVisibility,
keyboardType = "default",
}: RenderInputProps) => {
return (
<View
style={
styles.inputBlock
}
>
<View
style={[
styles.inputContainer,


        error
          ? styles.inputError
          : null,
      ]}
    >
      <TextInput
        placeholder={
          placeholder
        }
        placeholderTextColor="#A7A7A7"
        value={value}
        onChangeText={
          onChangeText
        }
        secureTextEntry={
          secureTextEntry
        }
        keyboardType={
          keyboardType
        }
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
        returnKeyType={
          placeholder ===
          "Password"
            ? "done"
            : "next"
        }
        onSubmitEditing={
          placeholder ===
          "Password"
            ? handleLogin
            : undefined
        }
        style={
          styles.input
        }
      />

      {showEye ? (
        <TouchableOpacity
          onPress={
            onToggleVisibility
          }
          activeOpacity={0.7}
          style={
            styles.eyeButton
          }
          disabled={
            loading
          }
        >
          <Ionicons
            name={
              isPasswordVisible
                ? "eye-off-outline"
                : "eye-outline"
            }
            size={18}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      ) : null}
    </View>

    {error ? (
      <Text
        style={
          styles.errorText
        }
      >
        {error}
      </Text>
    ) : null}
  </View>
);


};

if (
roleLoading ||
!role
) {
return (
<SafeAreaView
style={
styles.safeArea
}
>
<LinearGradient
colors={[
"#EEF7FF",
"#FFF6F6",
"#FFFFFF",
]}
locations={[
0,
0.35,
0.65,
]}
start={{
x: 0,
y: 0,
}}
end={{
x: 1,
y: 0.18,
}}
style={
styles.background
}
>
<View
style={
styles.roleLoadingContainer
}
> <ActivityIndicator
           size="large"
           color="#8DC0F0"
         />


        <Text
          style={
            styles.roleLoadingText
          }
        >
          Preparing login...
        </Text>
      </View>
    </LinearGradient>
  </SafeAreaView>
);


}









const isDoctor =
role === "doctor";

return (
<SafeAreaView
style={
styles.safeArea
}
>
<LinearGradient
colors={[
"#EEF7FF",
"#FFF6F6",
"#FFFFFF",
]}
locations={[
0,
0.35,
0.65,
]}
start={{
x: 0,
y: 0,
}}
end={{
x: 1,
y: 0.18,
}}
style={
styles.background
}
>
<KeyboardAvoidingView
style={
styles.flex
}
behavior={
Platform.OS ===
"ios"
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
bounces={false}
keyboardShouldPersistTaps="handled"
>
<View
style={
styles.topSection
}
>
<View
style={
styles.roleBadge
}
>
<Ionicons
name={
isDoctor
? "medkit-outline"
: "people-outline"
}
size={15}
color={
isDoctor
? "#729FD0"
: "#E98E92"
}
/>


            <Text
              style={
                styles.roleBadgeText
              }
            >
              {isDoctor
                ? "Doctor Account"
                : "Parent Account"}
            </Text>
          </View>

          <Text
            style={
              styles.title
            }
          >
            {isDoctor
              ? "Login as Doctor"
              : "Login as Parent"}
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            {isDoctor
              ? "Sign in to check your professional verification status and access your dashboard after approval."
              : "Continue tracking and understanding your child’s emotional and behavioral progress."}
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={
              handleChangeRole
            }
            disabled={
              loading
            }
            style={
              styles.changeRoleButton
            }
          >
            <Text
              style={
                styles.changeRoleText
              }
            >
              Change role
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={
            styles.formSection
          }
        >
          {renderInput({
            placeholder:
              "Email address",

            value:
              email,

            onChangeText:
              handleEmailChange,

            error:
              errors.email,

            keyboardType:
              "email-address",
          })}

          {renderInput({
            placeholder:
              "Password",

            value:
              password,

            onChangeText:
              handlePasswordChange,

            error:
              errors.password,

            secureTextEntry:
              !showPassword,

            showEye:
              true,

            isPasswordVisible:
              showPassword,

            onToggleVisibility:
              () =>
                setShowPassword(
                  (
                    previousValue
                  ) =>
                    !previousValue
                ),
          })}

          <TouchableOpacity
            activeOpacity={0.7}
            style={
              styles.forgotWrapper
            }
            onPress={() =>
              router.push(
                "/auth/forgot-password" as Href
              )
            }
            disabled={
              loading
            }
          >
            <Text
              style={
                styles.forgotText
              }
            >
              Forgot Password?
            </Text>
          </TouchableOpacity>

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

          {needsEmailVerification ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={
                handleVerifyEmail
              }
              disabled={
                loading ||
                resendingVerificationCode
              }
              style={[
                styles.verifyEmailButton,

                (loading ||
                  resendingVerificationCode) &&
                  styles.disabledButtonWrapper,
              ]}
            >
              {resendingVerificationCode ? (
                <ActivityIndicator
                  size="small"
                  color="#729FD0"
                />
              ) : (
                <>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color="#729FD0"
                  />

                  <Text
                    style={
                      styles.verifyEmailButtonText
                    }
                  >
                    Send Verification Code
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        <View
          style={
            styles.bottomSection
          }
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={
              handleLogin
            }
            style={[
              styles.buttonWrapper,

              (loading ||
                resendingVerificationCode) &&
                styles.disabledButtonWrapper,
            ]}
            disabled={
              loading ||
              resendingVerificationCode
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
                styles.button
              }
            >
              {loading ? (
                <ActivityIndicator
                  color="#111111"
                />
              ) : (
                <Text
                  style={
                    styles.buttonText
                  }
                >
                  Login
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text
            style={
              styles.footerText
            }
          >
            Don&apos;t have an
            account?{" "}
            <Text
              style={
                styles.signUpText
              }
              onPress={() =>
                router.push(
                  "/auth/register" as Href
                )
              }
            >
              Sign Up
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </LinearGradient>
</SafeAreaView>

);
}

const styles =
StyleSheet.create({
flex: {
flex: 1,
},


safeArea: {
  flex: 1,
  backgroundColor:
    "#FFFFFF",
},

background: {
  flex: 1,
},

roleLoadingContainer: {
  flex: 1,
  justifyContent:
    "center",
  alignItems:
    "center",
  gap: 14,
},

roleLoadingText: {
  fontSize: 14,
  color:
    "#8D8D8D",
},

scrollContent: {
  flexGrow: 1,
  paddingHorizontal: 28,
  paddingTop: 34,
  paddingBottom: 28,
  justifyContent:
    "space-between",
},

topSection: {
  alignItems:
    "center",
  marginTop: 8,
},

roleBadge: {
  flexDirection:
    "row",
  alignItems:
    "center",
  gap: 6,
  backgroundColor:
    "rgba(255,255,255,0.78)",
  borderRadius: 999,
  paddingHorizontal: 12,
  paddingVertical: 7,
  marginBottom: 14,
},

roleBadgeText: {
  fontSize: 12,
  fontWeight:
    "600",
  color:
    "#555555",
},

title: {
  fontSize: 22,
  fontWeight:
    "700",
  color:
    "#1F1F1F",
  textAlign:
    "center",
  marginBottom: 10,
},

subtitle: {
  width:
    "90%",
  fontSize: 14,
  lineHeight: 22,
  color:
    "#8D8D8D",
  textAlign:
    "center",
},

changeRoleButton: {
  marginTop: 10,
  paddingHorizontal: 10,
  paddingVertical: 4,
},

changeRoleText: {
  fontSize: 12,
  fontWeight:
    "600",
  color:
    "#7AAEE0",
  textDecorationLine:
    "underline",
},

formSection: {
  marginTop: 34,
},

inputBlock: {
  marginBottom: 14,
},

inputContainer: {
  minHeight: 54,
  backgroundColor:
    "#F4F4F6",
  borderRadius: 11,
  paddingHorizontal: 14,
  flexDirection:
    "row",
  alignItems:
    "center",
},

input: {
  flex: 1,
  fontSize: 14,
  color:
    "#1F1F1F",
},

eyeButton: {
  paddingLeft: 10,
  paddingVertical: 4,
},

inputError: {
  borderWidth: 1,
  borderColor:
    "#EF4444",
},

errorText: {
  marginTop: 6,
  marginLeft: 4,
  color:
    "#EF4444",
  fontSize: 11,
  lineHeight: 15,
},

forgotWrapper: {
  alignSelf:
    "flex-end",
  marginTop: -2,
},

forgotText: {
  fontSize: 11,
  color:
    "#8DC0F0",
  fontWeight:
    "600",
},

demoModeBox: {
  marginTop: 18,
  flexDirection:
    "row",
  alignItems:
    "flex-start",
  gap: 8,
  backgroundColor:
    "#FFF6EA",
  borderRadius: 11,
  paddingHorizontal: 12,
  paddingVertical: 11,
},

demoModeText: {
  flex: 1,
  fontSize: 11,
  lineHeight: 16,
  color:
    "#8A6D50",
},

generalErrorBox: {
  marginTop: 18,
  flexDirection:
    "row",
  alignItems:
    "flex-start",
  gap: 8,
  backgroundColor:
    "#FEF2F2",
  borderRadius: 11,
  paddingHorizontal: 12,
  paddingVertical: 11,
},

generalErrorText: {
  flex: 1,
  fontSize: 12,
  lineHeight: 17,
  color:
    "#DC2626",
},

verifyEmailButton: {
  minHeight: 46,
  marginTop: 12,
  borderRadius: 999,
  borderWidth: 1,
  borderColor:
    "#B9D8F6",
  backgroundColor:
    "rgba(238,246,255,0.95)",
  flexDirection:
    "row",
  alignItems:
    "center",
  justifyContent:
    "center",
  gap: 8,
  paddingHorizontal: 16,
},

verifyEmailButtonText: {
  fontSize: 13,
  fontWeight:
    "700",
  color:
    "#729FD0",
},

bottomSection: {
  marginTop: 34,
  paddingBottom: 6,
},

buttonWrapper: {
  width:
    "100%",
},

disabledButtonWrapper: {
  opacity: 0.7,
},

button: {
  height: 56,
  borderRadius: 999,
  justifyContent:
    "center",
  alignItems:
    "center",
},

buttonText: {
  fontSize: 16,
  fontWeight:
    "700",
  color:
    "#111111",
},

footerText: {
  marginTop: 22,
  textAlign:
    "center",
  fontSize: 13,
  color:
    "#A0A0A0",
},

signUpText: {
  color:
    "#8DC0F0",
  fontWeight:
    "600",
},


});
