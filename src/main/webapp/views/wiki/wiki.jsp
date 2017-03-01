<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="w" tagdir="/WEB-INF/tags/wiki/"%>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="google-site-verification"
	content="ItIJdlZhuvHIZVeAB1amAdQvFUipqer5tzNy2O_pVM4" />
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
.footer {
	position: absolute;
	right: 0;
	bottom: 0;
	margin: 0 auto;
	width: 50%;
}

@font-face {
	font-family: OpenBaskerville;
	src: url("http://www.antonytrupe.com/OpenBaskerville-0.0.75.otf")
		format("opentype");
}

@font-face {
	font-family: Open Sans;
	src: url("https://fonts.googleapis.com/css?family=Open+Sans")
		format("opentype");
}

html, body {
	height: 100%;
	margin: 0 !important;
	font-family: Open Sans !important
}

a, a:visited {
	color: #0066cc;
	text-decoration: none;
}

a:hover {
	color: #0066cc;
	text-decoration: underline;
}

body, table td, select, button {
	font-family: Arial Unicode MS, Arial, sans-serif;
	font-size: small;
}
</style>
<title><c:if test="${decodedName !='home'}">${decodedName}|</c:if>${domain}</title>
</head>
<body>${content}
	<w:footer encodedName="${encodedName}"></w:footer>
</body>
</html>