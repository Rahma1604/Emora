import React from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type TermsSection = {
  title: string;
  body: string;
};

const termsSections: TermsSection[] = [
  {
    title: "1. Acceptance of the Terms",
    body:
      "By creating or using an Emora doctor account, you agree to follow these Terms and Conditions, along with all applicable professional, privacy, and child-protection requirements.",
  },
  {
    title: "2. Professional Eligibility",
    body:
      "Doctor access is limited to licensed medical professionals whose identity, medical license, and professional information have been reviewed. Emora may restrict access while verification is pending, rejected, expired, or suspended.",
  },
  {
    title: "3. Clinical Responsibility",
    body:
      "AI summaries, emotional classifications, and trend indicators are decision-support tools only. They do not replace your independent medical judgment, direct assessment, or the need to refer a child for urgent or in-person care when appropriate.",
  },
  {
    title: "4. Child and Parent Data",
    body:
      "You must use child and parent information only for legitimate case review and follow-up. You may not copy, share, export, or disclose protected information outside the approved clinical workflow unless legally required and properly authorized.",
  },
  {
    title: "5. Recommendations and Medical Records",
    body:
      "Recommendations submitted through Emora may become part of the child’s case history. Use clear and professional language, and avoid adding information that is unrelated, discriminatory, misleading, or unsupported by the reviewed data.",
  },
  {
    title: "6. Account Security",
    body:
      "You are responsible for protecting your password, device, and active sessions. Do not allow another person to access or use your doctor account. Report suspected unauthorized access immediately.",
  },
  {
    title: "7. Acceptable Use",
    body:
      "You may not misuse the platform, attempt unauthorized access, interfere with system operation, upload harmful content, or use child information for marketing, personal benefit, or any purpose outside authorized care.",
  },
  {
    title: "8. Professional Conduct",
    body:
      "You must maintain professional and respectful communication with parents, guardians, and other authorized users. Advice and recommendations should remain within your verified medical qualifications and professional scope.",
  },
  {
    title: "9. Emergency Situations",
    body:
      "Emora is not an emergency service. When the available information suggests an immediate risk of harm, abuse, severe distress, or another urgent medical concern, you should follow the appropriate emergency and safeguarding procedures.",
  },
  {
    title: "10. Suspension or Termination",
    body:
      "Emora may restrict or suspend an account when professional verification expires, suspicious activity is detected, these Terms are violated, or continued access may create a privacy, safety, or legal risk.",
  },
  {
    title: "11. Service Availability",
    body:
      "Some features may be unavailable during maintenance, testing, or technical incidents. Emora does not guarantee uninterrupted access and may update, replace, or remove features as the platform develops.",
  },
  {
    title: "12. Updates to These Terms",
    body:
      "These Terms may be updated to reflect legal, security, professional, or product changes. The latest version and effective date will be displayed on this page.",
  },
];

export default function TermsConditionsScreen() {
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <LinearGradient
        colors={[
          "#FFFFFF",
          "#FFF8F8",
          "#F7FBFF",
        ]}
        locations={[0, 0.5, 1]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 1,
        }}
        style={styles.background}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#1F2937"
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              Terms & Conditions
            </Text>

            <View style={styles.headerPlaceholder} />
          </View>

          {/* Hero */}
          <View style={styles.heroCard}>
            <LinearGradient
              colors={[
                "#DDEFFF",
                "#FFE3E5",
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              style={styles.heroIcon}
            >
              <Ionicons
                name="document-text-outline"
                size={30}
                color="#6D9EC8"
              />
            </LinearGradient>

            <Text style={styles.heroTitle}>
              Emora Doctor Terms
            </Text>

            <Text style={styles.heroDescription}>
              These terms explain the responsibilities,
              requirements, and permitted use of a verified
              doctor account.
            </Text>

            <View style={styles.updatedBadge}>
              <Ionicons
                name="calendar-outline"
                size={13}
                color="#66859D"
              />

              <Text style={styles.updatedText}>
                Last updated: June 21, 2026
              </Text>
            </View>
          </View>

          {/* Medical Notice */}
          <View style={styles.noticeCard}>
            <View style={styles.noticeIcon}>
              <Ionicons
                name="medical-outline"
                size={21}
                color="#648FB4"
              />
            </View>

            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>
                Important medical notice
              </Text>

              <Text style={styles.noticeText}>
                Emora supports professional review and
                monitoring. It is not an emergency service
                and does not replace direct medical
                evaluation when urgent care is required.
              </Text>
            </View>
          </View>

          {/* Terms Sections */}
          <View style={styles.sectionsContainer}>
            {termsSections.map((section) => (
              <View
                key={section.title}
                style={styles.sectionCard}
              >
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIndicator} />

                  <Text style={styles.sectionTitle}>
                    {section.title}
                  </Text>
                </View>

                <Text style={styles.sectionBody}>
                  {section.body}
                </Text>
              </View>
            ))}
          </View>

          {/* Child Data Notice */}
          <View style={styles.childDataCard}>
            <View style={styles.childDataIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color="#4B9A5D"
              />
            </View>

            <View style={styles.childDataContent}>
              <Text style={styles.childDataTitle}>
                Child information must remain protected
              </Text>

              <Text style={styles.childDataText}>
                Do not download, photograph, share, or store
                sensitive child information outside the
                approved Emora workflow.
              </Text>
            </View>
          </View>

          {/* Contact */}
          <View style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#6798BF"
              />
            </View>

            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>
                Questions about these terms?
              </Text>

              <Text style={styles.contactText}>
                support@emora.app
              </Text>
            </View>
          </View>

          <Text style={styles.footerText}>
            By continuing to use Emora, you confirm that you
            understand and accept the current Terms and
            Conditions.
          </Text>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  background: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 30,
  },

  header: {
    height: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#22262A",
  },

  headerPlaceholder: {
    width: 40,
  },

  heroCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7ECEF",
    borderRadius: 17,
    paddingHorizontal: 16,
    paddingTop: 19,
    paddingBottom: 17,
    marginTop: 5,
    marginBottom: 13,
    shadowColor: "#9DABB5",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },

  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  heroTitle: {
    marginTop: 13,
    fontSize: 18,
    fontWeight: "700",
    color: "#24282C",
  },

  heroDescription: {
    maxWidth: 310,
    marginTop: 7,
    fontSize: 9.5,
    lineHeight: 15,
    color: "#878D93",
    textAlign: "center",
  },

  updatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EEF6FD",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 13,
  },

  updatedText: {
    fontSize: 8,
    fontWeight: "600",
    color: "#66859D",
  },

  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EAF5FF",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 13,
  },

  noticeIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 9,
  },

  noticeContent: {
    flex: 1,
  },

  noticeTitle: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#59768C",
  },

  noticeText: {
    marginTop: 5,
    fontSize: 8.8,
    lineHeight: 14,
    color: "#668098",
  },

  sectionsContainer: {
    gap: 10,
  },

  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7ECEF",
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 13,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionIndicator: {
    width: 4,
    height: 19,
    borderRadius: 2,
    backgroundColor: "#93BFE1",
    marginRight: 8,
  },

  sectionTitle: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: "700",
    color: "#34393D",
  },

  sectionBody: {
    marginTop: 9,
    paddingLeft: 12,
    fontSize: 9,
    lineHeight: 15,
    color: "#6E767D",
  },

  childDataCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EAF8ED",
    borderWidth: 1,
    borderColor: "#D6EDDC",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 14,
  },

  childDataIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 9,
  },

  childDataContent: {
    flex: 1,
  },

  childDataTitle: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#4C7856",
  },

  childDataText: {
    marginTop: 5,
    fontSize: 8.8,
    lineHeight: 14,
    color: "#63816A",
  },

  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF2F3",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 13,
  },

  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 10,
  },

  contactContent: {
    flex: 1,
  },

  contactTitle: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#704F53",
  },

  contactText: {
    marginTop: 4,
    fontSize: 9,
    color: "#96676C",
  },

  footerText: {
    marginTop: 15,
    paddingHorizontal: 8,
    fontSize: 8.5,
    lineHeight: 14,
    color: "#92989E",
    textAlign: "center",
  },
});