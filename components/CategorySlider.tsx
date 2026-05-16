import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const CATEGORIES = ["Movies", "TV Shows", "K-Drama"] as const;
export type Category = (typeof CATEGORIES)[number];

interface Props {
	selected: Category;
	onSelect: (category: Category) => void;
}

const CategorySlider = ({ selected, onSelect }: Props) => {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			className="mt-6 mb-2"
			contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
		>
			{CATEGORIES.map((cat) => (
				<TouchableOpacity
					key={cat}
					onPress={() => onSelect(cat)}
					className={`px-5 py-2 rounded-full border ${
						selected === cat
							? "bg-accent border-accent"
							: "border-light-300 bg-transparent"
					}`}
				>
					<Text
						className={`text-sm font-semibold ${
							selected === cat ? "text-white" : "text-light-300"
						}`}
					>
						{cat}
					</Text>
				</TouchableOpacity>
			))}
		</ScrollView>
	);
};

export default CategorySlider;
