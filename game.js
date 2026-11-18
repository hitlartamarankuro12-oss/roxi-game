const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 55;

let isPaused = false;
let gameRunning = false;
let score = 0;
let level = 1;
let baseGameSpeed = 6;
let currentSpeed = 6;
let roadLineOffset = 0;

let player = {
    x: canvas.width / 2 - 22,
    y: canvas.height - 130,
    width: 45,
    height: 85,
    color: "#00ffff",
    name: "Neon Viper"
};

let trafficCars = [];

function openScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
    if (screenId === 'leaderboard-screen') {
        loadScoreboard();
    }
}

function selectCar(type, color, name) {
    player.color = color;
    player.name = name;
    openScreen('main-menu');
}

function startGame() {
    openScreen('game-screen');
    gameRunning = true;
    isPaused = false;
    score = 0;
    level = 1;
    currentSpeed = baseGameSpeed;
    trafficCars = [];
    requestAnimationFrame(gameLoop);
}

function restartGame() {
    document.getElementById('pause-modal').classList.add('hidden');
    startGame();
}

function exitToMenu() {
    document.getElementById('pause-modal').classList.add('hidden');
    gameRunning = false;
    openScreen('main-menu');
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-modal').classList.toggle('hidden', !isPaused);
}

window.addEventListener("touchmove", (e) => {
    if (!gameRunning || isPaused) return;
    let touchX = e.touches[0].clientX;
    player.x = touchX - player.width / 2;
    if (player.x < 25) player.x = 25;
    if (player.x > canvas.width - player.width - 25) player.x = canvas.width - player.width - 25;
});

function spawnTraffic() {
    if (Math.random() < 0.025 + (level * 0.005)) {
        let lanes = [canvas.width * 0.22, canvas.width * 0.45 - 22, canvas.width * 0.68 - 45];
        let chosenX = lanes[Math.floor(Math.random() * lanes.length)];
        let isOncoming = Math.random() < 0.3; 

        trafficCars.push({
            x: chosenX,
            y: -120,
            width: 45,
            height: 85,
            oncoming: isOncoming,
            speed: isOncoming ? currentSpeed + 4 : currentSpeed - (Math.random() * 2),
            color: isOncoming ? '#ff3333' : ['#ff0055', '#ffff00', '#aa00ff', '#ff8800'][Math.floor(Math.random() * 4)]
        });
    }
}

function saveScore(finalScore) {
    let scores = JSON.parse(localStorage.getItem('raxi_scores') || '[]');
    scores.push({ score: finalScore, date: new Date().toLocaleDateString() });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 5);
    localStorage.setItem('raxi_scores', JSON.stringify(scores));
}

function loadScoreboard() {
    let list = document.getElementById('score-list');
    list.innerHTML = '';
    let scores = JSON.parse(localStorage.getItem('raxi_scores') || '[]');
    if (scores.length === 0) {
        list.innerHTML = '<li>No races recorded yet!</li>';
        return;
    }
    scores.forEach((item, index) => {
        let li = document.createElement('li');
        li.innerText = `#${index + 1} — ${item.score} pts (${item.date})`;
        list.appendChild(li);
    });
}

function gameLoop() {
    if (!gameRunning) return;

    if (!isPaused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#16162c";
        ctx.fillRect(20, 0, canvas.width - 40, canvas.height);

        ctx.strokeStyle = "#444466";
        ctx.lineWidth = 4;
        ctx.setLineDash([30, 30]);
        roadLineOffset = (roadLineOffset + currentSpeed) % 60;

        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, -60 + roadLineOffset);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();

        level = Math.floor(score / 150) + 1;
        currentSpeed = baseGameSpeed + (level * 1.2);

        spawnTraffic();
        for (let i = trafficCars.length - 1; i >= 0; i--) {
            let car = trafficCars[i];
            car.y += car.speed;

            ctx.fillStyle = car.color;
            ctx.fillRect(car.x, car.y, car.width, car.height);
            
            ctx.fillStyle = "#fff";
            ctx.fillRect(car.x + 5, car.oncoming ? car.y + car.height - 15 : car.y + 10, 8, 10);
            ctx.fillRect(car.x + car.width - 13, car.oncoming ? car.y + car.height - 15 : car.y + 10, 8, 10);

            if (
                player.x < car.x + car.width &&
                player.x + player.width > car.x &&
                player.y < car.y + car.height &&
                player.y + player.height > car.y
            ) {
                gameRunning = false;
                saveScore(score);
                alert(`💥 CRASH! RAXI Race Over.\nFinal Score: ${score} (Level ${level})`);
                openScreen('main-menu');
                return;
            }

            if (car.y > canvas.height + 100 || car.y < -200) {
                trafficCars.splice(i, 1);
                score += 20 * level;
            }
        }

        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.fillStyle = "#fff";
        ctx.fillRect(player.x + 5, player.y + 10, 8, 10);
        ctx.fillRect(player.x + player.width - 13, player.y + 10, 8, 10);

        document.getElementById("hud-score").innerText = "Score: " + score;
        document.getElementById("hud-level").innerText = "Level: " + level;
        document.getElementById("hud-speed").innerText = "Speed: " + Math.round(currentSpeed * 22) + " MPH";
    }

    requestAnimationFrame(gameLoop);
}
