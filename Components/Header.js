import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Header = () => {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>LCM</Text>
      <View style={styles.headerIcons}>
        {/* Notifications */}
        <Ionicons name="notifications-outline" size={24} color="#000" />

        {/* Profile Image */}
        <TouchableOpacity style={{ marginLeft: 15 }}>
          <Image
            source={{
              uri: "https://i.pravatar.cc/150?img=3", // replace with user profile image
            }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#deebff",
    // marginBottom: 10,
    paddingBottom: 10,
    // paddingTop: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});

export default Header;
