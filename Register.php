<?php
header("Access-Control-Allow-Origin: http://poosdgroup1.xyz");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$inData = json_decode(file_get_contents('php://input'), true);
$firstName = trim($inData['firstName']);
$lastName  = trim($inData['lastName']);
$login     = trim($inData['login']);
$password  = trim($inData['password']); // ideally hashed

$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "ContactManager");
if ($conn->connect_error) {
    returnWithError($conn->connect_error);
    exit();
}

// Check if username already exists
$stmt = $conn->prepare("SELECT ID FROM Users WHERE Login=?");
$stmt->bind_param("s", $login);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows > 0) {
    returnWithError("Username already exists.");
    $stmt->close();
    $conn->close();
    exit();
}
$stmt->close();

// Insert new user
$stmt = $conn->prepare("INSERT INTO Users (FirstName, LastName, Login, Password) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $firstName, $lastName, $login, $password);
if ($stmt->execute()) {
    returnWithInfo("User registered successfully.");
} else {
    returnWithError($stmt->error);
}

$stmt->close();
$conn->close();

function sendResultInfoAsJson($obj) {
    header('Content-type: application/json');
    echo $obj;
}

function returnWithError($err) {
    $retValue = '{"error":"' . $err . '"}';
    sendResultInfoAsJson($retValue);
}

function returnWithInfo($msg) {
    $retValue = '{"error":"","message":"' . $msg . '"}';
    sendResultInfoAsJson($retValue);
}
?>
