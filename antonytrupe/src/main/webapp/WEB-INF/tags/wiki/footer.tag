<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ tag description="footer template" pageEncoding="UTF-8"%>
<%@ attribute name="title"%>

<div class="footer">
	<a href="/history/${title}" style="font-weight: bold;" title="history">history</a>
	<a href="/edit/${title}" style="font-weight: bold;" title="edit">edit</a>
	<a href="login.html?return_to=/${title}" style="font-weight: bold;"
		title="log in">log in</a>
</div>