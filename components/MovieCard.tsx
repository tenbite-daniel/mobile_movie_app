import CardActionModal from "@/components/CardActionModal";
import { icons } from "@/constants/icons";
import { useSelection } from "@/context/SelectionContext";
import { Link } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

interface MovieCardProps extends Movie {
	cardWidth?: number;
}

const MovieCard = ({
	id,
	poster_path,
	title,
	vote_average,
	release_date,
	cardWidth,
}: MovieCardProps) => {
	const [modalVisible, setModalVisible] = useState(false);
	const { selectionMode, enterSelectionMode, toggleItem, isSelected } = useSelection();
	const containerStyle = cardWidth ? { width: cardWidth } : { width: 128 };
	const posterUrl = poster_path
		? `https://image.tmdb.org/t/p/w500${poster_path}`
		: "https://placehold.cn/500x400/1a1a1a/ffffff.png";

	const item = {
		item_id: id,
		type: "movie" as const,
		title,
		poster_url: posterUrl,
		vote_average,
		year: release_date?.split("-")[0] ?? "",
	};

	const selected = isSelected(id, "movie");

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
			<Text className="text-sm font-bold text-white mt-2" numberOfLines={1}>{title}</Text>
			<View className="flex-row items-center justify-start gap-x-1">
				<Image source={icons.star} className="size-4" />
				<Text className="text-xs text-white font-bold uppercase">{Math.round(vote_average / 2)}</Text>
			</View>
			<Text className="text-xs text-light-300 font-medium mt-1">{release_date?.split("-")[0]}</Text>
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
				<Link href={`/movies/${id}`} asChild>
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

export default MovieCard;
