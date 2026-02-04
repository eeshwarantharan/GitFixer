"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "@radix-ui/react-icons";

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme, resolvedTheme } = useTheme();
    const currentTheme = theme === "system" ? resolvedTheme : theme;

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <button
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            className="btn-retro w-10 h-10 p-0 flex items-center justify-center"
            aria-label="Toggle theme"
        >
            {mounted ? (
                currentTheme === "dark" ? (
                    <SunIcon className="w-4 h-4" />
                ) : (
                    <MoonIcon className="w-4 h-4" />
                )
            ) : (
                <div className="w-4 h-4" />
            )}
        </button>
    );
}
