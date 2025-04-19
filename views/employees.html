<?php
session_start();
require '../includes/connect.php';
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    header('Location: login.php');
    exit();
}
$stmt = $pdo->query("SELECT * FROM employees");
$employees = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <title>إدارة الموظفين</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <h2>الموظفون</h2>
    <table border="1">
        <tr><th>الاسم</th><th>البريد</th><th>الدور</th></tr>
        <?php foreach ($employees as $emp): ?>
        <tr>
            <td><?php echo $emp['name']; ?></td>
            <td><?php echo $emp['email']; ?></td>
            <td><?php echo $emp['role']; ?></td>
        </tr>
        <?php endforeach; ?>
    </table>
</body>
</html>
