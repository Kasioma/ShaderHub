"use client";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { CircleX, File } from "lucide-react";

export default function Page() {
  const [loadedFile, setLoadedFile] = useState<string>("");
  const [binary, setBinary] = useState<string>("");
  const [textures, setTextures] = useState<Map<string, string>>(new Map());
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
    () => <Model loadedFile={loadedFile} binary={binary} textures={textures} />,
    [loadedFile, binary, textures],
  );

  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;
    const folder = uploadedFiles[0]!.webkitRelativePath.split("/")[0];

    let loadedFilePath = loadedFile;
    let binaryPath = binary;
    const texturesPath = new Map<string, string>();

    for (const file of uploadedFiles) {
      const blobUrl = URL.createObjectURL(file);

      if (/\.(gltf|glb)$/.test(file.name)) {
        loadedFilePath = blobUrl;
      } else if (file.name.endsWith(".bin")) {
        binaryPath = blobUrl;
      } else if (/\.(png|jpg|jpeg)$/.test(file.name)) {
        texturesPath.set(
          file.webkitRelativePath.split("/").slice(1).join("/"),
          blobUrl,
        );
      }
    }
    setFolderName(folder);
    setLoadedFile(loadedFilePath);
    setBinary(binaryPath);
    setTextures(texturesPath);
  };

  return (
    <div className="flex h-full p-3">
      <div className="flex h-full w-2/6 flex-col gap-2">
        <div className="h-5/6 rounded-md border">meta</div>
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
              <CircleX className="h-5 w-5 cursor-pointer" />
            </div>
          )}
        </div>
      </div>
      {loadedFile && (
        <div className="h-full w-4/6">
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

function Model({
  loadedFile,
  binary,
  textures,
}: {
  loadedFile: string;
  binary: string;
  textures: Map<string, string>;
}) {
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    if (url.endsWith(".bin") && binary) {
      return binary;
    }

    const textureFile = url.replace("blob:http://localhost:3000/", "");
    const texture = textures.get(textureFile);
    if (
      texture &&
      (url.endsWith(".png") || url.endsWith(".jpg") || url.endsWith(".jpeg"))
    ) {
      return texture;
    }
    return url;
  });

  const loader = useLoader(GLTFLoader, loadedFile, (loader) => {
    loader.manager = manager;
  });
  return <primitive object={loader.scene} />;
}
