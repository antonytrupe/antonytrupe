package com.antonytrupe.wiki;

import java.io.IOException;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.antonytrupe.authentication.OAuth2Servlet;

/**
 * Servlet Filter implementation class WikiAuthorization
 */
public class WikiEditAuthorization implements Filter {

	/**
	 * Default constructor.
	 */
	public WikiEditAuthorization() {
		// TODO Auto-generated constructor stub
	}

	/**
	 * @see Filter#destroy()
	 */
	public void destroy() {
		// TODO Auto-generated method stub
	}

	/**
	 * @see Filter#doFilter(ServletRequest, ServletResponse, FilterChain)
	 */
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
			throws IOException, ServletException {
		// TODO Auto-generated method stub
		// place your code here

		String email = OAuth2Servlet.getAuthenticatedUser((HttpServletRequest) request);

		// pass the request along the filter chain
		if (email != null && (email.equals("antony.trupe@gmail.com") || email.equals("pltrupe@gmail.com"))) {
			chain.doFilter(request, response);
		} else {
			String title = WikiEditServlet.getTitle((HttpServletRequest) request);
			((HttpServletResponse) response).sendRedirect("/p/" + title);
		}
	}

	/**
	 * @see Filter#init(FilterConfig)
	 */
	public void init(FilterConfig fConfig) throws ServletException {
		// TODO Auto-generated method stub
	}

}
