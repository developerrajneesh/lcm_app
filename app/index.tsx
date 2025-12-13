import { Redirect } from "expo-router";
import { useState } from "react";

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState();

  // useEffect(() => {
  //   const checkAuthStatus = async () => {
  //     const token = await AsyncStorage.getItem("token");
  //     setIsLoggedIn(!!token);
  //   };

  //   checkAuthStatus();
  // }, []);

  // if (isLoggedIn === null) return null; // Wait for auth check

  return <Redirect href={"/Home"} />;
}
