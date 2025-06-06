"use client";
import Image from "next/image";
import SearchBar from "./SearchBar";
import Link from "next/link";
import { SignInButton, SignOutButton } from "@clerk/nextjs";
import { Box, CircleUserRound, Upload } from "lucide-react";
import { Portal } from "./Portal";
import { useState } from "react";

type User = {
  id: string;
  image: string;
  roles: string[];
} | null;

type ProfileProps = {
  user: User;
};

type ProfileModalProps = {
  user: User;
  handleCloseModal: () => void;
};

export default function Header({ user }: ProfileProps) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="sticky left-0 top-0 bg-background text-text">
      <div className="mx-auto flex items-center justify-between gap-2 p-3">
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setShowProfile(false)}
        >
          <Image
            src="/logoDark.png"
            alt="Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <h1 className="text-xl font-semibold">ShaderHub</h1>
        </Link>
        <div className="relative flex items-center gap-5">
          <SearchBar userId={user?.id ?? null} />
          <Link
            href="/upload"
            className="flex items-center gap-2 rounded-md px-2 py-1 hover:cursor-pointer"
            onClick={() => setShowProfile(false)}
          >
            <Upload />
            <span>Upload</span>
          </Link>
          {user?.roles.includes("admin") === true && (
            <Link
              href="/requests"
              className="flex items-center gap-2 rounded-md px-2 py-1 hover:cursor-pointer"
            >
              <Box />
              <span>Requests</span>
            </Link>
          )}
          <div onClick={() => setShowProfile(!showProfile)}>
            <ProfilePicture user={user} />
          </div>
          {showProfile && (
            <Portal>
              <Profile
                user={user}
                handleCloseModal={() => setShowProfile(false)}
              />
            </Portal>
          )}
        </div>
      </div>
    </header>
  );
}

const ProfilePicture = ({ user }: ProfileProps) => {
  if (user === null) return <CircleUserRound className="h-[40px] w-[40px]" />;
  return (
    <Image
      src={user.image}
      alt="Profile Picture"
      width={40}
      height={40}
      className="rounded-full"
    />
  );
};

const Profile = ({ user, handleCloseModal }: ProfileModalProps) => {
  return (
    <div className="border-primary-50 absolute right-[1%] top-[8%] z-50 mt-2 flex w-1/4 max-w-[300px] flex-col rounded-md border bg-background">
      {user ? (
        <Link
          href={`/profile/${user.id}`}
          className="hover:bg-background-600 w-full rounded-t-md p-2"
          onClick={() => handleCloseModal()}
        >
          Profile
        </Link>
      ) : (
        <span className="text-muted-foreground w-full cursor-not-allowed rounded-t-md p-2">
          Profile
        </span>
      )}

      <Link
        href="/library"
        className="hover:bg-background-600 w-full p-2"
        onClick={() => handleCloseModal()}
      >
        Library
      </Link>
      {user ? (
        <SignOutButton>
          <button className="w-full rounded-b-md p-2 text-left">Log Out</button>
        </SignOutButton>
      ) : (
        <SignInButton>
          <button className="w-full rounded-b-md p-2 text-left">Sign In</button>
        </SignInButton>
      )}
    </div>
  );
};
