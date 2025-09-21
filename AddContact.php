<?php
// CORS headers (allow credentials)
header("Access-Control-Allow-Origin: http://www.poosdgroup1.xyz");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();  // start session

$inData = getRequestInfo();

// Check if user is logged in
if (!isset($_SESSION['userId'])) {
    returnWithError("User not logged in.");
    exit;
}

$userId = $_SESSION['userId'];  // use session ID only
$firstName = $inData["firstName"] ?? '';
$lastName  = $inData["lastName"]  ?? '';
$email     = $inData["email"]     ?? '';
$phone     = $inData["phone"]     ?? '';

// Validate required fields
if (!$firstName || !$lastName || !$email) {
    returnWithError("First name, last name, and email are required.");
    exit;
}

$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "ContactManager");
if ($conn->connect_error) {
    returnWithError($conn->connect_error);
    exit;
}

// Prepare statement
$stmt = $conn->prepare("INSERT INTO Contacts (UserId, FirstName, LastName, Email, Phone) VALUES (?, ?, ?, ?, ?)");
if (!$stmt) {
    returnWithError("Prepare failed: " . $conn->error);
    exit;
}

// Bind parameters and execute
$stmt->bind_param("issss", $userId, $firstName, $lastName, $email, $phone);

if ($stmt->execute()) {
    // Return inserted contact info (including new ID)
    $newId = $stmt->insert_id;
    $retValue = [
        "id"        => $newId,
        "firstName" => $firstName,
        "lastName"  => $lastName,
        "email"     => $email,
        "phone"     => $phone,
        "error"     => ""
    ];
    sendResultInfoAsJson(json_encode($retValue));
} else {
    returnWithError("Insert failed: " . $stmt->error);
}

$stmt->close();
$conn->close();

// --------------------- Functions ---------------------
function getRequestInfo() {
    return json_decode(file_get_contents('php://input'), true);
}

function sendResultInfoAsJson($obj) {
    header('Content-type: application/json');
    echo $obj;
}

function returnWithError($err) {
    $retValue = ["error" => $err];
    sendResultInfoAsJson(json_encode($retValue));
}
?>
