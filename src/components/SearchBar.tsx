import { useEffect, useState } from "react";
import { Search } from "lucide-react";

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key.toLowerCase() === "escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="bg-secondary flex cursor-pointer items-center justify-center gap-2 rounded-full px-2 py-1 text-sm"
      >
        <Search className="h-3 w-3" />
        <span>Ctrl K</span>
      </div>
      {isOpen && <Modal onClose={() => setIsOpen(false)} />}
    </>
  );
}

type ModalProps = {
  onClose: () => void;
};

const Modal = ({ onClose }: ModalProps) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="fixed h-screen w-screen bg-[rgba(14,20,36,0.6)] backdrop-blur-sm"></div>

      <div
        className="absolute z-10 h-screen w-screen p-[12vh]"
        onClick={onClose}
      >
        <div
          className="bg-secondary mx-auto max-w-screen-md rounded-t-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-4 px-5 py-4">
            <Search className="h-3 w-3" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-inherit text-sm outline-none"
            />
            <button className="ring-offset-background data-[state=open]:bg-accent data-[state=open]:text-muted-foreground flex items-center justify-center rounded-md border px-1 leading-none opacity-60 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none">
              <span className="mb-1" onClick={onClose}>
                esc
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
