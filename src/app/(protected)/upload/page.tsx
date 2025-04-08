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
import { CircleX, File, Search } from "lucide-react";
import PreviewModel from "@/components/PreviewModel";
import type { SupportedLoaders } from "@/utilities/types";
import { useModal } from "@/context/modal";
import { cn } from "@/utilities/utils";

export default function Page() {
  const { modal } = useModal();
  const [tagView, setTagView] = useState<boolean>(true);
  const [loadedFile, setLoadedFile] = useState<string>("");
  const [binary, setBinary] = useState<string>("");
  const [textures, setTextures] = useState<Map<string, string>>(new Map());
  const [fileType, setFileType] = useState<SupportedLoaders>("unknown");
  const [folderName, setFolderName] = useState<string | undefined>("");

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
        <div className="h-5/6 rounded-md border">
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
          {tagView ? tagList() : attributeList()}
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
        <div className="h-2/6 max-h-[170px] rounded-md border border-primary p-2">
          <div className="flex flex-col items-center justify-center gap-1 text-xl">
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

function tagList() {
  return <div className="p-3"></div>;
}

function attributeList() {
  return <>XD</>;
}
