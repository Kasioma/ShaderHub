export const visibility = Object.freeze({
  public: "public",
  private: "private",
} as const);

export type Visibility = (typeof visibility)[keyof typeof visibility];
