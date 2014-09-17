package com.antonytrupe.wiki;

import java.io.IOException;
import java.util.ArrayList;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@SuppressWarnings("serial")
public class WikiHistoryServlet extends HttpServlet {

	public void doPost(HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException {
		doGet(request, response);
	}

	public void doGet(HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException {

		String title = getTitle(request);
		ArrayList<Page> history;
		history = new WikiDao().getHistory(title);

		request.setAttribute("history", history);
		request.setAttribute("title", title);
		request.getRequestDispatcher("/wikiHistory.jsp").forward(request,
				response);

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
