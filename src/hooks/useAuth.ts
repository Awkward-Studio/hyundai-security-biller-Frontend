import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";

interface User {
    name: string;
    labels: string[];
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);

        const getUser = () => {
            try {
                const token = getCookie("user");
                if (!token) {
                    setUser(null);
                    return;
                }
                const parsed = JSON.parse(String(token));
                setUser({
                    name: parsed?.name ?? "",
                    labels: parsed?.labels ?? []
                });
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        getUser();
    }, []);

    return {
        user,
        isLoading: isLoading || !isClient,
        isAuthenticated: !!user,
        isAdmin: user?.labels?.[0] === "admin"
    };
};
