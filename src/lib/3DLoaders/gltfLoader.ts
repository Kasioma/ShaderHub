import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { normalizeModelGLTF } from "./helper";

export function useGLTFLoader({
  gltf,
  binary,
  textures,
}: {
  gltf: string;
  binary: string;
  textures: Map<string, string>;
}) {
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    if (url.endsWith(".bin") && binary) {
      return binary;
    }

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

  const gltfModel = useLoader(GLTFLoader, gltf, (loader) => {
    loader.manager = manager;
  });

  return normalizeModelGLTF(gltfModel);
}
