import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function ContactSupportScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={22} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Support</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Image
            source={require("../assets/images/images/support.png")}
            style={styles.image}
            resizeMode="contain"
          />

          <Text style={styles.title}>
            Choose the best option for you{"\n"}to contact us :
          </Text>

          <TouchableOpacity style={styles.optionButton} activeOpacity={0.8}>
            <View style={styles.iconWrapper}>
              <Feather name="phone-call" size={18} color="#B9D8F6" />
            </View>
            <Text style={styles.optionText}>Call our support team</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionButton} activeOpacity={0.8}>
            <View style={styles.iconWrapper}>
              <MaterialIcons name="message" size={18} color="#FBC0BF" />
            </View>
            <Text style={styles.optionText}>Send A Message</Text>
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
  },

  image: {
    width: 180,
    height: 140,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 18,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    lineHeight: 24,
    marginBottom: 18,
  },

  optionButton: {
    height: 54,
    borderWidth: 1,
    borderColor: "#F3D9D9",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },

  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  optionText: {
    fontSize: 13,
    color: "#444",
    fontWeight: "400",
  },
});