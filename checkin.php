<?php
require 'connect.php';

$email = $_POST['email'];
$now = date("Y-m-d H:i:s");

$result = $conn->query("SELECT id FROM employees WHERE email = '$email'");
if ($result->num_rows > 0) {
    $emp = $result->fetch_assoc();
    $emp_id = $emp['id'];

    $conn->query("INSERT INTO attendance (employee_id, check_in, status) VALUES ($emp_id, '$now', 'present')");
    echo "تم تسجيل الحضور بنجاح.";
} else {
    echo "البريد الإلكتروني غير مسجل.";
}
?>
