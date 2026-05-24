import CardActionModal from "@/components/CardActionModal";
import { icons } from "@/constants/icons";
import { useSelection } from "@/context/SelectionContext";
import { Link } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

interface AnimeCardProps extends Anime {
	cardWidth?: number;
}

const AnimeCard = ({
	id,
	title,
	coverImage,
	averageScore,
	startDate,
	cardWidth,
}: AnimeCardProps) => {
	const [modalVisible, setModalVisible] = useState(false);
	const { selectionMode, enterSelectionMode, toggleItem, isSelected } = useSelection();
	const displayTitle = title?.english || title?.romaji || "Unknown";
	const score = averageScore ? (averageScore / 20).toFixed(1) : "N/A";
	const containerStyle = cardWidth ? { width: cardWidth } : { width: 128 };
	const posterUrl = coverImage?.extraLarge || coverImage?.large || "";

	const item = {
		item_id: id,
		type: "anime" as const,
		title: displayTitle,
		poster_url: posterUrl,
		vote_average: averageScore ? averageScore / 10 : 0,
		year: String(startDate?.year ?? ""),
	};

	const selected = isSelected(id, "anime");

	const handleLongPress = () => {
		if (selectionMode) return;
		setModalVisible(true);
	};

	const handlePress = () => {
		if (selectionMode) toggleItem(item);
	};

	const cardContent = (
		<View style={{ position: "relative" }}>
			<Image
				source={{ uri: posterUrl }}
				style={[
					{ width: "100%", height: 208, borderRadius: 8 },
					selected ? { opacity: 0.6 } : undefined,
				]}
				resizeMode="cover"
			/>
			{selectionMode && (
				<View
					style={{
						position: "absolute",
						top: 8,
						right: 8,
						width: 24,
						height: 24,
						borderRadius: 12,
						borderWidth: 2,
						alignItems: "center",
						justifyContent: "center",
						borderColor: selected ? "#ab8bff" : "#fff",
						backgroundColor: selected ? "#ab8bff" : "rgba(0,0,0,0.4)",
					}}
				>
					{selected && <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>✓</Text>}
				</View>
			)}
		</View>
	);

	const cardMeta = (
		<>
			<Text className="text-sm font-bold text-white mt-2" numberOfLines={1}>{displayTitle}</Text>
			<View className="flex-row items-center justify-start gap-x-1">
				<Image source={icons.star} className="size-4" />
				<Text className="text-xs text-white font-bold uppercase">{score}</Text>
			</View>
			<Text className="text-xs text-light-300 font-medium mt-1">{startDate?.year ?? "TBA"}</Text>
		</>
	);

	return (
		<>
			{selectionMode ? (
				<Pressable
					style={containerStyle}
					onPress={handlePress}
					onLongPress={handleLongPress}
					delayLongPress={200}
					android_ripple={null}
				>
					{cardContent}
					{cardMeta}
				</Pressable>
			) : (
				<Link href={`/anime/${id}`} asChild>
					<Pressable
						style={containerStyle}
						onLongPress={handleLongPress}
						delayLongPress={200}
						android_ripple={null}
					>
						{cardContent}
						{cardMeta}
					</Pressable>
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

export default AnimeCard;
