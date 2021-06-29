package com.antonytrupe.authentication;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.StringReader;
import java.io.UnsupportedEncodingException;
import java.math.BigInteger;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

import javax.json.Json;
import javax.json.JsonObject;
import javax.json.JsonReader;
import javax.json.JsonReaderFactory;
import javax.json.JsonValue;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.codec.binary.Base64;

@SuppressWarnings("serial")
public class OAuth2Servlet extends HttpServlet {

	private static final String REDIRECT_URI_NAME = "redirect_uri";

	public static String getAuthenticatedUser(HttpServletRequest req) {
		return (String) req.getSession().getAttribute("email");
	}

	private static final String GOOGLE_AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/auth";

	private static final String GOOGLE_TOKEN_ENDPOINT = "https://www.googleapis.com/oauth2/v3/token";
	private static final String FACEBOOK_AUTHORIZATION_ENDPOINT = "https://www.facebook.com/dialog/oauth";

	private static final String FACEBOOK_TOKEN_ENDPOINT = "https://graph.facebook.com/v2.3/oauth/access_token";
	private static final String SCOPE = "email";
	private static final String RESPONSE_TYPE = "code";
	private static final String GOOGLE_CLIENT_SECRET = "RqP32ldeaqRp1qhtCpFlYDtl";

	private static final String GOOGLE_CLIENT_ID = "450354004958-h19tr12i7jong5csikfvodjl0o09kfbr.apps.googleusercontent.com";
	private static final String FACEBOOK_CLIENT_ID = "1641471272753055";
	private static String REDIRECT_URI;
	private static final String GRANT_TYPE = "authorization_code";

	private static final String FACEBOOK_CLIENT_SECRET = "6f7dde985883441ab4b714ed157063fc";

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
		String serverName = req.getServerName();
		int serverPort = req.getServerPort();

		// http://localhost:8888/oauth2/
		REDIRECT_URI = "https://" + serverName + (serverPort != 80 ? ":" + serverPort : "") + "/oauth2/";

		// String pathInfo = req.getPathInfo();
		String pathInfo = req.getPathInfo();
		if (pathInfo !=null && pathInfo.contains("logout")) {
			Cookie[] cookies = req.getCookies();
			if (cookies != null)
				for (int i = 0; i < cookies.length; i++) {
					cookies[i].setValue("");
					cookies[i].setPath("/");
					cookies[i].setMaxAge(0);
					resp.addCookie(cookies[i]);
				}
			String redirect_uri = req.getParameter(REDIRECT_URI_NAME);
			try {
				resp.sendRedirect(redirect_uri);
			} catch (IOException e) {
				e.printStackTrace();
			}
		} else {
			// get the state token from the request
			String requestCsfr = req.getParameter("state");
			String sessionCsfr = (String) req.getSession().getAttribute("state");

			if (requestCsfr != null && sessionCsfr != null && requestCsfr.compareTo(sessionCsfr) == 0) {
				// we're coming back from valid login
				// Exchange code for access token and ID token
				String code = req.getParameter(RESPONSE_TYPE);
				String as = (String) req.getSession().getAttribute("authorization_endpoint");
				String redirect_uri = (String) req.getSession().getAttribute(REDIRECT_URI_NAME);

				String email = null;
				switch (as) {
				case GOOGLE_AUTHORIZATION_ENDPOINT:
					JsonObject token = getGoogleToken(code);
					email = token.get("email").toString().replace("\"", "");
					break;
				case FACEBOOK_AUTHORIZATION_ENDPOINT:
					String facebookAccessToken = getFacebookAccessToken(code);
					email = getFacebookEmail(facebookAccessToken);

					break;
				}
				try {
					// stash the email somewhere useful
					req.getSession().setAttribute("email", email);
					resp.sendRedirect(redirect_uri);
				} catch (IOException e) {
					e.printStackTrace();
				}
				return;
			}

			else if (requestCsfr == null) {
				// new login flow
				String openid_identifier = (String) req.getParameter("openid_identifier");
				String url = null;
				String csfrToken = getCsfrToken();
				// save the state/csfr in the session
				req.getSession().setAttribute("state", csfrToken);
				try {
					switch (openid_identifier) {
					case GOOGLE_AUTHORIZATION_ENDPOINT:
						req.getSession().setAttribute("authorization_endpoint", GOOGLE_AUTHORIZATION_ENDPOINT);
						url = getGoogleAuthorizationUrl(csfrToken);
						break;
					case FACEBOOK_AUTHORIZATION_ENDPOINT:
						req.getSession().setAttribute("authorization_endpoint", FACEBOOK_AUTHORIZATION_ENDPOINT);
						url = getFacebookAuthorizationUrl(csfrToken);
						break;
					default:
						openid_identifier = "";
						break;
					}
				} catch (UnsupportedEncodingException e1) {
					e1.printStackTrace();
				}

				// save the location to redirect back to in the session
				String reredirect_uri = req.getParameter(REDIRECT_URI_NAME);
				req.getSession().setAttribute(REDIRECT_URI_NAME, reredirect_uri);

				try {

					resp.sendRedirect(url);
					return;
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		}
	}

	@Override
	protected void doPost(HttpServletRequest req, HttpServletResponse resp) {
		doGet(req, resp);
	}

	private String getCsfrToken() {
		String state = new BigInteger(130, new SecureRandom()).toString(32);
		return state;
	}

	private String getFacebookAccessToken(String code) {

		try {
			HttpURLConnection connection = (HttpURLConnection) new URL(FACEBOOK_TOKEN_ENDPOINT).openConnection();

			connection.setDoOutput(true); // Triggers POST.
			connection.setRequestProperty("Accept-Charset", StandardCharsets.UTF_8.name());
			connection.setRequestProperty("Content-Type",
					"application/x-www-form-urlencoded;charset=" + StandardCharsets.UTF_8.name());

			String query = String.format("code=%s&client_id=%s&client_secret=%s&redirect_uri=%s&grant_type=%s",
					URLEncoder.encode(code, StandardCharsets.UTF_8.name()),
					URLEncoder.encode(FACEBOOK_CLIENT_ID, StandardCharsets.UTF_8.name()),
					URLEncoder.encode(FACEBOOK_CLIENT_SECRET, StandardCharsets.UTF_8.name()),
					URLEncoder.encode(REDIRECT_URI, StandardCharsets.UTF_8.name()),
					URLEncoder.encode(GRANT_TYPE, StandardCharsets.UTF_8.name())

			);

			try (OutputStream output = connection.getOutputStream()) {
				output.write(query.getBytes(StandardCharsets.UTF_8.name()));
			}

			try (InputStream response = connection.getInputStream()) {

				JsonReaderFactory factory = Json.createReaderFactory(null);

				JsonReader reader = factory.createReader(response);
				JsonObject a = (JsonObject) reader.readObject();
				String access_token = a.getString("access_token");
				// String[] id_token_encoded_parts =
				// id_token_encoded.split("\\.");
				// byte[] payloadDecodedBytes = Base64
				// .decodeBase64(id_token_encoded_parts[1]);
				// String payloadDecoded = new String(payloadDecodedBytes);

				// JsonReader b = factory.createReader(new StringReader(
				// payloadDecoded));
				// JsonObject payloadJson = b.readObject();
				return access_token;
				// System.out.println(email);

				// req.getSession().invalidate();
				// req.getSession().setAttribute("email", email.toString());
				// System.out.println(redirect_uri);

			}

		} catch (IOException e) {
			e.printStackTrace();
		}
		return null;
	}

	private String getFacebookAuthorizationUrl(String csfrToken) throws UnsupportedEncodingException {
		StringBuilder url = new StringBuilder(FACEBOOK_AUTHORIZATION_ENDPOINT);
		url.append("?");
		url.append("client_id=").append(FACEBOOK_CLIENT_ID);
		url.append("&");
		url.append("redirect_uri=").append(URLEncoder.encode(REDIRECT_URI, StandardCharsets.UTF_8.name()));

		url.append("&");
		url.append("state=").append(csfrToken);
		url.append("&");
		url.append("scope=").append(SCOPE);
		url.append("&");
		url.append("response_type=").append(RESPONSE_TYPE);

		return url.toString();
	}

	private String getFacebookEmail(String facebookAccessToken) {
		try {
			HttpURLConnection connection = (HttpURLConnection) new URL(
					"https://graph.facebook.com/v2.3/me?access_token=" + facebookAccessToken).openConnection();

			connection.setDoOutput(true); // Triggers POST.
			connection.setRequestProperty("Accept-Charset", StandardCharsets.UTF_8.name());
			connection.setRequestProperty("Content-Type",
					"application/x-www-form-urlencoded;charset=" + StandardCharsets.UTF_8.name());

			// try (OutputStream output = connection.getOutputStream()) {
			// output.write("".getBytes(StandardCharsets.UTF_8.name()));
			// }

			try (InputStream response = connection.getInputStream()) {

				JsonReaderFactory factory = Json.createReaderFactory(null);

				JsonReader reader = factory.createReader(response);
				JsonObject a = (JsonObject) reader.readObject();
				JsonValue email = a.get("email");
				return email.toString();

			}

		} catch (IOException e) {
			e.printStackTrace();
		}

		return null;
	}

	private String getGoogleAuthorizationUrl(String csfrToken) throws UnsupportedEncodingException {
		StringBuilder url = new StringBuilder(GOOGLE_AUTHORIZATION_ENDPOINT);
		url.append("?");
		url.append("client_id=").append(GOOGLE_CLIENT_ID);
		url.append("&");
		url.append("response_type=").append(RESPONSE_TYPE);
		url.append("&");
		url.append("scope=").append(SCOPE);
		url.append("&");
		url.append("redirect_uri=").append(URLEncoder.encode(REDIRECT_URI, StandardCharsets.UTF_8.name()));

		url.append("&");
		url.append("state=").append(csfrToken);

		return url.toString();
	}

	private JsonObject getGoogleToken(String code) {
		try {

			HttpURLConnection connection = (HttpURLConnection) new URL(GOOGLE_TOKEN_ENDPOINT).openConnection();
			connection.setDoOutput(true); // Triggers POST.
			connection.setRequestProperty("Accept-Charset", StandardCharsets.UTF_8.name());
			connection.setRequestProperty("Content-Type",
					"application/x-www-form-urlencoded;charset=" + StandardCharsets.UTF_8.name());

			String query = String.format("code=%s&client_id=%s&client_secret=%s&redirect_uri=%s&grant_type=%s",
					URLEncoder.encode(code, StandardCharsets.UTF_8.name()),
					URLEncoder.encode(GOOGLE_CLIENT_ID, StandardCharsets.UTF_8.name()),
					URLEncoder.encode(GOOGLE_CLIENT_SECRET, StandardCharsets.UTF_8.name()),
					URLEncoder.encode(REDIRECT_URI, StandardCharsets.UTF_8.name()),
					URLEncoder.encode(GRANT_TYPE, StandardCharsets.UTF_8.name())

			);

			try (OutputStream output = connection.getOutputStream()) {
				output.write(query.getBytes(StandardCharsets.UTF_8.name()));
			}

			try (InputStream response = connection.getInputStream()) {

				JsonReaderFactory factory = Json.createReaderFactory(null);

				JsonReader reader = factory.createReader(response);
				JsonObject a = (JsonObject) reader.readObject();
				String id_token_encoded = a.getString("id_token");
				String[] id_token_encoded_parts = id_token_encoded.split("\\.");
				byte[] payloadDecodedBytes = Base64.decodeBase64(id_token_encoded_parts[1]);
				String payloadDecoded = new String(payloadDecodedBytes);

				JsonReader b = factory.createReader(new StringReader(payloadDecoded));
				JsonObject payloadJson = b.readObject();
				return payloadJson;
				// System.out.println(email);

				// req.getSession().invalidate();
				// req.getSession().setAttribute("email", email.toString());
				// System.out.println(redirect_uri);

			}
		} catch (IOException e) {
			e.printStackTrace();
		}
		return null;
	}
}
