<?php
// Add CORS headers at the very top
header("Access-Control-Allow-Origin: http://poosdgroup1.xyz");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start(); // Start session at the top

$inData = getRequestInfo();

$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "ContactManager"); 	
if ($conn->connect_error) {
    returnWithError($conn->connect_error);
    exit;
}

// Use prepared statement to prevent SQL injection
$stmt = $conn->prepare("SELECT ID, FirstName, LastName, Password FROM Users WHERE Login=?");
$stmt->bind_param("s", $inData["login"]);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    // Check password (plain text for now; consider hashing)
    if ($row["Password"] === $inData["password"]) {
        // Store user ID in session
        $_SESSION['userID'] = $row['ID'];
        returnWithInfo($row['FirstName'], $row['LastName'], $row['ID']);
    } else {
        returnWithError("Invalid password");
    }
} else {
    returnWithError("No Records Found");
}

$stmt->close();
$conn->close();

function getRequestInfo() {
    return json
