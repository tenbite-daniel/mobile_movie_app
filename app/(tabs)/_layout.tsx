import CustomTabBar from "@/components/CustomTabBar";
import SelectionBar from "@/components/SelectionBar";
import { useAuth } from "@/context/AuthContext";
import { Tabs, router, usePathname } from "expo-router";
import React, { useRef } from "react";
import { View } from "react-native";

const TAB_NAMES = ["index", "search", "saved", "wishlist", "playlists", "profile"];

const getActiveIndex = (pathname: string) => {
  if (pathname === "/" || pathname === "/index") return 0;
  const match = TAB_NAMES.findIndex((t) => pathname.startsWith(`/${t}`));
  return match >= 0 ? match : 0;
};

const _layout = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const activeIndex = getActiveIndex(pathname);
  const jumpToRef = useRef<((name: string) => void) | null>(null);

  const handleTabPress = (index: number, name: string) => {
    if (name === "profile" && !user) {
      router.replace("/(auth)/login" as any);
      return;
    }
    jumpToRef.current?.(name);
  };

  return (
    <View style={{ flex: 1 }}>
      <SelectionBar />
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          headerShown: false,
          tabBarStyle: { display: "none" },
          animation: "none",
        }}
        tabBar={({ navigation }) => {
          jumpToRef.current = navigation.navigate;
          return null;
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="search" />
        <Tabs.Screen name="saved" />
        <Tabs.Screen name="wishlist" />
        <Tabs.Screen name="playlists" />
        <Tabs.Screen name="profile" />
      </Tabs>

      <CustomTabBar activeIndex={activeIndex} onTabPress={handleTabPress} screenBg="#030014" />
    </View>
  );
};

export default _layout;
