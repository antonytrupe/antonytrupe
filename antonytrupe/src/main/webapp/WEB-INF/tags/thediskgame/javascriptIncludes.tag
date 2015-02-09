<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions"%>

<%@ attribute name="jsFiles" required="true" type="java.util.List" %>

<script
	src="//cdnjs.cloudflare.com/ajax/libs/headjs/1.0.3/head.load.min.js"></script>
<script type="text/javascript">
	head.js("//ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js",
			"https://ajax.googleapis.com/ajax/libs/jqueryui/1/jquery-ui.min.js",
			"//ajax.googleapis.com/ajax/libs/angularjs/1.3.10/angular.min.js",
			"//angular-ui.github.io/bootstrap/ui-bootstrap-tpls-0.12.0.js",
			<c:forEach var="js" varStatus="varStatus" items="${jsFiles}">
			"/com/antonytrupe/thediskgame/${js}.js"
			<c:if test="${varStatus.index lt fn:length(jsFiles)-1}">,</c:if>
			</c:forEach>
	);
</script>