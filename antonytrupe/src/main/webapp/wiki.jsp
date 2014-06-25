<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="google-site-verification"
	content="ItIJdlZhuvHIZVeAB1amAdQvFUipqer5tzNy2O_pVM4" />
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
	src: url("http://fonts.googleapis.com/css?family=Open+Sans")
		format("opentype");
}

html,body {
	height: 100%;
	margin: 0 !important;
	font-family: Open Sans !important
}

a,a:visited {
	color: #0066cc;
	text-decoration: none;
}

a:hover {
	color: #0066cc;
	text-decoration: underline;
}

body,table td,select,button {
	font-family: Arial Unicode MS, Arial, sans-serif;
	font-size: small;
}
</style>
<title>${title}</title>
</head>
<body>${content}
	<div class="footer">
		<a href="/edit/${title}" style="font-weight:bold;" title="edit">&#8601;</a>
		<a href="login.html?return_to=/${title}" style="font-weight:bold;" title="log in">&#8658;</a>
	</div>
</body>
</html>