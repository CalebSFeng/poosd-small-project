<?php

	$inData = getRequestInfo();
	
    $firstName = $inData["firstName"];
	$lastName = $inData["lastName"];
	$login = $inData["login"];
    $password = $inData["password"];

	$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "ContactManager");
	if ($conn->connect_error) 
	{
		returnWithError( $conn->connect_error );
	} 
	else
	{
        // Check if user login already exists
		$checkLoginStmt = $conn->prepare("SELECT login from Users where login = ?");
		$checkLoginStmt->bind_param("s", $login);
        $checkLoginStmt->execute();
        $checkLoginStmt->store_result();
		
		if ($checkLoginStmt->num_rows > 0) {
        returnWithError($stmt->error);
    } else {
        // Prepare and bind
        $stmt = $conn->prepare("INSERT INTO Users (firstName, lastName, login, password) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $firstName, $lastName, $login, $password);

        if ($stmt->execute()) {
            sendResultInfoAsJson("Account Created Successfully");
        } else {
            returnWithError($stmt->error); 
        }

        $stmt->close();
        $conn->close();
    }
	}

	function getRequestInfo()
	{
		return json_decode(file_get_contents('php://input'), true);
	}

	function sendResultInfoAsJson( $obj )
	{
		header('Content-type: application/json');
		echo $obj;
	}
	
	function returnWithError( $err )
	{
		$retValue = '{"error":"' . $err . '"}';
		sendResultInfoAsJson( $retValue );
	}
	
	
?>
