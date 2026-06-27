import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Switch,
  ScrollView,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../api";

type Child = {
  _id: string;
  name: string;
  age: number;
  gender?: string;
};

type UserProfile = {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  profilePic?: string;
  role?: "parent" | "doctor";
  isVerified?: boolean;
  verificationStatus?: string;
};

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);

  const [languageModalVisible, setLanguageModalVisible] =
    useState(false);

  const [selectedLanguage, setSelectedLanguage] =
    useState("Arabic");

  const [logoutModalVisible, setLogoutModalVisible] =
    useState(false);

  const [logoutLoading, setLogoutLoading] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [name, setName] =
    useState("User");

  const [email, setEmail] =
    useState("");

  const [profilePic, setProfilePic] =
    useState("");

  const [children, setChildren] =
    useState<Child[]>([]);

  const [childrenLoading, setChildrenLoading] =
    useState(true);

  const [childrenError, setChildrenError] =
    useState("");

  const [showEntryChildPicker, setShowEntryChildPicker] =
    useState(false);

  const [showSearchModal, setShowSearchModal] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const filteredChildren = useMemo(() => {
    const normalizedQuery =
      searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return children;
    }

    return children.filter((child) =>
      child.name
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [children, searchQuery]);

  const handleSessionExpired =
    useCallback(async () => {
      try {
        await AsyncStorage.multiRemove([
          "token",
          "user",
        ]);
      } catch (storageError) {
        console.log(
          "Session cleanup error:",
          storageError
        );
      }

      router.replace("/auth/login");
    }, []);

  const loadStoredUser =
    useCallback(async () => {
      try {
        const savedUser =
          await AsyncStorage.getItem(
            "user"
          );

        if (!savedUser) {
          return;
        }

        const parsedUser: UserProfile =
          JSON.parse(savedUser);

        setName(
          parsedUser.fullName ||
            parsedUser.name ||
            "User"
        );

        setEmail(
          parsedUser.email || ""
        );

        setProfilePic(
          parsedUser.profilePic || ""
        );
      } catch (storageError) {
        console.log(
          "Stored user parsing error:",
          storageError
        );
      }
    }, []);

  const fetchProfile =
    useCallback(async () => {
      try {
        setLoading(true);

        const token =
          await AsyncStorage.getItem(
            "token"
          );

        if (!token) {
          await handleSessionExpired();
          return;
        }

        const response =
          await API.get<UserProfile>(
            "/auth/profile"
          );

        const profile =
          response.data || {};

        const profileName =
          profile.fullName ||
          profile.name ||
          "User";

        const profileEmail =
          profile.email || "";

        const profileImage =
          profile.profilePic || "";

        setName(profileName);
        setEmail(profileEmail);
        setProfilePic(profileImage);

        await AsyncStorage.setItem(
          "user",
          JSON.stringify({
            ...profile,
            name: profileName,
            fullName: profileName,
            email: profileEmail,
            profilePic: profileImage,
          })
        );
      } catch (error: any) {
        console.log(
          "Profile error:",
          error?.response?.data ||
            error?.message
        );

        if (
          error?.response?.status === 401
        ) {
          await handleSessionExpired();
          return;
        }

        await loadStoredUser();
      } finally {
        setLoading(false);
      }
    }, [
      handleSessionExpired,
      loadStoredUser,
    ]);

  const fetchChildren =
    useCallback(async () => {
      try {
        setChildrenLoading(true);
        setChildrenError("");

        const token =
          await AsyncStorage.getItem(
            "token"
          );

        if (!token) {
          await handleSessionExpired();
          return;
        }

        const response =
          await API.get(
            "/children/all"
          );

        const childrenData =
          Array.isArray(response.data)
            ? response.data
            : response.data?.children ||
              [];

        setChildren(childrenData);
      } catch (error: any) {
        if (
          error?.response?.status === 401
        ) {
          await handleSessionExpired();
          return;
        }

        const message =
          error?.response?.data?.msg ||
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load children";

        setChildrenError(message);

        console.log(
          "Profile children error:",
          error?.response?.data ||
            error?.message
        );
      } finally {
        setChildrenLoading(false);
      }
    }, [handleSessionExpired]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      fetchChildren();
    }, [
      fetchProfile,
      fetchChildren,
    ])
  );

  const handleLogout = async () => {
    if (logoutLoading) {
      return;
    }

    try {
      setLogoutLoading(true);

      await AsyncStorage.removeItem(
        "token"
      );

      await AsyncStorage.removeItem(
        "user"
      );

      setLogoutModalVisible(false);

      router.replace("/auth/login");
    } catch (error) {
      console.log(
        "Logout error:",
        error
      );

      Alert.alert(
        "Logout failed",
        "Something went wrong while logging out. Please try again."
      );
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleSelectLanguage = (
    language: string
  ) => {
    setSelectedLanguage(language);
    setLanguageModalVisible(false);
  };

  const showChildrenLoadingError =
    () => {
      Alert.alert(
        "Unable to load children",
        "We could not load your child profiles. Please try again.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Try Again",
            onPress: fetchChildren,
          },
        ]
      );
    };

  const showAddChildAlert = (
    message: string
  ) => {
    Alert.alert(
      "Add a child first",
      message,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Add Child",
          onPress: () =>
            router.push(
              "/parent/add-child"
            ),
        },
      ]
    );
  };

  const openAddEntryForChild = (
    child: Child
  ) => {
    setShowEntryChildPicker(false);

    router.push(
      {
        pathname:
          "/parent/ai-chat",
        params: {
          childId: child._id,
          childName: child.name,
          childAge: String(
            child.age
          ),
        },
      } as any
    );
  };

  const openChildProfile = (
    child: Child
  ) => {
    setShowSearchModal(false);
    setSearchQuery("");

    router.push(
      {
        pathname:
          "/parent/childProfile",
        params: {
          childId: child._id,
          childName: child.name,
          childAge: String(
            child.age
          ),
        },
      } as any
    );
  };

  const handleAddEntryPress =
    () => {
      if (childrenLoading) {
        return;
      }

      if (childrenError) {
        showChildrenLoadingError();
        return;
      }

      if (
        children.length === 0
      ) {
        showAddChildAlert(
          "You need to add a child profile before adding an entry."
        );

        return;
      }

      if (
        children.length === 1
      ) {
        openAddEntryForChild(
          children[0]
        );

        return;
      }

      setShowEntryChildPicker(
        true
      );
    };

  const handleSearchPress =
    () => {
      if (childrenLoading) {
        return;
      }

      if (childrenError) {
        showChildrenLoadingError();
        return;
      }

      if (
        children.length === 0
      ) {
        showAddChildAlert(
          "You need to add a child profile before searching."
        );

        return;
      }

      setSearchQuery("");
      setShowSearchModal(true);
    };

  const closeSearchModal =
    () => {
      setShowSearchModal(false);
      setSearchQuery("");
    };

  const getChildIcon = (
    child: Child
  ): keyof typeof Ionicons.glyphMap => {
    const gender =
      child.gender?.toLowerCase();

    if (gender === "female") {
      return "female";
    }

    if (gender === "male") {
      return "male";
    }

    return "happy-outline";
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={styles.loaderBox}
        >
          <ActivityIndicator
            size="large"
            color="#7BB8E8"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading your profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.scrollContent
          }
        >
          <View
            style={
              styles.profileSection
            }
          >
            <View
              style={
                styles.avatarWrapper
              }
            >
              <Image
                source={
                  profilePic
                    ? {
                        uri: profilePic,
                      }
                    : require("../../assets/images/images/image 119.png")
                }
                style={styles.avatar}
              />
            </View>

            <Text style={styles.name}>
              {name}
            </Text>

            <Text style={styles.email}>
              {email ||
                "No email available"}
            </Text>

            <View
              style={
                styles.privacyBadge
              }
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={15}
                color="#3976A4"
              />

              <Text
                style={
                  styles.privacyBadgeText
                }
              >
                Your identity is hidden
                from specialists
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={
                styles.editBtnWrapper
              }
              onPress={() =>
                router.push(
                  "/parent/edit-profile"
                )
              }
            >
              <LinearGradient
                colors={[
                  "#B9D8F6",
                  "#FBC0BF",
                ]}
                start={{
                  x: 0,
                  y: 0,
                }}
                end={{
                  x: 1,
                  y: 0,
                }}
                style={
                  styles.editBtn
                }
              >
                <Feather
                  name="edit-2"
                  size={14}
                  color="#222"
                />

                <Text
                  style={
                    styles.editBtnText
                  }
                >
                  Edit My Profile
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text
            style={
              styles.sectionTitle
            }
          >
            Account Settings
          </Text>

          <View style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.row}
              onPress={() =>
                router.push(
                  "/parent/change-password"
                )
              }
            >
              <View
                style={
                  styles.rowLeft
                }
              >
                <MaterialCommunityIcons
                  name="form-textbox-password"
                  size={20}
                  color="#444"
                />

                <Text
                  style={
                    styles.rowText
                  }
                >
                  Change Password
                </Text>
              </View>

              <Feather
                name="chevron-right"
                size={20}
                color="#777"
              />
            </TouchableOpacity>

            <View
              style={styles.divider}
            />

            <View style={styles.row}>
              <View
                style={
                  styles.rowLeft
                }
              >
                <Feather
                  name="bell"
                  size={20}
                  color="#444"
                />

                <Text
                  style={
                    styles.rowText
                  }
                >
                  Notifications
                </Text>
              </View>

              <Switch
                value={
                  notificationsEnabled
                }
                onValueChange={
                  setNotificationsEnabled
                }
                trackColor={{
                  false: "#D9D9D9",
                  true: "#34C759",
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View
              style={styles.divider}
            />

            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.row}
              onPress={() =>
                setLanguageModalVisible(
                  true
                )
              }
            >
              <View
                style={
                  styles.rowLeft
                }
              >
                <Feather
                  name="globe"
                  size={20}
                  color="#444"
                />

                <View>
                  <Text
                    style={
                      styles.rowText
                    }
                  >
                    Language
                  </Text>

                  <Text
                    style={
                      styles.rowDescription
                    }
                  >
                    {selectedLanguage}
                  </Text>
                </View>
              </View>

              <Feather
                name="chevron-right"
                size={20}
                color="#777"
              />
            </TouchableOpacity>

            <View
              style={styles.divider}
            />

            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.row}
              onPress={() =>
                router.push(
                  "/terms-policies"
                )
              }
            >
              <View
                style={
                  styles.rowLeft
                }
              >
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={20}
                  color="#444"
                />

                <Text
                  style={
                    styles.rowText
                  }
                >
                  Terms & Policies
                </Text>
              </View>

              <Feather
                name="chevron-right"
                size={20}
                color="#777"
              />
            </TouchableOpacity>
          </View>

          <Text
            style={
              styles.sectionTitle
            }
          >
            Support
          </Text>

          <View style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.row}
              onPress={() =>
                router.push(
                  "/contact-support"
                )
              }
            >
              <View
                style={
                  styles.rowLeft
                }
              >
                <Feather
                  name="headphones"
                  size={20}
                  color="#444"
                />

                <Text
                  style={
                    styles.rowText
                  }
                >
                  Contact Support
                </Text>
              </View>

              <Feather
                name="chevron-right"
                size={20}
                color="#777"
              />
            </TouchableOpacity>

            <View
              style={styles.divider}
            />

            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.row}
              onPress={() =>
                router.push(
                  "/AboutUs"
                )
              }
            >
              <View
                style={
                  styles.rowLeft
                }
              >
                <Feather
                  name="info"
                  size={20}
                  color="#444"
                />

                <Text
                  style={
                    styles.rowText
                  }
                >
                  About Us
                </Text>
              </View>

              <Feather
                name="chevron-right"
                size={20}
                color="#777"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            style={
              styles.logoutBtnWrapper
            }
            onPress={() =>
              setLogoutModalVisible(
                true
              )
            }
          >
            <LinearGradient
              colors={[
                "#FFF7F7",
                "#FFF1F2",
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 0,
              }}
              style={
                styles.logoutBtn
              }
            >
              <View
                style={
                  styles.logoutIconWrapper
                }
              >
                <Feather
                  name="log-out"
                  size={18}
                  color="#D65A59"
                />
              </View>

              <View
                style={
                  styles.logoutContent
                }
              >
                <Text
                  style={
                    styles.logoutText
                  }
                >
                  Logout
                </Text>

                <Text
                  style={
                    styles.logoutDescription
                  }
                >
                  Sign out of your
                  account
                </Text>
              </View>

              <View
                style={
                  styles.logoutArrow
                }
              >
                <Feather
                  name="arrow-right"
                  size={18}
                  color="#D65A59"
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <Text
            style={styles.version}
          >
            App Version 2.1.3
          </Text>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.navItem}
            onPress={() =>
              router.replace(
                "/parent/parentHome"
              )
            }
          >
            <Feather
              name="home"
              size={20}
              color="#999"
            />

            <Text
              style={styles.navText}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.navItem}
            onPress={() =>
              router.replace(
                "/parent/activity-history"
              )
            }
          >
            <Feather
              name="list"
              size={20}
              color="#999"
            />

            <Text
              style={styles.navText}
            >
              History
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={
              styles.centerButtonWrapper
            }
            onPress={
              handleAddEntryPress
            }
            disabled={
              childrenLoading
            }
          >
            <LinearGradient
              colors={[
                "#B9D8F6",
                "#FBC0BF",
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 0,
              }}
              style={
                styles.centerButton
              }
            >
              {childrenLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Ionicons
                  name="add"
                  size={28}
                  color="#FFFFFF"
                />
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.navItem}
            onPress={
              handleSearchPress
            }
            disabled={
              childrenLoading
            }
          >
            {childrenLoading ? (
              <ActivityIndicator
                size="small"
                color="#999"
              />
            ) : (
              <Feather
                name="search"
                size={20}
                color="#999"
              />
            )}

            <Text
              style={styles.navText}
            >
              Search
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.navItem}
          >
            <Feather
              name="user"
              size={20}
              color="#222"
            />

            <Text
              style={[
                styles.navText,
                styles.activeNavText,
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={
            languageModalVisible
          }
          transparent
          animationType="fade"
          onRequestClose={() =>
            setLanguageModalVisible(
              false
            )
          }
        >
          <Pressable
            style={styles.overlay}
            onPress={() =>
              setLanguageModalVisible(
                false
              )
            }
          >
            <Pressable
              style={
                styles.bottomSheet
              }
              onPress={(event) =>
                event.stopPropagation()
              }
            >
              <View
                style={
                  styles.sheetHandle
                }
              />

              <Text
                style={
                  styles.bottomSheetTitle
                }
              >
                Select Language
              </Text>

              {[
                "Arabic",
                "English",
              ].map((language) => (
                <TouchableOpacity
                  key={language}
                  activeOpacity={0.75}
                  style={
                    styles.languageOption
                  }
                  onPress={() =>
                    handleSelectLanguage(
                      language
                    )
                  }
                >
                  <Text
                    style={
                      styles.languageText
                    }
                  >
                    {language}
                  </Text>

                  <View
                    style={
                      styles.radioOuter
                    }
                  >
                    {selectedLanguage ===
                    language ? (
                      <View
                        style={
                          styles.radioInner
                        }
                      />
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                activeOpacity={0.75}
                style={
                  styles.cancelLanguageButton
                }
                onPress={() =>
                  setLanguageModalVisible(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.cancelLanguageText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={
            showEntryChildPicker
          }
          transparent
          animationType="fade"
          onRequestClose={() =>
            setShowEntryChildPicker(
              false
            )
          }
        >
          <View
            style={
              styles.childModalOverlay
            }
          >
            <Pressable
              style={
                StyleSheet.absoluteFillObject
              }
              onPress={() =>
                setShowEntryChildPicker(
                  false
                )
              }
            />

            <View
              style={
                styles.childPickerContainer
              }
            >
              <View
                style={
                  styles.sheetHandle
                }
              />

              <View
                style={
                  styles.modalHeader
                }
              >
                <View
                  style={
                    styles.modalTitleRow
                  }
                >
                  <View
                    style={
                      styles.modalAddIcon
                    }
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color="#4C8DBF"
                    />
                  </View>

                  <View
                    style={
                      styles.modalTitleContent
                    }
                  >
                    <Text
                      style={
                        styles.modalTitle
                      }
                    >
                      Add an entry for
                    </Text>

                    <Text
                      style={
                        styles.modalSubtitle
                      }
                    >
                      Select a child to
                      add a new emotional
                      update.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    setShowEntryChildPicker(
                      false
                    )
                  }
                  style={
                    styles.modalCloseButton
                  }
                >
                  <Ionicons
                    name="close"
                    size={21}
                    color="#555"
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={
                  styles.modalChildrenList
                }
                showsVerticalScrollIndicator={
                  false
                }
              >
                {children.map(
                  (
                    child,
                    index
                  ) => (
                    <TouchableOpacity
                      key={child._id}
                      activeOpacity={0.8}
                      onPress={() =>
                        openAddEntryForChild(
                          child
                        )
                      }
                      style={
                        styles.modalChildItem
                      }
                    >
                      <View
                        style={[
                          styles.modalChildAvatar,
                          {
                            backgroundColor:
                              index %
                                2 ===
                              0
                                ? "rgba(251,192,191,0.45)"
                                : "rgba(185,216,246,0.55)",
                          },
                        ]}
                      >
                        <Ionicons
                          name={getChildIcon(
                            child
                          )}
                          size={22}
                          color="#333"
                        />
                      </View>

                      <View
                        style={
                          styles.modalChildInfo
                        }
                      >
                        <Text
                          style={
                            styles.modalChildName
                          }
                        >
                          {child.name}
                        </Text>

                        <Text
                          style={
                            styles.modalChildAge
                          }
                        >
                          {child.age} years
                          old
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={21}
                        color="#999"
                      />
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  setShowEntryChildPicker(
                    false
                  )
                }
                style={
                  styles.cancelModalButton
                }
              >
                <Text
                  style={
                    styles.cancelModalText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={
            showSearchModal
          }
          transparent
          animationType="fade"
          onRequestClose={
            closeSearchModal
          }
        >
          <View
            style={
              styles.childModalOverlay
            }
          >
            <Pressable
              style={
                StyleSheet.absoluteFillObject
              }
              onPress={
                closeSearchModal
              }
            />

            <View
              style={
                styles.searchModalContainer
              }
            >
              <View
                style={
                  styles.sheetHandle
                }
              />

              <View
                style={
                  styles.modalHeader
                }
              >
                <View
                  style={
                    styles.modalTitleRow
                  }
                >
                  <View
                    style={
                      styles.modalSearchIcon
                    }
                  >
                    <Feather
                      name="search"
                      size={19}
                      color="#4C8DBF"
                    />
                  </View>

                  <View
                    style={
                      styles.modalTitleContent
                    }
                  >
                    <Text
                      style={
                        styles.modalTitle
                      }
                    >
                      Search Children
                    </Text>

                    <Text
                      style={
                        styles.modalSubtitle
                      }
                    >
                      Search by name to
                      open a child
                      profile.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={
                    closeSearchModal
                  }
                  style={
                    styles.modalCloseButton
                  }
                >
                  <Ionicons
                    name="close"
                    size={21}
                    color="#555"
                  />
                </TouchableOpacity>
              </View>

              <View
                style={
                  styles.searchInputContainer
                }
              >
                <Feather
                  name="search"
                  size={18}
                  color="#8A8A8A"
                />

                <TextInput
                  value={searchQuery}
                  onChangeText={
                    setSearchQuery
                  }
                  placeholder="Search by child name"
                  placeholderTextColor="#AAAAAA"
                  style={
                    styles.searchInput
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="search"
                />

                {searchQuery.length >
                0 ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      setSearchQuery("")
                    }
                    style={
                      styles.clearSearchButton
                    }
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color="#AAAAAA"
                    />
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView
                style={
                  styles.searchResultsList
                }
                contentContainerStyle={
                  styles.searchResultsContent
                }
                showsVerticalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="handled"
              >
                {filteredChildren.length >
                0 ? (
                  filteredChildren.map(
                    (
                      child,
                      index
                    ) => (
                      <TouchableOpacity
                        key={child._id}
                        activeOpacity={0.8}
                        onPress={() =>
                          openChildProfile(
                            child
                          )
                        }
                        style={
                          styles.modalChildItem
                        }
                      >
                        <View
                          style={[
                            styles.modalChildAvatar,
                            {
                              backgroundColor:
                                index %
                                  2 ===
                                0
                                  ? "rgba(251,192,191,0.45)"
                                  : "rgba(185,216,246,0.55)",
                            },
                          ]}
                        >
                          <Ionicons
                            name={getChildIcon(
                              child
                            )}
                            size={22}
                            color="#333"
                          />
                        </View>

                        <View
                          style={
                            styles.modalChildInfo
                          }
                        >
                          <Text
                            style={
                              styles.modalChildName
                            }
                          >
                            {child.name}
                          </Text>

                          <Text
                            style={
                              styles.modalChildAge
                            }
                          >
                            {child.age} years
                            old
                          </Text>
                        </View>

                        <Ionicons
                          name="chevron-forward"
                          size={21}
                          color="#999"
                        />
                      </TouchableOpacity>
                    )
                  )
                ) : (
                  <View
                    style={
                      styles.emptySearchContainer
                    }
                  >
                    <View
                      style={
                        styles.emptySearchIcon
                      }
                    >
                      <Feather
                        name="search"
                        size={25}
                        color="#7BB8E8"
                      />
                    </View>

                    <Text
                      style={
                        styles.emptySearchTitle
                      }
                    >
                      No children found
                    </Text>

                    <Text
                      style={
                        styles.emptySearchText
                      }
                    >
                      Try searching with a
                      different name.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={
            logoutModalVisible
          }
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => {
            if (!logoutLoading) {
              setLogoutModalVisible(
                false
              );
            }
          }}
        >
          <Pressable
            style={
              styles.logoutModalOverlay
            }
            onPress={() => {
              if (!logoutLoading) {
                setLogoutModalVisible(
                  false
                );
              }
            }}
          >
            <Pressable
              style={
                styles.logoutModalCard
              }
              onPress={(event) =>
                event.stopPropagation()
              }
            >
              <LinearGradient
                colors={[
                  "#EAF5FD",
                  "#FFF0F1",
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
                  styles.logoutModalIcon
                }
              >
                <Feather
                  name="log-out"
                  size={26}
                  color="#D65A59"
                />
              </LinearGradient>

              <Text
                style={
                  styles.logoutModalTitle
                }
              >
                Logout?
              </Text>

              <Text
                style={
                  styles.logoutModalDescription
                }
              >
                Are you sure you want
                to log out of your
                account?
              </Text>

              <View
                style={
                  styles.logoutModalInfo
                }
              >
                <Ionicons
                  name="information-circle-outline"
                  size={17}
                  color="#5E88A7"
                />

                <Text
                  style={
                    styles.logoutModalInfoText
                  }
                >
                  You will need to sign
                  in again to access
                  your profile and
                  child reports.
                </Text>
              </View>

              <View
                style={
                  styles.logoutModalActions
                }
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={
                    logoutLoading
                  }
                  style={
                    styles.logoutCancelButton
                  }
                  onPress={() =>
                    setLogoutModalVisible(
                      false
                    )
                  }
                >
                  <Text
                    style={
                      styles.logoutCancelText
                    }
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.88}
                  disabled={
                    logoutLoading
                  }
                  style={
                    styles.logoutConfirmWrapper
                  }
                  onPress={
                    handleLogout
                  }
                >
                  <LinearGradient
                    colors={[
                      "#F7B7BB",
                      "#F3949C",
                    ]}
                    start={{
                      x: 0,
                      y: 0,
                    }}
                    end={{
                      x: 1,
                      y: 0,
                    }}
                    style={[
                      styles.logoutConfirmButton,
                      logoutLoading &&
                        styles.logoutConfirmDisabled,
                    ]}
                  >
                    {logoutLoading ? (
                      <ActivityIndicator
                        size="small"
                        color="#FFFFFF"
                      />
                    ) : (
                      <>
                        <Feather
                          name="log-out"
                          size={16}
                          color="#FFFFFF"
                        />

                        <Text
                          style={
                            styles.logoutConfirmText
                          }
                        >
                          Logout
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },

    container: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },

    loaderBox: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    loadingText: {
      marginTop: 12,
      fontSize: 10,
      color: "#8E8E93",
    },

    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 150,
    },

    profileSection: {
      alignItems: "center",
      marginTop: 8,
    },

    avatarWrapper: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: "#F3F3F3",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 10,
    },

    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
    },

    name: {
      fontSize: 14,
      fontWeight: "700",
      color: "#222",
    },

    email: {
      marginTop: 2,
      fontSize: 9.5,
      color: "#8E8E93",
    },

    privacyBadge: {
      marginTop: 9,
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#EDF6FD",
    },

    privacyBadgeText: {
      marginLeft: 5,
      fontSize: 8.5,
      color: "#3976A4",
      fontWeight: "500",
    },

    editBtnWrapper: {
      marginTop: 12,
    },

    editBtn: {
      height: 38,
      paddingHorizontal: 22,
      borderRadius: 19,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
    },

    editBtnText: {
      marginLeft: 7,
      fontSize: 9.5,
      color: "#222",
      fontWeight: "600",
    },

    sectionTitle: {
      marginTop: 20,
      marginBottom: 8,
      fontSize: 13,
      color: "#8E8E93",
      fontWeight: "500",
    },

    card: {
      backgroundColor: "#F7F7F8",
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "#ECECEC",
    },

    row: {
      minHeight: 54,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      backgroundColor: "#F7F7F8",
    },

    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
    },

    rowText: {
      marginLeft: 12,
      fontSize: 10,
      color: "#222",
      fontWeight: "400",
    },

    rowDescription: {
      marginLeft: 12,
      marginTop: 2,
      fontSize: 8,
      color: "#9A9A9A",
    },

    divider: {
      height: 1,
      backgroundColor: "#E7E7E7",
      marginLeft: 16,
    },

    logoutBtnWrapper: {
      marginTop: 18,
      borderRadius: 18,
      shadowColor: "#D65A59",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },

    logoutBtn: {
      minHeight: 64,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#F6CFD1",
      paddingHorizontal: 13,
      flexDirection: "row",
      alignItems: "center",
    },

    logoutIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: "#FFE5E6",
      justifyContent: "center",
      alignItems: "center",
    },

    logoutContent: {
      flex: 1,
      marginLeft: 11,
    },

    logoutText: {
      color: "#C94F50",
      fontSize: 10,
      fontWeight: "700",
    },

    logoutDescription: {
      marginTop: 3,
      color: "#A97779",
      fontSize: 8.5,
    },

    logoutArrow: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor:
        "rgba(255,255,255,0.72)",
      justifyContent: "center",
      alignItems: "center",
    },

    version: {
      marginTop: 10,
      textAlign: "center",
      fontSize: 8.5,
      color: "#A0A0A0",
    },

    bottomNav: {
      position: "absolute",
      bottom: 12,
      left: 12,
      right: 12,
      height: 78,
      backgroundColor: "#FFFFFF",
      borderRadius: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-around",
      paddingHorizontal: 8,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 8,
      zIndex: 5,
    },

    navItem: {
      alignItems: "center",
      justifyContent: "center",
      width: 55,
    },

    navText: {
      fontSize: 9,
      color: "#999",
      marginTop: 4,
    },

    activeNavText: {
      color: "#222",
      fontWeight: "600",
    },

    centerButtonWrapper: {
      marginTop: -30,
    },

    centerButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 6,
    },

    overlay: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.35)",
      justifyContent: "flex-end",
    },

    bottomSheet: {
      backgroundColor: "#FFFFFF",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 30,
    },

    sheetHandle: {
      alignSelf: "center",
      width: 42,
      height: 5,
      borderRadius: 3,
      backgroundColor: "#D9D9D9",
      marginBottom: 18,
    },

    bottomSheetTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: "#222",
      marginBottom: 18,
    },

    languageOption: {
      height: 54,
      borderWidth: 1,
      borderColor: "#E5E5E5",
      borderRadius: 14,
      paddingHorizontal: 14,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    languageText: {
      fontSize: 9.5,
      color: "#222",
      fontWeight: "400",
    },

    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: "#BDBDBD",
      alignItems: "center",
      justifyContent: "center",
    },

    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#B9D8F6",
    },

    cancelLanguageButton: {
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "#E1E1E1",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 2,
    },

    cancelLanguageText: {
      fontSize: 9.5,
      color: "#555",
      fontWeight: "600",
    },

    childModalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor:
        "rgba(20,25,35,0.35)",
    },

    childPickerContainer: {
      backgroundColor: "#FFFFFF",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 28,
      maxHeight: "72%",
    },

    searchModalContainer: {
      backgroundColor: "#FFFFFF",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 28,
      height: "72%",
    },

    modalHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent:
        "space-between",
      marginBottom: 18,
    },

    modalTitleRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      paddingRight: 10,
    },

    modalAddIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: "#EDF6FD",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 11,
    },

    modalSearchIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: "#EDF6FD",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 11,
    },

    modalTitleContent: {
      flex: 1,
    },

    modalTitle: {
      fontSize: 14,
      lineHeight: 19,
      color: "#222",
      fontWeight: "700",
    },

    modalSubtitle: {
      marginTop: 4,
      fontSize: 9.5,
      lineHeight: 14,
      color: "#8A8A8A",
    },

    modalCloseButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "#F3F4F6",
      justifyContent: "center",
      alignItems: "center",
    },

    modalChildrenList: {
      maxHeight: 310,
    },

    modalChildItem: {
      minHeight: 68,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: "#EEEEEE",
      paddingHorizontal: 13,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
    },

    modalChildAvatar: {
      width: 43,
      height: 43,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },

    modalChildInfo: {
      flex: 1,
    },

    modalChildName: {
      fontSize: 11,
      fontWeight: "700",
      color: "#222",
    },

    modalChildAge: {
      marginTop: 3,
      fontSize: 8.5,
      color: "#8A8A8A",
    },

    cancelModalButton: {
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "#E1E1E1",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 9,
    },

    cancelModalText: {
      fontSize: 9.5,
      color: "#555",
      fontWeight: "600",
    },

    searchInputContainer: {
      minHeight: 48,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#E5E7EA",
      backgroundColor: "#F8F9FA",
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
    },

    searchInput: {
      flex: 1,
      height: 46,
      marginLeft: 9,
      paddingVertical: 0,
      fontSize: 10.5,
      color: "#222222",
    },

    clearSearchButton: {
      width: 30,
      height: 30,
      alignItems: "center",
      justifyContent: "center",
    },

    searchResultsList: {
      flex: 1,
    },

    searchResultsContent: {
      paddingBottom: 10,
    },

    emptySearchContainer: {
      minHeight: 230,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 25,
    },

    emptySearchIcon: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: "#EDF6FD",
      alignItems: "center",
      justifyContent: "center",
    },

    emptySearchTitle: {
      marginTop: 13,
      fontSize: 13,
      fontWeight: "700",
      color: "#222222",
    },

    emptySearchText: {
      marginTop: 6,
      fontSize: 9.5,
      lineHeight: 14,
      color: "#8A8A8A",
      textAlign: "center",
    },

    logoutModalOverlay: {
      flex: 1,
      backgroundColor:
        "rgba(27,31,36,0.48)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 26,
    },

    logoutModalCard: {
      width: "100%",
      maxWidth: 360,
      borderRadius: 24,
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 18,
      alignItems: "center",
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.16,
      shadowRadius: 18,
      elevation: 10,
    },

    logoutModalIcon: {
      width: 62,
      height: 62,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 14,
    },

    logoutModalTitle: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "700",
      color: "#25292D",
    },

    logoutModalDescription: {
      marginTop: 7,
      paddingHorizontal: 12,
      fontSize: 10,
      lineHeight: 15,
      color: "#72787E",
      textAlign: "center",
    },

    logoutModalInfo: {
      width: "100%",
      borderRadius: 13,
      backgroundColor: "#EDF7FF",
      paddingHorizontal: 11,
      paddingVertical: 10,
      marginTop: 16,
      flexDirection: "row",
      alignItems: "flex-start",
    },

    logoutModalInfoText: {
      flex: 1,
      marginLeft: 7,
      fontSize: 8.5,
      lineHeight: 13,
      color: "#658194",
    },

    logoutModalActions: {
      width: "100%",
      flexDirection: "row",
      marginTop: 18,
      gap: 10,
    },

    logoutCancelButton: {
      flex: 1,
      height: 46,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: "#DDE2E6",
      backgroundColor: "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
    },

    logoutCancelText: {
      fontSize: 9.5,
      fontWeight: "600",
      color: "#62686E",
    },

    logoutConfirmWrapper: {
      flex: 1,
    },

    logoutConfirmButton: {
      height: 46,
      borderRadius: 23,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 7,
    },

    logoutConfirmDisabled: {
      opacity: 0.7,
    },

    logoutConfirmText: {
      fontSize: 9.5,
      fontWeight: "700",
      color: "#FFFFFF",
    },
  });