package com.antonytrupe.thediskgame;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.logging.Logger;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import ca.jimr.gae.profiler.MiniProfiler;
import ca.jimr.gae.profiler.MiniProfiler.Step;

import com.antonytrupe.games.GameEngineException;
import com.google.appengine.api.blobstore.BlobInfo;
import com.google.appengine.api.blobstore.BlobInfoFactory;
import com.google.appengine.api.blobstore.BlobKey;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;

@SuppressWarnings("serial")
public class APIServlet extends HttpServlet {

	private final Logger log = Logger.getLogger(APIServlet.class.getName());

	@Override
	public void doGet(final HttpServletRequest request,
			final HttpServletResponse response) {

		Step step = MiniProfiler.step("APIServlet.doGet");

		Step headerStep = MiniProfiler.step("APIServlet.doGet headers");

		response.setContentType("application/json");
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
		response.setHeader("Access-Control-Allow-Credentials", "true");

		headerStep.close();

		Step getParameterMapStep = MiniProfiler
				.step("APIServlet.doGet getParameters");

		@SuppressWarnings("unchecked")
		final Map<String, Object> parameters = new HashMap<String, Object>(
				request.getParameterMap());

		getParameterMapStep.close();

		final String user = API.getUser(request);

		Step uploadStuffStep = MiniProfiler
				.step("APIServlet.doGet upload stuff");

		// check the content type header
		// multipart/form-data
		final String contentType = request.getContentType();

		if (contentType != null && contentType.contains("multipart/form-data")) {

			final BlobstoreService blobstoreService = BlobstoreServiceFactory
					.getBlobstoreService();

			final Map<String, List<BlobKey>> blobKeysValues = blobstoreService
					.getUploads(request);
			for (final Entry<String, List<BlobKey>> blobKeyValues : blobKeysValues
					.entrySet()) {
				for (final BlobKey blobKey : blobKeyValues.getValue()) {
					final BlobInfo blobInfo = new BlobInfoFactory()
							.loadBlobInfo(blobKey);
					final long size = blobInfo.getSize();
					if (size > 0) {
						// process blob
						parameters.put(blobKeyValues.getKey(), blobKey);
					} else {
						blobstoreService.delete(blobKey);
					}
				}
			}
		}

		uploadStuffStep.close();

		try {
			final String result = new API().process(parameters, user, response);
			// long b = System.nanoTime();
			// log.info("doGet:" + (b - a) / 1000000 + "ms");

			if (!response.isCommitted()) {
				response.getWriter().println(result);
			}
		} catch (IOException e) {
			e.printStackTrace();
		} catch (APIException e) {
			e.printStackTrace();
		} catch (GameEngineException e) {
			e.printStackTrace();
			log.warning(e.getMessage());
		}
		step.close();
	}

	@Override
	public void doPost(final HttpServletRequest request,
			final HttpServletResponse response) {
		Step step = MiniProfiler.step("APIServlet.doPost");
		doGet(request, response);
		step.close();
	}

}