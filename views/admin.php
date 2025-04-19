<?php
session_start();
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    header('Location: login.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <title>لوحة تحكم المدير</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body class="admin-body">
    <div class="admin-container">
        <h2>مرحبًا، <?php echo $_SESSION['user']['name']; ?></h2>
        <a href="attendance.php" class="btn">سجلات الحضور</a>
        <a href="employees.php" class="btn">إدارة الموظفين</a>
        <a href="../actions/logout.php" class="btn logout">تسجيل الخروج</a>
    </div>
</body>
</html>

