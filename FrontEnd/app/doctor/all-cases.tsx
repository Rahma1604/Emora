
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
const childPhoto = require("../../assets/images/images/child.png");

type CaseStatus = "Pending" | "Reviewed" | "Closed";

type ChildCase = {
  name: string;
  childId: string;
  age: number;
  indicator: string;
  summary: string;
  status: CaseStatus;
  priority: string;
  avatar: number;
  lastUpdated: string;
};

const cases: ChildCase[] = [
  {
    name: "Lily",
    childId: "#1045",
    age: 5,
    indicator: "High Anxiety Indicators",
    summary:
      "Mild anxiety related to the school environment and social interaction.",
    status: "Pending",
    priority: "High Priority",
    avatar: girlPhoto,
    lastUpdated: "May 12, 2026",
  },
  {
    name: "Sammy",
    childId: "#11045",
    age: 5,
    indicator: "Repeated Stress Indicators",
    summary:
      "Emotional sensitivity detected during recent routines.",
    status: "Pending",
    priority: "Medium Priority",
    avatar: boyPhoto,
    lastUpdated: "May 15, 2026",
  },
  {
    name: "Emma",
    childId: "#1098",
    age: 6,
    indicator: "Anxiety Indicators",
    summary:
      "Reduced anxiety compared to the previous weekly analysis.",
    status: "Reviewed",
    priority: "Low Priority",
    avatar: girlPhoto,
    lastUpdated: "May 14, 2026",
  },
  {
    name: "Adam",
    childId: "#1072",
    age: 7,
    indicator: "Social Withdrawal",
    summary:
      "The child shows limited participation in group activities.",
    status: "Closed",
    priority: "Medium Priority",
    avatar: boyPhoto,
    lastUpdated: "May 10, 2026",
  },
  {
    name: "Noah",
    childId: "#1120",
    age: 6,
    indicator: "Sleep Disturbance",
    summary:
      "Recent entries indicate irregular sleep and daytime fatigue.",
    status: "Reviewed",
    priority: "Medium Priority",
    avatar: childPhoto,
    lastUpdated: "May 9, 2026",
  },
  {
    name: "Mia",
    childId: "#1131",
    age: 5,
    indicator: "Emotional Sensitivity",
    summary:
      "Emotional responses are improving with structured routines.",
    status: "Pending",
    priority: "Low Priority",
    avatar: girlPhoto,
    lastUpdated: "May 8, 2026",
  },
];

const filters: Array<"All" | CaseStatus> = [
  "All",
  "Pending",
  "Reviewed",
  "Closed",
];

export default function AllCasesScreen() {
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] =
    useState<"All" | CaseStatus>("All");

  const filteredCases = useMemo(() => {
    const cleanSearch = searchText.trim().toLowerCase();

    return cases.filter((item) => {
      const matchesFilter =
        selectedFilter === "All" ||
        item.status === selectedFilter;

      const matchesSearch =
        !cleanSearch ||
        item.name.toLowerCase().includes(cleanSearch) ||
        item.childId.toLowerCase().includes(cleanSearch) ||
        item.indicator.toLowerCase().includes(cleanSearch);

      return matchesFilter && matchesSearch;
    });
  }, [searchText, selectedFilter]);

  const handleBack = () => {
    router.back();
  };

  const handleOpenCase = (item: ChildCase) => {
    router.push(
      `/doctor/review-case?child=${encodeURIComponent(
        item.name
      )}&childId=${encodeURIComponent(item.childId)}` as Href
    );
  };

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
        colors={["#FFFFFF", "#FFF9F9", "#F8FCFF"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#1F2937"
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              All Cases
            </Text>

            <View style={styles.headerPlaceholder} />
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color="#969CA3"
            />

            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search by child name, ID or indicator"
              placeholderTextColor="#A1A6AC"
              autoCorrect={false}
              style={styles.searchInput}
            />

            {searchText.length > 0 ? (
              <TouchableOpacity
                onPress={() => setSearchText("")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-circle"
                  size={19}
                  color="#B4B8BD"
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filters */}
          <View style={styles.filtersRow}>
            {filters.map((filter) => {
              const isSelected =
                selectedFilter === filter;

              return (
                <TouchableOpacity
                  key={filter}
                  activeOpacity={0.8}
                  onPress={() =>
                    setSelectedFilter(filter)
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

          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>
              Cases
            </Text>

            <Text style={styles.resultCount}>
              {filteredCases.length} results
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredCases.length > 0 ? (
              filteredCases.map((item) => (
                <CaseCard
                  key={item.childId}
                  item={item}
                  onPress={() =>
                    handleOpenCase(item)
                  }
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="folder-open-outline"
                    size={37}
                    color="#80B7E6"
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  No cases found
                </Text>

                <Text style={styles.emptyDescription}>
                  Try changing the search text or selected
                  filter.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

function CaseCard({
  item,
  onPress,
}: {
  item: ChildCase;
  onPress: () => void;
}) {
  const statusStyle = getStatusStyle(item.status);

  return (
    <View style={styles.caseCard}>
      <View style={styles.caseDecoration} />

      <View style={styles.caseHeader}>
        <View style={styles.childInfo}>
          <View style={styles.avatarWrapper}>
            <Image
              source={item.avatar}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>

          <View style={styles.childDetails}>
            <Text style={styles.childName}>
              {item.name}
            </Text>

            <Text style={styles.childMeta}>
              Child ID {item.childId} · {item.age} years old
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
                color: statusStyle.textColor,
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.indicatorRow}>
        <Ionicons
          name="pulse-outline"
          size={16}
          color="#72ACE0"
        />

        <Text style={styles.indicatorText}>
          {item.indicator}
        </Text>
      </View>

      <Text style={styles.caseSummary}>
        {item.summary}
      </Text>

      <View style={styles.caseFooter}>
        <Text style={styles.lastUpdated}>
          Last updated: {item.lastUpdated}
        </Text>

        <Text style={styles.priorityText}>
          {item.priority}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.viewCaseButtonWrapper}
      >
        <LinearGradient
          colors={["#A5D2F7", "#F6ADB1"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.viewCaseButton}
        >
          <Text style={styles.viewCaseButtonText}>
            View Case
          </Text>

          <Ionicons
            name="arrow-forward"
            size={17}
            color="#292D31"
          />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function getStatusStyle(status: CaseStatus) {
  if (status === "Reviewed") {
    return {
      backgroundColor: "#DDF8E2",
      textColor: "#46B65D",
    };
  }

  if (status === "Closed") {
    return {
      backgroundColor: "#E9ECEF",
      textColor: "#858C94",
    };
  }

  return {
    backgroundColor: "#FFF0DE",
    textColor: "#E79B42",
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

  container: {
    flex: 1,
    paddingHorizontal: 18,
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
    color: "#202428",
  },

  headerPlaceholder: {
    width: 40,
  },

  searchContainer: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F4F6",
    borderRadius: 13,
    paddingHorizontal: 13,
    gap: 9,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "#25292D",
  },

  filtersRow: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 15,
  },

  filterButton: {
    flex: 1,
    height: 35,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F2F4",
  },

  filterButtonSelected: {
    backgroundColor: "#F9C7CA",
  },

  filterText: {
    fontSize: 9.5,
    color: "#777D84",
  },

  filterTextSelected: {
    color: "#B85359",
    fontWeight: "600",
  },

  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#292D31",
  },

  resultCount: {
    fontSize: 9.5,
    color: "#989DA3",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 25,
    gap: 11,
  },

  caseCard: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E8EA",
    borderRadius: 17,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    overflow: "hidden",
  },

  caseDecoration: {
    position: "absolute",
    width: 75,
    height: 75,
    borderRadius: 37.5,
    right: -22,
    top: -20,
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
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFF1EC",
    borderWidth: 1,
    borderColor: "#EEDDD7",
    overflow: "hidden",
    marginRight: 10,
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  childDetails: {
    flex: 1,
  },

  childName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#25292D",
  },

  childMeta: {
    marginTop: 3,
    fontSize: 8.5,
    color: "#7A8087",
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginLeft: 8,
    zIndex: 2,
  },

  statusText: {
    fontSize: 8,
    fontWeight: "500",
  },

  indicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 11,
  },

  indicatorText: {
    fontSize: 10.5,
    color: "#6EA9DF",
  },

  caseSummary: {
    marginTop: 7,
    fontSize: 10,
    lineHeight: 15,
    color: "#50555B",
  },

  caseFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  lastUpdated: {
    fontSize: 8.5,
    color: "#9A9FA5",
  },

  priorityText: {
    fontSize: 8.5,
    color: "#E89845",
  },

  viewCaseButtonWrapper: {
    marginTop: 11,
  },

  viewCaseButton: {
    height: 36,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  viewCaseButtonText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#292D31",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 70,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EDF7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#292D31",
  },

  emptyDescription: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 17,
    color: "#8F959C",
    textAlign: "center",
  },
});

