import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

export default function AddChild() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Soft top tint like the home screen */}
        <View style={styles.topGradientWrapper}>
          <LinearGradient
            colors={[
              "rgba(185,216,246,0.32)",
              "rgba(255,255,255,0.10)",
              "rgba(251,192,191,0.32)",
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topHorizontalGradient}
          />
          <LinearGradient
            colors={[
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.40)",
              "rgba(255,255,255,0.78)",
              "rgba(255,255,255,1)",
            ]}
            locations={[0, 0.45, 0.75, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.topFadeGradient}
          />
        </View>

        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Feather name="chevron-left" size={22} color="#222" />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Add New Child Profile</Text>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            placeholder="Child’s Nickname / First Name"
            placeholderTextColor="#B8B8B8"
            style={styles.input}
          />

          <TextInput
            placeholder="Age"
            placeholderTextColor="#B8B8B8"
            style={styles.input}
            keyboardType="numeric"
          />

          <TouchableOpacity activeOpacity={0.85} style={styles.input}>
            <Text style={styles.dropdownText}>Gender</Text>
            <Feather name="chevron-down" size={18} color="#B8B8B8" />
          </TouchableOpacity>

          <TextInput
            placeholder="Parent’s Notes.."
            placeholderTextColor="#B8B8B8"
            style={[styles.input, styles.notesInput]}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Bottom button */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity activeOpacity={0.9}>
            <LinearGradient
              colors={["#B9D8F6", "#FBC0BF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>Add Child</Text>
            </LinearGradient>
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
    paddingHorizontal: 22,
    paddingTop: 10,
  },

  topGradientWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 145,
    overflow: "hidden",
  },

  topHorizontalGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  topFadeGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  backButton: {
    marginTop: 8,
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "flex-start",
    zIndex: 2,
  },

  title: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    zIndex: 2,
  },

  form: {
    marginTop: 14,
    zIndex: 2,
  },

  input: {
    height: 42,
    backgroundColor: "#F5F5F7",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    fontSize: 12,
    color: "#222",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownText: {
    fontSize: 12,
    color: "#B8B8B8",
  },

  notesInput: {
    height: 84,
    paddingTop: 12,
    alignItems: "flex-start",
  },

  buttonWrapper: {
    marginTop: "auto",
    marginBottom: 14,
    zIndex: 2,
  },

  addButton: {
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },

  addButtonText: {
    color: "#222",
    fontSize: 14,
    fontWeight: "500",
  },
});