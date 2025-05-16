import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import PreviewModel from "./PreviewModel";
import type { SupportedLoaders } from "@/utilities/types";

type Props = {
  fileType: SupportedLoaders;
  loadedFile: string;
  binary: string;
  textures: Map<string, string>;
};

export default function ModelModal({
  fileType,
  loadedFile,
  binary,
  textures,
}: Props) {
  const [open, setOpen] = useState(false);

  const handleModalClose = () => {
    setOpen(false);
  };

  const MemoizedModel = useMemo(
    () => (
      <PreviewModel
        fileType={fileType}
        fileUrl={loadedFile}
        fileBinary={binary}
        fileTextures={textures}
      />
    ),
    [loadedFile, binary, textures, fileType],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[75vh] w-[60vw] overflow-y-auto rounded-xl bg-slate-50 p-6 shadow-lg">
        {loadedFile && (
          <div className="relative h-full w-4/6">
            <Canvas
              gl={{ preserveDrawingBuffer: true }}
              className="h-full w-full"
            >
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <ambientLight intensity={0.5} />
              <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={45} />
              {MemoizedModel}
              <OrbitControls target0={[0, 0, 0]} />
            </Canvas>
          </div>
        )}
      </div>
    </div>
  );
}
