import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import PreviewModel from "./PreviewModel";
import { useObjectModal } from "@/context/objectProvider";
import {
  Bookmark,
  CircleUserRound,
  Download,
  Star,
  Tag,
  X,
} from "lucide-react";
import Image from "next/image";
import { downloadZip, unzipFiles } from "@/utilities/utils";
import type { ParsedModelProps } from "@/utilities/types";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utilities/trpc";

type Props = {
  modelBlob: Blob;
  objectId: string;
  title: string;
  username: string;
  userId: string;
  onClose: () => void;
};

export default function ModelModal({
  modelBlob,
  objectId,
  title,
  username,
  userId,
  onClose,
}: Props) {
  const trpc = useTRPC();
  const { objectModal, setObjectModal } = useObjectModal();
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [parsedObject, setParsedObject] = useState<ParsedModelProps | null>(
    null,
  );
  const { data } = useQuery(
    trpc.main.getObjectInformation.queryOptions({ objectId: objectId }),
  );

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

  useEffect(() => {
    if (!modelBlob) return;
    async function parseModel() {
      const unzipped = await unzipFiles(modelBlob);
      if (!unzipped) return;
      setParsedObject(unzipped);
    }
    parseModel().catch(console.error);
  }, [modelBlob]);

  const handleTextures = (textures: Map<string, Blob>) => {
    const result = new Map<string, string>();
    for (const [key, blob] of textures) {
      const newKey = key.split("/").pop()!;
      result.set(newKey, URL.createObjectURL(blob));
    }
    return result;
  };

  const MemoizedModel = useMemo(() => {
    if (!parsedObject) return null;

    return (
      <PreviewModel
        fileType={parsedObject.fileType}
        fileUrl={URL.createObjectURL(parsedObject.fileBlob)}
        fileBinary={URL.createObjectURL(
          parsedObject.kind === "gltf" ? parsedObject.fileBinary : new Blob([]),
        )}
        fileTextures={handleTextures(parsedObject.fileTextures)}
      />
    );
  }, [parsedObject]);

  const handleDownload = () => {
    if (!modelBlob) return;
    downloadZip(modelBlob);
  };

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
          {parsedObject && (
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
          <div className="mt-3 flex flex-row items-center justify-between gap-3 text-text">
            <div className="flex items-center gap-3">
              <ProfilePicture imageUrl={profilePic} />
              <h2>{username} -</h2>
              <h2>{title}</h2>
              <p></p>
            </div>
            <div className="flex gap-3">
              <div>
                <Download
                  className="h-5 w-5 cursor-pointer"
                  onClick={() => handleDownload()}
                />
              </div>
              <div>
                <Star className="h-5 w-5 cursor-pointer" />
              </div>
              <div>
                <Bookmark className="h-5 w-5 cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
        <div className="relative flex w-2/6 flex-col items-center justify-center gap-10">
          <div className="flex w-[90%] flex-col items-center gap-2">
            <h3 className="bold text-xl">Tags</h3>
            <TagList tags={data?.tags ?? []} />
          </div>
          <div className="flex w-[90%] flex-col items-center gap-2">
            <h3 className="bold text-xl">Attributes</h3>
            <AttributeList attributes={data?.attributes ?? []} />
          </div>
        </div>
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

type TagType = {
  id: string;
  name: string;
  colour: string;
};

function TagList({ tags }: { tags: TagType[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.length > 0
        ? tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 rounded-md bg-secondary p-2"
            >
              <Tag style={{ color: tag.colour }} />
              <p style={{ color: tag.colour }}>{tag.name}</p>
            </div>
          ))
        : null}
    </div>
  );
}

type AttributeType = {
  id: string;
  name: string;
  value: string;
};

function AttributeList({ attributes }: { attributes: AttributeType[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {attributes.length > 0
        ? attributes.map((attribute) => (
            <div
              key={attribute.id}
              className="flex items-center gap-2 rounded-md bg-secondary p-2"
            >
              <p>{attribute.name} :</p>
              <p>{attribute.value}</p>
            </div>
          ))
        : null}
    </div>
  );
}
