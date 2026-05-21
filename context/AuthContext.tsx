import {
    clearUserCache,
    setCurrentUserId,
    syncFromSupabase,
} from "@/services/localFavorites";
import { supabase } from "@/services/supabase";
import { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
	session: Session | null;
	user: User | null;
	loading: boolean;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
	session: null,
	user: null,
	loading: true,
	signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Get initial session on app start
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			if (session?.user) {
				// Restore userId reference and hydrate cache from Supabase
				setCurrentUserId(session.user.id);
				syncFromSupabase(session.user.id);
			}
			setLoading(false);
		});

		// Listen for auth state changes (login / logout)
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			setSession(session);

			if (event === "SIGNED_IN" && session?.user) {
				setCurrentUserId(session.user.id);
				// Pull this user's cloud data into the local cache
				await syncFromSupabase(session.user.id);
			}

			if (event === "SIGNED_OUT") {
				// session is null at this point, so we track the previous userId
				// via the module-level ref before clearing it
				setCurrentUserId(null);
			}
		});

		return () => subscription.unsubscribe();
	}, []);

	const signOut = async () => {
		const userId = session?.user?.id;
		// Clear this user's local cache before signing out
		if (userId) await clearUserCache(userId);
		setCurrentUserId(null);
		await supabase.auth.signOut();
	};

	return (
		<AuthContext.Provider
			value={{ session, user: session?.user ?? null, loading, signOut }}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
