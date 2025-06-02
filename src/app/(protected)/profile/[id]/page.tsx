"use client";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { ProfilePicture } from "@/components/ProfilePicture";
import { useEffect, useState } from "react";

type User = {
  id: string;
  imageUrl: string;
  username: string;
  email: string;
};

export default function Page() {
  const params = useParams();
  const [paramUser, setParamUser] = useState<User | null>(null);
  const id = params?.id as string;

  const { user: pageUser } = useUser();

  useEffect(() => {
    const fetchPicture = async () => {
      try {
        const res = await fetch(`/api/clerk/data?userId=${id}`);
        const data: User = (await res.json()) as User;
        if (data) {
          setParamUser(data);
        }
      } catch (err) {
        console.error("Error fetching picture", err);
      }
    };

    if (id) {
      fetchPicture().catch(console.error);
    }
  }, [id]);

  console.log(paramUser);
  console.log(pageUser);

  return (
    <section className="flex h-full">
      <div className="mx-auto flex w-10/12 items-center p-4">
        <div className="flex max-w-[20%] flex-col items-center justify-center gap-2">
          <ProfilePicture
            imageUrl={paramUser?.imageUrl ?? ""}
            width={500}
            height={500}
          />
          <span>{paramUser?.username ?? ""}</span>
          {paramUser?.id === pageUser?.id ? (
            <button>Edit Profile</button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
