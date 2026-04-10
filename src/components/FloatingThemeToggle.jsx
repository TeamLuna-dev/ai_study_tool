/* Install Lucide Icons: npm install lucide-react */

import { Sun, Moon } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

export default function FloatingThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title="Toggle theme"
      className="
        fixed bottom-5 right-5 z-50
        h-14 w-14
        rounded-full
        border border-gray-300 dark:border-gray-700
        bg-white/80 dark:bg-gray-900/80
        backdrop-blur-md
        shadow-xl
        transition-all duration-300
        hover:scale-110
        active:scale-95
      "
    >
      <span className="relative flex h-full w-full items-center justify-center overflow-hidden">
        
        {/* ☀️ Sun Icon */}
        <Sun
          className={`
            absolute h-6 w-6 transition-all duration-500
            ${isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}
          `}
        />

        {/* 🌙 Moon Icon */}
        <Moon
          className={`
            absolute h-6 w-6 transition-all duration-500
            ${isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}
          `}
        />
        
      </span>
    </button>
  );
}