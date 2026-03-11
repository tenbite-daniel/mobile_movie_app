import { Client, ID, Query, TablesDB } from "react-native-appwrite";
// track the searches made by the user

// setup Appwrite database
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const TABLE_ID = process.env.EXPO_PUBLIC_APPWRITE_TABLE_ID!;

const client = new Client()
	.setEndpoint("https://fra.cloud.appwrite.io/v1")
	.setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

const tablesDB = new TablesDB(client);

export const updateSearchCount = async (query: string, movie: Movie) => {
	try {
		// first check out  everything that we have in our database
		const result = await tablesDB.listRows(DATABASE_ID, TABLE_ID, [
			Query.equal("searchTerm", query),
		]);

		// check if a record of that search has already been stored
		// if a document is found incremnet the searchCount field
		if (result.rows.length > 0) {
			const existingMovie = result.rows[0];

			await tablesDB.updateRow(DATABASE_ID, TABLE_ID, existingMovie.$id, {
				count: existingMovie.count + 1,
			});
		} else {
			// if no document is found
			// create a new document in Appwrite database -> 1
			await tablesDB.createRow(DATABASE_ID, TABLE_ID, ID.unique(), {
				searchTerm: query,
				movie_id: movie.id,
				count: 1,
				title: movie.title,
				poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
			});
		}
	} catch (error) {
		console.log(error);
		throw error;
	}
};

export const getTrendingMovies = async (): Promise<
	TrendingMovie[] | undefined
> => {
	try {
		const result = await tablesDB.listRows(DATABASE_ID, TABLE_ID, [
			Query.limit(5),
			Query.orderDesc("count"),
		]);

		return result.rows as unknown as TrendingMovie[];
	} catch (error) {
		console.log(error);
		return undefined;
	}
};
