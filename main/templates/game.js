import {RGBAFormat} from "three";

let mainBoard;

let renderer;

import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const level1_coordinates = [
    { x: 0, y: 0 },
    { x: 2, y: 2 },
    { x: 1, y: 3 },
    { x: 3, y: 3 }
];
const level_coordinates = [
    [
        { x: 0, y: 0 },
        { x: 2, y: 2 },
        { x: 1, y: 3 },
        { x: 3, y: 3 }
    ],
    [
        { x: 3, y: 0 },
        { x: 2, y: 1 },
        { x: 4, y: 1 },
        { x: 2, y: 2 }
    ]
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

        const light2 = new THREE.AmbientLight(0xffffff, 1);
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

        this.pond = this.createPond();
        this.createBoardGameEdges(); // 보드게임판 테두리 추가

        for (let coordinate of coordinates) {
            // 연못 큐브 생성
            if (this.platforms[coordinate.y][coordinate.x]) {
                this.platforms[coordinate.y][coordinate.x].setFrog();
            }
        }
        this.animate(); // 애니메이션 시작
    }

    createBoardGameEdges() {
        const textureLoader = new THREE.TextureLoader();

        // example.jpg 파일을 텍스처로 로드
        textureLoader.load('../assets/wooden-texture.jpg', (texture) => {
            // 텍스처를 사용할 재질 생성
            const woodMaterial = new THREE.MeshPhongMaterial({
                map: texture,
                shininess: 5,
            });

            // 앞면 테두리
            const frontEdge = new THREE.BoxGeometry(7, 2, 0.4);
            const frontEdgesMesh = new THREE.Mesh(frontEdge, woodMaterial);
            frontEdgesMesh.position.set(0, -2.41, -1); // 연못 앞쪽에 위치
            frontEdgesMesh.rotation.x = Math.PI / 2;
            this.scene.add(frontEdgesMesh);

            // 뒷면 테두리
            const backEdge = new THREE.BoxGeometry(7, 2, 0.4);
            const backEdgesMesh = new THREE.Mesh(backEdge, woodMaterial);
            backEdgesMesh.position.set(0, 5, -1); // 연못 뒤쪽에 위치
            backEdgesMesh.rotation.x = Math.PI / 2;
            this.scene.add(backEdgesMesh);

            // 좌측 테두리
            const leftEdge = new THREE.BoxGeometry(7.8, 0.4, 2);
            const leftEdgesMesh = new THREE.Mesh(leftEdge, woodMaterial);
            leftEdgesMesh.position.set(-3.7, 1.3, -1); // 연못 왼쪽에 위치
            leftEdgesMesh.rotation.z = Math.PI / 2;
            this.scene.add(leftEdgesMesh);

            // 우측 테두리
            const rightEdge = new THREE.BoxGeometry(7.8, 0.4, 2);
            const rightEdgesMesh = new THREE.Mesh(rightEdge, woodMaterial);
            rightEdgesMesh.position.set(3.7, 1.3, -1); // 연못 오른쪽에 위치
            rightEdgesMesh.rotation.z = Math.PI / 2;
            this.scene.add(rightEdgesMesh);
        });

    }
    
    

    createPond() {
        const pondGeometry = new THREE.BoxGeometry(7, 7, 1); // 큐브의 크기
    
        // Vertex Shader
        const vertexShader = `
            precision mediump float; // 정밀도 명시
            varying vec3 v_Position;
            uniform float u_time;
    
            void main() {
                v_Position = position; // 현재 위치 전달
                vec3 pos = position.xyz;
    
                // 물결 효과를 위한 수학적 계산
                float wave = 0.15 * (sin(5.0 * pos.x + u_time) + cos(5.0 * pos.z + u_time));
                // pos.y += wave; // Y축으로 물결 효과 적용
    
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
    
        // Fragment Shader
        const fragmentShader = `
            precision mediump float; // 정밀도 명시
            varying vec3 v_Position;
            uniform float u_time;
    
            void main() {
                // 물의 질감을 표현하는 색상 계산
                float wave = 0.15 * (sin(5.0 * v_Position.x + u_time) + cos(5.0 * v_Position.z + u_time));
                vec3 color1 = vec3(0.0, 0.2, 0.7); // 기본 색상
                vec3 color2 = vec3(0.5, 0.7, 1.0); // 물빛 색상
    
                // 두 색상을 혼합하여 물결 효과를 적용
                vec3 finalColor = mix(color1, color2, 0.5 + 0.5 * wave);
                gl_FragColor = vec4(finalColor, 0.8); // 알파값을 포함하여 색상 출력
            }
        `;
    
        // ShaderMaterial 생성
        const pondMaterial = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0 } // 시간 uniform 초기화
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
        });
    
        const pond = new THREE.Mesh(pondGeometry, pondMaterial);
        
        // 연못 위치 설정
        pond.position.set(0, 1.3, -0.51); // z축 방향으로 살짝 아래로 이동
        this.scene.add(pond); // 씬에 추가
    
        return pond; // 연못 메쉬 반환
    }
    
    update() {
        // 시간에 따른 애니메이션 효과
        if (this.pond) { // pond가 정의된 경우에만 업데이트
            this.pond.material.uniforms.u_time.value += 0.05; // 시간을 증가시켜 물결 효과 생성
        }
    }

    
    // 애니메이션 루프
    animate = () => {
        requestAnimationFrame(this.animate);
    
        // 렌더러 크기 설정
        renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
        renderer.setPixelRatio(window.devicePixelRatio);
    
        // 물결 애니메이션 업데이트
        this.update(); // Board 인스턴스에서 update 호출
    
        // 씬 렌더링
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
        if (Math.abs(origin.x - destination.x) === 2 && Math.abs(origin.y - destination.y) === 2) {
            // 두 플랫폼 사이에 있는 플랫폼
            const middlePlatform = this.platforms[(origin.y + destination.y) / 2][(origin.x + destination.x) / 2];
            console.log("lets hop");
            // 사이에 있는 플랫폼에도 개구리가 있을 경우에만 뛰어넘기 수행
            if (middlePlatform.frog) {
                console.log("hop!");
    
                // 개구리 이동 애니메이션
                const startPosition = origin.frog.model.position.clone();
                const endPosition = destination.model.position.clone();
                animateMove(startPosition, endPosition, origin.frog);
    
                // 출발지와 도착지 개구리 처리
                
                destination.frog = origin.frog;
                origin.frog = null;
                
                const jumpsound = new Audio('../assets/jumpsound.mp3');
                const jumpsound2 = new Audio('../assets/jumpsound.mp3');
                // 사운드 재생
                jumpsound.play();
  
                setTimeout(() => {
                  // 0.5초 후에 실행할 코드
                  jumpsound2.play();
                  middlePlatform.removeFrog();
                }, 360); // 500ms = 0.5초
                
                this.selectedPlatform = null;
  
                destination.frog.model.traverse(child => {
                  if (child.isMesh) {
                      child.material.color.set(0xB4FF80);
                  }
              });
                // hop의 결과 개구리가 한 개만 남았다면 승리 메세지 출력
                if (this.checkVictory()) {
                    document.getElementById("scoreboard").textContent = "cleared!";
                    console.log("stage cleared!");
                }
            }
        }
    }
    
    
  }
  function animateMove(startPosition, endPosition, frog) {
    function findMeshInGroup(group) {
      group.children.forEach(child => {
          if (child instanceof THREE.Mesh && child.name === 'frog111') {
              console.log("특정 Mesh 찾음:", child);
              animateJumpShapeKey(child); // jump 애니메이션 적용
          } else if (child instanceof THREE.Group) {
              console.log("Group 객체를 찾음:", child);
              findMeshInGroup(child); // 자식이 Group일 경우 재귀적으로 탐색
          }
      });
    }
  
    // frog.model이 그룹이라면 그 그룹 안에서 메시를 찾아야 함
    if (frog.model instanceof THREE.Group) {
      findMeshInGroup(frog.model);
    } else {
      console.log('frog.model은 Group이 아닙니다.');
    }
  
    const duration = 1; // 이동 애니메이션 시간
    let startTime = null;
  
    // 이동 중 개구리가 회전하도록 처리
    function animate(time) {
      if (startTime === null) startTime = time;
      const elapsed = (time - startTime) / 750; // 시간 초 단위로 계산
      const progress = Math.min(elapsed / duration, 1);
    
      // 기본 z축 위치 고정
      const baseZ = startPosition.z;
    
      // 개구리의 위치를 점진적으로 이동
      frog.model.position.lerpVectors(startPosition, endPosition, progress);
    
      // 점프 곡선 생성 (2번 점프하게끔 주기를 2배로 설정하고, Math.abs로 음수 방지)
      const jumpHeight = 1; // 점프 높이 설정
      frog.model.position.z = baseZ + jumpHeight * 1.7 *Math.abs(Math.sin(2 * Math.PI * progress));
    
      // 목표 위치를 향한 방향 계산 (회전할 방향)
      const direction = new THREE.Vector3().subVectors(endPosition, startPosition).normalize();
      let deg;
      if (startPosition.x < endPosition.x) {
        deg = (startPosition.y < endPosition.y) ? 2 : 1;
      } else {
        deg = (startPosition.y < endPosition.y) ? -2 : -1;
      }
    
      // 개구리의 회전: x, y 방향만 변경하고 z는 고정
      frog.model.rotation.y = deg;
    
      // 애니메이션이 끝났을 때
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log("Move completed.");
      }
    }
    
  
  
    // 애니메이션 시작
    requestAnimationFrame(animate);
  }
  function animateJumpShapeKey(mesh) {
    console.log("jump");//점프 애니메이션 동작
    const duration = 0.06; // 'jump' 애니메이션 시간
    const returnDuration = 0.7; // 원래 자세로 돌아오는 애니메이션 시간
    let startTime = null;
  
    // ShapeKey 애니메이션 함수
    function animate(time) {
        if (startTime === null) startTime = time;
        const elapsed = (time - startTime) / 1000; // 시간 초 단위로 계산
  
        // jump 애니메이션 (progress 0 ~ 1)
        const progress = Math.min(elapsed / duration, 1);
        mesh.morphTargetInfluences[mesh.morphTargetDictionary['jump']] = progress;
  
        // 애니메이션이 끝났을 때 (jump 애니메이션 끝난 후)
        if (progress === 1) {
            // 원래 자세로 돌아가는 애니메이션
            const returnStartTime = time;
  
            function returnToOriginalPose(returnTime) {
                const returnElapsed = (returnTime - returnStartTime) / 1000; // 시간 초 단위로 계산
                const returnProgress = Math.min(returnElapsed / returnDuration, 1);
  
                // 'jump'를 0으로 설정하여 원래 자세로 돌아가게 함
                mesh.morphTargetInfluences[mesh.morphTargetDictionary['jump']] = 1 - returnProgress;
  
                // 원래 자세로 돌아간 후 애니메이션 종료
                if (returnProgress < 1) {
                    requestAnimationFrame(returnToOriginalPose);
                } else {
                    console.log('Returned to original pose.');
                }
            }
  
            requestAnimationFrame(returnToOriginalPose);
        } else {
            requestAnimationFrame(animate);
        }
    }
  
    // 애니메이션 시작
    requestAnimationFrame(animate);
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
        const loader = new GLTFLoader();
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
                    color: 0xFFFF00,
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
        // 스포트라이트 생성
        const spotlight = new THREE.SpotLight(0xffff00, 15);
        spotlight.angle = Math.PI / 10; // 빛 확산 각도 설정
        spotlight.penumbra = 1.0; // 부드러운 가장자리 설정
        spotlight.decay = 1; // 빛 감쇠율 설정
        spotlight.distance = 10; // 빛이 비치는 거리 설정

        // 스포트라이트 위치 설정 (연잎 위에 위치시킴)
        spotlight.position.set(object.position.x, object.position.y, object.position.z+3);

        // 스포트라이트가 연잎을 바라보도록 타겟 설정
        spotlight.target = object;

        // 스포트라이트와 타겟을 장면에 추가
        this.board.scene.add(spotlight);
        this.board.scene.add(spotlight.target);
    }

    setFrog() {
        if (this.x === 2 && this.y === 2) {
            this.frog = new StoneFrog(this);
        }
        else if (this.x === 1 && this.y === 3){
            this.frog = new blueFrog(this);
        }
        else {
            this.frog = new Frog(this);
        }
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
        this.platform = platform;
        this.model = null; // 모델이 아직 로드되지 않음을 나타냄
        // 개구리 모델 로드
        const loader = new GLTFLoader();
        loader.load('../assets/frog.glb', (gltf) => {
            this.model = gltf.scene;

            this.model.position.set((this.platform.x - 2) * 1.3, (this.platform.y - 1) * 1.3, 0.5); // 각 플랫폼 중앙에 배치
            this.model.scale.set(0.5, 0.5, 0.5);
            this.model.rotation.x = Math.PI / 2;
            this.platform.board.scene.add(this.model);

            // StoneFrog인지 체크하고 돌 같은 질감 적용
            if (this instanceof StoneFrog) {
                this.applyStoneTexture();
            }

            if (this instanceof blueFrog) {
                this.applyBlueTexture();
            }

        }, undefined, (error) => {
            console.error('모델 로드 오류:', error);
        });
    }
}

class StoneFrog extends Frog {
    constructor(platform) {
        super(platform);
    }

    applyStoneTexture() {
        const textureLoader = new THREE.TextureLoader();
        const stoneTexture = textureLoader.load('../assets/stone_texture.jpg');  // stone_texture 이미지 경로

        this.model.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    map: stoneTexture, // stone_texture 이미지를 사용
                    roughness: 0.9,  // 거칠기
                    metalness: 0.2,  // 금속성
                });
            }
        });
    }
}

class blueFrog extends Frog {
    constructor(platform) {
        super(platform);
    }

    applyBlueTexture() {
        this.model.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0x87CEFA
                });
            }
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

    const controls = new OrbitControls(mainBoard.camera, renderer.domElement);

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

function createWoodGrainTexture() {
    const width = 256;  // 텍스처 너비
    const height = 256; // 텍스처 높이
    const size = width * height;
    const data = new Uint8Array(size * 10); // RGB를 위한 배열

    for (let i = 0; i < size; i++) {
        const x = i % width;
        const y = Math.floor(i / width);

        // 가로선 나무 결 패턴
        const grain = Math.sin(y / 15) * 10; // 가로 방향 패턴
        const baseColor = 80; // 갈색 톤을 위한 기본 색상값

        // 나무 색상 계산
        const red = baseColor + grain + Math.random() * 50; // 빨간색
        const green = baseColor + grain * 0.5; // 초록색
        const blue = baseColor; // 파란색을 줄여 더 갈색으로

        // 색상 값의 범위를 0-255로 제한
        data[i * 3] = Math.min(255, Math.max(0, red));   // R
        data[i * 3 + 1] = Math.min(255, Math.max(0, green)); // G
        data[i * 3 + 2] = Math.min(255, Math.max(0, blue));  // B
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.needsUpdate = true; // 텍스처 업데이트
    return texture;
}
