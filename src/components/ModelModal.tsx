import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import PreviewModel from "./PreviewModel";
import type { SupportedLoaders } from "@/utilities/types";
import { useObjectModal } from "@/context/objectProvider";
import { Bookmark, CircleUserRound, Star, X } from "lucide-react";
import Image from "next/image";

type Props = {
  fileType: SupportedLoaders;
  loadedFile: Blob;
  binary: Blob | null;
  textures: Map<string, Blob>;
  title: string;
  username: string;
  userId: string;
  onClose: () => void;
};

export default function ModelModal({
  fileType,
  loadedFile,
  binary,
  textures,
  title,
  username,
  userId,
  onClose,
}: Props) {
  const { objectModal, setObjectModal } = useObjectModal();
  const [profilePic, setProfilePic] = useState<string | null>(null);

  useEffect(() => {
    const fetchPicture = async () => {
      try {
        const res = await fetch(`/api/clerk/picture?userId=${userId}`);
        const data: string = (await res.json()) as string;
        if (data) {
          setProfilePic(data);
        }
      } catch (err) {
        console.error("Error fetching picture", err);
      }
    };

    if (userId) {
      fetchPicture().catch(console.error);
    }
  }, [userId]);

  const handleTextures = (textures: Map<string, Blob>) => {
    const result = new Map<string, string>();
    for (const [key, blob] of textures) {
      const newKey = key.split("/").pop()!;
      result.set(newKey, URL.createObjectURL(blob));
    }
    return result;
  };

  const MemoizedModel = useMemo(
    () => (
      <PreviewModel
        fileType={fileType}
        fileUrl={URL.createObjectURL(loadedFile)}
        fileBinary={URL.createObjectURL(binary ?? new Blob([]))}
        fileTextures={handleTextures(textures)}
      />
    ),
    [loadedFile, binary, textures, fileType],
  );

  return objectModal ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[75vh] min-h-[50vh] w-[60vw] overflow-y-auto rounded-xl bg-secondary p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-4/6 flex-col gap-1 text-xl text-primary">
          {loadedFile && (
            <div className="relative h-full">
              <Canvas className="h-full w-full rounded-md border-2 border-primary">
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <ambientLight intensity={0.5} />
                <PerspectiveCamera
                  makeDefault
                  position={[10, 10, 10]}
                  fov={45}
                />
                {MemoizedModel}
                <OrbitControls target0={[0, 0, 0]} />
              </Canvas>
            </div>
          )}
          <div className="mt-3 flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ProfilePicture imageUrl={profilePic} />
              <h2>{username} -</h2>
              <h2>{title}</h2>
              <p></p>
            </div>
            <div className="flex gap-3">
              <div>
                <Star />
              </div>
              <div>
                <Bookmark />
              </div>
            </div>
          </div>
        </div>
        <div className="relative flex w-2/6 flex-col items-center"></div>
        <X
          onClick={onClose}
          className="absolute right-5 top-5 h-5 w-5 cursor-pointer text-text"
        />
      </div>
    </div>
  ) : null;
}

type ProfilePictureProps = {
  imageUrl: string | null;
};

const ProfilePicture = ({ imageUrl }: ProfilePictureProps) => {
  if (!imageUrl) {
    return <CircleUserRound className="h-[40px] w-[40px]" />;
  }

  return (
    <Image
      src={imageUrl}
      alt="Profile Picture"
      width={40}
      height={40}
      className="rounded-full"
    />
  );
};
