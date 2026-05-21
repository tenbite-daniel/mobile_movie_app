import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useAuth } from "@/context/AuthContext";
import { Tabs, router } from "expo-router";
import React from "react";
import { Image, ImageBackground, Text, TouchableOpacity, View } from "react-native";

const TabIcon = ({ focused, icon, title }: any) => {
	if (focused) {
		return (
			<ImageBackground
				source={images.highlight}
				className="flex flex-row w-full flex-1 min-w-[112px] min-h-16 mt-6 justify-center items-center rounded-full overflow-hidden ml-2"
			>
				<Image source={icon} tintColor="#151312" className="size-5" />
				<Text className="text-secondary text-base font-semibold">{title}</Text>
			</ImageBackground>
		);
	}
	return (
		<View className="size-full justify-center items-center mt-4 rounded-full">
			<Image source={icon} tintColor="#A8B5DB" className="size-5" />
		</View>
	);
};

const _layout = () => {
	const { user } = useAuth();

	return (
		<Tabs
			screenOptions={{
				tabBarShowLabel: false,
				tabBarItemStyle: {
					width: "100%",
					height: "100%",
					justifyContent: "center",
					alignItems: "center",
				},
				tabBarStyle: {
					backgroundColor: "#0f0D23",
					borderRadius: 50,
					marginHorizontal: 20,
					marginBottom: 36,
					height: 52,
					position: "absolute",
					overflow: "hidden",
					borderWidth: 0,
					borderColor: "#0f0d23",
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					headerShown: false,
					tabBarIcon: ({ focused }) => (
						<TabIcon focused={focused} icon={icons.home} title="Home" />
					),
				}}
			/>
			<Tabs.Screen
				name="search"
				options={{
					title: "Search",
					headerShown: false,
					tabBarIcon: ({ focused }) => (
						<TabIcon focused={focused} icon={icons.search} title="Search" />
					),
				}}
			/>
			<Tabs.Screen
				name="saved"
				options={{
					title: "Favorites",
					headerShown: false,
					tabBarIcon: ({ focused }) => (
						<TabIcon focused={focused} icon={icons.save} title="Favorites" />
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: user ? "Profile" : "Sign In",
					headerShown: false,
					tabBarButton: user
						? undefined
						: (props) => (
							<TouchableOpacity
								{...props}
								onPress={() => router.push("/(auth)/login")}
								style={{
									flex: 1,
									alignItems: "center",
									justifyContent: "center",
									height: "100%",
								}}
							>
								<View style={{ alignItems: "center", justifyContent: "center", marginTop: 30 }}>
									<Image source={icons.person} tintColor="#ab8bff" style={{ width: 22, height: 27 }} />
									<Text style={{ color: "#ab8bff", fontSize: 12, fontWeight: "700", marginTop: 2 }}>
										Sign In
									</Text>
								</View>
							</TouchableOpacity>
						),
					tabBarIcon: ({ focused }) => (
						<TabIcon focused={focused} icon={icons.person} title="Profile" />
					),
				}}
			/>
		</Tabs>
	);
};

export default _layout;
