(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 400;
  canvas.height = 800;

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

  window.GameState = { canvas, ctx, player, state, getWeaponBaseCooldown };
})();
