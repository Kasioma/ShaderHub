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

export const viewType = Object.freeze({
  details: "details",
  collection: "collection",
  create: "create",
} as const);

export type ViewType = (typeof viewType)[keyof typeof viewType];

export type ParseGLTFProps = {
  kind: "gltf";
  fileType: SupportedLoaders;
  fileBlob: Blob;
  fileBinary: Blob;
  fileTextures: Map<string, Blob>;
};

export type ParseFBXProps = {
  kind: "fbx";
  fileType: SupportedLoaders;
  fileBlob: Blob;
  fileTextures: Map<string, Blob>;
};

export type ParsedModelProps = ParseGLTFProps | ParseFBXProps;

export type SelectedFileProps = {
  tagName: string;
  userId: string;
  uploaderId: string;
  objectId: string;
  objectName: string;
};

export const confirmationType = Object.freeze({
  delete: "delete",
  save: "save",
} as const);

export type ConfirmationType =
  (typeof confirmationType)[keyof typeof confirmationType];
