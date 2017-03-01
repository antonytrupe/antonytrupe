package com.antonytrupe;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.blobstore.BlobKey;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;

@SuppressWarnings("serial")
public class ImageServlet extends HttpServlet {

	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
		BlobstoreService blobstoreService = BlobstoreServiceFactory.getBlobstoreService();

		Map<String, List<BlobKey>> blobs = blobstoreService.getUploads(req);

		List<BlobKey> blobKeys = blobs.get("myFile");

		if (blobKeys == null || blobKeys.isEmpty()) {
			res.sendRedirect("/views/image.jsp");
		} else {
			res.sendRedirect("/images?blob-key=" + blobKeys.get(0).getKeyString());
		}
	}

	@Override
	public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {

		String requestURI = request.getRequestURI();
		String contextPath = request.getContextPath();
		// String servletPath = request.getServletPath();
		String path = requestURI.substring(contextPath.length());

		// /one/two
		// now get anything between the first and optional second backslash
		String[] parts = path.split("/");
		BlobstoreService blobstoreService = BlobstoreServiceFactory.getBlobstoreService();

		if (parts.length >= 3) {
			BlobKey blobKey = new BlobKey(parts[2]);
			blobstoreService.serve(blobKey, response);
		} else {
			// no image specified

			String uploadUrl = blobstoreService.createUploadUrl("/images");

			request.setAttribute("uploadUrl", uploadUrl);

			RequestDispatcher requestDispatcher = request.getRequestDispatcher("/views/image.jsp");
			requestDispatcher.forward(request, response);
		}
	}

}