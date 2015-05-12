package com.antonytrupe;

import java.io.IOException;

import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;

import com.google.appengine.api.NamespaceManager;

// Filter to set the Google Apps domain as the namespace.
public class NamespaceFilter implements javax.servlet.Filter {
	@Override
	public void doFilter(ServletRequest request, ServletResponse response,
			FilterChain chain) throws IOException, ServletException {
		// Make sure set() is only called if the current namespace is not
		// already set.
		if (NamespaceManager.get() == null) {
			String serverName = request.getServerName();
			NamespaceManager.set(serverName);
		}
		chain.doFilter(request, response);
	}

	@Override
	public void init(FilterConfig filterConfig) throws ServletException {
	}

	@Override
	public void destroy() {
	}
}