import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import JSZip, { type JSZipObject } from "jszip";
import type { ParseFBXProps, ParseGLTFProps, SupportedLoaders } from "./types";

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
  const modelBlob = await getFileEntry(fileEntry);
  if (!modelBlob) return null;

  if (modelType === "gltf" && binaryFile) {
    const binEntry = zip.file(binaryFile);
    if (!binEntry) return null;
    const binBlob = await getFileEntry(binEntry);
    if (!binBlob) return null;
    return {
      kind: "gltf",
      fileType: modelType,
      fileBlob: modelBlob,
      fileBinary: binBlob,
      fileTextures: textures,
    };
  }

  return {
    kind: "fbx",
    fileType: modelType,
    fileBlob: modelBlob,
    fileTextures: textures,
  };
};

function getFileEntry(
  fileEntry: JSZipObject | null,
  type = "application/octet-stream",
): Promise<Blob> | null {
  if (!fileEntry) return null;

  if (fileEntry.name.endsWith(".gltf")) {
    return fileEntry
      .async("string")
      .then((text) => new Blob([text], { type: "model/gltf+json" }));
  }

  if (fileEntry.name.endsWith(".bin")) {
    return fileEntry
      .async("arraybuffer")
      .then(
        (buffer: ArrayBuffer) =>
          new Blob([buffer], { type: "application/octet-stream" }),
      );
  }

  return fileEntry
    .async("arraybuffer")
    .then((buffer: ArrayBuffer) => new Blob([buffer], { type }));
}

export function downloadZip(zipBlob: Blob, filename = "model.zip") {
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
