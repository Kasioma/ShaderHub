import * as THREE from "three";

export default function normalizeModel(model: THREE.Object3D) {
  model.scale.setScalar(0.5);

  model.updateWorldMatrix(true, true);
  const scaledBox = new THREE.Box3().setFromObject(model);
  const center = scaledBox.getCenter(new THREE.Vector3());

  model.position.sub(center);

  return model;
}
