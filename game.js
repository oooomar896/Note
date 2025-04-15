// game.js
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player = {
    x: 400,
    y: 300,
    size: 30,
    speed: 5,
    color: "green"
};

let playerHealth = 100; // صحة اللاعب

let keys = {};

let enemies = [];
let bullets = []; // قائمة الرصاص
let zone = { x: 400, y: 300, radius: 300, shrinkRate: 0.5 };
let socket = new WebSocket("ws://localhost:8765");

let bot = {
    x: 200,
    y: 200,
    size: 30,
    color: "red",
    isAlive: true,
};

let score = 0; // إضافة متغير لتتبع النقاط

let powerUps = []; // قائمة التعزيزات

let gameTime = 0; // وقت اللعبة بالثواني

let level = 1; // مستوى اللعبة الحالي
let levelUpScore = 50; // النقاط المطلوبة للانتقال إلى المستوى التالي

let victoryScore = 500; // النقاط المطلوبة للفوز

document.addEventListener("keydown", (e) => {
    if (e.key === " ") shootBullet(); // إطلاق الرصاص عند الضغط على Space
    keys[e.key] = true;
});
document.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

function spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
        enemies.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 20,
            speed: 2,
            color: "red",
            health: 50, // صحة العدو
        });
    }
}

function spawnPowerUps(count) {
    for (let i = 0; i < count; i++) {
        powerUps.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 15,
            type: Math.random() > 0.5 ? "health" : "speed", // نوع التعزيز: صحة أو سرعة
            duration: 5000, // مدة تأثير تعزيز السرعة
        });
    }
}

function shootBullet() {
    // إطلاق الرصاصة
    bullets.push({
        x: player.x + player.size / 2 - 2.5, // مركز الرصاصة
        y: player.y,
        size: 5,
        speed: 7,
    });
    document.getElementById("shootSound").play();
}

function updateEnemies() {
    enemies.forEach((enemy) => {
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        enemy.x += (dx / dist) * enemy.speed;
        enemy.y += (dy / dist) * enemy.speed;

        // تقليل صحة اللاعب عند الاصطدام مع العدو
        if (dist < player.size + enemy.size / 2) {
            playerHealth -= 1;
        }
    });
}

function updateBullets() {
    // تحريك الرصاص
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed; // تحريك الرصاصة للأعلى
        if (bullet.y < 0) bullets.splice(index, 1); // إزالة الرصاصة إذا خرجت من الشاشة
    });
}

function checkCollisions() {
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            let dx = bullet.x - enemy.x;
            let dy = bullet.y - enemy.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bullet.size + enemy.size / 2) {
                enemy.health -= 25; // تقليل صحة العدو
                bullets.splice(bIndex, 1);
                if (enemy.health <= 0) {
                    enemies.splice(eIndex, 1);
                    score += 10; // زيادة النقاط عند تدمير عدو
                }
                document.getElementById("hitSound").play();
            }
        });
    });
}

function checkBotCollision() {
    if (bot.isAlive) {
        bullets.forEach((bullet, bIndex) => {
            let dx = bullet.x - bot.x;
            let dy = bullet.y - bot.y;
            if (
                dx > 0 &&
                dx < bot.size &&
                dy > 0 &&
                dy < bot.size
            ) {
                bot.isAlive = false; // اختفاء البوت
                bullets.splice(bIndex, 1); // إزالة الرصاصة
                document.getElementById("hitSound").play();
                setTimeout(respawnBot, 5000); // إعادة ظهور البوت بعد 5 ثوانٍ
            }
        });
    }
}

function checkPowerUpCollision() {
    powerUps.forEach((powerUp, index) => {
        let dx = player.x - powerUp.x;
        let dy = player.y - powerUp.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.size / 2 + powerUp.size / 2) {
            if (powerUp.type === "health") {
                playerHealth = Math.min(playerHealth + 20, 100); // استعادة الصحة
            } else if (powerUp.type === "speed") {
                player.speed *= 2; // زيادة السرعة مؤقتًا
                setTimeout(() => {
                    player.speed /= 2; // إعادة السرعة إلى الوضع الطبيعي
                }, powerUp.duration);
            }
            powerUps.splice(index, 1); // إزالة التعزيز بعد جمعه
        }
    });
}

function respawnBot() {
    bot.x = Math.random() * (canvas.width - bot.size);
    bot.y = Math.random() * (canvas.height - bot.size);
    bot.isAlive = true; // إعادة تفعيل البوت
}

function updateZone() {
    zone.radius -= zone.shrinkRate;
    if (zone.radius < 50) zone.radius = 50;
}

function drawZone() {
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.stroke();
}

socket.onmessage = function (event) {
    let data = JSON.parse(event.data);
    // Handle multiplayer updates (e.g., other players' positions)
};

function drawHealthBar(x, y, width, height, health, maxHealth) {
    ctx.fillStyle = "red";
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = "green";
    ctx.fillRect(x, y, (health / maxHealth) * width, height);
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);
    drawHealthBar(player.x, player.y - 10, player.size, 5, playerHealth, 100); // شريط صحة اللاعب
}

function drawEnemies() {
    enemies.forEach((enemy) => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
        drawHealthBar(enemy.x, enemy.y - 10, enemy.size, 5, enemy.health, 50); // شريط صحة العدو
    });
}

function drawBullets() {
    // رسم الرصاص
    bullets.forEach((bullet) => {
        ctx.fillStyle = "yellow";
        ctx.fillRect(bullet.x, bullet.y, bullet.size, bullet.size);
    });
}

function drawBot() {
    if (bot.isAlive) {
        ctx.fillStyle = bot.color;
        ctx.fillRect(bot.x, bot.y, bot.size, bot.size);
    }
}

function drawPowerUps() {
    powerUps.forEach((powerUp) => {
        ctx.fillStyle = powerUp.type === "health" ? "green" : "blue";
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, powerUp.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`Enemies: ${enemies.length}`, 10, 20);
    ctx.fillText(`Zone Radius: ${Math.round(zone.radius)}`, 10, 40);
    ctx.fillText(`Score: ${score}`, 10, 60); // عرض النقاط
    ctx.fillText(`Time: ${Math.floor(gameTime / 60)}:${gameTime % 60}`, 10, 80); // عرض الوقت
    ctx.fillText(`Level: ${level}`, 10, 100); // عرض المستوى
}

function update() {
    if (playerHealth <= 0) {
        alert("Game Over!"); // إنهاء اللعبة عند نفاد صحة اللاعب
        document.location.reload();
    }
    if (keys["ArrowUp"]) player.y -= player.speed;
    if (keys["ArrowDown"]) player.y += player.speed;
    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;
    updateEnemies();
    updateBullets(); // تحديث حركة الرصاص
    checkCollisions();
    checkBotCollision(); // التحقق من اصطدام الرصاص مع البوت
    checkPowerUpCollision(); // التحقق من جمع التعزيزات
    updateZone();
    checkLevelUp(); // التحقق من رفع المستوى
    checkVictory(); // التحقق من الفوز
}

function checkLevelUp() {
    if (score >= level * levelUpScore) {
        level += 1; // رفع مستوى اللعبة
        spawnEnemies(5 + level * 2); // زيادة عدد الأعداء
        enemies.forEach((enemy) => {
            enemy.speed += 0.5; // زيادة سرعة الأعداء
        });
        alert(`Level Up! You are now on level ${level}`); // رسالة إعلامية
    }
}

function checkVictory() {
    if (score >= victoryScore) {
        displayWinScreen(); // عرض شاشة الفوز
    }
}

function displayWinScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // مسح الشاشة
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height); // خلفية سوداء
    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Congratulations! You Win!", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "24px Arial";
    ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 2 + 40);

    document.addEventListener("keydown", handleRestartKey);
}

function handleRestartKey(e) {
    if (e.key === "r" || e.key === "R") {
        document.removeEventListener("keydown", handleRestartKey); // إزالة المستمع
        document.location.reload(); // إعادة تشغيل اللعبة
    }
}

function drawElevationCircles() {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"; // لون الدوائر وخط شفاف

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let radius = 100; radius <= canvas.width; radius += 100) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); // رسم الدوائر
        ctx.stroke();
    }
}

function drawTerrain() {
    // رسم الأرضية ثلاثية الأبعاد باستخدام التدرجات
    let gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        50,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width
    );
    gradient.addColorStop(0, "green");
    gradient.addColorStop(0.5, "brown");
    gradient.addColorStop(1, "blue");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawElevationCircles(); // إضافة تأثير التلال الخطية
}

function drawGrid() {
    const gridSize = 50; // حجم المربعات في الشبكة
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"; // لون الشبكة مع شفافية
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTerrain(); // رسم الأرضية ثلاثية الأبعاد مع ارتفاعات
    drawGrid(); // رسم الشبكة
    drawPlayer();
    drawEnemies();
    drawBullets(); // رسم الرصاص
    drawBot(); // رسم البوت
    drawPowerUps(); // رسم التعزيزات
    drawZone();
    drawHUD();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// استدعاء updateTimer كل ثانية
setInterval(updateTimer, 1000);

function updateTimer() {
    gameTime += 1; // زيادة الوقت بمقدار ثانية
}

spawnEnemies(5);
spawnPowerUps(3); // إنشاء 3 تعزيزات
gameLoop();
