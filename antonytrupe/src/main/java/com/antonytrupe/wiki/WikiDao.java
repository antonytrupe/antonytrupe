package com.antonytrupe.wiki;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.LinkedList;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.cache.Cache;
import javax.cache.CacheException;
import javax.cache.CacheManager;

import name.fraser.neil.plaintext.diff_match_patch;
import name.fraser.neil.plaintext.diff_match_patch.Diff;

import com.google.appengine.api.datastore.AsyncDatastoreService;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.FilterPredicate;
import com.google.appengine.api.datastore.Query.SortDirection;
import com.google.appengine.api.datastore.Text;

class WikiPageNotFoundException extends Throwable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
}

public class WikiDao {

	// @Deprecated
	public static String parseServerContent(String content) {

		Pattern p = Pattern.compile("\\[{2}((?:.)*?)\\]{2}");
		Matcher m = p.matcher(content);
		StringBuffer sb = new StringBuffer();
		int beginIndex = 0;
		while (m.find(beginIndex)) {
			String one = m.group(1);
			String[] split = one.split("\\|");

			int endIndex = m.start();
			sb.append(content.substring(beginIndex, endIndex));
			try {
				String url;
				url = URLEncoder.encode(split[0], "UTF-8");

				// urlquery encode, not urlencode
				sb.append("<a href=\"" + url + "\">"
						+ (split.length > 1 ? split[1] : split[0]) + "</a>");
			} catch (UnsupportedEncodingException e) {
			}

			beginIndex = m.end();
		}

		sb.append(content.substring(beginIndex));

		return sb.toString();
	}

	@SuppressWarnings("unchecked")
	public Page get(String name) throws WikiPageNotFoundException {

		Cache cache;

		try {
			cache = CacheManager.getInstance().getCacheFactory()
					.createCache(Collections.emptyMap());
			// Get the value from the cache.
			Page value = (Page) cache.get(name);
			if (value != null) {
				return value;
			}
		} catch (CacheException e) {
			// ...

		}

		DatastoreService datastore = DatastoreServiceFactory
				.getDatastoreService();
		Page page = null;
		try {
			Entity e = datastore.get(KeyFactory.createKey(
					Page.class.getSimpleName(), name));
			page = new Page(e.getKey().getName(),
					((Text) e.getProperty(Page.CONTENT)).getValue());
			Text diff = (Text) e.getProperty(Page.DIFF);
			if (diff != null) {
				page.setDiff(diff.getValue());
			}

		} catch (EntityNotFoundException e) {
			throw new WikiPageNotFoundException();
		}
		try {
			cache = CacheManager.getInstance().getCacheFactory()
					.createCache(Collections.emptyMap());
			cache.put(name, page);
		} catch (CacheException e) {
			// ...
		}

		return page;
	}

	public ArrayList<Page> getHistory(String name) {
		DatastoreService datastore = DatastoreServiceFactory
				.getDatastoreService();
		ArrayList<Page> pages = new ArrayList<Page>();
		// The Query interface assembles a query
		Query q = new Query(Page.PAGEHISTORY);
		q.setFilter(new FilterPredicate(Page.NAME, Query.FilterOperator.EQUAL,
				name));

		q.addSort(Page.DATE, SortDirection.DESCENDING);

		// PreparedQuery contains the methods for fetching query results
		// from the datastore
		PreparedQuery pq = datastore.prepare(q);

		for (Entity result : pq.asIterable()) {
			String content = ((Text) result.getProperty(Page.CONTENT))
					.getValue();
			Date date = (Date) result.getProperty(Page.DATE);
			String ipaddress = (String) result.getProperty(Page.REMOTE_IP);
			Page e = new Page(name, content, null, ipaddress, date);
			e.setUser((String) result.getProperty(Page.USER));
			Text diff = (Text) result.getProperty(Page.DIFF);
			if (diff != null) {
				e.setDiff(diff.getValue());
			}
			pages.add(e);
		}
		return pages;
	}

	@SuppressWarnings("unchecked")
	public void save(Page p) {

		AsyncDatastoreService datastore = DatastoreServiceFactory
				.getAsyncDatastoreService();

		// start the query to get the original page
		Page oldPage = new Page();
		Future<Entity> oldPageFuture;
		{
			oldPageFuture = datastore.get(KeyFactory.createKey(
					Page.class.getSimpleName(), p.getName()));

		}

		try {
			Date now = new Date();
			// create the page entity
			// Object remoteAddr = getThreadLocalRequest().getRemoteAddr();
			// String identity = HttpCookies.getCookieValue(
			// perThreadRequest.get(), "identity");
			Object remoteAddr = null;
			String identity = p.getUser();
			{
				Entity page = new Entity(KeyFactory.createKey(Page.PAGE,
						URLDecoder.decode(p.getName(), "UTF-8")));

				// ... set properties ...
				page.setProperty(Page.CONTENT, new Text(p.getContent()));
				page.setProperty(Page.DATE, now);

				page.setProperty(Page.USER, identity);
				// page.setProperty(Page.REMOTE_IP, remoteAddr);

				try {
					// block on retrieving previous version
					Entity e = oldPageFuture.get();
					oldPage = new Page(e.getKey().getName(),
							((Text) e.getProperty(Page.CONTENT)).getValue());

				} catch (InterruptedException e) {
					e.printStackTrace();
				} catch (ExecutionException e) {
					// this happens when a new page is created
					if (e.getCause().getClass() == EntityNotFoundException.class) {
					} else {
						e.printStackTrace();
					}
				}
				datastore.put(page);
			}
			// create the pagehistory entity
			{
				Entity history = new Entity(
						KeyFactory.createKey(
								Page.PAGEHISTORY,
								URLDecoder.decode(p.getName(), "UTF-8")
										+ now.getTime()));

				// ... set properties ...
				history.setProperty(Page.NAME,
						URLDecoder.decode(p.getName(), "UTF-8"));
				history.setProperty(Page.CONTENT, new Text(p.getContent()));
				// history.setProperty(Page.STYLE, new Text(p.getStyle()));
				history.setProperty(Page.REMOTE_IP, remoteAddr);
				history.setProperty(Page.DATE, now);
				history.setProperty(Page.UPDATE, p.isUpdate());
				history.setProperty(Page.USER, identity);

				// create the diff
				diff_match_patch dmp = new diff_match_patch();
				// create the diff
				LinkedList<Diff> diffs = dmp.diff_main(oldPage.getContent(),
						p.getContent());
				// make the diff human readable
				dmp.diff_cleanupSemantic(diffs);
				// convert the diff to html
				String diff = dmp.diff_prettyHtml(diffs);

				history.setProperty(Page.DIFF, new Text(diff));

				datastore.put(history);
			}

			try {
				Cache cache = CacheManager.getInstance().getCacheFactory()
						.createCache(Collections.emptyMap());
				cache.put(p.getName(), p);
			} catch (CacheException e) {
				// ...
			}

		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
		}
	}
}