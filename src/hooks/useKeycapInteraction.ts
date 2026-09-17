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
    const active = new Set<number>();
    let candidate: {
      id: number;
      x: number;
      y: number;
      threshold: number;
    } | null = null;
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
    const cancel = () => {
      candidate = null;
      press("cancel");
    };
    const down = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      active.add(event.pointerId);
      if (active.size !== 1) {
        cancel();
        return;
      }
      if (!hit(event)) return;
      candidate = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        threshold: event.pointerType === "touch" ? 9 : 5,
      };
      canvas.setPointerCapture(event.pointerId);
      press("down");
    };
    const move = (event: PointerEvent) => {
      if (!candidate || candidate.id !== event.pointerId) return;
      if (
        Math.hypot(event.clientX - candidate.x, event.clientY - candidate.y) >
        candidate.threshold
      )
        cancel();
    };
    const up = (event: PointerEvent) => {
      move(event);
      const valid =
        candidate?.id === event.pointerId && active.size === 1 && hit(event);
      candidate = null;
      active.delete(event.pointerId);
      press(valid ? "release" : "cancel");
      if (valid) onClick(event.clientX, event.clientY);
    };
    const pointerCancel = (event: PointerEvent) => {
      active.delete(event.pointerId);
      cancel();
    };
    const lost = (event: PointerEvent) => {
      if (candidate?.id === event.pointerId) cancel();
      active.delete(event.pointerId);
    };
    const blur = () => {
      active.clear();
      cancel();
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
