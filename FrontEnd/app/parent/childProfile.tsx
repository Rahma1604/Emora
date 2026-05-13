import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ChildProfile() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Child Profile</Text>

          <View style={{ width: 24 }} />
        </View>

        {/* Child Info */}
        <View style={styles.childSection}>
          <Image
            source={require("../../assets/images/images/childPhoto.png")}
            style={styles.childImage}
          />

          <Text style={styles.childName}>Lily</Text>

          <Text style={styles.childAge}>(5 years old)</Text>

          <Text style={styles.childDescription}>
            Child shows slight improvement in emotional behavior
          </Text>
        </View>

        {/* Quick Summary */}
        <Text style={styles.sectionTitle}>Quick Summary</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Current Emotion</Text>
            <Text style={styles.value}>Calm</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Long-term Trend</Text>
            <Text style={styles.value}>Improving</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Total Entries</Text>
            <Text style={styles.value}>8</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Last Analysis</Text>
            <Text style={styles.value}>May 12, 2026</Text>
          </View>
        </View>

        {/* Latest Analysis */}
        <Text style={styles.sectionTitle}>Latest Analysis</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Dominant Emotion</Text>
            <Text style={styles.value}>Anxiety</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Confidence</Text>
            <Text style={styles.value}>82%</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>

            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending Review</Text>
            </View>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>
              Summary : Recent entries show mild anxiety indicators with
              gradual improvement.
            </Text>
          </View>
        </View>

        {/* Doctor Insight */}
        <Text style={styles.sectionTitle}>Latest Doctor Insight</Text>

        <View style={styles.card}>
          <View style={styles.doctorRow}>
            <Image
              source={require("../../assets/images/images/doctorPhoto.png")}
              style={styles.doctorImage}
            />

            <View>
              <Text style={styles.doctorName}>Dr. Ahmed Hassan</Text>

              <Text style={styles.doctorRole}>
                Child Psychology Specialist
              </Text>
            </View>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>
              Summary : Recent entries show mild anxiety indicators with
              gradual improvement.
            </Text>
          </View>

          <Text style={styles.date}>May 10, 2026</Text>
        </View>

        {/* Recent Entries */}
        <Text style={styles.sectionTitle}>Recent Entries</Text>

        <View style={styles.entryCard}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryDate}>May 12, 2026</Text>

            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending Review</Text>
            </View>
          </View>

          <Text style={styles.entryText}>Text Entry · Anxiety</Text>
        </View>

        <View style={styles.entryCard}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryDate}>May 08, 2026</Text>

            <View style={styles.reviewedBadge}>
              <Text style={styles.reviewedText}>Reviewed</Text>
            </View>
          </View>

          <Text style={styles.entryText}>Text Entry · Calm</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },

  childSection: {
    alignItems: "center",
    marginBottom: 28,
  },

  childImage: {
    width: 90,
    height: 90,
    borderRadius: 50,
    marginBottom: 10,
  },

  childName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },

  childAge: {
    fontSize: 13,
    color: "#666",
    marginTop: 3,
  },

  childDescription: {
    textAlign: "center",
    color: "#777",
    marginTop: 10,
    lineHeight: 20,
    width: "85%",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
    color: "#000",
  },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 18,
    padding: 15,
    marginBottom: 22,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,

    elevation: 2,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },

  label: {
    color: "#888",
    fontSize: 13,
  },

  value: {
    color: "#000",
    fontSize: 13,
    fontWeight: "500",
  },

  pendingBadge: {
    backgroundColor: "#FBC0BF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  pendingText: {
    color: "#A14D4B",
    fontSize: 11,
    fontWeight: "600",
  },

  reviewedBadge: {
    backgroundColor: "#B9D8F6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  reviewedText: {
    color: "#32689B",
    fontSize: 11,
    fontWeight: "600",
  },

  summaryBox: {
    backgroundColor: "#FFF4F4",
    borderColor: "#FBC0BF",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 15,
  },

  summaryText: {
    color: "#666",
    fontSize: 12,
    lineHeight: 18,
  },

  doctorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  doctorImage: {
    width: 55,
    height: 55,
    borderRadius: 30,
  },

  doctorName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },

  doctorRole: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },

  date: {
    textAlign: "right",
    color: "#999",
    fontSize: 11,
    marginTop: 12,
  },

  entryCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },

  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  entryDate: {
    color: "#999",
    fontSize: 12,
  },

  entryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
});