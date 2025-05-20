"use client";
import {
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
} from "react";

type Theme = "light" | "dark";

export const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme | ((prevTheme: Theme) => Theme)) => void;
} | null>(null);

type Props = { children: React.ReactNode };

export function ThemeContextProvider({ children }: Props) {
  const [themeInternal, setThemeInternal] = useState<Theme>(() =>
    typeof document !== "undefined" && document.body.classList.contains("dark")
      ? "dark"
      : "light"
  );

  const setTheme = useCallback(
    (theme: Theme | ((prevTheme: Theme) => Theme)) => {
      if (typeof theme !== "string") {
        theme = theme(themeInternal);
      }

      if (theme === "dark") {
        setThemeInternal("dark");
        window.localStorage.setItem("theme", "dark");
    
        document.body.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      } else {
        setThemeInternal("light");
        window.localStorage.setItem("theme", "light");
    
        document.body.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
      }

      document.body.classList.add("no-duration");
      setTimeout(() => document.body.classList.remove("no-duration"), 1);
    },
    [themeInternal]
  );

  useEffect(() => {
    const localTheme = window.localStorage.getItem("theme") as Theme | null;

    if (localTheme) {
      if (localTheme === "dark") {
        setTheme("dark");
      } else {
        setTheme("light");
      }
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme: themeInternal, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context == null) {
    throw new Error("useTheme must be used within an ThemeContextProvider");
  }

  return context;
}
