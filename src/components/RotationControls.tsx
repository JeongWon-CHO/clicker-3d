import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { ArcballControls } from "three/addons/controls/ArcballControls.js";

// The scene depends only on this component, so OrbitControls can replace it here.
export function RotationControls() {
  const { camera, gl, invalidate } = useThree();
  useEffect(() => {
    const controls = new ArcballControls(camera, gl.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableFocus = false;
    controls.enableAnimations = false;
    controls.setGizmosVisible(false);
    const onChange = () => invalidate();
    controls.addEventListener("change", onChange);
    controls.update();
    return () => {
      controls.removeEventListener("change", onChange);
      controls.dispose();
    };
  }, [camera, gl, invalidate]);
  return null;
}
