import { FavoriteType } from "@/services/localFavorites";
import React, { createContext, useCallback, useContext, useReducer } from "react";

export interface SelectableItem {
	item_id: number;
	type: FavoriteType;
	title: string;
	poster_url: string;
	vote_average: number;
	year: string;
}

interface SelectionContextValue {
	selectionMode: boolean;
	selectedItems: SelectableItem[];
	enterSelectionMode: (firstItem: SelectableItem) => void;
	exitSelectionMode: () => void;
	toggleItem: (item: SelectableItem) => void;
	isSelected: (item_id: number, type: FavoriteType) => boolean;
}

const SelectionContext = createContext<SelectionContextValue>({
	selectionMode: false,
	selectedItems: [],
	enterSelectionMode: () => {},
	exitSelectionMode: () => {},
	toggleItem: () => {},
	isSelected: () => false,
});

type State = { selectionMode: boolean; selectedItems: SelectableItem[] };
type Action =
	| { type: "ENTER"; item: SelectableItem }
	| { type: "EXIT" }
	| { type: "TOGGLE"; item: SelectableItem };

const reducer = (state: State, action: Action): State => {
	switch (action.type) {
		case "ENTER":
			return { selectionMode: true, selectedItems: [action.item] };
		case "EXIT":
			return { selectionMode: false, selectedItems: [] };
		case "TOGGLE": {
			const exists = state.selectedItems.some(
				(i) => i.item_id === action.item.item_id && i.type === action.item.type,
			);
			if (exists) {
				const next = state.selectedItems.filter(
					(i) => !(i.item_id === action.item.item_id && i.type === action.item.type),
				);
				return { selectionMode: next.length > 0, selectedItems: next };
			}
			return { ...state, selectedItems: [...state.selectedItems, action.item] };
		}
	}
};

export const SelectionProvider = ({ children }: { children: React.ReactNode }) => {
	const [{ selectionMode, selectedItems }, dispatch] = useReducer(reducer, {
		selectionMode: false,
		selectedItems: [],
	});

	const enterSelectionMode = useCallback((firstItem: SelectableItem) => {
		dispatch({ type: "ENTER", item: firstItem });
	}, []);

	const exitSelectionMode = useCallback(() => {
		dispatch({ type: "EXIT" });
	}, []);

	const toggleItem = useCallback((item: SelectableItem) => {
		dispatch({ type: "TOGGLE", item });
	}, []);

	const isSelected = useCallback(
		(item_id: number, type: FavoriteType) =>
			selectedItems.some((i) => i.item_id === item_id && i.type === type),
		[selectedItems],
	);

	return (
		<SelectionContext.Provider
			value={{
				selectionMode,
				selectedItems,
				enterSelectionMode,
				exitSelectionMode,
				toggleItem,
				isSelected,
			}}
		>
			{children}
		</SelectionContext.Provider>
	);
};

export const useSelection = () => useContext(SelectionContext);
