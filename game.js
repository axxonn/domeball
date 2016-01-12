var container, stats;

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);
  stats = new Stats();
  stats.domElement.style.position = "absolute";
  stats.domElement.style.top = "0px";
  container.appendChild(stats.domElement);
}
init();

var debugText;
function initDebug() {
  debugText = document.createElement("p");
  document.body.appendChild(debugText);
}

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
  player.material.hitColor = new THREE.Color(0, 0, 1);
  player.material.normalColor = player.material.color.clone(); // for now
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
  ball.position.set(0, 1, 0); // eventually want to randomize, as with velocity
  ball.velocity = new THREE.Vector3(0.01, 0.01, 0.1); // !! new property !!
  scene.add(ball);
}

var center = new THREE.Vector3(0, 0, 0);

function onMouseMove(event) {
  mouse.x = (event.clientX / viewWidth) * 2 - 1;
  mouse.y = -(event.clientY / viewHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  var intersect = raycaster.intersectObject(sphere)[0];
  if (intersect) { // check if not null
    player.position.copy(intersect.point);
  } else {
    intersect = raycaster.intersectObject(plane)[0];
    player.position.copy(intersect.point.normalize().multiplyScalar(sphereRadius));
  }
  player.lookAt(center);
}
window.addEventListener('mousemove', onMouseMove, false);

var debug = true; // toggle with 'd' to see sphere/plane
window.addEventListener("keypress", function(event) {
  var key = String.fromCharCode(event.charCode);
  if (key == "d") {
    debug = !debug;
    plane.material.visible = debug;
    sphere.material.visible = debug;
  } else if (key == "r") { // r for reset!
    ball.position.copy(center); // eventually want to randomize (see above (ball initialization))
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

// the following two are the same vector, but we will keep them separate for clarity
const wallNormal = new THREE.Vector3(0, 0, 1); // normal of back wall
const paddleLocalNormal = new THREE.Vector3(0, 0, 1); // local normal of paddle (need to clone and convert to world before using)
var hitWall = 0;
var hitPaddle = 0;
const hitMax = 20;
function update() {
  /* // won't need this anymore, but might keep for powerup or such later
  if (ball.position.length() >= 5 - ballRadius) {
    // multiplyScalar -1 is not really needed but for sake of 'correctness'
    ball.velocity.reflect(ball.position.clone().normalize().multiplyScalar(-1));
  }
  */

  /* test for collision with back wall */
  // risk of jiggly jiggles glitch if we don't have the second check
  if (ball.position.z <= 0 + ballRadius && ball.velocity.dot(wallNormal) < 0) {
    hitWall = hitMax;
    ball.velocity.reflect(wallNormal);
    ball.material.color.copy(ball.material.hitColor);
    //circle.material.color.copy(circle.material.hitColor);
  } else if (hitWall > 0) { // or just if (hitWall)
    hitWall -= 1;
    var p = hitWall / hitMax; // percentage of time left in hit mode
    //_interpolate(circle.material.color, p, circle.material.normalColor, circle.material.hitColor);
    _interpolate(ball.material.color, p, ball.material.normalColor, ball.material.hitColor);
  }

  // should be (0, 0, 5). spent an hour wondering why I kept getting crazy values like
  // -1.3948028, 8.923842, -7.32429, 4.2394809 in x and y until I finally noticed the "e-7" at
  // the end of those numbers
  // debugText.innerHTML = JSON.stringify(player.worldToLocal(new THREE.Vector3()));
  
  /* test for collision with paddle */
  var relativeBallPos = player.worldToLocal(ball.position.clone());
  var paddleWorldNormal;
  if (Math.abs(relativeBallPos.x) <= player.geometry.parameters.width/2 + ballRadius
      && Math.abs(relativeBallPos.y) <= player.geometry.parameters.height/2 + ballRadius
      && Math.abs(relativeBallPos.z) <= player.geometry.parameters.depth/2 + ballRadius
      && ball.velocity.dot(paddleWorldNormal = paddleLocalNormal.clone().applyEuler(player.rotation)) <= 0) {
    // ^ putting this check last because it is checked the least often
    
    // temporarily reflecting as if always off the inner-facing side of the paddle -- doesn't
    // matter too much during "normal" play of the game (wouldn't stay inside if it hit the side
    // of the paddle anyway) but something to keep in mind -- should eventually correct
    ball.velocity.reflect(paddleWorldNormal);
    
    hitPaddle = hitMax;
    player.material.color.copy(player.material.hitColor);
  } else if (hitPaddle > 0) {
    hitPaddle -= 1;
    var p = hitPaddle / hitMax;
    _interpolate(player.material.color, p, player.material.normalColor, player.material.hitColor);
  }

  // all for debugging
  if (keyboard.pressed("right")) player.translateX(0.1);
  if (keyboard.pressed("left")) player.translateX(-0.1);
  if (keyboard.pressed("up")) player.translateY(0.1);
  if (keyboard.pressed("down")) player.translateY(-0.1);
  if (keyboard.pressed("s")) player.translateZ(0.1);
  if (keyboard.pressed("w")) player.translateZ(-0.1);
  
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
  stats.update();
}

initEngine();
initObjects();
initDebug();
animate();
