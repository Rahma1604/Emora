import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Feather,
  Ionicons,
} from "@expo/vector-icons";
import API from "../api";

type ActivityItem = {
  id: string;
  childId: string;
  childName: string;
  childAge: number;
  date: string;
  type: string;
  emotion: string;
  description: string;
  status:
    | "Pending Review"
    | "Reviewed"
    | "Closed";
  avatarColor: string;
};

type Child = {
  _id: string;
  name: string;
  age: number;
  gender?: string;
};

const STATIC_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    childId: "lily-1",
    childName: "Lily",
    childAge: 5,
    date: "May 12, 2026",
    type: "Text Entry",
    emotion: "Anxiety",
    description:
      "The results indicate mild anxiety indicators related to the school environment. It is recommended to monitor sleep patterns during the upcoming week.",
    status: "Pending Review",
    avatarColor: "#FBC0BF",
  },
  {
    id: "2",
    childId: "samy-1",
    childName: "Samy",
    childAge: 7,
    date: "May 14, 2026",
    type: "Text Entry",
    emotion: "Calm",
    description:
      "The results show gradual improvement in the overall emotional state, with a noticeable increase in focus and calmness during group activities.",
    status: "Reviewed",
    avatarColor: "#B9D8F6",
  },
  {
    id: "3",
    childId: "samy-1",
    childName: "Samy",
    childAge: 7,
    date: "May 3, 2026",
    type: "Text Entry",
    emotion: "Stress",
    description:
      "The analysis indicates a decrease in stress-related indicators, with improved emotional responses during daily interactions and activities.",
    status: "Closed",
    avatarColor: "#B9D8F6",
  },
];

const STATUS_COLORS: Record<
  ActivityItem["status"],
  string
> = {
  "Pending Review": "#FBC0BF",
  Reviewed: "#B8F0C8",
  Closed: "#D0D8F0",
};

const STATUS_TEXT_COLORS: Record<
  ActivityItem["status"],
  string
> = {
  "Pending Review": "#C0504D",
  Reviewed: "#2E7D32",
  Closed: "#5C6BC0",
};

const FILTERS = [
  "All Children",
  "All Statuses",
  "Last 30 Days",
];

export default function ActivityHistory() {
  const [
    activeFilter,
    setActiveFilter,
  ] = useState("All Children");

  const [
    children,
    setChildren,
  ] = useState<Child[]>([]);

  const [
    childrenLoading,
    setChildrenLoading,
  ] = useState(true);

  const [
    childrenError,
    setChildrenError,
  ] = useState("");

  const [
    showEntryChildPicker,
    setShowEntryChildPicker,
  ] = useState(false);

  const [
    showSearchModal,
    setShowSearchModal,
  ] = useState(false);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  useEffect(() => {
    fetchChildren();
  }, []);

  const filteredChildren = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .toLowerCase();

    if (!normalizedQuery) {
      return children;
    }

    return children.filter((child) =>
      child.name
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [children, searchQuery]);

  const fetchChildren = async () => {
    try {
      setChildrenLoading(true);
      setChildrenError("");

      const response = await API.get(
        "/children/all"
      );

      const childrenData = Array.isArray(
        response.data
      )
        ? response.data
        : response.data?.children || [];

      setChildren(childrenData);
    } catch (error: any) {
      const message =
        error?.response?.data?.msg ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to load children";

      setChildrenError(message);

      console.log(
        "Activity history children error:",
        error?.response?.data ||
          error?.message
      );
    } finally {
      setChildrenLoading(false);
    }
  };

  const openActivityDetails = (
    item: ActivityItem
  ) => {
    router.push(
      {
        pathname:
          "/parent/activity-details",
        params: {
          activityId: item.id,
          childId: item.childId,
          childName: item.childName,
          childAge: String(
            item.childAge
          ),
          date: item.date,
          type: item.type,
          emotion: item.emotion,
          description:
            item.description,
          status: item.status,
          entryCount: String(
            STATIC_ACTIVITIES.filter(
              (activity) =>
                activity.childId ===
                item.childId
            ).length
          ),
        },
      } as any
    );
  };

  const openAddEntryForChild = (
    child: Child
  ) => {
    setShowEntryChildPicker(false);

    router.push(
      {
        pathname: "/parent/ai-chat",
        params: {
          childId: child._id,
          childName: child.name,
          childAge: String(child.age),
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
          childAge: String(child.age),
        },
      } as any
    );
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

  const handleAddEntryPress = () => {
    if (childrenLoading) {
      return;
    }

    if (childrenError) {
      showChildrenLoadingError();
      return;
    }

    if (children.length === 0) {
      showAddChildAlert(
        "You need to add a child profile before adding an entry."
      );

      return;
    }

    if (children.length === 1) {
      openAddEntryForChild(
        children[0]
      );

      return;
    }

    setShowEntryChildPicker(true);
  };

  const handleSearchPress = () => {
    if (childrenLoading) {
      return;
    }

    if (childrenError) {
      showChildrenLoadingError();
      return;
    }

    if (children.length === 0) {
      showAddChildAlert(
        "You need to add a child profile before searching."
      );

      return;
    }

    setSearchQuery("");
    setShowSearchModal(true);
  };

  const getChildIcon = (
    child: Child
  ) => {
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

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View style={styles.container}>
        {/* Background Gradient */}
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
              StyleSheet.absoluteFillObject
            }
          />

          <LinearGradient
            colors={[
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.6)",
              "rgba(255,255,255,1)",
            ]}
            locations={[
              0,
              0.6,
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
              StyleSheet.absoluteFillObject
            }
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text
            style={styles.headerTitle}
          >
            Activity History
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            Track All Previous Analyses And
            Updates
          </Text>
        </View>

        {/* Filter Tabs */}
        <View
          style={styles.filterRow}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              activeOpacity={0.7}
              onPress={() =>
                setActiveFilter(filter)
              }
              style={styles.filterTab}
            >
              <Text
                style={[
                  styles.filterText,

                  activeFilter ===
                    filter &&
                    styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>

              {activeFilter ===
              filter ? (
                <View
                  style={
                    styles.filterUnderline
                  }
                />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        {/* Activity List */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={
            styles.listContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {STATIC_ACTIVITIES.map(
            (item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.88}
                style={styles.card}
                onPress={() =>
                  openActivityDetails(
                    item
                  )
                }
              >
                {/* Card Header */}
                <View
                  style={
                    styles.cardHeader
                  }
                >
                  <View
                    style={
                      styles.cardLeft
                    }
                  >
                    <View
                      style={[
                        styles.avatar,
                        {
                          backgroundColor:
                            item.avatarColor,
                        },
                      ]}
                    >
                      <Ionicons
                        name="happy"
                        size={22}
                        color="#FFFFFF"
                      />
                    </View>

                    <View>
                      <Text
                        style={
                          styles.childName
                        }
                      >
                        {item.childName}
                      </Text>

                      <Text
                        style={
                          styles.dateText
                        }
                      >
                        {item.date}
                      </Text>
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          STATUS_COLORS[
                            item.status
                          ] + "55",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            STATUS_TEXT_COLORS[
                              item.status
                            ],
                        },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Type and Emotion */}
                <Text
                  style={styles.typeText}
                >
                  {item.type} ·{" "}
                  <Text
                    style={
                      styles.emotionText
                    }
                  >
                    {item.emotion}
                  </Text>
                </Text>

                {/* Description */}
                <Text
                  style={styles.descText}
                >
                  {item.description}
                </Text>

                <View
                  style={
                    styles.cardFooter
                  }
                >
                  <Text
                    style={
                      styles.viewDetailsText
                    }
                  >
                    View Details
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color="#7BB8E8"
                  />
                </View>
              </TouchableOpacity>
            )
          )}

          <View
            style={
              styles.listBottomSpace
            }
          />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.navItem}
            onPress={() =>
              router.push(
                "/parent/parentHome"
              )
            }
          >
            <Feather
              name="home"
              size={20}
              color="#999"
            />

            <Text style={styles.navText}>
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.navItem}
          >
            <Feather
              name="list"
              size={20}
              color="#222"
            />

            <Text
              style={[
                styles.navText,
                styles.activeNavText,
              ]}
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
            disabled={childrenLoading}
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
            onPress={handleSearchPress}
            disabled={childrenLoading}
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

            <Text style={styles.navText}>
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

            <Text style={styles.navText}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add Entry Child Selection Modal */}
        <Modal
          visible={showEntryChildPicker}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setShowEntryChildPicker(
              false
            )
          }
        >
          <View
            style={styles.modalOverlay}
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
                style={styles.modalHandle}
              />

              <View
                style={styles.modalHeader}
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
                      Select a child to add a
                      new emotional update.
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
                  (child, index) => (
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
                              index % 2 ===
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
                          {child.age} years old
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

        {/* Search Children Modal */}
        <Modal
          visible={showSearchModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowSearchModal(false);
            setSearchQuery("");
          }}
        >
          <View
            style={styles.modalOverlay}
          >
            <Pressable
              style={
                StyleSheet.absoluteFillObject
              }
              onPress={() => {
                setShowSearchModal(
                  false
                );
                setSearchQuery("");
              }}
            />

            <View
              style={
                styles.searchModalContainer
              }
            >
              <View
                style={styles.modalHandle}
              />

              <View
                style={styles.modalHeader}
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
                      Search by name to open a
                      child profile.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowSearchModal(
                      false
                    );
                    setSearchQuery("");
                  }}
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
                  style={styles.searchInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="search"
                />

                {searchQuery.length > 0 ? (
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
                    (child, index) => (
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
                                index % 2 ===
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  topGradientWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    overflow: "hidden",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    zIndex: 2,
  },

  headerTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 10.5,
    lineHeight: 16,
    color: "#9A9A9A",
  },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    zIndex: 2,
    gap: 20,
  },

  filterTab: {
    alignItems: "center",
    paddingBottom: 6,
  },

  filterText: {
    fontSize: 9.5,
    color: "#9A9A9A",
    fontWeight: "500",
  },

  filterTextActive: {
    color: "#222",
    fontWeight: "600",
  },

  filterUnderline: {
    marginTop: 4,
    height: 2,
    width: "100%",
    backgroundColor: "#FBC0BF",
    borderRadius: 2,
  },

  list: {
    flex: 1,
    paddingHorizontal: 16,
  },

  listContent: {
    paddingTop: 4,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },

  childName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },

  dateText: {
    fontSize: 8.5,
    color: "#9A9A9A",
    marginTop: 2,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 7.5,
    fontWeight: "500",
  },

  typeText: {
    fontSize: 9.5,
    color: "#7BB8E8",
    fontWeight: "500",
    marginBottom: 8,
  },

  emotionText: {
    color: "#7BB8E8",
  },

  descText: {
    fontSize: 9.5,
    color: "#555",
    lineHeight: 14,
  },

  cardFooter: {
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },

  viewDetailsText: {
    fontSize: 8.5,
    fontWeight: "600",
    color: "#7BB8E8",
  },

  listBottomSpace: {
    height: 110,
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
    justifyContent: "space-around",
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

  searchModalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    height: "72%",
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
    justifyContent: "space-between",
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
});