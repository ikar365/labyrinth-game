<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Labyrinth Game</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <script type="module">
        import * as THREE from './libs/three.module.js';
        import { OrbitControls } from './libs/OrbitControls.js';
        import { CSG } from './libs/CSG.js';

        let scene, camera, renderer, controls;
        let player, enemy;
        let playerSpeed = 0.5; // Adjusted player speed
        let enemySpeed = playerSpeed * 0.95;
        let redBallSpeed = playerSpeed * 1.25;
        let lastBirthTime = 0;
        let particles = [];

        function init() {
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x333444);

            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
            camera.position.set(0, 50, 200); // Initial position of the camera

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
            const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });
            const floor = new THREE.Mesh(floorGeometry, floorMaterial);
            floor.rotation.x = - Math.PI / 2;
            scene.add(floor);

            // Walls
            const wallTexture = new THREE.TextureLoader().load('dark-concrete-wall.jpg');
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
            const enemyMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xffa500,
                emissive: 0x111111,
                roughness: 0.1,
                metalness: 0.5,
                reflectivity: 1
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
            const particleGeometry = new THREE.SphereGeometry(3, 16, 16);
            const particleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(player.position);
            particle.velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion).normalize().multiplyScalar(2);
            scene.add(particle);
            particles.push(particle);
        }

        function animate() {
            requestAnimationFrame(animate);

            // Update particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const particle = particles[i];
                particle.position.add(particle.velocity);

                // Remove particle if it goes too far
                if (particle.position.distanceTo(player.position) > 200) {
                    scene.remove(particle);
                    particles.splice(i, 1);
                }
            }

            // Enemy chases player
            const direction = new THREE.Vector3();
            direction.subVectors(player.position, enemy.position).normalize();
            enemy.position.addScaledVector(direction, enemySpeed);

            // Ensure the camera is always following the player, but doesn't override the controls
            controls.target.copy(player.position);
            controls.update();

            renderer.render(scene, camera);
        }

        init();
    </script>
</body>
</html>
