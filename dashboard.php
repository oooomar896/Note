<?php include 'includes/auth.php'; ?>
<!DOCTYPE html>
<html lang="ar">
<head><meta charset="UTF-8"><title>لوحة التحكم</title>
<link rel="stylesheet" href="assets/css/style.css">
<script src="assets/js/location.js"></script>
</head>
<body>
    <h2>مرحبًا، <?= $_SESSION['user']['name'] ?></h2>
    <form method="POST" action="attendance.php" onsubmit="getLocation()">
        <input type="hidden" name="action" value="checkin">
        <input type="hidden" name="lat" id="lat">
        <input type="hidden" name="lng" id="lng">
        <button type="submit">تسجيل الحضور</button>
    </form>

    <form method="POST" action="attendance.php" onsubmit="getLocation()">
        <input type="hidden" name="action" value="checkout">
        <input type="hidden" name="lat" id="lat">
        <input type="hidden" name="lng" id="lng">
        <button type="submit">تسجيل الانصراف</button>
    </form>

    <a href="logout.php">تسجيل الخروج</a>
</body>
</html>
