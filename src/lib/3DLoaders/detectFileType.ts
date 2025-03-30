import type { SupportedLoaders } from "@/utilities/types";

export function detectFileType(file: File): SupportedLoaders {
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith(".glb")) return "glb";
  if (fileName.endsWith(".gltf")) return "gltf";
  if (fileName.endsWith(".obj")) return "obj";
  if (fileName.endsWith(".fbx")) return "fbx";
  return "unknown";
}
