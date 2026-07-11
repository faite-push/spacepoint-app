"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useWishlistStore } from "@/store/wishlist-store";

export function WishlistSync() {
  const { user, loading } = useAuth();
  const syncForUser = useWishlistStore((s) => s.syncForUser);
  const setCloudUserId = useWishlistStore((s) => s.setCloudUserId);

  useEffect(() => {
    if (loading) return;

    if (user) {
      syncForUser(user.id);
      return;
    }

    setCloudUserId(null);
  }, [user?.id, loading, syncForUser, setCloudUserId]);

  return null;
}
