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

var plane, sphere, circle, player, ball;

var scaling = 0.9;
viewWidth = window.innerWidth * scaling;
viewHeight = window.innerHeight * scaling;

function initEngine() {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  keyboard = new THREEx.KeyboardState();

  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(90, viewWidth / viewHeight, 0.1, 1000);
  var r = viewWidth / viewHeight;
  var x = 6; // should be a bit greater than sphereRadius -- not coding it for now but keep in mind
  //camera = new THREE.OrthographicCamera(-x*r, x*r, x, -x, 1, 1000);
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

var paddleSize = 1;
var sphereRadius = 5;
var ballRadius = 0.2;

function initObjects() {
  player = new THREE.Mesh(
    new THREE.BoxGeometry(paddleSize, paddleSize, 0.2),
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
    new THREE.SphereGeometry(sphereRadius, 48, 48),
    new THREE.MeshBasicMaterial({color: 0xaaaaff, transparent: true, opacity: 0.5, visible: debug})
  );
  scene.add(sphere);

  circle = new THREE.Mesh(
      new THREE.CircleGeometry(sphereRadius, 60),
      new THREE.MeshBasicMaterial(/*{color:0xaaaaff}*/) // using rgb for now for easier math
  );
  circle.material.normalColor = new THREE.Color(0.6, 0.6, 1); // !! new property !!
  circle.material.hitColor = new THREE.Color(0.7, 0.7, 1); // !! new property !!
  circle.material.color.copy(circle.material.normalColor);
  scene.add(circle);

  ball = new THREE.Mesh(
    new THREE.SphereGeometry(ballRadius, 12, 12),
    new THREE.MeshBasicMaterial(/*{color: 0xffffff}*/)
  );
  ball.material.normalColor = new THREE.Color(1, 1, 1);
  ball.material.hitColor = new THREE.Color(1, 0, 0);
  ball.material.color.copy(ball.material.normalColor);
  ball.position.set(0, 1, 0);
  ball.velocity = new THREE.Vector3(0.01, 0.01, 0.1); // !! new property !!
  scene.add(ball);
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

/* target = (1 - alpha)*color1 + alpha*color2 */
function _interpolate(target, alpha, color1, color2) {
  target.setRGB(
    color2.r * alpha + color1.r * (1 - alpha),
    color2.g * alpha + color1.g * (1 - alpha),
    color2.b * alpha + color1.b * (1 - alpha)
  );
}
  
var normal = new THREE.Vector3(0, 0, 1);
var hit = 0;
const hitMax = 20;
function update() {
  if (ball.position.length() >= 5 - ballRadius) {
    // multiplyScalar -1 is not really needed but for sake of 'correctness'
    ball.velocity.reflect(ball.position.clone().normalize().multiplyScalar(-1));
  }
  // risk of jiggly jiggles glitch if we don't have the second check
  if (ball.position.z <= 0 + ballRadius && ball.velocity.dot(normal) < 0) {
    hit = hitMax;
    ball.velocity.reflect(normal);
    ball.material.color.copy(ball.material.hitColor);
    //circle.material.color.copy(circle.material.hitColor);
  } else if (hit > 0) { // or just if (hit)
    hit -= 1;
    var p = hit / hitMax; // percentage of time left in hit mode
    //_interpolate(circle.material.color, p, circle.material.normalColor, circle.material.hitColor);
    _interpolate(ball.material.color, p, ball.material.normalColor, ball.material.hitColor);
    //ball.material.color.copy(ball.material.normalColor);
  }
  ball.position.add(ball.velocity);
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
