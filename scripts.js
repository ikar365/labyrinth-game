import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

let camera, scene, renderer;
let player, enemy;
let playerSpeed = 0.2;
let enemySpeed = 0.05;
let keys = {};

init();
animate();

function init() {
    const gameContainer = document.getElementById('game-container');

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 100);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    gameContainer.appendChild(renderer.domElement);

    const floorGeometry = new THREE.PlaneGeometry(1920, 1080);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const wallGeometry = new THREE.PlaneGeometry(1920, 100);
    const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x404040 });

    const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall1.position.set(0, 50, -540);
    scene.add(wall1);

    const wall2 = wall1.clone();
    wall2.position.set(0, 50, 540);
    wall2.rotation.y = Math.PI;
    scene.add(wall2);

    const wall3 = new THREE.Mesh(new THREE.PlaneGeometry(1080, 100), wallMaterial);
    wall3.position.set(-960, 50, 0);
    wall3.rotation.y = Math.PI / 2;
    scene.add(wall3);

    const wall4 = wall3.clone();
    wall4.position.set(960, 50, 0);
    wall4.rotation.y = -Math.PI / 2;
    scene.add(wall4);

    const roof = floor.clone();
    roof.position.y = 100;
    roof.rotation.x = Math.PI / 2;
    scene.add(roof);

    const playerGeometry = new THREE.SphereGeometry(5, 32, 32);
    const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 5, 0);
    scene.add(player);

    const enemyGeometry = new THREE.SphereGeometry(12.5, 32, 32);
    const enemyMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500 });
    enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    enemy.position.set(100, 12.5, 100);
    scene.add(enemy);

    window.addEventListener('keydown', (event) => {
        keys[event.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (event) => {
        keys[event.key.toLowerCase()] = false;
    });
}

function animate() {
    requestAnimationFrame(animate);

    if (keys['w']) player.position.z -= playerSpeed;
    if (keys['s']) player.position.z += playerSpeed;
    if (keys['a']) player.position.x -= playerSpeed;
    if (keys['d']) player.position.x += playerSpeed;

    const direction = new THREE.Vector3();
    direction.subVectors(player.position, enemy.position).normalize();
    enemy.position.addScaledVector(direction, enemySpeed);

    renderer.render(scene, camera);
}
