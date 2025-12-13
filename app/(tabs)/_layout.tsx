import { Tabs } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AuthModal from "../../Components/AuthModal";
import Header from "../../Components/Header";
import TabBar from "../../Components/TabBar";

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <SafeAreaProvider>
      {/* Top safe area */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#deebff" }} />

      <View style={styles.container}>
        {/* Header fixed at top */}
        <Header />

        {/* Main Content */}
        <View style={styles.content}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: "none" },
            }}
          ></Tabs>
        </View>

        {/* Bottom Tab Bar */}
        <TabBar />
      </View>
      <AuthModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      {/* Bottom safe area */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#ffffff" }} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
  },
});
