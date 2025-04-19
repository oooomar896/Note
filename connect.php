<?php
$conn = new mysqli("localhost", "root", "", "hr_system");

if ($conn->connect_error) {
    die("فشل الاتصال بقاعدة البيانات: " . $conn->connect_error);
}
?>
