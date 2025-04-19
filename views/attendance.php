<?php
session_start();
require '../includes/connect.php';
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    header('Location: login.php');
    exit();
}
$stmt = $pdo->query("SELECT a.*, e.name FROM attendance a JOIN employees e ON a.employee_id = e.id ORDER BY date DESC");
$records = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <title>سجلات الحضور</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <h2>سجلات الحضور</h2>
    <table border="1">
        <tr><th>الموظف</th><th>التاريخ</th><th>وقت الحضور</th><th>وقت الانصراف</th></tr>
        <?php foreach ($records as $row): ?>
        <tr>
            <td><?php echo $row['name']; ?></td>
            <td><?php echo $row['date']; ?></td>
            <td><?php echo $row['check_in']; ?></td>
            <td><?php echo $row['check_out']; ?></td>
        </tr>
        <?php endforeach; ?>
    </table>
</body>
</html>