
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import Svg, { Line, Path } from "react-native-svg";

const girlPhoto = require("../../assets/images/images/girl.png");
const boyPhoto = require("../../assets/images/images/boy.png");

type EmotionItem = {
  name: string;
  value: number;
  emoji: string;
  color: string;
};

type AttentionCase = {
  name: string;
  childId: string;
  indicator: string;
  priority: "High Priority" | "Medium Priority";
  avatar: number;
};

type ImprovementItem = {
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const emotions: EmotionItem[] = [
  {
    name: "Anxiety",
    value: 42,
    emoji: "😟",
    color: "#F5B3B7",
  },
  {
    name: "Stress",
    value: 31,
    emoji: "😟",
    color: "#F7BABD",
  },
  {
    name: "Calm",
    value: 18,
    emoji: "😌",
    color: "#A9DEC9",
  },
  {
    name: "Happy",
    value: 9,
    emoji: "🥲",
    color: "#8FD6B7",
  },
];

const attentionCases: AttentionCase[] = [
  {
    name: "Lily",
    childId: "#1045",
    indicator: "High Anxiety Indicators",
    priority: "High Priority",
    avatar: girlPhoto,
  },
  {
    name: "Sammy",
    childId: "#11045",
    indicator: "Repeated Stress Indicators",
    priority: "Medium Priority",
    avatar: boyPhoto,
  },
];

const recentImprovements: ImprovementItem[] = [
  {
    name: "Sammy",
    description: "Improved emotional stability this week.",
    icon: "trending-up-outline",
  },
  {
    name: "Emma",
    description:
      "Reduced anxiety indicators compared to last week.",
    icon: "sparkles-outline",
  },
];

export default function WeeklySummaryScreen() {
  const handleBack = () => {
    router.back();
  };

  const handleViewCase = (
    childName: string,
    childId: string
  ) => {
    router.push(
      `/doctor/review-case?child=${encodeURIComponent(
        childName
      )}&childId=${encodeURIComponent(childId)}` as Href
    );
  };

  const handleViewAllCases = () => {
    router.push("/doctor/all-cases" as Href);
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
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
              Weekly Progress Summary
            </Text>

            <View style={styles.headerPlaceholder} />
          </View>

          {/* Weekly Overview */}
          <View style={styles.overviewCard}>
            <Text style={styles.overviewTitle}>
              Weekly Overview
            </Text>

            <Text style={styles.overviewDescription}>
              This week&apos;s emotional and behavioral progress
              across monitored children.
            </Text>

            <View style={styles.overviewDivider} />

            <View style={styles.overviewStats}>
              <OverviewStat value="8" label="NEW CASES" />

              <View style={styles.statDivider} />

              <OverviewStat value="12" label="REVIEWED" />

              <View style={styles.statDivider} />

              <OverviewStat value="24" label="ACTIVE" />
            </View>
          </View>

          {/* Weekly Emotional Trend */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name="stats-chart-outline"
                size={19}
                color="#6EB2EE"
              />

              <Text style={styles.sectionTitle}>
                Weekly Emotional Trend
              </Text>
            </View>

            <View style={styles.cardDivider} />

            <WeeklyTrendChart />

            <View style={styles.daysRow}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                (day) => (
                  <Text key={day} style={styles.dayText}>
                    {day}
                  </Text>
                )
              )}
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.chartLegend}>
              <LegendItem color="#F5AEB3" label="ANXIETY" />
              <LegendItem color="#F7C1C4" label="STRESS" />
              <LegendItem color="#9DDFC2" label="HAPPY" />
            </View>
          </View>

          {/* Most Common Emotions */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              Most Common Emotions
            </Text>

            <View style={styles.cardDivider} />

            <View style={styles.emotionsContainer}>
              {emotions.map((emotion) => (
                <EmotionProgress
                  key={emotion.name}
                  {...emotion}
                />
              ))}
            </View>
          </View>

          {/* Children Requiring Attention */}
          <Text style={styles.normalSectionTitle}>
            Children Requiring Attention
          </Text>

          <View style={styles.attentionCasesContainer}>
            {attentionCases.map((item) => (
              <AttentionCaseCard
                key={item.childId}
                {...item}
                onViewDetails={() =>
                  handleViewCase(item.name, item.childId)
                }
              />
            ))}
          </View>

          {/* AI Weekly Summary */}
          <View style={styles.aiSummaryCard}>
            <View style={styles.aiTitleRow}>
              <Ionicons
                name="sparkles"
                size={19}
                color="#3DB35A"
              />

              <Text style={styles.aiTitle}>
                AI WEEKLY SUMMARY
              </Text>
            </View>

            <Text style={styles.aiText}>
              “During the last 7 days, anxiety-related indicators
              were the most common among submitted cases. Several
              children showed positive emotional progress, while a
              small number may benefit from additional follow-up and
              observation.”
            </Text>
          </View>

          {/* Recent Improvements */}
          <Text style={styles.normalSectionTitle}>
            Recent Improvements
          </Text>

          <View style={styles.improvementsContainer}>
            {recentImprovements.map((item) => (
              <View
                key={item.name}
                style={styles.improvementCard}
              >
                <View style={styles.improvementIcon}>
                  <Ionicons
                    name={item.icon}
                    size={21}
                    color="#40C460"
                  />
                </View>

                <Text style={styles.improvementText}>
                  <Text style={styles.improvementName}>
                    {item.name}:{" "}
                  </Text>

                  {item.description}
                </Text>
              </View>
            ))}
          </View>

          {/* View All Cases */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleViewAllCases}
            style={styles.allCasesButtonWrapper}
          >
            <LinearGradient
              colors={["#A5D2F7", "#F6ACB0"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.allCasesButton}
            >
              <Text style={styles.allCasesButtonText}>
                View All Cases
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function WeeklyTrendChart() {
  return (
    <View style={styles.chartContainer}>
      <Svg
        width="100%"
        height="160"
        viewBox="0 0 320 160"
      >
        <Line
          x1="0"
          y1="30"
          x2="320"
          y2="30"
          stroke="#EEF0F2"
          strokeWidth="1"
        />

        <Line
          x1="0"
          y1="75"
          x2="320"
          y2="75"
          stroke="#EEF0F2"
          strokeWidth="1"
        />

        <Line
          x1="0"
          y1="120"
          x2="320"
          y2="120"
          stroke="#EEF0F2"
          strokeWidth="1"
        />

        {/* Anxiety */}
        <Path
          d="
            M 0 108
            C 35 52, 58 70, 82 84
            C 112 101, 136 98, 160 49
            C 184 3, 211 19, 225 80
            C 239 142, 274 151, 300 89
            C 310 65, 316 71, 320 78
          "
          fill="none"
          stroke="#F5AEB3"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Happy */}
        <Path
          d="
            M 0 95
            C 36 93, 55 61, 84 53
            C 113 45, 138 59, 158 91
            C 177 122, 201 127, 221 88
            C 243 46, 260 18, 282 25
            C 303 31, 313 55, 320 67
          "
          fill="none"
          stroke="#9DDFC2"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

type OverviewStatProps = {
  value: string;
  label: string;
};

function OverviewStat({
  value,
  label,
}: OverviewStatProps) {
  return (
    <View style={styles.overviewStat}>
      <Text style={styles.overviewStatValue}>
        {value}
      </Text>

      <Text style={styles.overviewStatLabel}>
        {label}
      </Text>
    </View>
  );
}

type LegendItemProps = {
  color: string;
  label: string;
};

function LegendItem({
  color,
  label,
}: LegendItemProps) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendDot,
          {
            backgroundColor: color,
          },
        ]}
      />

      <Text style={styles.legendText}>
        {label}
      </Text>
    </View>
  );
}

function EmotionProgress({
  name,
  value,
  emoji,
  color,
}: EmotionItem) {
  return (
    <View style={styles.emotionItem}>
      <View style={styles.emotionHeader}>
        <Text style={styles.emotionName}>
          {name}
        </Text>

        <Text style={styles.emotionPercentage}>
          {value}%
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressValueContainer,
            {
              width: `${value}%`,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: color,
              },
            ]}
          />

          <View style={styles.progressEmoji}>
            <Text style={styles.progressEmojiText}>
              {emoji}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function AttentionCaseCard({
  name,
  childId,
  indicator,
  priority,
  avatar,
  onViewDetails,
}: AttentionCase & {
  onViewDetails: () => void;
}) {
  const isHighPriority =
    priority === "High Priority";

  return (
    <View style={styles.caseCard}>
      <View style={styles.caseDecoration} />

      <View style={styles.caseTopRow}>
        <View style={styles.childInfo}>
          <View style={styles.childAvatarWrapper}>
            <Image
              source={avatar}
              style={styles.childAvatar}
              contentFit="cover"
            />
          </View>

          <View style={styles.childText}>
            <Text style={styles.childName}>
              {name}
            </Text>

            <Text style={styles.childId}>
              Child ID {childId}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.priorityBadge,
            isHighPriority
              ? styles.highPriorityBadge
              : styles.mediumPriorityBadge,
          ]}
        >
          <Text
            style={[
              styles.priorityText,
              isHighPriority
                ? styles.highPriorityText
                : styles.mediumPriorityText,
            ]}
          >
            {priority}
          </Text>
        </View>
      </View>

      <Text style={styles.indicatorText}>
        {indicator}
      </Text>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onViewDetails}
        style={styles.detailsButtonWrapper}
      >
        <LinearGradient
          colors={["#A3D1F6", "#F5ADB1"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.detailsButton}
        >
          <Text style={styles.detailsButtonText}>
            View Details
          </Text>
        </LinearGradient>
      </TouchableOpacity>
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

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
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
    fontSize: 17,
    fontWeight: "600",
    color: "#202428",
  },

  headerPlaceholder: {
    width: 40,
  },

  overviewCard: {
    backgroundColor: "#F8F8F9",
    borderLeftWidth: 2,
    borderLeftColor: "#F2B8BD",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 12,
    marginBottom: 16,
  },

  overviewTitle: {
    fontSize: 17,
    fontWeight: "500",
    color: "#303438",
  },

  overviewDescription: {
    marginTop: 11,
    fontSize: 10,
    lineHeight: 15,
    color: "#9B9FA5",
  },

  overviewDivider: {
    height: 1,
    backgroundColor: "#C9CDD1",
    marginTop: 10,
    marginBottom: 12,
  },

  overviewStats: {
    flexDirection: "row",
    alignItems: "center",
  },

  overviewStat: {
    flex: 1,
    alignItems: "center",
  },

  overviewStatValue: {
    fontSize: 25,
    fontWeight: "500",
    color: "#78ACEE",
  },

  overviewStatLabel: {
    marginTop: 4,
    fontSize: 8,
    color: "#92979E",
  },

  statDivider: {
    width: 1,
    height: 47,
    backgroundColor: "#D6D9DC",
  },

  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1C1C5",
    borderRadius: 17,
    paddingHorizontal: 13,
    paddingTop: 14,
    paddingBottom: 13,
    marginBottom: 16,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#252A2E",
  },

  cardDivider: {
    height: 1,
    backgroundColor: "#EBEDEF",
    marginTop: 12,
    marginBottom: 12,
  },

  chartContainer: {
    width: "100%",
    height: 160,
  },

  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },

  dayText: {
    width: "14.2%",
    textAlign: "center",
    fontSize: 8,
    color: "#9A9FA5",
  },

  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  legendText: {
    fontSize: 7,
    color: "#666C72",
  },

  emotionsContainer: {
    gap: 12,
  },

  emotionItem: {
    width: "100%",
  },

  emotionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  emotionName: {
    fontSize: 10,
    color: "#44494E",
  },

  emotionPercentage: {
    fontSize: 10,
    color: "#292D31",
  },

  progressTrack: {
    width: "100%",
    height: 7,
    backgroundColor: "#ECEDEF",
    borderRadius: 999,
  },

  progressValueContainer: {
    height: 7,
    position: "relative",
  },

  progressFill: {
    width: "100%",
    height: 7,
    borderRadius: 999,
  },

  progressEmoji: {
    position: "absolute",
    right: -7,
    top: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },

  progressEmojiText: {
    fontSize: 13,
  },

  normalSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#292D31",
    marginBottom: 11,
  },

  attentionCasesContainer: {
    gap: 11,
    marginBottom: 17,
  },

  caseCard: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E8EA",
    borderRadius: 17,
    paddingHorizontal: 11,
    paddingTop: 11,
    paddingBottom: 10,
    overflow: "hidden",
  },

  caseDecoration: {
    position: "absolute",
    width: 65,
    height: 65,
    borderRadius: 32.5,
    right: -17,
    top: -17,
    backgroundColor: "#FFF0F1",
  },

  caseTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  childInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  childAvatarWrapper: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    backgroundColor: "#FFF1EC",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0DFD8",
    marginRight: 9,
  },

  childAvatar: {
    width: "100%",
    height: "100%",
  },

  childText: {
    flex: 1,
  },

  childName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#25282B",
  },

  childId: {
    marginTop: 2,
    fontSize: 8.5,
    color: "#777D84",
  },

  priorityBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    zIndex: 2,
  },

  highPriorityBadge: {
    backgroundColor: "#FFE0E2",
  },

  mediumPriorityBadge: {
    backgroundColor: "#DDF8E2",
  },

  priorityText: {
    fontSize: 8,
    fontWeight: "500",
  },

  highPriorityText: {
    color: "#F05D65",
  },

  mediumPriorityText: {
    color: "#45B65D",
  },

  indicatorText: {
    marginTop: 8,
    fontSize: 10,
    color: "#74ADE2",
  },

  detailsButtonWrapper: {
    marginTop: 9,
  },

  detailsButton: {
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  detailsButtonText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#25282C",
  },

  aiSummaryCard: {
    backgroundColor: "#DEF6EA",
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
    marginBottom: 18,
  },

  aiTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  aiTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#36AF51",
  },

  aiText: {
    marginTop: 13,
    fontSize: 10.5,
    lineHeight: 17,
    color: "#55B96A",
  },

  improvementsContainer: {
    gap: 10,
    marginBottom: 20,
  },

  improvementCard: {
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F8",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  improvementIcon: {
    width: 39,
    height: 39,
    borderRadius: 10,
    backgroundColor: "#D8FFDF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  improvementText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: "#3D4247",
  },

  improvementName: {
    fontWeight: "700",
    color: "#272B2F",
  },

  allCasesButtonWrapper: {
    width: "100%",
  },

  allCasesButton: {
    height: 51,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  allCasesButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#22262A",
  },
});

