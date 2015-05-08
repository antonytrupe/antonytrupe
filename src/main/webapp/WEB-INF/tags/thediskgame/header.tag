<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@attribute name="gravatar" required="false"%>
<style>
.caret {
	display: inline-block;
	width: 0;
	height: 0;
	margin-left: 2px;
	vertical-align: middle;
	border-top: 4px solid;
	border-right: 4px solid transparent;
	border-left: 4px solid transparent;
}
</style>


<nav
	style="background-color: grey; color: white; vertical-align: middle; height: 4em; text-align: left;">
	<!-- logo -->
	<a
		style="font-size: 2em; color: black; text-decoration: none; text-shadow: white 0px 0px 4px; font-weight: bold; padding-left: .5em; padding-top: .25em; display: inline-block; margin: 0;"
		href="/thediskgame/">Orbis Bella:The Disk Game</a>

	<!--  -->
	<span style="position: fixed; right: 0;"> <c:choose>
			<c:when test="${playerName != null}">
				<!-- profile -->
				<img src="https://secure.gravatar.com/avatar/${gravatar}?d=mm&s=64"
					style="height: 4em; border-radius: 6px;" />
				<!-- http://www.antonytrupe.com/antonytrupe/openid?logout=logout&return_to=%2Fbattledisks%2F -->
				<a href="/openid/?logout=logout&redirect_uri=${hereEncoded}">log
					out</a>

			</c:when>

			<c:otherwise>
				<a
					href="/login.html?redirect_uri=%2Fthediskgame%2Fapi%3Faction%3DLOG_IN%2526return_to%253D${hereEncoded}"
					style="display: block; padding: 1em 2em; color: white; font-weight: bold; background-color: #659CEF; border-radius: 3px; height: 1em; margin: .5em; text-decoration: none;">
					<span>Sign In</span>
				</a>
			</c:otherwise>
		</c:choose>
	</span>
</nav>