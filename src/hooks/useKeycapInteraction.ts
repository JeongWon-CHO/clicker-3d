import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Object3D, Raycaster, Vector2 } from "three";

export type PressAction = "down" | "release" | "cancel";

export function useKeycapInteraction(
  model: Object3D,
  press: (action: PressAction) => void,
  onClick: (x: number, y: number) => void,
) {
  const { camera, gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const ray = new Raycaster();
    const point = new Vector2();
    type Candidate = {
      x: number;
      y: number;
      threshold: number;
    };
    const candidates = new Map<number, Candidate>();
    const hit = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        return false;
      point.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      camera.updateMatrixWorld();
      model.updateWorldMatrix(true, true);
      ray.setFromCamera(point, camera);
      return ray.intersectObject(model, true).length > 0;
    };
    const cancel = (id: number) => {
      if (!candidates.delete(id)) return;
      if (candidates.size === 0) press("cancel");
    };
    const down = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (!hit(event)) return;
      candidates.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        threshold: event.pointerType === "touch" ? 9 : 5,
      });
      canvas.setPointerCapture(event.pointerId);
      if (candidates.size === 1) press("down");
    };
    const move = (event: PointerEvent) => {
      const candidate = candidates.get(event.pointerId);
      if (!candidate) return;
      if (
        Math.hypot(event.clientX - candidate.x, event.clientY - candidate.y) >
        candidate.threshold
      )
        cancel(event.pointerId);
    };
    const up = (event: PointerEvent) => {
      move(event);
      const valid = candidates.has(event.pointerId) && hit(event);
      if (!candidates.delete(event.pointerId)) return;
      if (candidates.size === 0) press(valid ? "release" : "cancel");
      if (valid) onClick(event.clientX, event.clientY);
    };
    const pointerCancel = (event: PointerEvent) => {
      cancel(event.pointerId);
    };
    const lost = (event: PointerEvent) => {
      cancel(event.pointerId);
    };
    const blur = () => {
      if (candidates.size === 0) return;
      candidates.clear();
      press("cancel");
    };
    // Capture observes input before rotation controls, without blocking their handlers.
    canvas.addEventListener("pointerdown", down, true);
    window.addEventListener("pointermove", move, true);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", pointerCancel, true);
    canvas.addEventListener("lostpointercapture", lost);
    window.addEventListener("blur", blur);
    return () => {
      canvas.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", pointerCancel, true);
      canvas.removeEventListener("lostpointercapture", lost);
      window.removeEventListener("blur", blur);
    };
  }, [camera, gl, model, onClick, press]);
}
