import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, type Href } from "expo-router";

const girlPhoto = require("../../assets/images/images/girl.png");
const boyPhoto = require("../../assets/images/images/boy.png");

type CaseStatus = "Pending" | "Reviewed" | "Closed";

type FilterType =
  | "All Cases"
  | CaseStatus;

type IoniconName =
  keyof typeof Ionicons.glyphMap;

type HistoryCase = {
  name: string;
  childId: string;
  date: string;
  emotion: string;
  description: string;
  status: CaseStatus;
  avatar: number;
};

type Recommendation = {
  childName: string;
  childId: string;
  date: string;
  description: string;
};

type BottomNavItemProps = {
  icon: IoniconName;
  activeIcon: IoniconName;
  label: string;
  active?: boolean;
  onPress: () => void;
};

const filters: FilterType[] = [
  "All Cases",
  "Pending",
  "Reviewed",
  "Closed",
];

const historyCases: HistoryCase[] = [
  {
    name: "Lily",
    childId: "#1045",
    date: "May 12, 2026",
    emotion: "Anxiety Indicators",
    description:
      "The child has recently shown signs of anxiety before going to school and appears worried during social interactions.",
    status: "Pending",
    avatar: girlPhoto,
  },
  {
    name: "Sammy",
    childId: "#11045",
    date: "May 8, 2026",
    emotion: "Calm",
    description:
      "The child has recently shown improvement in emotional stability and daily behavioral responses.",
    status: "Reviewed",
    avatar: boyPhoto,
  },
  {
    name: "Adam",
    childId: "#1072",
    date: "May 3, 2026",
    emotion: "Stress",
    description:
      "The child has recently shown signs of emotional stress during school attendance and group activities.",
    status: "Closed",
    avatar: boyPhoto,
  },
];

const recommendations: Recommendation[] = [
  {
    childName: "Lily",
    childId: "#1045",
    date: "May 10, 2026",
    description:
      "Continue monitoring school-related stress levels and maintain a consistent sleep diary for the next 14 days.",
  },
  {
    childName: "Lily",
    childId: "#1045",
    date: "April 28, 2026",
    description:
      "Encourage structured social activities in low-pressure environments to build confidence and interpersonal resilience.",
  },
];

export default function DoctorHistoryScreen() {
  const [searchText, setSearchText] =
    useState("");

  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState<FilterType>("All Cases");

  const filteredCases = useMemo(() => {
    const cleanSearch =
      searchText.trim().toLowerCase();

    return historyCases.filter((item) => {
      const matchesFilter =
        selectedFilter === "All Cases" ||
        item.status === selectedFilter;

      const matchesSearch =
        !cleanSearch ||
        item.name
          .toLowerCase()
          .includes(cleanSearch) ||
        item.childId
          .toLowerCase()
          .includes(cleanSearch) ||
        item.emotion
          .toLowerCase()
          .includes(cleanSearch) ||
        item.description
          .toLowerCase()
          .includes(cleanSearch);

      return matchesFilter && matchesSearch;
    });
  }, [searchText, selectedFilter]);

  const handleOpenCase = (
    item: HistoryCase
  ) => {
    router.push(
      `/doctor/review-case?child=${encodeURIComponent(
        item.name
      )}&childId=${encodeURIComponent(
        item.childId
      )}` as Href
    );
  };

  /*
    يفتح الصفحة الجديدة التي تعرض
    كل توصيات الدكتور لكل الأطفال.
  */
  const handleViewAllRecommendations =
    () => {
      router.push(
        "/doctor/recommendations-history" as Href
      );
    };

  const openHome = () => {
    router.replace(
      "/doctor/home" as Href
    );
  };

  const openInsights = () => {
    router.replace(
      "/doctor/insights" as Href
    );
  };

  const openProfile = () => {
    router.replace(
      "/doctor/profile" as Href
    );
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <LinearGradient
        colors={[
          "#FFFFFF",
          "#FFF9F9",
          "#F8FCFF",
        ]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <View style={styles.mainContainer}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={
              styles.scrollContent
            }
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Page Title */}
            <Text style={styles.pageTitle}>
              History
            </Text>

            {/* Search */}
            <View
              style={
                styles.searchContainer
              }
            >
              <Ionicons
                name="search-outline"
                size={19}
                color="#A1A7AE"
              />

              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search child name, ID, emotion..."
                placeholderTextColor="#A8ADB3"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.searchInput}
              />

              {searchText.length > 0 ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    setSearchText("")
                  }
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color="#B4B8BD"
                  />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Filters */}
            <View
              style={
                styles.filtersContainer
              }
            >
              {filters.map((filter) => {
                const isSelected =
                  selectedFilter === filter;

                return (
                  <TouchableOpacity
                    key={filter}
                    activeOpacity={0.8}
                    onPress={() =>
                      setSelectedFilter(
                        filter
                      )
                    }
                    style={[
                      styles.filterButton,
                      isSelected &&
                        styles.filterButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        isSelected &&
                          styles.filterTextSelected,
                      ]}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* History Overview */}
            <Text
              style={styles.sectionTitle}
            >
              History Overview
            </Text>

            <View
              style={styles.overviewGrid}
            >
              <OverviewCard
                title="TOTAL CASES"
                value="38"
                valueColor="#2E8ED7"
              />

              <OverviewCard
                title="PENDING"
                value="12"
                valueColor="#14A84B"
                trend
              />

              <OverviewCard
                title="CLOSED"
                value="15"
                valueColor="#2E8ED7"
              />

              <OverviewCard
                title="AVG TIME"
                value="8"
                suffix="min"
                valueColor="#25292D"
              />
            </View>

            {/* Detailed Timeline */}
            <Text
              style={styles.sectionTitle}
            >
              Detailed Timeline
            </Text>

            {filteredCases.length > 0 ? (
              <View
                style={
                  styles.timelineContainer
                }
              >
                <View
                  style={styles.timelineLine}
                />

                {filteredCases.map(
                  (item, index) => (
                    <TimelineCaseCard
                      key={`${item.childId}-${item.date}`}
                      item={item}
                      index={index}
                      onPress={() =>
                        handleOpenCase(item)
                      }
                    />
                  )
                )}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View
                  style={styles.emptyIcon}
                >
                  <Ionicons
                    name="folder-open-outline"
                    size={34}
                    color="#75AFE1"
                  />
                </View>

                <Text
                  style={styles.emptyTitle}
                >
                  No cases found
                </Text>

                <Text
                  style={
                    styles.emptyDescription
                  }
                >
                  Try changing the search text
                  or the selected filter.
                </Text>
              </View>
            )}

            {/* Recommendations Header */}
            <View
              style={
                styles.recommendationsHeader
              }
            >
              <Text
                style={styles.sectionTitle}
              >
                Recent Recommendations
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={
                  handleViewAllRecommendations
                }
                style={styles.viewAllButton}
              >
                <Text
                  style={styles.viewAllText}
                >
                  VIEW ALL
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={12}
                  color="#F1A4A8"
                />
              </TouchableOpacity>
            </View>

            {/* Recent Recommendations */}
            <View
              style={
                styles.recommendationsContainer
              }
            >
              {recommendations.map(
                (item) => (
                  <RecommendationCard
                    key={`${item.childId}-${item.date}`}
                    item={item}
                  />
                )
              )}
            </View>
          </ScrollView>

          {/* Bottom Navigation */}
          <View
            style={styles.bottomNavigation}
          >
            <BottomNavItem
              icon="home-outline"
              activeIcon="home"
              label="Home"
              onPress={openHome}
            />

            <BottomNavItem
              icon="document-text-outline"
              activeIcon="document-text"
              label="History"
              active
              onPress={() => undefined}
            />

            <BottomNavItem
              icon="stats-chart-outline"
              activeIcon="stats-chart"
              label="Insights"
              onPress={openInsights}
            />

            <BottomNavItem
              icon="person-outline"
              activeIcon="person"
              label="Profile"
              onPress={openProfile}
            />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

type OverviewCardProps = {
  title: string;
  value: string;
  suffix?: string;
  valueColor: string;
  trend?: boolean;
};

function OverviewCard({
  title,
  value,
  suffix,
  valueColor,
  trend = false,
}: OverviewCardProps) {
  return (
    <View style={styles.overviewCard}>
      <Text
        style={styles.overviewCardTitle}
      >
        {title}
      </Text>

      <View
        style={styles.overviewValueRow}
      >
        <Text
          style={[
            styles.overviewValue,
            {
              color: valueColor,
            },
          ]}
        >
          {value}
        </Text>

        {trend ? (
          <Ionicons
            name="trending-down-outline"
            size={15}
            color="#EA6A70"
          />
        ) : null}

        {suffix ? (
          <Text
            style={styles.overviewSuffix}
          >
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

type TimelineCaseCardProps = {
  item: HistoryCase;
  index: number;
  onPress: () => void;
};

function TimelineCaseCard({
  item,
  index,
  onPress,
}: TimelineCaseCardProps) {
  const statusStyle =
    getStatusStyle(item.status);

  const markerColor =
    item.status === "Pending"
      ? "#F9C5C9"
      : item.status === "Reviewed"
        ? "#B8DCF8"
        : "#C7CBD1";

  const buttonColors: readonly [
    string,
    string,
  ] =
    item.status === "Closed"
      ? ["#E8EAEC", "#D9DBDE"]
      : ["#A6D2F6", "#F5ADB1"];

  const buttonText =
    item.status === "Pending"
      ? "Review Case"
      : "View Case";

  return (
    <View style={styles.timelineItem}>
      <View
        style={[
          styles.timelineMarker,
          {
            backgroundColor:
              markerColor,
          },
        ]}
      />

      <View style={styles.caseCard}>
        <View
          style={styles.caseDecoration}
        />

        <View style={styles.caseHeader}>
          <View style={styles.childInfo}>
            <View
              style={styles.avatarWrapper}
            >
              <Image
                source={item.avatar}
                style={styles.avatar}
                contentFit="cover"
                transition={150}
              />
            </View>

            <View
              style={
                styles.childTextContainer
              }
            >
              <Text
                style={styles.childName}
              >
                {item.name}
              </Text>

              <Text
                style={styles.caseDate}
              >
                {item.date}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  statusStyle.backgroundColor,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    statusStyle.textColor,
                },
              ]}
            >
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <Text style={styles.emotionText}>
          {item.emotion}
        </Text>

        <Text
          style={styles.caseDescription}
        >
          {item.description}
        </Text>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          style={
            styles.viewCaseButtonWrapper
          }
        >
          <LinearGradient
            colors={buttonColors}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.viewCaseButton}
          >
            <Text
              style={[
                styles.viewCaseButtonText,
                item.status === "Closed" &&
                  styles.closedButtonText,
              ]}
            >
              {buttonText}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RecommendationCard({
  item,
}: {
  item: Recommendation;
}) {
  return (
    <View
      style={styles.recommendationCard}
    >
      <View
        style={styles.recommendationIcon}
      >
        <Ionicons
          name="bulb-outline"
          size={20}
          color="#F0525B"
        />
      </View>

      <View
        style={
          styles.recommendationContent
        }
      >
        <View
          style={
            styles.recommendationTopRow
          }
        >
          <View
            style={
              styles.recommendationChildInfo
            }
          >
            <Text
              style={
                styles.recommendationChildName
              }
            >
              {item.childName}
            </Text>

            <Text
              style={
                styles.recommendationChildId
              }
            >
              Child ID {item.childId}
            </Text>
          </View>

          <Text
            style={
              styles.recommendationDate
            }
          >
            {item.date}
          </Text>
        </View>

        <Text
          style={
            styles.recommendationText
          }
        >
          “{item.description}”
        </Text>
      </View>
    </View>
  );
}

function BottomNavItem({
  icon,
  activeIcon,
  label,
  active = false,
  onPress,
}: BottomNavItemProps) {
  return (
    <TouchableOpacity
      style={styles.bottomNavItem}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <Ionicons
        name={
          active ? activeIcon : icon
        }
        size={20}
        color={
          active
            ? "#5E88A7"
            : "#A2A6AC"
        }
      />

      <Text
        style={[
          styles.bottomNavLabel,
          active &&
            styles.bottomNavLabelActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function getStatusStyle(
  status: CaseStatus
) {
  if (status === "Reviewed") {
    return {
      label: "Reviewed",
      backgroundColor: "#DDF8E2",
      textColor: "#45B65D",
    };
  }

  if (status === "Closed") {
    return {
      label: "Closed",
      backgroundColor: "#ECEFF2",
      textColor: "#8C939A",
    };
  }

  return {
    label: "Pending Review",
    backgroundColor: "#FFF0DE",
    textColor: "#E59A42",
  };
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  background: {
    flex: 1,
  },

  mainContainer: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 95,
  },

  pageTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
    color: "#24282C",
    marginBottom: 18,
  },

  searchContainer: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#DCE5EB",
    borderRadius: 11,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 13,
  },

  searchInput: {
    flex: 1,
    fontSize: 11,
    color: "#25292D",
  },

  filtersContainer: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 18,
  },

  filterButton: {
    flex: 1,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F0F5",
    borderRadius: 999,
    paddingHorizontal: 4,
  },

  filterButtonSelected: {
    backgroundColor: "#F5C1C5",
  },

  filterText: {
    fontSize: 8.5,
    color: "#5D6065",
  },

  filterTextSelected: {
    fontWeight: "600",
    color: "#6A5558",
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#373B3F",
    marginBottom: 10,
  },

  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 9,
    marginBottom: 19,
  },

  overviewCard: {
    width: "48.5%",
    minHeight: 65,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5EDF2",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
    shadowColor: "#99A7B1",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 1,
  },

  overviewCardTitle: {
    fontSize: 8,
    color: "#6C737A",
  },

  overviewValueRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  overviewValue: {
    fontSize: 16,
    fontWeight: "700",
  },

  overviewSuffix: {
    marginTop: 3,
    fontSize: 8,
    color: "#858B92",
  },

  timelineContainer: {
    position: "relative",
    paddingLeft: 27,
    gap: 13,
    marginBottom: 21,
  },

  timelineLine: {
    position: "absolute",
    left: 8,
    top: 5,
    bottom: 5,
    width: 1.5,
    backgroundColor: "#D5E7F5",
  },

  timelineItem: {
    position: "relative",
  },

  timelineMarker: {
    position: "absolute",
    left: -24,
    top: 12,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    zIndex: 3,
  },

  caseCard: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E9EB",
    borderRadius: 19,
    paddingHorizontal: 11,
    paddingTop: 11,
    paddingBottom: 9,
    overflow: "hidden",
    shadowColor: "#9DA6AD",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 1,
  },

  caseDecoration: {
    position: "absolute",
    width: 67,
    height: 67,
    borderRadius: 33.5,
    right: -18,
    top: -16,
    backgroundColor: "#FFF0F1",
  },

  caseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  childInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  avatarWrapper: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    backgroundColor: "#FFF1EC",
    borderWidth: 1,
    borderColor: "#EEDCD6",
    overflow: "hidden",
    marginRight: 9,
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  childTextContainer: {
    flex: 1,
  },

  childName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#24282C",
  },

  caseDate: {
    marginTop: 3,
    fontSize: 8.5,
    color: "#71777D",
  },

  statusBadge: {
    zIndex: 2,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },

  statusText: {
    fontSize: 7.5,
    fontWeight: "500",
  },

  emotionText: {
    marginTop: 8,
    fontSize: 9.5,
    color: "#70ACE2",
  },

  caseDescription: {
    marginTop: 5,
    fontSize: 9.5,
    lineHeight: 14,
    color: "#464B50",
  },

  viewCaseButtonWrapper: {
    marginTop: 9,
  },

  viewCaseButton: {
    height: 34,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  viewCaseButtonText: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "#292D31",
  },

  closedButtonText: {
    color: "#777D84",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 45,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EDF7FF",
    marginBottom: 13,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#292D31",
  },

  emptyDescription: {
    marginTop: 7,
    fontSize: 10.5,
    lineHeight: 16,
    color: "#92979E",
    textAlign: "center",
  },

  recommendationsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 5,
    paddingVertical: 4,
    marginBottom: 10,
  },

  viewAllText: {
    fontSize: 8,
    fontWeight: "600",
    color: "#F1A4A8",
  },

  recommendationsContainer: {
    gap: 10,
  },

  recommendationCard: {
    minHeight: 100,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8F8F9",
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 12,
  },

  recommendationIcon: {
    width: 39,
    height: 39,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFE7E8",
    marginRight: 11,
  },

  recommendationContent: {
    flex: 1,
  },

  recommendationTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },

  recommendationChildInfo: {
    flex: 1,
  },

  recommendationChildName: {
    fontSize: 10,
    fontWeight: "700",
    color: "#303438",
  },

  recommendationChildId: {
    marginTop: 3,
    fontSize: 7.5,
    color: "#8A9096",
  },

  recommendationDate: {
    fontSize: 8.5,
    fontWeight: "600",
    color: "#71777D",
    textAlign: "right",
  },

  recommendationText: {
    marginTop: 8,
    fontSize: 9,
    lineHeight: 14,
    color: "#60666C",
  },

  bottomNavigation: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E9EAED",
    paddingBottom: 6,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 5,
  },

  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  bottomNavLabel: {
    fontSize: 9,
    color: "#A2A6AC",
  },

  bottomNavLabelActive: {
    color: "#5E88A7",
    fontWeight: "600",
  },
});