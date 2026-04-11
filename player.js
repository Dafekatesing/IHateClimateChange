(() => {
const { player, state, getWeaponBaseCooldown } = window.GameState;

const levelUpOptions = [
  "flame",
  "spinners",
  "bounceBall",
  "rocket",
  "lightning",
  "boomerang",
  "hpBoost",
  "atkBoost"
];

const WEAPON_MAX_LEVEL = 6;
const WEAPON_UPGRADE_COOLDOWN_MULTIPLIER = 0.9;
const WEAPON_MIN_COOLDOWN = 120;
const ATK_BOOST_COOLDOWN_MULTIPLIER = 0.95;
const ATK_BOOST_MIN_COOLDOWN = 100;

function getAcquiredWeapons() {
  return player.equippedWeapons.filter((weapon) => weapon.name !== "bullet");
}

function isWeaponOption(option) {
  return (
    option === "flame" ||
    option === "spinners" ||
    option === "bounceBall" ||
    option === "rocket" ||
    option === "lightning" ||
    option === "boomerang"
  );
}

function isOptionAvailable(option) {
  if (!isWeaponOption(option)) return true;

  const weapon = player.equippedWeapons.find((item) => item.name === option);
  if (weapon) return weapon.level < WEAPON_MAX_LEVEL;

  return getAcquiredWeapons().length < player.maxWeapons;
}

function updateUI() {
  document.getElementById("level").innerText = player.level;
  document.getElementById("xp").innerText = `${player.xp} / ${player.xpToNext}`;
  document.getElementById("hp").innerText = `${player.hp}/${player.maxHp}`;
  document.getElementById("wave").innerText = state.wave;

  const waveProgress = Math.min(100, Math.floor((state.waveTimer / state.waveInterval) * 100));
  document.getElementById("waveProgress").style.width = `${waveProgress}%`;
  document.getElementById("waveProgressText").innerText = `${waveProgress}%`;

  const weaponLabelMap = {
    bullet: "기본 탄환",
    multishot: "멀티샷",
    flame: "과산화 수소",
    spinners: "오존 팽이",
    bounceBall: "광촉매 구체",
    rocket: "활성탄 로켓",
    lightning: "탄소 포집",
    boomerang: "제올라이트"
  };

  const weaponList = document.getElementById("weaponList");
  weaponList.innerHTML = "";

  const acquiredWeapons = getAcquiredWeapons();

  if (acquiredWeapons.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.innerText = "아직 획득한 무기가 없습니다";
    weaponList.appendChild(emptyItem);
    return;
  }

  acquiredWeapons.forEach((weapon) => {
    const item = document.createElement("li");
    const label = weaponLabelMap[weapon.name] || weapon.name;
    item.innerText = `${label} Lv.${weapon.level}`;
    weaponList.appendChild(item);
  });
}

function endGame() {
  state.gameOver = true;
  document.getElementById("gameOver").classList.remove("hidden");
}

function restart() {
  localStorage.clear();
  location.reload();
}

function gainXP(value) {
  player.xp += value;

  if (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level += 1;
    player.xpToNext += 3;
    openUpgrade();
  }

  updateUI();
}

function addOrUpgradeWeapon(name) {
  const weapon = player.equippedWeapons.find((item) => item.name === name);
  if (weapon) {
    weapon.level = Math.min(weapon.level + 1, WEAPON_MAX_LEVEL);
    weapon.cooldown = Math.max(WEAPON_MIN_COOLDOWN, weapon.cooldown * WEAPON_UPGRADE_COOLDOWN_MULTIPLIER);
    return;
  }

  if (getAcquiredWeapons().length < player.maxWeapons) {
    player.equippedWeapons.push({
      name,
      level: 1,
      active: true,
      cooldown: getWeaponBaseCooldown(name),
      lastUsed: 0
    });
  }
}

function openUpgrade() {
  state.gamePaused = true;
  const upgradeMenu = document.getElementById("upgradeMenu");
  const options = document.getElementById("upgradeOptions");
  upgradeMenu.classList.remove("hidden");
  options.innerHTML = "";

  const availableOptions = levelUpOptions.filter((option) => isOptionAvailable(option));
  const randomPool = [...availableOptions];
  state.currentUpgradeChoices = [];

  while (state.currentUpgradeChoices.length < 3 && randomPool.length > 0) {
    const randomIndex = Math.floor(Math.random() * randomPool.length);
    const [option] = randomPool.splice(randomIndex, 1);
    state.currentUpgradeChoices.push(option);
  }

  const textMap = {
    flame: "과산화 수소 던지기",
    spinners: "오존 팽이",
    bounceBall: "튕기는 광촉매 이산화티타늄",
    rocket: "활성탄 로켓 공격",
    lightning: "탄소 포집",
    boomerang: "제올라이트 회수",
    hpBoost: "최대 HP 증가",
    atkBoost: "COF-999 합성 속도 증가"
  };

  state.currentUpgradeChoices.forEach((option) => {
    const button = document.createElement("button");
    button.textContent = textMap[option] || option;
    button.onclick = () => chooseUpgrade(option);
    options.appendChild(button);
  });
}

function chooseUpgrade(option) {
  applyLevelUpOption(option);
  document.getElementById("upgradeMenu").classList.add("hidden");
  state.gamePaused = false;
  updateUI();
}

function applyLevelUpOption(option) {
  switch (option) {
    case "flame":
    case "spinners":
    case "bounceBall":
    case "rocket":
    case "lightning":
    case "boomerang":
      addOrUpgradeWeapon(option);
      break;
    case "hpBoost":
      player.maxHp += 10;
      break;
    case "atkBoost":
      player.equippedWeapons.forEach((weapon) => {
        weapon.cooldown = Math.max(ATK_BOOST_MIN_COOLDOWN, weapon.cooldown * ATK_BOOST_COOLDOWN_MULTIPLIER);
      });
      break;
    default:
      break;
  }
}

window.PlayerModule = { updateUI, endGame, restart, gainXP };
})();
