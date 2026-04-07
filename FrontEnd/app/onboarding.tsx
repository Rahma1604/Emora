import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Asset } from "expo-asset";
import { Image } from "expo-image";

const { width, height } = Dimensions.get("window");

const onboardingImage1 = require("../assets/images/images/onboarding-1.jpg");
const onboardingImage2 = require("../assets/images/images/onboarding-2.jpg");
const onboardingImage3 = require("../assets/images/images/onboarding-3.jpg");

const slides = [
  {
    id: "1",
    title: "Understand Your Child Better",
    description:
      "Track your child's symptoms, behaviors, and daily observations in one place to build a clearer picture over time.",
    image: onboardingImage1,
  },
  {
    id: "2",
    title: "Smart Analysis & Helpful Insights",
    description:
      "Get clear insights from each entry to help you notice patterns and understand your child better.",
    image: onboardingImage2,
  },
  {
    id: "3",
    title: "Guidance from Medical Professionals",
    description:
      "Doctors can review your child's case history and provide recommendations based on the full picture, not just a single entry.",
    image: onboardingImage3,
  },
];

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    const preloadImages = async () => {
      try {
        await Asset.loadAsync([
          onboardingImage1,
          onboardingImage2,
          onboardingImage3,
        ]);
        setImagesLoaded(true);
      } catch (error) {
        console.log("Error loading onboarding images:", error);
        setImagesLoaded(true);
      }
    };

    preloadImages();
  }, []);

  useEffect(() => {
    if (!imagesLoaded) return;

    const interval = setInterval(() => {
      const nextIndex =
        currentIndex === slides.length - 1 ? 0 : currentIndex + 1;

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      setCurrentIndex(nextIndex);
    }, 7000);

    return () => clearInterval(interval);
  }, [currentIndex, imagesLoaded]);

  const handleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const handleStartNow = () => {
    router.replace("/role-selection");
  };

  const renderItem = ({ item }: { item: (typeof slides)[0] }) => {
    return (
      <View style={styles.slide}>
        <Image
          source={item.image}
          style={styles.imageBackground}
          contentFit="cover"
          cachePolicy="memory-disk"
        />

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.12)", "rgba(0,0,0,0.72)"]}
          locations={[0.45, 0.65, 1]}
          style={styles.overlay}
        >
          <View style={styles.contentContainer}>
            <View style={styles.dotsContainer}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    currentIndex === index
                      ? styles.activeDot
                      : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>

            <Text style={styles.title}>{item.title}</Text>

            <Text style={styles.description}>{item.description}</Text>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.buttonWrapper}
              onPress={handleStartNow}
            >
              <LinearGradient
                colors={["#cfe7ff", "#f9c7c7"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Start Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  };

  if (!imagesLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  slide: {
    width,
    height,
    backgroundColor: "#000",
  },

  imageBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 22,
    paddingBottom: 38,
  },

  contentContainer: {
    width: "100%",
  },

  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  dot: {
    borderRadius: 999,
    marginRight: 6,
  },

  activeDot: {
    width: 14,
    height: 6,
    backgroundColor: "#FFFFFF",
  },

  inactiveDot: {
    width: 6,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.55)",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
    marginBottom: 10,
    maxWidth: "90%",
  },

  description: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: "92%",
  },

  buttonWrapper: {
    width: "100%",
  },

  button: {
    height: 54,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "600",
  },
});