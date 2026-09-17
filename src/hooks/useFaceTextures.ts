import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { SRGBColorSpace, Texture, TextureLoader } from "three";
import {
  faceVariants,
  initialFaceStatuses,
  type FaceStatuses,
  type FaceVariant,
} from "../faceVariants";

export function useFaceTextures(
  template: Texture,
  onStatus: (status: FaceStatuses) => void,
) {
  const { gl, invalidate } = useThree();
  const [textures, setTextures] = useState<
    Partial<Record<FaceVariant, Texture>>
  >({});

  useEffect(() => {
    let cancelled = false;
    const owned: Texture[] = [];
    const status = { ...initialFaceStatuses };
    const loader = new TextureLoader();
    setTextures({});
    onStatus({ ...status });
    // Load every variant upfront, not in response to a button press.
    for (const variant of faceVariants) {
      if (!variant.textureUrl) continue;
      loader.load(
        variant.textureUrl,
        (texture) => {
          if (cancelled) {
            texture.dispose();
            return;
          }
          owned.push(texture);
          const source = texture.source;
          // Keep the GLB's UV channel, transform, filtering and flipY convention.
          texture.copy(template);
          texture.source = source;
          texture.colorSpace = SRGBColorSpace;
          texture.needsUpdate = true;
          gl.initTexture(texture);
          setTextures((previous) => ({ ...previous, [variant.id]: texture }));
          status[variant.id] = "ready";
          onStatus({ ...status });
          invalidate();
        },
        undefined,
        () => {
          if (cancelled) return;
          status[variant.id] = "error";
          onStatus({ ...status });
        },
      );
    }
    return () => {
      cancelled = true;
      owned.forEach((texture) => texture.dispose());
    };
  }, [template, gl, invalidate, onStatus]);

  return textures;
}
