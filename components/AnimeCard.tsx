import CardActionModal from "@/components/CardActionModal";
import { icons } from "@/constants/icons";
import { Link } from "expo-router";
import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface AnimeCardProps extends Anime {
	cardWidth?: number;
}

const AnimeCard = React.memo(({
	id,
	title,
	coverImage,
	averageScore,
	startDate,
	cardWidth,
}: AnimeCardProps) => {
	const [modalVisible, setModalVisible] = useState(false);
	const displayTitle = title?.english || title?.romaji || "Unknown";
	// AniList scores are out of 100, display as out of 10
	const score = averageScore ? (averageScore / 20).toFixed(1) : "N/A";
	const containerStyle = cardWidth ? { width: cardWidth } : undefined;
	const posterUrl = coverImage?.extraLarge || coverImage?.large || "";

	return (
		<>
			<Link href={`/anime/${id}`} asChild>
				<TouchableOpacity
					className="w-32"
					style={containerStyle}
					onLongPress={() => setModalVisible(true)}
					delayLongPress={400}
				>
					<Image
						source={{ uri: posterUrl }}
						className="w-full h-52 rounded-lg"
						resizeMode="cover"
					/>
					<Text className="text-sm font-bold text-white mt-2" numberOfLines={1}>
						{displayTitle}
					</Text>
					<View className="flex-row items-center justify-start gap-x-1">
						<Image source={icons.star} className="size-4" />
						<Text className="text-xs text-white font-bold uppercase">
							{score}
						</Text>
					</View>
					<View className="flex-row items-center justify-between">
						<Text className="text-xs text-light-300 font-medium mt-1">
							{startDate?.year ?? "TBA"}
						</Text>
					</View>
				</TouchableOpacity>
			</Link>
			<CardActionModal
				visible={modalVisible}
				onClose={() => setModalVisible(false)}
				item={{
					item_id: id,
					type: "anime",
					title: displayTitle,
					poster_url: posterUrl,
					vote_average: averageScore ? averageScore / 10 : 0,
					year: String(startDate?.year ?? ""),
				}}
			/>
		</>
	);
});

export default AnimeCard;
