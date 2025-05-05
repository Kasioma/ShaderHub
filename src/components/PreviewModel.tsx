import { useFBXLoader } from "@/lib/3DLoaders/fbxLoader";
import { useGLTFLoader } from "@/lib/3DLoaders/gltfLoader";
import type { SupportedLoaders } from "@/utilities/types";
import { Suspense, useEffect } from "react";

export default function PreviewModel({
  fileType,
  fileUrl,
  fileBinary,
  fileTextures,
  onLoaded,
}: {
  fileType: SupportedLoaders;
  fileUrl: string;
  fileBinary: string;
  fileTextures: Map<string, string>;
  onLoaded?: () => void;
}) {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      {fileType === "gltf" && (
        <GLTFModel
          fileUrl={fileUrl}
          fileBinary={fileBinary}
          fileTextures={fileTextures}
          onLoaded={onLoaded}
        />
      )}

      {fileType === "fbx" && (
        <FBXModel
          fileUrl={fileUrl}
          fileTextures={fileTextures}
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
  onLoaded,
}: {
  fileUrl: string;
  fileBinary: string;
  fileTextures: Map<string, string>;
  onLoaded?: () => void;
}) {
  const model = useGLTFLoader({
    gltf: fileUrl,
    binary: fileBinary,
    textures: fileTextures,
  });

  useEffect(() => {
    if (model && onLoaded) {
      onLoaded();
    }
  }, [model, onLoaded]);

  return model ? <primitive object={model.scene.clone(true)} /> : null;
}

function FBXModel({
  fileUrl,
  fileTextures,
  onLoaded,
}: {
  fileUrl: string;
  fileTextures: Map<string, string>;
  onLoaded?: () => void;
}) {
  const model = useFBXLoader({
    fbx: fileUrl,
    textures: fileTextures,
  });

  useEffect(() => {
    if (model && onLoaded) {
      onLoaded();
    }
  }, [model, onLoaded]);

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
