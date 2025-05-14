import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";

type Props = {
  modelLoaded: boolean;
  onCapture: (dataUrl: string) => void;
};

export default function SnapshotHandler({ modelLoaded, onCapture }: Props) {
  const { gl } = useThree();
  const [captured, setCaptured] = useState(false);
  const frameCount = useRef(0);

  useFrame(() => {
    if (!modelLoaded || captured) return;

    frameCount.current += 1;

    if (frameCount.current > 50) {
      const dataUrl = gl.domElement.toDataURL("image/png");
      onCapture(dataUrl);
      setCaptured(true);
    }
  });

  useEffect(() => {
    if (!modelLoaded) {
      setCaptured(false);
      frameCount.current = 0;
    }
  }, [modelLoaded]);

  return null;
}
