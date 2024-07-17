import * as THREE from './libs/three.module.js';
import { OrbitControls } from './libs/OrbitControls.js';
import { CSG } from './libs/CSG.js';

let scene, camera, renderer, controls;
let player, enemy, redBalls = [];
let playerSpeed = 0.9;
let enemySpeed = playerSpeed * 0.34;
let redBallSpeed = playerSpeed * 1.25;
let redBallSpawnInterval = 15000; // 15 seconds
let canSpawnRedBall = true;
let isSwallowing = false;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333444);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 200, 400);

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
    floorTexture.anisotropy = 16;
    const floorGeometry = new THREE.PlaneGeometry(5000, 5000);
    const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture, transparent: true, opacity: 0.5 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = - Math.PI / 2;
    scene.add(floor);

    // Walls
    const wallTexture = new THREE.TextureLoader().load('darkgreentiled-wall.jpg');
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(50, 10);
    wallTexture.anisotropy = 16;
    const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture });
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
    const enemyMaterial = new THREE.MeshStandardMaterial({
        color: 0xffa500,
        emissive: 0x111111,
        roughness: 0.1,
        metalness: 0.9
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

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentKeyDown(event) {
    const keyCode = event.which;
    if (keyCode === 87) { // W
        movePlayer(new THREE.Vector3(0, 0, -playerSpeed));
    } else if (keyCode === 83) { // S
        movePlayer(new THREE.Vector3(0, 0, playerSpeed));
    } else if (keyCode === 65) { // A
        movePlayer(new THREE.Vector3(-playerSpeed, 0, 0));
    } else if (keyCode === 68) { // D
        movePlayer(new THREE.Vector3(playerSpeed, 0, 0));
    } else if (keyCode === 32) { // Space
        movePlayer(new THREE.Vector3(0, playerSpeed, 0));
    } else if (keyCode === 88) { // X
        movePlayer(new THREE.Vector3(0, -playerSpeed, 0));
    }
}

function movePlayer(delta) {
    if (isSwallowing) return;

    const newPosition = player.position.clone().add(delta);

    // Check for collision with walls
    if (newPosition.x - player.geometry.parameters.radius < -2500 ||
        newPosition.x + player.geometry.parameters.radius > 2500 ||
        newPosition.z - player.geometry.parameters.radius < -2500 ||
        newPosition.z + player.geometry.parameters.radius > 2500 ||
        newPosition.y - player.geometry.parameters.radius < 0 ||
        newPosition.y + player.geometry.parameters.radius > 5000) {
        return; // Prevent movement if collision detected
    }

    // Check for collision with enemy
    if (checkCollision(newPosition, player.geometry.parameters.radius, enemy.position, enemy.geometry.parameters.radius)) {
        resolveCollision(player, enemy);
        return; // Prevent movement if collision detected
    }

    // Check for collision with red balls
    for (const redBall of redBalls) {
        if (checkCollision(newPosition, player.geometry.parameters.radius, redBall.position, redBall.geometry.parameters.radius)) {
            resolveCollision(player, redBall);
            return; // Prevent movement if collision detected
        }
    }

    player.position.copy(newPosition);
}

function checkCollision(position1, radius1, position2, radius2) {
    return position1.distanceTo(position2) < radius1 + radius2;
}

function resolveCollision(ball1, ball2) {
    const overlap = ball1.geometry.parameters.radius + ball2.geometry.parameters.radius - ball1.position.distanceTo(ball2.position);
    const direction = new THREE.Vector3().subVectors(ball1.position, ball2.position).normalize();
    ball1.position.addScaledVector(direction, overlap / 2);
    ball2.position.addScaledVector(direction, -overlap / 2);
}

function animate() {
    requestAnimationFrame(animate);

    // Enemy chases player
    if (!isSwallowing && enemy.position.distanceTo(player.position) > 10) {
        const direction = new THREE.Vector3();
        direction.subVectors(player.position, enemy.position).normalize();
        enemy.position.addScaledVector(direction, enemySpeed);
    }

    // Check and resolve collisions for all balls
    resolveBallCollisions();

    // Spawn red ball if conditions are met
    if (canSpawnRedBall && enemy.position.distanceTo(player.position) <= 10) {
        canSpawnRedBall = false;
        spawnRedBall();
        setTimeout(() => { canSpawnRedBall = true; }, redBallSpawnInterval);
    }

    // Red balls chase player
    redBalls.forEach(redBall => {
        if (redBall.position.distanceTo(player.position) > 10) {
            const direction = new THREE.Vector3();
            direction.subVectors(player.position, redBall.position).normalize();
            redBall.position.addScaledVector(direction, redBallSpeed);
        } else {
            // Red ball stops and shrinks player
            player.geometry = new THREE.SphereGeometry(player.geometry.parameters.radius - 1, 32, 32);
            redBall.geometry = new THREE.SphereGeometry(redBall.geometry.parameters.radius + 1, 32, 32);

            if (player.geometry.parameters.radius < 7) {
                // Red balls pull away
                redBalls.forEach(rb => {
                    const awayDirection = new THREE.Vector3();
                    awayDirection.subVectors(rb.position, player.position).normalize();
                    rb.position.addScaledVector(awayDirection, redBallSpeed);
                });

                // Orange ball chases to swallow
                isSwallowing = true;
                enemySpeed = playerSpeed * 3;
                const direction = new THREE.Vector3();
                direction.subVectors(player.position, enemy.position).normalize();
                enemy.position.addScaledVector(direction, enemySpeed);

                if (enemy.position.distanceTo(player.position) < enemy.geometry.parameters.radius + player.geometry.parameters.radius) {
                    // Swallowing sequence
                    player.position.copy(enemy.position);
                    const swallowInterval = setInterval(() => {
                        player.geometry.parameters.radius -= 1;
                        if (player.geometry.parameters.radius <= 0) {
                            clearInterval(swallowInterval);
                            scene.remove(player);
                            enemy.geometry.parameters.radius *= 3;
                            isSwallowing = false;
                        }
                    }, 100);
                }
            }
        }
    });

    controls.update();
    renderer.render(scene, camera);
}

function spawnRedBall() {
    const redBallGeometry = new THREE.SphereGeometry(15, 32, 32);
    const redBallMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0x111111, shininess: 100 });
    const redBall = new THREE.Mesh(redBallGeometry, redBallMaterial);
    redBall.position.copy(enemy.position);
    redBalls.push(redBall);
    scene.add(redBall);
}

function resolveBallCollisions() {
    // Check for collision between player and enemy
    if (checkCollision(player.position, player.geometry.parameters.radius, enemy.position, enemy.geometry.parameters.radius)) {
        resolveCollision(player, enemy);
    }

    // Check for collision between player and red balls
    for (const redBall of redBalls) {
        if (checkCollision(player.position, player.geometry.parameters.radius, redBall.position, redBall.geometry.parameters.radius)) {
            resolveCollision(player, redBall);
        }
    }

    // Check for collision between enemy and red balls
    for (const redBall of redBalls) {
        if (checkCollision(enemy.position, enemy.geometry.parameters.radius, redBall.position, redBall.geometry.parameters.radius)) {
            resolveCollision(enemy, redBall);
        }
    }

    // Check for collision between red balls
    for (let i = 0; i < redBalls.length; i++) {
        for (let j = i + 1; j < redBalls.length; j++) {
            if (checkCollision(redBalls[i].position, redBalls[i].geometry.parameters.radius, redBalls[j].position, redBalls[j].geometry.parameters.radius)) {
                resolveCollision(redBalls[i], redBalls[j]);
            }
        }
    }
}

init();
