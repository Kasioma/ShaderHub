import { useFBXLoader } from "@/lib/3DLoaders/fbxLoader";
import { useGLTFLoader } from "@/lib/3DLoaders/gltfLoader";
import type { SupportedLoaders } from "@/utilities/types";
import { Suspense } from "react";

export default function PreviewModel({
  fileType,
  fileUrl,
  fileBinary,
  fileTextures,
}: {
  fileType: SupportedLoaders;
  fileUrl: string;
  fileBinary: string;
  fileTextures: Map<string, string>;
}) {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      {fileType === "gltf" && (
        <GLTFModel
          fileUrl={fileUrl}
          fileBinary={fileBinary}
          fileTextures={fileTextures}
        />
      )}

      {fileType === "fbx" && (
        <FBXModel fileUrl={fileUrl} fileTextures={fileTextures} />
      )}
    </Suspense>
  );
}

function GLTFModel({
  fileUrl,
  fileBinary,
  fileTextures,
}: {
  fileUrl: string;
  fileBinary: string;
  fileTextures: Map<string, string>;
}) {
  const model = useGLTFLoader({
    gltf: fileUrl,
    binary: fileBinary,
    textures: fileTextures,
  });

  return model ? <primitive object={model.scene} /> : null;
}

function FBXModel({
  fileUrl,
  fileTextures,
}: {
  fileUrl: string;
  fileTextures: Map<string, string>;
}) {
  const model = useFBXLoader({
    fbx: fileUrl,
    textures: fileTextures,
  });

  return model ? <primitive object={model} /> : null;
}

function LoadingPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#cccccc" wireframe />
    </mesh>
  );
}
