import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PrivacyPolicy = () => {
  const sections = [
    {
      title: "1. Information We Collect",
      content:
        "We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This may include your name, email address, phone number, payment information, and any other information you choose to provide.",
    },
    {
      title: "2. How We Use Your Information",
      content:
        "We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, respond to your comments and questions, and provide customer service.",
    },
    {
      title: "3. Information Sharing",
      content:
        "We do not sell, trade, or rent your personal information to third parties. We may share your information only with trusted service providers who assist us in operating our platform, conducting our business, or serving our users, as long as those parties agree to keep this information confidential.",
    },
    {
      title: "4. Data Security",
      content:
        "We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.",
    },
    {
      title: "5. Your Rights",
      content:
        "You have the right to access, update, or delete your personal information at any time. You can also opt-out of certain communications from us. To exercise these rights, please contact us through the app settings or support.",
    },
    {
      title: "6. Cookies and Tracking",
      content:
        "We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.",
    },
    {
      title: "7. Children's Privacy",
      content:
        "Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.",
    },
    {
      title: "8. Changes to This Policy",
      content:
        "We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the 'Last Updated' date. You are advised to review this Privacy Policy periodically for any changes.",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last Updated: December 12, 2024</Text>

          <Text style={styles.introText}>
            At LCM, we are committed to protecting your privacy. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use our mobile
            application and services.
          </Text>

          {sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          ))}

          {/* Contact Section */}
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Contact Us</Text>
            <Text style={styles.contactText}>
              If you have any questions about this Privacy Policy, please contact us at:
            </Text>
            <Text style={styles.contactEmail}>privacy@lcm.app</Text>
            <Text style={styles.contactEmail}>support@lcm.app</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
    backgroundColor: "#ffffff",
  },
  lastUpdated: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 20,
    textAlign: "right",
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#334155",
    marginBottom: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
    color: "#64748b",
  },
  contactSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  contactText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#64748b",
    marginBottom: 12,
  },
  contactEmail: {
    fontSize: 15,
    color: "#6366f1",
    fontWeight: "600",
    marginBottom: 4,
  },
});

export default PrivacyPolicy;

