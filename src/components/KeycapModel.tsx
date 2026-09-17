import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3 } from "three";
import modelUrl from "../../keycap.glb?url";
import {
  useKeycapInteraction,
  type PressAction,
} from "../hooks/useKeycapInteraction";

export function KeycapModel({
  onClick,
  onReady,
}: {
  onClick: (x: number, y: number) => void;
  onReady: () => void;
}) {
  const { scene } = useGLTF(modelUrl);
  const { invalidate, gl } = useThree();
  const data = useMemo(() => {
    const model = scene.clone(true);
    const top = model.getObjectByName("Keycap_Top");
    if (!top || !model.getObjectByName("Keycap_Base"))
      throw new Error("키캡 모델 구조를 확인할 수 없습니다.");
    const center = new Box3().setFromObject(model).getCenter(new Vector3());
    return { model, top, origin: top.position.y, center };
  }, [scene]);
  const motion = useRef({ depth: 0, target: 0, downAt: 0, releaseAt: 0 });
  const press = useCallback(
    (action: PressAction) => {
      const state = motion.current;
      if (action === "down") {
        state.target = 1;
        state.downAt = performance.now();
        state.releaseAt = 0;
      } else if (action === "release") {
        // Even an extremely short click gets a visible downstroke.
        state.releaseAt = Math.max(performance.now(), state.downAt + 55);
      } else {
        state.target = 0;
        state.releaseAt = 0;
      }
      invalidate();
    },
    [invalidate],
  );
  useKeycapInteraction(data.model, press, onClick);
  useEffect(() => {
    onReady();
  }, [onReady]);
  useFrame((_, delta) => {
    const state = motion.current;
    if (state.releaseAt && performance.now() >= state.releaseAt) {
      state.target = 0;
      state.releaseAt = 0;
    }
    state.depth +=
      (state.target - state.depth) *
      (1 - Math.exp(-Math.min(delta, 0.05) * (state.target ? 75 : 30)));
    if (Math.abs(state.target - state.depth) < 0.001)
      state.depth = state.target;
    data.top.position.y = data.origin - state.depth * 0.00034;
    // Observable visual state is useful for browser-level interaction verification.
    gl.domElement.dataset.pressDepth = state.depth.toFixed(3);
    if (state.depth !== state.target || state.releaseAt) invalidate();
  });
  return (
    <group scale={155}>
      <primitive object={data.model} position={data.center.clone().negate()} />
    </group>
  );
}
