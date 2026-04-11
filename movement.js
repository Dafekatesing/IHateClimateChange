(() => {
const { canvas, player, state } = window.GameState;

const CONFIG = {
  ZERO: 0,
  UNIT: 1,
  PRIMARY_TOUCH_INDEX: 0,
  IDLE_DIRECTION: { x: 0, y: 0 },
  KEY_UP: "ArrowUp",
  KEY_DOWN: "ArrowDown",
  KEY_LEFT: "ArrowLeft",
  KEY_RIGHT: "ArrowRight",
  EVENT_KEYDOWN: "keydown",
  EVENT_KEYUP: "keyup",
  EVENT_TOUCHSTART: "touchstart",
  EVENT_TOUCHMOVE: "touchmove",
  EVENT_TOUCHEND: "touchend"
};

function setupInput() {
  document.addEventListener(CONFIG.EVENT_KEYDOWN, (event) => {
    state.keys[event.key] = true;
  });

  document.addEventListener(CONFIG.EVENT_KEYUP, (event) => {
    state.keys[event.key] = false;
  });

  canvas.addEventListener(CONFIG.EVENT_TOUCHSTART, handleTouchStart, { passive: false });
  canvas.addEventListener(CONFIG.EVENT_TOUCHMOVE, handleTouchMove, { passive: false });
  canvas.addEventListener(CONFIG.EVENT_TOUCHEND, handleTouchEnd, { passive: false });
}

function handleTouchStart(event) {
  event.preventDefault();
  const touch = event.touches[CONFIG.PRIMARY_TOUCH_INDEX];
  const x = touch.clientX - canvas.offsetLeft;
  const y = touch.clientY - canvas.offsetTop;

  const joystick = state.joystick;
  const dx = x - joystick.baseX;
  const dy = y - joystick.baseY;
  const distSq = dx * dx + dy * dy;
  if (distSq < joystick.radius * joystick.radius) {
    joystick.active = true;
    joystick.touchId = touch.identifier;
    joystick.stickX = x;
    joystick.stickY = y;
    updateJoystickDirection();
  }
}

function handleTouchMove(event) {
  event.preventDefault();
  const joystick = state.joystick;
  if (!joystick.active) return;

  const touch = Array.from(event.touches).find((item) => item.identifier === joystick.touchId);
  if (!touch) return;

  const x = touch.clientX - canvas.offsetLeft;
  const y = touch.clientY - canvas.offsetTop;
  const dx = x - joystick.baseX;
  const dy = y - joystick.baseY;
  const dist = Math.hypot(dx, dy);

  if (dist > joystick.radius) {
    joystick.stickX = joystick.baseX + (dx / dist) * joystick.radius;
    joystick.stickY = joystick.baseY + (dy / dist) * joystick.radius;
  } else {
    joystick.stickX = x;
    joystick.stickY = y;
  }

  updateJoystickDirection();
}

function handleTouchEnd(event) {
  event.preventDefault();
  const joystick = state.joystick;
  if (!joystick.active) return;

  const touch = Array.from(event.changedTouches).find((item) => item.identifier === joystick.touchId);
  if (!touch) return;

  joystick.active = false;
  joystick.touchId = null;
  joystick.stickX = joystick.baseX;
  joystick.stickY = joystick.baseY;
  joystick.direction = { ...CONFIG.IDLE_DIRECTION };
}

function updateJoystickDirection() {
  const joystick = state.joystick;
  const dx = joystick.stickX - joystick.baseX;
  const dy = joystick.stickY - joystick.baseY;
  const dist = Math.hypot(dx, dy);

  if (dist > CONFIG.ZERO) {
    joystick.direction.x = dx / dist;
    joystick.direction.y = dy / dist;
    return;
  }

  joystick.direction = { ...CONFIG.IDLE_DIRECTION };
}

function movePlayer() {
  let dx = CONFIG.ZERO;
  let dy = CONFIG.ZERO;

  if (state.keys[CONFIG.KEY_UP]) dy -= CONFIG.UNIT;
  if (state.keys[CONFIG.KEY_DOWN]) dy += CONFIG.UNIT;
  if (state.keys[CONFIG.KEY_LEFT]) dx -= CONFIG.UNIT;
  if (state.keys[CONFIG.KEY_RIGHT]) dx += CONFIG.UNIT;

  dx += state.joystick.direction.x;
  dy += state.joystick.direction.y;

  const dist = Math.hypot(dx, dy);
  if (dist > CONFIG.ZERO) {
    dx /= dist;
    dy /= dist;
  }

  player.x += dx * player.speed;
  player.y += dy * player.speed;

  if (player.x < CONFIG.ZERO) player.x = CONFIG.ZERO;
  if (player.x > canvas.width) player.x = canvas.width;
  if (player.y < CONFIG.ZERO) player.y = CONFIG.ZERO;
  if (player.y > canvas.height) player.y = canvas.height;
}

function moveEnemies() {
  state.enemies.forEach((enemy) => {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);

    if (dist > CONFIG.ZERO) {
      enemy.x += (dx / dist) * enemy.speed;
      enemy.y += (dy / dist) * enemy.speed;
    }

    if (enemy.x < CONFIG.ZERO) enemy.x = CONFIG.ZERO;
    if (enemy.x > canvas.width) enemy.x = canvas.width;
    if (enemy.y < CONFIG.ZERO) enemy.y = CONFIG.ZERO;
    if (enemy.y > canvas.height) enemy.y = canvas.height;
  });
}

function moveBullets() {
  state.bullets = state.bullets.filter((bullet) => (
    bullet.x > CONFIG.ZERO && bullet.x < canvas.width &&
    bullet.y > CONFIG.ZERO && bullet.y < canvas.height
  ));

  state.bullets.forEach((bullet) => {
    bullet.x += bullet.dx * bullet.speed;
    bullet.y += bullet.dy * bullet.speed;
  });
}

window.MovementModule = { setupInput, movePlayer, moveEnemies, moveBullets };
})();
