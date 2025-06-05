import { useFBXLoader } from "@/lib/3DLoaders/fbxLoader";
import { useGLTFLoader } from "@/lib/3DLoaders/gltfLoader";
import type { SupportedLoaders } from "@/utilities/types";
import { Suspense, useEffect } from "react";
import * as THREE from "three";

export default function PreviewModel({
  fileType,
  fileUrl,
  fileBinary,
  fileTextures,
  wireframe,
  onLoaded,
}: {
  fileType: SupportedLoaders;
  fileUrl: string;
  fileBinary: string;
  fileTextures: Map<string, string>;
  wireframe?: boolean;
  onLoaded?: () => void;
}) {
  console.log(wireframe);
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      {fileType === "gltf" && (
        <GLTFModel
          fileUrl={fileUrl}
          fileBinary={fileBinary}
          fileTextures={fileTextures}
          wireframe={wireframe}
          onLoaded={onLoaded}
        />
      )}

      {fileType === "fbx" && (
        <FBXModel
          fileUrl={fileUrl}
          fileTextures={fileTextures}
          wireframe={wireframe}
          onLoaded={onLoaded}
        />
      )}
    </Suspense>
  );
}

function GLTFModel({
  fileUrl,
  fileBinary,
  fileTextures,
  wireframe,
  onLoaded,
}: {
  fileUrl: string;
  fileBinary: string;
  fileTextures: Map<string, string>;
  wireframe?: boolean;
  onLoaded?: () => void;
}) {
  const model = useGLTFLoader({
    gltf: fileUrl,
    binary: fileBinary,
    textures: fileTextures,
  });

  useEffect(() => {
    if (model) {
      if (wireframe)
        model.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];

            materials.forEach((mat) => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              if ("wireframe" in mat && typeof mat.wireframe === "boolean") {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                mat.wireframe = wireframe;
              }
            });
          }
        });
      if (onLoaded) onLoaded();
    }
  }, [model, wireframe, onLoaded]);

  return model ? <primitive object={model.scene.clone(true)} /> : null;
}

function FBXModel({
  fileUrl,
  fileTextures,
  wireframe,
  onLoaded,
}: {
  fileUrl: string;
  fileTextures: Map<string, string>;
  wireframe?: boolean;
  onLoaded?: () => void;
}) {
  const model = useFBXLoader({
    fbx: fileUrl,
    textures: fileTextures,
  });

  useEffect(() => {
    if (model) {
      if (wireframe)
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];

            materials.forEach((mat) => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              if ("wireframe" in mat && typeof mat.wireframe === "boolean") {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                mat.wireframe = wireframe;
              }
            });
          }
        });
      if (onLoaded) onLoaded();
    }
  }, [model, wireframe, onLoaded]);

  return model ? <primitive object={model.clone(true)} /> : null;
}

function LoadingPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#cccccc" wireframe />
    </mesh>
  );
}
