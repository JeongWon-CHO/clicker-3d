import defaultFaceUrl from "./assets/basic.jpg?url";
import cryingFaceUrl from "./assets/sad.png?url";
import angryFaceUrl from "./assets/angry.png?url";

export const faceVariants = [
  { id: "default", label: "기본 종근이", textureUrl: defaultFaceUrl },
  { id: "angry", label: "화난 종근이", textureUrl: angryFaceUrl },
  { id: "crying", label: "울고 있는 종근이", textureUrl: cryingFaceUrl },
] as const satisfies readonly {
  id: string;
  label: string;
  textureUrl: string | null;
}[];

export type FaceVariant = (typeof faceVariants)[number]["id"];
export const autoFaceStages: readonly {
  minCount: number;
  face: FaceVariant;
}[] = [
  { minCount: 0, face: "default" },
  { minCount: 100, face: "angry" },
  { minCount: 400, face: "crying" },
];

export function getAutoFace(count: number): FaceVariant {
  return (
    [...autoFaceStages].reverse().find((stage) => count >= stage.minCount)
      ?.face ?? "default"
  );
}
export type FaceStatus = "loading" | "ready" | "unavailable" | "error";
export type FaceStatuses = Record<FaceVariant, FaceStatus>;
export const initialFaceStatuses = Object.fromEntries(
  faceVariants.map((variant) => [
    variant.id,
    variant.textureUrl ? "loading" : "unavailable",
  ]),
) as FaceStatuses;
