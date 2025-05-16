import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import JSZip from "jszip";
import type { SupportedLoaders } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const zipFiles = async (files: FileList) => {
  const zip: JSZip = new JSZip();

  for (const file of files) {
    const path = file.webkitRelativePath || file.name;
    zip.file(path, file);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  return blob;
};

export const dataURLtoBlob = (dataUrl: string): Blob => {
  const parts = dataUrl.split(",");
  const regex = /:(.*?);/;
  const match = regex.exec(parts[0]!);
  const mime = match ? match[1] : "image/png";
  const byteString = atob(parts[1]!);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  return new Blob([uint8Array], { type: mime });
};

type ParseGLTFProps = {
  fileType: SupportedLoaders;
  fileBlob: Blob;
  fileBinary: Blob | null;
  fileTextures: Map<string, Blob>;
};

type ParseFBXProps = {
  fileType: SupportedLoaders;
  fileBlob: Blob;
  fileTextures: Map<string, Blob>;
};

export const unzipFiles = async (
  zipBlob: Blob,
): Promise<ParseGLTFProps | ParseFBXProps | null> => {
  const zip = await JSZip.loadAsync(zipBlob);

  let modelFile: string | null = null;
  let modelType: SupportedLoaders | null = null;
  let binaryFile: string | null = null;
  const textures = new Map<string, Blob>();

  for (const filename of Object.keys(zip.files)) {
    const file = zip.files[filename];
    if (!file || file.dir) continue;

    const extension = filename.split(".").pop()?.toLowerCase();
    if (!extension) continue;
    if (["gltf", "fbx"].includes(extension)) {
      modelFile = filename;
      modelType = extension as SupportedLoaders;
    } else if (extension === "bin") {
      binaryFile = filename;
    } else if (["png", "jpg", "jpeg"].includes(extension)) {
      const blob = await file.async("blob");
      textures.set(filename, blob);
    }
  }
  if (!modelFile || !modelType) return null;

  const fileEntry = zip.file(modelFile);
  if (!fileEntry) return null;
  const modelBlob = await fileEntry.async("blob");

  if (modelType === "gltf") {
    const binEntry = binaryFile ? zip.file(binaryFile) : null;
    if (binEntry) {
      const binBlob = await binEntry.async("blob");
      return {
        fileType: modelType,
        fileBlob: modelBlob,
        fileBinary: binBlob,
        fileTextures: textures,
      };
    }
  }

  return {
    fileType: modelType,
    fileBlob: modelBlob,
    fileTextures: textures,
  };
  return null;
};
