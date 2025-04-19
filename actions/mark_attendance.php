<?php
session_start();
require '../includes/connect.php';
require '../includes/functions.php';

if (isset($_SESSION['user'])) {
    $type = $_GET['type'] ?? 'in';
    $employee_id = $_SESSION['user']['id'];
    recordAttendance($pdo, $employee_id, $type);
}

header('Location: ../views/dashboard.php');
exit();
?>