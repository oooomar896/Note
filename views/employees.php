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