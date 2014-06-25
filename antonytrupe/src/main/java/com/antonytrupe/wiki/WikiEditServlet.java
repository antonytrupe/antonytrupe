package com.antonytrupe.wiki;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@SuppressWarnings("serial")
public class WikiEditServlet extends HttpServlet {

	public void doPost(HttpServletRequest request, HttpServletResponse response)
			throws IOException {

		String title = getTitle(request);
		String content = (String) request.getParameter("content");

		new WikiDao().save(new Page(title, content));
		response.sendRedirect("/" + title);
	}

	public void doGet(HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException {

		String title = getTitle(request);
		Page page;
		try {
			page = new WikiDao().get(title);
		} catch (WikiPageNotFoundException e) {
			page = new Page(title);
		}

		request.setAttribute("content", page.getContent());
		request.setAttribute("title", page.getName());
		request.getRequestDispatcher("/wikiEdit.jsp")
				.forward(request, response);

	}

	private String getTitle(HttpServletRequest request) {
		String path = request.getRequestURI().substring(
				request.getContextPath().length()
						+ request.getServletPath().length());

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
