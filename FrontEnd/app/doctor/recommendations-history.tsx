import React, { useMemo, useState } from "react";
import {
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
import { Image } from "expo-image";
import { router, type Href } from "expo-router";

const girlPhoto = require("../../assets/images/images/girl.png");
const boyPhoto = require("../../assets/images/images/boy.png");

type RecommendationStatus =
  | "active"
  | "follow_up"
  | "completed";

type RecommendationFilter =
  | "all"
  | RecommendationStatus;

type RecommendationItem = {
  id: string;
  childName: string;
  childId: string;
  age: number;
  avatar: number;
  date: string;
  timestamp: number;
  caseEmotion: string;
  recommendation: string;
  status: RecommendationStatus;
  followUpPeriod: string;
  parentViewed: boolean;
  relatedIndicators: string[];
};

const recommendationsData: RecommendationItem[] = [
  {
    id: "recommendation-1",
    childName: "Lily",
    childId: "#1045",
    age: 5,
    avatar: girlPhoto,
    date: "May 10, 2026",
    timestamp: new Date("2026-05-10").getTime(),
    caseEmotion: "School Anxiety",
    recommendation:
      "Continue monitoring school-related stress levels and maintain a consistent sleep diary for the next 14 days. Use a calm morning routine and encourage Lily to express how she feels before going to school.",
    status: "follow_up",
    followUpPeriod: "14 days",
    parentViewed: true,
    relatedIndicators: [
      "School Anxiety",
      "Sleep Disturbance",
      "Fear",
    ],
  },
  {
    id: "recommendation-2",
    childName: "Sammy",
    childId: "#11045",
    age: 5,
    avatar: boyPhoto,
    date: "May 8, 2026",
    timestamp: new Date("2026-05-08").getTime(),
    caseEmotion: "Emotional Stress",
    recommendation:
      "Maintain a consistent daily routine and prepare Sammy before any expected changes. Encourage calm communication and allow him enough time to process social situations.",
    status: "active",
    followUpPeriod: "7 days",
    parentViewed: true,
    relatedIndicators: [
      "Routine Stress",
      "Emotional Sensitivity",
      "Social Stress",
    ],
  },
  {
    id: "recommendation-3",
    childName: "Adam",
    childId: "#1078",
    age: 6,
    avatar: boyPhoto,
    date: "May 3, 2026",
    timestamp: new Date("2026-05-03").getTime(),
    caseEmotion: "Stress",
    recommendation:
      "Reduce pressure during school preparation and introduce short relaxation exercises before group activities. Continue observing stress responses during the next week.",
    status: "completed",
    followUpPeriod: "7 days",
    parentViewed: true,
    relatedIndicators: [
      "School Stress",
      "Group Activities",
      "Emotional Pressure",
    ],
  },
  {
    id: "recommendation-4",
    childName: "Lily",
    childId: "#1045",
    age: 5,
    avatar: girlPhoto,
    date: "April 28, 2026",
    timestamp: new Date("2026-04-28").getTime(),
    caseEmotion: "Social Withdrawal",
    recommendation:
      "Encourage structured social activities in low-pressure environments. Start with one familiar child and gradually increase participation when Lily feels comfortable.",
    status: "completed",
    followUpPeriod: "2 weeks",
    parentViewed: true,
    relatedIndicators: [
      "Social Withdrawal",
      "Fear",
      "Low Participation",
    ],
  },
  {
    id: "recommendation-5",
    childName: "Emma",
    childId: "#1088",
    age: 7,
    avatar: girlPhoto,
    date: "April 24, 2026",
    timestamp: new Date("2026-04-24").getTime(),
    caseEmotion: "Anxiety",
    recommendation:
      "Use breathing exercises before stressful situations and ask Emma to record her feelings using a simple daily emotion chart. Review the changes after one week.",
    status: "follow_up",
    followUpPeriod: "7 days",
    parentViewed: false,
    relatedIndicators: [
      "Anxiety",
      "Emotional Expression",
      "Stress",
    ],
  },
  {
    id: "recommendation-6",
    childName: "Sammy",
    childId: "#11045",
    age: 5,
    avatar: boyPhoto,
    date: "April 18, 2026",
    timestamp: new Date("2026-04-18").getTime(),
    caseEmotion: "Calm",
    recommendation:
      "Continue the current structured routine and reinforce positive emotional communication. No immediate changes are required unless new stress indicators appear.",
    status: "completed",
    followUpPeriod: "No follow-up required",
    parentViewed: true,
    relatedIndicators: [
      "Emotional Stability",
      "Positive Routine",
      "Calm Response",
    ],
  },
  {
    id: "recommendation-7",
    childName: "Nora",
    childId: "#1092",
    age: 6,
    avatar: girlPhoto,
    date: "April 12, 2026",
    timestamp: new Date("2026-04-12").getTime(),
    caseEmotion: "Sleep Disturbance",
    recommendation:
      "Create a fixed bedtime routine, reduce screen exposure before sleep and record any nighttime waking for the next 10 days.",
    status: "active",
    followUpPeriod: "10 days",
    parentViewed: true,
    relatedIndicators: [
      "Sleep Disturbance",
      "Night Anxiety",
      "Routine",
    ],
  },
  {
    id: "recommendation-8",
    childName: "Youssef",
    childId: "#1112",
    age: 7,
    avatar: boyPhoto,
    date: "April 5, 2026",
    timestamp: new Date("2026-04-05").getTime(),
    caseEmotion: "Anger Indicators",
    recommendation:
      "Help Youssef identify early signs of anger and use a short calming break before discussing the situation. Avoid punishment during intense emotional reactions.",
    status: "active",
    followUpPeriod: "14 days",
    parentViewed: false,
    relatedIndicators: [
      "Anger",
      "Emotional Regulation",
      "Irritability",
    ],
  },
];

const filterOptions: {
  label: string;
  value: RecommendationFilter;
}[] = [
  {
    label: "All",
    value: "all",
  },
  {
    label: "Active",
    value: "active",
  },
  {
    label: "Follow-up",
    value: "follow_up",
  },
  {
    label: "Completed",
    value: "completed",
  },
];

export default function RecommendationsHistoryScreen() {
  const [searchText, setSearchText] =
    useState("");

  const [selectedFilter, setSelectedFilter] =
    useState<RecommendationFilter>("all");

  const counts = useMemo(() => {
    return {
      total: recommendationsData.length,

      active: recommendationsData.filter(
        (item) => item.status === "active"
      ).length,

      followUp: recommendationsData.filter(
        (item) => item.status === "follow_up"
      ).length,

      completed: recommendationsData.filter(
        (item) => item.status === "completed"
      ).length,
    };
  }, []);

  const filteredRecommendations = useMemo(() => {
    const normalizedSearch =
      searchText.trim().toLowerCase();

    return recommendationsData
      .filter((item) => {
        const matchesFilter =
          selectedFilter === "all" ||
          item.status === selectedFilter;

        const matchesSearch =
          !normalizedSearch ||
          item.childName
            .toLowerCase()
            .includes(normalizedSearch) ||
          item.childId
            .toLowerCase()
            .includes(normalizedSearch) ||
          item.caseEmotion
            .toLowerCase()
            .includes(normalizedSearch) ||
          item.recommendation
            .toLowerCase()
            .includes(normalizedSearch) ||
          item.relatedIndicators.some(
            (indicator) =>
              indicator
                .toLowerCase()
                .includes(normalizedSearch)
          );

        return matchesFilter && matchesSearch;
      })
      .sort(
        (firstItem, secondItem) =>
          secondItem.timestamp -
          firstItem.timestamp
      );
  }, [searchText, selectedFilter]);

  const handleBack = () => {
    router.back();
  };

  const handleViewChild = (
    recommendation: RecommendationItem
  ) => {
    router.push(
      `/doctor/child-overview?child=${encodeURIComponent(
        recommendation.childName
      )}&childId=${encodeURIComponent(
        recommendation.childId
      )}` as Href
    );
  };

  const handleOpenCase = (
    recommendation: RecommendationItem
  ) => {
    router.push(
      `/doctor/review-case?child=${encodeURIComponent(
        recommendation.childName
      )}&childId=${encodeURIComponent(
        recommendation.childId
      )}` as Href
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
        colors={[
          "#FFFFFF",
          "#FFF9F9",
          "#F7FBFF",
        ]}
        locations={[0, 0.48, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleBack}
              style={styles.backButton}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#1F2937"
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              All Recommendations
            </Text>

            <View style={styles.headerPlaceholder} />
          </View>

          {/* Introduction */}
          <View style={styles.introduction}>
            <LinearGradient
              colors={["#DDEFFF", "#FFE3E5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.introductionIcon}
            >
              <Ionicons
                name="clipboard-outline"
                size={27}
                color="#6D9EC8"
              />
            </LinearGradient>

            <View style={styles.introductionContent}>
              <Text style={styles.pageTitle}>
                Recommendation History
              </Text>

              <Text style={styles.pageSubtitle}>
                Review all professional recommendations you
                have written for monitored children.
              </Text>
            </View>
          </View>

          {/* Overview Cards */}
          <View style={styles.overviewGrid}>
            <OverviewCard
              label="Total"
              value={counts.total}
              valueColor="#438BC7"
            />

            <OverviewCard
              label="Active"
              value={counts.active}
              valueColor="#3AAE59"
            />

            <OverviewCard
              label="Follow-up"
              value={counts.followUp}
              valueColor="#D9943E"
            />

            <OverviewCard
              label="Completed"
              value={counts.completed}
              valueColor="#777F87"
            />
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={19}
              color="#98A0A7"
            />

            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search child, ID or recommendation..."
              placeholderTextColor="#A6ABB1"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.searchInput}
            />

            {searchText ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSearchText("")}
              >
                <Ionicons
                  name="close-circle"
                  size={19}
                  color="#A5ABB1"
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.filtersContainer
            }
          >
            {filterOptions.map((filter) => {
              const isSelected =
                selectedFilter === filter.value;

              return (
                <TouchableOpacity
                  key={filter.value}
                  activeOpacity={0.8}
                  onPress={() =>
                    setSelectedFilter(filter.value)
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
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* List Header */}
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.listTitle}>
                Your Recommendations
              </Text>

              <Text style={styles.listSubtitle}>
                Ordered from newest to oldest
              </Text>
            </View>

            <Text style={styles.resultsText}>
              {filteredRecommendations.length} results
            </Text>
          </View>

          {/* Recommendations */}
          {filteredRecommendations.length > 0 ? (
            <View style={styles.recommendationsList}>
              {filteredRecommendations.map(
                (recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    onViewChild={() =>
                      handleViewChild(recommendation)
                    }
                    onOpenCase={() =>
                      handleOpenCase(recommendation)
                    }
                  />
                )
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={["#E5F3FF", "#FFF0F1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIcon}
              >
                <Ionicons
                  name="document-text-outline"
                  size={31}
                  color="#6F9DC1"
                />
              </LinearGradient>

              <Text style={styles.emptyTitle}>
                No recommendations found
              </Text>

              <Text style={styles.emptyDescription}>
                Try changing your search text or selected
                filter.
              </Text>
            </View>
          )}

          {/* Privacy Notice */}
          <View style={styles.privacyNotice}>
            <View style={styles.privacyNoticeIcon}>
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color="#648FB4"
              />
            </View>

            <Text style={styles.privacyNoticeText}>
              These recommendations are only visible to the
              assigned doctor and the child&apos;s parent.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function OverviewCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: number;
  valueColor: string;
}) {
  return (
    <View style={styles.overviewCard}>
      <Text style={styles.overviewLabel}>
        {label}
      </Text>

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
    </View>
  );
}

function RecommendationCard({
  recommendation,
  onViewChild,
  onOpenCase,
}: {
  recommendation: RecommendationItem;
  onViewChild: () => void;
  onOpenCase: () => void;
}) {
  const statusData = getStatusData(
    recommendation.status
  );

  return (
    <View style={styles.recommendationCard}>
      {/* Child Header */}
      <View style={styles.childHeader}>
        <View style={styles.childIdentity}>
          <View style={styles.childAvatarWrapper}>
            <Image
              source={recommendation.avatar}
              style={styles.childAvatar}
              contentFit="cover"
              transition={150}
            />
          </View>

          <View style={styles.childInformation}>
            <Text style={styles.childName}>
              {recommendation.childName}
            </Text>

            <Text style={styles.childDetails}>
              Child ID {recommendation.childId} ·{" "}
              {recommendation.age} years old
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                statusData.backgroundColor,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  statusData.textColor,
              },
            ]}
          />

          <Text
            style={[
              styles.statusText,
              {
                color: statusData.textColor,
              },
            ]}
          >
            {statusData.label}
          </Text>
        </View>
      </View>

      {/* Recommendation Metadata */}
      <View style={styles.metadataRow}>
        <View style={styles.metadataItem}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color="#7891A4"
          />

          <Text style={styles.metadataText}>
            {recommendation.date}
          </Text>
        </View>

        <View style={styles.metadataDivider} />

        <View style={styles.metadataItem}>
          <Ionicons
            name="time-outline"
            size={14}
            color="#7891A4"
          />

          <Text style={styles.metadataText}>
            {recommendation.followUpPeriod}
          </Text>
        </View>
      </View>

      {/* Emotion */}
      <View style={styles.emotionRow}>
        <View style={styles.emotionIcon}>
          <Ionicons
            name="heart-outline"
            size={17}
            color="#DD8188"
          />
        </View>

        <View style={styles.emotionContent}>
          <Text style={styles.emotionLabel}>
            Related case
          </Text>

          <Text style={styles.emotionValue}>
            {recommendation.caseEmotion}
          </Text>
        </View>

        <View style={styles.parentViewStatus}>
          <Ionicons
            name={
              recommendation.parentViewed
                ? "checkmark-done-outline"
                : "time-outline"
            }
            size={14}
            color={
              recommendation.parentViewed
                ? "#48A95B"
                : "#D68B3E"
            }
          />

          <Text
            style={[
              styles.parentViewText,
              {
                color: recommendation.parentViewed
                  ? "#48A95B"
                  : "#D68B3E",
              },
            ]}
          >
            {recommendation.parentViewed
              ? "Viewed by parent"
              : "Not viewed yet"}
          </Text>
        </View>
      </View>

      {/* Recommendation Text */}
      <LinearGradient
        colors={["#FFF5F5", "#F4F9FD"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.recommendationTextCard}
      >
        <View style={styles.quoteIconContainer}>
          <Ionicons
            name="clipboard-outline"
            size={18}
            color="#D67C83"
          />
        </View>

        <View style={styles.recommendationContent}>
          <Text style={styles.recommendationLabel}>
            Doctor Recommendation
          </Text>

          <Text style={styles.recommendationText}>
            {recommendation.recommendation}
          </Text>
        </View>
      </LinearGradient>

      {/* Indicators */}
      <View style={styles.indicatorsContainer}>
        {recommendation.relatedIndicators.map(
          (indicator) => (
            <View
              key={indicator}
              style={styles.indicatorChip}
            >
              <View style={styles.indicatorDot} />

              <Text style={styles.indicatorText}>
                {indicator}
              </Text>
            </View>
          )
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onViewChild}
          style={styles.secondaryButton}
        >
          <Ionicons
            name="person-outline"
            size={16}
            color="#6595BB"
          />

          <Text style={styles.secondaryButtonText}>
            View Child
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onOpenCase}
          style={styles.primaryButtonWrapper}
        >
          <LinearGradient
            colors={["#A8D4F7", "#F7A8AC"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              Open Case
            </Text>

            <Ionicons
              name="arrow-forward"
              size={16}
              color="#25282B"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getStatusData(
  status: RecommendationStatus
) {
  switch (status) {
    case "active":
      return {
        label: "Active",
        backgroundColor: "#E9F8ED",
        textColor: "#45A95A",
      };

    case "follow_up":
      return {
        label: "Follow-up",
        backgroundColor: "#FFF2E2",
        textColor: "#D68B3E",
      };

    case "completed":
      return {
        label: "Completed",
        backgroundColor: "#ECEFF2",
        textColor: "#778089",
      };
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  background: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 17,
    paddingTop: 4,
    paddingBottom: 30,
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
    color: "#22262A",
  },

  headerPlaceholder: {
    width: 40,
  },

  introduction: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 17,
  },

  introductionIcon: {
    width: 55,
    height: 55,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  introductionContent: {
    flex: 1,
  },

  pageTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#24282C",
  },

  pageSubtitle: {
    marginTop: 5,
    fontSize: 9.5,
    lineHeight: 15,
    color: "#878D93",
  },

  overviewGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 7,
    marginBottom: 14,
  },

  overviewCard: {
    flex: 1,
    minHeight: 58,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5ECF1",
    borderRadius: 11,
    paddingHorizontal: 8,
  },

  overviewLabel: {
    fontSize: 7.5,
    color: "#828990",
  },

  overviewValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
  },

  searchContainer: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F7F9FA",
    borderWidth: 1,
    borderColor: "#E1E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 11,
  },

  searchInput: {
    flex: 1,
    fontSize: 11.5,
    color: "#252A2E",
  },

  filtersContainer: {
    gap: 8,
    paddingBottom: 17,
  },

  filterButton: {
    minWidth: 74,
    alignItems: "center",
    backgroundColor: "#F0F1F3",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  filterButtonSelected: {
    backgroundColor: "#F8C4C7",
  },

  filterText: {
    fontSize: 9,
    fontWeight: "500",
    color: "#6C737A",
  },

  filterTextSelected: {
    fontWeight: "700",
    color: "#5B4144",
  },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },

  listTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#292E32",
  },

  listSubtitle: {
    marginTop: 4,
    fontSize: 8.5,
    color: "#969CA2",
  },

  resultsText: {
    fontSize: 8.5,
    color: "#E49A9F",
  },

  recommendationsList: {
    gap: 13,
  },

  recommendationCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderRadius: 17,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 11,
    shadowColor: "#A9B3BB",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 1,
  },

  childHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  childIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },

  childAvatarWrapper: {
    width: 45,
    height: 45,
    borderRadius: 23,
    overflow: "hidden",
    backgroundColor: "#FFF1EA",
    borderWidth: 1,
    borderColor: "#E9DDD4",
    marginRight: 9,
  },

  childAvatar: {
    width: "100%",
    height: "100%",
  },

  childInformation: {
    flex: 1,
  },

  childName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#282D31",
  },

  childDetails: {
    marginTop: 4,
    fontSize: 8.5,
    color: "#848B91",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 7.5,
    fontWeight: "600",
  },

  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFB",
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 11,
  },

  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metadataText: {
    fontSize: 8.5,
    color: "#71808C",
  },

  metadataDivider: {
    width: 1,
    height: 15,
    backgroundColor: "#DDE3E7",
    marginHorizontal: 10,
  },

  emotionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 11,
  },

  emotionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF0F1",
    marginRight: 8,
  },

  emotionContent: {
    flex: 1,
  },

  emotionLabel: {
    fontSize: 7.5,
    color: "#979DA3",
  },

  emotionValue: {
    marginTop: 3,
    fontSize: 10.5,
    fontWeight: "600",
    color: "#4A5055",
  },

  parentViewStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  parentViewText: {
    fontSize: 7.5,
    fontWeight: "500",
  },

  recommendationTextCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 11,
    marginTop: 11,
  },

  quoteIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 9,
  },

  recommendationContent: {
    flex: 1,
  },

  recommendationLabel: {
    fontSize: 8.5,
    fontWeight: "700",
    color: "#865A5F",
  },

  recommendationText: {
    marginTop: 6,
    fontSize: 9.5,
    lineHeight: 15,
    color: "#555C62",
  },

  indicatorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },

  indicatorChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFF0F1",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  indicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D87B82",
  },

  indicatorText: {
    fontSize: 7.5,
    color: "#74575A",
  },

  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  secondaryButton: {
    flex: 1,
    height: 43,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#B9D4E8",
    borderRadius: 999,
  },

  secondaryButtonText: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "#6595BB",
  },

  primaryButtonWrapper: {
    flex: 1,
  },

  primaryButton: {
    height: 43,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  primaryButtonText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#25282B",
  },

  emptyState: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    paddingHorizontal: 20,
    paddingVertical: 31,
  },

  emptyIcon: {
    width: 65,
    height: 65,
    borderRadius: 33,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: "700",
    color: "#30353A",
  },

  emptyDescription: {
    maxWidth: 250,
    marginTop: 7,
    fontSize: 9.5,
    lineHeight: 15,
    color: "#8D9399",
    textAlign: "center",
  },

  privacyNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EAF5FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 17,
  },

  privacyNoticeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 9,
  },

  privacyNoticeText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 14,
    color: "#668098",
  },
});