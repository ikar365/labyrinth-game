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
        import * as THREE from './js/libs/three.module.js';
        import { OrbitControls } from './js/libs/OrbitControls.js';
        import { CSG } from './js/libs/CSG.js';

        let scene, camera, renderer, controls;
        let player, enemy, enemySensor;
        let playerSpeed = 0.9;
        let enemySpeed = playerSpeed * 0.34;
        let redBalls = [];
        let redBallSpawnDelay = 15000; // 15 seconds
        let lastRedBallSpawnTime = 0;
        let isSwallowing = false;

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
            floor.rotation.x = -Math.PI / 2;
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
                shininess: 100
            });
            enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
            enemy.position.set(100, 25, 100);
            scene.add(enemy);

            // Enemy Sensor
            const enemySensorGeometry = new THREE.SphereGeometry(26, 32, 32); // 1 pixel larger than the enemy
            const enemySensorMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500, transparent: true, opacity: 0.0 });
            enemySensor = new THREE.Mesh(enemySensorGeometry, enemySensorMaterial);
            enemySensor.position.copy(enemy.position);
            scene.add(enemySensor);

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
            }
        }

        function spawnRedBall() {
            const redBallGeometry = new THREE.SphereGeometry(15, 32, 32);
            const redBallMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0x111111, shininess: 100 });
            const redBall = new THREE.Mesh(redBallGeometry, redBallMaterial);
            redBall.position.copy(enemy.position);
            scene.add(redBall);
            redBalls.push(redBall);
        }

        function animate() {
            requestAnimationFrame(animate);

            // Update enemy sensor position
            enemySensor.position.copy(enemy.position);

            // Enemy chases player
            if (!isSwallowing && enemy.position.distanceTo(player.position) > 35) {
                const direction = new THREE.Vector3();
                direction.subVectors(player.position, enemy.position).normalize();
                enemy.position.addScaledVector(direction, enemySpeed);
                enemySensor.position.addScaledVector(direction, enemySpeed);
            }

            // Check for collision between player and enemy sensor
            if (enemySensor.position.distanceTo(player.position) < 35) {
                if (Date.now() - lastRedBallSpawnTime > redBallSpawnDelay) {
                    spawnRedBall();
                    lastRedBallSpawnTime = Date.now();
                }
            }

            // Red balls chase player
            redBalls.forEach((redBall) => {
                if (redBall.position.distanceTo(player.position) > 35) {
                    const direction = new THREE.Vector3();
                    direction.subVectors(player.position, redBall.position).normalize();
                    redBall.position.addScaledVector(direction, playerSpeed * 1.25);
                } else {
                    // Shrink player and grow red ball
                    player.geometry = new THREE.SphereGeometry(player.geometry.parameters.radius - 0.1, 32, 32);
                    redBall.geometry = new THREE.SphereGeometry(redBall.geometry.parameters.radius + 0.1, 32, 32);

                    if (player.geometry.parameters.radius <= 7 && !isSwallowing) {
                        // Blue ball shrinks below 7 pixels
                        redBalls.forEach((rb) => {
                            const direction = new THREE.Vector3();
                            direction.subVectors(rb.position, player.position).normalize();
                            rb.position.addScaledVector(direction, 10);
                        });

                        enemySpeed = playerSpeed * 3;
                        if (enemy.position.distanceTo(player.position) < 35) {
                            playerSpeed = 0;
                            isSwallowing = true;
                            setTimeout(() => {
                                const newGeometry = new THREE.SphereGeometry(enemy.geometry.parameters.radius + player.geometry.parameters.radius * 2, 32, 32);
                                enemy.geometry.dispose();
                                enemy.geometry = newGeometry;
                                scene.remove(player);
                            }, 2000);
                        }
                    }
                }
            });

            controls.update();
            renderer.render(scene, camera);
        }

        init();
    </script>
</body>
</html>
