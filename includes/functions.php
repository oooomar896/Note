<?php
function getEmployeeName($pdo, $id) {
    $stmt = $pdo->prepare("SELECT name FROM employees WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetchColumn();
}

function recordAttendance($pdo, $employee_id, $type) {
    $date = date('Y-m-d');
    $time = date('H:i:s');
    
    if ($type == 'in') {
        $stmt = $pdo->prepare("INSERT INTO attendance (employee_id, date, check_in) VALUES (?, ?, ?)");
        return $stmt->execute([$employee_id, $date, $time]);
    } else if ($type == 'out') {
        $stmt = $pdo->prepare("UPDATE attendance SET check_out = ? WHERE employee_id = ? AND date = ?");
        return $stmt->execute([$time, $employee_id, $date]);
    }
    return false;
}
?>