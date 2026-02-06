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
    private decorations: THREE.Object3D[] = [];
    private clouds: THREE.Group[] = [];
    private grounds: THREE.Group[] = [];

    private wingMesh: THREE.Group | null = null;
    private wingMixer: THREE.AnimationMixer | null = null;
    private wingClock: THREE.Clock = new THREE.Clock();
    private activeWingId: string = 'none';
    private activePigId: string = 'basic';
    private leftWingPart: THREE.Object3D | null = null;
    private rightWingPart: THREE.Object3D | null = null;
    private objectMixers: THREE.AnimationMixer[] = [];

    private isIntro: boolean = false;
    private altitude: number = 8.0;
    private laneWidth: number = 7.0;
    private cityLaneWidth: number = 9.5;
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
    private gltfLoader: GLTFLoader = new GLTFLoader();
    private fbxLoader: FBXLoader = new FBXLoader();
    private textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
    private currentBiom: 'clouds' | 'sky' | 'city' | 'desert' | 'nature' | 'intro' | 'transitioning_to_sky' | 'transitioning_to_city' | 'transitioning_to_desert' = 'sky';

    private treeModels: THREE.Group[] = [];
    private decorationModels: THREE.Group[] = [];
    private flowerModels: THREE.Group[] = [];
    private groundModel: THREE.Group | null = null;
    private rockModelBig: THREE.Group | null = null;
    private sharedTexture: THREE.Texture | null = null;

    private skyObstacleModels: THREE.Group[] = [];
    private skyDecorationModels: THREE.Group[] = [];
    private skyModelAnimations: Map<string, THREE.AnimationClip[]> = new Map();
    private skyModelScale: number = 0.015;
    private skyScaleOverrides: Record<string, number> = {
        airplane: 0.008,
        harrier: 0.008,
        c17_plane: 0.25,
        balloon: 0.015,
        balloon_glb_1: 0.06,
        balloon_glb_2: 5.56,
        balloon_glb_pack: 0.36
    };
    private skyObstacleLastZ: number = -Infinity;

    private cityGroundModels: THREE.Group[] = [];
    private cityMainRoadModels: THREE.Group[] = [];
    private citySideGroundModels: THREE.Group[] = [];
    private cityObstacleModels: THREE.Group[] = [];
    private cityDecorationModels: THREE.Group[] = [];
    private cityEdgeDecorationModels: THREE.Group[] = [];
    private cityLaneLastCarZ: number[] = [-Infinity, -Infinity, -Infinity];
    private cityRockLastZ: number[] = [-Infinity, -Infinity];
    private cityRockMaterial: THREE.MeshLambertMaterial | null = null;

    private desertGroundModels: THREE.Group[] = [];
    private desertObstacleModels: THREE.Group[] = [];
    private desertDecorationModels: THREE.Group[] = [];
    private desertBorderModels: THREE.Group[] = [];
    private desertBorderLastZ: number[] = [-Infinity, -Infinity];
    private desertGroundTemplate: THREE.Group | null = null;
    private desertObstacleLastZ: number[] = [-Infinity, -Infinity, -Infinity];
    private desertPyramidGeo: THREE.CylinderGeometry | null = null;
    private desertPyramidMat: THREE.MeshStandardMaterial | null = null;
    private desertRockMaterial: THREE.MeshLambertMaterial | null = null;

    private skyCloudPartGeo: THREE.SphereGeometry | null = null;
    private skyCloudMat: THREE.MeshBasicMaterial | null = null;

    private tileSize: number = 0;
    private tileWidth: number = 0;
    private transitionStartZ: number = 0;
    private targetAltitude: number = 8.5;

    private isMouseDown: boolean = false;
    private isShiftPressed: boolean = false;
    private isPPressed: boolean = false;
    private isPaused: boolean = false;
    private rotationAngle: number = 0;
    private mousePosition: { x: number, y: number } = { x: 0, y: 0 };
    private cameraOriginalY: number = 10;
    private isRotating: boolean = false;
    private rotationProgress: number = 0;
    private rotationDuration: number = 2;

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
            return this.loadCityAssets();
        }).then(() => {
            return this.loadDesertAssets();
        }).then(() => {
            this.initEnvironment();
        }).catch(err => console.error("Error loading assets:", err));

        this.setupControls();
        this.animate();
    }

    private setupControls() {
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('keydown', (e: KeyboardEvent) => this.onKeyDown(e));
        window.addEventListener('keyup', (e: KeyboardEvent) => this.onKeyUp(e));

        this.renderer.domElement.addEventListener('mousedown', (e: MouseEvent) => this.onMouseDown(e));
        this.renderer.domElement.addEventListener('mousemove', (e: MouseEvent) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('mouseup', () => this.onMouseUp());
        this.renderer.domElement.addEventListener('mouseleave', () => this.onMouseUp());
    }

    private onMouseDown(e: MouseEvent) {
        if (e.button === 0) {
            this.isMouseDown = true;
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
        }
    }

    private onMouseMove(e: MouseEvent) {
        if (this.isMouseDown && this.gameActive && !this.isPaused) {
            const deltaY = e.clientY - this.mousePosition.y;
            this.cameraOriginalY += deltaY * 0.01;
            this.cameraOriginalY = Math.max(5, Math.min(20, this.cameraOriginalY));
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
        }
    }

    private onMouseUp() {
        this.isMouseDown = false;
    }

    private onKeyDown(e: KeyboardEvent) {
        if (e.code === 'KeyP') {
            if (!this.isPPressed) {
                this.isPPressed = true;
                this.togglePause();
            }
            return;
        }

        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            if (!this.isShiftPressed && !this.isRotating && this.gameActive && !this.isPaused) {
                this.isShiftPressed = true;
                this.isRotating = true;
                this.rotationProgress = 0;
                this.rotationAngle = 0;
            }
            return;
        }

        if (this.isPaused) return;

        if (!this.gameActive && (e.code === 'Space' || e.code === 'Enter')) {
            this.startGame();
            return;
        }

        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.currentLane = Math.min(1, this.currentLane + 1);
        else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.currentLane = Math.max(-1, this.currentLane - 1);

        const laneWidth = (this.currentBiom === 'city') ? this.cityLaneWidth : this.laneWidth;
        this.targetX = this.currentLane * laneWidth;
    }

    private onKeyUp(e: KeyboardEvent) {
        if (e.code === 'KeyP') {
            this.isPPressed = false;
        } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            this.isShiftPressed = false;
        }
    }

    private togglePause() {
        if (!this.gameActive) return;

        this.isPaused = !this.isPaused;

        const pauseElement = document.getElementById('pause');
        if (pauseElement) {
            if (this.isPaused) {
                pauseElement.classList.remove('hidden');
            } else {
                pauseElement.classList.add('hidden');
            }
        }
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
        const getSkyScale = (name: string) => this.skyScaleOverrides[name] ?? this.skyModelScale;

        try {
            const airplane = await this.gltfLoader.loadAsync('/assets/3D_Models/Bioms/Sky/airplane.glb');
            ensureMaterials(airplane.scene);
            const s = getSkyScale('airplane');
            airplane.scene.scale.set(s, s, s);
            airplane.scene.rotateY(Math.PI + 2.4);
            airplane.scene.name = 'airplane';
            this.skyObstacleModels.push(airplane.scene);
            if (airplane.animations) this.skyModelAnimations.set('airplane', airplane.animations);
        } catch (e) { console.error('Failed to load airplane:', e); }

        try {
            const c17 = await this.gltfLoader.loadAsync('/assets/3D_Models/Bioms/Sky/c17_plane_game-ready.glb');
            ensureMaterials(c17.scene);
            const s = getSkyScale('c17_plane');
            c17.scene.scale.set(s, s, s);
            c17.scene.name = 'c17_plane';
            this.skyObstacleModels.push(c17.scene);
            if (c17.animations) this.skyModelAnimations.set('c17_plane', c17.animations);
        } catch (e) { console.error('Failed to load c17_plane_game-ready.glb:', e); }

        try {
            const eagle = await this.gltfLoader.loadAsync('/assets/3D_Models/Bioms/Sky/eagle.glb');
            ensureMaterials(eagle.scene);
            const s = getSkyScale('eagle');
            eagle.scene.scale.set(s, s, s);
            eagle.scene.name = 'eagle';
            this.skyObstacleModels.push(eagle.scene);
            this.skyDecorationModels.push(eagle.scene);
            if (eagle.animations) this.skyModelAnimations.set('eagle', eagle.animations);
        } catch (e) { console.error('Failed to load eagle:', e); }

        try {
            const balloon = await this.fbxLoader.loadAsync('/assets/3D_Models/Bioms/Sky/Hot_Air_Balloon_-_Low_Poly-0e6e0bb1/fbx/source/hot_air_balloon.fbx');
            balloon.traverse((child: THREE.Object3D) => {
                if ((child as THREE.Mesh).isMesh) {
                    (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
                        color: 0xff4444,
                        roughness: 0.6,
                        metalness: 0.1
                    });
                }
            });
            const s = getSkyScale('balloon');
            balloon.scale.set(s, s, s);
            balloon.name = 'balloon';
            this.skyObstacleModels.push(balloon);
            this.skyDecorationModels.push(balloon);

            if (balloon.animations) this.skyModelAnimations.set('balloon', balloon.animations);
        } catch (e) { console.error('Failed to load balloon:', e); }

        const balloonPalette = [0xff4444, 0xffa8c8, 0xffd7a8, 0xbfe7ff, 0xd6f5c7, 0xa8f0ff, 0xffcf5c];
        const tintBalloon = (root: THREE.Object3D) => {
            root.traverse((child: THREE.Object3D) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    const applyColor = (mat: any) => {
                        if (mat && mat.color) mat.color.setHex(balloonPalette[Math.floor(Math.random() * balloonPalette.length)]);
                    };
                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach(applyColor);
                    } else {
                        applyColor(mesh.material as any);
                    }
                }
            });
        };

        const loadBalloonGlb = async (path: string, name: string) => {
            try {
                const gltf = await this.gltfLoader.loadAsync(path);
                ensureMaterials(gltf.scene);
                const s = getSkyScale(name);
                gltf.scene.scale.set(s, s, s);
                gltf.scene.name = name;
                tintBalloon(gltf.scene);
                this.skyObstacleModels.push(gltf.scene);
                this.skyDecorationModels.push(gltf.scene);
                if (gltf.animations) this.skyModelAnimations.set(name, gltf.animations);
            } catch (e) { console.error(`Failed to load ${path}:`, e); }
        };

        await loadBalloonGlb('/assets/3D_Models/Bioms/Sky/hot_air_balloon.glb', 'balloon_glb_1');
        await loadBalloonGlb('/assets/3D_Models/Bioms/Sky/indian_smile_balloon.glb', 'balloon_glb_2');
        await loadBalloonGlb('/assets/3D_Models/Bioms/Sky/ballons_new.glb', 'balloon_glb_pack');

        try {
            const harrier = await this.gltfLoader.loadAsync('/assets/3D_Models/Bioms/Sky/Low_poly_AV-8B_Harrier_II-bd0a99d3/glb/converted/low_poly_av_8b_harrier_ii.glb');
            ensureMaterials(harrier.scene);
            const s = getSkyScale('harrier');
            harrier.scene.scale.set(s, s, s);
            harrier.scene.name = 'harrier';
            this.skyObstacleModels.push(harrier.scene);
            if (harrier.animations) this.skyModelAnimations.set('harrier', harrier.animations);
        } catch (e) { console.error('Failed to load harrier:', e); }
    }

    private async loadCityAssets() {
        const cityPath = '/assets/3D_Models/Bioms/City/fbx/Separate_assets_fbx_extracted/Separate_assets_fbx/';
        const ensureMaterials = (object: THREE.Object3D, color: number = 0x888888) => {
            object.traverse((child: THREE.Object3D) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    if (!mesh.material || (Array.isArray(mesh.material) && mesh.material.length === 0)) {
                        mesh.material = new THREE.MeshStandardMaterial({
                            color: color,
                            roughness: 0.7,
                            metalness: 0.2
                        });
                    }
                }
            });
        };

        const normalizeCityGroundTile = (tile: THREE.Group) => {
            if (this.tileWidth <= 0 || this.tileSize <= 0) return;

            const preBox = new THREE.Box3().setFromObject(tile);
            const size = new THREE.Vector3();
            preBox.getSize(size);
            if (size.x <= 0.0001 || size.z <= 0.0001) return;

            const sx = this.tileWidth / size.x;
            const sz = this.tileSize / size.z;
            const sy = Math.min(sx, sz);
            tile.scale.set(tile.scale.x * sx, tile.scale.y * sy, tile.scale.z * sz);

            const box = new THREE.Box3().setFromObject(tile);
            const center = new THREE.Vector3();
            box.getCenter(center);
            tile.position.x -= center.x;
            tile.position.z -= center.z;
            tile.position.y -= box.min.y;
        };

        const carFiles = ['Car_06.fbx', 'Car_13.fbx', 'Car_16.fbx', 'Car_19.fbx', 'Futuristic_Car_1.fbx', 'Van.fbx'];
        for (const file of carFiles) {
            try {
                const car = await this.fbxLoader.loadAsync(cityPath + file);
                ensureMaterials(car, 0xffffff);
                car.scale.set(4.3, 4.3, 4.3);
                car.name = 'city_car';
                this.cityObstacleModels.push(car);
            } catch (e) { console.error(`Failed to load ${file}:`, e); }
        }

        const buildingFiles = [
            'Eco_Building_Grid.fbx', 'Eco_Building_Slope.fbx', 'Eco_Building_Terrace.fbx',
            'Regular_Building_TwistedTower_Large.fbx',
            'Bus_Stop_02.fbx',
            'Fountain_03.fbx',
            'Signboard_01.fbx',
            'Trash_Can_04.fbx', 'Trash_Can_05.fbx',
            'Bush_06.fbx', 'Bush_07.fbx', 'Bush_10.fbx', 'Palm_03.fbx',
            'Graffiti_03.fbx',
            'Spotlight_01.fbx', 'Spotlight_02.fbx'
        ];

        for (const file of buildingFiles) {
            try {
                const bld = await this.fbxLoader.loadAsync(cityPath + file);
                ensureMaterials(bld, 0xaaaaaa);

                if (file.includes('Trash') || file.includes('traffic') || file.includes('Sign')) {
                    bld.scale.set(0.95, 0.95, 0.95);
                } else if (file.includes('Bush') || file.includes('Palm')) {
                    bld.scale.set(1.55, 1.55, 1.55);
                } else if (file === 'Bus_Stop_02.fbx') {
                    bld.scale.set(1.15, 1.15, 1.15);
                } else {
                    bld.scale.set(1.5, 1.5, 1.5);
                }

                bld.name = file;
                this.cityDecorationModels.push(bld);

                if (file.includes('Bush') || file.includes('Palm') || file.includes('Graffiti') || file.includes('Spotlight')) {
                    this.cityEdgeDecorationModels.push(bld);
                }
            } catch (e) { console.error(`Failed to load ${file}:`, e); }
        }

        const mainRoadFiles = ['road_001.fbx'];
        const sideRoadFiles = ['road_013.fbx', 'road_019.fbx', 'road_020.fbx', 'road_022.fbx'];
        const sideTileFiles = ['Set_B_Tiles_01.fbx', 'Set_B_Tiles_04.fbx', 'Set_B_Tiles_05.fbx', 'Set_B_Tiles_06.fbx', 'Set_B_Tiles_09.fbx'];

        const loadCityGround = async (file: string, fallbackColor: number, target: THREE.Group[]) => {
            try {
                const tile = await this.fbxLoader.loadAsync(cityPath + file);
                ensureMaterials(tile, fallbackColor);
                normalizeCityGroundTile(tile);
                tile.name = file;
                target.push(tile);
                this.cityGroundModels.push(tile);
            } catch (e) { console.error(`Failed to load ${file}:`, e); }
        };

        for (const file of mainRoadFiles) await loadCityGround(file, 0x444444, this.cityMainRoadModels);
        for (const file of sideRoadFiles) await loadCityGround(file, 0x444444, this.citySideGroundModels);
        for (const file of sideTileFiles) await loadCityGround(file, 0x4f8a5b, this.citySideGroundModels);
    }

    private async loadDesertAssets() {
        this.desertDecorationModels = [];
        this.desertObstacleModels = [];
        this.desertBorderModels = [];

        const desertGlbFiles = [
            '/assets/3D_Models/Bioms/Desert/cactus.glb',
            '/assets/3D_Models/Bioms/Desert/stylized_cactus.glb',
            '/assets/3D_Models/Bioms/Desert/desert_plant.glb',
            '/assets/3D_Models/Bioms/Desert/desert_plants.glb',
            '/assets/3D_Models/Bioms/Desert/desert_rocks.glb',
            '/assets/3D_Models/Bioms/Desert/desert_rocks (1).glb'
        ];
        const desertTextureBase = '/assets/3D_Models/Bioms/Desert/TEXTURES/EGYPTIAN FLOOR ENTRANCE.fbm/entrada piso_DefaultMaterial_BaseColor.png';
        const desertTextureNormal = '/assets/3D_Models/Bioms/Desert/TEXTURES/EGYPTIAN FLOOR ENTRANCE.fbm/entrada piso_DefaultMaterial_Normal.png';
        const desertTextureRough = '/assets/3D_Models/Bioms/Desert/TEXTURES/EGYPTIAN FLOOR ENTRANCE.fbm/entrada piso_DefaultMaterial_Roughness.png';
        const desertTextureMetal = '/assets/3D_Models/Bioms/Desert/TEXTURES/EGYPTIAN FLOOR ENTRANCE.fbm/entrada piso_DefaultMaterial_Metallic.png';

        const ensureMaterials = (object: THREE.Object3D, color: number = 0xd9b37c) => {
            object.traverse((child: THREE.Object3D) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    if (!mesh.material || (Array.isArray(mesh.material) && mesh.material.length === 0)) {
                        mesh.material = new THREE.MeshStandardMaterial({
                            color: color,
                            roughness: 0.9,
                            metalness: 0.0
                        });
                    }
                }
            });
        };

        const [map, normalMap, roughnessMap, metalnessMap] = await Promise.all([
            this.textureLoader.loadAsync(encodeURI(desertTextureBase)),
            this.textureLoader.loadAsync(encodeURI(desertTextureNormal)),
            this.textureLoader.loadAsync(encodeURI(desertTextureRough)),
            this.textureLoader.loadAsync(encodeURI(desertTextureMetal))
        ]);
        map.colorSpace = THREE.SRGBColorSpace;
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.repeat.set(10, 10);
        map.needsUpdate = true;

        if (this.groundModel) {
            const template = this.groundModel.clone();
            template.traverse((child: THREE.Object3D) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    mesh.material = new THREE.MeshStandardMaterial({
                        color: 0xe9c46a,
                        roughness: 0.95,
                        metalness: 0.0
                    });
                }
            });
            template.scale.x *= 2.8;
            template.scale.z *= 1.1;
            template.scale.y *= 1.6;
            template.position.y -= 2.5;
            this.desertGroundTemplate = template;
        }

        const normalizeToSize = (object: THREE.Object3D, target: number) => {
            const box = new THREE.Box3().setFromObject(object);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 0) {
                const scale = target / maxDim;
                object.scale.set(scale, scale, scale);
            }
            const center = new THREE.Vector3();
            box.getCenter(center);
            object.position.x -= center.x;
            object.position.y -= center.y;
            object.position.z -= center.z;
        };

        const targetSize = 13;
        let index = 0;
        for (const path of desertGlbFiles) {
            try {
                const gltf = await this.gltfLoader.loadAsync(encodeURI(path));
                ensureMaterials(gltf.scene, 0xd9b37c);
                const model = gltf.scene.clone(true);
                normalizeToSize(model, targetSize);
                const fileName = path.split('/').pop()?.replace('.glb', '') || `desert_${index}`;
                model.name = `desert_${fileName}`;
                if (fileName.toLowerCase().includes('desert_plant')) {
                    model.traverse((child: THREE.Object3D) => {
                        if ((child as THREE.Mesh).isMesh) {
                            const mesh = child as THREE.Mesh;
                            const applyGreen = (mat: any) => {
                                if (!mat) return;
                                if (mat.color) mat.color.setHex(0x6fbf4a);
                                if ('roughness' in mat) mat.roughness = 0.9;
                                if ('metalness' in mat) mat.metalness = 0.0;
                                mat.needsUpdate = true;
                            };
                            if (Array.isArray(mesh.material)) mesh.material.forEach(applyGreen);
                            else applyGreen(mesh.material as any);
                        }
                    });
                }
                model.userData.isDesert = true;
                this.desertDecorationModels.push(model);
                const lower = fileName.toLowerCase();
                if (lower.includes('rock') || lower.includes('cactus')) {
                    this.desertObstacleModels.push(model);
                }
                index++;
            } catch (e) { console.error(`Failed to load desert GLB: ${path}`, e); }
        }
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
            for (let i = 0; i < 60; i++) this.createCloud(i * 300);
        }

        const gridZ = 15;
        const gridX = (this.currentBiom === 'desert') ? 13 : 5;
        for (let z = 0; z < gridZ; z++) {
            for (let x = -Math.floor(gridX / 2); x <= Math.floor(gridX / 2); x++) {
                this.spawnGroundSegment(x * this.tileWidth, z * this.tileSize);
            }
        }
        if (this.currentBiom === 'clouds') {
            for (let i = 0; i < 40; i++) this.createCloud(i * 350);
        }
    }

    private createSkyCloudSegment(isEdge: boolean, side: number): THREE.Group {
        if (!this.skyCloudPartGeo) this.skyCloudPartGeo = new THREE.SphereGeometry(1, 7, 7);
        if (!this.skyCloudMat) this.skyCloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });

        const group = new THREE.Group();
        group.name = 'sky_cloud_segment';

        const floorY = this.altitude - 62;
        const puffCount = 18;
        for (let i = 0; i < puffCount; i++) {
            const puff = new THREE.Mesh(this.skyCloudPartGeo, this.skyCloudMat);
            const px = (Math.random() - 0.5) * this.tileWidth * 1.05;
            const pz = (Math.random() - 0.5) * this.tileSize * 1.05;
            const py = floorY + (Math.random() - 0.5) * 2.0;
            puff.position.set(px, py, pz);
            puff.scale.setScalar(20 + Math.random() * 40);
            group.add(puff);
        }

        if (isEdge) {
            const edgeCount = 16;
            for (let i = 0; i < edgeCount; i++) {
                const puff = new THREE.Mesh(this.skyCloudPartGeo, this.skyCloudMat);
                const px = side * (this.tileWidth * 0.65 + 40 + Math.random() * 70);
                const pz = (Math.random() - 0.5) * this.tileSize * 1.35;
                const py = floorY + 4 + Math.random() * 10;
                puff.position.set(px, py, pz);
                puff.scale.setScalar(25 + Math.random() * 55);
                group.add(puff);
            }
        }

        return group;
    }

    private createDesertGroundTile(): THREE.Group | null {
        if (!this.desertGroundTemplate) return null;
        return this.desertGroundTemplate.clone();
    }

    private spawnGroundSegment(x: number, z: number) {
        let segment: THREE.Group | null = null;
        if (this.currentBiom === 'city') {
            const isMainRoadColumn = Math.abs(x) < 0.001;
            if (isMainRoadColumn && this.cityMainRoadModels.length > 0) {
                segment = this.cityMainRoadModels[0].clone();
            } else if (this.citySideGroundModels.length > 0) {
                segment = this.citySideGroundModels[Math.floor(Math.random() * this.citySideGroundModels.length)].clone();
            } else if (this.cityGroundModels.length > 0) {
                segment = this.cityGroundModels[Math.floor(Math.random() * this.cityGroundModels.length)].clone();
            }
        } else if (this.currentBiom === 'desert') {
            segment = this.createDesertGroundTile();
        } else if (this.currentBiom === 'sky') {
            const isEdge = Math.abs(x) >= this.tileWidth * 2 - 0.01;
            const side = x >= 0 ? 1 : -1;
            segment = this.createSkyCloudSegment(isEdge, side);
        } else {
            if (this.groundModel) segment = this.groundModel.clone();
        }

        if (!segment) return;

        segment.position.set(x, 0, z);
        this.scene.add(segment);
        this.grounds.push(segment);

        if (this.currentBiom === 'city') {
            const density = 2;
            for (let i = 0; i < density; i++) this.spawnCityDecoration(x, z);
            if (Math.abs(x) >= this.tileWidth * 2 - 0.01) {
                this.spawnCityEdgeDecoration(x, z);
                this.spawnCityRockBorder(x, z);
            }
        } else if (this.currentBiom === 'desert') {
            const density = 1;
            for (let i = 0; i < density; i++) {
                if (Math.random() < 0.35) this.spawnDesertDecoration(x, z);
            }
            if (Math.abs(x) >= this.tileWidth * 2.2 - 0.01) {
                this.spawnDesertRockBorder(x, z);
            }
            if (Math.abs(x) >= this.tileWidth * 2.2 - 0.01) {
                this.spawnDesertBorder(x, z);
            }
        } else if (this.currentBiom === 'sky') {
            const density = 3;
            for (let i = 0; i < density; i++) this.spawnSkyDecorationOnTile(x, z);
        } else {
            const density = 5;
            for (let i = 0; i < density; i++) this.spawnDecoration(x, z);
            if (x === 0) {
                this.spawnPathBorder(this.laneWidth * 1.5, z);
                this.spawnPathBorder(-this.laneWidth * 1.5, z);
            }
            if (Math.abs(x) >= this.tileWidth * 2) this.spawnMountain(x, z);
        }
    }

    private spawnDesertDecoration(centerX: number, centerZ: number) {
        if (this.desertDecorationModels.length === 0) return;
        const tries = 4;
        for (let t = 0; t < tries; t++) {
            const deco = this.desertDecorationModels[Math.floor(Math.random() * this.desertDecorationModels.length)].clone();
            const decoX = centerX + (Math.random() - 0.5) * this.tileWidth;
            const decoZ = centerZ + (Math.random() - 0.5) * this.tileSize;
            if (Math.abs(decoX) < this.laneWidth * 0.8) continue;
            if (!this.desertHasGroundAt(decoX, decoZ)) continue;
            if (!this.canPlaceDesertAt(decoX, decoZ, 10)) continue;
            deco.position.set(decoX, 0, decoZ);
            deco.rotation.y = Math.random() * Math.PI * 2;
            deco.userData.isDesert = true;
            this.scene.add(deco); this.decorations.push(deco);
            return;
        }
    }


    private spawnDesertBorder(x: number, z: number) {
        if (this.desertDecorationModels.length === 0) return;
        if (Math.abs(x) < this.tileWidth * 2.2 - 0.01) return;
        const side = x > 0 ? 1 : -1;
        const sideIndex = side > 0 ? 1 : 0;
        if (z - this.desertBorderLastZ[sideIndex] < this.tileSize * 0.8) return;

        const source = this.desertDecorationModels[Math.floor(Math.random() * this.desertDecorationModels.length)];
        const ruin = source.clone();
        const offsetX = side * (this.tileWidth * 0.45 + 35 + Math.random() * 55);
        const posX = x + offsetX;
        const posZ = z + (Math.random() - 0.5) * this.tileSize;
        if (!this.desertHasGroundAt(posX, posZ)) return;
        if (!this.canPlaceDesertAt(posX, posZ, 12)) return;
        ruin.position.set(posX, 0, posZ);
        ruin.rotation.y = Math.random() * Math.PI * 2;
        ruin.userData.isDesert = true;
        this.scene.add(ruin); this.decorations.push(ruin);
        this.desertBorderLastZ[sideIndex] = z;

        if (Math.random() < 0.45) {
            this.spawnDesertSidePyramid(1, z);
            this.spawnDesertSidePyramid(-1, z);
        }
    }

    private canPlaceDesertAt(x: number, z: number, minDist: number) {
        const minDistSq = minDist * minDist;
        for (const deco of this.decorations) {
            if (!deco.userData?.isDesert) continue;
            const dx = deco.position.x - x;
            const dz = deco.position.z - z;
            if (dx * dx + dz * dz < minDistSq) return false;
        }
        for (const obs of this.obstacles) {
            if (obs.name !== 'desert_obstacle') continue;
            const dx = obs.position.x - x;
            const dz = obs.position.z - z;
            if (dx * dx + dz * dz < minDistSq) return false;
        }
        return true;
    }

    private desertHasGroundAt(x: number, z: number) {
        if (this.tileWidth <= 0 || this.tileSize <= 0) return false;
        for (const g of this.grounds) {
            const dx = Math.abs(g.position.x - x);
            const dz = Math.abs(g.position.z - z);
            if (dx <= this.tileWidth * 0.55 && dz <= this.tileSize * 0.55) return true;
        }
        return false;
    }

    private spawnDesertSidePyramid(side: number, z: number) {
        if (!this.desertPyramidGeo) this.desertPyramidGeo = new THREE.CylinderGeometry(0, 140, 180, 4);
        if (!this.desertPyramidMat) this.desertPyramidMat = new THREE.MeshStandardMaterial({ color: 0xd9b37c, roughness: 0.95, metalness: 0.0 });
        const pyramid = new THREE.Mesh(this.desertPyramidGeo, this.desertPyramidMat);
        const posX = side * (this.tileWidth * 2.2 + 30 + Math.random() * 45);
        const posZ = z + (Math.random() - 0.5) * this.tileSize * 1.4;
        if (!this.desertHasGroundAt(posX, posZ)) return;
        if (!this.canPlaceDesertAt(posX, posZ, 45)) return;
        pyramid.position.set(posX, 0, posZ);
        pyramid.rotation.y = Math.PI * 0.25;
        pyramid.userData.isDesert = true;
        this.scene.add(pyramid); this.decorations.push(pyramid);
    }

    private spawnDesertRockBorder(x: number, z: number) {
        if (!this.rockModelBig) return;
        if (this.tileWidth <= 0 || this.tileSize <= 0) return;
        if (Math.abs(x) < this.tileWidth * 2.8 - 0.01) return;

        if (!this.desertRockMaterial) {
            this.desertRockMaterial = new THREE.MeshLambertMaterial({ color: 0xd9b37c });
        }

        const side = x > 0 ? 1 : -1;
        const rock = this.rockModelBig.clone();
        rock.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) (child as THREE.Mesh).material = this.desertRockMaterial!;
        });

        const offsetX = side * (this.tileWidth * 0.6 + 55 + Math.random() * 75);
        const offsetZ = (Math.random() - 0.5) * this.tileSize;
        rock.position.set(x + offsetX, 0, z + offsetZ);
        rock.scale.multiplyScalar(4 + Math.random() * 4);
        rock.rotation.y = Math.random() * Math.PI;
        rock.userData.isDesert = true;
        this.scene.add(rock); this.decorations.push(rock);
    }

    private spawnSkyDecorationOnTile(centerX: number, centerZ: number) {
        if (this.skyDecorationModels.length === 0) return;
        const nonBalloons = this.skyDecorationModels.filter(m => !m.name.includes('balloon'));
        const useNonBalloon = nonBalloons.length > 0 && Math.random() < 0.75;
        const sourceList = useNonBalloon ? nonBalloons : this.skyDecorationModels;
        const deco = sourceList[Math.floor(Math.random() * sourceList.length)].clone();

        const decoX = centerX + (Math.random() - 0.5) * this.tileWidth;
        const decoZ = centerZ + (Math.random() - 0.5) * this.tileSize;
        if (Math.abs(decoX) < this.laneWidth * 1.6) return;

        const y = (Math.random() - 0.5) * 25;
        deco.position.set(decoX, y, decoZ);
        deco.rotation.y = Math.random() * Math.PI * 2;
        deco.scale.multiplyScalar(0.8 + Math.random() * 1.4);

        const animations = this.skyModelAnimations.get(deco.name);
        if (animations && animations.length > 0) {
            const mixer = new THREE.AnimationMixer(deco);
            const action = mixer.clipAction(animations[0]);
            action.play();
            this.objectMixers.push(mixer);
        }

        this.scene.add(deco);
        this.decorations.push(deco);
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

    private spawnCityRockBorder(x: number, z: number) {
        if (!this.rockModelBig) return;
        if (this.tileWidth <= 0 || this.tileSize <= 0) return;
        if (Math.abs(x) < this.tileWidth * 2 - 0.01) return;

        const side = x > 0 ? 1 : -1;
        const sideIndex = side > 0 ? 1 : 0;
        if (z - this.cityRockLastZ[sideIndex] < this.tileSize * 0.9) return;

        if (!this.cityRockMaterial) {
            this.cityRockMaterial = new THREE.MeshLambertMaterial({ color: 0x3f7a49 });
        }

        const count = 2;
        for (let i = 0; i < count; i++) {
            const rock = this.rockModelBig.clone();
            rock.traverse((child: THREE.Object3D) => {
                if ((child as THREE.Mesh).isMesh) {
                    (child as THREE.Mesh).material = this.cityRockMaterial!;
                }
            });

            const offsetX = side * (this.tileWidth * 0.9 + 240 + Math.random() * 260);
            const offsetZ = (Math.random() - 0.5) * this.tileSize;
            rock.position.set(x + offsetX, 0, z + offsetZ);
            rock.scale.multiplyScalar(Math.random() * 10 + 18);
            rock.rotation.y = Math.random() * Math.PI;
            this.scene.add(rock); this.decorations.push(rock);
        }
        this.cityRockLastZ[sideIndex] = z;
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

    private spawnCityDecoration(centerX: number, centerZ: number) {
        if (this.cityDecorationModels.length === 0) return;
        if (Math.abs(centerX) < 0.001) return;

        const deco = this.cityDecorationModels[Math.floor(Math.random() * this.cityDecorationModels.length)].clone();
        const side = centerX >= 0 ? 1 : -1;
        let decoX = centerX + (Math.random() - 0.5) * this.tileWidth;
        const decoZ = centerZ + (Math.random() - 0.5) * this.tileSize;

        const isVegetation = (deco.name.includes('Bush') || deco.name.includes('Palm'));
        const isSmallProp = (
            deco.name.includes('Trash') ||
            deco.name.includes('Sign') ||
            isVegetation
        );

        const roadClearHalfWidth = isSmallProp ? (this.cityLaneWidth * 1.75) : (this.cityLaneWidth * 2.2);
        if (Math.abs(decoX) < roadClearHalfWidth) {
            return;
        }

        if (isSmallProp) {
            if (isVegetation) {
                decoX = side * (roadClearHalfWidth + 6.5 + Math.random() * 6.0);
            } else {
                decoX = side * (roadClearHalfWidth + 6.0 + Math.random() * 6.0);
            }
        }

        deco.position.set(decoX, 0, decoZ);
        deco.rotation.y = Math.random() * Math.PI * 2;

        const sideBoost = isSmallProp ? 1.35 : 1.0;
        const scaleVariation = 0.95 + Math.random() * 0.25;
        deco.scale.multiplyScalar(sideBoost * scaleVariation);

        this.scene.add(deco);
        this.decorations.push(deco);
    }

    private spawnCityEdgeDecoration(centerX: number, centerZ: number) {
        if (this.cityEdgeDecorationModels.length === 0) return;
        if (this.tileWidth <= 0 || this.tileSize <= 0) return;
        if (Math.abs(centerX) < this.tileWidth * 1.9) return;

        const side = centerX > 0 ? 1 : -1;
        const source = this.cityEdgeDecorationModels[Math.floor(Math.random() * this.cityEdgeDecorationModels.length)];
        const deco = source.clone();

        const farX = centerX + side * (this.tileWidth * 0.55 + 40 + Math.random() * 70);
        const z = centerZ + (Math.random() - 0.5) * this.tileSize;

        deco.position.set(farX, 0, z);
        deco.rotation.y = Math.random() * Math.PI * 2;
        deco.scale.multiplyScalar(1.6 + Math.random() * 1.2);

        this.scene.add(deco);
        this.decorations.push(deco);
    }

    private spawnObstacle() {
        if (!this.gameActive || this.isIntro || this.isPaused) return;

        if (this.currentBiom === 'city') {
            if (this.cityObstacleModels.length === 0) return;

            const lanes = [-1, 0, 1].sort(() => Math.random() - 0.5);
            const numCars = Math.random() < 0.25 ? 2 : 1;
            const carY = this.altitude - 2.1;
            const spawnZ = this.player.position.z + 620 + Math.random() * 220;
            const minLaneSpacingZ = 300;
            const minAnyCarSpacingZ = 200;

            const isLaneClear = (laneIndex: number, laneX: number, z: number) => {
                if (z - this.cityLaneLastCarZ[laneIndex] < minLaneSpacingZ) return false;

                for (const obs of this.obstacles) {
                    if (obs.name !== 'city_car') continue;
                    if (Math.abs(obs.position.z - z) < minAnyCarSpacingZ) return false;
                    if (Math.abs(obs.position.x - laneX) > 0.1) continue;
                    if (Math.abs(obs.position.z - z) < minLaneSpacingZ) return false;
                }
                return true;
            };

            let placed = 0;
            for (let i = 0; i < lanes.length && placed < numCars; i++) {
                const laneIndex = lanes[i] + 1;
                const laneX = lanes[i] * this.cityLaneWidth;
                if (!isLaneClear(laneIndex, laneX, spawnZ)) continue;

                const obstacle = this.cityObstacleModels[Math.floor(Math.random() * this.cityObstacleModels.length)].clone();
                obstacle.position.set(laneX, carY, spawnZ);
                obstacle.rotation.y = Math.PI;
                obstacle.name = 'city_car';
                obstacle.scale.multiplyScalar(0.75);
                const box = new THREE.Box3().setFromObject(obstacle);
                obstacle.userData.boundingBox = box;

                this.scene.add(obstacle);
                this.obstacles.push(obstacle);
                this.cityLaneLastCarZ[laneIndex] = spawnZ;
                placed++;
            }
            return;
        }

        if (this.currentBiom === 'sky') {
            if (this.skyObstacleModels.length === 0) return;
            const lane = (Math.floor(Math.random() * 3) - 1) * this.laneWidth;
            const jets = this.skyObstacleModels.filter(m => m.name === 'airplane' || m.name === 'harrier' || m.name === 'c17_plane');
            const preferJet = jets.length > 0 && Math.random() < 0.75;
            const sourcePool = preferJet ? jets : this.skyObstacleModels;
            const sourceModel = sourcePool[Math.floor(Math.random() * sourcePool.length)];
            const obstacle = sourceModel.clone();
            const spawnZ = this.player.position.z + 550;
            const minSkyObstacleSpacingZ = 220;
            if (spawnZ - this.skyObstacleLastZ < minSkyObstacleSpacingZ) return;
            obstacle.position.set(lane, this.altitude, spawnZ);

            const animations = this.skyModelAnimations.get(sourceModel.name);
            if (animations && animations.length > 0) {
                const mixer = new THREE.AnimationMixer(obstacle);
                const action = mixer.clipAction(animations[0]);
                action.play();
                this.objectMixers.push(mixer);
            }

            const target = new THREE.Vector3(this.player.position.x, obstacle.position.y, this.player.position.z);
            obstacle.lookAt(target);
            this.scene.add(obstacle); this.obstacles.push(obstacle);
            const box = new THREE.Box3().setFromObject(obstacle);
            obstacle.userData.boundingBox = box;
            this.skyObstacleLastZ = spawnZ;

            if (Math.random() < 0.3) this.spawnSkyDecoration();
        } else if (this.currentBiom === 'desert') {
            if (this.desertObstacleModels.length === 0) return;
            const lanes = [-1, 0, 1].sort(() => Math.random() - 0.5);
            const spawnZ = this.player.position.z + 550;
            const minLaneSpacingZ = 120;
            const minAnySpacingZ = 75;

            const isLaneClear = (laneIndex: number, laneX: number, z: number) => {
                if (z - this.desertObstacleLastZ[laneIndex] < minLaneSpacingZ) return false;
                for (const obs of this.obstacles) {
                    if (obs.name !== 'desert_obstacle') continue;
                    if (Math.abs(obs.position.z - z) < minAnySpacingZ) return false;
                    if (Math.abs(obs.position.x - laneX) > 0.1) continue;
                    if (Math.abs(obs.position.z - z) < minLaneSpacingZ) return false;
                }
                return true;
            };

            let placed = 0;
            const wantTwo = Math.random() < 0.35;
            for (let i = 0; i < lanes.length && placed < (wantTwo ? 2 : 1); i++) {
                const laneIndex = lanes[i] + 1;
                const laneX = lanes[i] * this.laneWidth;
                if (!isLaneClear(laneIndex, laneX, spawnZ)) continue;
                if (!this.canPlaceDesertAt(laneX, spawnZ, 12)) continue;

                const obstacle = this.desertObstacleModels[Math.floor(Math.random() * this.desertObstacleModels.length)].clone();
                const isCactus = obstacle.name.toLowerCase().includes('cactus');
                const y = (this.altitude - 2.0) + (isCactus ? -1.5 : 0);
                obstacle.position.set(laneX, y, spawnZ);
                obstacle.rotation.y = Math.random() * Math.PI * 2;
                const sourceName = (obstacle.name || '').toLowerCase();
                const shrinkBig = sourceName.includes('stylized_cactus');
                const shrinkRocks1 = sourceName.includes('desert_rocks (1)');
                const shrinkRocksAny = sourceName.includes('desert_rocks');
                obstacle.name = 'desert_obstacle';
                obstacle.userData.isDesert = true;
                obstacle.userData.laneX = laneX;
                obstacle.scale.multiplyScalar(shrinkRocks1 ? 0.38 : (shrinkBig ? 0.6 : 1.45));
                if (shrinkRocks1) {
                    obstacle.rotation.y = Math.PI * 0.5;
                    obstacle.scale.x *= 0.7;
                    obstacle.scale.z *= 0.7;
                    obstacle.userData.collisionWidth = this.laneWidth * 0.35;
                }
                if (shrinkRocksAny) {
                    obstacle.position.y -= 0.6;
                }
                if (isCactus) {
                    obstacle.position.y -= 0.3;
                }
                const box = new THREE.Box3().setFromObject(obstacle);
                if (shrinkRocks1) {
                    const shrink = 0.45;
                    const size = new THREE.Vector3();
                    box.getSize(size);
                    box.expandByVector(new THREE.Vector3(-size.x * shrink, -size.y * 0.2, -size.z * shrink));
                }
                obstacle.userData.boundingBox = box;

                this.scene.add(obstacle); this.obstacles.push(obstacle);
                this.desertObstacleLastZ[laneIndex] = spawnZ;
                placed++;
            }
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
        if (this.skyDecorationModels.length === 0) return;
        const nonBalloons = this.skyDecorationModels.filter(m => !m.name.includes('balloon'));
        const useNonBalloon = nonBalloons.length > 0 && Math.random() < 0.75;
        const sourceList = useNonBalloon ? nonBalloons : this.skyDecorationModels;
        const sourceModel = sourceList[Math.floor(Math.random() * sourceList.length)];
        const deco = sourceModel.clone();

        const side = Math.random() < 0.5 ? 1 : -1;
        const offsetX = side * (30 + Math.random() * 100);
        const offsetY = (Math.random() - 0.5) * 60;
        const offsetZ = 400 + Math.random() * 300;

        deco.position.set(this.player.position.x + offsetX, offsetY, this.player.position.z + offsetZ);
        deco.scale.multiplyScalar(0.5 + Math.random() * 1.5);
        deco.rotation.y = Math.random() * Math.PI * 2;

        const animations = this.skyModelAnimations.get(sourceModel.name);
        if (animations && animations.length > 0) {
            const mixer = new THREE.AnimationMixer(deco);
            const action = mixer.clipAction(animations[0]);
            action.play();
            this.objectMixers.push(mixer);
        }

        this.scene.add(deco);
        this.decorations.push(deco);
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

    private startTransition(zOffset: number = 0, targetY: number | null = null) {
        this.isIntro = true;
        this.transitionStartZ = this.player.position.z;

        if (targetY !== null) {
            this.targetAltitude = targetY;
        } else {
            this.altitude = 150.0;
            this.targetAltitude = 8.5;
        }

        this.player.position.y = this.altitude;

        const baseZ = this.player.position.z + zOffset;

        for (let i = 0; i < 50; i++) {
            const zPos = baseZ + 200 + (Math.random() * 800);
            const group = new THREE.Group();
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });

            for (let j = 0; j < 12; j++) {
                const geo = new THREE.SphereGeometry(Math.random() * 50 + 20, 6, 6);
                const part = new THREE.Mesh(geo, mat);
                part.position.set((Math.random() - 0.5) * 150, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60);
                group.add(part);
            }
            group.position.set((Math.random() - 0.5) * 80, this.altitude, zPos);
            this.scene.add(group);
            this.clouds.push(group);
        }
    }

    private startGame() {
        this.refreshPlayerModel();
        this.gameActive = true;
        this.isPaused = false;
        this.score = 0;
        this.distance = 0;
        this.speed = 0.8;
        this.currentBiom = 'intro';

        this.obstacles.forEach(o => this.scene.remove(o));
        this.decorations.forEach(d => this.scene.remove(d));
        this.grounds.forEach(g => this.scene.remove(g));
        this.clouds.forEach(c => this.scene.remove(c));

        this.obstacles = []; this.decorations = []; this.grounds = []; this.clouds = [];
        this.objectMixers = [];

        this.scene.background = new THREE.Color(0xa6d0ff);
        this.scene.fog = new THREE.FogExp2(0xa6d0ff, 0.0001);

        this.startTransition(0, 8.5);
        this.altitude = 150.0;

        const hud = document.getElementById('hud'); if (hud) hud.classList.remove('hidden');
        const appView = document.getElementById('app'); if (appView) appView.style.visibility = 'visible';

        const pauseElement = document.getElementById('pause');
        if (pauseElement) pauseElement.classList.add('hidden');
    }

    private gameOver(): void {
        this.gameActive = false;
        this.isPaused = false;
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
        this.pigMesh.position.y = 0;
        if (this.grounds.length === 0) {
            this.initEnvironment();
        }
        this.isIntro = false;
    }

    private switchToDesertBiom() {
        this.currentBiom = 'desert';
        this.scene.background = new THREE.Color(0xf0d29b);
        this.scene.fog = new THREE.FogExp2(0xf0d29b, 0.00012);
        this.pigMesh.position.y = 0;

        this.grounds.forEach(g => this.scene.remove(g));
        this.decorations.forEach(d => this.scene.remove(d));
        this.grounds = [];
        this.decorations = [];
        this.desertBorderLastZ = [-Infinity, -Infinity];
        this.desertObstacleLastZ = [-Infinity, -Infinity, -Infinity];

        this.initEnvironment();
        this.isIntro = false;
    }
    private switchToSkyBiom() {
        this.currentBiom = 'sky';
        this.scene.background = new THREE.Color(0xc7e9ff);
        this.scene.fog = new THREE.FogExp2(0xffd1e3, 0.00011);
        this.pigMesh.position.y = 0;
        this.skyObstacleLastZ = -Infinity;

        this.grounds.forEach(g => this.scene.remove(g));
        this.decorations.forEach(d => this.scene.remove(d));
        this.grounds = [];
        this.decorations = [];

        this.initEnvironment();
        this.isIntro = false;
    }

    private switchToCityBiom() {
        this.currentBiom = 'city';
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0001);
        this.pigMesh.position.y = -1.5;
        this.cityLaneLastCarZ = [-Infinity, -Infinity, -Infinity];
        this.cityRockLastZ = [-Infinity, -Infinity];

        this.grounds.forEach(g => this.scene.remove(g));
        this.decorations.forEach(d => this.scene.remove(d));
        this.grounds = [];
        this.decorations = [];

        this.initEnvironment();
        this.isIntro = false;
    }

    private animate() {
        requestAnimationFrame(() => this.animate());
        const delta = this.wingClock.getDelta();
        const t = performance.now() * 0.001;

        for (let i = this.objectMixers.length - 1; i >= 0; i--) {
            const mixer = this.objectMixers[i];
            const root = mixer.getRoot() as THREE.Object3D;
            if (root.parent) {
                mixer.update(delta);
            } else {
                this.objectMixers.splice(i, 1);
            }
        }

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

        if (this.isRotating) {
            this.rotationProgress += delta;
            const progress = Math.min(this.rotationProgress / this.rotationDuration, 1);

            const easedProgress = this.easeInOutCubic(progress);
            this.rotationAngle = easedProgress * Math.PI * 2;

            this.pigMesh.rotation.x = Math.sin(this.rotationAngle) * Math.PI;

            if (progress >= 1) {
                this.isRotating = false;
                this.pigMesh.rotation.x = 0;
                this.rotationAngle = 0;
                this.rotationProgress = 0;
            }
        }

        this.camera.position.y = this.cameraOriginalY;

        if (this.gameActive && !this.isPaused) {
            if (this.isIntro) {
                const altitudeStep = 0.5;
                if (Math.abs(this.altitude - this.targetAltitude) > altitudeStep) {
                    this.altitude += (this.targetAltitude > this.altitude ? altitudeStep : -altitudeStep);
                    this.pigMesh.rotation.x = (this.targetAltitude > this.altitude ? -0.1 : 0.3);
                } else {
                    this.altitude = this.targetAltitude;
                    this.pigMesh.rotation.x *= 0.9;
                }

                const progress = this.player.position.z - this.transitionStartZ;

                if (progress > 300 && progress < 500) {
                    if (this.currentBiom === 'transitioning_to_sky') {
                        this.scene.background = new THREE.Color(0x3a5a7f);
                        this.scene.fog = new THREE.FogExp2(0x3a5a7f, 0.00015);
                    } else if (this.currentBiom === 'transitioning_to_city') {
                        this.scene.background = new THREE.Color(0x87ceeb);
                        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.00015);
                    } else if (this.currentBiom === 'transitioning_to_desert') {
                        this.scene.background = new THREE.Color(0xf0d29b);
                        this.scene.fog = new THREE.FogExp2(0xf0d29b, 0.00015);
                    }
                }

                if (progress > 700) {
                    if (this.currentBiom === 'intro') {
                        this.switchToNatureBiom();
                    } else if (this.currentBiom === 'transitioning_to_sky') {
                        this.switchToSkyBiom();
                    } else if (this.currentBiom === 'transitioning_to_city') {
                        this.switchToCityBiom();
                    } else if (this.currentBiom === 'transitioning_to_desert') {
                        this.switchToDesertBiom();
                    }
                }
            }

            if (this.currentBiom === 'clouds' && this.score >= 200) {
                this.currentBiom = 'transitioning_to_desert';
                this.startTransition(0, 8.5);
            }

            if (this.currentBiom === 'desert' && this.score >= 400) {
                this.currentBiom = 'transitioning_to_sky';
                this.startTransition(0, 8.5);
            }

            if (this.currentBiom === 'sky' && this.score >= 600) {
                this.currentBiom = 'transitioning_to_city';
                this.startTransition(0, 8.5);
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

            if (this.currentBiom === 'clouds' || this.currentBiom === 'city' || this.currentBiom === 'sky' || this.currentBiom === 'desert') {
                const gridWidth = (this.currentBiom === 'desert') ? 13 : 5;
                this.grounds.sort((a: THREE.Group, b: THREE.Group) => a.position.z - b.position.z);
                while (this.grounds.length > 0 && this.grounds[0].position.z < this.player.position.z - this.tileSize * 2.0) {
                    const batch = this.grounds.splice(0, gridWidth);
                    const lastZ = this.grounds[this.grounds.length - 1]?.position.z || 0;
                    batch.forEach(g => {
                        g.position.z = lastZ + this.tileSize;
                        this.grounds.push(g);

                        if (this.currentBiom === 'city') {
                            for (let i = 0; i < 2; i++) this.spawnCityDecoration(g.position.x, g.position.z);
                            if (Math.abs(g.position.x) >= this.tileWidth * 2 - 0.01) {
                                this.spawnCityEdgeDecoration(g.position.x, g.position.z);
                                this.spawnCityRockBorder(g.position.x, g.position.z);
                            }
                        } else if (this.currentBiom === 'desert') {
                            for (let i = 0; i < 1; i++) {
                                if (Math.random() < 0.35) this.spawnDesertDecoration(g.position.x, g.position.z);
                            }
                            if (Math.abs(g.position.x) >= this.tileWidth * 2.2 - 0.01) {
                                this.spawnDesertRockBorder(g.position.x, g.position.z);
                            }
                            if (Math.abs(g.position.x) >= this.tileWidth * 2.2 - 0.01) {
                                this.spawnDesertBorder(g.position.x, g.position.z);
                            }
                        } else if (this.currentBiom === 'sky') {
                            for (let i = 0; i < 3; i++) this.spawnSkyDecorationOnTile(g.position.x, g.position.z);
                        } else {
                            for (let i = 0; i < 4; i++) this.spawnDecoration(g.position.x, g.position.z);
                            if (g.position.x === 0) {
                                this.spawnPathBorder(this.laneWidth * 1.5, g.position.z);
                                this.spawnPathBorder(-this.laneWidth * 1.5, g.position.z);
                            }
                            if (Math.abs(g.position.x) >= this.tileWidth * 2) this.spawnMountain(g.position.x, g.position.z);
                        }
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

            const obstacleChance =
                (this.currentBiom === 'city') ? 0.16 :
                    (this.currentBiom === 'sky') ? 0.20 :
                        (this.currentBiom === 'desert') ? 0.06 :
                            0.012;
            if (Math.random() < obstacleChance) this.spawnObstacle();

            if (!this.isIntro) {
                const pBox = new THREE.Box3().setFromObject(this.pigMesh);
                pBox.expandByScalar(-0.3);

                for (let i = this.obstacles.length - 1; i >= 0; i--) {
                    const obs = this.obstacles[i];
                    let oBox: THREE.Box3;

                    if (this.currentBiom === 'sky' || this.currentBiom === 'city' || this.currentBiom === 'desert') {
                        if (obs.userData.boundingBox) {
                            const stored = obs.userData.boundingBox as THREE.Box3;
                            oBox = stored.clone();
                        } else {
                            oBox = new THREE.Box3().setFromObject(obs);
                        }
                        oBox.expandByScalar(this.currentBiom === 'city' ? -0.5 : -2.5);
                        if (this.currentBiom === 'city') {
                            oBox.min.y = this.altitude - 3;
                            oBox.max.y = this.altitude + 1;
                        }
                        if (this.currentBiom === 'sky') {
                            oBox.min.y = this.altitude - 2;
                            oBox.max.y = this.altitude + 2;
                        }
                        if (this.currentBiom === 'desert') {
                            oBox.min.y = 0;
                            oBox.max.y = 1000;
                        }
                        if (pBox.intersectsBox(oBox)) this.gameOver();
                    } else {
                        const trunkCenter = new THREE.Vector3();
                        obs.getWorldPosition(trunkCenter);
                        const trunkRadius = 1.2;
                        oBox = new THREE.Box3(
                            new THREE.Vector3(trunkCenter.x - trunkRadius, 0, trunkCenter.z - trunkRadius),
                            new THREE.Vector3(trunkCenter.x + trunkRadius, 1000, trunkCenter.z + trunkRadius)
                        );
                        if (pBox.intersectsBox(oBox)) this.gameOver();
                    }
                    if (obs.position.z < this.player.position.z - 200) {
                        this.scene.remove(obs); this.obstacles.splice(i, 1);
                    }
                }
            }
        }
        this.renderer.render(this.scene, this.camera);
    }

    private easeInOutCubic(t: number): number {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}
