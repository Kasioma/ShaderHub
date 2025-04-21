"use client";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { CircleX, File, Search, Tag } from "lucide-react";
import PreviewModel from "@/components/PreviewModel";
import type { SupportedLoaders } from "@/utilities/types";
import { useModal } from "@/context/modal";
import { cn } from "@/utilities/utils";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utilities/trpc";
import type { AttributeType, Tag as TagSchema } from "@/utilities/zod/parsers";

export default function Page() {
  const { modal } = useModal();
  const trpc = useTRPC();
  const [tagView, setTagView] = useState<boolean>(true);
  const [loadedFile, setLoadedFile] = useState<string>("");
  const [binary, setBinary] = useState<string>("");
  const [textures, setTextures] = useState<Map<string, string>>(new Map());
  const [fileType, setFileType] = useState<SupportedLoaders>("unknown");
  const [folderName, setFolderName] = useState<string | undefined>("");
  const tagQuery = useQuery(trpc.upload.queryTagsAndAttributes.queryOptions());
  const [tags, setTags] = useState<string[]>([]);

  const addNewTag = (tag: string) => {
    if (tags.length >= 3) return; //toast
    setTags((prevTags) => [...prevTags, tag]);
  };
  const removeTag = (tag: string) => {
    setTags((prevTags) => prevTags.filter((t) => t !== tag));
  };
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(loadedFile);
      URL.revokeObjectURL(binary);
      textures.forEach((texture) => {
        URL.revokeObjectURL(texture);
      });
    };
  }, [loadedFile, binary, textures]);

  const MemoizedModel = useMemo(
    () => (
      <PreviewModel
        fileType={fileType}
        fileUrl={loadedFile}
        fileBinary={binary}
        fileTextures={textures}
      />
    ),
    [loadedFile, binary, textures, fileType],
  );

  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;
    const folder = uploadedFiles[0]!.webkitRelativePath.split("/")[0];
    console.log(folder);
    let loadedFilePath = loadedFile;
    let binaryPath = binary;
    const texturesPath = new Map<string, string>();
    let fileType: SupportedLoaders = "unknown";

    for (const file of uploadedFiles) {
      const blobUrl = URL.createObjectURL(file);

      if (/\.(gltf|glb|obj|fbx)$/.test(file.name)) {
        loadedFilePath = blobUrl;
        fileType = file.name.split(".").pop() as SupportedLoaders;
      } else if (file.name.endsWith(".bin")) {
        binaryPath = blobUrl;
      } else if (/\.(png|jpg|jpeg)$/.test(file.name)) {
        texturesPath.set(file.webkitRelativePath.split("/").pop()!, blobUrl);
      }
    }

    setFolderName(folder);
    setLoadedFile(loadedFilePath);
    setBinary(binaryPath);
    setTextures(texturesPath);
    setFileType(fileType);
  };

  const clear = () => {
    setLoadedFile("");
    setBinary("");
    setTextures(new Map());
    setFolderName("");
    setFileType("unknown");
  };

  return (
    <div className="flex h-full p-3">
      <div className="flex h-full w-2/6 flex-col gap-2">
        <div className="flex flex-grow flex-col justify-between overflow-y-auto rounded-md border">
          <div className="flex items-center justify-between gap-3 p-3">
            <div className="flex w-full items-center justify-center gap-4">
              <Search className="h-3 w-3" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full border-b bg-inherit text-sm outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {tagQuery.isLoading ? (
              <div className="p-3 text-gray-500">Loading...</div>
            ) : tagQuery.isError ? (
              <div className="p-3 text-red-500">Error loading tags</div>
            ) : tagQuery.data ? (
              tagView ? (
                <TagList
                  tagQuery={tagQuery.data}
                  tags={tags}
                  addNewTag={addNewTag}
                  removeTag={removeTag}
                />
              ) : (
                <AttributeList tagQuery={tagQuery.data} tags={tags} />
              )
            ) : (
              <div className="p-3 text-gray-400">No data found</div>
            )}
          </div>
          <div className="flex items-center justify-around gap-3 p-3">
            <button className="rounded-md border px-2 py-1 text-text">
              Upload
            </button>
            {tagView ? (
              <button
                className="rounded-md border px-2 py-1 text-text"
                onClick={() => setTagView(false)}
              >
                Attributes
              </button>
            ) : (
              <button
                className="rounded-md border px-2 py-1 text-text"
                onClick={() => setTagView(true)}
              >
                Tags
              </button>
            )}
          </div>
        </div>
        <div className="min-h-[170px] rounded-md border border-primary p-2">
          <div className="flex flex-col items-center justify-center gap-1 text-xl text-primary">
            <File className="h-7 w-7" />
            <h2>Drag & Drop a folder here</h2>
          </div>
          <input
            type="file"
            multiple
            onChange={handleSelect}
            {...({
              webkitdirectory: "true",
            } as InputHTMLAttributes<HTMLInputElement>)}
            id="file-upload"
            className="hidden"
          />
          <div className="mt-2 flex items-center justify-center gap-1">
            <p>Or</p>
            {folderName ? (
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-400">browse files</span>
              </label>
            ) : (
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-400">choose your files</span>
              </label>
            )}
          </div>
          {folderName && (
            <div className="mt-3 flex w-full items-center justify-between rounded-md bg-primary p-2 text-secondary">
              <p className="text-sm">{folderName}</p>
              <CircleX className="h-5 w-5 cursor-pointer" onClick={clear} />
            </div>
          )}
        </div>
      </div>
      {loadedFile && (
        <div className={cn("relative h-full w-4/6", { "-z-10": modal })}>
          <Canvas className="h-full w-full">
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <ambientLight intensity={0.5} />
            {MemoizedModel}
            <OrbitControls />
          </Canvas>
        </div>
      )}
    </div>
  );
}

type TagListProps = {
  tagQuery: Map<
    string,
    {
      tag: TagSchema;
      attributes: AttributeType[];
    }
  >;
  tags: string[];
  addNewTag: (tag: string) => void;
  removeTag: (tag: string) => void;
};

function TagList({ tagQuery, tags, addNewTag, removeTag }: TagListProps) {
  const entries = Array.from(tagQuery.values());

  const handleTagClick = (tagId: string, isChecked: boolean) => {
    if (isChecked) {
      removeTag(tagId);
    } else if (tags.length < 3) {
      addNewTag(tagId);
    }
  };

  return (
    <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {entries.map((entry) => {
        const isChecked = tags.includes(entry.tag.id);
        return (
          <div
            key={entry.tag.id}
            className={
              "flex min-w-[100px] cursor-pointer select-none items-center justify-center gap-2 rounded-full border py-1"
            }
            style={{
              color: entry.tag.colour,
              borderColor: isChecked ? entry.tag.colour : "transparent",
            }}
            onClick={() => handleTagClick(entry.tag.id, isChecked)}
          >
            <Tag style={{ color: entry.tag.colour }} />
            <span>{entry.tag.name}</span>
          </div>
        );
      })}
    </div>
  );
}

type AttributeListProps = {
  tagQuery: Map<
    string,
    {
      tag: TagSchema;
      attributes: AttributeType[];
    }
  >;
  tags: string[];
};

function AttributeList({ tagQuery, tags }: AttributeListProps) {
  const entries = Array.from(tagQuery.values()).filter((entry) =>
    tags.includes(entry.tag.id),
  );

  return (
    <div className=" p-4">
      {entries.map((entry) => (
        <div key={entry.tag.id} className="mb-4">
          <h2 className="mb-2 text-xl font-semibold italic text-primary">
            {entry.tag.name}
          </h2>

          <div className="flex flex-col gap-4">
            {entry.attributes.map((attribute) => (
              <div key={attribute.id} className="flex flex-col">
                <input
                  id={attribute.id}
                  name={attribute.name}
                  type="text"
                  className="flex items-center justify-center gap-2 rounded-full bg-secondary px-2 py-2 text-sm outline-none"
                  placeholder={`Enter ${attribute.name.toLowerCase()}`}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
