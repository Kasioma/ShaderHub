import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import JSZip from "jszip";

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
