import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/Addons.js";

export function useFBXLoader({
  fbx,
  textures,
}: {
  fbx: string;
  textures: Map<string, string>;
}) {
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    const textureFile = url.split("/").pop()!;
    const texture = textures.get(textureFile);
    if (
      texture &&
      (url.endsWith(".png") || url.endsWith(".jpg") || url.endsWith(".jpeg"))
    ) {
      return texture;
    }
    return url;
  });

  return useLoader(FBXLoader, fbx, (loader) => {
    loader.manager = manager;
  });
}
