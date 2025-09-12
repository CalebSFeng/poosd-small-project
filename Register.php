<?php

$inData = getRequestInfo();

$firstName = $inData["firstName"];
$lastName = $inData["lastName"];
$login = $inData["login"];
$password = $inData["password"];

$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "ContactManager");

if ($conn->connect_error) 
{
    returnWithError($conn->connect_error);
} 
else
{
    // Check if user login already exists
    $checkLoginStmt = $conn->prepare("SELECT Login FROM Users WHERE Login = ?");
    $checkLoginStmt->bind_param("s", $login);
    $checkLoginStmt->execute();
    $checkLoginStmt->store_result();
    
    if ($checkLoginStmt->num_rows > 0) 
    {
        returnWithError("Login already exists");
    } 
    else 
    {
        // Prepare and bind insert
        $stmt = $conn->prepare("INSERT INTO Users (FirstName, LastName, Login, Password) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $firstName, $lastName, $login, $password);

        if ($stmt->execute()) {
            sendResultInfoAsJson("Account Created Successfully");
        } else {
            returnWithError($stmt->error); 
        }

        $stmt->close();
    }

    $checkLoginStmt->close();
    $conn->close();
}

	function getRequestInfo()
	{
		return json_decode(file_get_contents('php://input'), true);
	}

	function sendResultInfoAsJson( $obj )
	{
		header('Content-type: application/json');
		echo json_encode(array("success" => $obj));
	}
	
	function returnWithError( $err )
	{
		$retValue = '{"error":"' . $err . '"}';
		sendResultInfoAsJson( $retValue );
	}
	
	
?>
