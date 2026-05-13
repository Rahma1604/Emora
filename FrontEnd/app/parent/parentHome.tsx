import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../api";

type Child = {
  _id: string;
  name: string;
  age: number;
  gender: string;
};

// Static data for now - will be connected to backend later
const STATIC_CHILD_DATA: Record<string, { status: string; description: string; lastUpdated: string; color: string }> = {};

function getChildCardData(index: number) {
  const cards = [
    {
      status: "Improving",
      description: "Child shows slight improvement in emotional behavior",
      lastUpdated: "May 12, 2026",
      color: "#FBC0BF",
    },
    {
      status: "Improving",
      description: "Child appears calmer and more emotionally stable over time.",
      lastUpdated: "May 15, 2026",
      color: "#B9D8F6",
    },
    {
      status: "Improving",
      description: "Showing great progress in daily activities.",
      lastUpdated: "May 10, 2026",
      color: "#FBC0BF",
    },
    {
      status: "Improving",
      description: "Communication skills are developing well.",
      lastUpdated: "May 8, 2026",
      color: "#B9D8F6",
    },
  ];
  return cards[index % cards.length];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING";
  if (hour < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

export default function Home() {
  const [children, setChildren] = useState<Child[]>([]);
  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError("");

      const savedUser = await AsyncStorage.getItem("user");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setUserName(user?.name || "User");
      }

      const response = await API.get("/children/all");
      setChildren(response.data);
    } catch (err: any) {
      const message =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to load children";

      setError(message);
      console.log("Parent home error:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHomeData();
    }, [])
  );

  const firstName = userName.split(" ")[0];

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

        {/* Flower decoration top right */}
        <Image
          source={require("../../assets/images/images/flower.png")}
          style={styles.flowerTopRight}
          resizeMode="contain"
        />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/images/images/image 119.png")}
              style={styles.profileImage}
            />
            <View>
              <Text style={styles.welcomeText}>Welcome 👋</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Feather name="bell" size={22} color="#222" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator color="#222" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : children.length === 0 ? (
            // Empty state
            <>
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
            </>
          ) : (
            // Children list - new UI
            <ScrollView
              style={styles.childrenList}
              contentContainerStyle={styles.childrenListContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Greeting */}
              <Text style={styles.greetingSmall}>{getGreeting()}, {firstName.toUpperCase()}</Text>
              <Text style={styles.greetingLarge}>
                Everything is{" "}
                <Text style={styles.greetingHighlight}>Serene</Text> at{"\n"}Home
              </Text>

              {/* Children Cards */}
              {children.map((child, index) => {
                const cardData = getChildCardData(index);
                return (
                  <TouchableOpacity
                    key={child._id}
                    activeOpacity={0.88}
                    onPress={() => router.push("/parent/childProfile")}
                    style={[styles.childCard, { backgroundColor: cardData.color }]}
                  >
                    {/* Flower pattern watermark */}
                    <Image
                      source={require("../../assets/images/images/Vector (1).png")}
                      style={styles.cardFlower1}
                      resizeMode="contain"
                    />
                    <Image
                      source={require("../../assets/images/images/Vector (1).png")}
                      style={styles.cardFlower2}
                      resizeMode="contain"
                    />
                    <Image
                      source={require("../../assets/images/images/Vector (1).png")}
                      style={styles.cardFlower3}
                      resizeMode="contain"
                    />
                    <View style={styles.childCardTop}>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{cardData.status} ✨</Text>
                      </View>
                    </View>

                    <Text style={styles.childCardName}>
                      {child.name}{" "}
                      <Text style={styles.childCardAge}>({child.age} years old)</Text>
                    </Text>

                    <Text style={styles.childCardDesc}>{cardData.description}</Text>

                    <View style={styles.childCardBottom}>
                      <Text style={styles.childCardDate}>Last updated: {cardData.lastUpdated}</Text>
                      <TouchableOpacity style={styles.arrowButton}>
                        <Ionicons name="arrow-forward" size={18} color="#222" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <View style={{ height: 100 }} />
            </ScrollView>
          )}
        </View>

        {/* Bottom Nav */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Feather name="home" size={20} color="#222" />
            <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
          </TouchableOpacity>

         <TouchableOpacity style={styles.navItem} onPress={() => router.push("/parent/activity-history")}>
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
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
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
    height: 200,
    overflow: "hidden",
  },
  topHorizontalGradient: { ...StyleSheet.absoluteFillObject },
  topFadeGradient: { ...StyleSheet.absoluteFillObject },

  flowerTopRight: {
    position: "absolute",
    top: 60,
    right: -10,
    width: 120,
    height: 120,
    opacity: 0.15,
    zIndex: 0,
    tintColor: "#B9D8F6",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    zIndex: 2,
    paddingHorizontal: 6,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
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
  notificationButton: { padding: 6 },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 70,
    zIndex: 2,
  },

  // Empty state
  childImage: { width: 220, height: 220, marginBottom: 18 },
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
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    textAlign: "center",
  },

  // Children list
  childrenList: { width: "100%" },
  childrenListContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },

  greetingSmall: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9A9A9A",
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 8,
  },
  greetingLarge: {
    fontSize: 26,
    fontWeight: "700",
    color: "#222",
    lineHeight: 34,
    marginBottom: 24,
  },
  greetingHighlight: {
    color: "#7BB8E8",
  },

  // Child card
  childCard: {
    width: "100%",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardFlower1: {
    position: "absolute",
    width: 60,
    height: 60,
    top: 10,
    right: 60,
    opacity: 0.2,
    tintColor: "#fff",
  },
  cardFlower2: {
    position: "absolute",
    width: 45,
    height: 45,
    bottom: 15,
    right: 20,
    opacity: 0.2,
    tintColor: "#fff",
  },
  cardFlower3: {
    position: "absolute",
    width: 35,
    height: 35,
    top: 40,
    right: 110,
    opacity: 0.15,
    tintColor: "#fff",
  },
  childCardTop: {
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  childCardName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
    marginBottom: 6,
  },
  childCardAge: {
    fontSize: 15,
    fontWeight: "500",
    color: "#444",
  },
  childCardDesc: {
    fontSize: 13,
    color: "#444",
    lineHeight: 19,
    marginBottom: 14,
  },
  childCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  childCardDate: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Bottom nav
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