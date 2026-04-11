(() => {
const { canvas, player, state } = window.GameState;
const { endGame, gainXP } = window.PlayerModule;

const CONFIG = {
  BASE_WAVE_ENEMY_COUNT: 6,
  WAVE_ENEMY_COUNT_INCREMENT: 2,
  BOSS_BASE_PROBABILITY: 0.1,
  BOSS_PROBABILITY_INCREMENT: 0.008,
  BOSS_PROBABILITY_MAX: 0.28,
  SPAWN_SAFE_RADIUS: 100,
  BOSS_SIZE: 30,
  NORMAL_SIZE: 10,
  BOSS_BASE_HP: 20,
  BOSS_HP_PER_WAVE: 1.5,
  NORMAL_HP: 8,
  NORMAL_HP_PER_WAVE: 0.6,
  BOSS_BASE_SPEED: 0.7,
  BOSS_SPEED_PER_WAVE: 0.1,
  NORMAL_BASE_SPEED: 1,
  NORMAL_SPEED_PER_WAVE: 0.05,
  NO2_SPAWN_CHANCE: 0.35,
  NO2_SIZE: 9,
  NO2_HP: 5,
  NO2_HP_PER_WAVE: 0.5,
  NO2_BASE_SPEED: 1.35,
  NO2_SPEED_PER_WAVE: 0.07,
  PLAYER_CONTACT_DAMAGE_INTERVAL_MS: 250,
  CONTACT_DAMAGE: 2,
  BULLET_DAMAGE: 4,
  ITEM_SIZE: 6,
  ITEM_MAGNET_SPEED: 5,
  ITEM_PICKUP_RADIUS: 10,
  TREE_ITEM_DROP_CHANCE: 0.1
};

function spawnItem(x, y) {
  state.items.push({ x, y, size: CONFIG.ITEM_SIZE, type: "xpOrb" });
}

function spawnTreeItem(x, y) {
  state.items.push({ x, y, size: CONFIG.ITEM_SIZE + 2, type: "treeHeal" });
}

function handleEnemyDefeat(enemy, enemyIndex) {
  spawnItem(enemy.x, enemy.y);

  if (Math.random() < CONFIG.TREE_ITEM_DROP_CHANCE) {
    spawnTreeItem(enemy.x, enemy.y);
  }

  state.enemies.splice(enemyIndex, 1);
}

function spawnWave() {
  state.wave += 1;
  const waveCount = CONFIG.BASE_WAVE_ENEMY_COUNT + state.wave * CONFIG.WAVE_ENEMY_COUNT_INCREMENT;
  const bossProbability = Math.min(
    CONFIG.BOSS_BASE_PROBABILITY + state.wave * CONFIG.BOSS_PROBABILITY_INCREMENT,
    CONFIG.BOSS_PROBABILITY_MAX
  );
  const bossHp = Math.round(CONFIG.BOSS_BASE_HP + state.wave * CONFIG.BOSS_HP_PER_WAVE);
  const normalHp = CONFIG.NORMAL_HP + Math.floor(state.wave * CONFIG.NORMAL_HP_PER_WAVE);
  const no2Hp = CONFIG.NO2_HP + Math.floor(state.wave * CONFIG.NO2_HP_PER_WAVE);

  for (let index = 0; index < waveCount; index += 1) {
    const isBoss = Math.random() < bossProbability;
    const isNO2 = !isBoss && Math.random() < CONFIG.NO2_SPAWN_CHANCE;
    const moleculeType = isBoss ? "ch4" : isNO2 ? "no2" : "co2";
    let x;
    let y;
    let tooClose;

    do {
      x = Math.random() * canvas.width;
      y = Math.random() * canvas.height;
      const dx = player.x - x;
      const dy = player.y - y;
      tooClose = dx * dx + dy * dy < CONFIG.SPAWN_SAFE_RADIUS * CONFIG.SPAWN_SAFE_RADIUS;
    } while (tooClose);

    state.enemies.push({
      x,
      y,
      size: isBoss ? CONFIG.BOSS_SIZE : isNO2 ? CONFIG.NO2_SIZE : CONFIG.NORMAL_SIZE,
      hp: isBoss ? bossHp : isNO2 ? no2Hp : normalHp,
      maxHp: isBoss ? bossHp : isNO2 ? no2Hp : normalHp,
      speed: isBoss
        ? CONFIG.BOSS_BASE_SPEED + state.wave * CONFIG.BOSS_SPEED_PER_WAVE
        : isNO2
          ? CONFIG.NO2_BASE_SPEED + state.wave * CONFIG.NO2_SPEED_PER_WAVE
          : CONFIG.NORMAL_BASE_SPEED + state.wave * CONFIG.NORMAL_SPEED_PER_WAVE,
      color: isBoss ? "gold" : "red",
      isBoss,
      moleculeType
    });
  }
}

function checkCollisions() {
  const now = performance.now();

  for (let enemyIndex = state.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
    const enemy = state.enemies[enemyIndex];

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distSq = dx * dx + dy * dy;

    if (
      distSq < enemy.size * enemy.size &&
      now - state.lastPlayerContactHit > CONFIG.PLAYER_CONTACT_DAMAGE_INTERVAL_MS
    ) {
      player.hp -= CONFIG.CONTACT_DAMAGE;
      state.lastPlayerContactHit = now;
      if (player.hp <= 0) endGame();
    }

    for (let bulletIndex = state.bullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
      const bullet = state.bullets[bulletIndex];
      const dxb = bullet.x - enemy.x;
      const dyb = bullet.y - enemy.y;
      const bulletDistSq = dxb * dxb + dyb * dyb;

      if (bulletDistSq < enemy.size * enemy.size) {
        enemy.hp -= CONFIG.BULLET_DAMAGE;
        state.bullets.splice(bulletIndex, 1);

        if (enemy.hp <= 0) {
          handleEnemyDefeat(enemy, enemyIndex);
          break;
        }
      }
    }
  }

  for (let enemyIndex = state.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
    const enemy = state.enemies[enemyIndex];
    if (enemy.hp <= 0) {
      handleEnemyDefeat(enemy, enemyIndex);
    }
  }

  for (let itemIndex = state.items.length - 1; itemIndex >= 0; itemIndex -= 1) {
    const item = state.items[itemIndex];
    const dx = player.x - item.x;
    const dy = player.y - item.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < player.xpRange * player.xpRange) {
      const speed = CONFIG.ITEM_MAGNET_SPEED;
      if (distSq > 0) {
        const invDist = 1 / Math.sqrt(distSq);
        item.x += dx * invDist * speed;
        item.y += dy * invDist * speed;
      }
    }

    if (distSq < CONFIG.ITEM_PICKUP_RADIUS * CONFIG.ITEM_PICKUP_RADIUS) {
      if (item.type === "xpOrb") {
        gainXP(1);
      }

      if (item.type === "treeHeal" && player.hp < player.maxHp) {
        player.hp = Math.min(player.hp + 5, player.maxHp);
      }
      state.items.splice(itemIndex, 1);
    }
  }
}

window.EnemiesModule = { spawnWave, checkCollisions };
})();
