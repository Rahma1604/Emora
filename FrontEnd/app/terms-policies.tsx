import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TermsPoliciesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Terms & Policies</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Image
          source={require("../assets/images/images/terms&policies photo.jpg")}
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={styles.description}>
          By accessing or using our platform, website, or mobile application,
          you agree to comply with and be bound by the following terms and
          conditions. These terms govern your use of our services, including
          browsing the platform, creating an account, making reservations, and
          completing payments. Users are required to provide accurate and
          complete information when registering or making bookings. Any misuse
          of the platform, including providing false information, attempting to
          disrupt the system, or violating applicable laws, may result in
          suspension or termination of the user account. All reservations made
          through the platform are subject to availability and confirmation.
          Once a reservation is confirmed and any required deposit is paid, the
          booking will be secured according to the selected services and event
          details. Users are responsible for reviewing booking details before
          confirming any reservation. We reserve the right to update or modify
          these terms at any time to reflect service updates, legal
          requirements, or operational changes. Continued use of the platform
          after any updates indicates acceptance of the revised terms.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 55,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  backBtn: {
    marginRight: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000",
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 22,
    paddingBottom: 30,
  },
  image: {
    width: 180,
    height: 180,
    marginTop: 20,
    marginBottom: 18,
  },
  description: {
    fontSize: 13,
    lineHeight: 24,
    color: "#9A9A9A",
    textAlign: "center",
  },
});