"use client";
import { useState, createContext, useContext, useEffect } from "react";

export const ModalContext = createContext<{
  modal: boolean;
  setModal: (modal: boolean) => void;
} | null>(null);

type Props = { children: React.ReactNode };

export function ModalContextProvider({ children }: Props) {
  const [modalInternal, setModalInternal] = useState(false);

  const setModal = (modal: boolean) => setModalInternal(modal);

  useEffect(() => {
    const handlePopState = () => {
      setModalInternal(false);
    };

    window.onpopstate = handlePopState;

    return () => {
      window.onpopstate = null;
    };
  }, []);

  return (
    <ModalContext.Provider value={{ modal: modalInternal, setModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
