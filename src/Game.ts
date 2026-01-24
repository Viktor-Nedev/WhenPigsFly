import * as THREE from 'three';

export class Game {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private player: THREE.Group;
    private obstacles: THREE.Group[] = [];
    private clouds: THREE.Group[] = [];
    private score: number = 0;
    private distance: number = 0;
    private speed: number = 0.5;
    private gameActive: boolean = false;
    private laneWidth: number = 4;
    private currentLane: number = 0;
    private targetX: number = 0;
    private time: number = 0;

    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.01);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById('app')?.appendChild(this.renderer.domElement);

        this.player = this.createPig();
        this.scene.add(this.player);

        this.createLights();
        this.initEnvironment();

        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('keydown', (e) => this.onKeyDown(e));

        this.animate();
    }

    private createPig(): THREE.Group {
        const group = new THREE.Group();


        const bodyGeo = new THREE.BoxGeometry(0.8, 0.6, 1.2);
        const pigMat = new THREE.MeshStandardMaterial({ color: 0xffadc7 });
        const body = new THREE.Mesh(bodyGeo, pigMat);
        group.add(body);


        const headGeo = new THREE.BoxGeometry(0.6, 0.5, 0.5);
        const head = new THREE.Mesh(headGeo, pigMat);
        head.position.set(0, 0.1, 0.7);
        group.add(head);


        const snoutGeo = new THREE.BoxGeometry(0.2, 0.2, 0.1);
        const snoutMat = new THREE.MeshStandardMaterial({ color: 0xff8da1 });
        const snout = new THREE.Mesh(snoutGeo, snoutMat);
        snout.position.set(0, 0, 0.3);
        head.add(snout);


        const eyeGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-0.15, 0.1, 0.26);
        head.add(eyeL);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(0.15, 0.1, 0.26);
        head.add(eyeR);


        const legGeo = new THREE.BoxGeometry(0.15, 0.3, 0.15);
        const l1 = new THREE.Mesh(legGeo, pigMat);
        l1.position.set(-0.25, -0.35, 0.4);
        group.add(l1);
        const l2 = new THREE.Mesh(legGeo, pigMat);
        l2.position.set(0.25, -0.35, 0.4);
        group.add(l2);
        const l3 = new THREE.Mesh(legGeo, pigMat);
        l3.position.set(-0.25, -0.35, -0.4);
        group.add(l3);
        const l4 = new THREE.Mesh(legGeo, pigMat);
        l4.position.set(0.25, -0.35, -0.4);
        group.add(l4);

        group.position.set(0, 0.5, 0);


        this.camera.position.set(0, 3, -8);
        this.camera.lookAt(0, 1, 5);
        group.add(this.camera);

        return group;
    }

    private createAirplane(): THREE.Group {
        const group = new THREE.Group();

        const planeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const wingMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });


        const fuselageGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
        const fuselage = new THREE.Mesh(fuselageGeo, planeMat);
        fuselage.rotation.x = Math.PI / 2;
        group.add(fuselage);


        const wingGeo = new THREE.BoxGeometry(2.5, 0.05, 0.6);
        const wings = new THREE.Mesh(wingGeo, wingMat);
        wings.position.set(0, 0, 0.2);
        group.add(wings);


        const tailGeo = new THREE.BoxGeometry(0.8, 0.05, 0.3);
        const tail = new THREE.Mesh(tailGeo, wingMat);
        tail.position.set(0, 0, -0.8);
        group.add(tail);

        const vertTailGeo = new THREE.BoxGeometry(0.05, 0.4, 0.3);
        const vertTail = new THREE.Mesh(vertTailGeo, wingMat);
        vertTail.position.set(0, 0.2, -0.8);
        group.add(vertTail);

        return group;
    }

    private createCloud(z: number) {
        const group = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });

        for (let i = 0; i < 5; i++) {
            const geo = new THREE.SphereGeometry(Math.random() * 2 + 1, 8, 8);
            const part = new THREE.Mesh(geo, mat);
            part.position.set(
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 5
            );
            group.add(part);
        }

        group.position.set((Math.random() - 0.5) * 40, Math.random() * 10 + 5, z);
        this.scene.add(group);
        this.clouds.push(group);
    }

    private createLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xffffff, 2);
        sun.position.set(5, 10, 7.5);
        this.scene.add(sun);
    }

    private initEnvironment() {

        const gridHelper = new THREE.GridHelper(2000, 100, 0xffffff, 0xcccccc);
        gridHelper.position.y = -1;
        this.scene.add(gridHelper);


        for (let i = 0; i < 20; i++) {
            this.createCloud(i * 30);
        }
    }

    private spawnObstacle() {
        if (!this.gameActive) return;

        const lanes = [-this.laneWidth, 0, this.laneWidth];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];

        const plane = this.createAirplane();
        plane.position.set(lane, 1, this.player.position.z + 150);
        plane.rotation.y = Math.PI;
        this.scene.add(plane);
        this.obstacles.push(plane);
    }

    private onKeyDown(e: KeyboardEvent) {
        if (!this.gameActive && (e.code === 'Space' || e.code === 'Enter')) {
            this.startGame();
            return;
        }

        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            this.currentLane = Math.max(-1, this.currentLane - 1);
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            this.currentLane = Math.min(1, this.currentLane + 1);
        }
        this.targetX = this.currentLane * this.laneWidth;
    }

    private startGame() {
        this.gameActive = true;
        this.score = 0;
        this.distance = 0;
        this.speed = 0.5;
        this.player.position.set(0, 0.5, 0);
        this.currentLane = 0;
        this.targetX = 0;

        this.obstacles.forEach(o => this.scene.remove(o));
        this.obstacles = [];

        document.getElementById('start-screen')?.classList.add('hidden');
        document.getElementById('game-over')?.classList.add('hidden');
        document.getElementById('hud')?.classList.remove('hidden');
    }

    private gameOver() {
        this.gameActive = false;
        document.getElementById('game-over')?.classList.remove('hidden');
        const finalScoreElem = document.getElementById('final-score');
        if (finalScoreElem) finalScoreElem.innerText = `FINAL SCORE: ${Math.floor(this.score)}`;
    }

    private onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate() {
        requestAnimationFrame(() => this.animate());
        this.time += 0.01;

        if (this.gameActive) {
            this.player.position.z += this.speed;
            this.distance = this.player.position.z;
            this.score += 0.1;
            this.speed += 0.0001;

            this.player.position.x += (this.targetX - this.player.position.x) * 0.1;


            const scoreElem = document.getElementById('score');
            const distElem = document.getElementById('distance');
            if (scoreElem) scoreElem.innerText = `SCORE: ${Math.floor(this.score).toString().padStart(5, '0')}`;
            if (distElem) distElem.innerText = `DIST: ${Math.floor(this.distance)}m`;

            const hue = (Math.sin(this.time * 0.1) * 0.1 + 0.6);
            const skyColor = new THREE.Color().setHSL(hue, 0.5, 0.7);
            this.scene.background = skyColor;
            if (this.scene.fog instanceof THREE.FogExp2) {
                this.scene.fog.color = skyColor;
            }


            this.clouds.forEach(cloud => {
                if (cloud.position.z < this.player.position.z - 50) {
                    cloud.position.z += 600;
                    cloud.position.x = (Math.random() - 0.5) * 60;
                }
            });


            if (Math.random() < 0.03) {
                this.spawnObstacle();
            }


            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                const obs = this.obstacles[i];

                const pBox = new THREE.Box3().setFromObject(this.player);
                const oBox = new THREE.Box3().setFromObject(obs);
                if (pBox.intersectsBox(oBox)) {
                    this.gameOver();
                }

                if (obs.position.z < this.player.position.z - 20) {
                    this.scene.remove(obs);
                    this.obstacles.splice(i, 1);
                }
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}
