(() => {
const { canvas, ctx, player, state } = window.GameState;

function drawCO2(x, y, size) {
  ctx.strokeStyle = "#ff6b6b";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#ff6b6b";

  ctx.beginPath();
  ctx.arc(x - size, y, size * 0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff6b6b";
  ctx.beginPath();
  ctx.arc(x + size, y, size * 0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.4, y);
  ctx.lineTo(x + size * 0.4, y);
  ctx.stroke();
}

function drawMethane(x, y, size) {
  ctx.fillStyle = "#FFD700";
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;

  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
  ctx.fill();

  const positions = [
    { dx: size, dy: 0 },
    { dx: -size, dy: 0 },
    { dx: 0, dy: size },
    { dx: 0, dy: -size }
  ];

  positions.forEach((position) => {
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + position.dx * 0.7, y + position.dy * 0.7);
    ctx.stroke();

    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(x + position.dx, y + position.dy, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawNitrogenDioxide(x, y, size) {
  const bondLength = size * 1.1;
  const halfAngle = (67 * Math.PI) / 180;
  const leftO = {
    x: x + Math.cos(Math.PI + halfAngle) * bondLength,
    y: y + Math.sin(Math.PI + halfAngle) * bondLength
  };
  const rightO = {
    x: x + Math.cos(Math.PI - halfAngle) * bondLength,
    y: y + Math.sin(Math.PI - halfAngle) * bondLength
  };

  ctx.strokeStyle = "#666";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(leftO.x, leftO.y);
  ctx.moveTo(x, y);
  ctx.lineTo(rightO.x, rightO.y);
  ctx.stroke();

  ctx.fillStyle = "#1e40af";
  ctx.beginPath();
  ctx.arc(x, y, size * 0.42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff6b6b";
  ctx.beginPath();
  ctx.arc(leftO.x, leftO.y, size * 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(rightO.x, rightO.y, size * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  ctx.globalAlpha = 1;
  ctx.font = `${player.size * 2.5}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🌏", player.x, player.y);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPlayer();

  state.effects.flames.forEach((flame) => {
    ctx.fillStyle = "rgba(255, 80, 20, 0.35)";
    ctx.beginPath();
    ctx.arc(flame.x, flame.y, flame.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  state.effects.spinners.forEach((spinner) => {
    const x = player.x + Math.cos(spinner.angle) * spinner.distance;
    const y = player.y + Math.sin(spinner.angle) * spinner.distance;
    ctx.fillStyle = "#f5f5f5";
    ctx.beginPath();
    ctx.arc(x, y, spinner.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  state.effects.bounceBalls.forEach((ball) => {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  state.effects.rockets.forEach((rocket) => {
    ctx.fillStyle = "rgba(34, 197, 94, 0.12)";
    ctx.beginPath();
    ctx.arc(rocket.x, rocket.y, rocket.explodeRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(34, 197, 94, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(rocket.x, rocket.y, rocket.explodeRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#03230f";
    ctx.beginPath();
    ctx.arc(rocket.x, rocket.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  state.effects.lightningStrikes.forEach((strike) => {
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(strike.x, 0);
    ctx.lineTo(strike.x, strike.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(strike.x, strike.y, strike.radius, 0, Math.PI * 2);
    ctx.stroke();
  });

  state.effects.boomerangs.forEach((boomerang) => {
    ctx.fillStyle = "#00f";
    ctx.beginPath();
    ctx.arc(boomerang.x, boomerang.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  state.enemies.forEach((enemy) => {
    if (enemy.moleculeType === "ch4" || enemy.isBoss) {
      drawMethane(enemy.x, enemy.y, enemy.size * 0.8);
    } else if (enemy.moleculeType === "no2") {
      drawNitrogenDioxide(enemy.x, enemy.y, enemy.size * 0.9);
    } else {
      drawCO2(enemy.x, enemy.y, enemy.size * 0.8);
    }

    const barWidth = enemy.size * 2;
    const barHeight = 4;
    const barX = enemy.x - barWidth / 2;
    const barY = enemy.y - enemy.size - 10;

    ctx.fillStyle = "gray";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const hpRatio = enemy.hp / enemy.maxHp;
    ctx.fillStyle = "red";
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  });

  state.bullets.forEach((bullet) => {
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  state.items.forEach((item) => {
    if (item.type === "treeHeal") {
      ctx.font = `${item.size * 2.1}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🌳", item.x, item.y);
      return;
    }

    ctx.fillStyle = "#00FF00";
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#00AA00";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "gray";
  ctx.beginPath();
  ctx.arc(state.joystick.baseX, state.joystick.baseY, state.joystick.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(state.joystick.stickX, state.joystick.stickY, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
}

window.RenderingModule = { draw };
})();
