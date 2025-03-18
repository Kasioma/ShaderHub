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
        className="text-sm flex gap-2 justify-center items-center rounded-full px-2 py-1 bg-secondary cursor-pointer"
      >
        <Search className="w-3 h-3" />
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
      <div className="fixed w-screen h-screen bg-[rgba(14,20,36,0.6)] backdrop-blur-sm"></div>

      <div
        className="absolute w-screen h-screen z-10 p-[12vh]"
        onClick={onClose}
      >
        <div
          className="max-w-screen-md mx-auto bg-secondary rounded-t-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center px-5 py-4 gap-4">
            <Search className="w-3 h-3" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full text-sm bg-inherit outline-none"
            />
            <button
              className="rounded-md opacity-60 border px-1 leading-none flex items-center justify-center 
              ring-offset-background transition-opacity hover:opacity-100 focus:outline-none 
              disabled:pointer-events-none data-[state=open]:bg-accent
              data-[state=open]:text-muted-foreground"
            >
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
