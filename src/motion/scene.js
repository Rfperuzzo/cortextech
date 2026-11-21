import {
  ACESFilmicToneMapping, AmbientLight, Box3, DirectionalLight, Group, MeshStandardMaterial,
  OrthographicCamera, Scene, SRGBColorSpace, Vector3, WebGLRenderer
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createNeuralNetwork } from './neural.js';

function normalizeModel(model) {
  const box = new Box3().setFromObject(model);
  const center = box.getCenter(new Vector3());
  const { x, y, z } = box.getSize(new Vector3());
  const scale = 1 / Math.max(x, y, z);
  model.position.copy(center.multiplyScalar(-scale));
  model.scale.setScalar(scale);
}

function addDirectional(scene, color, intensity, position) {
  const light = new DirectionalLight(color, intensity);
  light.position.set(...position);
  scene.add(light);
}

export async function createBrain(canvas) {
  const options = { alpha: true, antialias: !matchMedia('(pointer: coarse)').matches, powerPreference: 'low-power' };
  const context = canvas.getContext('webgl2', options);
  if (!context) throw new Error('WebGL2 indisponível');
  const renderer = new WebGLRenderer({ canvas, context, ...options });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.24;

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 1, 5000);
  camera.position.z = 1950;
  scene.add(new AmbientLight('#bcb9b7', .72));
  addDirectional(scene, '#e3d5c9', 3.5, [-1150, 1350, 1350]);
  addDirectional(scene, '#f98636', 4.2, [1250, 380, -480]);
  addDirectional(scene, '#a57659', 1.65, [560, -850, 670]);

  let model;
  try {
    ({ scene: model } = await new GLTFLoader().loadAsync(import.meta.env.BASE_URL + 'media/brain.glb'));
  } catch (error) {
    renderer.dispose();
    throw error;
  }
  normalizeModel(model);
  const graphite = new MeshStandardMaterial({ color: '#4b4643', roughness: .58, metalness: .26, transparent: true });
  const originals = new Set();
  model.traverse(part => {
    if (!part.isMesh) return;
    originals.add(part.material);
    part.material = graphite;
    part.renderOrder = 1;
  });
  originals.forEach(material => material.dispose());

  const brain = new Group();
  const silhouette = new Group();
  silhouette.add(model);
  const network = createNeuralNetwork(silhouette);
  silhouette.add(network.root);
  brain.add(silhouette);
  scene.add(brain);

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let started;
  const point = new Vector3();

  function draw(state) {
    const { w, h, x, y, scale, yaw, pitch, time, opacity, pillar } = state;
    const visible = opacity > .005 && y > -scale && y < h + scale;
    canvas.style.visibility = visible ? '' : 'hidden';
    if (!visible) return;
    if (width !== w || height !== h) {
      width = w;
      height = h;
      pixelRatio = Math.min(window.devicePixelRatio || 1, w <= 760 ? 1.35 : 1.65);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(w, h, false);
      camera.left = -w / 2;
      camera.right = w / 2;
      camera.top = h / 2;
      camera.bottom = -h / 2;
      camera.updateProjectionMatrix();
    }
    started ??= time;
    const intro = Math.min((time - started) / 1.15, 1);
    brain.position.set(x, y, 0);
    brain.position.x -= w / 2;
    brain.position.y = h / 2 - y + Math.sin(time * 1.1) * 2.5;
    brain.scale.setScalar(scale * .82);
    silhouette.rotation.set(.28 + pitch, 1.10 + yaw + Math.sin(time * .58) * .08, -.13);
    graphite.opacity = opacity;
    network.draw({ time, opacity, pillar, scale, pixelRatio, intro });
    renderer.render(scene, camera);
  }

  function projectSpark() {
    point.copy(network.exit);
    silhouette.localToWorld(point).project(camera);
    return { x: width * (point.x / 2 + .5), y: height * (.5 - point.y / 2) };
  }

  return { draw, projectSpark };
}
