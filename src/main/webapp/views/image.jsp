<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ page
	import="com.google.appengine.api.blobstore.BlobstoreServiceFactory"%>
<%@ page import="com.google.appengine.api.blobstore.BlobstoreService"%>

<html>
<head>
<title>Upload Test</title>
</head>
<body>
	<form action="${uploadUrl}" method="post" enctype="multipart/form-data">
		<input type="file" name="myFile"> <input type="submit"
			value="Submit">
	</form>
</body>
</html>