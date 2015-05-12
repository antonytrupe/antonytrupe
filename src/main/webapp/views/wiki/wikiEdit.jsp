<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions"%>

<!DOCTYPE html PUBLIC >
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<title>${title}-edit</title>
<script
	src="//ajax.googleapis.com/ajax/libs/angularjs/1.2.15/angular.min.js"></script>
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
<script>
	//console.log(document.getElementById("content").innerHTML);

	var wiki = angular.module('wiki', []);

	angular.module('wiki').filter('to_trusted', [ '$sce', function($sce) {
		//console.log(document.getElementById("content").innerHTML);
		return function(text) {
			return $sce.trustAsHtml(text);
		};
	} ]);

	angular.module('wiki').filter(
			'wiki',
			function() {
				return function(text) {
					//console.log(text);
					return text.replace(/\[{2}([^\|\]]*)(?:\|?)(.*?)\]{2}?/g,
							function(match, $1, $2, offset, string) {
								console.log('$1:' + $1);
								console.log('$2:' + $2);
								return '<a href="/' + $1 + '">'
										+ ($2 ? $2 : $1) + "</a>";
							});
				};
			});

	function edit($scope) {
		//console.log(document.getElementById("content").innerHTML);

		$scope.reset = function() {
			document.getElementById("form").reset();
			$scope.page = {
				'title' : '${title}',
				'content' : document.getElementById('content').value
			};

		};

		$scope.reset();
	}
</script>
</head>
<body data-ng-app="wiki" data-ng-controller="edit">
	<form action="/edit/${title}" method="POST" style="float: left;"
		name="form" id="form">
		<!--ng-model="page.content"  -->
		<textarea id="content" name="content" data-ng-model="page.content"
			style="height: 860px; width: 900px; margin: 0px;">${content}</textarea>
		<button type=submit style="display: block;">Submit</button>
		<button type=reset style="display: block;" data-ng-click="reset()">Reset</button>
	</form>
	<!-- data bound ng-bind-html="page.content | to_trusted" -->
	<div style="float: left; margin-left: 6px;"
		data-ng-bind-html="page.content | wiki | to_trusted">${content}</div>
</body>
</html>