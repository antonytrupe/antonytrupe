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
	style="background-color: grey; color: white; vertical-align: middle; height: 4em;">
	<!-- logo -->
	<a
		style="font-size: 2em; color: white; text-decoration: none; text-shadow: black 6px 6px 12px; font-weight: bold; padding-left: .5em; padding-top: .25em; display: inline-block; margin: 0;"
		href="/thediskgame/">The Disk Game</a>

	<!--  -->
	<span style="position: fixed; right: 0;"> <c:choose>
			<c:when test="${playerName != null}">
				<!-- profile -->
				<a href="#"> <img
					src="https://secure.gravatar.com/avatar/${gravatar}?d=mm&s=64"
					style="height: 4em; border-radius: 6px;" /><b class="caret"
					style="height: 3em;"></b>

				</a>
				<!-- http://www.antonytrupe.com/antonytrupe/openid?logout=logout&return_to=%2Fbattledisks%2F -->
				<a href="/openid/?logout=logout&return_to=${hereEncoded}">log
					out</a>

			</c:when>

			<c:otherwise>
				<a
					href="/login.html?return_to=%2Fthediskgame%2Fapi%3Faction%3DLOG_IN%2526return_to%253D${hereEncoded}"
					style="display: block; padding: 1em 2em; color: white; font-weight: bold; background-color: rgb(21, 88, 132); border-radius: 3px; height: 1em; margin: .5em; text-decoration: none;">
					<!--  -->Sign In
				</a>
			</c:otherwise>
		</c:choose>
	</span>
</nav>