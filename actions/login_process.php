<?php
session_start();
require '../includes/connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];
    $stmt = $pdo->prepare("SELECT * FROM employees WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        $_SESSION['user'] = $user;
        header('Location: ../index.php');
        exit();
    } else {
        $error = "البريد الإلكتروني غير مسجل";
        header('Location: ../views/login.php?error=' . urlencode($error));
        exit();
    }
}
?>