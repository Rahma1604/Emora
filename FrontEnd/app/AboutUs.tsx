import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, FontAwesome, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function AboutUsScreen() {
  const handleOpenLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={22} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About Us</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Image
            source={require("../assets/images/images/aboutUs.png")}
            style={styles.image}
            resizeMode="contain"
          />

          <Text style={styles.description}>
            We are dedicated to supporting parents and specialists in understanding
            children’s emotional and behavioral well-being. Our app provides a safe
            and simple space for parents to track their child’s feelings, behaviors,
            and progress over time. By combining thoughtful design with intelligent
            analysis, we help turn daily observations into meaningful insights.
            Specialists can review cases, provide guidance, and support families
            through clear, structured communication — all while maintaining the
            highest standards of privacy and trust.
          </Text>
        </View>

        {/* Social Icons */}
        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => handleOpenLink("https://facebook.com")}
          >
            <FontAwesome name="facebook" size={24} color="#B9D8F6" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => handleOpenLink("https://instagram.com")}
          >
            <Feather name="instagram" size={22} color="#FBC0BF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => handleOpenLink("https://tiktok.com")}
          >
            <FontAwesome5 name="tiktok" size={20} color="#B9D8F6" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => handleOpenLink("https://x.com")}
          >
            <Ionicons name="close" size={22} color="#FBC0BF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => handleOpenLink("https://wa.me/201000000000")}
          >
            <FontAwesome name="whatsapp" size={22} color="#B9D8F6" />
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
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 6,
    marginBottom: 18,
  },

  backBtn: {
    marginRight: 6,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },

  content: {
    flex: 1,
    alignItems: "center",
  },

  image: {
    width: 190,
    height: 190,
    marginTop: 20,
    marginBottom: 20,
  },

  description: {
    fontSize: 14,
    lineHeight: 29,
    color: "#9A9A9A",
    textAlign: "center",
    paddingHorizontal: 10,
  },

  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },

  socialBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E9DCDC",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});