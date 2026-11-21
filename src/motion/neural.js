import {
  BufferGeometry, Float32BufferAttribute, Group, LineBasicMaterial, LineSegments,
  Points, Raycaster, ShaderMaterial, Vector3
} from 'three';

const SUNFLOWER = Math.PI * (3 - Math.sqrt(5));
const GROUPS = 3;

function sampleSurface(mesh, count) {
  const ray = new Raycaster();
  const points = [];
  const direction = new Vector3();
  const origin = new Vector3();
  mesh.updateWorldMatrix(true, true);
  for (let i = 0; i < count; i++) {
    const y = 1 - (i + .5) * (2 / count);
    const radius = Math.sqrt(1 - y * y);
    direction.set(Math.cos(i * SUNFLOWER) * radius, y, Math.sin(i * SUNFLOWER) * radius);
    origin.copy(direction).multiplyScalar(2);
    ray.set(origin, direction.negate());
    const hit = ray.intersectObject(mesh, true)[0];
    if (hit) points.push(hit.point.addScaledVector(direction, -.006));
  }
  return points;
}

const vertex = `
  uniform float radius;
  attribute float seed;
  varying float vSeed;

  void main() {
    vSeed = seed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    gl_PointSize = radius * (0.55 + fract(seed * 7.19) * 0.65);
  }
`;
const fragment = `
  uniform float strength;
  uniform float time;
  varying float vSeed;

  void main() {
    float d = length(gl_PointCoord - .5);
    float glow = exp(-d * 11.) * (1. - smoothstep(.34, .5, d));
    float core = 1. - smoothstep(.049, .17, d);
    float flicker = .75 + .25 * sin(vSeed * 30. + time * 1.3);
    gl_FragColor = vec4(mix(vec3(1., .39, .10), vec3(1., .89, .68), core), (glow * .75 + core) * strength * flicker);
  }
`;

export function createNeuralNetwork(mesh) {
  const points = sampleSurface(mesh, 260);
  const root = new Group();
  const clusters = Array.from({ length: GROUPS }, (_, index) => {
    const pointsInRegion = points.filter(point => {
      const region = point.z > .14 ? 0 : point.y > .095 ? 1 : 2;
      return region === index;
    });
    const edges = [];
    pointsInRegion.forEach((point, i) => {
      const near = pointsInRegion.slice(i + 1).filter(other => {
        const span = point.distanceToSquared(other);
        return span > .008 && span < .034;
      }).slice(0, 3);
      for (const next of near) edges.push(point, next);
    });
    const geometry = new BufferGeometry().setFromPoints(pointsInRegion);
    geometry.setAttribute('seed', new Float32BufferAttribute(pointsInRegion.map((_, i) => (i + 1) * .133), 1));
    const material = new ShaderMaterial({
      uniforms: { strength: { value: 0 }, radius: { value: 1 }, time: { value: 0 } },
      vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false
    });
    const line = new LineBasicMaterial({ color: '#f2a65a', transparent: true, depthWrite: false, opacity: 0 });
    const fibers = new LineSegments(new BufferGeometry().setFromPoints(edges), line);
    const sparks = new Points(geometry, material);
    fibers.renderOrder = sparks.renderOrder = 2;
    root.add(fibers, sparks);
    return { material, line };
  });
  const exit = points.reduce((best, point) => {
    const score = point.x * .49 + point.z * .24 - Math.abs(point.y) * .42;
    return score > best.score ? { point, score } : best;
  }, { point: new Vector3(), score: -Infinity }).point;

  function draw({ time, opacity, pillar, scale, pixelRatio, intro }) {
    clusters.forEach(({ material, line }, index) => {
      const lit = pillar < 0 ? .8 : index === pillar ? 1.28 : .27;
      const wake = Math.min(1, Math.max(0, intro * 1.7 - index * .26));
      material.uniforms.strength.value = lit * opacity * wake;
      material.uniforms.radius.value = Math.max(11, scale * .036) * pixelRatio;
      material.uniforms.time.value = time;
      line.opacity = lit * opacity * .25 * wake;
    });
  }

  return { root, exit, draw };
}
