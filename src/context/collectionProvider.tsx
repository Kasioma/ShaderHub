"use client";
import { useState, createContext, useContext, useEffect } from "react";

export const CollectionContext = createContext<{
  collection: boolean;
  setCollection: (collection: boolean) => void;
} | null>(null);

type Props = { children: React.ReactNode };

export function CollectionContextProvider({ children }: Props) {
  const [collectionInternal, setCollectionInternal] = useState(false);

  const setCollection = (collection: boolean) =>
    setCollectionInternal(collection);

  useEffect(() => {
    const handlePopState = () => {
      setCollectionInternal(false);
    };

    window.onpopstate = handlePopState;

    return () => {
      window.onpopstate = null;
    };
  }, []);

  return (
    <CollectionContext.Provider
      value={{ collection: collectionInternal, setCollection }}
    >
      {children}
    </CollectionContext.Provider>
  );
}

export const useCollection = () => {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
