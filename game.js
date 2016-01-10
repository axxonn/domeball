var container, stats;

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);
  stats = new Stats();
  stats.domElement.style.position = "absolute";
  stats.domElement.style.top = "0px";
  container.appendChild(stats.domElement);
}
//init();

var raycaster, mouse;
var keyboard;
var controls;

var scene, camera, renderer;

var plane, sphere, player;

var scaling = 0.9;
viewWidth = window.innerWidth * scaling;
viewHeight = window.innerHeight * scaling;

function initEngine() {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  keyboard = new THREEx.KeyboardState();

  scene = new THREE.Scene();
  
  //camera = new THREE.PerspectiveCamera(75, viewWidth / viewHeight, 0.1, 1000);
  var r = viewWidth / viewHeight;
  var x = 5;
  camera = new THREE.OrthographicCamera(-x*r, x*r, x, -x, 1, 1000);
  camera.position.set(0, 0, 10);
  camera.lookAt(scene.position);

  //scene.fog = new THREE.Fog(0xaaaaaa, 25, 30);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(viewWidth, viewHeight);
  document.body.appendChild(renderer.domElement);

  // mainly for debugging, might use it for something else later
  controls = new THREE.TrackballControls( camera );
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;
}

var sphereRadius = 5;

function initObjects() {
  player = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 0.2),
    new THREE.MeshBasicMaterial({color: 0xdd2222})
  );
  scene.add(player);

  plane = new THREE.Mesh(
    // needs to be fixed to fill the screen exactly based on resolution
    new THREE.PlaneBufferGeometry(25, 20, 2, 2),
    new THREE.MeshBasicMaterial({color: 0xaaffaa, visible: debug})
  );
  scene.add(plane);

  sphere = new THREE.Mesh(
    new THREE.SphereGeometry(sphereRadius, 24, 24),
    new THREE.MeshBasicMaterial({color: 0xaaaaff, visible: debug})
  );
  scene.add(sphere);
}

var center = new THREE.Vector3(0, 0, 0);

//var text = document.createElement("p");
//document.body.appendChild(text);
function onMouseMove(event) {
  mouse.x = (event.clientX / viewWidth) * 2 - 1;
  mouse.y = -(event.clientY / viewHeight) * 2 + 1;
  // text.innerHTML = (mouse.x + ", " + mouse.y);
  raycaster.setFromCamera(mouse, camera);
  var intersect = raycaster.intersectObject(sphere)[0];
  if (intersect) { // check if not null
    player.position.copy(intersect.point);
  } else {
    intersect = raycaster.intersectObject(plane)[0];
    player.position.copy(intersect.point.normalize().multiplyScalar(sphereRadius));
  }
  //text.innerHTML = (player.position.x + ", " + player.position.y + ", " + player.position.z);
  player.lookAt(center);
}
window.addEventListener('mousemove', onMouseMove, false);

var debug = true; // toggle with 'd' to see sphere/plane
window.addEventListener("keypress", function(event) {
  if (String.fromCharCode(event.charCode) == "d") {
    debug = !debug;
    plane.material.visible = debug;
    sphere.material.visible = debug;
  }  
});

var player_delta = 0.2;
function update() {
//  if (keyboard.pressed("down"))
//    player.translateY(-player_delta);
//  if (keyboard.pressed("up"))
//    player.translateY(player_delta);
//  if (keyboard.pressed("left"))
//    player.translateX(-player_delta);
//  if (keyboard.pressed("right"))
//    player.translateX(player_delta);
}

function render() {
  controls.update();
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  render();
  update();
  //stats.update();
}

initEngine();
initObjects();
animate();
