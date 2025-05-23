"use client";
import Image from "next/image";
import SearchBar from "./SearchBar";
import { useState } from "react";
import Link from "next/link";
import { SignInButton, SignOutButton } from "@clerk/nextjs";
import { Box, CircleUserRound, Upload } from "lucide-react";

type User = {
  id: string;
  image: string;
} | null;

type Props = {
  user: User;
};

export default function Header({ user }: Props) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="sticky left-0 top-0 bg-background text-text">
      <div className="mx-auto flex items-center justify-between gap-2 p-3">
        <Link href="/" className="flex items-center gap-2">
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
          <SearchBar />
          <Link
            href="/upload"
            className="flex items-center gap-2 rounded-md px-2 py-1 hover:cursor-pointer"
          >
            <Upload />
            <span>Upload</span>
          </Link>
          <div className="flex items-center gap-2 rounded-md px-2 py-1 hover:cursor-pointer">
            <Box />
            <span>Build</span>
          </div>
          <div onClick={() => setShowProfile(!showProfile)}>
            <ProfilePicture user={user} />
          </div>
          {showProfile && <Profile user={user} />}
        </div>
      </div>
    </header>
  );
}

const ProfilePicture = ({ user }: Props) => {
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

const Profile = ({ user }: Props) => {
  return (
    <div className="bg-background-700 border-primary-50 absolute left-[25%] top-[100%] mt-2 flex w-3/4 flex-col rounded-md border">
      <Link href="" className="hover:bg-background-600 w-full rounded-t-md p-2">
        Profile
      </Link>
      <Link href="" className="hover:bg-background-600 w-full p-2">
        Library
      </Link>
      <Link href="" className="hover:bg-background-600 w-full p-2">
        Settings
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
