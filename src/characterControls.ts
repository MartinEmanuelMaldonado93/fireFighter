import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { A, D, DIRECTIONS, S, W } from "./utils";

export class CharacterControls {
    model: THREE.Group;
    mixer: THREE.AnimationMixer;
    animationsMap: Map<string, THREE.AnimationAction> = new Map(); // Walk, Run, Idle
    orbitControl: OrbitControls;
    camera: THREE.Camera;

    // state
    toggleRun: boolean;
    currentAction: string;

    // temporary data
    cameraTarget = new THREE.Vector3();
    walkDirection = new THREE.Vector3();
    rotateAngle = new THREE.Vector3(0, 1, 0);
    rotateQuarternion = new THREE.Quaternion();

    // constants
    RUN_VELOCITY = 5;
    WALK_VELOCITY = 2;
    FADE_DURATION = 0.2;

    constructor(
        model: THREE.Group,
        mixer: THREE.AnimationMixer,
        animationsMap: Map<string, THREE.AnimationAction>,
        orbitControl: OrbitControls,
        camera: THREE.Camera,
        currentAction: string
    ) {
        this.model = model;
        this.mixer = mixer;
        this.animationsMap = animationsMap;
        this.currentAction = currentAction;
        this.toggleRun = false;
        const idle = this.animationsMap.get(currentAction);
        idle.play(); // Idle
        this.orbitControl = orbitControl;
        this.camera = camera;
        this._updateCameraTarget(0, 0);
    }
    /** New */
    public addAnimationsMap(animationsMap: Map<string, THREE.AnimationAction>) {
        this.animationsMap = animationsMap;
    }

    public switchRunToggle() {
        this.toggleRun = !this.toggleRun;
    }

    public update(delta: number, keysPressed: Record<string, boolean>) {
        const activeKey = (key: string) => {
            return keysPressed[key];
        };

        const isDirectionPressed: Boolean = DIRECTIONS.some(activeKey);
        // console.log(isDirectionPressed); // always is false
        // ACTION MODE
        let play = "";
        if (isDirectionPressed && this.toggleRun) {
            play = "Run";
            // console.log("run");
        } else if (isDirectionPressed) {
            play = "Walking";
            // console.log("walking");
        } else {
            play = "Idle";
            // console.log("idle");
        }

        /** Transition Animation */
        if (this.currentAction !== play) {
            console.log("controls", this.currentAction, play);
            const toPlay = this.animationsMap.get(play);
            const current = this.animationsMap.get(this.currentAction);

            current.fadeOut(this.FADE_DURATION);
            toPlay.reset().fadeIn(this.FADE_DURATION).play();

            this.currentAction = play;
        }

        this.mixer.update(delta);
        //this.currentAction == "Run" || this.currentAction == "Walk" this.currentAction !== "Idle"
        if (this.currentAction == "Run" || this.currentAction == "Walking") {
            console.log(this.currentAction);
            // calculate towards camera direction
            let angleYCameraDirection = Math.atan2(
                this.camera.position.x - this.model.position.x,
                this.camera.position.z - this.model.position.z
            );
            // diagonal movement angle offset
            let directionOffset = this._directionOffset(keysPressed);

            // rotate model
            this.rotateQuarternion.setFromAxisAngle(
                this.rotateAngle,
                angleYCameraDirection + directionOffset
            );
            this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2);

            // calculate direction
            this.camera.getWorldDirection(this.walkDirection);
            this.walkDirection.y = 0;
            this.walkDirection.normalize();
            this.walkDirection.applyAxisAngle(
                this.rotateAngle,
                directionOffset
            );

            // run/walk velocity
            const velocity =
                this.currentAction == "Run"
                    ? this.RUN_VELOCITY
                    : this.WALK_VELOCITY;

            // move model & camera
            const moveX = this.walkDirection.x * velocity * delta;
            const moveZ = this.walkDirection.z * velocity * delta;
            this.model.position.x += moveX;
            this.model.position.z += moveZ;
            this._updateCameraTarget(moveX, moveZ);
        }
    }

    private _updateCameraTarget(moveX: number, moveZ: number) {
        // move camera
        this.camera.position.x += moveX;
        this.camera.position.z += moveZ;

        // update camera target
        this.cameraTarget.x = this.model.position.x;
        this.cameraTarget.y = this.model.position.y + 1;
        this.cameraTarget.z = this.model.position.z;
        this.orbitControl.target = this.cameraTarget;
    }

    private _directionOffset(keysPressed: Record<string, boolean>) {
        let directionOffset = 0; // w

        if (keysPressed[W]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4; // w+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4; // w+d
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2; // s+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2; // s+d
            } else {
                directionOffset = Math.PI; // s
            }
        } else if (keysPressed[A]) {
            directionOffset = Math.PI / 2; // a
        } else if (keysPressed[D]) {
            directionOffset = -Math.PI / 2; // d
        }

        return directionOffset;
    }
}
