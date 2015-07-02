<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ tag description="footer template" pageEncoding="UTF-8"%>
<%@ attribute name="encodedName"%>

<div class="footer">
	<a href="/history/${encodedName}" style="font-weight: bold;"
		title="history">history</a>
	<c:choose>
		<c:when test="${not empty email}">

			<a href="/edit/${encodedName}" style="font-weight: bold;"
				title="edit">edit</a>
			<a href="/oauth2/logout?logout=logout&redirect_uri=/${encodedName}"
				style="font-weight: bold;" title="log in">log out</a>
		</c:when>
		<c:otherwise>
			<a href="/login.html?redirect_uri=/${encodedName}%2523${encodedName}"
				style="font-weight: bold;" title="log in">log in</a>
		</c:otherwise>
	</c:choose>

</div>