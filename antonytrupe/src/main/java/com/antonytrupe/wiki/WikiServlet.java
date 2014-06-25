package com.antonytrupe.wiki;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

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

		request.setAttribute("content",
				WikiDao.parseServerContent(page.getContent()));
		request.setAttribute("title", page.getName());
		request.getRequestDispatcher("/wiki.jsp").forward(request, response);

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
		if (parts.length >= 2) {
			pageName = parts[1];
		}

		if (pageName == null || pageName == "") {
			pageName = "home";
		}
		return pageName;
	}
}