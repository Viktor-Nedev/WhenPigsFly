import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class MenuRenderer {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private loader: GLTFLoader;
    private currentModel: THREE.Group | null = null;
    private animationId: number | null = null;
    private container: HTMLElement;

    constructor(containerId: string) {
        this.container = document.getElementById(containerId) as HTMLElement;
        if (!this.container) throw new Error(`Container #${containerId} not found`);

        this.scene = new THREE.Scene();

        const width = this.container.clientWidth || 200;
        const height = this.container.clientHeight || 200;

        this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 2);
        dirLight.position.set(5, 5, 5);
        this.scene.add(dirLight);

        this.loader = new GLTFLoader();

        this.animate();
    }

    public async loadModel(path: string): Promise<void> {
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
            this.currentModel = null;
        }

        try {
            const gltf = await this.loader.loadAsync(path);
            this.currentModel = gltf.scene;

            // Center model and normalize scale
            const box = new THREE.Box3().setFromObject(this.currentModel);
            const center = new THREE.Vector3();
            box.getCenter(center);
            const size = new THREE.Vector3();
            box.getSize(size);

            // Re-center model pivot
            this.currentModel.position.x = -center.x;
            this.currentModel.position.y = -center.y;
            this.currentModel.position.z = -center.z;

            const wrapper = new THREE.Group();
            wrapper.add(this.currentModel);
            this.scene.add(wrapper);
            this.currentModel = wrapper;

            // Scale to fit comfortably in view
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 3.5 / maxDim; // Adjusted for better fill
            wrapper.scale.set(scale, scale, scale);

            // Final scene centering
            wrapper.position.set(0, 0, 0);

            // Adjust camera to look better at models
            this.camera.position.set(0, 1, 5);
            this.camera.lookAt(0, 0, 0);

        } catch (error) {
            console.error('Error loading 3D model in MenuRenderer:', error);
            // Fallback visualization could go here
        }
    }

    private animate = (): void => {
        this.animationId = requestAnimationFrame(this.animate);

        if (this.currentModel) {
            this.currentModel.rotation.y += 0.01;
        }

        this.renderer.render(this.scene, this.camera);
    }

    public dispose(): void {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
        }
        this.renderer.dispose();
    }
}
