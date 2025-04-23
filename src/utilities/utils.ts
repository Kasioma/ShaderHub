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
