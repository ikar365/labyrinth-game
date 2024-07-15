import * as THREE from '../libs/three.module.js';
import { CSG } from '../libs/three-csg.js';

let scene, camera, renderer, blueBall, orangeBall;

function createScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(10, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    blueBall = new THREE.Mesh(geometry, material);
    scene.add(blueBall);

    const orangeMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500 });
    orangeBall = new THREE.Mesh(new THREE.SphereGeometry(25, 32, 32), orangeMaterial);
    scene.add(orangeBall);

    camera.position.z = 500;
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

export { createScene, animate };
