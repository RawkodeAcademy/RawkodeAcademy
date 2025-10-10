export const resetContainer = () => {
  delete (globalThis as Record<string, unknown>).__RKS_CONTAINER__;
};
