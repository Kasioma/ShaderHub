"use client";
import Upload from "@/icons/Upload";
import Image from "next/image";
import SearchBar from "./SearchBar";
import Box from "@/icons/Box";
import Person from "@/icons/Person";
import { useState } from "react";
import Link from "next/link";
import { SignInButton, SignOutButton } from "@clerk/nextjs";

type User = {
  id: string;
  username: string;
  email: string;
  image: string;
} | null;

type Props = {
  user: User;
};

export default function Header({ user }: Props) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="sticky bg-background text-text dark">
      <div className="flex items-center justify-between gap-2 p-3 mx-auto">
        <div className="flex items-center gap-2">
          <Image
            src="/logoDark.png"
            alt="Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <h1 className="text-xl font-semibold">ShaderHub</h1>
        </div>
        <div className="flex items-center gap-5 relative">
          <SearchBar />
          <div className="flex items-center gap-2 rounded-md py-1 px-2 hover:cursor-pointer">
            <Upload />
            <span>Upload</span>
          </div>
          <div className="flex items-center gap-2 rounded-md py-1 px-2 hover:cursor-pointer">
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
  if (user === null) return <Person className="w-[40px] h-[40px]" />;
  return <h1>Profile Picture</h1>;
};

const Profile = ({ user }: Props) => {
  return (
    <div className="flex flex-col bg-background-700 rounded-md absolute w-3/4 top-[100%] left-[25%] mt-2 border border-primary-50">
      <Link href="" className="w-full p-2 rounded-t-md hover:bg-background-600">
        Profile
      </Link>
      <Link href="" className="w-full p-2 hover:bg-background-600">
        Library
      </Link>
      <Link href="" className="w-full p-2 hover:bg-background-600">
        Settings
      </Link>
      {user ? (
        <SignOutButton>
          <button className="w-full p-2 rounded-b-md hover:bg-background-600">
            Log Out
          </button>
        </SignOutButton>
      ) : (
        <SignInButton>
          <button className="w-full p-2 rounded-b-md hover:bg-background-600 text-left">
            Sign In
          </button>
        </SignInButton>
      )}
    </div>
  );
};
