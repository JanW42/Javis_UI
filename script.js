const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
// 10 ist wie groß das ganze
camera.position.z = 10;
camera.position.y = 0;
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("ai-canvas"),
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
// Zweite (innere) Kugel – z. B. als Kern
const innerSphereGeometry = new THREE.SphereGeometry(1.2, 64, 64);
const innerSphereMaterial = new THREE.MeshPhongMaterial({
  color: 0xffa500,
  transparent: true,
  opacity: 0.6,
  shininess: 180,
  emissive: 0xffa500,
  emissiveIntensity: 0.6,
  depthWrite: false
});


const innerSphere = new THREE.Mesh(innerSphereGeometry, innerSphereMaterial);
scene.add(innerSphere);
// Kugel in der Mitte
const sphereGeometry = new THREE.SphereGeometry(2, 128, 128);
const sphereMaterial = new THREE.MeshPhongMaterial({
    color: 0xffa500,
    transparent: true,
    opacity: 0.4,
    shininess: 120,
    depthWrite: false
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

// Lichtquelle
const light = new THREE.PointLight(0xffa500, 2, 20);
light.position.set(0, 0, 5);
scene.add(light);

// Dickere Ringe
const rings = [];
for (let i = 0; i < 17; i++) {
    const radius = 1.5 + i * 0.09; // mehr Abstand = optisch dicker
    const ringGeo = new THREE.RingGeometry(radius - 0.02, radius + 0.02, 128); // dickerer Ring
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffa500,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.random() * Math.PI;
    ring.rotation.y = Math.random() * Math.PI;
    ring.userData = { speed: (Math.random() - 0.5) * 0.01 };
    scene.add(ring);
    rings.push(ring);
}

// Fragmente + Linien
const fragments = [];
const lines = [];

const fragGeo = new THREE.IcosahedronGeometry(0.05, 0);
const fragMat = new THREE.MeshBasicMaterial({
    color: 0xffa500,
    transparent: true,
    opacity: 0.6
});

for (let i = 0; i < 100; i++) {
    const frag = new THREE.Mesh(fragGeo, fragMat.clone());
    frag.position.set(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
    );
    frag.userData = {
        velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.008,
            (Math.random() - 0.5) * 0.008,
            (Math.random() - 0.5) * 0.008
        ),
        lineProgress: 0,
        lineSpeed: 0.01 + Math.random() * 0.02,
        impulse: 0,
        impulseCooldown: 0
    };
    
    fragments.push(frag);
    scene.add(frag);
    
    const points = [new THREE.Vector3(0, 0, 0), frag.position.clone()];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
        color: 0xffa500,
        transparent: true,
        opacity: 0.4
    });
    const line = new THREE.Line(lineGeo, lineMat);
    lines.push(line);
    scene.add(line);
}

// Animation
function animate() {
    requestAnimationFrame(animate);
    
    sphere.rotation.y += 0.002;
    
    rings.forEach((ring) => {
        ring.rotation.y += ring.userData.speed;
    });
    // Leichtes Pulsieren der inneren Kugel die 0.02 steht für wie stark der inner Kreis pulsiert
    const pulseScale = 1 + Math.sin(performance.now() * 0.003) * 0.02;
    innerSphere.scale.set(pulseScale, pulseScale, pulseScale);
    
    fragments.forEach((frag, i) => {
        frag.position.add(frag.userData.velocity);
        
        // Begrenzte Reichweite 2.2 ist wie Weit die Fragmente nach außen
        if (frag.position.length() > 2.2) {
            frag.position.set(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            );
      frag.userData.lineProgress = 0;
      frag.userData.impulse = 0;
      frag.userData.impulseCooldown = 0;
    }

    // Linie animieren (schießt von innen nach außen)
    const progress = frag.userData.lineProgress;
    const speed = frag.userData.lineSpeed;
    frag.userData.lineProgress = Math.min(progress + speed, 1);

    const currentEnd = frag.position
      .clone()
      .multiplyScalar(frag.userData.lineProgress);
    const points = [new THREE.Vector3(0, 0, 0), currentEnd];
    lines[i].geometry.setFromPoints(points);

    // 💥 Impuls-Logik
    if (frag.userData.impulseCooldown <= 0 && Math.random() < 0.003) {
      frag.userData.impulse = 1;
      frag.userData.impulseCooldown = 200; // Frames bis nächster Impuls
    }

    // Impuls abschwächen
    if (frag.userData.impulse > 0) {
      frag.userData.impulse -= 0.05;
    } else {
      frag.userData.impulse = 0;
    }

    frag.userData.impulseCooldown--;

    // 🔥 Puls + Impuls kombiniert
    const time = performance.now() * 0.002 + i;
    const pulse = 0.3 + Math.abs(Math.sin(time)) * 0.7; // 0.3–1.0
    const finalOpacity = Math.min(1.0, pulse + frag.userData.impulse);
    lines[i].material.opacity = finalOpacity;
  });

  renderer.render(scene, camera);
}

animate();

// Responsives Verhalten
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
