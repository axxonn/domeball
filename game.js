var container, stats;

function initContainer() {
  container = document.createElement("div");
  document.body.appendChild(container);
  stats = new Stats();
  stats.domElement.style.position = "absolute";
  stats.domElement.style.top = "0px";
  container.appendChild(stats.domElement);
}

var debugText;
function initDebug() {
  debugText = document.createElement("p");
  document.body.appendChild(debugText);
}

var raycaster, mouse;
var keyboard;
var controls;

var scene, camera, renderer;
var PERSPECTIVE_CAMERA, ORTHOGRAPHIC_CAMERA;

var plane, sphere, circle;
var player, playerLine;
var ball, ballSphere, ballLine, ballLineCircle, ballLineProjectedPoint;

var scaling = 0.9;
var viewWidth = window.innerWidth * scaling;
var viewHeight = window.innerHeight * scaling;

function initEngine() {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  keyboard = new THREEx.KeyboardState();

  scene = new THREE.Scene();
  
  var r = viewWidth / viewHeight;
  var x = 6; // should be a bit greater than sphereRadius -- not coding it for now but keep in mind
  ORTHOGRAPHIC_CAMERA = new THREE.OrthographicCamera(-x*r, x*r, x, -x, 1, 1000);
  ORTHOGRAPHIC_CAMERA.position.set(0, 0, 10);
  ORTHOGRAPHIC_CAMERA.lookAt(scene.position);
  PERSPECTIVE_CAMERA = new THREE.PerspectiveCamera(90, r, 0.1, 1000);
  PERSPECTIVE_CAMERA.position.set(0, 0, 10);
  PERSPECTIVE_CAMERA.lookAt(scene.position);
  camera = PERSPECTIVE_CAMERA;

  // just a little bit of directional light with an emphasis on the ambient --
  // don't want the shadowed sides to be too dark
  var directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);
  var ambientLight = new THREE.AmbientLight(0xaaaaaa);
  scene.add(ambientLight);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(viewWidth, viewHeight);
  document.body.appendChild(renderer.domElement);

  // mainly for debugging, might use it for something else later
  controls = new THREE.TrackballControls(camera);
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;
}

function initPlayer(size) {
  player = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, 0.2),
    new THREE.MeshLambertMaterial({color: 0xdd2222})
  );
  player.userData.normalColor = player.material.color.clone(); // for now
  player.userData.hitColor = new THREE.Color(0, 0, 1);
  scene.add(player);
  
  var playerLineMaterial = new THREE.LineDashedMaterial({color: 0x0000ff, dashSize: 0.1, gapSize: 0.1});
  var playerLineGeometry = new THREE.Geometry();
  playerLineGeometry.vertices.push(
    new THREE.Vector3(0, 0, 0),
    player.position // literally uses the vector, so follows the player!
    //player.position.clone().projectOnPlane(wallNormal)
  );
  // would have been great if this had been documented on the dashed material page thx
  playerLineGeometry.computeLineDistances();
  playerLine = new THREE.Line(playerLineGeometry, playerLineMaterial);
  scene.add(playerLine);
}

function initBall(radius) {
  ball = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 12, 12),
    new THREE.MeshBasicMaterial() // color is set below
  );
  ball.userData.normalColor = new THREE.Color(1, 1, 1);
  ball.userData.hitColor = new THREE.Color(1, 0, 0);
  ball.material.color.copy(ball.userData.normalColor);
  ball.position.set(0, 1, 0); // eventually want to randomize, as with velocity
  ball.userData.velocity = new THREE.Vector3(0.01, 0.01, 0.1);
  scene.add(ball);

  ballSphere = new THREE.Mesh(
    // radius NEEDS to be 1 because we are scaling it by the ball position length
    new THREE.SphereGeometry(1, 24, 24), 
    new THREE.MeshBasicMaterial({color: 0xaaaaff, transparent: true, opacity: 0.5})
  );
  ballSphere.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  scene.add(ballSphere);
  //var wireframe = new THREE.WireframeHelper(ballSphere, 0x555555);
  //scene.add(wireframe);
  
  ballLineProjectedPoint = ball.position.clone().projectOnPlane(wallNormal);

  var ballLineMaterial = new THREE.LineDashedMaterial({color: 0x333333, dashSize: 0.1, gapSize: 0.1});
  var ballLineGeometry = new THREE.Geometry();
  ballLineGeometry.vertices.push(
    new THREE.Vector3(0, 0, 0),
    ball.position, // literally uses the vector, so follows the ball!
    ballLineProjectedPoint
  );
  // would have been great if this had been documented on the dashed material page thx
  ballLineGeometry.computeLineDistances();
  ballLine = new THREE.Line(ballLineGeometry, ballLineMaterial);
  scene.add(ballLine);

  // radius NEEDS to be 1 because we are scaling it by projected ball position length
  var ballLineCircleGeometry = new THREE.CircleGeometry(1, 48);
  ballLineCircleGeometry.vertices.shift(); // remove center vertex
  ballLineCircleGeometry.computeLineDistances();
  ballLineCircle = new THREE.Line(ballLineCircleGeometry, ballLineMaterial);
  scene.add(ballLineCircle);
}

function initBackground(radius) {
  plane = new THREE.Mesh(
    // needs to be fixed to fill the screen exactly based on resolution
    new THREE.PlaneBufferGeometry(25, 20, 2, 2),
    new THREE.MeshBasicMaterial({color: 0xaaffaa, visible: debug})
  );
  scene.add(plane);

  sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 48),
    new THREE.MeshBasicMaterial({color: 0xaaaaff, transparent: true, opacity: 0.5, visible: debug})
  );
  scene.add(sphere);

  circle = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 60),
      new THREE.MeshBasicMaterial() // color is set below
  );
  circle.userData.normalColor = new THREE.Color(0.6, 0.6, 1);
  circle.userData.hitColor = new THREE.Color(0.7, 0.7, 1);
  circle.material.color.copy(circle.userData.normalColor);
  scene.add(circle);
}

const paddleSize = 1;
const sphereRadius = 5;
const ballRadius = 0.2;

function initObjects() {
  initPlayer(paddleSize);
  initBall(ballRadius);
  initBackground(sphereRadius);
}

const CENTER = new THREE.Vector3(0, 0, 0);

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
  player.lookAt(CENTER);

  playerLine.geometry.computeLineDistances();
  playerLine.geometry.verticesNeedUpdate = true;
  playerLine.geometry.lineDistancesNeedUpdate = true;
}
window.addEventListener('mousemove', onMouseMove, false);

var debug = true; // toggle with 'd' to see sphere/plane
var lines = true;
var pause = false;
window.addEventListener("keypress", function(event) {
  var key = String.fromCharCode(event.charCode);
  if (key == "d") {
    debug = !debug;
    plane.material.visible = debug;
    sphere.material.visible = debug;
  } else if (key == "r") { // r for reset!
    ball.position.copy(CENTER); // eventually want to randomize (see above (ball initialization))
  } else if (key == "c") { // c for camera!
    if (camera == PERSPECTIVE_CAMERA)
      camera = ORTHOGRAPHIC_CAMERA;
    else
      camera = PERSPECTIVE_CAMERA;
  } else if (key == "p") {
    pause = !pause;
    if (pause) {
      window.removeEventListener('mousemove', onMouseMove, false);
      ball.userData.storedVelocity = ball.userData.velocity;
      ball.userData.velocity = new THREE.Vector3(0, 0, 0);
    } else {
      window.addEventListener('mousemove', onMouseMove, false);
      ball.userData.velocity = ball.userData.storedVelocity;
    }
  } else if (key == "l") {
    lines = !lines;
    playerLine.material.visible = lines;
    ballLine.material.visible = lines;
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

// may be useful later
/* assumes planeNormal is of unit length */
function _distancePointPlane(point, planePoint, planeNormal) {
  var dist = planeNormal.x * (point.x - planePoint.x) +
             planeNormal.y * (point.y - planePoint.y) +
             planeNormal.z * (point.z - planePoint.z);
  return Math.abs(dist);
}
/* example usage:
 * var distance = _distancePointPlane(
 *   ball.position,
 *   player.localToWorld(paddleLocalFrontFace.clone()),
 *   paddleLocalNormal.clone().applyEuler(player.rotation)
 * );
 * if (distance <= ballRadius) {
 *   ...
 */


const debugSpeed = 0.005
function handleKeyboard() {
  if (keyboard.pressed("right")) player.translateX(debugSpeed);
  if (keyboard.pressed("left")) player.translateX(-debugSpeed);
  if (keyboard.pressed("up")) player.translateY(debugSpeed);
  if (keyboard.pressed("down")) player.translateY(-debugSpeed);
  if (keyboard.pressed("s")) player.translateZ(debugSpeed);
  if (keyboard.pressed("w")) player.translateZ(-debugSpeed);
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
    ball.userData.velocity.reflect(ball.position.clone().normalize().multiplyScalar(-1));
  }
  */

  /* test for collision with back wall */
  // risk of jiggly jiggles glitch if we don't have the second check
  if (ball.position.z <= 0 + ballRadius && ball.userData.velocity.dot(wallNormal) < 0) {
    hitWall = hitMax;
    ball.userData.velocity.reflect(wallNormal);
    ball.material.color.copy(ball.userData.hitColor);
    //circle.material.color.copy(circle.userData.hitColor);
  } else if (hitWall > 0) { // or just if (hitWall)
    hitWall -= 1;
    var p = hitWall / hitMax; // percentage of time left in hit mode
    //_interpolate(circle.material.color, p, circle.userData.normalColor, circle.userData.hitColor);
    _interpolate(ball.material.color, p, ball.userData.normalColor, ball.userData.hitColor);
  }

  // should be (0, 0, 5). spent an hour wondering why I kept getting crazy values like
  // -1.3948028, 8.923842, -7.32429, 4.2394809 in x and y until I finally noticed the "e-7" at
  // the end of those numbers
  // debugText.innerHTML = JSON.stringify(player.worldToLocal(new THREE.Vector3()));
  
  /* test for collision with paddle */
  var relativeBallPos = player.worldToLocal(ball.position.clone());
  var paddleWorldNormal;
  if (Math.abs(relativeBallPos.x) <= player.geometry.parameters.width/2
      && Math.abs(relativeBallPos.y) <= player.geometry.parameters.height/2
      && Math.abs(relativeBallPos.z) <= player.geometry.parameters.depth/2 + ballRadius
      && ball.userData.velocity.dot(paddleWorldNormal = paddleLocalNormal.clone().applyEuler(player.rotation)) <= 0) {
    // ^ putting this check last because it is checked the least often

    // temporarily reflecting as if always off the inner-facing side of the paddle -- doesn't
    // matter too much during "normal" play of the game (wouldn't stay inside if it hit the side
    // of the paddle anyway) but something to keep in mind -- should eventually correct
    ball.userData.velocity.reflect(paddleWorldNormal);
    
    hitPaddle = hitMax;
    player.material.color.copy(player.userData.hitColor);
  } else if (hitPaddle > 0) {
    hitPaddle -= 1;
    var p = hitPaddle / hitMax;
    _interpolate(player.material.color, p, player.userData.normalColor, player.userData.hitColor);
  }
 
  ball.position.add(ball.userData.velocity);
  var newRadius = ball.position.length();
  ballSphere.scale.set(newRadius, newRadius, newRadius);
  
  ballLineProjectedPoint.copy(ball.position.clone().projectOnPlane(wallNormal));
  ballLine.geometry.computeLineDistances();
  ballLine.geometry.verticesNeedUpdate = true;
  ballLine.geometry.lineDistancesNeedUpdate = true;

  var l = ballLineProjectedPoint.length();
  ballLineCircle.scale.set(l, l, l);

  handleKeyboard();
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

initContainer();
initEngine();
initObjects();
initDebug();
animate();
