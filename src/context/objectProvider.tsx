"use client";
import { useState, createContext, useContext, useEffect } from "react";

export const ObjectModalContext = createContext<{
  objectModal: boolean;
  setObjectModal: (objectModal: boolean) => void;
} | null>(null);

type Props = { children: React.ReactNode };

export function ObjectModalContextProvider({ children }: Props) {
  const [objectModalInternal, setObjectModalInternal] = useState(false);

  const setObjectModal = (objectModal: boolean) =>
    setObjectModalInternal(objectModal);

  useEffect(() => {
    const handlePopState = () => {
      setObjectModalInternal(false);
    };

    window.onpopstate = handlePopState;

    return () => {
      window.onpopstate = null;
    };
  }, []);

  return (
    <ObjectModalContext.Provider
      value={{ objectModal: objectModalInternal, setObjectModal }}
    >
      {children}
    </ObjectModalContext.Provider>
  );
}

export const useObjectModal = () => {
  const context = useContext(ObjectModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
