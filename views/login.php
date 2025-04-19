<?php
$error = $_GET['error'] ?? '';
?>
<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <title>تسجيل الدخول</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body class="login-body">
    <div class="login-container">
        <h2>تسجيل الدخول</h2>
        <form method="POST" action="../actions/login_process.php">
            <input type="email" name="email" placeholder="البريد الإلكتروني" required>
            <button type="submit">دخول</button>
            <?php if ($error): ?>
                <p class="error"><?php echo $error; ?></p>
            <?php endif; ?>
        </form>
    </div>
</body>
</html>
