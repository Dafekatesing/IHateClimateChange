(() => {
const { state } = window.GameState;
const { setupInput, movePlayer, moveEnemies, moveBullets } = window.MovementModule;
const { spawnWave, checkCollisions } = window.EnemiesModule;
const { useWeapons, updateSpecialEffects } = window.WeaponsModule;
const { draw } = window.RenderingModule;
const { updateUI, restart } = window.PlayerModule;

document.getElementById("restartBtn").addEventListener("click", restart);

setupInput();

function loop(timestamp) {
  if (!state.lastTimestamp) {
    state.lastTimestamp = timestamp;
  }

  const deltaTime = Math.min(timestamp - state.lastTimestamp, 34);
  state.lastTimestamp = timestamp;

  if (!state.gamePaused && !state.gameOver) {
    movePlayer();
    moveEnemies();
    moveBullets();
    updateSpecialEffects();
    useWeapons(timestamp);
    checkCollisions();

    if (state.enemies.length === 0) {
      state.emptyWaveElapsed += deltaTime;
      if (state.emptyWaveElapsed >= state.waveClearDelay) {
        state.emptyWaveElapsed = 0;
        state.waveTimer = 0;
        spawnWave();
      }
    } else {
      state.emptyWaveElapsed = 0;
      state.waveTimer += deltaTime;
      if (state.waveTimer >= state.waveInterval) {
        state.waveTimer = 0;
        spawnWave();
      }
    }

    updateUI();
  }

  draw();
  requestAnimationFrame(loop);
}

state.wave = 0;
state.waveTimer = 0;
state.emptyWaveElapsed = 0;
spawnWave();
updateUI();
loop(0);
})();
