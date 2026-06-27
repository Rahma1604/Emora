import React, { useMemo } from "react";
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
import Svg, { Circle, G } from "react-native-svg";

const girlPhoto = require("../../assets/images/images/girl.png");
const boyPhoto = require("../../assets/images/images/boy.png");

type IoniconName = keyof typeof Ionicons.glyphMap;

type StatisticItem = {
  title: string;
  value: string;
  valueColor: string;
};

type DistributionItem = {
  name: string;
  value: number;
  color: string;
};

type BehavioralPattern = {
  title: string;
  prevalence: string;
  icon: IoniconName;
  iconColor: string;
  iconBackground: string;
  trend: "up" | "down";
};

type AttentionCase = {
  name: string;
  childId: string;
  indicator: string;
  priority: "High Priority" | "Medium Priority";
  avatar: number;
};

type BottomNavItemProps = {
  icon: IoniconName;
  activeIcon: IoniconName;
  label: string;
  active?: boolean;
  onPress: () => void;
};

type WeeklyTrendItem = {
  day: string;
  anxiety: number;
  stress: number;
  calm: number;
};

type WeeklyEmotionKey =
  | "anxiety"
  | "stress"
  | "calm";

type WeeklyLegendItem = {
  key: WeeklyEmotionKey;
  label: string;
  color: string;
};

const statistics: StatisticItem[] = [
  {
    title: "TOTAL CASES",
    value: "58",
    valueColor: "#2084D4",
  },
  {
    title: "ACTIVE CHILDREN",
    value: "12",
    valueColor: "#159647",
  },
  {
    title: "Reviewed Cases",
    value: "38",
    valueColor: "#2084D4",
  },
  {
    title: "Pending Cases",
    value: "12",
    valueColor: "#22262A",
  },
];

const distributionData: DistributionItem[] = [
  {
    name: "Anxiety",
    value: 42,
    color: "#E3262E",
  },
  {
    name: "Stress",
    value: 31,
    color: "#FF9100",
  },
  {
    name: "Calm",
    value: 18,
    color: "#75AEE1",
  },
  {
    name: "Happy",
    value: 9,
    color: "#55B96A",
  },
];

const behavioralPatterns: BehavioralPattern[] = [
  {
    title: "School Anxiety",
    prevalence: "85% prevalence",
    icon: "school-outline",
    iconColor: "#F15D65",
    iconBackground: "#FFE7E8",
    trend: "up",
  },
  {
    title: "Sleep Disturbance",
    prevalence: "60% prevalence",
    icon: "moon-outline",
    iconColor: "#338CF0",
    iconBackground: "#EAF4FF",
    trend: "down",
  },
  {
    title: "Social Withdrawal",
    prevalence: "45% prevalence",
    icon: "people-outline",
    iconColor: "#43B25B",
    iconBackground: "#DDF8E2",
    trend: "up",
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

/*
  الأرقام هنا تمثل عدد التحليلات اليومية
  المصنفة تحت كل حالة عاطفية.
*/
const weeklyTrendData: WeeklyTrendItem[] = [
  {
    day: "Mon",
    anxiety: 3,
    stress: 2,
    calm: 1,
  },
  {
    day: "Tue",
    anxiety: 4,
    stress: 3,
    calm: 2,
  },
  {
    day: "Wed",
    anxiety: 2,
    stress: 3,
    calm: 1,
  },
  {
    day: "Thu",
    anxiety: 5,
    stress: 4,
    calm: 2,
  },
  {
    day: "Fri",
    anxiety: 3,
    stress: 2,
    calm: 2,
  },
  {
    day: "Sat",
    anxiety: 4,
    stress: 3,
    calm: 1,
  },
  {
    day: "Sun",
    anxiety: 2,
    stress: 2,
    calm: 1,
  },
];

const weeklyEmotionLegend: WeeklyLegendItem[] = [
  {
    key: "anxiety",
    label: "Anxiety",
    color: "#EF6C73",
  },
  {
    key: "stress",
    label: "Stress",
    color: "#F6B65F",
  },
  {
    key: "calm",
    label: "Calm",
    color: "#75AEE1",
  },
];

const WEEKLY_CHART_MAX_VALUE = 12;
const WEEKLY_CHART_HEIGHT = 132;

export default function DoctorInsightsScreen() {
  const openHome = () => {
    router.replace("/doctor/home" as Href);
  };

  const openHistory = () => {
    router.replace("/doctor/history" as Href);
  };

  const openProfile = () => {
    router.replace("/doctor/profile" as Href);
  };

  const openWeeklyReport = () => {
    router.push("/doctor/weekly-summary" as Href);
  };

  const openCase = (
    childName: string,
    childId: string
  ) => {
    router.push(
      `/doctor/review-case?child=${encodeURIComponent(
        childName
      )}&childId=${encodeURIComponent(
        childId
      )}` as Href
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
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.7}
                onPress={() => router.back()}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color="#1F2937"
                />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>
                Insights
              </Text>

              <View style={styles.headerPlaceholder} />
            </View>

            {/* Statistics */}
            <View style={styles.statisticsGrid}>
              {statistics.map((item) => (
                <StatisticCard
                  key={item.title}
                  {...item}
                />
              ))}
            </View>

            {/* AI Insight Summary */}
            <View style={styles.aiSummaryCard}>
              <View style={styles.aiTitleRow}>
                <Ionicons
                  name="sparkles"
                  size={20}
                  color="#40B75B"
                />

                <Text style={styles.aiTitle}>
                  AI INSIGHT SUMMARY
                </Text>
              </View>

              <Text style={styles.aiSummaryText}>
                Anxiety-related indicators continue to be
                the most common emotional pattern this
                week. Most children demonstrate stable
                progress, while a smaller group may benefit
                from additional monitoring and doctor
                follow-up.
              </Text>
            </View>

            {/* Emotional Distribution */}
            <View style={styles.chartCard}>
              <Text style={styles.cardTitle}>
                Emotional Distribution
              </Text>

              <Text style={styles.chartDescription}>
                Distribution of classified emotions across
                submitted analyses.
              </Text>

              <View style={styles.distributionContent}>
                <DonutChart data={distributionData} />

                <View style={styles.distributionLegend}>
                  {distributionData.map((item) => (
                    <View
                      key={item.name}
                      style={styles.legendItem}
                    >
                      <View
                        style={[
                          styles.legendDot,
                          {
                            backgroundColor: item.color,
                          },
                        ]}
                      />

                      <Text style={styles.legendLabel}>
                        {item.name} ({item.value}%)
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Weekly Emotional Trends */}
            <WeeklyEmotionalTrendChart
              data={weeklyTrendData}
            />

            {/* Common Behavioral Patterns */}
            <Text style={styles.sectionTitle}>
              Common Behavioral Patterns
            </Text>

            <View style={styles.patternsContainer}>
              {behavioralPatterns.map((item) => (
                <View
                  key={item.title}
                  style={styles.patternItem}
                >
                  <View
                    style={[
                      styles.patternIcon,
                      {
                        backgroundColor:
                          item.iconBackground,
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={21}
                      color={item.iconColor}
                    />
                  </View>

                  <View
                    style={
                      styles.patternTextContainer
                    }
                  >
                    <Text style={styles.patternTitle}>
                      {item.title}
                    </Text>

                    <Text
                      style={styles.patternPrevalence}
                    >
                      {item.prevalence}
                    </Text>
                  </View>

                  <Ionicons
                    name={
                      item.trend === "up"
                        ? "trending-up-outline"
                        : "trending-down-outline"
                    }
                    size={19}
                    color={
                      item.trend === "up"
                        ? "#F0525B"
                        : "#45B65D"
                    }
                  />
                </View>
              ))}
            </View>

            {/* Achievements */}
            <View style={styles.achievementsCard}>
              <Text style={styles.sectionTitle}>
                Achievements
              </Text>

              <View
                style={styles.achievementsContainer}
              >
                <AchievementChip
                  icon="shield-checkmark-outline"
                  label="100+ Cases Reviewed"
                  backgroundColor="#E6E8FF"
                  color="#4852B8"
                />

                <AchievementChip
                  icon="trending-up-outline"
                  label="Top Response Rate"
                  backgroundColor="#E2F3FC"
                  color="#4C859E"
                />

                <AchievementChip
                  icon="ribbon-outline"
                  label="Verified Doctor"
                  backgroundColor="#E8F4E8"
                  color="#557A59"
                />
              </View>
            </View>

            {/* Children Requiring Attention */}
            <Text style={styles.sectionTitle}>
              Children Requiring Attention
            </Text>

            <View style={styles.attentionContainer}>
              {attentionCases.map((item) => (
                <AttentionCaseCard
                  key={item.childId}
                  {...item}
                  onPress={() =>
                    openCase(
                      item.name,
                      item.childId
                    )
                  }
                />
              ))}
            </View>

            {/* Your Performance */}
            <View style={styles.performanceCard}>
              <Text style={styles.performanceTitle}>
                Your Performance
              </Text>

              <View style={styles.performanceStats}>
                <PerformanceItem
                  value="38"
                  label="Cases Reviewed"
                  valueColor="#202F99"
                />

                <PerformanceItem
                  value="32"
                  label="Responses Sent"
                  valueColor="#202F99"
                />

                <PerformanceItem
                  value="8 min"
                  label="Avg Review"
                  valueColor="#202522"
                />
              </View>
            </View>

            {/* Weekly Report */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={openWeeklyReport}
              style={styles.weeklyReportButton}
            >
              <Text
                style={
                  styles.weeklyReportButtonText
                }
              >
                View Weekly Report
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Bottom Navigation */}
          <View style={styles.bottomNavigation}>
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
              onPress={openHistory}
            />

            <BottomNavItem
              icon="stats-chart-outline"
              activeIcon="stats-chart"
              label="Insights"
              active
              onPress={() => undefined}
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

function StatisticCard({
  title,
  value,
  valueColor,
}: StatisticItem) {
  return (
    <View style={styles.statisticCard}>
      <Text style={styles.statisticTitle}>
        {title}
      </Text>

      <Text
        style={[
          styles.statisticValue,
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

function DonutChart({
  data,
}: {
  data: DistributionItem[];
}) {
  const size = 126;
  const strokeWidth = 28;
  const radius =
    (size - strokeWidth) / 2;

  const circumference =
    2 * Math.PI * radius;

  let accumulatedValue = 0;

  return (
    <View style={styles.donutWrapper}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <G
          rotation="-90"
          origin={`${size / 2}, ${
            size / 2
          }`}
        >
          {data.map((item) => {
            const segmentLength =
              (item.value / 100) *
              circumference;

            const strokeDashoffset =
              -(
                (accumulatedValue / 100) *
                circumference
              );

            accumulatedValue +=
              item.value;

            return (
              <Circle
                key={item.name}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segmentLength} ${
                  circumference -
                  segmentLength
                }`}
                strokeDashoffset={
                  strokeDashoffset
                }
                strokeLinecap="butt"
              />
            );
          })}
        </G>
      </Svg>

      <View style={styles.donutCenter}>
        <Text
          style={styles.donutCenterText}
        >
          100%
        </Text>
      </View>
    </View>
  );
}

function WeeklyEmotionalTrendChart({
  data,
}: {
  data: WeeklyTrendItem[];
}) {
  const enhancedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      total:
        item.anxiety +
        item.stress +
        item.calm,
    }));
  }, [data]);

  const peakDay = useMemo(() => {
    return enhancedData.reduce(
      (highest, current) =>
        current.total > highest.total
          ? current
          : highest,
      enhancedData[0]
    );
  }, [enhancedData]);

  const weeklyTotals = useMemo(() => {
    return enhancedData.reduce(
      (totals, item) => ({
        anxiety:
          totals.anxiety +
          item.anxiety,

        stress:
          totals.stress +
          item.stress,

        calm:
          totals.calm +
          item.calm,

        all:
          totals.all +
          item.total,
      }),
      {
        anxiety: 0,
        stress: 0,
        calm: 0,
        all: 0,
      }
    );
  }, [enhancedData]);

  const getSegmentHeight = (
    value: number
  ) => {
    return (
      (value /
        WEEKLY_CHART_MAX_VALUE) *
      WEEKLY_CHART_HEIGHT
    );
  };

  return (
    <View style={styles.weeklyTrendCard}>
      <View style={styles.weeklyTrendHeader}>
        <View style={styles.weeklyTrendTitleArea}>
          <Text style={styles.cardTitle}>
            Weekly Emotional Trends
          </Text>

          <Text
            style={
              styles.weeklyTrendDescription
            }
          >
            Number of daily analyses by
            dominant emotion
          </Text>
        </View>

        <View style={styles.weeklyPeriodBadge}>
          <Ionicons
            name="calendar-outline"
            size={13}
            color="#66859D"
          />

          <Text
            style={
              styles.weeklyPeriodText
            }
          >
            This Week
          </Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.weeklyLegend}>
        {weeklyEmotionLegend.map(
          (item) => (
            <View
              key={item.key}
              style={styles.weeklyLegendItem}
            >
              <View
                style={[
                  styles.weeklyLegendDot,
                  {
                    backgroundColor:
                      item.color,
                  },
                ]}
              />

              <Text
                style={
                  styles.weeklyLegendLabel
                }
              >
                {item.label}
              </Text>
            </View>
          )
        )}
      </View>

      {/* Chart */}
      <View style={styles.weeklyChartArea}>
        {/* Y Axis */}
        <View style={styles.yAxisContainer}>
          <Text style={styles.yAxisLabel}>
            12
          </Text>

          <Text style={styles.yAxisLabel}>
            8
          </Text>

          <Text style={styles.yAxisLabel}>
            4
          </Text>

          <Text style={styles.yAxisLabel}>
            0
          </Text>
        </View>

        {/* Grid and Bars */}
        <View style={styles.chartContent}>
          <View style={styles.weeklyGrid}>
            <View
              style={[
                styles.gridLine,
                styles.gridLineTop,
              ]}
            />

            <View
              style={[
                styles.gridLine,
                styles.gridLineSecond,
              ]}
            />

            <View
              style={[
                styles.gridLine,
                styles.gridLineThird,
              ]}
            />

            <View
              style={[
                styles.gridLine,
                styles.gridLineBottom,
              ]}
            />
          </View>

          <View style={styles.weeklyBarsContainer}>
            {enhancedData.map((item) => {
              const isPeakDay =
                item.day === peakDay.day;

              return (
                <View
                  key={item.day}
                  style={
                    styles.weeklyBarColumn
                  }
                >
                  <Text
                    style={[
                      styles.weeklyBarTotal,
                      isPeakDay &&
                        styles.weeklyBarTotalPeak,
                    ]}
                  >
                    {item.total}
                  </Text>

                  <View
                    style={[
                      styles.weeklyBarTrack,
                      isPeakDay &&
                        styles.weeklyBarTrackPeak,
                    ]}
                  >
                    <View
                      style={[
                        styles.weeklyBarSegment,
                        styles.calmSegment,
                        {
                          height:
                            getSegmentHeight(
                              item.calm
                            ),
                        },
                      ]}
                    />

                    <View
                      style={[
                        styles.weeklyBarSegment,
                        styles.stressSegment,
                        {
                          height:
                            getSegmentHeight(
                              item.stress
                            ),
                        },
                      ]}
                    />

                    <View
                      style={[
                        styles.weeklyBarSegment,
                        styles.anxietySegment,
                        {
                          height:
                            getSegmentHeight(
                              item.anxiety
                            ),
                        },
                      ]}
                    />
                  </View>

                  <Text
                    style={[
                      styles.weeklyDayLabel,
                      isPeakDay &&
                        styles.weeklyDayLabelPeak,
                    ]}
                  >
                    {item.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Weekly Summary */}
      <View style={styles.weeklyChartSummary}>
        <View style={styles.peakDayCard}>
          <View style={styles.peakDayIcon}>
            <Ionicons
              name="trending-up-outline"
              size={18}
              color="#D77C45"
            />
          </View>

          <View style={styles.peakDayContent}>
            <Text style={styles.peakDayLabel}>
              Highest activity
            </Text>

            <Text style={styles.peakDayValue}>
              {peakDay.day} · {peakDay.total} analyses
            </Text>
          </View>
        </View>

        <View style={styles.totalAnalysesCard}>
          <Text
            style={styles.totalAnalysesValue}
          >
            {weeklyTotals.all}
          </Text>

          <Text
            style={styles.totalAnalysesLabel}
          >
            Weekly analyses
          </Text>
        </View>
      </View>

      {/* Emotion Totals */}
      <View
        style={styles.weeklyEmotionTotals}
      >
        <WeeklyEmotionTotal
          label="Anxiety"
          value={weeklyTotals.anxiety}
          color="#EF6C73"
          backgroundColor="#FFF0F1"
        />

        <WeeklyEmotionTotal
          label="Stress"
          value={weeklyTotals.stress}
          color="#D99133"
          backgroundColor="#FFF5E8"
        />

        <WeeklyEmotionTotal
          label="Calm"
          value={weeklyTotals.calm}
          color="#4B8EC8"
          backgroundColor="#EAF5FF"
        />
      </View>

      <View style={styles.chartInformation}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color="#6E91AA"
        />

        <Text
          style={
            styles.chartInformationText
          }
        >
          Each stacked bar shows the number of
          analyses classified under each dominant
          emotion on that day.
        </Text>
      </View>
    </View>
  );
}

function WeeklyEmotionTotal({
  label,
  value,
  color,
  backgroundColor,
}: {
  label: string;
  value: number;
  color: string;
  backgroundColor: string;
}) {
  return (
    <View
      style={[
        styles.weeklyEmotionTotalCard,
        {
          backgroundColor,
        },
      ]}
    >
      <Text
        style={[
          styles.weeklyEmotionTotalValue,
          {
            color,
          },
        ]}
      >
        {value}
      </Text>

      <Text
        style={
          styles.weeklyEmotionTotalLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

function AchievementChip({
  icon,
  label,
  backgroundColor,
  color,
}: {
  icon: IoniconName;
  label: string;
  backgroundColor: string;
  color: string;
}) {
  return (
    <View
      style={[
        styles.achievementChip,
        {
          backgroundColor,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={14}
        color={color}
      />

      <Text
        style={[
          styles.achievementText,
          {
            color,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function AttentionCaseCard({
  name,
  childId,
  indicator,
  priority,
  avatar,
  onPress,
}: AttentionCase & {
  onPress: () => void;
}) {
  const isHighPriority =
    priority === "High Priority";

  return (
    <View style={styles.caseCard}>
      <View style={styles.caseDecoration} />

      <View style={styles.caseHeader}>
        <View
          style={styles.childInformation}
        >
          <View style={styles.avatarWrapper}>
            <Image
              source={avatar}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>

          <View
            style={styles.childTextContainer}
          >
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
        onPress={onPress}
        style={styles.detailsButtonWrapper}
      >
        <LinearGradient
          colors={[
            "#A4D1F6",
            "#F5ADB1",
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.detailsButton}
        >
          <Text
            style={styles.detailsButtonText}
          >
            Review Case
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function PerformanceItem({
  value,
  label,
  valueColor,
}: {
  value: string;
  label: string;
  valueColor: string;
}) {
  return (
    <View style={styles.performanceItem}>
      <Text
        style={[
          styles.performanceValue,
          {
            color: valueColor,
          },
        ]}
      >
        {value}
      </Text>

      <Text
        style={styles.performanceLabel}
      >
        {label}
      </Text>
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
        name={active ? activeIcon : icon}
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
    paddingTop: 4,
    paddingBottom: 96,
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
    fontSize: 18,
    fontWeight: "600",
    color: "#202428",
  },

  headerPlaceholder: {
    width: 40,
  },

  statisticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 9,
    marginBottom: 16,
  },

  statisticCard: {
    width: "48.5%",
    minHeight: 67,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4EDF3",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 10,
    shadowColor: "#9DABB5",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 1,
  },

  statisticTitle: {
    fontSize: 8.5,
    color: "#687078",
  },

  statisticValue: {
    marginTop: 5,
    fontSize: 17,
    fontWeight: "700",
  },

  aiSummaryCard: {
    backgroundColor: "#DEF6EA",
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 17,
    marginBottom: 17,
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

  aiSummaryText: {
    marginTop: 13,
    fontSize: 10.5,
    lineHeight: 17,
    color: "#55B96A",
  },

  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 15,
    paddingBottom: 15,
    marginBottom: 17,
    shadowColor: "#9EA9B1",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#292D31",
  },

  chartDescription: {
    marginTop: 5,
    fontSize: 8.5,
    lineHeight: 13,
    color: "#969CA2",
  },

  distributionContent: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  donutWrapper: {
    width: 126,
    height: 126,
    justifyContent: "center",
    alignItems: "center",
  },

  donutCenter: {
    position: "absolute",
    width: 49,
    height: 49,
    borderRadius: 24.5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  donutCenterText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#777D84",
  },

  distributionLegend: {
    gap: 8,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },

  legendLabel: {
    fontSize: 9.5,
    color: "#34383C",
  },

  weeklyTrendCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    paddingHorizontal: 13,
    paddingTop: 15,
    paddingBottom: 14,
    marginBottom: 18,
    shadowColor: "#9EA9B1",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },

  weeklyTrendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  weeklyTrendTitleArea: {
    flex: 1,
    paddingRight: 10,
  },

  weeklyTrendDescription: {
    marginTop: 5,
    fontSize: 8.5,
    lineHeight: 13,
    color: "#91989E",
  },

  weeklyPeriodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF6FD",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  weeklyPeriodText: {
    fontSize: 7.5,
    fontWeight: "600",
    color: "#66859D",
  },

  weeklyLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 14,
    marginBottom: 8,
  },

  weeklyLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  weeklyLegendDot: {
    width: 9,
    height: 9,
    borderRadius: 3,
  },

  weeklyLegendLabel: {
    fontSize: 8.5,
    color: "#555C62",
  },

  weeklyChartArea: {
    height: 188,
    flexDirection: "row",
    marginTop: 4,
  },

  yAxisContainer: {
    width: 21,
    height: 158,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 4,
    paddingBottom: 1,
    paddingRight: 5,
  },

  yAxisLabel: {
    fontSize: 7,
    color: "#969CA2",
  },

  chartContent: {
    flex: 1,
    position: "relative",
  },

  weeklyGrid: {
    position: "absolute",
    top: 4,
    left: 0,
    right: 0,
    height: 154,
  },

  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#ECEFF1",
  },

  gridLineTop: {
    top: 0,
  },

  gridLineSecond: {
    top: 51,
  },

  gridLineThird: {
    top: 102,
  },

  gridLineBottom: {
    bottom: 0,
    backgroundColor: "#DDE3E7",
  },

  weeklyBarsContainer: {
    height: 188,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  weeklyBarColumn: {
    width: "13.3%",
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  weeklyBarTotal: {
    marginBottom: 4,
    fontSize: 7.5,
    fontWeight: "600",
    color: "#747B82",
  },

  weeklyBarTotalPeak: {
    color: "#D97855",
    fontWeight: "700",
  },

  weeklyBarTrack: {
    width: 24,
    height: WEEKLY_CHART_HEIGHT,
    justifyContent: "flex-end",
    overflow: "hidden",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: "#F5F7F8",
  },

  weeklyBarTrackPeak: {
    borderWidth: 1,
    borderColor: "#F0B8A5",
    backgroundColor: "#FFF9F5",
  },

  weeklyBarSegment: {
    width: "100%",
    minHeight: 2,
  },

  calmSegment: {
    backgroundColor: "#75AEE1",
  },

  stressSegment: {
    backgroundColor: "#F6B65F",
  },

  anxietySegment: {
    backgroundColor: "#EF6C73",
  },

  weeklyDayLabel: {
    marginTop: 7,
    fontSize: 7.5,
    color: "#6A7178",
  },

  weeklyDayLabelPeak: {
    fontWeight: "700",
    color: "#D97855",
  },

  weeklyChartSummary: {
    flexDirection: "row",
    gap: 9,
    marginTop: 7,
  },

  peakDayCard: {
    flex: 1,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF4E9",
    borderRadius: 11,
    paddingHorizontal: 9,
  },

  peakDayIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },

  peakDayContent: {
    flex: 1,
  },

  peakDayLabel: {
    fontSize: 7.5,
    color: "#9A7A61",
  },

  peakDayValue: {
    marginTop: 3,
    fontSize: 9.5,
    fontWeight: "700",
    color: "#795B43",
  },

  totalAnalysesCard: {
    width: 88,
    minHeight: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF6FD",
    borderRadius: 11,
  },

  totalAnalysesValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4D8EC1",
  },

  totalAnalysesLabel: {
    marginTop: 2,
    fontSize: 7,
    color: "#708B9F",
  },

  weeklyEmotionTotals: {
    flexDirection: "row",
    gap: 7,
    marginTop: 9,
  },

  weeklyEmotionTotalCard: {
    flex: 1,
    minHeight: 49,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },

  weeklyEmotionTotalValue: {
    fontSize: 14,
    fontWeight: "700",
  },

  weeklyEmotionTotalLabel: {
    marginTop: 2,
    fontSize: 7.5,
    color: "#6D7379",
  },

  chartInformation: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#F2F8FC",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 9,
    marginTop: 10,
  },

  chartInformationText: {
    flex: 1,
    fontSize: 7.8,
    lineHeight: 12,
    color: "#6D8799",
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#292D31",
    marginBottom: 11,
  },

  patternsContainer: {
    gap: 9,
    marginBottom: 17,
  },

  patternItem: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
  },

  patternIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  patternTextContainer: {
    flex: 1,
  },

  patternTitle: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#292D31",
  },

  patternPrevalence: {
    marginTop: 4,
    fontSize: 9,
    color: "#6E747B",
  },

  achievementsCard: {
    backgroundColor: "#F7F7F8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 13,
    paddingBottom: 13,
    marginBottom: 18,
  },

  achievementsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  achievementChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  achievementText: {
    fontSize: 8.5,
    fontWeight: "500",
  },

  attentionContainer: {
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
    width: 67,
    height: 67,
    borderRadius: 33.5,
    right: -18,
    top: -17,
    backgroundColor: "#FFF0F1",
  },

  caseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  childInformation: {
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
    borderColor: "#EEDDD7",
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
    zIndex: 2,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  highPriorityBadge: {
    backgroundColor: "#FFE0E2",
  },

  mediumPriorityBadge: {
    backgroundColor: "#DDF8E2",
  },

  priorityText: {
    fontSize: 8,
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
    justifyContent: "center",
    alignItems: "center",
  },

  detailsButtonText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#25282C",
  },

  performanceCard: {
    backgroundColor: "#F2EEFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 13,
    paddingBottom: 14,
    marginBottom: 13,
  },

  performanceTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#292D31",
  },

  performanceStats: {
    flexDirection: "row",
    marginTop: 17,
  },

  performanceItem: {
    flex: 1,
    alignItems: "center",
  },

  performanceValue: {
    fontSize: 21,
    fontWeight: "700",
  },

  performanceLabel: {
    marginTop: 4,
    fontSize: 8,
    color: "#60656B",
    textAlign: "center",
  },

  weeklyReportButton: {
    width: "100%",
    height: 52,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#A9D0F3",
    marginBottom: 4,
  },

  weeklyReportButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#22262A",
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