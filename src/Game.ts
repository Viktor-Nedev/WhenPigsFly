import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

interface WingTransform {
    y?: number;
    z?: number;
    x?: number;
    scale?: number;
}

export class Game {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private player: THREE.Group = new THREE.Group();
    private pigMesh: THREE.Group = new THREE.Group();
    private obstacles: THREE.Group[] = [];
    private decorations: THREE.Group[] = [];
    private clouds: THREE.Group[] = [];
    private grounds: THREE.Group[] = [];


    private wingMesh: THREE.Group | null = null;
    private wingMixer: THREE.AnimationMixer | null = null;
    private wingClock: THREE.Clock = new THREE.Clock();
    private activeWingId: string = 'none';
    private activePigId: string = 'basic';
    private leftWingPart: THREE.Object3D | null = null;
    private rightWingPart: THREE.Object3D | null = null;

    private isIntro: boolean = false;
    private introPhase: 'diving' | 'transition' | 'done' = 'done';
    private altitude: number = 8.0;
    private laneWidth: number = 7.0;
    private currentLane: number = 0;
    private targetX: number = 0;


    private pigArchetypes: { [pigId: string]: string } = {
        'lowpoly': 'small', 'minecraft': 'small', 'piglet': 'small',
        'hamm': 'large', 'king_pig': 'large', 'muddy': 'large', 'pumba': 'large',
        'peppa': 'tall', 'porky': 'tall',
        'waddles': 'long',
        'basic': 'standard', 'cute_stylized': 'standard', 'elegant': 'standard', 'foreman': 'standard', 'crown': 'standard'
    };

    private wingConfigs: { [key: string]: { [wingId: string]: WingTransform } } = {
        'standard': {
            'default': { y: 0.9, z: -0.4, scale: 5.0 },
            'superman': { y: 0.8, z: -0.3, scale: 4.8 }
        },
        'small': {
            'default': { y: 0.6, z: -0.3, scale: 4.0 },
            'superman': { y: 0.5, z: -0.2, scale: 3.8 }
        },
        'large': {
            'default': { y: 1.3, z: -0.5, scale: 6.5 },
            'superman': { y: 1.2, z: -0.4, scale: 6.0 },
            'demon': { y: 1.4, z: -0.6, scale: 7.0 }
        },
        'tall': {
            'default': { y: 1.8, z: -0.5, scale: 5.5 },
            'superman': { y: 1.7, z: -0.4, scale: 5.2 }
        },
        'long': {
            'default': { y: 0.9, z: -0.8, scale: 5.0 }
        }
    };

    private score: number = 0;
    private distance: number = 0;
    private speed: number = 5;
    private gameActive: boolean = false;
    private time: number = 0;
    private gltfLoader: GLTFLoader = new GLTFLoader();
    private fbxLoader: FBXLoader = new FBXLoader();
    private textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
    private currentBiom: 'clouds' | 'sky' | 'intro' = 'sky';


    private treeModels: THREE.Group[] = [];
    private decorationModels: THREE.Group[] = [];
    private flowerModels: THREE.Group[] = [];
    private groundModel: THREE.Group | null = null;
    private rockModelBig: THREE.Group | null = null;
    private sharedTexture: THREE.Texture | null = null;

    private skyObstacleModels: THREE.Group[] = [];
    private skyDecoModels: THREE.Group[] = [];

    private tileSize: number = 0;
    private tileWidth: number = 0;

    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.00015);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 40000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        const appElement = document.getElementById('app');
        if (appElement) appElement.appendChild(this.renderer.domElement);

        this.initPlayer();
        this.createLights();
        this.loadNatureAssets().then(() => {
            return this.loadSkyAssets();
        }).then(() => {
            this.initEnvironment();
        }).catch(err => console.error("Error loading assets:", err));

        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('keydown', (e: KeyboardEvent) => this.onKeyDown(e));

        this.animate();
    }

    private async loadNatureAssets() {
        this.sharedTexture = await this.textureLoader.loadAsync('/nature/SimpleNature_Texture_01.png');

        const applyTexture = (object: THREE.Object3D) => {
            object.traverse((child: THREE.Object3D) => {
                if ((child as THREE.Mesh).isMesh) {
                    (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
                        map: this.sharedTexture,
                        roughness: 0.9,
                        metalness: 0.0
                    });
                }
            });
        };

        const propScale = 0.05;
        const groundScale = 4.0;

        for (let i = 1; i <= 5; i++) {
            const tree = await this.fbxLoader.loadAsync(`/nature/Tree_0${i}.fbx`);
            applyTexture(tree);
            tree.scale.set(propScale, propScale, propScale);
            this.treeModels.push(tree);
        }

        const decoFiles = [
            'Bush_01.fbx', 'Bush_02.fbx', 'Bush_03.fbx',
            'Rock_01.fbx', 'Rock_02.fbx', 'Rock_03.fbx', 'Rock_04.fbx', 'Rock_05.fbx',
            'Stump_01.fbx', 'Grass_01.fbx', 'Grass_02.fbx', 'Branch_01.fbx'
        ];

        for (const file of decoFiles) {
            try {
                const deco = await this.fbxLoader.loadAsync(`/nature/` + file);
                applyTexture(deco);
                deco.scale.set(propScale, propScale, propScale);
                this.decorationModels.push(deco);
                if (file === 'Rock_05.fbx') this.rockModelBig = deco;
            } catch (e) { }
        }

        const flowerFiles = ['Flowers_01.fbx', 'Flowers_02.fbx', 'Mushroom_01.fbx', 'Mushroom_02.fbx'];
        for (const file of flowerFiles) {
            try {
                const fl = await this.fbxLoader.loadAsync(`/nature/` + file);
                applyTexture(fl);
                fl.scale.set(propScale * 1.5, propScale * 1.5, propScale * 1.5);
                this.flowerModels.push(fl);
            } catch (e) { }
        }

        const ground = await this.fbxLoader.loadAsync('/nature/Ground_01.fbx');
        this.groundModel = ground;
        applyTexture(this.groundModel);
        this.groundModel.scale.set(groundScale, groundScale, groundScale);

        const box = new THREE.Box3().setFromObject(this.groundModel);
        this.tileSize = (box.max.z - box.min.z) * 0.85;
        this.tileWidth = (box.max.x - box.min.x) * 0.85;
    }

    private async loadSkyAssets() {
        const ensureMaterials = (object: THREE.Object3D) => {
            object.traverse((child: THREE.Object3D) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    if (!mesh.material || (Array.isArray(mesh.material) && mesh.material.length === 0)) {
                        mesh.material = new THREE.MeshStandardMaterial({
                            color: 0xff6b6b,
                            roughness: 0.5,
                            metalness: 0.2
                        });
                    }
                }
            });
        };

        try {
            const airplane = await this.gltfLoader.loadAsync('/Sky/airplane.glb');
            ensureMaterials(airplane.scene);
            airplane.scene.scale.set(0.008, 0.008, 0.008);
            this.skyObstacleModels.push(airplane.scene);
        } catch (e) { console.error('Failed to load airplane:', e); }

        try {
            const eagle = await this.gltfLoader.loadAsync('/Sky/eagle.glb');
            ensureMaterials(eagle.scene);
            eagle.scene.scale.set(0.01, 0.01, 0.01);
            this.skyDecoModels.push(eagle.scene);
        } catch (e) { console.error('Failed to load eagle:', e); }

        try {
            const balloon = await this.fbxLoader.loadAsync('/Sky/Hot_Air_Balloon_-_Low_Poly-0e6e0bb1/fbx/source/hot_air_balloon.fbx');
            balloon.traverse((child: THREE.Object3D) => {
                if ((child as THREE.Mesh).isMesh) {
                    (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
                        color: 0xff4444,
                        roughness: 0.6,
                        metalness: 0.1
                    });
                }
            });
            balloon.scale.set(0.008, 0.008, 0.008);
            this.skyDecoModels.push(balloon);
        } catch (e) { console.error('Failed to load balloon:', e); }

        try {
            const harrier = await this.gltfLoader.loadAsync('/Sky/Low_poly_AV-8B_Harrier_II-bd0a99d3/glb/converted/low_poly_av_8b_harrier_ii.glb');
            ensureMaterials(harrier.scene);
            harrier.scene.scale.set(0.015, 0.015, 0.015);
            this.skyObstacleModels.push(harrier.scene);
        } catch (e) { console.error('Failed to load harrier:', e); }
    }

    private initPlayer() {
        this.player.add(this.pigMesh);
        this.pigMesh.scale.set(2.0, 2.0, 2.0);
        this.refreshPlayerModel();

        this.scene.add(this.player);
        this.player.position.set(0, this.altitude, 0);
        this.camera.position.set(0, 10, -35);
        this.camera.lookAt(0, 2, 70);
        this.player.add(this.camera);
    }

    private refreshPlayerModel() {
        const pigData = localStorage.getItem('pigGameData');
        let pigModelPath = '/pig.glb';

        if (pigData) {
            try {
                const data = JSON.parse(pigData);
                const selectedPigId = data.selectedPig || 'basic';
                this.activePigId = selectedPigId;
                if (selectedPigId !== 'basic') {
                    pigModelPath = `/assets/3D_Models/Pigs/` + this.getPigFilenameById(selectedPigId);
                }
            } catch (e) {
                console.error('Error parsing pig game data:', e);
            }
        }

        this.gltfLoader.load(pigModelPath,
            (gltf: any) => {
                this.pigMesh.clear();
                const model = gltf.scene;
                const box = new THREE.Box3().setFromObject(model);
                const size = new THREE.Vector3();
                box.getSize(size);
                const center = new THREE.Vector3();
                box.getCenter(center);

                const wrapper = new THREE.Group();
                model.position.x = -center.x;
                model.position.y = -center.y;
                model.position.z = -center.z;
                wrapper.add(model);

                const maxDim = Math.max(size.x, size.y, size.z);
                const normalizedScale = 2.0 / (maxDim || 1.0);
                wrapper.scale.set(normalizedScale, normalizedScale, normalizedScale);

                this.pigMesh.add(wrapper);
                this.pigMesh.scale.set(2.0, 2.0, 2.0);
                this.loadAndAttachWings();
            },
            undefined,
            (error) => {
                console.error('Failed to load pig model, using fallback:', error);
                this.createProceduralPig();
            }
        );
    }

    private loadAndAttachWings() {
        if (this.wingMesh) {
            this.player.remove(this.wingMesh);
            this.wingMesh = null;
            this.wingMixer = null;
            this.leftWingPart = null;
            this.rightWingPart = null;
        }

        const gameData = localStorage.getItem('pigGameData');
        if (!gameData) return;

        try {
            const data = JSON.parse(gameData);
            const selectedWingId = data.selectedWing || 'none';
            this.activeWingId = selectedWingId;

            const wingMapping: { [key: string]: string } = {
                'demon': '/assets/3D_Models/Wings/demon_wings_1.1_low_poly_-_animated.glb',
                'angel_v1': '/assets/3D_Models/Wings/angel-wings.glb',
                'angel_v2': '/assets/3D_Models/Wings/angel_wings.glb',
                'angel_low': '/assets/3D_Models/Wings/angel_wings_low_poly.glb',
                'black': '/assets/3D_Models/Wings/black_wings.glb',
                'butterfly_v1': '/assets/3D_Models/Wings/butterfly_wings (1).glb',
                'butterfly_v2': '/assets/3D_Models/Wings/butterfly_wings (2).glb',
                'butterfly_v3': '/assets/3D_Models/Wings/butterfly_wings (3).glb',
                'butterfly_v4': '/assets/3D_Models/Wings/butterfly_wings (4).glb',
                'butterfly_v5': '/assets/3D_Models/Wings/butterfly_wings.glb',
                'butterfly_trans': '/assets/3D_Models/Wings/butterfly_wings_transperant.glb',
                'elytra': '/assets/3D_Models/Wings/minecraft_-_elytra.glb',
                'superman': '/assets/3D_Models/Wings/superman_cape.glb',
                'basic_wings': '/assets/3D_Models/Wings/wings.glb'
            };

            const wingPath = wingMapping[selectedWingId];
            if (!wingPath) return;

            this.gltfLoader.load(wingPath, (gltf: any) => {
                const wings = gltf.scene;
                this.wingMesh = new THREE.Group();

                const isButterfly = selectedWingId.includes('butterfly');
                wings.traverse((child: THREE.Object3D) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
                        if (isButterfly && m) {
                            m.transparent = true;
                            m.alphaTest = 0.5;
                            m.side = THREE.DoubleSide;
                        }
                    }
                });

                const wBox = new THREE.Box3().setFromObject(wings);
                const wSize = new THREE.Vector3();
                wBox.getSize(wSize);
                const wCenter = new THREE.Vector3();
                wBox.getCenter(wCenter);

                const wWrapper = new THREE.Group();
                wings.position.set(-wCenter.x, -wCenter.y, -wCenter.z);
                wWrapper.add(wings);

                const archetype = this.pigArchetypes[this.activePigId] || 'standard';
                const configGroup = this.wingConfigs[archetype] || this.wingConfigs['standard'];
                const customConfig = this.wingConfigs[this.activePigId]?.[this.activeWingId] ||
                    configGroup[this.activeWingId] ||
                    configGroup['default'];

                const baseScale = customConfig.scale || 5.0;
                const wMaxDim = Math.max(wSize.x, wSize.y, wSize.z);
                const normScale = baseScale / (wMaxDim || baseScale);
                wWrapper.scale.set(normScale, normScale, normScale);

                this.wingMesh.add(wWrapper);

                wings.traverse((child: THREE.Object3D) => {
                    const name = child.name.toLowerCase();
                    if (name.includes('left') || name.includes('_l')) {
                        if (!this.leftWingPart) this.leftWingPart = child;
                    }
                    if (name.includes('right') || name.includes('_r')) {
                        if (!this.rightWingPart) this.rightWingPart = child;
                    }
                });

                const finalX = customConfig.x || 0;
                const finalY = (customConfig.y !== undefined) ? customConfig.y : 0.9;
                const finalZ = (customConfig.z !== undefined) ? customConfig.z : -0.4;

                this.wingMesh.position.set(finalX, finalY, finalZ);
                this.player.add(this.wingMesh);

                if (gltf.animations && gltf.animations.length > 0) {
                    this.wingMixer = new THREE.AnimationMixer(wings);
                    const action = this.wingMixer.clipAction(gltf.animations[0]);
                    action.setEffectiveTimeScale(1.8);
                    action.play();
                }
            });
        } catch (e) {
            console.error('Error loading wings:', e);
        }
    }

    private getPigFilenameById(id: string): string {
        const mapping: { [key: string]: string } = {
            'cute_stylized': 'cute_stylized_pig_low_poly_game_ready.glb',
            'elegant': 'elegant_pig.glb', 'foreman': 'foreman_pig.glb', 'hamm': 'kingdom_hearts_iii_-_hamm.glb',
            'lowpoly': 'low-poly_pig.glb', 'minecraft': 'minecraft_-_pig.glb', 'king_pig': 'mobile_-_angry_birds_go_-_king_pig.glb',
            'waddles': 'mr_waddles_gravity_falls.glb', 'muddy': 'muddy_pig.glb', 'peppa': 'peppa_pig_with_2d_look.glb',
            'crown': 'pig_with_crown.glb', 'piglet': 'piglet.glb', 'porky': 'porky_pig.glb', 'pumba': 'pumba.glb'
        };
        return mapping[id] || 'pig.glb';
    }

    private createProceduralPig() {
        const pigMat = new THREE.MeshStandardMaterial({ color: 0xffadc7 });
        this.pigMesh.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.2), pigMat));
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.5), pigMat);
        head.position.set(0, 0.1, 0.7);
        this.pigMesh.add(head);
        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.1), new THREE.MeshStandardMaterial({ color: 0xff8da1 }));
        snout.position.set(0, 0, 0.3);
        head.add(snout);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), eyeMat);
        eyeL.position.set(-0.15, 0.1, 0.26); head.add(eyeL);
        const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), eyeMat);
        eyeR.position.set(0.15, 0.1, 0.26); head.add(eyeR);
        const legGeo = new THREE.BoxGeometry(0.15, 0.3, 0.15);
        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(legGeo, pigMat);
            leg.position.set(i < 2 ? -0.25 : 0.25, -0.35, i % 2 === 0 ? 0.4 : -0.4);
            this.pigMesh.add(leg);
        }
    }

    private createLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
        const sun = new THREE.DirectionalLight(0xffffff, 1.4);
        sun.position.set(1000, 2000, 1000);
        this.scene.add(sun);
    }

    private initEnvironment() {
        if (this.currentBiom === 'sky') {
            for (let i = 0; i < 40; i++) this.createCloud(i * 350);
            return;
        }

        if (!this.groundModel) return;
        const gridZ = 15; const gridX = 5;
        for (let z = 0; z < gridZ; z++) {
            for (let x = -Math.floor(gridX / 2); x <= Math.floor(gridX / 2); x++) {
                this.spawnGroundSegment(x * this.tileWidth, z * this.tileSize);
            }
        }
        for (let i = 0; i < 40; i++) this.createCloud(i * 350);
    }

    private spawnGroundSegment(x: number, z: number) {
        if (!this.groundModel) return;
        const segment = this.groundModel.clone();
        segment.position.set(x, 0, z);
        this.scene.add(segment);
        this.grounds.push(segment);

        const density = 5;
        for (let i = 0; i < density; i++) this.spawnDecoration(x, z);
        if (x === 0) {
            this.spawnPathBorder(this.laneWidth * 1.5, z);
            this.spawnPathBorder(-this.laneWidth * 1.5, z);
        }
        if (Math.abs(x) >= this.tileWidth * 2) this.spawnMountain(x, z);
    }

    private spawnPathBorder(x: number, z: number) {
        if (this.flowerModels.length === 0) return;
        const fl = this.flowerModels[Math.floor(Math.random() * this.flowerModels.length)].clone();
        fl.position.set(x + (Math.random() - 0.5) * 1, 0, z + (Math.random() - 0.5) * this.tileSize);
        fl.rotation.y = Math.random() * Math.PI;
        this.scene.add(fl); this.decorations.push(fl);
    }

    private spawnMountain(x: number, z: number) {
        if (!this.rockModelBig) return;
        const mount = this.rockModelBig.clone();
        const side = x > 0 ? 1 : -1;
        mount.position.set(x + side * (Math.random() * 50 + 50), 0, z + (Math.random() - 0.5) * this.tileSize);
        mount.scale.multiplyScalar(Math.random() * 15 + 15);
        mount.rotation.y = Math.random() * Math.PI;
        this.scene.add(mount); this.decorations.push(mount);
    }

    private spawnDecoration(centerX: number, centerZ: number) {
        if (this.decorationModels.length === 0) return;
        const models = [...this.decorationModels, ...this.treeModels];
        const deco = models[Math.floor(Math.random() * models.length)].clone();
        const decoX = centerX + (Math.random() - 0.5) * this.tileWidth;
        const decoZ = centerZ + (Math.random() - 0.5) * this.tileSize;
        if (Math.abs(decoX) < this.laneWidth * 1.4) return;
        deco.position.set(decoX, 0, decoZ);
        deco.rotation.y = Math.random() * Math.PI * 2;
        deco.scale.multiplyScalar(0.8 + Math.random() * 0.5);
        this.scene.add(deco); this.decorations.push(deco);
    }

    private spawnObstacle() {
        if (!this.gameActive || this.isIntro) return;
        if (this.currentBiom === 'sky') {
            if (this.skyObstacleModels.length === 0) return;
            const lane = (Math.floor(Math.random() * 3) - 1) * this.laneWidth;
            const obstacle = this.skyObstacleModels[Math.floor(Math.random() * this.skyObstacleModels.length)].clone();
            obstacle.position.set(lane, Math.random() * 10 - 5, this.player.position.z + 550);
            obstacle.rotation.y = Math.random() * Math.PI * 2;
            this.scene.add(obstacle); this.obstacles.push(obstacle);
        } else {
            if (this.treeModels.length === 0) return;
            const lane = (Math.floor(Math.random() * 3) - 1) * this.laneWidth;
            const tree = this.treeModels[Math.floor(Math.random() * this.treeModels.length)].clone();
            tree.position.set(lane, 0, this.player.position.z + 550);
            tree.rotation.y = Math.random() * Math.PI * 2;
            tree.scale.multiplyScalar(1.2);
            this.scene.add(tree); this.obstacles.push(tree);
        }
    }

    private spawnSkyDecoration() {
        if (this.skyDecoModels.length === 0) return;
        const deco = this.skyDecoModels[Math.floor(Math.random() * this.skyDecoModels.length)].clone();
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = Math.random() * 30 - 10;
        deco.position.set(offsetX, offsetY, this.player.position.z + 400 + Math.random() * 200);
        deco.rotation.y = Math.random() * Math.PI * 2;
        this.scene.add(deco); this.decorations.push(deco);
    }

    private createCloud(z: number, isPortal: boolean = false) {
        const group = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: isPortal ? 0.9 : 0.4 });
        const count = isPortal ? 30 : 10;
        const range = isPortal ? 300 : 200;
        for (let i = 0; i < count; i++) {
            const geo = new THREE.SphereGeometry(Math.random() * (isPortal ? 80 : 40) + 20, 6, 6);
            const part = new THREE.Mesh(geo, mat);
            part.position.set((Math.random() - 0.5) * range, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * range);
            group.add(part);
        }
        const spread = isPortal ? 100 : 5000;
        group.position.set((Math.random() - 0.5) * spread, isPortal ? this.altitude : this.altitude + 300 + Math.random() * 400, z);
        this.scene.add(group); this.clouds.push(group);
    }

    private onKeyDown(e: KeyboardEvent) {
        if (!this.gameActive && (e.code === 'Space' || e.code === 'Enter')) {
            this.startGame(); return;
        }
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.currentLane = Math.min(1, this.currentLane + 1);
        else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.currentLane = Math.max(-1, this.currentLane - 1);
        this.targetX = this.currentLane * this.laneWidth;
    }

    private startGame() {
        this.refreshPlayerModel();
        this.gameActive = true;
        this.isIntro = true;
        this.introPhase = 'diving';
        this.score = 0;
        this.distance = 0;
        this.speed = 0.8;
        this.altitude = 150.0;
        this.currentBiom = 'intro';

        this.player.position.set(0, this.altitude, 0);
        this.currentLane = 0;
        this.targetX = 0;

        this.obstacles.forEach(o => this.scene.remove(o));
        this.decorations.forEach(d => this.scene.remove(d));
        this.grounds.forEach(g => this.scene.remove(g));
        this.clouds.forEach(c => this.scene.remove(c));

        this.obstacles = []; this.decorations = []; this.grounds = []; this.clouds = [];

        this.scene.background = new THREE.Color(0xa6d0ff);
        this.scene.fog = new THREE.FogExp2(0xa6d0ff, 0.0001);


        for (let i = 0; i < 40; i++) {
            this.createCloud(400 + (Math.random() * 400), true);
        }

        for (let i = 0; i < 10; i++) this.createCloud(i * 50);

        const hud = document.getElementById('hud'); if (hud) hud.classList.remove('hidden');
        const appView = document.getElementById('app'); if (appView) appView.style.visibility = 'visible';
    }


    private gameOver(): void {
        this.gameActive = false;
        const gameOverElement = document.getElementById('game-over');
        if (gameOverElement) gameOverElement.classList.remove('hidden');
        const finalScoreElem = document.getElementById('final-score');
        if (finalScoreElem) finalScoreElem.textContent = `FINAL SCORE: ${Math.floor(this.score)}`;
        if (window.menuManager) window.menuManager.updateGameStats(this.score, this.distance);
        setTimeout(() => {
            if (gameOverElement) gameOverElement.classList.add('hidden');
            if (window.menuAnimation) window.menuAnimation.showMenu();
        }, 2000);
    }

    private onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private switchToNatureBiom() {
        this.currentBiom = 'clouds';
        this.scene.background = new THREE.Color(0x6db9ff);
        this.scene.fog = new THREE.FogExp2(0x6db9ff, 0.00008);
        if (this.grounds.length === 0) {
            this.initEnvironment();
        }
        this.isIntro = false;
        this.introPhase = 'done';
    }


    private animate() {
        requestAnimationFrame(() => this.animate());
        const delta = this.wingClock.getDelta();
        const t = performance.now() * 0.001;

        if (this.wingMesh && this.activeWingId !== 'none') {
            const isGlider = (this.activeWingId === 'superman' || this.activeWingId === 'elytra');
            if (isGlider) {
                this.wingMesh.rotation.x = Math.sin(t * 15) * 0.02;
            } else {
                const lift = Math.sin(t * 6) * 0.15;
                const archetype = this.pigArchetypes[this.activePigId] || 'standard';
                const configGroup = this.wingConfigs[archetype] || this.wingConfigs['standard'];
                const customConfig = this.wingConfigs[this.activePigId]?.[this.activeWingId] || configGroup[this.activeWingId] || configGroup['default'];
                const baseAnchorY = (customConfig.y !== undefined) ? customConfig.y : 0.9;

                this.wingMesh.position.y = baseAnchorY + lift;
                const flapCycle = Math.sin(t * 8);
                const flapAngle = 0.6 + (flapCycle * 0.4);
                if (this.leftWingPart && this.rightWingPart) {
                    this.leftWingPart.rotation.z = flapAngle;
                    this.rightWingPart.rotation.z = -flapAngle;
                } else {
                    this.wingMesh.rotation.x = Math.sin(t * 8) * 0.15;
                }
            }
        }
        if (this.wingMixer) this.wingMixer.update(delta);

        if (this.gameActive) {

            if (this.isIntro) {
                if (this.player.position.z < 350) {

                    this.altitude = 150.0;
                    this.pigMesh.rotation.x = 0;


                    if (this.player.position.z > 250 && this.grounds.length === 0) {
                        this.initEnvironment();
                    }
                } else if (this.altitude > 8.5) {

                    this.altitude -= 1.5;
                    this.pigMesh.rotation.x = 0.4;
                } else {

                    this.altitude = 8.5;
                    this.pigMesh.rotation.x *= 0.9;
                    if (this.player.position.z > 700) {
                        this.switchToNatureBiom();
                    }
                }
            }

            if (this.currentBiom === 'clouds' && this.score >= 5000) {
                this.currentBiom = 'sky';
            }

            this.player.position.y = this.altitude;
            this.player.position.z += this.speed;
            this.distance = this.player.position.z;
            if (!this.isIntro) {
                this.score += 0.1;
                this.speed += 0.0001;
            }
            this.player.position.x += (this.targetX - this.player.position.x) * 0.1;

            const scoreElem = document.getElementById('score');
            const distElem = document.getElementById('distance');
            if (scoreElem) scoreElem.innerText = `SCORE: ${Math.floor(this.score).toString().padStart(5, '0')}`;
            if (distElem) distElem.innerText = `DIST: ${Math.floor(this.distance)}m`;

            if (this.currentBiom === 'clouds') {
                const gridWidth = 5;
                this.grounds.sort((a: THREE.Group, b: THREE.Group) => a.position.z - b.position.z);
                while (this.grounds.length > 0 && this.grounds[0].position.z < this.player.position.z - this.tileSize * 2.0) {
                    const batch = this.grounds.splice(0, gridWidth);
                    const lastZ = this.grounds[this.grounds.length - 1].position.z;
                    batch.forEach(g => {
                        g.position.z = lastZ + this.tileSize;
                        this.grounds.push(g);
                        for (let i = 0; i < 4; i++) this.spawnDecoration(g.position.x, g.position.z);
                        if (g.position.x === 0) {
                            this.spawnPathBorder(this.laneWidth * 1.5, g.position.z);
                            this.spawnPathBorder(-this.laneWidth * 1.5, g.position.z);
                        }
                        if (Math.abs(g.position.x) >= this.tileWidth * 2) this.spawnMountain(g.position.x, g.position.z);
                    });
                }
            }

            for (let i = this.decorations.length - 1; i >= 0; i--) {
                if (this.decorations[i].position.z < this.player.position.z - 200) {
                    this.scene.remove(this.decorations[i]); this.decorations.splice(i, 1);
                }
            }
            this.clouds.forEach(cloud => {
                if (cloud.position.z < this.player.position.z - 1000) {
                    cloud.position.z += 10000;
                }
            });

            if (Math.random() < 0.012) this.spawnObstacle();

            if (!this.isIntro) {
                const pBox = new THREE.Box3().setFromObject(this.pigMesh);
                pBox.expandByScalar(-0.3);
                for (let i = this.obstacles.length - 1; i >= 0; i--) {
                    const obs = this.obstacles[i];
                    let oBox: THREE.Box3;
                    if (this.currentBiom === 'sky') {
                        oBox = new THREE.Box3().setFromObject(obs);
                        oBox.expandByScalar(-2.5);
                    } else {
                        const trunkCenter = new THREE.Vector3();
                        obs.getWorldPosition(trunkCenter);
                        const trunkRadius = 1.2;
                        oBox = new THREE.Box3(
                            new THREE.Vector3(trunkCenter.x - trunkRadius, 0, trunkCenter.z - trunkRadius),
                            new THREE.Vector3(trunkCenter.x + trunkRadius, 1000, trunkCenter.z + trunkRadius)
                        );
                    }
                    if (pBox.intersectsBox(oBox)) this.gameOver();
                    if (obs.position.z < this.player.position.z - 200) {
                        this.scene.remove(obs); this.obstacles.splice(i, 1);
                    }
                }
            }
        }
        this.renderer.render(this.scene, this.camera);
    }
}
