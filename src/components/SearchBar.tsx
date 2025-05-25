"use client";
import { useEffect, useState } from "react";
import { ArrowUpLeft, Search } from "lucide-react";
import { useModal } from "@/context/searchProvider";
import { useObjectModal } from "@/context/objectProvider";
import { useTRPC } from "@/utilities/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "./toaster/use-toast";
import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";

export default function SearchBar({ userId }: { userId: string | null }) {
  const { modal, setModal } = useModal();
  const { setObjectModal } = useObjectModal();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modal && e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setModal(true);
        setObjectModal(false);
      }
      if (modal && e.key.toLowerCase() === "escape") {
        e.preventDefault();
        setModal(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setModal, modal, setObjectModal]);

  const handleModalClose = () => {
    setModal(false);
  };

  return (
    <>
      <div
        onClick={() => {
          setModal(true);
          setObjectModal(false);
        }}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-secondary px-2 py-1 text-sm"
      >
        <Search className="h-3 w-3" />
        <span>Ctrl K</span>
      </div>
      {modal && <Modal onClose={handleModalClose} userId={userId} />}
    </>
  );
}

type ModalProps = {
  userId: string | null;
  onClose: () => void;
};

type History = {
  id: string;
  query: string;
  createdAt: number;
};

type Tags = {
  id: string;
  name: string;
  colour: string;
}[];

const Modal = ({ onClose, userId }: ModalProps) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.main.getUserSearchHistory.queryOptions(
      { userId: userId ?? "" },
      {
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
    ),
  );

  const mutationOptions = {
    onError(error: { message: string }) {
      toast({
        variant: "destructive",
        title: "Server error",
        description: error.message,
      });
    },
  };

  const addHistory = useMutation(
    trpc.main.addUserSearchHistory.mutationOptions(mutationOptions),
  );

  const handleHistory = (history: History[]) => {
    const newHistory = history.map((item) => item.query);
    return newHistory;
  };

  const handleSearch = async () => {
    if (!query) return;
    if (userId != null)
      await addHistory.mutateAsync({
        userId: userId,
        query: query,
      });
    const encodedQuery = encodeURIComponent(query);
    router.push(`/search?query=${encodedQuery}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="absolute z-50 h-screen w-screen bg-[rgba(14,20,36,0.6)] backdrop-blur-sm"></div>

      <div
        className="absolute z-50 h-screen w-screen p-[12vh]"
        onClick={onClose}
      >
        <div
          className="mx-auto max-w-screen-md rounded-t-md bg-secondary"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-4 px-5 py-4">
            <Search className="h-3 w-3" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-inherit text-sm outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={async (e) =>
                e.key === "Enter" && (await handleSearch())
              }
            />
            <button className="data-[state=open]:text-muted-foreground flex items-center justify-center rounded-md border px-1 leading-none opacity-60 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent">
              <span className="mb-1" onClick={onClose}>
                esc
              </span>
            </button>
          </div>

          {isLoading ? (
            <div className="p-3 text-gray-500">Loading...</div>
          ) : (
            <SearchHistory history={handleHistory(data ?? [])} />
          )}
        </div>
      </div>
    </div>
  );
};

function SearchHistory({ history }: { history: string[] }) {
  return (
    <div className="flex flex-col gap-3 rounded-md bg-secondary text-sm">
      <h1 className="p-3 text-lg">Search History</h1>
      {history.map((item, index) => (
        <div key={index}>
          <div className="cursor-pointer p-2 hover:bg-accent">
            <div className="flex items-center justify-between px-3 py-1">
              <span>{item}</span>
              <ArrowUpLeft className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
