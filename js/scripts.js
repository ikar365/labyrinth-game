import * as THREE from './libs/three.module.js';
import { OrbitControls } from './libs/OrbitControls.js';
import { CSG } from './libs/CSG.js';

let scene, camera, renderer, controls;
let player, enemy, isGameOver = false;
let redBalls = [];
let playerSpeed = 0.6;
let enemySpeed = 0.34 * playerSpeed;
let redBallSpeed = 1.25 * playerSpeed;
let collisionTimeout = false;
let blueBallShrinksThreshold = 7;
let redBallCollision = false;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333444);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;
    controls.update();

    // Floor
    const floorTexture = new THREE.TextureLoader().load('grunge-texture.jpg');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(50, 50);

    const floorGeometry = new THREE.PlaneGeometry(5000, 5000);
    const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture, transparent: true, opacity: 0.5 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = - Math.PI / 2;
    scene.add(floor);

    // Walls
    const wallTexture = new THREE.TextureLoader().load('darkgreentiled-wall.jpg');
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(50, 10);

    const wallMaterial = new THREE.MeshBasicMaterial({ map: wallTexture });
    const wallHeight = 5000;
    const wallGeometry = new THREE.PlaneGeometry(5000, wallHeight);

    const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall1.position.set(0, wallHeight / 2, -2500);
    scene.add(wall1);

    const wall2 = wall1.clone();
    wall2.position.set(0, wallHeight / 2, 2500);
    wall2.rotation.y = Math.PI;
    scene.add(wall2);

    const wall3 = new THREE.Mesh(new THREE.PlaneGeometry(5000, wallHeight), wallMaterial);
    wall3.position.set(-2500, wallHeight / 2, 0);
    wall3.rotation.y = Math.PI / 2;
    scene.add(wall3);

    const wall4 = wall3.clone();
    wall4.position.set(2500, wallHeight / 2, 0);
    wall4.rotation.y = -Math.PI / 2;
    scene.add(wall4);

    // Player
    const playerGeometry = new THREE.SphereGeometry(10, 32, 32);
    const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff, emissive: 0x111111, shininess: 100 });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 10, 0);
    scene.add(player);

    // Enemy
    const enemyGeometry = new THREE.SphereGeometry(25, 32, 32);
    const enemyMaterial = new THREE.MeshPhongMaterial({
        color: 0xffa500,
        emissive: 0x111111,
        shininess: 100,
        opacity: 0.95,
        refractionRatio: 0.98
    });
    enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    enemy.position.set(100, 25, 100);
    scene.add(enemy);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onDocumentKeyDown, false);

    setInterval(spawnRedBall, 15000); // Spawn a red ball every 15 seconds

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentKeyDown(event) {
    const keyCode = event.which;
    if (!isGameOver) {
        if (keyCode === 87) { // W
            player.position.z -= playerSpeed;
        } else if (keyCode === 83) { // S
            player.position.z += playerSpeed;
        } else if (keyCode === 65) { // A
            player.position.x -= playerSpeed;
        } else if (keyCode === 68) { // D
            player.position.x += playerSpeed;
        } else if (keyCode === 32) { // Space
            player.position.y += playerSpeed;
        } else if (keyCode === 88) { // X
            player.position.y -= playerSpeed;
        }
    }
}

function spawnRedBall() {
    if (enemy.userData.collided) {
        const redBallGeometry = new THREE.SphereGeometry(15, 32, 32);
        const redBallMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const redBall = new THREE.Mesh(redBallGeometry, redBallMaterial);
        redBall.position.copy(enemy.position);
        scene.add(redBall);
        redBalls.push(redBall);
    }
}

function checkCollision(object1, object2) {
    const distance = object1.position.distanceTo(object2.position);
    return distance < (object1.geometry.parameters.radius * object1.scale.x + object2.geometry.parameters.radius * object2.scale.x);
}

function handleGameOver() {
    isGameOver = true;

    let swallowInterval = setInterval(() => {
        enemy.geometry = new THREE.SphereGeometry(enemy.geometry.parameters.radius, 32, 32, 0, Math.PI * 2, 0, Math.PI * 2 * (1 - player.scale.x / 10));
        if (player.scale.x <= 0.1) {
            clearInterval(swallowInterval);
            scene.remove(player);
            enemy.geometry = new THREE.SphereGeometry(enemy.geometry.parameters.radius * 3, 32, 32);
        }
    }, 100);
}

function animate() {
    if (isGameOver) {
        return;
    }

    requestAnimationFrame(animate);

    // Enemy chases player
    if (!enemy.userData.collided && !redBallCollision) {
        const direction = new THREE.Vector3();
        direction.subVectors(player.position, enemy.position).normalize();
        enemy.position.addScaledVector(direction, enemySpeed);
    }

    redBalls.forEach(redBall => {
        if (!redBall.userData.collided) {
            const direction = new THREE.Vector3();
            direction.subVectors(player.position, redBall.position).normalize();
            redBall.position.addScaledVector(direction, redBallSpeed);

            // Check collision with player
            if (checkCollision(redBall, player)) {
                redBall.userData.collided = true;
                player.scale.setScalar(player.scale.x - 0.1);
                if (player.scale.x <= blueBallShrinksThreshold) {
                    redBallCollision = true;
                    redBallSpeed = 0;
                    enemySpeed = 3 * playerSpeed;
                }
            }
        }
    });

    // Check collision between player and enemy
    if (checkCollision(player, enemy) && !collisionTimeout) {
        enemy.userData.collided = true;
        setTimeout(() => {
            enemy.userData.collided = false;
        }, 30000); // Enemy resumes movement after 30 seconds
    }

    // If blue ball size is less than threshold
    if (player.scale.x <= blueBallShrinksThreshold && !isGameOver) {
        handleGameOver();
    }

    // Update camera to follow player without changing the angle
    const playerPosition = new THREE.Vector3(player.position.x, player.position.y, player.position.z);
    controls.target.copy(playerPosition);

    controls.update();
    renderer.render(scene, camera);
}

init();
