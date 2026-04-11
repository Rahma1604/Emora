import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";

export default function Home() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Soft top tint like the UX */}
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
            style={styles.topHorizontalGradient}
          />

          <LinearGradient
            colors={[
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.45)",
              "rgba(255,255,255,0.82)",
              "rgba(255,255,255,1)",
            ]}
            locations={[0, 0.45, 0.75, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.topFadeGradient}
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/images/images/image 119.png")}
              style={styles.profileImage}
            />

            <View>
              <Text style={styles.welcomeText}>Welcome 👋</Text>
              <Text style={styles.userName}>Marwa Mohamed</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.notificationButton}>
            <Feather name="bell" size={22} color="#222" />
          </TouchableOpacity>
        </View>

        {/* Center Content */}
        <View style={styles.content}>
          <Image
            source={require("../../assets/images/images/child.png")}
            style={styles.childImage}
            resizeMode="contain"
          />

          <Text style={styles.emptyText}>
            You haven't added any children yet. Tap the button
          </Text>
          <Text style={styles.emptyText}>
            below to add your first child's profile and start
          </Text>
          <Text style={styles.emptyText}>tracking their progress</Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/parent/add-child")}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={["#B9D8F6", "#FBC0BF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>Add Your First Child</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Feather name="home" size={20} color="#222" />
            <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Feather name="list" size={20} color="#999" />
            <Text style={styles.navText}>History</Text>
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
    height: 150,
    overflow: "hidden",
  },

  topHorizontalGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  topFadeGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    lineHeight: 18,
  },

  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
    lineHeight: 20,
  },

  notificationButton: {
    padding: 6,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 70,
    zIndex: 2,
  },

  childImage: {
    width: 220,
    height: 220,
    marginBottom: 18,
  },

  emptyText: {
    fontSize: 13,
    color: "#9A9A9A",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  buttonWrapper: {
    width: "100%",
    marginTop: 28,
    paddingHorizontal: 28,
  },

  addButton: {
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
  },

  addButtonText: {
    color: "#222",
    fontSize: 15,
    fontWeight: "700",
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
});