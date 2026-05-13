import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";

type ActivityItem = {
  id: string;
  childName: string;
  date: string;
  type: string;
  emotion: string;
  description: string;
  status: "Pending Review" | "Reviewed" | "Closed";
  avatarColor: string;
};

const STATIC_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    childName: "Lily",
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
    childName: "Samy",
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
    childName: "Samy",
    date: "May 3, 2026",
    type: "Text Entry",
    emotion: "Stress",
    description:
      "The analysis indicates a decrease in stress-related indicators, with improved emotional responses during daily interactions and activities.",
    status: "Closed",
    avatarColor: "#B9D8F6",
  },
];

const STATUS_COLORS: Record<string, string> = {
  "Pending Review": "#FBC0BF",
  Reviewed: "#B8F0C8",
  Closed: "#D0D8F0",
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  "Pending Review": "#C0504D",
  Reviewed: "#2E7D32",
  Closed: "#5C6BC0",
};

const FILTERS = ["All Children", "All Statuses", "Last 30 Days"];

export default function ActivityHistory() {
  const [activeFilter, setActiveFilter] = useState("All Children");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Background gradient */}
        <View style={styles.topGradientWrapper}>
          <LinearGradient
            colors={[
              "rgba(185,216,246,0.35)",
              "rgba(255,255,255,0.10)",
              "rgba(251,192,191,0.35)",
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={[
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.6)",
              "rgba(255,255,255,1)",
            ]}
            locations={[0, 0.6, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Activity History</Text>
          <Text style={styles.headerSubtitle}>
            Track All Previous Analyses And Updates
          </Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={styles.filterTab}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
              {activeFilter === filter && (
                <View style={styles.filterUnderline} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Activity List */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {STATIC_ACTIVITIES.map((item) => (
            <View key={item.id} style={styles.card}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  {/* Avatar */}
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: item.avatarColor },
                    ]}
                  >
                    <Ionicons name="happy" size={22} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.childName}>{item.childName}</Text>
                    <Text style={styles.dateText}>{item.date}</Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: STATUS_COLORS[item.status] + "55" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: STATUS_TEXT_COLORS[item.status] },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Type & Emotion */}
              <Text style={styles.typeText}>
                {item.type} ·{" "}
                <Text style={styles.emotionText}>{item.emotion}</Text>
              </Text>

              {/* Description */}
              <Text style={styles.descText}>{item.description}</Text>
            </View>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Nav */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/parent/parentHome")}
          >
            <Feather name="home" size={20} color="#999" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Feather name="list" size={20} color="#222" />
            <Text style={[styles.navText, styles.activeNavText]}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.centerButtonWrapper}
            onPress={() => router.push("/parent/add-child")}
          >
            <LinearGradient
              colors={["#B9D8F6", "#FBC0BF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.centerButton}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Feather name="search" size={20} color="#999" />
            <Text style={styles.navText}>Search</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/parent/profile")}
          >
            <Feather name="user" size={20} color="#999" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },

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
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
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
    fontSize: 13,
    color: "#9A9A9A",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#222",
    fontWeight: "700",
  },
  filterUnderline: {
    marginTop: 4,
    height: 2,
    width: "100%",
    backgroundColor: "#FBC0BF",
    borderRadius: 2,
  },

  list: { flex: 1, paddingHorizontal: 16 },
  listContent: { paddingTop: 4 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  dateText: {
    fontSize: 12,
    color: "#9A9A9A",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  typeText: {
    fontSize: 13,
    color: "#7BB8E8",
    fontWeight: "600",
    marginBottom: 8,
  },
  emotionText: {
    color: "#7BB8E8",
  },
  descText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
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
    shadowOffset: { width: 0, height: 2 },
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
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
  activeNavText: {
    color: "#222",
    fontWeight: "600",
  },
  centerButtonWrapper: { marginTop: -30 },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
});