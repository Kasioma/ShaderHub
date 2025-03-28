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

export default function Uploader() {
  const [loadedFile, setLoadedFile] = useState<string>("");
  const [binary, setBinary] = useState<string>("");
  const [textures, setTextures] = useState<Map<string, string>>(new Map());

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
    setLoadedFile(loadedFilePath);
    setBinary(binaryPath);
    setTextures(texturesPath);
  };

  return (
    <div className="flex flex-row gap-20">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="items-left flex w-[500px] max-w-full flex-col gap-3 rounded-2xl border p-4"
      >
        <div className="border p-4">
          <input
            type="file"
            multiple
            onChange={handleSelect}
            {...({
              webkitdirectory: "true",
            } as InputHTMLAttributes<HTMLInputElement>)}
          />
          <p>Drag & Drop a folder here</p>
        </div>
      </form>

      {loadedFile && (
        <div className="h-[500px] w-[500px]">
          <Canvas>
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
