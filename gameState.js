(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const CANVAS_MIN_WIDTH = 240;
  const CANVAS_MAX_WIDTH = 430;
  const CANVAS_ASPECT_RATIO = 16 / 9;
  const SCREEN_HORIZONTAL_PADDING = 16;
  const SCREEN_VERTICAL_GAP = 24;

  function fitCanvasToPortraitScreen() {
    const hud = document.getElementById("hud");
    const hudHeight = hud ? hud.offsetHeight : 0;

    const availableWidth = Math.max(
      CANVAS_MIN_WIDTH,
      Math.floor(window.innerWidth - SCREEN_HORIZONTAL_PADDING)
    );
    const availableHeight = Math.max(
      Math.floor(CANVAS_MIN_WIDTH * CANVAS_ASPECT_RATIO),
      Math.floor(window.innerHeight - hudHeight - SCREEN_VERTICAL_GAP)
    );

    const widthFromHeight = Math.floor(availableHeight / CANVAS_ASPECT_RATIO);
    const targetWidth = Math.max(
      CANVAS_MIN_WIDTH,
      Math.min(CANVAS_MAX_WIDTH, availableWidth, widthFromHeight)
    );
    const targetHeight = Math.floor(targetWidth * CANVAS_ASPECT_RATIO);

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    canvas.style.width = `${targetWidth}px`;
    canvas.style.height = `${targetHeight}px`;
  }

  fitCanvasToPortraitScreen();

  function loadSavedData() {
    return {};
  }

  const saved = loadSavedData();

  function getWeaponBaseCooldown(name) {
    const map = {
      multishot: 1050,
      flame: 3600,
      spinners: 4000,
      bounceBall: 6000,
      rocket: 1800,
      lightning: 4000,
      boomerang: 1950
    };
    return map[name] || 1500;
  }

  const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 15,
    speed: saved.speed || 3,
    hp: saved.hp || 10,
    maxHp: saved.maxHp || 50,
    level: saved.level || 1,
    xp: saved.xp || 0,
    xpToNext: saved.xpToNext || 5,
    attackSpeed: 500,
    maxWeapons: 6,
    xpRange: saved.xpRange || 50,
    equippedWeapons: saved.equippedWeapons || [
      { name: "bullet", level: 1, active: true, cooldown: 900, lastUsed: 0 }
    ]
  };

  player.equippedWeapons = player.equippedWeapons.map((weapon) => ({
    ...weapon,
    level: weapon.level || 1,
    active: weapon.active ?? true,
    cooldown: weapon.cooldown || getWeaponBaseCooldown(weapon.name),
    // 세션 간 타이머 값이 섞이지 않도록 시작 시점에는 항상 0으로 초기화
    lastUsed: 0
  }));

  const bulletWeapon = player.equippedWeapons.find((weapon) => weapon.name === "bullet");
  if (!bulletWeapon) {
    player.equippedWeapons.unshift({
      name: "bullet",
      level: 1,
      active: true,
      cooldown: getWeaponBaseCooldown("bullet"),
      lastUsed: 0
    });
  } else {
    bulletWeapon.active = true;
  }

  const state = {
    enemies: [],
    bullets: [],
    items: [],
    effects: {
      flames: [],
      spinners: [],
      bounceBalls: [],
      rockets: [],
      lightningStrikes: [],
      boomerangs: [],
    },
    keys: {},
    gamePaused: false,
    gameOver: false,
    joystick: {
      active: false,
      touchId: null,
      baseX: 100,
      baseY: 650,
      radius: 50,
      stickX: 100,
      stickY: 650,
      direction: { x: 0, y: 0 }
    },
    wave: 0,
    waveTimer: 0,
    waveInterval: 15000,
    waveClearDelay: 1200,
    emptyWaveElapsed: 0,
    lastPlayerContactHit: 0,
    lastTimestamp: 0,
    currentUpgradeChoices: []
  };

  function resizeCanvas() {
    const previousWidth = canvas.width;
    const previousHeight = canvas.height;

    fitCanvasToPortraitScreen();

    if (previousWidth > 0 && previousHeight > 0) {
      const ratioX = canvas.width / previousWidth;
      const ratioY = canvas.height / previousHeight;

      player.x = Math.min(canvas.width, Math.max(0, player.x * ratioX));
      player.y = Math.min(canvas.height, Math.max(0, player.y * ratioY));
    }

    state.joystick.baseX = Math.floor(canvas.width * 0.5);
    state.joystick.baseY = Math.min(canvas.height - 55, Math.floor(canvas.height * 0.9));
    state.joystick.radius = Math.max(42, Math.floor(canvas.width * 0.12));

    if (!state.joystick.active) {
      state.joystick.stickX = state.joystick.baseX;
      state.joystick.stickY = state.joystick.baseY;
    }
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  window.GameState = { canvas, ctx, player, state, getWeaponBaseCooldown };
})();
