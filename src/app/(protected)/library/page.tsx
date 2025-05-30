"use client";
import ObjectMenu from "@/components/ObjectMenu";
import PreviewModel from "@/components/PreviewModel";
import { useTRPC } from "@/utilities/trpc";
import type { ParsedModelProps, SelectedFileProps } from "@/utilities/types";
import { cn, unzipFiles } from "@/utilities/utils";
import type { FilePull } from "@/utilities/zod/parsers";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

export default function Page() {
  const trpc = useTRPC();
  const [isSelected, setIsSelected] = useState<SelectedFileProps | null>(null);
  const [zip, setZip] = useState<Blob | null>(null);
  const [parsedObject, setParsedObject] = useState<ParsedModelProps | null>(
    null,
  );
  const { data } = useQuery(trpc.library.getLibrary.queryOptions());

  const handleSelectedFile = (selectedFile: SelectedFileProps) => {
    setIsSelected(selectedFile);
  };

  useEffect(() => {
    if (!isSelected) return;
    const newZip = async () => {
      if (isSelected.objectId) return;
      const newZip = await fetchZip(isSelected.objectId);
      if (!newZip) return;
      setZip(newZip);
    };
    newZip().catch(console.error);
  }, [isSelected]);

  useEffect(() => {
    if (!zip) return;
    async function parseModel() {
      if (!zip) return;
      const unzipped = await unzipFiles(zip);
      if (!unzipped) return;
      setParsedObject(unzipped);
    }
    parseModel().catch(console.error);
  }, [zip]);

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

  return (
    <section className="flex h-full">
      <FileList
        files={data ?? {}}
        selectedFile={isSelected}
        handleSelectedFile={handleSelectedFile}
      />
      <main className="flex w-4/5 flex-col items-center justify-center text-center">
        <ObjectMenu
          tagName={isSelected?.tagName ?? "Collection"}
          userId={isSelected?.userId ?? "Unknown"}
          uploaderId={isSelected?.uploaderId ?? "Unknown"}
          objectId={isSelected?.objectId ?? "Unknown"}
          objectName={isSelected?.objectName ?? "Unknown"}
          zip={zip}
        />
        {parsedObject && (
          <div className="h-full w-full p-2">
            <Canvas className="h-full w-full ">
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <ambientLight intensity={0.5} />
              <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={45} />
              {MemoizedModel}
              <OrbitControls target0={[0, 0, 0]} />
            </Canvas>
          </div>
        )}
      </main>
    </section>
  );
}

type FileListProps = {
  files: FilePull;
  selectedFile: SelectedFileProps | null;
  handleSelectedFile: (selectedFile: SelectedFileProps) => void;
};

function FileList({ files, handleSelectedFile, selectedFile }: FileListProps) {
  const isEmpty = Object.keys(files).length === 0;

  return (
    <aside className="w-1/5 overflow-y-auto border-r p-4">
      {isEmpty ? (
        <p className="text-center italic text-gray-500">No files found</p>
      ) : (
        <ul className="space-y-2">
          {Object.entries(files).map(([tagId, { tagName, objects }]) => (
            <Folder
              key={tagId}
              title={tagName}
              objects={objects}
              selectedFile={selectedFile}
              handleSelectedFile={handleSelectedFile}
            />
          ))}
        </ul>
      )}
    </aside>
  );
}

type FolderProps = {
  title: string;
  objects: {
    objectId: string;
    objectName: string;
    userId: string;
    uploaderId: string;
  }[];
  selectedFile: SelectedFileProps | null;
  handleSelectedFile: (selectedFile: SelectedFileProps) => void;
};

function Folder({
  title,
  objects,
  selectedFile,
  handleSelectedFile,
}: FolderProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <li>
      <button
        className="flex w-full items-center justify-between text-left font-medium"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>
          {isOpen ? "📂" : "📁"} {title}
        </span>
        <span className="text-sm">{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen && (
        <ul className="ml-4 mt-1 space-y-1 text-sm">
          {objects.map((obj) => (
            <li
              key={obj.objectId}
              className="cursor-pointer text-text hover:text-primary"
              onClick={() =>
                handleSelectedFile({
                  tagName: title,
                  userId: obj.userId,
                  uploaderId: obj.uploaderId,
                  objectId: obj.objectId,
                  objectName: obj.objectName,
                })
              }
            >
              <span className="select-none text-text opacity-50">|</span>
              📄
              <span
                className={cn("text-text", {
                  "text-primary":
                    `${selectedFile?.tagName}|${selectedFile?.objectId}` ===
                    `${title}|${obj.objectId}`,
                })}
              >
                {obj.objectName}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

async function fetchZip(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const APIInputData = new FormData();
  APIInputData.append("file", id);
  const res = await fetch(`${baseUrl}/api/filestorage/object/query`, {
    method: "POST",
    body: APIInputData,
  });

  if (!res.ok) {
    console.error("Error fetching object");
    return;
  } else {
    const zipBlob = await res.blob();
    if (!zipBlob) return;
    return zipBlob;
  }
}
