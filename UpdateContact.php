<?php
header("Access-Control-Allow-Origin: http://poosdgroup1.xyz");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

session_start();
if (!isset($_SESSION['userId'])) {
    echo json_encode(["error" => "User not logged in."]);
    exit;
}

$inData = json_decode(file_get_contents('php://input'), true);

$contactId = $inData["id"] ?? 0;
$firstName = $inData["firstName"] ?? '';
$lastName  = $inData["lastName"] ?? '';
$email     = $inData["email"] ?? '';
$phone     = $inData["phone"] ?? '';
$userId    = $_SESSION['userId'];

if (!$contactId || !$firstName || !$lastName || !$email) {
    echo json_encode(["error" => "Missing required fields"]);
    exit;
}

$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "ContactManager");
if ($conn->connect_error) { echo json_encode(["error" => $conn->connect_error]); exit; }

// Ensure the contact belongs to the logged-in user
$stmt = $conn->prepare("UPDATE Contacts SET FirstName=?, LastName=?, Email=?, Phone=? WHERE ID=? AND UserID=?");
$stmt->bind_param("ssssii", $firstName, $lastName, $email, $phone, $contactId, $userId);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["error" => "Update failed: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
