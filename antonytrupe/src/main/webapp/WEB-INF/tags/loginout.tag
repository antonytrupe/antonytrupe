<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ tag description="Overall Page template" pageEncoding="UTF-8"%>
<%@ attribute name="user"%>
<%@ attribute name="return_to"%>

<c:choose>
	<c:when test="${user!=null}">
		<c:set var="href" value="/login.html?return_to=${return_to}" />
		<c:set var="text" value="log in" />
	</c:when>

	<c:otherwise>
		<c:set var="href" value="/openid/?logout=logout&return_to=${return_to}" />
		<c:set var="text" value="log out" />

	</c:otherwise>

</c:choose>

<a id="log_in" href="${href}">${text}</a>