<?php
header("Access-Control-Allow-Origin: http://www.poosdgroup1.xyz");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

ini_set('session.cookie_domain', '.poosdgroup1.xyz'); 
session_start();
if (!isset($_SESSION['userId'])) {
    echo json_encode(["error" => "User not logged in."]);
    exit;
}

$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "ContactManager");
if ($conn->connect_error) { echo json_encode(["error" => $conn->connect_error]); exit; }

$userId = $_SESSION['userId'];
$stmt = $conn->prepare("SELECT ID, FirstName, LastName, Email, Phone FROM Contacts WHERE UserID=? ORDER BY FirstName");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$contacts = [];
while ($row = $result->fetch_assoc()) {
    $contacts[] = $row;
}

echo json_encode($contacts);

$stmt->close();
$conn->close();
?>
