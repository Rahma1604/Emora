import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Asset } from "expo-asset";

const onboardingImage1 = require("../assets/images/images/onboarding-1.jpg");
const onboardingImage2 = require("../assets/images/images/onboarding-2.jpg");
const onboardingImage3 = require("../assets/images/images/onboarding-3.jpg");

export default function SplashScreen() {
  useEffect(() => {
    const prepareApp = async () => {
      try {
        await Asset.loadAsync([
          onboardingImage1,
          onboardingImage2,
          onboardingImage3,
        ]);
      } catch (error) {
        console.log("Error preloading images in splash:", error);
      } finally {
        setTimeout(() => {
          router.replace("/onboarding");
        }, 5000);
      }
    };

    prepareApp();
  }, []);

  return (
    <LinearGradient
      colors={["#dbeafb", "#fdfdfd", "#fde2e1"]}
      locations={[0.08, 0.55, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>EMORA</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  logoContainer: {
    alignItems: "center",
  },

  logoText: {
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: 3,
    color: "#ffffff",
  },
});