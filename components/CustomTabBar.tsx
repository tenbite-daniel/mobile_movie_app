import { icons } from "@/constants/icons";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Image, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TABS = [
  { name: "index",     icon: icons.home   },
  { name: "search",    icon: icons.search },
  { name: "saved",     icon: icons.save   },
  { name: "wishlist",  icon: icons.star   },
  { name: "playlists", icon: icons.play   },
  { name: "profile",   icon: icons.person },
];

const BUBBLE_SIZE = 48;
const BAR_HEIGHT = 60;
const LIFT = 16; // how many px the bubble rises above the bar top

interface Props {
  activeIndex: number;
  onTabPress: (index: number, name: string) => void;
  screenBg?: string;
}

export default function CustomTabBar({ activeIndex, onTabPress, screenBg = "#000" }: Props) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const TAB_WIDTH = screenWidth / TABS.length;

  // Per-tab lift animations
  const liftAnims = useRef(TABS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    TABS.forEach((_, i) => {
      Animated.spring(liftAnims[i], {
        toValue: i === activeIndex ? LIFT : 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 180,
      }).start();
    });
  }, [activeIndex]);

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: insets.bottom,
        backgroundColor: "#0d0a1e",
        borderTopWidth: 1,
        borderTopColor: "#1a1535",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          height: BAR_HEIGHT,
          width: "100%",
        }}
      >
        {TABS.map((tab, i) => {
          const isActive = i === activeIndex;
          return (
            <Pressable
              key={tab.name}
              onPress={() => onTabPress(i, tab.name)}
              style={{
                flex: 1,
                height: BAR_HEIGHT,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Animated.View
                style={{
                  width: BUBBLE_SIZE,
                  height: BUBBLE_SIZE,
                  borderRadius: BUBBLE_SIZE / 2,
                  backgroundColor: isActive ? "#ab8bff" : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: [{ translateY: Animated.multiply(liftAnims[i], -1) }],
                }}
              >
                <Image
                  source={tab.icon}
                  style={{
                    width: 22,
                    height: 22,
                    tintColor: isActive ? "#fff" : "#a8b5db",
                  }}
                  resizeMode="contain"
                />
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
