package com.antonytrupe.games;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Scanner;
import java.util.logging.Logger;

import javax.servlet.http.HttpServletResponse;

import javax.cache.Cache;
import javax.cache.CacheException;
import javax.cache.CacheFactory;
import javax.cache.CacheManager;

import org.mozilla.javascript.Callable;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.EcmaError;
import org.mozilla.javascript.NativeJSON;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.json.JsonParser;
import org.mozilla.javascript.json.JsonParser.ParseException;

import ca.jimr.gae.profiler.MiniProfiler;
import ca.jimr.gae.profiler.MiniProfiler.Step;

import com.google.appengine.api.datastore.Blob;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Text;
import com.google.apphosting.api.ApiProxy.RequestTooLargeException;

public class GameEngine {

	private static final Logger log = Logger.getLogger(GameEngine.class
			.getName());

	public final class IO {
		private static final String ioWrappers = "var engine = engine||new Object();\n"
				+ "engine.io=engine.io||new Object;\n"
				+ "engine.io.write=function(string){e.io.write(string);};";

		public void write(String string) {
			if (string == null) {
				return;
			}
			if (GameEngine.this.response != null) {
				try {
					GameEngine.this.response.getWriter().write(string);
				} catch (IOException e) {
					e.printStackTrace();
				}
			} else {
				log.info(string);
			}
		}
	}

	public final class Persistence {

		private static final String persistenceWrappers = "var engine = engine||new Object();\n"
				+ "engine.persistence=engine.persistence||new Object;\n"
				+ "engine.persistence.get=function(map){\n"
				+ "return e.persistence.get(map.get('clazz')[0],map.get('name')[0]);};\n"

				+ "engine.persistence.getAll=function(map){\n"
				+ "return e.persistence.getAll(map.get('clazz')[0]);};\n"

				+ "engine.persistence.save=function(map){\n"
				+ "_map=new java.util.HashMap();\n"
				+ "var entrySetArray=map.entrySet().toArray();\n"
				+ "for (entry in entrySetArray) {\n"
				// invoke name clazz
				+ "if(entrySetArray[entry].getKey()!='invoke' && entrySetArray[entry].getKey()!='name' && entrySetArray[entry].getKey()!='clazz'){\n" //$NON-NLS-1$
				+ "_map.put(entrySetArray[entry].getKey(),entrySetArray[entry].getValue()[0]);\n"
				+ "}\n"
				+ "}\n"
				+ "e.persistence.save(map.get('clazz')[0],map.get('name')[0],_map);\n"
				+ "};";

		public HashMap<String, String> get(String clazz) {
			return get(clazz, 1);
		}

		public HashMap<String, String> get(String clazz, int count) {
			HashMap<String, String> object;

			DatastoreService datastore = DatastoreServiceFactory
					.getDatastoreService();
			object = new HashMap<String, String>();
			Query query = new Query(clazz);
			List<Entity> es = datastore.prepare(query).asList(
					FetchOptions.Builder.withLimit(1));

			if (!es.isEmpty()) {
				Entity e = es.get(0);

				for (Entry<String, Object> entry : e.getProperties().entrySet()) {
					object.put(entry.getKey(),
							((Text) entry.getValue()).getValue());
				}
				object.put("id", Long.toString(e.getKey().getId()));
			}
			return object;
		}

		@SuppressWarnings("unchecked")
		public HashMap<String, Object> get(String clazz, long id) {
			// log.setLevel(Level.INFO);
			// Level level = log.getLevel();
			// log.log(level, "log level: " + level.toString());

			// log.log(level, "clazz: " + clazz);
			// log.log(level, "id: " + Long.toString(id));

			Cache cache;
			HashMap<String, Object> object;
			try {
				// log.log(level, "1");
				CacheFactory cacheFactory = CacheManager.getInstance()
						.getCacheFactory();
				// log.log(level, "2");
				cache = cacheFactory.createCache(Collections.emptyMap());
				// log.log(level, "3");
				// Get the value from the cache.
				object = (HashMap<String, Object>) cache.get(clazz
						+ Long.toString(id));
				// log.log(level, "4");
				if (object != null) {

					// log.log(level, "found " + clazz + " " + id +
					// " in memcache");
					return object;
				}
				// log.info("did not find " + clazz + " " + id +
				// " in memcache");
			} catch (CacheException e) {
				e.printStackTrace();
				// log.log(Level.WARNING, e.getMessage());
			}

			DatastoreService datastore = DatastoreServiceFactory
					.getDatastoreService();
			object = new HashMap<String, Object>();
			try {
				Entity e = datastore.get(KeyFactory.createKey(clazz, id));
				// properties
				for (Entry<String, Object> entry : e.getProperties().entrySet()) {
					Object value = entry.getValue();
					if (value instanceof Text) {
						object.put(entry.getKey(), ((Text) value).getValue());
					} else if (value instanceof String) {
						object.put(entry.getKey(), ((String) value));
					} else {
						object.put(entry.getKey(), value);
					}
				}
				object.put("id", Long.toString(e.getKey().getId()));

				try {
					// log.log(level, "1");
					CacheFactory cacheFactory = CacheManager.getInstance()
							.getCacheFactory();
					// log.log(level, "2");
					cache = cacheFactory.createCache(Collections.emptyMap());
					// log.log(level, "3");
					cache.put(clazz + id, object);
					// log.info("put " + clazz + " " + id + " in memcache");
				} catch (CacheException ce) {
					// exception handling
					ce.printStackTrace();
				}
			} catch (EntityNotFoundException enf) {
				enf.printStackTrace();
			}
			return object;

		}

		@SuppressWarnings("unchecked")
		public HashMap<String, Object> get(final String clazz, final String name) {
			// check memcache first
			Cache cache;
			HashMap<String, Object> object = null;
			if (name == null || name == "") {
				return object;
			}
			try {
				cache = CacheManager.getInstance().getCacheFactory()
						.createCache(Collections.emptyMap());
				// Get the value from the cache.
				object = (HashMap<String, Object>) cache.get(clazz + name);
				if (object != null) {
					return object;
				}
			} catch (CacheException e) {
			}

			DatastoreService datastore = DatastoreServiceFactory
					.getDatastoreService();
			//
			// stuff it in memcache
			object = new HashMap<String, Object>();
			try {
				Entity e = datastore.get(KeyFactory.createKey(clazz, name));
				// properties
				for (Entry<String, Object> entry : e.getProperties().entrySet()) {
					Object value = entry.getValue();
					if (value instanceof Text) {
						object.put(entry.getKey(), ((Text) value).getValue());
					} else if (value instanceof String) {
						object.put(entry.getKey(), ((String) value));
					} else {
						object.put(entry.getKey(), value);
					}
				}
				object.put("name", e.getKey().getName());

				try {
					cache = CacheManager.getInstance().getCacheFactory()
							.createCache(Collections.emptyMap());
					cache.put(clazz + name, object);
				} catch (CacheException ce) {
				}
			} catch (EntityNotFoundException enf) {
				// enf.printStackTrace();
			}
			return object;
		}

		@SuppressWarnings("unchecked")
		public HashMap<Object, HashMap<String, Object>> getAll(String clazz) {
			// check memcache first
			Cache cache;
			HashMap<Object, HashMap<String, Object>> objects;
			try {
				cache = CacheManager.getInstance().getCacheFactory()
						.createCache(Collections.emptyMap());
				// Get the value from the cache.
				objects = (HashMap<Object, HashMap<String, Object>>) cache
						.get("__ALL__" + clazz);
				if (objects != null) {
					return objects;
				}
			} catch (CacheException e) {
			}

			// //////

			DatastoreService datastore = DatastoreServiceFactory
					.getDatastoreService();
			objects = new HashMap<Object, HashMap<String, Object>>();

			Query q = new Query(clazz);

			PreparedQuery pq = datastore.prepare(q);

			for (Entity result : pq.asIterable()) {
				// iterate over each property
				HashMap<String, Object> obj = new HashMap<String, Object>();
				if (result.getKey().getName() != null) {
					obj.put("name", result.getKey().getName());
				} else {
					obj.put("id", result.getKey().getId());
				}
				for (Entry<String, Object> entry : result.getProperties()
						.entrySet()) {

					if (entry.getValue() instanceof Text) {

						obj.put(entry.getKey(),
								((Text) entry.getValue()).getValue());
					} else {
						obj.put(entry.getKey(), entry.getValue());
					}
				}

				// handle both string and numeric id's
				Object key = result.getKey().getName() != null ? result
						.getKey().getName() : result.getKey().getId();

				objects.put(key, obj);
			}
			// if we had to go to the datastore, stash it in memcache for
			// the next time
			try {
				cache = CacheManager.getInstance().getCacheFactory()
						.createCache(Collections.emptyMap());
				cache.put("__ALL__" + clazz, objects);
			} catch (CacheException ce) {
			}

			return objects;
		}

		public Entity save(String clazz) {
			Entity e = new Entity(clazz);
			DatastoreService datastore = DatastoreServiceFactory
					.getDatastoreService();
			datastore.put(e);
			return e;
		}

		@SuppressWarnings("unchecked")
		public Entity save(String clazz, long id, Map<String, Object> properties) {
			Step step = MiniProfiler
					.step("GameEngine.Persistence.save(String,long,Map<String,Object>)");
			try {
				DatastoreService datastore = DatastoreServiceFactory
						.getDatastoreService();
				Entity e = new Entity(KeyFactory.createKey(clazz, id));
				{
					// set properties
					for (Entry<String, Object> entry : properties.entrySet()) {
						Object value = entry.getValue();
						if (value instanceof String
								&& ((String) value).length() >= 500) {
							e.setProperty(entry.getKey(), new Text(
									(String) value));
						} else if (value instanceof String) {
							e.setProperty(entry.getKey(), ((String) value));
						} else if (value instanceof Collection) {
							e.setProperty(entry.getKey(),
									((Collection<?>) value));
						} else if (value instanceof Object[]) {
							e.setProperty(entry.getKey(),
									Arrays.asList((Object[]) value));
						} else {
							e.setProperty(entry.getKey(), value);
						}
					}

					try {
						datastore.put(e);
					} catch (RequestTooLargeException rtle) {
					}
				}

				try {
					Cache cache = CacheManager.getInstance().getCacheFactory()
							.createCache(Collections.emptyMap());
					cache.put((String) (clazz + id),
							(Map<String, Object>) properties);

					// update all cache
					Map<Object, Map<String, Object>> objects = (Map<Object, Map<String, Object>>) cache
							.get("__ALL__" + clazz);
					if (objects != null) {

						objects.put(id, properties);

						cache.put("__ALL__" + clazz, objects);
					}
				} catch (CacheException ce) {
					// ...
				}
				return e;
			} finally {
				step.close();
			}
		}

		@SuppressWarnings("unchecked")
		public Entity save(String clazz, long id, final String propertyName,
				final String value) {
			DatastoreService datastore = DatastoreServiceFactory
					.getDatastoreService();
			Entity e = new Entity(KeyFactory.createKey(clazz, id));
			{
				// set properties
				e.setProperty(propertyName, new Text(value));
				datastore.put(e);
			}

			try {
				Cache cache = CacheManager.getInstance().getCacheFactory()
						.createCache(Collections.emptyMap());
				HashMap<String, Object> hashMap = new HashMap<String, Object>();
				hashMap.put(propertyName, value);

				cache.put(clazz + e.getKey().getId(), hashMap);

				// update all cache
				HashMap<Object, HashMap<String, Object>> objects = (HashMap<Object, HashMap<String, Object>>) cache
						.get("__ALL__" + clazz);
				if (objects != null) {

					objects.put(id, hashMap);

					cache.put("__ALL__" + clazz, objects);
				}

			} catch (CacheException ce) {
				// ...
			}
			return e;
		}

		@SuppressWarnings({ "unused", "unchecked" })
		@Deprecated
		private Entity save(String clazz, Map<String, Object> properties) {
			DatastoreService datastore = DatastoreServiceFactory
					.getDatastoreService();
			// Entity e = new Entity(KeyFactory.createKey(clazz, name));
			Entity e = new Entity(clazz);
			{

				// set properties
				for (Entry<String, Object> entry : properties.entrySet()) {
					Object value = entry.getValue();
					if (value instanceof String
							&& ((String) value).length() >= 500) {
						e.setProperty(entry.getKey(), new Text((String) value));
					} else if (value instanceof String) {
						e.setProperty(entry.getKey(), ((String) value));
					} else if (value instanceof Collection) {
						e.setProperty(entry.getKey(), ((Collection<?>) value));
					} else if (value instanceof Object[]) {
						e.setProperty(entry.getKey(),
								Arrays.asList((Object[]) value));
					} else {
						e.setProperty(entry.getKey(), value);
					}
				}

				datastore.put(e);
			}

			try {
				Cache cache = CacheManager.getInstance().getCacheFactory()
						.createCache(Collections.emptyMap());
				cache.put(clazz + e.getKey().getId(), properties);
			} catch (CacheException ce) {
				// ...
			}

			return e;
		}

		@SuppressWarnings("unchecked")
		public Entity save(String parentClazz, long parentId, String clazz,
				long id, Map<String, Object> properties) {
			DatastoreService datastore = DatastoreServiceFactory
					.getDatastoreService();
			Entity e = new Entity(KeyFactory.createKey(
					KeyFactory.createKey(parentClazz, parentId), clazz, id));
			{
				// set properties
				for (Entry<String, Object> entry : properties.entrySet()) {
					Object value = entry.getValue();
					if (value instanceof String
							&& ((String) value).length() >= 500) {
						e.setProperty(entry.getKey(), new Text((String) value));
					} else if (value instanceof String) {
						e.setProperty(entry.getKey(), ((String) value));
					} else if (value instanceof Collection) {
						e.setProperty(entry.getKey(), ((Collection<?>) value));
					} else if (value instanceof Object[]) {
						e.setProperty(entry.getKey(),
								Arrays.asList((Object[]) value));
					} else {
						e.setProperty(entry.getKey(), value);
					}
				}
				datastore.put(e);
			}

			try {
				Cache cache = CacheManager.getInstance().getCacheFactory()
						.createCache(Collections.emptyMap());

				cache.put(clazz + id, properties);

				// update the all cache
				HashMap<String, HashMap<String, Object>> objects = (HashMap<String, HashMap<String, Object>>) cache
						.get("__ALL__" + clazz);
				if (objects != null) {
					objects.put(Long.toString(id),
							(HashMap<String, Object>) properties);

					cache.put("__ALL__" + clazz, objects);
				}

			} catch (CacheException ce) {
				// ...
			}

			return e;
		}

		@SuppressWarnings("unchecked")
		public Entity save(String clazz, String name,
				Map<String, Object> properties) {
			DatastoreService datastore = DatastoreServiceFactory
					.getDatastoreService();
			Entity e = new Entity(KeyFactory.createKey(clazz, name));
			{

				// set properties
				for (Entry<String, Object> entry : properties.entrySet()) {
					Object value = entry.getValue();
					if (value instanceof String
							&& ((String) value).length() >= 500) {
						e.setProperty(entry.getKey(), new Text((String) value));
					} else if (value instanceof String) {
						e.setProperty(entry.getKey(), ((String) value));
					} else if (value instanceof Collection) {
						e.setProperty(entry.getKey(), ((Collection<?>) value));
					} else if (value instanceof Object[]) {
						e.setProperty(entry.getKey(),
								Arrays.asList((Object[]) value));
					} else {
						e.setProperty(entry.getKey(), value);
					}
				}

				datastore.put(e);

			}

			try {
				Cache cache = CacheManager.getInstance().getCacheFactory()
						.createCache(Collections.emptyMap());

				cache.put(clazz + name, properties);

				// update the all cache
				HashMap<String, HashMap<String, Object>> objects = (HashMap<String, HashMap<String, Object>>) cache
						.get("__ALL__" + clazz);
				if (objects != null) {
					objects.put(name, (HashMap<String, Object>) properties);

					cache.put("__ALL__" + clazz, objects);
				}

			} catch (CacheException ce) {
				// ...
			}

			return e;
		}

		@SuppressWarnings("unchecked")
		public Entity save(String clazz, String propertyName, String value) {
			DatastoreService datastore = DatastoreServiceFactory
					.getDatastoreService();
			// Entity e = new Entity(KeyFactory.createKey(clazz, name));
			Entity e = new Entity(clazz);

			// set properties
			e.setProperty(propertyName, new Text(value));

			datastore.put(e);

			try {
				Cache cache = CacheManager.getInstance().getCacheFactory()
						.createCache(Collections.emptyMap());
				cache.put(clazz + e.getKey().getId(), value);
			} catch (CacheException ce) {
				// ...
			}

			return e;
		}

		@SuppressWarnings("unchecked")
		public Entity save(String clazz, String name, String propertyName,
				String value) {
			DatastoreService datastore = DatastoreServiceFactory
					.getDatastoreService();
			Entity e = new Entity(KeyFactory.createKey(clazz, name));
			{
				// set properties
				e.setProperty(propertyName, new Text(value));
				datastore.put(e);
			}

			try {
				Cache cache = CacheManager.getInstance().getCacheFactory()
						.createCache(Collections.emptyMap());

				HashMap<String, Object> object = new HashMap<String, Object>();
				object.put(propertyName, value);
				object.put("name", name);
				cache.put(clazz + name, object);

				// update the all cache
				HashMap<String, HashMap<String, Object>> objects = (HashMap<String, HashMap<String, Object>>) cache
						.get("__ALL__" + clazz);
				if (objects != null) {
					objects.put(name, object);

					cache.put("__ALL__" + clazz, objects);
				}

			} catch (CacheException ce) {
				// ...
			}

			return e;
		}

		@Deprecated
		public void save(String clazz, String name, String propertyName,
				Blob blob) {
			DatastoreService datastore = DatastoreServiceFactory
					.getDatastoreService();
			Entity e = new Entity(KeyFactory.createKey(clazz, name));
			{
				// set properties
				e.setProperty(propertyName, blob);
				datastore.put(e);
			}
		}
	}

	private static final String SCRIPT = "Script";
	private static final String CODE = "code";

	public final IO io = new IO();

	public final Persistence persistence = new Persistence();

	private static final String INVOKE = "invoke";
	private static final String INCLUDE = "include";

	private Context cx;
	private final Scriptable scope;
	private final HttpServletResponse response;

	private String[] includes;
	private String[] invokes;

	public GameEngine(String[] jsFiles) {
		Step step = MiniProfiler.step("GameEngine");
		this.response = null;

		Step step1 = MiniProfiler.step("GameEngine set up context and scope");

		this.cx = new ContextFactory().enterContext();
		this.scope = this.cx.initStandardObjects(null, true);

		step1.close();

		Step step2 = MiniProfiler.step("GameEngine load IO.ioWrappers");

		this.loadScript(IO.ioWrappers, "IO.ioWrappers");

		step2.close();

		Step step3 = MiniProfiler
				.step("GameEngine load Persistence.persistenceWrappers");

		this.loadScript(Persistence.persistenceWrappers,
				"Persistence.persistenceWrappers");

		step3.close();

		Step step4 = MiniProfiler.step("GameEngine load custom scripts");

		for (String js : jsFiles) {
			this.loadScriptFromFile(js);
		}

		step4.close();

		// engine.put("e", this);
		this.scope.put("e", this.scope, Context.javaToJS(this, this.scope));

		step.close();
	}

	void enterContext() {
		this.cx = Context.enter();
	}

	public ScriptableObject execute(String expresion) {
		ScriptableObject result = null;
		this.cx = Context.enter();
		try {
			result = (ScriptableObject) this.cx.evaluateString(this.scope,
					expresion, "", 1, null);
		} catch (RuntimeException rte) {
			rte.printStackTrace();
		}

		return result;
	}

	private void include(String[] incl) {
		for (String name : incl) {
			for (String n : name.split(",")) {

				HashMap<String, Object> script = this.persistence
						.get(SCRIPT, n);
				if (script.containsKey(CODE) && script.get(CODE) != null
						&& !script.get(CODE).equals("")) {
					// engine.eval(script.get("code"));
					try {
						this.cx.evaluateString(this.scope,
								(String) script.get(CODE), n, 1, null);
					} catch (RhinoException ee) {
						ee.printStackTrace();
						throw ee;
					}
				}
			}
		}
	}

	public Object invoke(Scriptable object, String methodName)
			throws GameEngineException {
		Step step = MiniProfiler.step("GameEngine.invoke(Scriptable,String)");
		try {
			Object result = null;
			try {
				result = ScriptableObject.callMethod(object, methodName, null);
			} catch (EcmaError ee) {
				throw new GameEngineException(ee);
			}
			return result;
		} finally {
			step.close();
		}
	}

	/**
	 * 
	 * @param object
	 * @param methodName
	 * @param args
	 * @return
	 * @throws GameEngineException
	 * @throws Exception
	 */
	public Object invoke(Scriptable object, String methodName, Object[] args)
			throws GameEngineException {
		Step step = MiniProfiler.step("GameEngine.invoke");
		try {
			Object result = null;
			try {
				result = ScriptableObject.callMethod(object, methodName, args);
			} catch (EcmaError ee) {
				throw new GameEngineException(ee);
			}
			return result;
		} finally {
			step.close();
		}
	}

	Object invoke(final String inv, final Map<String, String[]> m)
			throws GameEngineException {
		Object result = null;
		for (String n : inv.split(",")) {
			try {
				Object fct = this.cx.evaluateString(this.scope, n, n, 1, null);
				result = ((Callable) fct).call(this.cx, this.scope, this.scope,
						new Object[] { m });
			} catch (EcmaError ee) {
				throw new GameEngineException(ee);
			}
		}
		return result;
	}

	public Scriptable invoke(String clazz, Object[] args)
			throws GameEngineException {
		Scriptable result = null;
		try {

			result = this.cx.newObject(this.scope, clazz, args);
		} catch (EcmaError ee) {
			throw new GameEngineException(ee);
		}
		return result;
	}

	public Scriptable invoke(String clazz) throws GameEngineException {
		Scriptable result = null;
		try {
			result = this.cx.newObject(this.scope, clazz);
		} catch (EcmaError ee) {
			throw new GameEngineException(ee);
		}
		return result;
	}

	private Object invoke(final String[] inv, final Map<String, String[]> m)
			throws GameEngineException {
		Object result = null;
		for (String name : inv) {
			for (String n : name.split(",")) {
				try {
					Object fct = this.cx.evaluateString(this.scope, n, n, 1,
							null);
					result = ((Callable) fct).call(this.cx, this.scope,
							this.scope, new Object[] { m });
				} catch (EcmaError ee) {

					throw new GameEngineException(ee);
				}
			}
		}
		return result;
	}

	public void loadScript(String script, String name) {
		Step step = MiniProfiler.step("GameEngine.loadScript " + name);
		this.cx.evaluateString(this.scope, script, name, 1, null);
		step.close();
	}

	private void loadScriptFromFile(String pathName) {

		Step step = MiniProfiler.step("GameEngine.loadScriptFromFile");

		Step step1 = MiniProfiler
				.step("GameEngine.loadScriptFromFile getResourceAsStream");

		InputStream ras = this.getClass().getResourceAsStream(pathName);

		step1.close();

		if (ras == null)
			try {
				throw new Exception(pathName + " not found");
			} catch (Exception e) {
				e.printStackTrace();
				return;
			}

		Step step2 = MiniProfiler
				.step("GameEngine.loadScriptFromFile new Scanner");

		Scanner s = new Scanner(ras);

		step2.close();

		StringBuilder builder = new StringBuilder();

		Step step3 = MiniProfiler
				.step("GameEngine.loadScriptFromFile nextLine");

		while (s.hasNextLine()) {
			builder.append("\n").append(s.nextLine());
		}

		step3.close();

		try {
			ras.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
		s.close();
		this.loadScript(builder.toString(), pathName);

		step.close();
	}

	protected Object process(final Map<String, String[]> m, String user)
			throws GameEngineException {

		if (this.includes != null) {
			include(this.includes);

		}
		if (this.invokes != null) {
			invoke(this.invokes, m);
		}

		// get the scripts to load
		if (m.containsKey(INCLUDE)) {
			this.includes = m.get(INCLUDE);
			include(this.includes);
		}

		Object result = null;
		// now execute some code
		if (m.containsKey(INVOKE)) {

			this.invokes = m.get(INVOKE);
			result = invoke(this.invokes, m);
		}
		if (result != null && result instanceof NativeJavaObject) {
			return ((NativeJavaObject) result).unwrap();
		}
		return result;
	}

	public String stringify(ScriptableObject object) {
		return (String) NativeJSON.stringify(cx, scope, object, null, null);
	}

	public Object parse(String string) {
		try {
			return new JsonParser(cx, scope).parseValue(string);
		} catch (ParseException e) {
			e.printStackTrace();
		}
		// return (ScriptableObject) NativeJSON.parse(cx, scope, string, null);
		return string;

	}
}