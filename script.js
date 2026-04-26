const MIN_ENEMY_TIME = 0.15;
const COLORS = {
  hats: ["#000000", "#702010", "#555555", "#4444ff", "#333333"],
  bodies: ["#ffffff", "#ffcc00", "#cc6600", "#ff4444", "#800080"],
  legs: ["#101080", "#208030", "#cc6600", "#000000", "#222222"],
  accessories: ["bandana", "mustache", "eyepatch", "none"],
};

const sfx = {
  suspense: new Audio("suspense.mp3"),
  shoot: new Audio("shoot.mp3"),
  win: new Audio("win1.mp3"),
  lose: new Audio("lose.mp3"),
};
sfx.suspense.loop = true;

const getInitialState = () => ({
  phase: "start",
  level: 1,
  score: 0,
  enemyTime: 0.8,
  reward: 1000,
  message: "Готові до дуелі?",
  banditStyle: { hat: "#000", body: "#333", legs: "#111", accessory: "none" },
});

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const nextRoundState = (state, newStyle) => {
  const isGameOver = state.phase === "lost";
  return {
    ...state,
    phase: "walking",
    message: "",
    level: isGameOver
      ? 1
      : state.phase === "won"
        ? state.level + 1
        : state.level,
    score: isGameOver ? 0 : state.score,
    enemyTime: isGameOver
      ? 0.8
      : state.phase === "won"
        ? Math.max(MIN_ENEMY_TIME, state.enemyTime - 0.05)
        : state.enemyTime,
    reward: isGameOver
      ? 1000
      : state.phase === "won"
        ? state.reward + 500
        : state.reward,
    banditStyle: newStyle,
  };
};

const arriveState = (state) => ({
  ...state,
  phase: "standing",
  message: "Готуйся...",
});

const fireState = (state) => ({ ...state, phase: "duel", message: "" });

const winState = (state) => ({
  ...state,
  phase: "won",
  score: state.score + state.reward,
  message: `ВИ ВИГРАЛИ!<br>+$${state.reward}`,
});

const loseState = (state, reason) => ({
  ...state,
  phase: "lost",
  score: state.score,
  message: `ВИ ПРОГРАЛИ!<br>${reason}<br>Рахунок: $${state.score}`,
});

let currentState = getInitialState();
let timers = [];

const clearAllTimers = () => {
  timers.forEach(clearTimeout);
  timers = [];
};
const stopAllAudio = () => {
  Object.values(sfx).forEach((a) => {
    a.pause();
    a.currentTime = 0;
  });
};

const dispatch = (actionFn, ...args) => {
  currentState = actionFn(currentState, ...args);
  render(currentState);
};

const render = (state) => {
  document.getElementById("ui-score").textContent = `$${state.score}`;
  document.getElementById("ui-level").textContent = state.level;
  document.getElementById("ui-enemy-time").textContent =
    state.enemyTime.toFixed(2) + "с";

  document.getElementById("char-hat-crown").style.backgroundColor =
    state.banditStyle.hat;
  document.getElementById("char-hat-brim").style.backgroundColor =
    state.banditStyle.hat;
  document.getElementById("char-body").style.backgroundColor =
    state.banditStyle.body;

  document.getElementById("char-arm-left").style.backgroundColor =
    state.banditStyle.body;
  document.getElementById("char-arm-right").style.backgroundColor =
    state.banditStyle.body;

  document.getElementById("char-legs").style.backgroundColor =
    state.banditStyle.legs;
  document.getElementById("char-accessory").className =
    state.banditStyle.accessory;

  const msgEl = document.getElementById("ui-message");
  msgEl.innerHTML = state.message;
  state.message
    ? msgEl.classList.remove("hidden")
    : msgEl.classList.add("hidden");

  const charEl = document.getElementById("character");
  const btnEl = document.getElementById("btn-action");
  const eyesEl = document.getElementById("char-eyes");
  const gunFlashEl = document.getElementById("gun-flash");
  const speechEl = document.getElementById("char-speech");

  charEl.className = "";
  eyesEl.classList.add("hidden");
  gunFlashEl.classList.add("hidden");
  speechEl.classList.add("hidden");

  switch (state.phase) {
    case "start":
      charEl.classList.add("hidden");
      btnEl.textContent = "Розпочати гру";
      btnEl.classList.remove("hidden");
      break;
    case "walking":
      charEl.classList.add("walking");
      btnEl.classList.add("hidden");
      break;
    case "standing":
      charEl.classList.add("standing");
      break;
    case "duel":
      charEl.classList.add("duel");
      eyesEl.classList.remove("hidden");
      speechEl.classList.remove("hidden");
      break;
    case "won":
      charEl.classList.add("dead");
      btnEl.textContent = "Наступний раунд";
      btnEl.classList.remove("hidden");
      break;
    case "lost":
      charEl.classList.add("firing");
      gunFlashEl.classList.remove("hidden");
      btnEl.textContent = "Перезапустити гру";
      btnEl.classList.remove("hidden");
      break;
  }
};

const handleStartRound = () => {
  clearAllTimers();
  stopAllAudio();

  const randomStyle = {
    hat: pickRandom(COLORS.hats),
    body: pickRandom(COLORS.bodies),
    legs: pickRandom(COLORS.legs),
    accessory: pickRandom(COLORS.accessories),
  };

  dispatch(nextRoundState, randomStyle);

  sfx.suspense.play().catch(() => {});

  timers.push(
    setTimeout(() => {
      dispatch(arriveState);
      const waitTime = Math.random() * 2000 + 1500;
      timers.push(setTimeout(handleDuelStart, waitTime));
    }, 3000),
  );
};

const handleDuelStart = () => {
  stopAllAudio();
  dispatch(fireState);

  timers.push(
    setTimeout(() => {
      if (currentState.phase === "duel") {
        sfx.shoot.play();
        sfx.lose.play();
        dispatch(loseState, "Вас застрелили.");
      }
    }, currentState.enemyTime * 1000),
  );
};

const handleCharacterClick = () => {
  if (currentState.phase === "standing") {
    clearAllTimers();
    stopAllAudio();
    sfx.shoot.play();
    sfx.lose.play();
    dispatch(loseState, "Фальстарт!");
  } else if (currentState.phase === "duel") {
    clearAllTimers();
    stopAllAudio();
    sfx.shoot.play();
    setTimeout(() => sfx.win.play(), 200);
    dispatch(winState);
  }
};

document.getElementById("btn-action").addEventListener("click", () => {
  if (["start", "won", "lost"].includes(currentState.phase)) {
    if (currentState.phase === "lost") currentState = getInitialState();
    handleStartRound();
  }
});

document
  .getElementById("character")
  .addEventListener("mousedown", handleCharacterClick);

render(currentState);
