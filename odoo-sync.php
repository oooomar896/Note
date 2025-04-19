<?php
// هذا مجرد مثال – تحتاج مفتاح API صحيح وبيانات Odoo
$ch = curl_init('https://your-odoo-instance.com/api/employees');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer YOUR_API_KEY']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
print_r($data); // عرض بيانات الموظفين من Odoo
?>
