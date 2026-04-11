import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Switch,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [languageModalVisible, setLanguageModalVisible] = React.useState(false);
  const [selectedLanguage, setSelectedLanguage] = React.useState("Arabic");

  const handleSelectLanguage = (language: string) => {
    setSelectedLanguage(language);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatarWrapper}>
              <Image
                source={require("../../assets/images/images/image 119.png")}
                style={styles.avatar}
              />
            </View>

            <Text style={styles.name}>Marwa Mohamed</Text>
            <Text style={styles.email}>marwa_m189@gmail.com</Text>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.editBtnWrapper}
              onPress={() => router.push("/parent/edit-profile")}
            >
              <LinearGradient
                colors={["#B9D8F6", "#FBC0BF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.editBtn}
              >
                <Text style={styles.editBtnText}>Edit My profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Account Settings</Text>

          <View style={styles.card}>
            <TouchableOpacity style={styles.row}>
              <View style={styles.rowLeft}>
                <MaterialCommunityIcons
                  name="form-textbox-password"
                  size={20}
                  color="#444"
                />
                <Text style={styles.rowText}>Change Password</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#777" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Feather name="bell" size={20} color="#444" />
                <Text style={styles.rowText}>Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#D9D9D9", true: "#34C759" }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => setLanguageModalVisible(true)}
            >
              <View style={styles.rowLeft}>
                <Feather name="globe" size={20} color="#444" />
                <Text style={styles.rowText}>Language</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#777" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push("/terms-policies")}
            >
              <View style={styles.rowLeft}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={20}
                  color="#444"
                />
                <Text style={styles.rowText}>Terms & Policies</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#777" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Support</Text>

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push("/contact-support")}
            >
              <View style={styles.rowLeft}>
                <Feather name="headphones" size={20} color="#444" />
                <Text style={styles.rowText}>Contact Support</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#777" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push("/AboutUs")}
            >
              <View style={styles.rowLeft}>
                <Feather name="info" size={20} color="#444" />
                <Text style={styles.rowText}>About Us</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#777" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.9} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <Text style={styles.version}>App Version 2.1.3</Text>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.replace("/parent/parentHome")}
          >
            <Feather name="home" size={20} color="#999" />
            <Text style={styles.navText}>Home</Text>
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

          <TouchableOpacity style={styles.navItem} activeOpacity={1}>
            <Feather name="user" size={20} color="#222" />
            <Text style={[styles.navText, styles.activeNavText]}>Profile</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={languageModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLanguageModalVisible(false)}
        >
          <Pressable
            style={styles.overlay}
            onPress={() => setLanguageModalVisible(false)}
          >
            <Pressable style={styles.bottomSheet}>
              <Text style={styles.bottomSheetTitle}>Select Language</Text>

              <TouchableOpacity
                style={styles.languageOption}
                onPress={() => handleSelectLanguage("Arabic")}
              >
                <Text style={styles.languageText}>Arabic</Text>
                <View style={styles.radioOuter}>
                  {selectedLanguage === "Arabic" && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.languageOption}
                onPress={() => handleSelectLanguage("English")}
              >
                <Text style={styles.languageText}>English</Text>
                <View style={styles.radioOuter}>
                  {selectedLanguage === "English" && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
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
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 150,
  },

  profileSection: {
    alignItems: "center",
    marginTop: 8,
  },

  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#F3F3F3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },

  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
  },

  email: {
    marginTop: 2,
    fontSize: 14,
    color: "#8E8E93",
  },

  editBtnWrapper: {
    marginTop: 12,
  },

  editBtn: {
    height: 38,
    paddingHorizontal: 22,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },

  editBtnText: {
    fontSize: 14,
    color: "#222",
    fontWeight: "500",
  },

  sectionTitle: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },

  card: {
    backgroundColor: "#F7F7F8",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ECECEC",
  },

  row: {
    minHeight: 54,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F7F7F8",
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  rowText: {
    marginLeft: 12,
    fontSize: 15,
    color: "#222",
    fontWeight: "400",
  },

  divider: {
    height: 1,
    backgroundColor: "#E7E7E7",
    marginLeft: 16,
  },

  logoutBtn: {
    marginTop: 18,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "#FF5A4F",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  logoutText: {
    color: "#FF5A4F",
    fontSize: 18,
    fontWeight: "600",
  },

  version: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 13,
    color: "#A0A0A0",
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

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 30,
  },

  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 18,
  },

  languageOption: {
    height: 54,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },

  languageText: {
    fontSize: 14,
    color: "#222",
    fontWeight: "400",
  },

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#BDBDBD",
    alignItems: "center",
    justifyContent: "center",
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#B9D8F6",
  },
});