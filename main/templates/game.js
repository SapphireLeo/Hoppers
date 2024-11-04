let mainBoard;

let renderer;

const level1_coordinates = [
    vec2(2, 0),
    vec2(2, 2),
    vec2(1, 3),
    vec2(3, 3)
]

function changeSceneColor(scene, color) {
    // 씬 내 모든 Mesh를 순회하며 색상을 변경
    scene.traverse((object) => {
        if (object.isMesh) {
            // object.material이 존재하고 color 속성이 있는지 확인
            if (object.material && object.material.color) {
                // 색상을 변경 (예: 빨간색)
                object.material.color.set(color);
            }
        }
    });
}

class Board {
    constructor(coordinates) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.scene.background = new THREE.Color(0xc2d8f5); // 배경색 설정

        // 빛 설정
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1).normalize();
        this.scene.add(light);

        const light2 = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(light2);

        // 카메라 위치 설정
        this.camera.position.set(0, -2, 6);
        this.camera.lookAt(new THREE.Vector3(0, 0.5, 0));
        this.selectedPlatform = null;
        // coordinates should be list of vectors.
        this.platforms = [];
        for (let i = 0; i < 5; i++) {
            const newRow = []
            for (let j = 0; j < 5; j++) {
                const platform = (j + i) % 2 ? null : new Platform(j, i, this);
                newRow.push(platform);
            }
            this.platforms.push(newRow)
        }

        for (let coordinate of coordinates) {
            this.platforms[coordinate.y][coordinate.x].setFrog();
        }
    }

    // 애니메이션 루프
    animate = () => {
        requestAnimationFrame(this.animate)
        renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.render(this.scene, this.camera);
    }

    checkVictory() {
        let totalFrogCount = 0;
        this.platforms.forEach(row => {
            row.forEach(platform => {
                if (platform?.frog){
                    totalFrogCount += 1;
                }
            });
        });
        return totalFrogCount === 1;
    }

    dismissSelection() {
        if (this.selectedPlatform) {
            changeSceneColor(this.selectedPlatform.frog.model, 0xB4FF80)
            this.selectedPlatform = null;
        }
    }

    // 현재 클릭한 Mesh가 개구리가 있는 발판인지를 검사하고, 만약 개구리가 있는 발판이라면 selectPlatform 메서드로 연계하는 메서드
    clickMesh(clickedMesh) {
        console.log("clicked Mesh:", clickedMesh)
        for (let platformRow of this.platforms) {
            for (let platform of platformRow) {
                // 2가지 조건을 검사한다.
                // 1. 현재 클릭한 Mesh가 그 platform의 mesh일 경우 또는,
                // 2. frog가 올라와 있는 platform이고 현재 선택한 오브젝트가 그 frog일 경우
                if ((platform && checkInclusion(clickedMesh, platform.model)) ||
                    (platform?.frog && checkInclusion(clickedMesh, platform.frog.model))) {
                    // 만약 frog가 올라온 platform을 클릭했다면, platform 선택 메서드로 연계
                    console.log("selected platform:", platform)
                    this.selectPlatform(platform);
                }
            }
        }
    }

    // platform을 선택했을 경우, 선택에 따라 hop을 수행하거나 대기하는 함수
    selectPlatform(platform) {
        // 이전에 선택한 platform이 없고, 방금 선택한 platform에 개구리가 있을 경우
        if (!this.selectedPlatform) {
            if (platform.frog) {
                this.selectedPlatform = platform;
                changeSceneColor(this.selectedPlatform.frog.model, 0xff0000);
            }
        }
        // 선택한 platform이 있을 경우, hop를 수행하고 hop의 성공 유무와 관계없이 선택 해제
        else {
            this.hop(this.selectedPlatform, platform);
            this.dismissSelection();
        }
    }

    hop(origin, destination) {
        // 출발지와 도착지로 선택한 플랫폼이 위아래로 2칸 차이일 때
        if (Math.abs(origin.x - destination.x) === 2
            && Math.abs(origin.y - destination.y) === 2) {
            // 두 플랫폼 사이에 있는 플랫폼
            const middlePlatform = this.platforms[(origin.y + destination.y)/2][(origin.x + destination.x)/2]
            // 사이에 있는 플랫폼에도 개구리가 있을 경우에만 뛰어넘기 수행
            if (middlePlatform.frog) {
                console.log("hop!")

                // 출발지의 개구리 인스턴스를 도착지로 이동
                const destPlatformPosition = destination.model.position;
                destination.frog = origin.frog;
                destination.frog.model.position.set(destPlatformPosition.x, destPlatformPosition.y, 0.5); // 포지션을 새로운 플랫폼의 중앙으로 이동
                origin.frog = null;

                // 현재 선택된 플랫폼을 도착지로 변경 (이후에 dismissSelection 메서드로 선택 해제됨)
                this.selectedPlatform = destination;

                // 뛰어넘어진 플랫폼의 개구리 제거
                middlePlatform.removeFrog()

                // hop의 결과 개구리가 한 개만 남았다면 승리 메세지 출력
                if (this.checkVictory()) {
                    document.getElementById("scoreboard").textContent = "cleared!"
                    console.log("stage cleared!")
                }
            }
        }
    }
}

class Platform {
    constructor(x, y, board) {
        this.x = x;
        this.y = y;
        this.board = board;
        this.frog = null;

        // 3D 오브젝트 생성
        this.createMesh();
    }

    createMesh() {
        const loader = new THREE.GLTFLoader();
        loader.load('../assets/lotus_leaf.glb', (gltf) => {
            const leaf = gltf.scene;

            // 스케일 조정
            leaf.scale.set(0.3, 0.3, 0.3);

            // 위치 설정: 중앙 정렬을 위해 x-2, y-1 적용, 추가: 간격 넓힘
            leaf.position.set((this.x - 2) * 1.3, (this.y - 1) * 1.3, 0);

            // x축 기준 회전
            leaf.rotation.x = Math.PI / 2;

            this.model = leaf;
            this.board.scene.add(this.model);

            // 첫 번째 연잎이라면 하이라이트 추가
            if (this.x === 0 && this.y === 0) {
                // 연잎 테두리를 빛나게 하는 함수 호출
                this.highlightEdges(leaf);
            }

        }, undefined, (error) => {
            console.error('모델 로드 오류:', error);
        });
    }

    // 연잎 테두리 하이라이트 함수
    highlightEdges(object, repeat = 10) {
        object.traverse((child) => {
            if (child.isMesh) {
                const edges = new THREE.EdgesGeometry(child.geometry);
                const lineMaterial = new THREE.LineBasicMaterial({
                    color: 0xFF0000,
                    linewidth: 1,
                    transparent: true,
                    opacity: 1.0,
                    blending: THREE.AdditiveBlending });

                // 기본 edgeLines를 생성하고 위치, 스케일, 회전을 적용한 뒤, 반복문으로 복제하여 변화를 줘서 추가
                const baseEdgeLines = new THREE.LineSegments(edges, lineMaterial);
                baseEdgeLines.scale.copy(child.scale);
                baseEdgeLines.position.copy(child.position);
                baseEdgeLines.rotation.copy(child.rotation);

                for (let i = 0; i < repeat; i++) {
                    // 새로운 LineSegments를 복제
                    const edgeLines = baseEdgeLines.clone();

                    // 약간의 위치나 스케일 변화를 줘서 테두리가 겹쳐지도록 합니다.
                    edgeLines.scale.multiplyScalar(1 + 0.01 * i);

                    // 테두리를 하이라이트 대상 객체에 추가
                    child.add(edgeLines);
                }
            }
        });
    }

    setFrog() {
        this.frog = new Frog(this);
    }

    addLotusFrog() {
        if (this.lotusLoaded && this.frogLoaded) {
            this.mesh.add(this.frog.model);
            this.frog.model.position.set(0, 0.2, 1.5);
            this.frog.model.scale.set(1.3, 1.3, 1.3);
            this.frog.model.rotation.x = Math.PI / 3;
        }
    }

    removeFrog() {
        this.board.scene.remove(this.frog.model);
        this.frog = null;
    }

    display() {
        // 추가적인 display 로직이 필요하다면 구현
    }
}

class Frog {
    constructor(platform) {
        this.platform = platform
        // 개구리 모델 로드
        const loader = new THREE.GLTFLoader();
        loader.load('../assets/frog.glb', (gltf) => {
            this.model = gltf.scene;

            this.model.position.set((this.platform.x - 2) * 1.3, (this.platform.y - 1) * 1.3, 0.5); // 각 플랫폼 중앙에 배치
            this.model.scale.set(0.5, 0.5, 0.5);
            this.model.rotation.x = Math.PI / 2;
            this.platform.board.scene.add(this.model);
        }, undefined, (error) => {
            console.error('모델 로드 오류:', error);
        });
    }
}

window.onload = function init() {
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
    renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Raycaster와 마우스 벡터 설정
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // 게임 보드와 개구리 모델 설정
    const level1_coordinates = [
        { x: 0, y: 0 },
        { x: 2, y: 2 },
        { x: 1, y: 3 },
        { x: 3, y: 3 }
    ];


    mainBoard = new Board(level1_coordinates)
    console.log("main board:", mainBoard);

    // 마우스 클릭 이벤트 리스너
    window.addEventListener('click', (event) => {
        const canvasBounds = renderer.domElement.getBoundingClientRect();

        // 마우스 좌표 정규화 (canvas 요소 기준)
        mouse.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
        mouse.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

        // Raycaster 설정
        raycaster.setFromCamera(mouse, mainBoard.camera);

        // 클릭된 오브젝트 확인
        const intersects = raycaster.intersectObjects(mainBoard.scene.children, true);
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            // 클릭된 오브젝트의 색상 변경
            if (clickedObject instanceof THREE.Mesh) {
                // clickedObject를 mainBoard 클래스의 clickMesh 메서드로 전송
                mainBoard.clickMesh(clickedObject);
            }
        } else {
            // 오브젝트를 클릭한 것이 아닐 경우 선택 취소
            mainBoard.dismissSelection()
        }
    });

    const controls = new THREE.OrbitControls(mainBoard.camera, renderer.domElement);

    mainBoard.animate()
}

function checkInclusion(mesh, scene) {
    let object = mesh;
    while(object) {
        if (object === scene) {
            return true;
        }
        object = object.parent;
    }
    return false;
}