(() => {
const { canvas, player, state } = window.GameState;

const CONFIG = {
  BULLET_SPEED: 6,
  DEFAULT_FLAME_COUNT: 1,
  FLAME_DEFAULT_DURATION_MS: 3000,
  FLAME_RADIUS: 55,
  FLAME_TICK_INTERVAL_MS: 300,
  FLAME_DAMAGE: 1,
  SPINNER_DEFAULT_DURATION_MS: 6000,
  SPINNER_SKILL_DURATION_MS: 2000,
  SPINNER_LEVEL_BONUS: 2,
  SPINNER_MAX_COUNT: 7,
  SPINNER_DISTANCE: 60,
  SPINNER_RADIUS: 8,
  SPINNER_ANGULAR_SPEED: 0.12,
  SPINNER_DAMAGE: 0.2,
  BOUNCE_BALL_SPEED: 5,
  BOUNCE_BALL_MAX_BOUNCES: 3,
  BOUNCE_BALL_HIT_PADDING: 8,
  BOUNCE_BALL_DAMAGE: 0.2,
  ROCKET_SPEED: 5,
  ROCKET_EDGE_COUNT: 4,
  ROCKET_HIT_PADDING: 5,
  ROCKET_EXPLODE_RADIUS: 45,
  ROCKET_DAMAGE: 3,
  LIGHTNING_RADIUS: 60,
  LIGHTNING_DURATION_MS: 250,
  LIGHTNING_DAMAGE: 2.5,
  BOOMERANG_SPEED: 5,
  BOOMERANG_MAX_DISTANCE: 180,
  BOOMERANG_RETURN_THRESHOLD: 10,
  BOOMERANG_HIT_PADDING: 6,
  BOOMERANG_DAMAGE: 0.2,
  EPSILON: 1,
  TWO_PI: Math.PI * 2
};

function fireWeapon(weapon, now) {
  switch (weapon.name) {
    case "bullet":
      shootSingleBullet();
      break;
    case "multishot":
      for (let i = 0; i < weapon.level; i += 1) {
        shootSingleBullet();
      }
      break;
    case "flame":
      spawnFlames(CONFIG.DEFAULT_FLAME_COUNT);
      break;
    case "spinners":
      if (state.effects.spinners.length === 0) {
        spawnSpinners(
          Math.min(weapon.level + CONFIG.SPINNER_LEVEL_BONUS, CONFIG.SPINNER_MAX_COUNT),
          CONFIG.SPINNER_SKILL_DURATION_MS
        );
      }
      break;
    case "bounceBall":
      spawnBounceBall();
      break;
    case "rocket":
      spawnRocket();
      break;
    case "lightning":
      spawnLightning();
      break;
    case "boomerang":
      spawnBoomerang();
      break;
    default:
      break;
  }
}

function shootSingleBullet() {
  if (state.enemies.length === 0) return;

  const target = state.enemies[Math.floor(Math.random() * state.enemies.length)];
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0) return;

  state.bullets.push({
    x: player.x,
    y: player.y,
    dx: dx / dist,
    dy: dy / dist,
    speed: CONFIG.BULLET_SPEED
  });
}

function useWeapons(now) {
  player.equippedWeapons.forEach((weapon) => {
    if (!weapon.active) return;
    if (now - weapon.lastUsed < weapon.cooldown) return;

    weapon.lastUsed = now;
    fireWeapon(weapon, now);
  });
}

function spawnFlames(count, duration = CONFIG.FLAME_DEFAULT_DURATION_MS) {
  for (let index = 0; index < count; index += 1) {
    state.effects.flames.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: CONFIG.FLAME_RADIUS,
      expireAt: performance.now() + duration,
      lastTick: performance.now()
    });
  }
}

function spawnSpinners(count, duration = CONFIG.SPINNER_DEFAULT_DURATION_MS) {
  for (let index = 0; index < count; index += 1) {
    state.effects.spinners.push({
      angle: (CONFIG.TWO_PI / count) * index,
      distance: CONFIG.SPINNER_DISTANCE,
      radius: CONFIG.SPINNER_RADIUS,
      speed: CONFIG.SPINNER_ANGULAR_SPEED,
      expireAt: performance.now() + duration
    });
  }
}

function spawnBounceBall() {
  if (state.enemies.length === 0) return;

  const target = state.enemies[Math.floor(Math.random() * state.enemies.length)];
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  let dist = Math.hypot(dx, dy);
  if (dist === 0) dist = 1;

  state.effects.bounceBalls.push({
    x: player.x,
    y: player.y,
    dx: dx / dist,
    dy: dy / dist,
    speed: CONFIG.BOUNCE_BALL_SPEED,
    bounces: CONFIG.BOUNCE_BALL_MAX_BOUNCES
  });
}

function spawnRocket() {
  if (state.enemies.length === 0) return;

  const target = state.enemies[Math.floor(Math.random() * state.enemies.length)];
  const edge = Math.floor(Math.random() * CONFIG.ROCKET_EDGE_COUNT);
  const x = edge === 0 ? 0 : edge === 1 ? canvas.width : Math.random() * canvas.width;
  const y = edge === 2 ? 0 : edge === 3 ? canvas.height : Math.random() * canvas.height;

  const dx = target.x - x;
  const dy = target.y - y;
  let dist = Math.hypot(dx, dy);
  if (dist === 0) dist = 1;

  state.effects.rockets.push({
    x,
    y,
    dx: dx / dist,
    dy: dy / dist,
    speed: CONFIG.ROCKET_SPEED,
    explodeRadius: CONFIG.ROCKET_EXPLODE_RADIUS
  });
}

function spawnLightning() {
  let x;
  let y;

  if (state.enemies.length === 0) {
    x = canvas.width / 2;
    y = canvas.height / 2;
  } else {
    const target = state.enemies[Math.floor(Math.random() * state.enemies.length)];
    x = target.x;
    y = target.y;
  }

  state.effects.lightningStrikes.push({
    x,
    y,
    radius: CONFIG.LIGHTNING_RADIUS,
    expireAt: performance.now() + CONFIG.LIGHTNING_DURATION_MS,
    hit: false
  });
}

function spawnBoomerang() {
  const angle = Math.random() * CONFIG.TWO_PI;
  const speed = CONFIG.BOOMERANG_SPEED;

  state.effects.boomerangs.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    speed,
    distance: 0,
    maxDistance: CONFIG.BOOMERANG_MAX_DISTANCE,
    returning: false
  });
}

function updateSpecialEffects() {
  const now = performance.now();

  state.effects.flames = state.effects.flames.filter((flame) => {
    if (now > flame.expireAt) return false;

    if (now - flame.lastTick > CONFIG.FLAME_TICK_INTERVAL_MS) {
      state.enemies.forEach((enemy) => {
        const dx = flame.x - enemy.x;
        const dy = flame.y - enemy.y;
        if (dx * dx + dy * dy < flame.radius * flame.radius) {
          enemy.hp -= CONFIG.FLAME_DAMAGE;
        }
      });
      flame.lastTick = now;
    }

    return true;
  });

  state.effects.spinners = state.effects.spinners.filter((spinner) => {
    if (now > spinner.expireAt) return false;
    spinner.angle += spinner.speed;

    const spinnerX = player.x + Math.cos(spinner.angle) * spinner.distance;
    const spinnerY = player.y + Math.sin(spinner.angle) * spinner.distance;
    state.enemies.forEach((enemy) => {
      const dx = spinnerX - enemy.x;
      const dy = spinnerY - enemy.y;
      const radius = spinner.radius + enemy.size;
      if (dx * dx + dy * dy < radius * radius) {
        enemy.hp -= CONFIG.SPINNER_DAMAGE;
      }
    });

    return true;
  });

  state.effects.bounceBalls = state.effects.bounceBalls.filter((ball) => {
    ball.x += ball.dx * ball.speed;
    ball.y += ball.dy * ball.speed;

    if (ball.x <= 0 || ball.x >= canvas.width) {
      ball.dx *= -1;
      ball.bounces -= 1;
    }

    if (ball.y <= 0 || ball.y >= canvas.height) {
      ball.dy *= -1;
      ball.bounces -= 1;
    }

    state.enemies.forEach((enemy) => {
      const dx = ball.x - enemy.x;
      const dy = ball.y - enemy.y;
      const radius = enemy.size + CONFIG.BOUNCE_BALL_HIT_PADDING;
      if (dx * dx + dy * dy < radius * radius) {
        enemy.hp -= CONFIG.BOUNCE_BALL_DAMAGE;
      }
    });

    return ball.bounces > 0;
  });

  state.effects.rockets = state.effects.rockets.filter((rocket) => {
    rocket.x += rocket.dx * rocket.speed;
    rocket.y += rocket.dy * rocket.speed;

    const hitEnemy = state.enemies.find((enemy) => {
      const dx = rocket.x - enemy.x;
      const dy = rocket.y - enemy.y;
      const radius = enemy.size + CONFIG.ROCKET_HIT_PADDING;
      return dx * dx + dy * dy < radius * radius;
    });

    if (hitEnemy) {
      state.enemies.forEach((enemy) => {
        const dx = rocket.x - enemy.x;
        const dy = rocket.y - enemy.y;
        if (dx * dx + dy * dy < rocket.explodeRadius * rocket.explodeRadius) {
          enemy.hp -= CONFIG.ROCKET_DAMAGE;
        }
      });
      return false;
    }

    if (rocket.x < 0 || rocket.x > canvas.width || rocket.y < 0 || rocket.y > canvas.height) {
      return false;
    }

    return true;
  });

  state.effects.lightningStrikes = state.effects.lightningStrikes.filter((strike) => {
    if (now > strike.expireAt) return false;

    if (!strike.hit) {
      state.enemies.forEach((enemy) => {
        const dx = strike.x - enemy.x;
        const dy = strike.y - enemy.y;
        if (dx * dx + dy * dy < strike.radius * strike.radius) {
          enemy.hp -= CONFIG.LIGHTNING_DAMAGE;
        }
      });
      strike.hit = true;
    }

    return true;
  });

  state.effects.boomerangs = state.effects.boomerangs.filter((boomerang) => {
    boomerang.x += boomerang.vx;
    boomerang.y += boomerang.vy;
    boomerang.distance += boomerang.speed;

    if (!boomerang.returning && boomerang.distance >= boomerang.maxDistance) {
      boomerang.returning = true;
    }

    if (boomerang.returning) {
      const dx = player.x - boomerang.x;
      const dy = player.y - boomerang.y;
      const dist = Math.hypot(dx, dy);

      if (dist > CONFIG.EPSILON) {
        boomerang.vx = (dx / dist) * boomerang.speed;
        boomerang.vy = (dy / dist) * boomerang.speed;
      }

      if (dist < CONFIG.BOOMERANG_RETURN_THRESHOLD) return false;
    }

    state.enemies.forEach((enemy) => {
      const dx = boomerang.x - enemy.x;
      const dy = boomerang.y - enemy.y;
      const radius = enemy.size + CONFIG.BOOMERANG_HIT_PADDING;
      if (dx * dx + dy * dy < radius * radius) {
        enemy.hp -= CONFIG.BOOMERANG_DAMAGE;
      }
    });

    return true;
  });
}

window.WeaponsModule = { useWeapons, updateSpecialEffects };
})();
