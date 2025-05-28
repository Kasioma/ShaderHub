"use client";
import { useState, createContext, useContext, useEffect } from "react";

export const ProfileContext = createContext<{
  profile: boolean;
  setProfile: (profile: boolean) => void;
} | null>(null);

type Props = { children: React.ReactNode };

export function ProfileContextProvider({ children }: Props) {
  const [profileInternal, setProfileInternal] = useState(false);

  const setProfile = (profile: boolean) => setProfileInternal(profile);

  useEffect(() => {
    const handlePopState = () => {
      setProfileInternal(false);
    };

    window.onpopstate = handlePopState;

    return () => {
      window.onpopstate = null;
    };
  }, []);

  return (
    <ProfileContext.Provider value={{ profile: profileInternal, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ModalProvider");
  }
  return context;
};
