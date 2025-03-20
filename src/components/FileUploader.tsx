"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useState, DragEvent, ChangeEvent, FormEvent } from "react";

export default function FileUploader() {
  const [file, setFile] = useState<File>();
  const [filename, setFilename] = useState<string | null>(null);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.dataTransfer) return;
    const file = e.dataTransfer.files[0];
    setFilename(URL.createObjectURL(file as Blob));
    setFile(file);
  };

  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    setFilename(URL.createObjectURL(file as Blob));
    setFile(file);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      console.log("No file selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/filestorage/object/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-row gap-20">
      <form
        onSubmit={handleSubmit}
        className="items-left flex w-[500px] max-w-full flex-col gap-3 rounded-2xl border p-4"
      >
        <input
          id="avatar"
          type="file"
          accept=".obj,.gltf,.glb,.fbx"
          onChange={handleSelect}
          onDrop={handleDrop}
          className="border-border"
        />
        <button>Upload Object</button>
      </form>

      <div className="w-full h-screen">
        <Canvas camera={{ position: [5, 2, 5] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <Model />
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}

function Model() {
  const { scene } = useGLTF("/cartoon_car/scene.gltf");
  return <primitive object={scene} scale={1} />;
}
