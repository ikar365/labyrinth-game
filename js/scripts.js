import * as THREE from './libs/three.module.js';
import { CSG } from './libs/CSG.js';

// Create the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(50, 50, 50);
scene.add(pointLight);

// Create the floor, walls, and roof
const geometry = new THREE.BoxGeometry(1920, 10, 1080);
const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
const floor = new THREE.Mesh(geometry, material);
floor.position.set(0, -5, 0);
scene.add(floor);

const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x606060 });
const walls = [
    new THREE.Mesh(new THREE.BoxGeometry(1920, 100, 10), wallMaterial),
    new THREE.Mesh(new THREE.BoxGeometry(1920, 100, 10), wallMaterial),
    new THREE.Mesh(new THREE.BoxGeometry(10, 100, 1080), wallMaterial),
    new THREE.Mesh(new THREE.BoxGeometry(10, 100, 1080), wallMaterial),
];
walls[0].position.set(0, 45, -535);
walls[1].position.set(0, 45, 535);
walls[2].position.set(-960, 45, 0);
walls[3].position.set(960, 45, 0);
walls.forEach(wall => scene.add(wall));

const roof = new THREE.Mesh(geometry, material);
roof.position.set(0, 95, 0);
scene.add(roof);

// Create player ball (blue) and enemy ball (orange)
const playerGeometry = new THREE.SphereGeometry(10, 32, 32);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const playerBall = new THREE.Mesh(playerGeometry, playerMaterial);
playerBall.position.set(0, 0, 0);
scene.add(playerBall);

const enemyGeometry = new THREE.SphereGeometry(25, 32, 32);
const enemyMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
const enemyBall = new THREE.Mesh(enemyGeometry, enemyMaterial);
enemyBall.position.set(100, 0, 100);
scene.add(enemyBall);

// Set camera position
camera.position.set(0, 50, 200);

// Handle keyboard input
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Update player position based on input
const moveSpeed = 2;
function updatePlayerPosition() {
    if (keys['w']) playerBall.position.z -= moveSpeed;
    if (keys['s']) playerBall.position.z += moveSpeed;
    if (keys['a']) playerBall.position.x -= moveSpeed;
    if (keys['d']) playerBall.position.x += moveSpeed;
}

// Simple enemy AI to chase the player
const enemySpeed = 1.5;
function updateEnemyPosition() {
    const direction = new THREE.Vector3(
        playerBall.position.x - enemyBall.position.x,
        0,
        playerBall.position.z - enemyBall.position.z
    ).normalize();
    enemyBall.position.add(direction.multiplyScalar(enemySpeed));
}

// Detect collision and trigger swallowing effect
function detectCollision() {
    const distance = playerBall.position.distanceTo(enemyBall.position);
    if (distance < (10 + 25)) {
        // Swallowing effect: gradually scale down the player and up the enemy
        const swallowSpeed = 0.05;
        playerBall.scale.set(
            Math.max(playerBall.scale.x - swallowSpeed, 0),
            Math.max(playerBall.scale.y - swallowSpeed, 0),
            Math.max(playerBall.scale.z - swallowSpeed, 0)
        );
        enemyBall.scale.set(
            enemyBall.scale.x + swallowSpeed,
            enemyBall.scale.y + swallowSpeed,
            enemyBall.scale.z + swallowSpeed
        );
        if (playerBall.scale.x <= 0.1) {
            alert('Game Over');
            playerBall.scale.set(1, 1, 1);
            enemyBall.scale.set(1, 1, 1);
            playerBall.position.set(0, 0, 0);
            enemyBall.position.set(100, 0, 100);
        }
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    updatePlayerPosition();
    updateEnemyPosition();
    detectCollision();
    renderer.render(scene, camera);
}
animate();
