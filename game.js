// game.js
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player = {
    x: 400,
    y: 300,
    size: 30,
    speed: 5,
    color: "green",
    armor: 0, // خاصية الدرع
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

let gameStarted = false; // حالة اللعبة: لم تبدأ بعد

let clouds = []; // قائمة السحب
let lightIntensity = 1; // شدة الإضاءة

let buildings = []; // قائمة المباني
let trees = []; // قائمة الأشجار

let lake = { x: 200, y: canvas.height / 2 + 100, width: 300, height: 150 }; // بحيرة

let mountains = []; // قائمة الجبال
let birds = []; // قائمة الطيور

let grassPatches = []; // قائمة الأعشاب

let npcs = []; // قائمة الشخصيات غير القابلة للعب (NPCs)

let icons = {
    player: "\uf6fc", // أيقونة شخصية اللاعب (Running)
    enemy: "\uf556", // أيقونة العدو (Angry Face)
    npc: "\uf183", // أيقونة الشخص (Standing Person)
    tree: "\uf1bb", // أيقونة الشجرة
    building: "\uf1ad", // أيقونة المبنى
    bird: "\uf535", // أيقونة الطائر (Dove)
    grass: "\uf06c", // أيقونة العشب
    lake: "\uf043", // أيقونة الماء
    cloud: "\uf0c2", // أيقونة السحابة
};

let leaderboard = []; // قائمة المتصدرين
let isPaused = false; // حالة التوقف المؤقت

let teamMembers = []; // قائمة أعضاء الفريق

function drawIcon(icon, x, y, size, color, glow = false) {
    if (glow) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
    }
    ctx.fillStyle = color;
    ctx.font = `${size}px FontAwesome`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icon, x, y);
    if (glow) ctx.restore();
}

// Dynamically set canvas size to expand the playable area
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Adjust the zone to match the new canvas size
zone = { x: canvas.width / 2, y: canvas.height / 2, radius: 500, shrinkRate: 0.5 };

document.addEventListener("keydown", (e) => {
    if (!gameStarted && (e.key === "Enter" || e.key === "enter")) {
        gameStarted = true; // تغيير حالة اللعبة إلى بدأت
        gameLoop(); // بدء اللعبة
    }
    if (e.key === " ") shootBullet(); // إطلاق الرصاص عند الضغط على Space
    keys[e.key] = true;
});
document.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

document.addEventListener("keydown", (e) => {
    if (e.key === "p" || e.key === "P") togglePause(); // تبديل حالة التوقف المؤقت عند الضغط على P
});

function showStartScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // مسح الشاشة
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height); // خلفية سوداء
    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Press Enter to Start", canvas.width / 2, canvas.height / 2);
}

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
            type: ["health", "speed", "armor"][Math.floor(Math.random() * 3)], // إضافة نوع الدرع
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

// Improved enemy AI to avoid obstacles and target the player strategically
function updateEnemies() {
    enemies.forEach((enemy) => {
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        // Avoid obstacles (e.g., buildings)
        buildings.forEach((building) => {
            let bx = building.x - enemy.x;
            let by = building.y - enemy.y;
            let buildingDist = Math.sqrt(bx * bx + by * by);
            if (buildingDist < building.width) {
                dx += bx * 0.5; // Adjust direction to avoid building
                dy += by * 0.5;
            }
        });

        // Move towards the player
        enemy.x += (dx / dist) * enemy.speed;
        enemy.y += (dy / dist) * enemy.speed;

        // Reduce player health on collision
        if (dist < player.size + enemy.size / 2) {
            if (player.armor > 0) {
                player.armor -= 1; // Reduce armor first
            } else {
                playerHealth -= 1; // Reduce health if no armor
            }
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

// Add scoring bonuses for specific actions
function checkCollisions() {
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            let dx = bullet.x - enemy.x;
            let dy = bullet.y - enemy.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bullet.size + enemy.size / 2) {
                enemy.health -= 25; // Reduce enemy health
                bullets.splice(bIndex, 1);
                if (enemy.health <= 0) {
                    enemies.splice(eIndex, 1);
                    score += 10; // Base score for defeating an enemy
                    if (enemy.speed > 2) score += 5; // Bonus for faster enemies
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

// Add bonuses for collecting power-ups
function checkPowerUpCollision() {
    powerUps.forEach((powerUp, index) => {
        let dx = player.x - powerUp.x;
        let dy = player.y - powerUp.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.size / 2 + powerUp.size / 2) {
            if (powerUp.type === "health") {
                playerHealth = Math.min(playerHealth + 20, 100); // Restore health
                score += 5; // Bonus for health power-up
            } else if (powerUp.type === "speed") {
                player.speed *= 2; // Temporary speed boost
                setTimeout(() => {
                    player.speed /= 2; // Reset speed
                }, powerUp.duration);
                score += 10; // Bonus for speed power-up
            } else if (powerUp.type === "armor") {
                player.armor = Math.min(player.armor + 10, 50); // Increase armor
                score += 15; // Bonus for armor power-up
            }
            powerUps.splice(index, 1); // Remove power-up after collection
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
    const gradient = ctx.createRadialGradient(zone.x, zone.y, zone.radius / 2, zone.x, zone.y, zone.radius);
    gradient.addColorStop(0, "rgba(0, 0, 255, 0.2)");
    gradient.addColorStop(1, "rgba(0, 0, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fill();
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
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, "green");
    gradient.addColorStop(1, "yellow");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, (health / maxHealth) * width, height);
}

function drawShieldBar(x, y, width, height, shield, maxShield) {
    ctx.fillStyle = "gray";
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = "blue";
    ctx.fillRect(x, y, (shield / maxShield) * width, height);
}

function drawPlayer() {
    drawIcon(icons.player, player.x + player.size / 2, player.y + player.size / 2, player.size, "green");
    drawHealthBar(player.x, player.y - 20, player.size, 5, playerHealth, 100); // شريط صحة اللاعب
    drawShieldBar(player.x, player.y - 10, player.size, 5, player.armor, 50); // شريط الدرع
}

function drawEnemies() {
    enemies.forEach((enemy) => {
        drawIcon(icons.enemy, enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, enemy.size, "red", true);
        drawHealthBar(enemy.x, enemy.y - 10, enemy.size, 5, enemy.health, 50); // شريط صحة العدو
    });
}

function drawBullets() {
    bullets.forEach((bullet) => {
        ctx.fillStyle = "yellow";
        ctx.shadowColor = "yellow";
        ctx.shadowBlur = 10; // إضافة تأثير التوهج للرصاص
        ctx.fillRect(bullet.x, bullet.y, bullet.size, bullet.size);
    });
}

function drawBot() {
    if (bot.isAlive) {
        drawIcon(icons.enemy, bot.x + bot.size / 2, bot.y + bot.size / 2, bot.size, "red", true);
    }
}

function drawPowerUps() {
    powerUps.forEach((powerUp) => {
        const color = powerUp.type === "health" ? "green" : powerUp.type === "speed" ? "blue" : "gray";
        drawIcon(icons.lake, powerUp.x, powerUp.y, powerUp.size, color, true);
    });
}

function drawHUD() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, 200, 140);

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`Enemies: ${enemies.length}`, 10, 20);
    ctx.fillText(`Zone Radius: ${Math.round(zone.radius)}`, 10, 40);
    ctx.fillText(`Score: ${score}`, 10, 60);
    ctx.fillText(
        `Time: ${String(Math.floor(gameTime / 60)).padStart(2, "0")}:${String(gameTime % 60).padStart(2, "0")}`,
        10,
        80
    );
    ctx.fillText(`Level: ${level}`, 10, 100);
    ctx.fillText(`Armor: ${player.armor}`, 10, 120);
}

function updatePlayerPosition() {
    if (player.x < 0) player.x = 0;
    if (player.x + player.size > canvas.width) player.x = canvas.width - player.size;
    if (player.y < 0) player.y = 0;
    if (player.y + player.size > canvas.height) player.y = canvas.height - player.size;
}

let weather = "clear"; // حالة الطقس الحالية
let timeOfDay = 0; // وقت اليوم (0-1439 يمثل الدقائق في اليوم)

// Add dynamic weather transitions
function updateWeather() {
    const weatherTypes = ["clear", "rain", "fog", "storm"];
    if (Math.random() < 0.005) { // Reduce frequency of weather changes
        const previousWeather = weather;
        weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        if (weather !== previousWeather) {
            console.log(`Weather changed to: ${weather}`);
        }
    }
}

// Function to draw weather effects
function drawWeather() {
    if (weather === "rain") {
        drawRain();
    } else if (weather === "fog") {
        drawFog();
    } else if (weather === "storm") {
        drawRain();
        drawLightning();
    }
}

// Function to draw rain
function drawRain() {
    ctx.save();
    ctx.strokeStyle = "rgba(173, 216, 230, 0.7)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 2, y + 10);
        ctx.stroke();
    }
    ctx.restore();
}

// Function to draw lightning
function drawLightning() {
    if (Math.random() < 0.02) {
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
}

// Function to update the day-night cycle
function updateDayNightCycle() {
    timeOfDay = (timeOfDay + 1) % 1440; // Increment time and loop back after 1440 minutes
    lightIntensity = 0.5 + 0.5 * Math.cos((timeOfDay / 1440) * 2 * Math.PI); // Adjust light intensity
}

// Function to draw the day-night background
function drawDayNightCycle() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (timeOfDay < 360 || timeOfDay > 1080) {
        // Night
        gradient.addColorStop(0, "black");
        gradient.addColorStop(1, "darkblue");
    } else if (timeOfDay < 540) {
        // Sunrise
        gradient.addColorStop(0, "orange");
        gradient.addColorStop(1, "lightblue");
    } else if (timeOfDay < 900) {
        // Day
        gradient.addColorStop(0, "skyblue");
        gradient.addColorStop(1, "white");
    } else {
        // Sunset
        gradient.addColorStop(0, "orange");
        gradient.addColorStop(1, "darkblue");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Update the `update` function to include weather and day-night updates
function update() {
    if (playerHealth <= 0) {
        updateLeaderboard(); // تحديث قائمة المتصدرين عند الخسارة
        alert("Game Over!"); // إنهاء اللعبة عند نفاد صحة اللاعب
        document.location.reload();
    }
    if (keys["ArrowUp"]) player.y -= player.speed;
    if (keys["ArrowDown"]) player.y += player.speed;
    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;
    updatePlayerPosition(); // Ensure player stays within boundaries
    updateEnemies();
    updateBullets(); // تحديث حركة الرصاص
    checkCollisions();
    checkBotCollision(); // التحقق من اصطدام الرصاص مع البوت
    checkPowerUpCollision(); // التحقق من جمع التعزيزات
    updateZone();
    updateClouds(); // تحديث حركة السحب
    updateTreeMovement(); // تحديث حركة الأشجار
    updateBirds(); // تحديث حركة الطيور
    updateLakeWaves(); // تحديث حركة المياه في البحيرة
    updateNPCs(); // تحديث حركة الشخصيات غير القابلة للعب
    updateLighting(); // تحديث الإضاءة الديناميكية
    updateWeather(); // تحديث الطقس
    updateDayNightCycle(); // تحديث دورة اليوم والليل
    checkLevelUp(); // التحقق من رفع المستوى
    checkVictory(); // التحقق من الفوز
    updateTeamMembers(); // تحديث حركة أعضاء الفريق
}

// Add weather effects to the `draw` function
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawDayNightCycle(); // رسم تأثير اليوم والليل
    drawSunset(); // رسم تأثير الغروب
    drawMountains(); // رسم الجبال
    drawGrass(); // رسم العشب
    drawPaths(); // رسم المسارات
    drawLake(); // رسم البحيرة
    drawLakeWaves(); // رسم حركة المياه في البحيرة
    drawLakeReflection(); // رسم انعكاس البحيرة
    drawBuildings(); // رسم المباني
    drawBuildingDetails(); // إضافة تفاصيل المباني
    drawTreeShadows(); // رسم ظلال الأشجار
    drawTrees(); // رسم الأشجار
    drawGrassPatches(); // رسم الأعشاب المتحركة
    drawBirds(); // رسم الطيور
    drawNPCs(); // رسم الشخصيات غير القابلة للعب
    drawGrid(); // رسم الشبكة
    drawDynamicLighting(); // رسم الإضاءة الديناميكية
    drawClouds(); // رسم السحب
    drawLighting(); // إضافة تأثير الإضاءة الديناميكية
    drawDynamicShadows(); // إضافة الظلال الديناميكية
    drawReflections(); // إضافة الانعكاسات
    drawPlayer();
    drawEnemies(); // Draw enemies with improved AI
    drawBullets(); // رسم الرصاص
    drawBot(); // رسم البوت
    drawPowerUps(); // رسم التعزيزات
    drawZone();
    drawWeather(); // رسم تأثيرات الطقس
    drawFog(); // إضافة تأثير الضباب
    drawHUD();
    drawMinimap(); // Add the minimap
    drawLeaderboard(); // Add the leaderboard
    drawTeamMembers(); // رسم أعضاء الفريق
}

function checkLevelUp() {
    if (score >= level * levelUpScore) {
        level += 1; // رفع مستوى اللعبة
        spawnEnemies(5 + level * 2); // زيادة عدد الأعداء
        enemies.forEach((enemy) => {
            enemy.speed += 0.5; // زيادة سرعة الأعداء
        });
        spawnTeamMember(); // إضافة عضو جديد للفريق
        alert(`Level Up! You are now on level ${level}`); // رسالة إعلامية
    }
}

function checkVictory() {
    if (score >= victoryScore) {
        updateLeaderboard(); // تحديث قائمة المتصدرين عند الفوز
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
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"; // لون الدوائر وخط شفاف

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let radius = 100; radius <= canvas.width; radius += 50) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); // رسم دوائر الارتفاع
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
    gradient.addColorStop(0.4, "brown");
    gradient.addColorStop(0.7, "darkgreen");
    gradient.addColorStop(1, "blue");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawElevationCircles(); // إضافة تأثير التلال الخطية
}

function drawShadows() {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; // لون الظل مع شفافية
    enemies.forEach((enemy) => {
        ctx.beginPath();
        ctx.ellipse(
            enemy.x + enemy.size / 2,
            enemy.y + enemy.size,
            enemy.size / 2,
            enemy.size / 4,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
    ctx.restore();
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

function drawLighting() {
    const gradient = ctx.createRadialGradient(
        player.x + player.size / 2,
        player.y + player.size / 2,
        50,
        player.x + player.size / 2,
        player.y + player.size / 2,
        300
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");

    ctx.fillStyle = gradient;
    ctx.globalCompositeOperation = "lighter";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";
}

function drawDynamicShadows() {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; // لون الظل مع شفافية

    // ظل اللاعب
    ctx.beginPath();
    ctx.ellipse(
        player.x + player.size / 2,
        player.y + player.size,
        player.size / 2,
        player.size / 4,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // ظلال الأعداء
    enemies.forEach((enemy) => {
        ctx.beginPath();
        ctx.ellipse(
            enemy.x + enemy.size / 2,
            enemy.y + enemy.size,
            enemy.size / 2,
            enemy.size / 4,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });

    ctx.restore();
}

function drawFog() {
    const fogGradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        100,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width
    );
    fogGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    fogGradient.addColorStop(1, "rgba(255, 255, 255, 0.5)");

    ctx.fillStyle = fogGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawReflections() {
    ctx.save();
    ctx.globalAlpha = 0.3; // شفافية الانعكاسات
    ctx.scale(1, -1); // عكس الرسم عموديًا
    ctx.translate(0, -canvas.height * 2); // نقل الرسم للأسفل

    // انعكاس اللاعب
    drawIcon(icons.player, player.x + player.size / 2, canvas.height - player.y - player.size / 2, player.size, "green");

    // انعكاسات الأعداء
    enemies.forEach((enemy) => {
        drawIcon(icons.enemy, enemy.x + enemy.size / 2, canvas.height - enemy.y - enemy.size / 2, enemy.size, "red");
    });

    // انعكاسات الأشجار
    trees.forEach((tree) => {
        drawIcon(icons.tree, tree.x + tree.size / 2, canvas.height - tree.y, tree.size, "darkgreen");
    });

    ctx.restore();
}

function drawSky() {
    let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
    gradient.addColorStop(0, "skyblue");
    gradient.addColorStop(1, "white");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
}

function drawGrass() {
    ctx.fillStyle = "green";
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
}

function drawBuildings() {
    buildings.forEach((building) => {
        drawIcon(icons.building, building.x + building.width / 2, building.y + building.height / 2, building.width, "gray");
    });
}

function drawBuildingDetails() {
    buildings.forEach((building) => {
        ctx.fillStyle = "black";
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 2; j++) {
                ctx.fillRect(
                    building.x + 10 + j * 20,
                    building.y + 10 + i * 20,
                    10,
                    10
                ); // رسم النوافذ
            }
        }
    });
}

function drawTrees() {
    trees.forEach((tree) => {
        drawIcon(icons.tree, tree.x + tree.size / 2, tree.y, tree.size, "darkgreen");
    });
}

function drawTreeShadows() {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    trees.forEach((tree) => {
        ctx.beginPath();
        ctx.ellipse(
            tree.x + tree.size / 2,
            tree.y + tree.size,
            tree.size / 2,
            tree.size / 4,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
    ctx.restore();
}

function drawLake() {
    drawIcon(icons.lake, lake.x + lake.width / 2, lake.y + lake.height / 2, lake.width / 2, "blue");
}

function drawPaths() {
    ctx.strokeStyle = "sandybrown";
    ctx.lineWidth = 10;

    // مسار أفقي
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2 + 50);
    ctx.lineTo(canvas.width, canvas.height / 2 + 50);
    ctx.stroke();

    // مسار عمودي
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
}

function updateTreeMovement() {
    trees.forEach((tree) => {
        tree.x += Math.sin(gameTime / 50) * 0.5; // حركة بسيطة بفعل الرياح
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawDayNightCycle(); // رسم تأثير اليوم والليل
    drawSunset(); // رسم تأثير الغروب
    drawMountains(); // رسم الجبال
    drawGrass(); // رسم العشب
    drawPaths(); // رسم المسارات
    drawLake(); // رسم البحيرة
    drawLakeWaves(); // رسم حركة المياه في البحيرة
    drawLakeReflection(); // رسم انعكاس البحيرة
    drawBuildings(); // رسم المباني
    drawBuildingDetails(); // إضافة تفاصيل المباني
    drawTreeShadows(); // رسم ظلال الأشجار
    drawTrees(); // رسم الأشجار
    drawGrassPatches(); // رسم الأعشاب المتحركة
    drawBirds(); // رسم الطيور
    drawNPCs(); // رسم الشخصيات غير القابلة للعب
    drawGrid(); // رسم الشبكة
    drawDynamicLighting(); // رسم الإضاءة الديناميكية
    drawClouds(); // رسم السحب
    drawLighting(); // إضافة تأثير الإضاءة الديناميكية
    drawDynamicShadows(); // إضافة الظلال الديناميكية
    drawReflections(); // إضافة الانعكاسات
    drawPlayer();
    drawEnemies();
    drawBullets(); // رسم الرصاص
    drawBot(); // رسم البوت
    drawPowerUps(); // رسم التعزيزات
    drawZone();
    drawWeather(); // رسم تأثيرات الطقس
    drawFog(); // إضافة تأثير الضباب
    drawHUD();
    drawMinimap(); // Add the minimap
    drawLeaderboard(); // Add the leaderboard
    drawTeamMembers(); // رسم أعضاء الفريق
}

function gameLoop() {
    if (!gameStarted) {
        showStartScreen(); // عرض شاشة البداية إذا لم تبدأ اللعبة
        return;
    }
    if (isPaused) return; // إيقاف التحديث والرسم إذا كانت اللعبة متوقفة مؤقتًا
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// استدعاء updateTimer كل ثانية
setInterval(updateTimer, 1000);

function updateTimer() {
    gameTime += 1; // زيادة الوقت بمقدار ثانية
}

function spawnClouds(count) {
    for (let i = 0; i < count; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height / 2,
            size: Math.random() * 50 + 50,
            speed: Math.random() * 0.5 + 0.2,
        });
    }
}

function updateClouds() {
    clouds.forEach((cloud) => {
        cloud.x += cloud.speed;
        if (cloud.x > canvas.width) cloud.x = -cloud.size; // إعادة السحابة إلى البداية عند خروجها
    });
}

function drawClouds() {
    clouds.forEach((cloud) => {
        drawIcon(icons.cloud, cloud.x, cloud.y, cloud.size, "rgba(255, 255, 255, 0.8)", true);
    });
}

function updateLighting() {
    lightIntensity = 0.5 + 0.5 * Math.sin(gameTime / 60); // تغيير شدة الإضاءة بناءً على الوقت
}

function drawDynamicLighting() {
    const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        100,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${lightIntensity})`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function spawnBuildings(count) {
    for (let i = 0; i < count; i++) {
        buildings.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height / 2 + canvas.height / 2,
            width: Math.random() * 50 + 50,
            height: Math.random() * 50 + 50,
            color: "gray",
        });
    }
}

function spawnTrees(count) {
    for (let i = 0; i < count; i++) {
        trees.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height / 2 + canvas.height / 2,
            size: Math.random() * 30 + 20,
            color: "darkgreen",
        });
    }
}

function spawnGrassPatches(count) {
    for (let i = 0; i < count; i++) {
        grassPatches.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height / 2 + canvas.height / 2,
            size: Math.random() * 20 + 10,
            sway: Math.random() * 2, // حركة التمايل
        });
    }
}

function drawGrassPatches() {
    grassPatches.forEach((grass) => {
        drawIcon(icons.grass, grass.x, grass.y, grass.size, "green");
    });
}

function drawSunset() {
    let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "orange");
    gradient.addColorStop(0.5, "pink");
    gradient.addColorStop(1, "purple");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function updateLakeWaves() {
    lake.waves = lake.waves || [];
    if (lake.waves.length < 10) {
        lake.waves.push({
            x: Math.random() * lake.width + lake.x,
            y: Math.random() * lake.height + lake.y,
            radius: Math.random() * 5 + 2,
            speed: Math.random() * 0.5 + 0.2,
        });
    }

    lake.waves.forEach((wave, index) => {
        wave.radius += wave.speed;
        if (wave.radius > 20) lake.waves.splice(index, 1); // إزالة الموجة عند انتهاء تأثيرها
    });
}

function drawLakeWaves() {
    lake.waves = lake.waves || [];
    lake.waves.forEach((wave) => {
        drawIcon(icons.lake, wave.x, wave.y, wave.radius * 2, "rgba(0, 0, 255, 0.5)");
    });
}

function spawnMountains(count) {
    for (let i = 0; i < count; i++) {
        mountains.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height / 3,
            width: Math.random() * 200 + 100,
            height: Math.random() * 100 + 50,
            color: "darkgray",
        });
    }
}

function drawMountains() {
    mountains.forEach((mountain) => {
        ctx.fillStyle = mountain.color;
        ctx.beginPath();
        ctx.moveTo(mountain.x, mountain.y + mountain.height);
        ctx.lineTo(mountain.x + mountain.width / 2, mountain.y);
        ctx.lineTo(mountain.x + mountain.width, mountain.y + mountain.height);
        ctx.closePath();
        ctx.fill();
    });
}

function spawnBirds(count) {
    for (let i = 0; i < count; i++) {
        birds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height / 3,
            size: Math.random() * 10 + 5,
            speed: Math.random() * 1 + 0.5,
        });
    }
}

function updateBirds() {
    birds.forEach((bird) => {
        bird.x += bird.speed;
        if (bird.x > canvas.width) bird.x = -bird.size; // إعادة الطائر إلى البداية عند خروجه
    });
}

function drawBirds() {
    birds.forEach((bird) => {
        drawIcon(icons.bird, bird.x, bird.y, bird.size, "black");
    });
}

function drawLakeReflection() {
    ctx.save();
    ctx.globalAlpha = 0.3; // شفافية الانعكاس
    ctx.scale(1, -1); // عكس الرسم عموديًا
    ctx.translate(0, -canvas.height * 2); // نقل الرسم للأسفل

    // انعكاس الأشجار
    trees.forEach((tree) => {
        ctx.fillStyle = tree.color;
        ctx.beginPath();
        ctx.arc(tree.x + tree.size / 2, canvas.height - tree.y, tree.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // انعكاس المباني
    buildings.forEach((building) => {
        ctx.fillStyle = building.color;
        ctx.fillRect(building.x, canvas.height - building.y - building.height, building.width, building.height);
    });

    ctx.restore();
}

function spawnNPCs(count) {
    for (let i = 0; i < count; i++) {
        npcs.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height / 2 + canvas.height / 2,
            size: 20,
            color: "blue",
            speed: Math.random() * 1 + 0.5,
            direction: Math.random() * Math.PI * 2, // اتجاه الحركة
        });
    }
}

function updateNPCs() {
    npcs.forEach((npc) => {
        npc.x += Math.cos(npc.direction) * npc.speed;
        npc.y += Math.sin(npc.direction) * npc.speed;

        // تغيير الاتجاه عند الاصطدام بحواف الشاشة
        if (npc.x < 0 || npc.x > canvas.width || npc.y < canvas.height / 2 || npc.y > canvas.height) {
            npc.direction = Math.random() * Math.PI * 2;
        }
    });
}

function drawNPCs() {
    npcs.forEach((npc) => {
        drawIcon(icons.npc, npc.x, npc.y, npc.size, "blue");
    });
}

function drawMinimap() {
    const minimapSize = 150;
    const minimapX = canvas.width - minimapSize - 20;
    const minimapY = 20;

    // Draw minimap background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);

    // Draw player on the minimap
    const playerMinimapX = minimapX + (player.x / canvas.width) * minimapSize;
    const playerMinimapY = minimapY + (player.y / canvas.height) * minimapSize;
    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.arc(playerMinimapX, playerMinimapY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw enemies on the minimap
    enemies.forEach((enemy) => {
        const enemyMinimapX = minimapX + (enemy.x / canvas.width) * minimapSize;
        const enemyMinimapY = minimapY + (enemy.y / canvas.height) * minimapSize;
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(enemyMinimapX, enemyMinimapY, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw zone boundary on the minimap
    const zoneMinimapRadius = (zone.radius / canvas.width) * minimapSize;
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(
        minimapX + (zone.x / canvas.width) * minimapSize,
        minimapY + (zone.y / canvas.height) * minimapSize,
        zoneMinimapRadius,
        0,
        Math.PI * 2
    );
    ctx.stroke();
}

function togglePause() {
    isPaused = !isPaused;
    if (!isPaused) gameLoop(); // استئناف اللعبة إذا لم تكن متوقفة
}

function updateLeaderboard() {
    leaderboard.push({ score, time: gameTime });
    leaderboard.sort((a, b) => b.score - a.score); // ترتيب المتصدرين حسب النقاط
    leaderboard = leaderboard.slice(0, 5); // الاحتفاظ بأعلى 5 متصدرين
}

function drawLeaderboard() {
    const leaderboardX = 20;
    const leaderboardY = canvas.height - 150;
    const leaderboardWidth = 200;
    const leaderboardHeight = 130;

    // Draw leaderboard background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(leaderboardX, leaderboardY, leaderboardWidth, leaderboardHeight);

    // Draw leaderboard title
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("Leaderboard", leaderboardX + 10, leaderboardY + 20);

    // Draw leaderboard entries
    leaderboard.forEach((entry, index) => {
        ctx.fillText(
            `${index + 1}. Score: ${entry.score}, Time: ${String(Math.floor(entry.time / 60)).padStart(2, "0")}:${String(entry.time % 60).padStart(2, "0")}`,
            leaderboardX + 10,
            leaderboardY + 40 + index * 20
        );
    });
}

function spawnTeamMember() {
    const newMember = {
        x: player.x + Math.random() * 50 - 25, // بالقرب من اللاعب
        y: player.y + Math.random() * 50 - 25,
        size: 20,
        speed: 4,
        color: "blue",
        health: 100,
    };
    teamMembers.push(newMember);
}

function drawTeamMembers() {
    teamMembers.forEach((member) => {
        drawIcon(icons.npc, member.x + member.size / 2, member.y + member.size / 2, member.size, "blue");
        drawHealthBar(member.x, member.y - 10, member.size, 5, member.health, 100); // شريط صحة العضو
    });
}

function updateTeamMembers() {
    teamMembers.forEach((member, memberIndex) => {
        // اجعل أعضاء الفريق يتبعون اللاعب
        let dx = player.x - member.x;
        let dy = player.y - member.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 50) { // مسافة متابعة
            member.x += (dx / dist) * member.speed;
            member.y += (dy / dist) * member.speed;
        }

        // اجعل أعضاء الفريق يهاجمون الأعداء القريبين
        enemies.forEach((enemy, enemyIndex) => {
            let ex = enemy.x - member.x;
            let ey = enemy.y - member.y;
            let enemyDist = Math.sqrt(ex * ex + ey * ey);
            if (enemyDist < 40) { // مسافة الهجوم
                enemy.health -= 10; // تقليل صحة العدو
                if (enemy.health <= 0) {
                    enemies.splice(enemyIndex, 1); // إزالة العدو إذا انتهت صحته
                    score += 10; // زيادة النقاط
                }
            }
        });

        // تقليل صحة عضو الفريق إذا اصطدم مع عدو
        enemies.forEach((enemy) => {
            let ex = enemy.x - member.x;
            let ey = enemy.y - member.y;
            let enemyDist = Math.sqrt(ex * ex + ey * ey);
            if (enemyDist < member.size / 2 + enemy.size / 2) {
                member.health -= 1; // تقليل صحة عضو الفريق
            }
        });

        // إزالة عضو الفريق إذا انتهت صحته
        if (member.health <= 0) {
            teamMembers.splice(memberIndex, 1);
        }
    });
}

spawnMountains(20); // إنشاء 5 جبال
spawnBuildings(10); // إنشاء 10 مبانٍ
spawnTrees(15); // إنشاء 15 شجرة
spawnGrassPatches(20); // إنشاء 20 عشب متحرك
spawnBirds(10); // إنشاء 10 طيور
spawnNPCs(10); // إنشاء 10 شخصيات غير قابلة للعب
spawnEnemies(5);
spawnPowerUps(3); // إنشاء 3 تعزيزات
spawnClouds(5); // إنشاء 5 سحب
showStartScreen(); // عرض شاشة البداية عند تحميل الصفحة
