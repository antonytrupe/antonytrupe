package com.antonytrupe.battledisks;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.*;

@SuppressWarnings("serial")
public class BattledisksServlet extends HttpServlet {
	public void doGet(HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException {
		// resp.setContentType("text/plain");
		// resp.getWriter().println("BattledisksServlet");
		
		//get the user object
		
		//check to see if we are doing something specific
		
		

		// request.setAttribute("title", page.getName());
		request.getRequestDispatcher("/views/thediskgame/index.jsp").forward(request,
				response);
	}
}
