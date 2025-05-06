import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useRef, useState } from "react";
import PreviewModel from "./PreviewModel";
import type { SupportedLoaders } from "@/utilities/types";

type Props = {
  fileType: SupportedLoaders;
  fileUrl: string;
  fileBinary: string;
  fileTextures: Map<string, string>;
  onSnapshot: (dataUrl: string) => void;
};

function SnapshotModel({
  fileType,
  fileUrl,
  fileBinary,
  fileTextures,
  onSnapshot,
  onReadyToUnmount,
}: Props & { onReadyToUnmount: () => void }) {
  const { gl } = useThree();
  const frameCount = useRef(0);
  const [modelLoaded, setModelLoaded] = useState(false);

  useFrame(() => {
    if (!modelLoaded) return;

    frameCount.current++;
    if (frameCount.current === 5) {
      const dataUrl = gl.domElement.toDataURL("image/png");
      onSnapshot(dataUrl);

      onReadyToUnmount();
    }
  });

  return (
    <>
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <ambientLight intensity={0.5} />
      <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={45} />
      <PreviewModel
        fileType={fileType}
        fileUrl={fileUrl}
        fileBinary={fileBinary}
        fileTextures={fileTextures}
        onLoaded={() => setModelLoaded(true)}
      />
    </>
  );
}

export default function ThumbnailGenerator({
  fileType,
  fileUrl,
  fileBinary,
  fileTextures,
  onSnapshot,
}: Props) {
  const [shouldRender, setShouldRender] = useState(true);

  if (!shouldRender) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: -9999,
        left: -9999,
        width: 256,
        height: 256,
      }}
    >
      <Canvas
        gl={{
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
        }}
        className="h-full w-full"
      >
        <SnapshotModel
          fileType={fileType}
          fileUrl={fileUrl}
          fileBinary={fileBinary}
          fileTextures={fileTextures}
          onSnapshot={onSnapshot}
          onReadyToUnmount={() => setShouldRender(false)}
        />
      </Canvas>
    </div>
  );
}
