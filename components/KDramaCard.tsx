import CardActionModal from "@/components/CardActionModal";
import { icons } from "@/constants/icons";
import { useSelection } from "@/context/SelectionContext";
import { Link } from "expo-router";
import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface KDramaCardProps extends TVShow {
	cardWidth?: number;
}

const KDramaCard = ({
	id,
	poster_path,
	name,
	vote_average,
	first_air_date,
	cardWidth,
}: KDramaCardProps) => {
	const [modalVisible, setModalVisible] = useState(false);
	const { selectionMode, enterSelectionMode, toggleItem, isSelected } = useSelection();
	const containerStyle = cardWidth ? { width: cardWidth } : undefined;
	const posterUrl = poster_path
		? `https://image.tmdb.org/t/p/w500${poster_path}`
		: "https://placehold.cn/500x400/1a1a1a/ffffff.png";

	const item = {
		item_id: id,
		type: "kdrama" as const,
		title: name,
		poster_url: posterUrl,
		vote_average,
		year: first_air_date?.split("-")[0] ?? "",
	};

	const selected = isSelected(id, "kdrama");

	const handleLongPress = () => {
		if (selectionMode) return;
		setModalVisible(true);
	};

	const cardContent = (
		<View className="relative">
			<Image
				source={{ uri: posterUrl }}
				className="w-full h-52 rounded-lg"
				resizeMode="cover"
				style={selected ? { opacity: 0.6 } : undefined}
			/>
			{selectionMode && (
				<View
					className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 items-center justify-center"
					style={{
						borderColor: selected ? "#ab8bff" : "#fff",
						backgroundColor: selected ? "#ab8bff" : "rgba(0,0,0,0.4)",
					}}
				>
					{selected && <Text className="text-white text-xs font-bold">✓</Text>}
				</View>
			)}
		</View>
	);

	const cardMeta = (
		<>
			<Text className="text-sm font-bold text-white mt-2" numberOfLines={1}>
				{name}
			</Text>
			<View className="flex-row items-center justify-start gap-x-1">
				<Image source={icons.star} className="size-4" />
				<Text className="text-xs text-white font-bold uppercase">
					{Math.round(vote_average / 2)}
				</Text>
			</View>
			<View className="flex-row items-center justify-between">
				<Text className="text-xs text-light-300 font-medium mt-1">
					{first_air_date?.split("-")[0]}
				</Text>
			</View>
		</>
	);

	return (
		<>
			{selectionMode ? (
				<TouchableOpacity
					className="w-32"
					style={containerStyle}
					onPress={() => toggleItem(item)}
					onLongPress={handleLongPress}
					delayLongPress={200}
					activeOpacity={0.7}
				>
					{cardContent}
					{cardMeta}
				</TouchableOpacity>
			) : (
				<Link href={`/tv/${id}`} asChild>
					<TouchableOpacity
						className="w-32"
						style={containerStyle}
						onLongPress={handleLongPress}
						delayLongPress={200}
					>
						{cardContent}
						{cardMeta}
					</TouchableOpacity>
				</Link>
			)}
			{!selectionMode && (
				<CardActionModal
					visible={modalVisible}
					onClose={() => setModalVisible(false)}
					item={item}
				/>
			)}
		</>
	);
};

export default KDramaCard;
