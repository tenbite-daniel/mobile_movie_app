import CardActionModal from "@/components/CardActionModal";
import { icons } from "@/constants/icons";
import { Link } from "expo-router";
import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface KDramaCardProps extends TVShow {
	cardWidth?: number;
}

const KDramaCard = React.memo(({
	id,
	poster_path,
	name,
	vote_average,
	first_air_date,
	cardWidth,
}: KDramaCardProps) => {
	const [modalVisible, setModalVisible] = useState(false);
	const containerStyle = cardWidth ? { width: cardWidth } : undefined;
	const posterUrl = poster_path
		? `https://image.tmdb.org/t/p/w500${poster_path}`
		: "https://placehold.cn/500x400/1a1a1a/ffffff.png";

	return (
		<>
			<Link href={`/tv/${id}`} asChild>
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
				</TouchableOpacity>
			</Link>
			<CardActionModal
				visible={modalVisible}
				onClose={() => setModalVisible(false)}
				item={{
					item_id: id,
					type: "kdrama",
					title: name,
					poster_url: posterUrl,
					vote_average,
					year: first_air_date?.split("-")[0] ?? "",
				}}
			/>
		</>
	);
});

export default KDramaCard;
