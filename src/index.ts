import { KeyDisplay } from "./utils";
import { CharacterControls } from "./characterControls";
import * as THREE from "three";
import { MeshStandardMaterial, SkinnedMesh, BufferGeometry } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8def0);

// CAMERA
const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.y = 5;
camera.position.z = 5;
camera.position.x = 0;

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

// CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 15;
orbitControls.enablePan = false;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;
orbitControls.update();

// LIGHTS
light();

// FLOOR
generateFloor();

// MODEL WITH ANIMATIONS

let characterControls: CharacterControls;
let mixer: THREE.AnimationMixer;
const animationsMap: Map<string, THREE.AnimationAction> = new Map();
let gltfAnimations: Array<THREE.AnimationClip>;
let model: GLTF["scene"];
const models = [
    // "models/Soldier.glb",
    "models/FireFighter_out/fireFighter.gltf",
];
const URL_MODEL = "models/FireFighter_out/fireFighter.gltf";
const URL_ANIMATION = "animations/Walking_out/Walking.gltf";

/** Model  */
new GLTFLoader().load(URL_MODEL, (gltf) => {
    model = gltf.scene;
    // model.rotateY(THREE.MathUtils.degToRad(180));

    const TEXTURE_PATH = "models/image/FireFighter.png";
    const textureModel = new THREE.TextureLoader();
    textureModel.load(TEXTURE_PATH, function (texture) {
        model.traverse(
            (object: SkinnedMesh<BufferGeometry, MeshStandardMaterial>) => {
                if (object.type === "SkinnedMesh") {
                    object.material.map = texture;
                }
            }
        );
    });

    model.traverse(function (object: THREE.Mesh) {
        if (object.isMesh) object.castShadow = true;
    });
    scene.add(model);

    mixer = new THREE.AnimationMixer(model);

    gltfAnimations = gltf.animations;
    gltfAnimations
        .filter((a) => a.name != "TPose")
        .forEach((a) => {
            animationsMap.set(a.name, mixer.clipAction(a));
        });

    new GLTFLoader().load(URL_ANIMATION, (gltf) => {
        let animation = gltf.animations[0];
        animationsMap.set(animation.name, mixer.clipAction(animation));

        characterControls = new CharacterControls(
            model,
            mixer,
            animationsMap,
            orbitControls,
            camera,
            "Idle"
        );
    });
});

// CONTROL KEYS
const keysPressed: Record<string, boolean> = {};
const keyDisplayQueue = new KeyDisplay();
document.addEventListener(
    "keydown",
    (event) => {
        let currKey: string = event.key;
        // console.log(currKey);
        keyDisplayQueue.down(currKey); /** Paint display */

        if (event.shiftKey && characterControls) {
            characterControls.switchRunToggle();
        } else {
            keysPressed[currKey] = true; /** Mark as true(pressed) */
        }
    },
    false
);
document.addEventListener(
    "keyup",
    (event) => {
        let currKey: string = event.key;
        keyDisplayQueue.up(currKey);
        keysPressed[currKey] = false;
    },
    false
);

const clock = new THREE.Clock();
// ANIMATE
function animate() {
    if (characterControls) {
        // console.log("controls");
        let delta = clock.getDelta();
        characterControls.update(delta, keysPressed);
    }
    // if (mixersArray.length > 0) mixersArray[0].update(delta); // works fine
    orbitControls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

document.body.appendChild(renderer.domElement);
animate();

// RESIZE HANDLER
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    keyDisplayQueue.updatePosition();
}
window.addEventListener("resize", onWindowResize);

function generateFloor() {
    // TEXTURES
    const textureLoader = new THREE.TextureLoader();
    const placeholder = textureLoader.load(
        "./textures/placeholder/placeholder.png"
    );
    const sandBaseColor = textureLoader.load(
        "./textures/sand/Sand 002_COLOR.jpg"
    );
    const sandNormalMap = textureLoader.load(
        "./textures/sand/Sand 002_NRM.jpg"
    );
    const sandHeightMap = textureLoader.load(
        "./textures/sand/Sand 002_DISP.jpg"
    );
    const sandAmbientOcclusion = textureLoader.load(
        "./textures/sand/Sand 002_OCC.jpg"
    );

    const WIDTH = 80;
    const LENGTH = 80;

    const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 512, 512);
    const material = new THREE.MeshStandardMaterial({
        map: sandBaseColor,
        normalMap: sandNormalMap,
        displacementMap: sandHeightMap,
        displacementScale: 0.1,
        aoMap: sandAmbientOcclusion,
    });
    wrapAndRepeatTexture(material.map);
    wrapAndRepeatTexture(material.normalMap);
    wrapAndRepeatTexture(material.displacementMap);
    wrapAndRepeatTexture(material.aoMap);
    // const material = new THREE.MeshPhongMaterial({ map: placeholder})

    const floor = new THREE.Mesh(geometry, material);
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
}

function wrapAndRepeatTexture(map: THREE.Texture) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.x = map.repeat.y = 10;
}
// Ambient light
function light() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(-60, 100, -10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    scene.add(dirLight);
    // scene.add( new THREE.CameraHelper(dirLight.shadow.camera))
}
