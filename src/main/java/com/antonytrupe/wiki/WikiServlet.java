package com.antonytrupe.wiki;

import java.io.IOException;
import java.net.URLDecoder;
import java.net.URLEncoder;

import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.antonytrupe.authentication.OAuth2Servlet;

@SuppressWarnings("serial")
public class WikiServlet extends HttpServlet {
	public void doGet(HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException {

		String title = getTitle(request);

		Page page = null;
		try {
			page = new WikiDao().get(title);
		} catch (WikiPageNotFoundException e) {
			page = new Page(title);
		}

		String decodedName = URLDecoder.decode(title, "UTF-8");
		String encodedName = URLEncoder.encode(decodedName, "UTF-8");
		
		//user stuff
		String email = OAuth2Servlet.getAuthenticatedUser(request);
		request.setAttribute("email", email);
		
		if (page.getContent() != null) {
			request.setAttribute("content",
					WikiDao.parseServerContent(page.getContent()));
		} else {
			request.setAttribute("content",
					WikiDao.parseServerContent(decodedName));
		}
		request.setAttribute("decodedName", decodedName);
		request.setAttribute("encodedName", encodedName);
		request.setAttribute("domain",
				request.getServerName().replaceAll("www.", ""));
		RequestDispatcher requestDispatcher = request
				.getRequestDispatcher("/views/wiki/wiki.jsp");
		requestDispatcher.forward(request, response);

	}

	private String getTitle(HttpServletRequest request) {
		String requestURI = request.getRequestURI();
		String contextPath = request.getContextPath();
		// String servletPath = request.getServletPath();
		String path = requestURI.substring(contextPath.length());

		// /one/two
		// now get anything between the first and optional second backslash
		String[] parts = path.split("/");

		String pageName = null;
		if (parts.length > 0) {
			pageName = parts[parts.length - 1];
		}

		if (pageName == null || pageName == "") {
			pageName = "home";
		}
		return pageName;
	}
}