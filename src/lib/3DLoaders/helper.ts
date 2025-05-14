import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/Addons.js";

export function normalizeModelFBX(
  model: THREE.Object3D,
  desiredSize = 10,
): THREE.Object3D {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  box.getSize(size);
  box.getCenter(center);

  const maxDim = Math.max(size.x, size.y, size.z);

  if (maxDim === 0) return model;

  const scale = desiredSize / maxDim;
  model.scale.setScalar(scale);

  model.position.sub(center.multiplyScalar(scale));

  return model;
}

export function normalizeModelGLTF(model: GLTF, desiredSize = 10): GLTF {
  const scene = model.scene;

  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  box.getSize(size);
  box.getCenter(center);

  const maxDim = Math.max(size.x, size.y, size.z);

  if (maxDim === 0) return model;

  const scale = desiredSize / maxDim;
  scene.scale.setScalar(scale);

  scene.position.sub(center.multiplyScalar(scale));

  return model;
}
