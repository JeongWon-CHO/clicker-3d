import { Component, Suspense, useEffect, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { PerspectiveCamera } from "three";
import { KeycapModel } from "./KeycapModel";
import { RotationControls } from "./RotationControls";
import type { FaceStatuses, FaceVariant } from "../faceVariants";

function CameraFit() {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const perspective = camera as PerspectiveCamera;
    const vertical = (perspective.fov * Math.PI) / 360;
    const horizontal = Math.atan(
      (Math.tan(vertical) * size.width) / size.height,
    );
    const distance = 2.3 / Math.sin(Math.min(vertical, horizontal));
    camera.position.normalize().multiplyScalar(distance);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size, invalidate]);
  return null;
}

class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-message">
        모델을 불러오지 못했어요.
        <button onClick={() => location.reload()}>다시 시도</button>
      </div>
    ) : (
      this.props.children
    );
  }
}

export function KeycapScene({
  onClick,
  onReady,
  faceVariant,
  onFaceStatus,
}: {
  onClick: (x: number, y: number) => void;
  onReady: () => void;
  faceVariant: FaceVariant;
  onFaceStatus: (status: FaceStatuses) => void;
}) {
  return (
    <SceneBoundary>
      <Canvas
        style={{ position: "absolute", inset: 0 }}
        camera={{ position: [5, 4.5, 6], fov: 36, near: 0.1, far: 100 }}
        dpr={[1, 1.75]}
        frameloop="demand"
        gl={{ antialias: true, alpha: true }}
        fallback={
          <div className="scene-message">
            3D를 표시하려면 WebGL을 지원하는 브라우저가 필요해요.
          </div>
        }
      >
        <color attach="background" args={["#101113"]} />
        <CameraFit />
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 6, 4]} intensity={1.7} />
        <Suspense fallback={null}>
          <Environment resolution={128} frames={1}>
            <Lightformer
              position={[0, 5, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              scale={[8, 5, 1]}
              intensity={3}
            />
            <Lightformer
              position={[-5, 1, 2]}
              rotation={[0, Math.PI / 2, 0]}
              scale={[3, 7, 1]}
              intensity={4}
              color="#d6e5ff"
            />
            <Lightformer
              position={[5, 2, -3]}
              rotation={[0, -Math.PI / 2, 0]}
              scale={[2, 6, 1]}
              intensity={3}
              color="#ffe4c4"
            />
          </Environment>
          <KeycapModel onClick={onClick} onReady={onReady} faceVariant={faceVariant} onFaceStatus={onFaceStatus} />
        </Suspense>
        <RotationControls />
      </Canvas>
    </SceneBoundary>
  );
}
