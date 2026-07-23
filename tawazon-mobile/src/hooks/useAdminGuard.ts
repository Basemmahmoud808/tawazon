import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const ADMIN_EMAIL = "basemmahmoud545@gmail.com";

export function useAdminGuard(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!auth) {
      setIsAdmin(false);
      return;
    }
    // Reactive: re-runs whenever Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user && user.email === ADMIN_EMAIL);
    });
    return () => unsubscribe();
  }, []);

  return isAdmin;
}
