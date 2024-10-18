let gl;
let thetaLoc;
let theta = [10, 40, 70];
let delay = 50;
let direction = true; // true is clockwise
let intervalID;
let vertices;
let vertexColors;
let points = [];
let colors = [];
let axis = 0;
const xAxis = 0;
const yAxis = 1;
const zAxis = 2;
window.onload = function init() {
    const canvas = document.getElementById('gl-canvas');
    gl = WebGLUtils.setupWebGL( canvas );
    if (!gl) alert("WebGL is not supported!");

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);

    gl.enable(gl.DEPTH_TEST);

    const program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    vertices = [
        vec4(-0.5, -0.5,  0.5, 1.0),
        vec4(-0.5,  0.5,  0.5, 1.0),
        vec4( 0.5,  0.5,  0.5, 1.0),
        vec4( 0.5, -0.5,  0.5, 1.0),
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4(-0.5,  0.5, -0.5, 1.0),
        vec4( 0.5,  0.5, -0.5, 1.0),
        vec4( 0.5, -0.5, -0.5, 1.0)
    ]

    vertexColors = [
        [0.0, 0.0, 0.0, 1.0],
        [1.0, 0.0, 0.0, 1.0],
        [1.0, 1.0, 0.0, 1.0],
        [0.0, 1.0, 0.0, 1.0],
        [0.0, 0.0, 1.0, 1.0],
        [1.0, 0.0, 1.0, 1.0],
        [1.0, 1.0, 1.0, 1.0],
        [0.0, 1.0, 1.0, 1.0],
    ]

    colorCube();

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    const vPositionLoc = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPositionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPositionLoc);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    const vColorLoc = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColorLoc);

    thetaLoc = gl.getUniformLocation(program, "theta");

    const rotateXButton = document.getElementById("x-rotate");
    const rotateYButton = document.getElementById("y-rotate");
    const rotateZButton = document.getElementById("z-rotate");
    rotateXButton.onclick = function () { axis = xAxis; }
    rotateYButton.onclick = function () { axis = yAxis; }
    rotateZButton.onclick = function () { axis = zAxis; }

    setInterval(rotateCube, delay);
}

function colorCube(){
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function quad(v1, v2, v3, v4) {
    points.push(vertices[v1], vertices[v2], vertices[v3], vertices[v1], vertices[v3], vertices[v4]);
    colors.push(vertexColors[v1], vertexColors[v1], vertexColors[v1], vertexColors[v1], vertexColors[v1], vertexColors[v1]);
}

function rotateCube(){
    addTheta(axis, 2);
}

function addTheta(axis, value) {
    theta[axis] += value;
    gl.uniform3fv(thetaLoc, theta);

    render();
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
}