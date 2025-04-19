<?php
include 'includes/auth.php';
include 'includes/connect.php';

$user = $_SESSION['user'];
$action = $_POST['action'];
$lat = $_POST['lat'];
$lng = $_POST['lng'];
$now = date("Y-m-d H:i:s");

if ($action == 'checkin') {
    $conn->query("INSERT INTO attendance (employee_id, check_in, lat_in, lng_in, status)
                  VALUES ({$user['id']}, '$now', '$lat', '$lng', 'present')");
} elseif ($action == 'checkout') {
    $conn->query("UPDATE attendance SET check_out = '$now', lat_out = '$lat', lng_out = '$lng'
                  WHERE employee_id = {$user['id']} AND check_out IS NULL ORDER BY id DESC LIMIT 1");
}

header("Location: dashboard.php");
