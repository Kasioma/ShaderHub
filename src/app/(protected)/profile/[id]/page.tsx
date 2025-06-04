"use client";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { ProfilePicture } from "@/components/ProfilePicture";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/utilities/trpc";
import { BarChart3, Folder, Star } from "lucide-react";
import { cn } from "@/utilities/utils";
import LoginModal from "@/components/LoginModal";
import { Portal } from "@/components/Portal";
import { toast } from "@/components/toaster/use-toast";

type User = {
  id: string;
  imageUrl: string;
  username: string;
  email: string;
};

type ViewType = "profile" | "settings";

export default function Page() {
  const trpc = useTRPC();
  const params = useParams();
  const [paramUser, setParamUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewType>("profile");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const id = params?.id as string;

  const { user: pageUser } = useUser();

  const queryClient = useQueryClient();
  const { data: profileData } = useQuery(
    trpc.profile.getProfile.queryOptions({ userId: id }),
  );

  const mutationOptions = {
    onError(error: { message: string }) {
      toast({
        variant: "destructive",
        title: "Server error",
        description: error.message,
      });
    },
    async onSuccess() {
      await refetchProfile();
    },
  };

  const mutateCredentialsMutation = useMutation(
    trpc.profile.updateCredentials.mutationOptions(mutationOptions),
  );

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

  const handleChangeCredentials = async () => {
    try {
      if (!newUsername) return;
      const user = await changeCredentials(id, newUsername);
      if (user) {
        await mutateCredentialsMutation.mutateAsync({
          userId: id,
          username: newUsername,
        });
        setIsEditing(false);
        clearForm();
        toast({
          variant: "default",
          title: "Success",
          description: "Credentials changed successfully",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to change credentials",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to change credentials",
      });
    }
  };

  const refetchProfile = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.profile.getProfile.queryKey(),
    });
  };

  const clearForm = () => {
    setNewUsername("");
  };

  return (
    <section className="flex h-full">
      <div className="mx-auto flex w-10/12 items-center justify-between gap-5 p-4">
        {paramUser ? (
          <div className="flex max-w-[20%] flex-col items-center justify-center gap-2 text-xl text-text">
            <ProfilePicture
              imageUrl={paramUser?.imageUrl ?? ""}
              width={500}
              height={500}
            />
            <span>{paramUser?.username ?? ""}</span>
            {paramUser?.id === pageUser?.id ? (
              view === "profile" ? (
                <button
                  className="rounded-md border px-4 py-1 hover:bg-secondary"
                  onClick={() => setView("settings")}
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  className="rounded-md border px-4 py-1 hover:bg-secondary"
                  onClick={() => setView("profile")}
                >
                  View Profile
                </button>
              )
            ) : null}
          </div>
        ) : (
          <div className="flex max-w-[20%] flex-col items-center justify-center gap-2 text-xl text-text">
            <p className="text-lg">Loading Profile...</p>
          </div>
        )}
        <div
          className={cn("mx-auto w-[70%] gap-4 text-text", {
            "grid grid-cols-2": view === "profile",
          })}
        >
          {view === "profile" &&
            profileData &&
            Object.entries(profileData).map(([key, value]) => (
              <div
                key={key}
                className="flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-primary p-6 shadow-md transition-transform hover:scale-[1.02]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  {key === "objectsUploaded" ? (
                    <BarChart3 className="h-6 w-6 text-text" />
                  ) : key === "collectionNumber" ? (
                    <Folder className="h-6 w-6 text-text" />
                  ) : (
                    <Star className="h-6 w-6 text-text" />
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-sm capitalize text-gray-500">
                    {value.name}
                  </span>
                  <span className="text-2xl font-semibold text-gray-800">
                    {value.value}
                  </span>
                </div>
              </div>
            ))}

          {view === "settings" && (
            <div className="mx-auto flex w-[70%] flex-col gap-10 text-text">
              <h2 className="text-3xl">Settings</h2>

              <div className="flex w-full flex-col gap-4 rounded-xl bg-white/5 p-6 shadow-sm">
                <div className="border-border flex items-center justify-between border-b pb-4">
                  <label htmlFor="username" className="w-1/4 text-base">
                    Username
                  </label>
                  <div className="flex w-3/4 items-center justify-end gap-4">
                    {isEditing ? (
                      <input
                        type="text"
                        id="username"
                        className="border-border rounded-md border bg-background px-3 py-2"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                      />
                    ) : (
                      <span>{paramUser?.username ?? ""}</span>
                    )}
                    <button
                      className="text-sm text-primary hover:underline"
                      onClick={() => setShowModal(true)}
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div className="border-border flex items-center justify-between border-b pb-4">
                  <label htmlFor="email" className="w-1/4 text-base">
                    Email
                  </label>
                  <div className="flex w-3/4 items-center justify-end gap-4">
                    <span>{paramUser?.email ?? ""}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-4">
                  <label htmlFor="password" className="w-1/4 text-base">
                    Password
                  </label>
                  <div className="flex w-3/4 items-center justify-end gap-4">
                    <button className="text-sm text-primary hover:underline">
                      Change
                    </button>
                  </div>
                </div>
              </div>
              {isEditing && (
                <div className="flex justify-between">
                  <button
                    className="rounded-full border px-4 py-1 text-text hover:bg-primary hover:text-secondary"
                    onClick={() => {
                      setIsEditing(false);
                      clearForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-full bg-primary px-4 py-1 text-secondary hover:opacity-80"
                    onClick={async () => {
                      setIsEditing(false);
                      clearForm();
                      await handleChangeCredentials();
                    }}
                  >
                    Confirm
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showModal && (
        <Portal>
          <LoginModal
            onSuccess={() => {
              setIsEditing(true);
              setShowModal(false);
            }}
            onClose={() => setShowModal(false)}
          />
        </Portal>
      )}
    </section>
  );
}

async function changeCredentials(id: string, username: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const APIInputData = new FormData();
  APIInputData.append("userId", id);
  APIInputData.append("username", username);
  const res = await fetch(`${baseUrl}/api/clerk/update`, {
    method: "POST",
    body: APIInputData,
  });

  if (!res.ok) {
    console.error("Error fetching object");
    return;
  } else return true;
}
