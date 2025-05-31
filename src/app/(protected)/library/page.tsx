"use client";
import ConfirmationModal from "@/components/ConfirmationModal";
import ObjectMenu from "@/components/ObjectMenu";
import { Portal } from "@/components/Portal";
import PreviewModel from "@/components/PreviewModel";
import { toast } from "@/components/toaster/use-toast";
import { useTRPC } from "@/utilities/trpc";
import type {
  ConfirmationType,
  ParsedModelProps,
  SelectedFileProps,
} from "@/utilities/types";
import { cn, unzipFiles } from "@/utilities/utils";
import type { FilePull } from "@/utilities/zod/parsers";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

export default function Page() {
  const trpc = useTRPC();
  const [isSelected, setIsSelected] = useState<SelectedFileProps | null>(null);
  const [zip, setZip] = useState<Blob | null>(null);
  const [parsedObject, setParsedObject] = useState<ParsedModelProps | null>(
    null,
  );
  const queryClient = useQueryClient();
  const { data } = useQuery(trpc.library.getLibrary.queryOptions());

  const mutationOptions = {
    onError(error: { message: string }) {
      toast({
        variant: "destructive",
        title: "Server error",
        description: error.message,
      });
    },
    async onSuccess() {
      await refetchLibrary();
    },
  };

  const deleteObjectMutation = useMutation(
    trpc.library.deleteObject.mutationOptions(mutationOptions),
  );

  const handleSelectedFile = (selectedFile: SelectedFileProps) => {
    setIsSelected(selectedFile);
  };

  useEffect(() => {
    if (!isSelected) return;
    const newZip = async () => {
      if (!isSelected.objectId) return;
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

  const refetchLibrary = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.library.getLibrary.queryKey(),
    });
  };

  const handleTextures = (textures: Map<string, Blob>) => {
    const result = new Map<string, string>();
    for (const [key, blob] of textures) {
      const newKey = key.split("/").pop()!;
      result.set(newKey, URL.createObjectURL(blob));
    }
    return result;
  };

  const handleDelete = async () => {
    if (!isSelected) return;
    const status = await deleteZip(isSelected.objectId);
    if (status)
      try {
        await deleteObjectMutation.mutateAsync({
          objectId: isSelected.objectId,
        });
        await clear();
        toast({
          variant: "default",
          title: "Success",
          description: "Object deleted successfully",
        });
      } catch {
        toast({
          variant: "destructive",
          title: "Server error",
          description: "Failed to delete object",
        });
      }
  };

  const handleSave = async () => {
    if (!zip) return;
    return;
  };

  const clear = async () => {
    setIsSelected(null);
    setZip(null);
    setParsedObject(null);
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
        handleDelete={handleDelete}
        handleSave={handleSave}
      />
      <main className="flex w-4/5 flex-col items-center justify-start text-center">
        <ObjectMenu
          key={isSelected?.objectId ?? "none"}
          tagName={isSelected?.tagName ?? "Collection"}
          userId={isSelected?.userId ?? "Unknown"}
          uploaderId={isSelected?.uploaderId ?? "Unknown"}
          objectId={isSelected?.objectId ?? "Unknown"}
          objectName={isSelected?.objectName ?? "Unknown"}
          zip={zip}
          refetchLibrary={refetchLibrary}
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
  handleDelete: () => void;
  handleSave: () => void;
  handleSelectedFile: (selectedFile: SelectedFileProps) => void;
};

function FileList({
  files,
  handleSelectedFile,
  selectedFile,
  handleDelete,
  handleSave,
}: FileListProps) {
  const [confirmationType, setConfirmationType] =
    useState<ConfirmationType | null>(null);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const isEmpty = Object.keys(files).length === 0;

  const handleDeleteConfirmation = () => {
    setConfirmationType("delete");
    setConfirmationModal(true);
  };

  const handleSaveConfirmation = () => {
    setConfirmationType("save");
    setConfirmationModal(true);
  };

  return (
    <aside className="w-1/5 overflow-y-auto border-r">
      {isEmpty ? (
        <p className="text-center italic text-gray-500">No files found</p>
      ) : (
        <div className="flex h-full max-h-screen flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <ul className="w-full flex-1 space-y-2 overflow-y-auto">
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
          </div>

          {selectedFile && selectedFile.userId === selectedFile.uploaderId && (
            <div className="my-2 shrink-0 p-4">
              <div className="flex items-center justify-center gap-2">
                <label className="block">Visibility</label>
                <select
                  defaultValue={"public"}
                  className="w-full rounded-md border bg-secondary px-2 py-1 text-sm"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="mt-2 flex items-center justify-center gap-4">
                <button
                  className="mt-2 rounded bg-red-600 px-2 py-1 hover:bg-red-500"
                  onClick={() => handleDeleteConfirmation()}
                >
                  Delete
                </button>
                <button
                  className="mt-2 rounded border border-primary px-2 py-1 hover:bg-secondary"
                  onClick={() => handleSaveConfirmation()}
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {confirmationModal && confirmationType ? (
        <Portal>
          <ConfirmationModal
            onClose={() => setConfirmationModal(false)}
            confirmationType={confirmationType}
            handleDelete={handleDelete}
            handleSave={handleSave}
          />
        </Portal>
      ) : null}
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

async function deleteZip(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const APIInputData = new FormData();
  APIInputData.append("file", id);
  const res = await fetch(`${baseUrl}/api/filestorage/object/delete`, {
    method: "DELETE",
    body: APIInputData,
  });

  if (!res.ok) {
    console.error("Error fetching object");
    return false;
  } else return true;
}
