package com.antonytrupe;

import java.io.IOException;
import java.net.URLEncoder;
import java.util.Set;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.modules.ModulesService;
import com.google.appengine.api.modules.ModulesServiceFactory;

public class ModuleListServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;

	@Override
	protected void doGet(HttpServletRequest request,
			HttpServletResponse response) throws IOException {

		ModulesService modulesApi = ModulesServiceFactory.getModulesService();
		// String currentVersionHostname = "http://"
		// + modulesApi.getVersionHostname(modulesApi.getCurrentModule(),
		// modulesApi.getCurrentVersion());

		Set<String> modules = modulesApi.getModules();

		for (String module : modules) {
			String versionHostname = modulesApi.getVersionHostname(module,
					modulesApi.getDefaultVersion(module));
			if (module.equals("authentication")) {
 				// request.getRequestURL();
				versionHostname += "/index.html?return_to="
						+ URLEncoder.encode(request.getRequestURL().toString(),
								"UTF-8");
			}
			response.getWriter().println(
					"<a href=\"http://" + versionHostname + "\">" + module
							+ "</a><br />");
		}
	}
}
