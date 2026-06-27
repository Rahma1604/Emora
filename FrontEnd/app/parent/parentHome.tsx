
import React, {
  useCallback,
  useState,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import {
  SafeAreaView,
} from "react-native-safe-area-context";
import {
  LinearGradient,
} from "expo-linear-gradient";
import {
  router,
  useFocusEffect,
  type Href,
} from "expo-router";
import {
  Ionicons,
  Feather,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import API from "../api";

type Child = {
  _id: string;
  name: string;
  age: number;
  gender: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  parentId?: string;
};

type ChildCardData = {
  status: string;
  description: string;
  lastUpdated: string;
  color: string;
};

type StoredNotification = {
  id?: string;
  read?: boolean;
  [key: string]: any;
};

type ApiErrorData = {
  message?: string;
  msg?: string;
  error?: string;
};

const NOTIFICATIONS_STORAGE_KEY =
  "parent_notifications";

function formatDate(
  dateValue?: string
): string {
  if (!dateValue) {
    return "Recently added";
  }

  const date = new Date(
    dateValue
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Recently added";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function getChildCardData(
  child: Child,
  index: number
): ChildCardData {
  const cards: Omit<
    ChildCardData,
    "description" | "lastUpdated"
  >[] = [
    {
      status: "New Profile",
      color: "#FBC0BF",
    },
    {
      status: "New Profile",
      color: "#B9D8F6",
    },
    {
      status: "New Profile",
      color: "#DDF5E5",
    },
    {
      status: "New Profile",
      color: "#F7D9EF",
    },
  ];

  const selectedCard =
    cards[index % cards.length];

  return {
    ...selectedCard,

    description:
      child.notes?.trim() ||
      "Child profile is ready. Add a new entry to start tracking progress.",

    lastUpdated:
      formatDate(
        child.createdAt
      ),
  };
}

export default function Home() {
  const [
    children,
    setChildren,
  ] = useState<Child[]>([]);

  const [
    userName,
    setUserName,
  ] = useState("User");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    showSearchModal,
    setShowSearchModal,
  ] = useState(false);

  const [
    showEntryChildPicker,
    setShowEntryChildPicker,
  ] = useState(false);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    unreadNotifications,
    setUnreadNotifications,
  ] = useState(0);

  const fetchUnreadNotifications =
    async () => {
      try {
        const savedNotifications =
          await AsyncStorage.getItem(
            NOTIFICATIONS_STORAGE_KEY
          );

        if (!savedNotifications) {
          setUnreadNotifications(0);
          return;
        }

        const parsedNotifications =
          JSON.parse(
            savedNotifications
          );

        if (
          !Array.isArray(
            parsedNotifications
          )
        ) {
          setUnreadNotifications(0);
          return;
        }

        const unreadCount =
          (
            parsedNotifications as StoredNotification[]
          ).filter(
            (notification) =>
              notification.read !== true
          ).length;

        setUnreadNotifications(
          unreadCount
        );
      } catch (
        notificationError
      ) {
        console.log(
          "Home notifications error:",
          notificationError
        );

        setUnreadNotifications(0);
      }
    };

  const logoutExpiredSession =
    async () => {
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

      setChildren([]);

      router.replace(
        "/auth/login" as Href
      );
    };

  const fetchHomeData =
    async () => {
      try {
        setLoading(true);
        setError("");

        const storedValues =
          await AsyncStorage.multiGet([
            "user",
            "token",
          ]);

        const savedUser =
          storedValues[0][1];

        const token =
          storedValues[1][1];

        if (savedUser) {
          try {
            const user =
              JSON.parse(
                savedUser
              );

            setUserName(
              user?.fullName ||
                user?.name ||
                user?.username ||
                "User"
            );
          } catch (
            userParseError
          ) {
            console.log(
              "Failed to parse saved user:",
              userParseError
            );

            setUserName("User");
          }
        } else {
          setUserName("User");
        }

        if (!token) {
          await logoutExpiredSession();
          return;
        }

        const response =
          await API.get(
            "/children/all",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        console.log(
          "PARENT CHILDREN:",
          response.data
        );

        const childrenData =
          Array.isArray(
            response.data
          )
            ? response.data
            : response.data
                ?.children;

        if (
          Array.isArray(
            childrenData
          )
        ) {
          setChildren(
            childrenData
          );
        } else {
          setChildren([]);
        }
      } catch (
        fetchError
      ) {
        console.log(
          "PARENT HOME FETCH ERROR:",
          fetchError
        );

        if (
          axios.isAxiosError(
            fetchError
          )
        ) {
          const status =
            fetchError.response
              ?.status;

          const responseData =
            fetchError.response
              ?.data as
              | ApiErrorData
              | undefined;

          const message =
            responseData
              ?.message ||
            responseData?.msg ||
            responseData
              ?.error ||
            "Failed to load child profiles.";

          const normalizedMessage =
            String(message)
              .toLowerCase();

          const invalidSession =
            status === 401 ||
            (
              status === 400 &&
              (
                normalizedMessage.includes(
                  "invalid token"
                ) ||
                normalizedMessage.includes(
                  "expired token"
                ) ||
                normalizedMessage.includes(
                  "login first"
                )
              )
            );

          if (invalidSession) {
            await logoutExpiredSession();
            return;
          }

          setChildren([]);
          setError(message);
        } else {
          setChildren([]);

          setError(
            fetchError instanceof
              Error
              ? fetchError.message
              : "Failed to load child profiles."
          );
        }
      } finally {
        setLoading(false);
      }
    };

  useFocusEffect(
    useCallback(() => {
      fetchHomeData();
      fetchUnreadNotifications();
    }, [])
  );

  const openChildProfile = (
    child: Child
  ) => {
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

          childGender:
            child.gender,

          childNotes:
            child.notes || "",
        },
      } as any
    );
  };

  const openAddEntry = (
    child: Child
  ) => {
    setShowEntryChildPicker(
      false
    );

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

  const handleNotificationsPress =
    () => {
      router.push(
        "/parent/notifications"
      );
    };

  const handleSearchPress =
    () => {
      if (loading) {
        return;
      }

      if (
        children.length === 0
      ) {
        Alert.alert(
          "No children found",
          "Add a child profile before searching.",
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

        return;
      }

      setSearchQuery("");
      setShowSearchModal(true);
    };

  const handleCenterAddEntryPress =
    () => {
      if (loading) {
        return;
      }

      if (
        children.length === 0
      ) {
        Alert.alert(
          "Add a child first",
          "You need to add a child profile before adding an entry.",
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

        return;
      }

      if (
        children.length === 1
      ) {
        openAddEntry(
          children[0]
        );

        return;
      }

      setShowEntryChildPicker(
        true
      );
    };

  const filteredChildren =
    children.filter(
      (child) =>
        child.name
          .toLowerCase()
          .includes(
            searchQuery
              .trim()
              .toLowerCase()
          )
    );

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View
        style={styles.container}
      >
        <View
          style={
            styles.topGradientWrapper
          }
        >
          <LinearGradient
            colors={[
              "rgba(185,216,246,0.35)",
              "rgba(255,255,255,0.10)",
              "rgba(251,192,191,0.35)",
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
              y: 0,
            }}
            style={
              styles.topHorizontalGradient
            }
          />

          <LinearGradient
            colors={[
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.45)",
              "rgba(255,255,255,0.82)",
              "rgba(255,255,255,1)",
            ]}
            locations={[
              0,
              0.45,
              0.75,
              1,
            ]}
            start={{
              x: 0,
              y: 0,
            }}
            end={{
              x: 0,
              y: 1,
            }}
            style={
              styles.topFadeGradient
            }
          />
        </View>

        <Image
          source={require("../../assets/images/images/flower.png")}
          style={
            styles.flowerTopRight
          }
          resizeMode="contain"
        />

        <View
          style={styles.header}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            style={
              styles.headerLeft
            }
            onPress={() =>
              router.push(
                "/parent/profile"
              )
            }
          >
            <Image
              source={require("../../assets/images/images/image 119.png")}
              style={
                styles.profileImage
              }
            />

            <View>
              <Text
                style={
                  styles.welcomeText
                }
              >
                Welcome 👋
              </Text>

              <Text
                style={
                  styles.userName
                }
              >
                {userName}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={
              styles.notificationButton
            }
            onPress={
              handleNotificationsPress
            }
          >
            <Feather
              name="bell"
              size={22}
              color="#222"
            />

            {unreadNotifications >
            0 ? (
              <View
                style={
                  styles.notificationBadge
                }
              >
                <Text
                  style={
                    styles.notificationBadgeText
                  }
                >
                  {unreadNotifications >
                  99
                    ? "99+"
                    : unreadNotifications}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <View
          style={styles.content}
        >
          {loading ? (
            <View
              style={
                styles.centerState
              }
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
                Loading your children...
              </Text>
            </View>
          ) : error ? (
            <View
              style={
                styles.centerState
              }
            >
              <View
                style={
                  styles.errorIcon
                }
              >
                <Feather
                  name="alert-circle"
                  size={28}
                  color="#EF4444"
                />
              </View>

              <Text
                style={
                  styles.errorTitle
                }
              >
                Something went wrong
              </Text>

              <Text
                style={
                  styles.errorText
                }
              >
                {error}
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={
                  fetchHomeData
                }
                style={
                  styles.retryButton
                }
              >
                <Text
                  style={
                    styles.retryButtonText
                  }
                >
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          ) : children.length ===
            0 ? (
            <View
              style={
                styles.emptyStateContainer
              }
            >
              <Image
                source={require("../../assets/images/images/child.png")}
                style={
                  styles.childImage
                }
                resizeMode="contain"
              />

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Add your first child
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Add your first child
                profile to start tracking
                their emotional progress
                and receive personalized
                support.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  router.push(
                    "/parent/add-child"
                  )
                }
                style={
                  styles.buttonWrapper
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
                    styles.addButton
                  }
                >
                  <Ionicons
                    name="person-add-outline"
                    size={19}
                    color="#222"
                  />

                  <Text
                    style={
                      styles.addButtonText
                    }
                  >
                    Add Your First Child
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={
                styles.childrenList
              }
              contentContainerStyle={
                styles.childrenListContent
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              <Text
                style={
                  styles.greetingLarge
                }
              >
                Everything is{" "}
                <Text
                  style={
                    styles.greetingHighlight
                  }
                >
                  Serene
                </Text>{" "}
                at{"\n"}Home
              </Text>

              <View
                style={
                  styles.sectionHeader
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Your Children
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push(
                      "/parent/add-child"
                    )
                  }
                  style={
                    styles.smallAddChildButton
                  }
                >
                  <Ionicons
                    name="add"
                    size={17}
                    color="#4C8DBF"
                  />

                  <Text
                    style={
                      styles.smallAddChildText
                    }
                  >
                    Add Child
                  </Text>
                </TouchableOpacity>
              </View>

              {children.map(
                (
                  child,
                  index
                ) => {
                  const cardData =
                    getChildCardData(
                      child,
                      index
                    );

                  return (
                    <View
                      key={
                        child._id
                      }
                      style={[
                        styles.childCard,
                        {
                          backgroundColor:
                            cardData.color,
                        },
                      ]}
                    >
                      <Image
                        source={require("../../assets/images/images/Vector (1).png")}
                        style={
                          styles.cardFlower1
                        }
                        resizeMode="contain"
                      />

                      <Image
                        source={require("../../assets/images/images/Vector (1).png")}
                        style={
                          styles.cardFlower2
                        }
                        resizeMode="contain"
                      />

                      <Image
                        source={require("../../assets/images/images/Vector (1).png")}
                        style={
                          styles.cardFlower3
                        }
                        resizeMode="contain"
                      />

                      <TouchableOpacity
                        activeOpacity={
                          0.88
                        }
                        onPress={() =>
                          openChildProfile(
                            child
                          )
                        }
                      >
                        <View
                          style={
                            styles.childCardTop
                          }
                        >
                          <View
                            style={
                              styles.statusBadge
                            }
                          >
                            <Text
                              style={
                                styles.statusText
                              }
                            >
                              {
                                cardData.status
                              }{" "}
                              ✨
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={
                            styles.childCardName
                          }
                        >
                          {child.name}{" "}
                          <Text
                            style={
                              styles.childCardAge
                            }
                          >
                            (
                            {
                              child.age
                            }{" "}
                            years old)
                          </Text>
                        </Text>

                        <Text
                          style={
                            styles.childCardDesc
                          }
                          numberOfLines={
                            2
                          }
                        >
                          {
                            cardData.description
                          }
                        </Text>

                        <Text
                          style={
                            styles.childCardDate
                          }
                        >
                          Added:{" "}
                          {
                            cardData.lastUpdated
                          }
                        </Text>
                      </TouchableOpacity>

                      <View
                        style={
                          styles.childCardActions
                        }
                      >
                        <TouchableOpacity
                          activeOpacity={
                            0.8
                          }
                          onPress={() =>
                            openAddEntry(
                              child
                            )
                          }
                          style={
                            styles.aiActionButton
                          }
                        >
                          <Ionicons
                            name="add-circle-outline"
                            size={17}
                            color="#222"
                          />

                          <Text
                            style={
                              styles.aiActionText
                            }
                          >
                            Add Entry
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={
                            0.8
                          }
                          onPress={() =>
                            openChildProfile(
                              child
                            )
                          }
                          style={
                            styles.profileActionButton
                          }
                        >
                          <Text
                            style={
                              styles.profileActionText
                            }
                          >
                            View Profile
                          </Text>

                          <Ionicons
                            name="arrow-forward"
                            size={17}
                            color="#222"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }
              )}

              <View
                style={
                  styles.scrollBottomSpace
                }
              />
            </ScrollView>
          )}
        </View>

        <View
          style={styles.bottomNav}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.navItem}
          >
            <Feather
              name="home"
              size={20}
              color="#222"
            />

            <Text
              style={[
                styles.navText,
                styles.activeNavText,
              ]}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.navItem}
            onPress={() =>
              router.push(
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
              style={
                styles.navText
              }
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
              handleCenterAddEntryPress
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
              <Ionicons
                name="add"
                size={28}
                color="#FFFFFF"
              />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.navItem}
            onPress={
              handleSearchPress
            }
          >
            <Feather
              name="search"
              size={20}
              color="#999"
            />

            <Text
              style={
                styles.navText
              }
            >
              Search
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.navItem}
            onPress={() =>
              router.push(
                "/parent/profile"
              )
            }
          >
            <Feather
              name="user"
              size={20}
              color="#999"
            />

            <Text
              style={
                styles.navText
              }
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={
            showSearchModal
          }
          transparent
          animationType="fade"
          onRequestClose={() =>
            setShowSearchModal(
              false
            )
          }
        >
          <View
            style={
              styles.modalOverlay
            }
          >
            <Pressable
              style={
                StyleSheet.absoluteFillObject
              }
              onPress={() =>
                setShowSearchModal(
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
                  styles.modalHandle
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
                      styles.modalAIIcon
                    }
                  >
                    <Feather
                      name="search"
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
                      Search for a child
                    </Text>

                    <Text
                      style={
                        styles.modalSubtitle
                      }
                    >
                      Enter the child's
                      name to open their
                      profile.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    setShowSearchModal(
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

              <View
                style={
                  styles.searchInputContainer
                }
              >
                <Feather
                  name="search"
                  size={18}
                  color="#999"
                />

                <TextInput
                  value={
                    searchQuery
                  }
                  onChangeText={
                    setSearchQuery
                  }
                  placeholder="Search by child name"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={
                    styles.searchInput
                  }
                />

                {searchQuery.length >
                0 ? (
                  <TouchableOpacity
                    activeOpacity={
                      0.7
                    }
                    onPress={() =>
                      setSearchQuery(
                        ""
                      )
                    }
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color="#999"
                    />
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView
                style={
                  styles.modalChildrenList
                }
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={
                  false
                }
              >
                {filteredChildren.length >
                0 ? (
                  filteredChildren.map(
                    (
                      child,
                      index
                    ) => (
                      <TouchableOpacity
                        key={
                          child._id
                        }
                        activeOpacity={
                          0.8
                        }
                        onPress={() => {
                          setShowSearchModal(
                            false
                          );

                          openChildProfile(
                            child
                          );
                        }}
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
                            name={
                              child.gender?.toLowerCase() ===
                              "female"
                                ? "female"
                                : child.gender?.toLowerCase() ===
                                  "male"
                                ? "male"
                                : "happy-outline"
                            }
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
                            {
                              child.name
                            }
                          </Text>

                          <Text
                            style={
                              styles.modalChildAge
                            }
                          >
                            {
                              child.age
                            }{" "}
                            years old
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
                      styles.noSearchResults
                    }
                  >
                    <Feather
                      name="search"
                      size={26}
                      color="#999"
                    />

                    <Text
                      style={
                        styles.noSearchResultsText
                      }
                    >
                      No child found with
                      this name.
                    </Text>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  setShowSearchModal(
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
              styles.modalOverlay
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
                  styles.modalHandle
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
                      styles.modalAIIcon
                    }
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={21}
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
                      Who would you like
                      to add an entry for?
                    </Text>

                    <Text
                      style={
                        styles.modalSubtitle
                      }
                    >
                      Select a child to
                      create a new entry.
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
                      key={
                        child._id
                      }
                      activeOpacity={
                        0.8
                      }
                      onPress={() =>
                        openAddEntry(
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
                          name={
                            child.gender?.toLowerCase() ===
                            "female"
                              ? "female"
                              : child.gender?.toLowerCase() ===
                                "male"
                              ? "male"
                              : "happy-outline"
                          }
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
                          {
                            child.name
                          }
                        </Text>

                        <Text
                          style={
                            styles.modalChildAge
                          }
                        >
                          {
                            child.age
                          }{" "}
                          years old
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
      paddingHorizontal: 16,
      paddingTop: 10,
    },

    topGradientWrapper: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 200,
      overflow: "hidden",
    },

    topHorizontalGradient: {
      ...StyleSheet.absoluteFillObject,
    },

    topFadeGradient: {
      ...StyleSheet.absoluteFillObject,
    },

    flowerTopRight: {
      position: "absolute",
      top: 60,
      right: -10,
      width: 120,
      height: 120,
      opacity: 0.15,
      zIndex: 0,
      tintColor: "#B9D8F6",
    },

    header: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginTop: 8,
      zIndex: 2,
      paddingHorizontal: 6,
    },

    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },

    profileImage: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 10,
    },

    welcomeText: {
      fontSize: 10,
      fontWeight: "500",
      color: "#222",
      lineHeight: 14,
    },

    userName: {
      fontSize: 11,
      fontWeight: "600",
      color: "#222",
      lineHeight: 15,
    },

    notificationButton: {
      position: "relative",
      padding: 6,
    },

    notificationBadge: {
      position: "absolute",
      top: -2,
      right: -3,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 4,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F59CA3",
      borderWidth: 1.5,
      borderColor: "#FFFFFF",
    },

    notificationBadgeText: {
      fontSize: 7,
      lineHeight: 9,
      fontWeight: "700",
      color: "#FFFFFF",
    },

    content: {
      flex: 1,
      paddingBottom: 82,
      zIndex: 2,
    },

    centerState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 30,
    },

    loadingText: {
      marginTop: 12,
      color: "#8A8A8A",
      fontSize: 10,
    },

    errorIcon: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: "#FFF1F1",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 14,
    },

    errorTitle: {
      color: "#222",
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 7,
    },

    errorText: {
      color: "#8A8A8A",
      fontSize: 10.5,
      textAlign: "center",
      lineHeight: 16,
    },

    retryButton: {
      marginTop: 18,
      minWidth: 120,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#B9D8F6",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 22,
    },

    retryButtonText: {
      color: "#222",
      fontSize: 9.5,
      fontWeight: "600",
    },

    emptyStateContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    childImage: {
      width: 220,
      height: 220,
      marginBottom: 12,
    },

    emptyTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: "#222",
      marginBottom: 8,
    },

    emptyText: {
      fontSize: 10.5,
      color: "#9A9A9A",
      textAlign: "center",
      lineHeight: 16,
      paddingHorizontal: 22,
    },

    buttonWrapper: {
      width: "100%",
      marginTop: 26,
      paddingHorizontal: 28,
    },

    addButton: {
      height: 54,
      borderRadius: 27,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 9,
    },

    addButtonText: {
      color: "#222",
      fontSize: 10,
      fontWeight: "600",
    },

    childrenList: {
      width: "100%",
    },

    childrenListContent: {
      paddingTop: 20,
      paddingBottom: 20,
    },

    greetingLarge: {
      fontSize: 20,
      fontWeight: "600",
      color: "#222",
      lineHeight: 26,
      marginBottom: 21,
    },

    greetingHighlight: {
      color: "#7BB8E8",
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 13,
    },

    sectionTitle: {
      fontSize: 13,
      fontWeight: "500",
      color: "#222",
    },

    smallAddChildButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingVertical: 6,
      paddingHorizontal: 9,
    },

    smallAddChildText: {
      fontSize: 9,
      color: "#4C8DBF",
      fontWeight: "600",
    },

    childCard: {
      width: "100%",
      borderRadius: 20,
      padding: 18,
      marginBottom: 16,
      overflow: "hidden",
    },

    cardFlower1: {
      position: "absolute",
      width: 60,
      height: 60,
      top: 10,
      right: 60,
      opacity: 0.2,
      tintColor: "#FFFFFF",
    },

    cardFlower2: {
      position: "absolute",
      width: 45,
      height: 45,
      bottom: 15,
      right: 20,
      opacity: 0.2,
      tintColor: "#FFFFFF",
    },

    cardFlower3: {
      position: "absolute",
      width: 35,
      height: 35,
      top: 40,
      right: 110,
      opacity: 0.15,
      tintColor: "#FFFFFF",
    },

    childCardTop: {
      marginBottom: 8,
    },

    statusBadge: {
      alignSelf: "flex-start",
      backgroundColor:
        "rgba(255,255,255,0.55)",
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },

    statusText: {
      fontSize: 7.5,
      fontWeight: "500",
      color: "#333",
    },

    childCardName: {
      fontSize: 14,
      fontWeight: "700",
      color: "#222",
      marginBottom: 6,
    },

    childCardAge: {
      fontSize: 10,
      fontWeight: "500",
      color: "#444",
    },

    childCardDesc: {
      fontSize: 9.5,
      color: "#444",
      lineHeight: 14,
      marginBottom: 10,
    },

    childCardDate: {
      fontSize: 8.5,
      color: "#555",
      fontWeight: "500",
    },

    childCardActions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginTop: 15,
      paddingTop: 13,
      borderTopWidth: 1,
      borderTopColor:
        "rgba(255,255,255,0.45)",
      gap: 10,
    },

    aiActionButton: {
      flex: 1,
      minHeight: 39,
      borderRadius: 20,
      backgroundColor:
        "rgba(255,255,255,0.72)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 10,
    },

    aiActionText: {
      fontSize: 9.5,
      color: "#222",
      fontWeight: "600",
    },

    profileActionButton: {
      flex: 1,
      minHeight: 39,
      borderRadius: 20,
      backgroundColor:
        "rgba(255,255,255,0.45)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 10,
    },

    profileActionText: {
      fontSize: 9.5,
      color: "#222",
      fontWeight: "600",
    },

    scrollBottomSpace: {
      height: 100,
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
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 8,
      paddingHorizontal: 8,
      zIndex: 3,
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

    modalOverlay: {
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

    modalHandle: {
      alignSelf: "center",
      width: 42,
      height: 5,
      borderRadius: 3,
      backgroundColor: "#D9D9D9",
      marginBottom: 20,
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

    modalAIIcon: {
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

    searchInputContainer: {
      minHeight: 48,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: "#EEEEEE",
      paddingHorizontal: 13,
      marginBottom: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },

    searchInput: {
      flex: 1,
      fontSize: 10,
      color: "#222",
      paddingVertical: 0,
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

    noSearchResults: {
      minHeight: 130,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },

    noSearchResultsText: {
      marginTop: 9,
      fontSize: 9.5,
      lineHeight: 14,
      color: "#8A8A8A",
      textAlign: "center",
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
      fontSize: 10,
      color: "#555",
      fontWeight: "600",
    },
  });

