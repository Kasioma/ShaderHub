export const visibility = Object.freeze({
  public: "public",
  private: "private",
} as const);

export type Visibility = (typeof visibility)[keyof typeof visibility];

export const supportedLoaders = Object.freeze({
  glb: "glb",
  gltf: "gltf",
  obj: "obj",
  fbx: "fbx",
  unknown: "unknown",
} as const);

export type SupportedLoaders =
  (typeof supportedLoaders)[keyof typeof supportedLoaders];

export const direction = Object.freeze({
  forward: "forward",
  backward: "backward",
} as const);

export type Direction = (typeof direction)[keyof typeof direction];

export type ParseGLTFProps = {
  fileType: SupportedLoaders;
  fileBlob: Blob;
  fileBinary: Blob | null;
  fileTextures: Map<string, Blob>;
};

export type ParseFBXProps = {
  fileType: SupportedLoaders;
  fileBlob: Blob;
  fileTextures: Map<string, Blob>;
};
