package com.antonytrupe;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class BeeLogServlet extends HttpServlet {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public void doGet(final HttpServletRequest request, final HttpServletResponse response)
			throws ServletException, IOException {

		request.getRequestDispatcher("beelog.jsp").forward(request, response);

	}
}
