import * as THREE from './libs/three.module.js';
import { OrbitControls } from './libs/OrbitControls.js';
import { CSG } from './libs/CSG.js';

let scene, camera, renderer, controls;
let player, enemy;
let playerSpeed = 0.9;
let enemySpeed = playerSpeed * 0.34;
let redBalls = [];
let canSpawnRedBall = true;
let firstSpawn = true;

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
    } else if (keyCode === 70) { // F
        shootParticle();
    }
}

function shootParticle() {
    const particleGeometry = new THREE.SphereGeometry(3, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);

    particle.position.copy(player.position);
    particle.velocity = new THREE.Vector3().subVectors(enemy.position, player.position).normalize().multiplyScalar(5);

    scene.add(particle);

    const animateParticle = () => {
        if (particle) {
            particle.position.add(particle.velocity);

            // Check for collision with red balls
            redBalls.forEach((redBall, index) => {
                if (particle.position.distanceTo(redBall.position) < 13) { // Adjust the collision distance as needed
                    redBall.scale.multiplyScalar(0.9);
                    scene.remove(particle);

                    if (redBall.scale.x < 0.1) {
                        scene.remove(redBall);
                        redBalls.splice(index, 1);
                    }
                }
            });

            // Continue animating if particle is still within bounds
            if (particle && Math.abs(particle.position.x) < 2500 && Math.abs(particle.position.y) < 2500 && Math.abs(particle.position.z) < 2500) {
                requestAnimationFrame(animateParticle);
            } else {
                scene.remove(particle);
            }
        }
    };

    animateParticle();
}

function animate() {
    requestAnimationFrame(animate);

    // Enemy chases player
    if (enemy.position.distanceTo(player.position) > 25) {
        const direction = new THREE.Vector3();
        direction.subVectors(player.position, enemy.position).normalize();
        enemy.position.addScaledVector(direction, enemySpeed);
    }

    // Red balls chase player
    redBalls.forEach(redBall => {
        if (redBall.position.distanceTo(player.position) > 10) {
            const direction = new THREE.Vector3();
            direction.subVectors(player.position, redBall.position).normalize();
            redBall.position.addScaledVector(direction, playerSpeed * 1.25);
        }
    });

    // Collision detection between player and red balls
    redBalls.forEach((redBall, index) => {
        if (player.position.distanceTo(redBall.position) < 15) { // Adjust the collision distance as needed
            player.scale.multiplyScalar(0.9);
            redBall.scale.multiplyScalar(1.1);

            if (player.scale.x < 0.1) {
                // Game over logic
                scene.remove(player);
                enemy.scale.multiplyScalar(1.1);
                enemy.position.set(0, 0, 0); // Move enemy to center for celebration
                redBalls.forEach(ball => ball.position.set(Math.random() * 1000 - 500, 0, Math.random() * 1000 - 500));
                alert("Game Over");
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

    redBall.position.copy(player.position);
    redBalls.push(redBall);
    scene.add(redBall);
}

function handleCollision() {
    if (firstSpawn) {
        setTimeout(() => {
            spawnRedBall();
            firstSpawn = false;
        }, 15000);
    } else if (canSpawnRedBall) {
        spawnRedBall();
        canSpawnRedBall = false;
        setTimeout(() => {
            canSpawnRedBall = true;
        }, 15000);
    }
}

init();
