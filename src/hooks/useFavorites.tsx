import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Heart } from "lucide-react";

const iconChip = (bg: string, children: React.ReactNode) => (
  <span
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "none",
      width: 34,
      height: 34,
      borderRadius: 9999,
      background: bg,
    }}
  >
    {children}
  </span>
);

export function useFavorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    onSuccess: ({ listingId, added }) => {
      qc.invalidateQueries({ queryKey: ["favorites", user?.id] });
      qc.invalidateQueries({ queryKey: ["favorite-listings", user?.id] });
      if (added) {
        toast.success("Saved to favorites", {
          icon: iconChip(
            "#CC0000",
            <Heart size={18} color="#fff" fill="#fff" strokeWidth={2} />
          ),
          action: {
            label: "View",
            onClick: () => navigate({ to: "/favorites" }),
          },
        });
      } else {
        toast.success("Removed from favorites", {
          icon: iconChip(
            "#2E2E2E",
            <Heart size={18} color="#fff" strokeWidth={2} />
          ),
          action: {
            label: "Undo",
            onClick: async () => {
              if (!user) return;
              const { error } = await supabase
                .from("favorites")
                .insert({ user_id: user.id, listing_id: listingId });
              if (error) console.error(error);
              qc.invalidateQueries({ queryKey: ["favorites", user?.id] });
              qc.invalidateQueries({ queryKey: ["favorite-listings", user?.id] });
            },
          },
        });
      }
    },
    onError: (err: Error) => {
      if (err.message.includes("Sign in")) {
        toast.custom((t) => (
          <div
            className="w-full max-w-[356px] rounded-[20px] font-sans"
            style={{
              background: "#141414",
              padding: 14,
              boxShadow: "0 10px 28px rgba(20,20,20,0.28)",
            }}
          >
            <div className="flex items-center gap-3">
              {iconChip("#2E2E2E", <Heart size={18} color="#fff" strokeWidth={2} />)}
              <div>
                <div className="text-[14px] font-semibold text-white">
                  Sign in to save favorites
                </div>
                <div className="text-[12px] text-[#BDBDBD]">
                  Keep a list of places you love.
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  toast.dismiss(t);
                  navigate({ to: "/auth/login" });
                }}
                className="h-[44px] flex-1 rounded-full text-[13px] font-bold uppercase tracking-[0.04em] text-white"
                style={{ background: "#CC0000" }}
              >
                Log in
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t);
                  navigate({ to: "/auth/signup" });
                }}
                className="h-[44px] flex-1 rounded-full text-[13px] font-bold uppercase tracking-[0.04em] text-white"
                style={{ background: "transparent", border: "1px solid #4A4A4A" }}
              >
                Sign up
              </button>
            </div>
          </div>
        ));
      } else {
        toast.error("Something went wrong", {
          description: "Please try again in a moment.",
        });
        console.error(err);
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
