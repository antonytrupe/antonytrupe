package com.antonytrupe.authentication;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.HashSet;

import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;

@SuppressWarnings("serial")
public class OpenIdServlet extends HttpServlet {

	static final long ONE_HOUR = 3600000L;
	public static final String OPENID_IDENTIFIER = "openid_identifier";

	private static final String RETURN_TO = "return_to";
	static final long TWO_HOUR = ONE_HOUR * 2L;

	static String getAuthenticationUrl(HttpServletRequest request)
			throws UnsupportedEncodingException {

		String authDomain = request.getParameter(OPENID_IDENTIFIER);
		String destinationUrl = request.getRequestURI() + "?" + RETURN_TO + "="
				+ URLEncoder.encode(request.getParameter(RETURN_TO), "UTF-8");

		String federatedIdentity = null;
		HashSet<String> attributesRequest = new HashSet<String>();

		String url = UserServiceFactory.getUserService().createLoginURL(
				destinationUrl, authDomain, federatedIdentity,
				attributesRequest);

		return url;
	}

	private static void logout(HttpServletRequest request,
			HttpServletResponse response) throws IOException {
		com.google.appengine.api.users.UserService userService = UserServiceFactory
				.getUserService();
		com.google.appengine.api.users.User currentUser = userService
				.getCurrentUser();
		String authDomain = "";

		String return_to = request.getParameter("return_to");
		if (currentUser != null) {
			authDomain = currentUser.getAuthDomain();
		}

		String createLogoutURL = userService.createLogoutURL(return_to,
				authDomain);

		response.sendRedirect(createLogoutURL);
		return;
	}

	public static final String IDENTITY = "identity";

	@Override
	protected void doGet(HttpServletRequest request,
			HttpServletResponse response) throws IOException {

		String federatedIdentity = request.getParameter(OPENID_IDENTIFIER);
		String logout = request.getParameter("logout");
		// User user = new User();

		// System.out.println(Thread.currentThread().getStackTrace());

		// System.out.println("1");

		if (logout != null && logout.equals("logout")) {
			logout(request, response);
		} else {
			String returnTo = request.getParameter(RETURN_TO);
			if (federatedIdentity != null) {
				// System.out.println("2");

				String destinationUrl = request.getRequestURL() + "?"
						+ RETURN_TO + "="
						+ URLEncoder.encode(returnTo, "UTF-8");

				String url = UserServiceFactory.getUserService()
						.createLoginURL(destinationUrl, null,
								federatedIdentity, null);
				// System.out.println("url:" + url);

				response.sendRedirect(url);
				// System.out.println("3");
				return;

			}
			// coming back from OP
			else {
				// System.out.println("4");
				UserService userService = UserServiceFactory.getUserService();

				User currentUser = userService.getCurrentUser();
				if (currentUser != null) {
					String email = currentUser.getEmail();

					// System.out.println("email:" + email);
					// System.out.println("getFederatedIdentity:"
					// + currentUser.getFederatedIdentity());
					// System.out.println("getNickname:" +
					// currentUser.getNickname());
					// System.out.println("getAuthDomain:"
					// + currentUser.getAuthDomain());
					// System.out.println("getUserId:" +
					// currentUser.getUserId());

					Cookie cookie = new Cookie(OpenIdServlet.IDENTITY, email);
					cookie.setPath("/");

					// cookie.setDomain(".");
					response.addCookie(cookie);
				} else {
					System.out.println("currentUser is null");
				}
				// send redirect
				// System.out.println("4");
				// String returnTo = returnTo;
				if (returnTo != null) {
					response.sendRedirect(returnTo);
				}

				return;
			}
		}
	}

	@Override
	protected void doPost(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}
}