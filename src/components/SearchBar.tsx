import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/Dialog";
import { Search } from "lucide-react";

export default function SearchBar() {
  return <DialogDemo />;
}

const DialogDemo = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button>Edit Profile</button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 p-4 border-b w-full">
          <Search className="w-4 h-4" />
          <input
            type="text"
            placeholder="Search Assets"
            className="bg-inherit focus:outline-none w-11/12"
          />
          <DialogCloseButton></DialogCloseButton>
        </div>
        <DialogFooter>
          <button type="submit">Save changes</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
