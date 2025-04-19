<?php
require 'connect.php';

$email = $_POST['email'];
$now = date("Y-m-d H:i:s");

$result = $conn->query("SELECT id FROM employees WHERE email = '$email'");
if ($result->num_rows > 0) {
    $emp = $result->fetch_assoc();
    $emp_id = $emp['id'];

    // تحديث آخر سجل حضور بإضافة وقت الانصراف
    $conn->query("UPDATE attendance SET check_out = '$now' WHERE employee_id = $emp_id AND check_out IS NULL ORDER BY id DESC LIMIT 1");

    echo "تم تسجيل الانصراف بنجاح.";
} else {
    echo "البريد الإلكتروني غير مسجل.";
}
?>
