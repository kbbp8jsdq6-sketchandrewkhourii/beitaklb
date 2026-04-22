import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useFavorites() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const favoritesQuery = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("listing_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((f) => f.listing_id));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (listingId: string) => {
      if (!user) throw new Error("Sign in to save your favorites");
      const isFav = favoritesQuery.data?.has(listingId);
      if (isFav) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);
        if (error) throw error;
        return { listingId, added: false };
      }
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, listing_id: listingId });
      if (error) throw error;
      return { listingId, added: true };
    },
    onSuccess: ({ added }) => {
      qc.invalidateQueries({ queryKey: ["favorites", user?.id] });
      qc.invalidateQueries({ queryKey: ["favorite-listings", user?.id] });
      if (added) toast.success("Saved to favorites");
      else toast.success("Removed from favorites");
    },
    onError: (err: Error) => {
      if (err.message.includes("Sign in")) {
        toast.message(err.message, { description: "Create an account or log in to keep your favorite listings." });
      } else {
        toast.error(err.message);
      }
    },
  });

  return {
    favoriteIds: favoritesQuery.data ?? new Set<string>(),
    isLoading: favoritesQuery.isLoading,
    toggleFavorite: (id: string) => toggleMutation.mutate(id),
    isToggling: toggleMutation.isPending,
    isLoggedIn: !!user,
  };
}
