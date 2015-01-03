package com.antonytrupe.thediskgame;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.SignatureException;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Properties;
import java.util.logging.Logger;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.AddressException;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.oauth.jsontoken.JsonToken;
import net.oauth.jsontoken.crypto.HmacSHA256Signer;

import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.binary.StringUtils;
import org.joda.time.Instant;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.ScriptableObject;

import au.com.bytecode.opencsv.CSVParser;
import ca.jimr.gae.profiler.MiniProfiler;
import ca.jimr.gae.profiler.MiniProfiler.Step;

import com.antonytrupe.games.GameEngine;
import com.antonytrupe.games.GameEngineException;
import com.google.appengine.api.blobstore.BlobInfo;
import com.google.appengine.api.blobstore.BlobInfoFactory;
import com.google.appengine.api.blobstore.BlobKey;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;
import com.google.appengine.api.datastore.Blob;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.CompositeFilter;
import com.google.appengine.api.datastore.Query.CompositeFilterOperator;
import com.google.appengine.api.datastore.Query.Filter;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
import com.google.appengine.api.datastore.Query.SortDirection;
import com.google.appengine.api.datastore.Text;
import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.appengine.api.utils.SystemProperty;
import com.google.apphosting.api.ApiProxy.OverQuotaException;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

class API {

	static enum Action {
		// misc
		UNIT_TEST, LOG_IN, GET_TABLE,
		// table
		CREATE_TABLE, JOIN_TABLE,
		// activation
		MOVE_DISK, ACTIVATE_DISK, END_ACTIVATIONS, SAVE_REINFORCEMENT, END_REINFORCEMENTS, END_MISSILES, FIRE_MISSILES,
		//
		SAVE_ARMY, DELETE_ARMY,
		//
		SET_ATTACKEE, SET_DEFENDEE,
		// lists
		GET_ALL_TABLES, PROFILE, LEADERBOARD,
		// disk admin
		CREATE_DISK, DOWNLOAD_DISKS, GET_ALL_DISKS, GET_DISK, UPLOAD_DISKS, CREATE_MISSION,
		// shopping
		CONFIRM, JWT;
	}

	private static final int MAX_TABLES = 4;

	private static final String ISSUER = "03360221793493715167";

	private static final Logger log = Logger.getLogger(API.class.getName());

	private static final Collection<String> OPEN_SEGMENTS = Arrays
			.asList("JOIN");
	private static final Collection<String> ACTIVE_SEGMENTS = Arrays.asList(
			"ACTIVATION", "REINFORCEMENTS", "COMBAT", "MISSILE");

	// sandbox
	// private static final String SIGNING_KEY = "j9MkWFAqAqWbQYrXjTEK7g";
	// prod XqSjyf_ckB7h_d2Z92hxhA
	private static final String SIGNING_KEY = "XqSjyf_ckB7h_d2Z92hxhA";
	private final static String applicationVersion;

	private final static GameEngine ge;

	private final static Date uploadDate;
	static {
		Step step = MiniProfiler.step("API static");

		ge = new GameEngine(new String[] {
				"/com/antonytrupe/thediskgame/Table.js",
				"/com/antonytrupe/thediskgame/Disk.js",
				"/com/antonytrupe/thediskgame/Point.js",
				"/com/antonytrupe/thediskgame/AI.js",
				"/com/antonytrupe/thediskgame/Player.js" });

		final String av = SystemProperty.applicationVersion.get();
		if (av != null) {
			applicationVersion = av.substring(0, av.lastIndexOf("."));
			uploadDate = new Date(Long.parseLong(av.substring(av
					.lastIndexOf(".") + 1)) / (2 << 27) * 1000);
		} else {
			applicationVersion = "";
			uploadDate = new Date();
		}

		step.close();
	}

	// used for the google checkout cart
	private static JsonToken createToken(final String disks, final String user,
			final float cost, String description) throws InvalidKeyException {

		Step step = MiniProfiler.step("API.createToken");
		try {

			// Current time and signing algorithm
			final Calendar cal = Calendar.getInstance();
			final HmacSHA256Signer signer = new HmacSHA256Signer(ISSUER, null,
					SIGNING_KEY.getBytes());

			// Configure JSON token
			final JsonToken token = new JsonToken(signer);
			token.setAudience("Google");
			token.setParam("typ", "google/payments/inapp/item/v1");
			token.setIssuedAt(new Instant(cal.getTimeInMillis()));
			token.setExpiration(new Instant(cal.getTimeInMillis() + 60000L));

			// Configure request object
			final JsonObject request = new JsonObject();
			request.addProperty("name", "Battle Disks");
			request.addProperty("description", description);
			request.addProperty("price", cost);
			request.addProperty("currencyCode", "USD");
			request.addProperty("sellerData", user);

			final JsonObject payload = token.getPayloadAsJsonObject();
			payload.add("request", request);

			return token;
		} finally {
			step.close();
		}
	}

	private static String createUnitTest(final ScriptableObject table) {
		Step step = MiniProfiler.step("API.createUnitTest");
		try {
			// recordReplay
			if (table == null) {
				return "";
			}

			final StringBuilder unitTest = new StringBuilder("@Test \n");
			unitTest.append("public void replay").append(table.get("id"))
					.append("Round").append(table.get("round"))
					.append("() throws GameEngineException {\n");

			unitTest.append("API api = new API();\n");

			unitTest.append("ScriptableObject table=");

			final NativeArray actions = (NativeArray) table.get("actions");
			for (final Object a : actions) {
				unitTest.append("api.").append(
						((ScriptableObject) a).get("method"));

				if (((ScriptableObject) a).get("method") != "createTable") {
					unitTest.append("(table,");
				}
				final NativeArray args = (NativeArray) ((ScriptableObject) a)
						.get("arguments");
				for (final Object argO : args.toArray()) {
					// test.append("\"");
					StringBuilder arg = toString(argO);
					// if string does not start with a quote
					if (!arg.toString().startsWith("\"")) {
						final String replaceAll = arg.toString().replace("\"",
								"\\\"");
						arg = new StringBuilder("\"");
						arg.append(replaceAll);
						arg.append("\"");
					}
					unitTest.append(arg);
					// test.append("\"");
					unitTest.append(",");
				}
				if (args.getIds().length > 0) {
					unitTest.replace(unitTest.length() - 1, unitTest.length(),
							"");
				}
				unitTest.append(");\n");

			}

			unitTest.append("}");

			return unitTest.toString();
		} finally {
			step.close();
		}
	}

	private static String deserialize(final String tokenString) {
		Step step = MiniProfiler.step("API.deserialize");
		try {

			final String[] pieces = splitTokenString(tokenString);
			final String jwtPayloadSegment = pieces[1];
			final JsonParser parser = new JsonParser();
			final String newStringUtf8 = StringUtils.newStringUtf8(Base64
					.decodeBase64(jwtPayloadSegment.getBytes()));
			final JsonElement payload = parser.parse(newStringUtf8);

			return payload.toString();
		} finally {
			step.close();
		}
	}

	private static Long getId(final ScriptableObject object)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.getId");
		try {
			final Object sd = ge.invoke(object, "getId");

			return getLong(sd);

		} finally {
			step.close();
		}
	}

	private static Integer getInteger(final Object o) {
		Step step = MiniProfiler.step("API.getInteger");
		try {
			if (o instanceof Integer) {
				return (Integer) o;
			} else if (o instanceof Double) {
				return (int) (double) (Double) o;
			}
			return null;
		} finally {
			step.close();
		}
	}

	private static Long getLong(final Object o) {
		Step step = MiniProfiler.step("API.getLong");
		try {
			if (o instanceof Long) {
				return (Long) o;
			} else if (o instanceof Double) {
				return (long) ((Double) o).longValue();
			} else if (o instanceof String) {
				return Long.parseLong((String) o);
			}
			return null;
		} finally {
			step.close();
		}
	}

	private static Object getParameter(final String name,
			final Map<String, Object> parameters) {
		Step step = MiniProfiler.step("API.getParameter");
		try {
			String s = null;
			final Object object = parameters.get(name);
			if (object instanceof Blob) {
				return object;
			} else if (object instanceof BlobKey) {
				return ((BlobKey) object).getKeyString();
			} else if (object != null && object instanceof Object[]) {
				if (((Object[]) object).length > 0) {
					s = (String) ((Object[]) object)[0];
					s = s.replace("!", "");
				}
			}
			return s;
		} finally {
			step.close();
		}
	}

	private static Long getTableId(final Map<String, Object> parameters) {
		Step step = MiniProfiler.step("API.getTableId");
		try {
			final String s = (String) getParameter("id", parameters);

			Long parseLong = null;
			if (s != null && !s.equals("") && !s.equals("null")) {
				parseLong = Long.parseLong(s.replace("!", "").replace("#", ""));
			}
			return parseLong;
		} finally {
			step.close();
		}
	}

	protected static String getUser(final HttpServletRequest request) {
		Step step = MiniProfiler.step("API.getUser");
		try {
			final User currentUser = UserServiceFactory.getUserService()
					.getCurrentUser();
			return currentUser != null ? currentUser.getEmail() : null;
		} finally {
			step.close();
		}
	}

	private static ZipInputStream getZipFile(final BlobKey csvBlobKey)
			throws FileNotFoundException, IOException {
		Step step = MiniProfiler.step("API.getZipFile");

		try {

			final BlobstoreService blobstoreService = BlobstoreServiceFactory
					.getBlobstoreService();

			BlobInfo info = new BlobInfoFactory().loadBlobInfo(csvBlobKey);

			byte[] bytes = blobstoreService.fetchData(csvBlobKey, 0,
					info.getSize());

			final ZipInputStream zipIn = new ZipInputStream(
					new ByteArrayInputStream(bytes));

			return zipIn;
		} finally {
			step.close();
		}
	}

	private static void mailUnitTest(final String unitTest) {
		Step step = MiniProfiler.step("API.mailUnitTest");
		try {

			final Properties props = new Properties();
			final Session session = Session.getDefaultInstance(props, null);
			final Message msg = new MimeMessage(session);
			msg.setFrom(new InternetAddress("antony.trupe@gmail.com"));
			msg.addRecipient(Message.RecipientType.TO, new InternetAddress(
					"antony.trupe@gmail.com"));
			msg.setSubject("TheDiskGame Error");
			msg.setText(unitTest);
			try {
				Transport.send(msg);
			} catch (OverQuotaException oqe) {
				// email send failed due to quota limit
				oqe.printStackTrace();
				log.warning(oqe.getMessage());
			}
			API.log.info(unitTest);

		} catch (AddressException e) {
			e.printStackTrace();
		} catch (MessagingException e) {
			e.printStackTrace();

		} finally {
			step.close();
		}
	}

	/**
	 * @param tokenString
	 *            The original encoded representation of a JWT
	 * @return Three components of the JWT as an array of strings
	 */
	private static String[] splitTokenString(final String tokenString) {
		Step step = MiniProfiler.step("API.splitTokenString");
		try {
			if (tokenString == null) {
				return null;
			}
			final String[] pieces = tokenString.split(Pattern.quote("."));
			if (pieces.length != 3) {
				throw new IllegalStateException(
						"Expected JWT to have 3 segments separated by '" + "."
								+ "', but it has " + pieces.length
								+ " segments");
			}
			return pieces;
		} finally {
			step.close();
		}
	}

	private static StringBuilder toString(final Object o) {
		Step step = MiniProfiler.step("API.toString");
		try {
			final StringBuilder sb = new StringBuilder();
			if (o instanceof NativeArray) {
				sb.append("[");
				for (final Object value : ((NativeArray) o).toArray()) {
					sb.append(toString(value));
					sb.append(",");
				}
				sb.replace(sb.length() - 1, sb.length(), "");
				sb.append("]");

			} else if (o instanceof ScriptableObject) {
				sb.append("{");
				for (final Object key : ((ScriptableObject) o).getIds()) {

					sb.append("\"");
					sb.append(key);
					sb.append("\"");
					sb.append(":");

					Object value = ((ScriptableObject) o).get(key);
					sb.append(toString(value));

					sb.append(",");
				}
				sb.replace(sb.length() - 1, sb.length(), "");
				sb.append("}");
			}

			else if (o instanceof Number) {
				sb.append(o.toString());
			}

			else if (o != null) {
				sb.append("\"").append(o.toString()).append("\"");
			} else {
				// throw new NullPointerException("");
			}

			return sb;
		} finally {
			step.close();
		}
	}

	protected API() {
		Step step = MiniProfiler.step("API");

		step.close();
	}

	protected static void activateDisk(final ScriptableObject table,
			final String diskNumber, final String user)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.activateDisk");
		try {
			// ACTIVATE_DISK
			ge.invoke(table, "activateDisk", new Object[] { diskNumber, user });
			saveTable(table);

			// see if someone won
			if (((ScriptableObject) table.get("memento")).get("segment") == "FINISHED") {
				updateRatings(table);
			}
		} finally {
			step.close();
		}
	}

	private static void addMementos(ScriptableObject table, PreparedQuery pq) {

		// Object a=new com.google.appengine.tools.appstats.Recorder();
		// Object b=new com.google.appengine.tools.development.ApiProxyLocal();

		Step step = MiniProfiler.step("API.addMementos");

		try {

			for (Entity result : pq.asIterable()) {

				Object a = result.getProperty("json");

				final String json;
				if (a instanceof Text) {
					json = ((Text) a).getValue();
				} else if (a instanceof String) {
					json = (String) a;
				} else {
					json = a.toString();
				}

				ScriptableObject mementos = (ScriptableObject) table
						.get("mementos");
				Long mementoId = getLong(result.getProperty("mementoId"));

				Step step1 = MiniProfiler.step("putProperty,valueOf,ge.parse");
				ScriptableObject.putProperty(mementos,
						String.valueOf(mementoId), ge.parse(json));
				step1.close();
			}

		} finally {
			step.close();
		}
	}

	private static void completePurchase(final ScriptableObject player)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.completePurchase");
		try {
			final ScriptableObject disks = (ScriptableObject) player
					.get("cart");

			for (final Object diskName : disks.getIds()) {
				final ScriptableObject disk = getDisk((String) diskName);
				// ScriptableObject info = (ScriptableObject)
				// disks.get(diskName);

				final int count = API.getInteger(disks.get(diskName));
				for (int i = 0; i < count; i++) {
					addDiskToPlayer(player, disk, null);
				}
			}

			// clear the cart
			ge.invoke(player, "saveCart", new Object[] {});

		} finally {
			step.close();
		}
	}

	static Object addDiskToPlayer(ScriptableObject player,
			ScriptableObject disk, ScriptableObject location)
			throws GameEngineException {
		return ge.invoke(player, "addDisk", new Object[] { disk, location });
	}

	private static String confirm(final String jwt, final String user)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.confirm");
		try {
			final String sd = deserialize(jwt);
			final ScriptableObject f = ge.execute("_=" + sd);
			final ScriptableObject jwtResponse = (ScriptableObject) f
					.get("response");
			final ScriptableObject jwtRequest = (ScriptableObject) f
					.get("request");
			final String u = (String) jwtRequest.get("sellerData");
			// make sure its still the same person
			if (user != u) {
				return "";
			}

			final String orderId = (String) jwtResponse.get("orderId");
			// add the disks to the player
			final ScriptableObject player = getPlayer(user);
			completePurchase(player);

			savePlayer(player);

			return orderId;
		} finally {
			step.close();
		}
	}

	private static ScriptableObject createDisk() throws GameEngineException {
		Step step = MiniProfiler.step("API.createDisk");
		try {
			final ScriptableObject disk = (ScriptableObject) ge.invoke("Disk");
			return disk;
		} finally {
			step.close();
		}
	}

	// name, attack, defense, toughness, movement, wounds, flying,swashbuckler,
	// cost,
	// faction, alignment, diameter, description, price
	private static ScriptableObject createDisk(final String name,
			final String type, final Integer attack, final Integer defense,
			final Integer toughness, final Integer movement,
			final Integer wounds, final Boolean flying,
			final Boolean swashbuckler, final Boolean archer,
			final Integer arrows, final Integer bolts, final Integer fireballs,
			final Integer boulders, final Boolean missileImmunity,
			final Boolean firstblow, final Integer spellcaster,
			final Integer limit, final Integer cost, final String faction,
			final String alignment, final String diameter,
			final String description, final String price)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.createDisk(...)");
		try {
			// name, attack, defense, toughness, movement, wounds, flying,
			// swashbuckler,cost,
			// faction, alignment, diameter, description, price
			final ScriptableObject disk = (ScriptableObject) ge.invoke("Disk",
					new Object[] { name, type, attack, defense, toughness,
							movement, wounds, flying, swashbuckler, archer,
							arrows, bolts, fireballs, boulders,
							missileImmunity, firstblow, spellcaster, limit,
							cost, faction, alignment, diameter, description,
							price, });

			saveDisk(disk);

			final StringBuilder sb = new StringBuilder(
					"CREATE_DISK\nAPI.createDisk(");

			sb.append("\"");
			sb.append(name);
			sb.append("\",\"");

			sb.append(type);
			sb.append("\",\"");

			sb.append(attack);
			sb.append("\",\"");

			sb.append(defense);
			sb.append("\",\"");

			sb.append(toughness);
			sb.append("\",\"");

			sb.append(movement);
			sb.append("\",\"");

			sb.append(wounds);
			sb.append("\",\"");

			sb.append(flying);
			sb.append("\",\"");

			sb.append(swashbuckler);
			sb.append("\",\"");

			sb.append(archer);
			sb.append("\",\"");

			sb.append(arrows);
			sb.append("\",\"");

			sb.append(bolts);
			sb.append("\",\"");

			sb.append(fireballs);
			sb.append("\",\"");

			sb.append(boulders);
			sb.append("\",\"");

			sb.append(spellcaster);
			sb.append("\",\"");

			sb.append(cost);
			sb.append("\",\"");

			sb.append(faction);
			sb.append("\",\"");

			sb.append(alignment);
			sb.append("\",\"");

			sb.append(diameter);
			sb.append("\",\"");

			sb.append(description);
			sb.append("\",\"");

			sb.append(price);
			sb.append("\"");

			sb.append(");");

			API.log.info(sb.toString());

			return disk;
		} finally {
			step.close();
		}
	}

	private static StringBuilder createDiskCsv() throws GameEngineException {
		Step step = MiniProfiler.step("API.createDiskCsv");
		try {
			HashMap<Object, HashMap<String, Object>> disks = ge.persistence
					.getAll("Disk");

			// write the column headers
			boolean header = true;

			final StringBuilder csv = new StringBuilder();

			for (HashMap<String, Object> diskMap : disks.values()) {
				final String diskJson = (String) diskMap.get("json");

				// final ScriptableObject o = ge.execute("_=" + diskJson);

				final ScriptableObject disk = createDisk();

				update(disk, ge.parse(diskJson));

				// header
				if (header) {
					for (final Object id : disk.getIds()) {

						if (disk.get(id) instanceof String
								|| disk.get(id) instanceof Number
								|| disk.get(id) instanceof Boolean) {
							csv.append(id + ",");
						}
					}
					header = false;
					csv.append("\n");
				}

				// data
				for (final Object id : disk.getIds()) {

					if (disk.get(id) instanceof String) {
						csv.append("\""
								+ ((String) disk.get(id)).replaceAll("\"",
										"\"\"") + "\",");
					} else if (disk.get(id) instanceof Number
							|| disk.get(id) instanceof Boolean) {
						csv.append(disk.get(id) + ",");
					}
				}

				csv.append("\n");
			}
			return csv;

		} finally {
			step.close();
		}
	}

	protected static ScriptableObject createPlayer(final String username)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.createPlayer");

		try {
			// createPlayer
			final ScriptableObject player = (ScriptableObject) ge.invoke(
					"Player", new String[] { username, });
			final LinkedHashMap<String, ScriptableObject[]> disks = new LinkedHashMap<String, ScriptableObject[]>();

			// Knights
			// Pikemen
			disks.put("Pikemen",
					new ScriptableObject[] { createPoint(-3.2, -6.2),
							createPoint(-1.2, -5), createPoint(-2.6, -3.6), });

			// Heavy Horse Cavalry
			disks.put("Heavy Horse Cavalry", new ScriptableObject[] {
					createPoint(-4.5, -4.5), createPoint(-5.7, -2.9),
					createPoint(-4.1, -1.7), createPoint(-6, -.8) });

			// Elf
			// Deepwood Warriors x3
			disks.put("Deepwood Warriors", new ScriptableObject[] {
					createPoint(3.6, -6.4), createPoint(2.4, -5.4),
					createPoint(3.6, -3.8), });
			// Riders of the Wood x4
			disks.put("Riders of the Wood", new ScriptableObject[] {
					createPoint(4.6, -5.4), createPoint(6.5, -4.0),
					createPoint(5.1, -2.1), createPoint(6.5, -.6) });
			// Deepwood Archers x2
			disks.put("Deepwood Archers",
					new ScriptableObject[] { createPoint(7.5, -2.3),
							createPoint(8.8, -1) });

			// Dwarf
			// Damlo Hammerfist
			disks.put("Damlo Hammerfist",
					new ScriptableObject[] { createPoint(-8.7, 1.3), });
			// Grovan of the Deep
			disks.put("Grovan of the Deep",
					new ScriptableObject[] { createPoint(-9.7, 2.2), });
			// Stalwarts x1
			disks.put("Stalwarts",
					new ScriptableObject[] { createPoint(-9.1, 3.8), });

			// Regiment of the Anvil x5
			disks.put("Regiment of the Anvil",
					new ScriptableObject[] { createPoint(-7.6, 2.9),
							createPoint(-6.8, 4.2), createPoint(-8.2, 5),
							createPoint(-7.2, 6.5), createPoint(-5.7, 5.7), });

			// Orc
			// Urgg the Really Mean x1[+][-]
			disks.put("Urgg the Really Mean",
					new ScriptableObject[] { createPoint(9.4, 1.3), });
			// Shieldgrogs x2[+][-]
			disks.put("Shieldgrogs",
					new ScriptableObject[] { createPoint(9.8, 3.4),
							createPoint(10.5, 2.5), });
			// Ghash Zzurkan x1[+][-]
			disks.put("Ghash Zzurkan",
					new ScriptableObject[] { createPoint(8.4, 2.5), });
			// Grugs x5
			disks.put("Grugs",
					new ScriptableObject[] { createPoint(6.6, 6.7),
							createPoint(6.6, 5), createPoint(7.9, 6.1),
							createPoint(7.5, 3.8), createPoint(8.8, 4.8), });

			// Dragon
			// Dragonflight
			disks.put(
					"Dragonflight",
					new ScriptableObject[] { createPoint(-3, 7),
							createPoint(-3, 8.5), createPoint(-1.5, 8.5),
							createPoint(-1.5, 7) });

			// Drake Warriors
			disks.put(
					"Drake Warriors",
					new ScriptableObject[] { createPoint(0, 7),
							createPoint(0, 8.5), createPoint(1.5, 8.5), });

			// Dragonling
			disks.put("Dragonling", new ScriptableObject[] {
					createPoint(1.5, 7), createPoint(3, 7),
					createPoint(3, 8.5), });

			final String knights = "Starter Knights";
			final String elves = "Starter Elf";
			final String dwarfs = "Starter Dwarf";
			final String dragons = "Starter Dragons";
			final String orcs = "Starter Orc";

			for (final Entry<String, ScriptableObject[]> entry : disks
					.entrySet()) {
				final ScriptableObject disk = getDisk(entry.getKey());
				if (disk.get("name") != null) {

					for (final ScriptableObject location : entry.getValue()) {

						// addDisk
						Object diskNumber = addDiskToPlayer(player, disk,
								location);

						// knight disk
						if (disk.get("faction").equals("Knight")) {
							addDiskToArmy(player, knights, diskNumber, location);
						}
						// dragon disk
						else if (disk.get("faction").equals("Dragon")) {
							addDiskToArmy(player, dragons, diskNumber, location);
						}
						// dwarf disk
						else if (disk.get("faction").equals("Dwarf")) {
							addDiskToArmy(player, dwarfs, diskNumber, location);
						}

						// elf disk
						else if (disk.get("faction").equals("Elf")) {
							addDiskToArmy(player, elves, diskNumber, location);
						}

						// orc disk
						else if (disk.get("faction").equals("Orc")) {
							addDiskToArmy(player, orcs, diskNumber, location);
						}
					}
				}
			}

			savePlayer(player);
			return player;
		} finally {
			step.close();
		}
	}

	static void addDiskToArmy(ScriptableObject player, String armyName,
			Object diskNumber, ScriptableObject location)
			throws GameEngineException {
		ge.invoke(player, "addDiskToArmy", new Object[] { armyName, diskNumber,
				location });
	}

	static Object diskIsInArmy(ScriptableObject player, String armyName,
			Object diskNumber) throws GameEngineException {
		return ge.invoke(player, "diskIsInArmy", new Object[] { diskNumber,
				armyName });
	}

	static Object getDiskNumber(ScriptableObject player, String diskName,
			Object startingIndex) throws GameEngineException {
		return ge.invoke(player, "getDiskNumber", new Object[] { diskName,
				startingIndex });
	}

	private static ScriptableObject createPoint(final double x, final double d)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.createPoint");
		try {
			return (ScriptableObject) ge.invoke("Point", new Object[] { x, d });
		} finally {
			step.close();
		}
	}

	private static ScriptableObject createTable() throws GameEngineException {
		Step step = MiniProfiler.step("API.createTable");
		try {
			final ScriptableObject table = (ScriptableObject) ge
					.invoke("Table");

			return table;
		} finally {
			step.close();
		}
	}

	protected static ScriptableObject createTable(final String maxPlayers,
			final String maxPoints, final String activations,
			final String startingDisks, final String reinforcements,
			final String alignmentRestriction, final String scenario)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.createTable(...)");
		try {
			final ScriptableObject table = (ScriptableObject) ge.invoke(
					"Table", new String[] { maxPlayers, maxPoints, activations,
							startingDisks, reinforcements,
							alignmentRestriction, scenario, });
			ge.invoke(table, "placeStagingDisks", new String[] {});
			return table;
		} finally {
			step.close();
		}
	}

	private static void downloadDisks(final HttpServletResponse response)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.downloadDisks");
		try {
			// ..... then respond
			response.setHeader("Content-disposition",
					"attachment;filename=disks.zip");

			response.setContentType("application/zip");
			response.setStatus(HttpServletResponse.SC_OK);

			// note : intentionally no content-length set, automatic chunked
			// transfer if stream is larger than the internal buffer of the
			// response

			try {
				ZipOutputStream zipOut = new ZipOutputStream(
						response.getOutputStream());

				// PrintWriter zipWriter = new PrintWriter(zipOut);

				try {

					ZipEntry ze = new ZipEntry("disks.csv");
					zipOut.putNextEntry(ze);

					StringBuilder createCsv = createDiskCsv();
					// zipWriter.write(createCsv.toString());
					zipOut.write(createCsv.toString().getBytes());

					zipOut.closeEntry();

					// zipAllDiskImages(zipOut);

				} finally {
					zipOut.close();
				}
			} catch (IOException e) {
				e.printStackTrace();
			}
		} finally {
			step.close();
		}
	}

	protected void endActivations(final ScriptableObject table,
			final String user) throws GameEngineException {
		Step step = MiniProfiler.step("API.endActivations");
		try {
			ge.invoke(table, "endActivations", new Object[] { user });
			saveTable(table);

			// see if someone won
			if (((ScriptableObject) table.get("memento")).get("segment") == "FINISHED") {
				updateRatings(table);
			}
		} finally {
			step.close();
		}
	}

	protected void endReinforcements(ScriptableObject table, String userName)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.endReinforcements");
		try {
			ge.invoke(table, "endReinforcements", new Object[] { userName });
			saveTable(table);
		} finally {
			step.close();
		}
	}

	private String getActiveTables() {
		Step step = MiniProfiler.step("API.getActiveTables");
		try {
			Filter segmentFilter = new FilterPredicate("segment",
					FilterOperator.IN, ACTIVE_SEGMENTS);

			Query q = new Query("Table").setFilter(segmentFilter);
			DatastoreService datastore = DatastoreServiceFactory
					.getDatastoreService();

			PreparedQuery pq = datastore.prepare(q);

			StringBuilder sb = tablesToJSON(pq);
			return sb.toString();
		} finally {
			step.close();
		}
	}

	static ScriptableObject getDisk(final String name)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.getDisk");
		try {
			final ScriptableObject disk = (ScriptableObject) ge.invoke("Disk");

			final HashMap<String, Object> hashMap = ge.persistence.get("Disk",
					name);
			final String text = (String) hashMap.get("json");
			if (text != null) {
				final String json = text;

				ge.invoke(disk, "update", new Object[] { ge.parse(json) });
			}
			return disk;
		} finally {
			step.close();
		}
	}

	static private List<Entity> getLeaderboard() {
		Step step = MiniProfiler.step("API.getLeaderboard");
		try {
			final Query query = new Query("Player");

			query.addSort("rating", SortDirection.DESCENDING);

			final DatastoreService datastore = DatastoreServiceFactory
					.getDatastoreService();
			final PreparedQuery pq = datastore.prepare(query);
			final List<Entity> entList = pq.asList(FetchOptions.Builder
					.withDefaults());
			return entList;
		} finally {
			step.close();
		}
	}

	private Long getMementoId(final Map<String, Object> parameters) {
		Step step = MiniProfiler.step("API.getOpenAndActiveTables");
		try {
			Object parameter = API.getParameter("mementoId", parameters);
			Long mementoId = -1L;

			if (parameter != null) {
				mementoId = Long.parseLong((String) parameter);
				;
			}
			return mementoId;
		} finally {
			step.close();
		}
	}

	private static PreparedQuery getMementos(final Long tableId,
			final long mementoId) {
		// TODO 0.1 need to try to go to memcache for this first somehow
		Step step = MiniProfiler.step("API.getMementos(" + tableId + ","
				+ mementoId + ")");
		try {

			Filter tableIdFilter = new FilterPredicate("tableId",
					FilterOperator.EQUAL, tableId);

			Filter mementoIdFilter = new FilterPredicate("mementoId",
					FilterOperator.GREATER_THAN, mementoId);

			Filter tableIdAndMementoIdFilter = new CompositeFilter(
					CompositeFilterOperator.AND, Arrays.asList(tableIdFilter,
							mementoIdFilter));

			Query q = new Query("TableMemento")
					.setFilter(tableIdAndMementoIdFilter);
			DatastoreService datastore = DatastoreServiceFactory
					.getDatastoreService();

			PreparedQuery pq = datastore.prepare(q);
			return pq;
		} finally {
			step.close();
		}
	}

	private static String getName(final ScriptableObject object)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.getName");
		try {
			final Object sd = ge.invoke(object, "getName");

			if (sd == null
					|| sd.getClass() == org.mozilla.javascript.Undefined.class)
				return null;
			else if (sd.getClass() == String.class)
				return (String) sd;

			else {
				return null;
			}
		} finally {
			step.close();
		}
	}

	private String getOpenAndActiveTables(String playerName) {
		Step step = MiniProfiler.step("API.getOpenAndActiveTables");
		try {
			Filter playerFilter = new FilterPredicate("players",
					FilterOperator.EQUAL, playerName);

			Filter activeSegmentFilter = new FilterPredicate("segment",
					FilterOperator.IN, ACTIVE_SEGMENTS);

			Filter openSegmentFilter = new FilterPredicate("segment",
					FilterOperator.IN, OPEN_SEGMENTS);

			Filter segmentFilter = new CompositeFilter(
					CompositeFilterOperator.OR, Arrays.asList(
							activeSegmentFilter, openSegmentFilter));

			Filter segmentAndPlayerFilter = new CompositeFilter(
					CompositeFilterOperator.AND, Arrays.asList(playerFilter,
							segmentFilter));

			Query q = new Query("Table").setFilter(segmentAndPlayerFilter);
			DatastoreService datastore = DatastoreServiceFactory
					.getDatastoreService();

			PreparedQuery pq = datastore.prepare(q);

			StringBuilder sb = tablesToJSON(pq);

			return sb.toString();
		} finally {
			step.close();
		}
	}

	private static String getOpenTables() {
		Step step = MiniProfiler.step("API.getOpenTables");
		try {
			Filter segmentFilter = new FilterPredicate("segment",
					FilterOperator.IN, OPEN_SEGMENTS);

			Query q = new Query("Table").setFilter(segmentFilter);
			DatastoreService datastore = DatastoreServiceFactory
					.getDatastoreService();

			PreparedQuery pq = datastore.prepare(q);

			StringBuilder sb = tablesToJSON(pq);
			return sb.toString();
		} finally {
			step.close();
		}
	}

	static ScriptableObject getPlayer(final String username)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.getPlayer");
		try {
			ScriptableObject player = null;
			if (username != null && !username.equals("")) {
				final HashMap<String, Object> hashMap = ge.persistence.get(
						"Player", username);
				// handle player being null
				if (!hashMap.isEmpty()) {
					player = (ScriptableObject) ge.invoke("Player",
							new String[] { username });
					final String json = (String) hashMap.get("json");
					update(player, ge.parse(json));
				}
			}
			return player;
		} finally {
			step.close();
		}
	}

	/**
	 * 
	 * @param tableId
	 * @return Table.js object with additional property named json
	 * @throws GameEngineException
	 */
	private static ScriptableObject getTable(final long tableId,
			final long mementoId) throws GameEngineException {
		Step step = MiniProfiler.step("API.getTable");
		try {
			final HashMap<String, Object> hashMap = ge.persistence.get("Table",
					tableId);

			final ScriptableObject table = createTable();

			String json = (String) hashMap.get("json");
			// convert the json string to an object
			Object jsonObject = ge.parse(json);
			restoreTable(table, jsonObject);

			Integer currentMementoId = (Integer) table.get("mementoId");
			if (currentMementoId == null) {
				currentMementoId = -1;
			}

			// if mementoId is greater then the tables mementoId
			if (mementoId < currentMementoId) {
				// get the mementos that are greater then mementoId
				PreparedQuery mementos = getMementos(tableId, mementoId);
				addMementos(table, mementos);
				// redo the json attribute
				json = stringify(table);
				// ScriptableObject.putProperty(table, "json", json2);
			}
			table.put("json", table, json);

			return table;
		} finally {
			step.close();
		}
	}

	// this one takes a ScriptableObject of disk objects
	static protected ScriptableObject join(final ScriptableObject table,
			final ScriptableObject player, final String armyName)
			throws GameEngineException {
		Step step = MiniProfiler
				.step("API.join(ScriptableObject,ScriptableObject,ScriptableObject)");

		try {

			// Table.join returns an object that indicates success or failure
			// and failure messages
			ScriptableObject joinResult = (ScriptableObject) ge.invoke(table,
					"join", new Object[] { player, armyName });

			// don't save armies and disks
			ScriptableObject.deleteProperty(player, "armies");
			ScriptableObject.deleteProperty(player, "cart");
			ScriptableObject.deleteProperty(player, "disks");
			ScriptableObject.deleteProperty(player, "diskLocations");

			saveTable(table);

			// return joinResult
			return joinResult;
		} finally {
			step.close();
		}
	}

	private static void fireMissiles(final ScriptableObject table,
			final String playerName, final String diskNumber,
			final String pointString, final String missileName)
			throws GameEngineException {

		Step step = MiniProfiler.step("API.fireMissiles");
		try {
			final ScriptableObject point = ge.execute("_=" + pointString);

			ScriptableObject missile = getDisk(missileName);

			ge.invoke(table, "fireMissiles", new Object[] { playerName,
					diskNumber, point, missile });
			saveTable(table);

		} catch (GameEngineException gee) {
			// GameEngineException
			mailUnitTest(createUnitTest(table));
			gee.printStackTrace();
			throw gee;
		} finally {
			step.close();
		}

	}

	/**
	 * @param table
	 * @param playerName
	 * @param diskNumber
	 * @param pointString
	 * @return
	 * @throws GameEngineException
	 */
	protected boolean move(final ScriptableObject table,
			final String playerName, final String diskNumber,
			final String pointString) throws GameEngineException {

		Step step = MiniProfiler.step("API.move");
		try {
			// MOVE_DISK
			final ScriptableObject point = ge.execute("_=" + pointString);

			final Object moveResult = ge.invoke(table, "move", new Object[] {
					playerName, diskNumber, point });
			saveTable(table);

			// see if someone won
			if (((ScriptableObject) table.get("memento")).get("segment") == "FINISHED") {
				updateRatings(table);
			}

			if (!moveResult.equals(true)) {
				API.log.info("move error:" + moveResult.toString());
			}
			return (Boolean) moveResult;
		} catch (GameEngineException gee) {
			// GameEngineException
			mailUnitTest(createUnitTest(table));
			gee.printStackTrace();
			throw gee;
		} finally {
			step.close();
		}
	}

	protected String process(final Map<String, Object> parameters,
			final String userName, final HttpServletResponse response)
			throws APIException, GameEngineException {

		Step step = MiniProfiler.step("API.process");
		try {

			final String[] strings = (String[]) parameters.get("action");
			Action action = Action.GET_TABLE;
			if (strings != null && strings.length > 0) {
				final String string = strings[0];
				action = Action.valueOf(string);
			}
			StringBuilder json = new StringBuilder();

			json.append("{ ");
			json.append("\"user\":\"")
					.append((userName != null ? userName : "")).append("\",");
			json.append("\"appInfo\":{ ");
			json.append("\"applicationVersion\":\"").append(
					API.applicationVersion + "\",");
			json.append("\"uploadDate\":\"").append(API.uploadDate)
					.append("\"");
			json.append("},");

			switch (action) {
			case GET_TABLE: {

				final Long tableId = getTableId(parameters);

				Long mementoId = getMementoId(parameters);

				json.append("\"table\":");

				if (tableId != null) {
					ScriptableObject table = null;
					try {
						table = getTable(tableId, mementoId);
						// final ScriptableObject excludedKeys =
						// ge.execute("[\"actions\"]");
						// make sure any mementos we looked up and added
						// get sent too
						json.append(table.get("json"));
						// json.append(stringify(table, excludedKeys));
					} catch (GameEngineException gee) {
						json.append("{}");
						// GameEngineException
						mailUnitTest(createUnitTest(table));
						throw gee;
					}
				} else {
					json.append("{}");
				}

				final ScriptableObject player = getPlayer(userName);

				if (player != null) {
					json.append(",\"player\":");
					json.append(stringify(player));
				}

				break;
			}
			case JOIN_TABLE: {
				// JOIN_TABLE
				final Long tableId = getTableId(parameters);
				final String armyName = (String) API.getParameter("army",
						parameters);
				if (userName == null || userName == "") {

					try {
						response.sendRedirect("/login.html?return_to=thediskgame%252Fapi%253Faction%253DJOIN_TABLE%2526id%253D"
								+ tableId + "%2526army%253D" + armyName);
						return null;
					} catch (IOException e1) {
						e1.printStackTrace();
					}

				}
				ScriptableObject table = null;
				try {
					// make sure the player is allowed to join another table
					String tablesStringJson = getOpenAndActiveTables(userName);
					NativeArray tables = (NativeArray) ge
							.execute(tablesStringJson);
					if (tables.size() >= MAX_TABLES) {
						// tell the player they are not allowed to join another
						// table
						json.append("\"messages\":[\"You are already in "
								+ MAX_TABLES + " active tables.\"],");
					} else {
						ScriptableObject player = getPlayer(userName);
						final Long mementoId = getMementoId(parameters);
						table = getTable(tableId, mementoId);

						ScriptableObject joinResult = join(table, player,
								armyName);

						if (!(Boolean) joinResult.get("success")) {
							// TODO give joinResult to the user
						}

					}
				} catch (GameEngineException gee) {
					// GameEngineException
					mailUnitTest(createUnitTest(table));
					throw gee;
				}
				//
				json.append("\"id\":");
				json.append(tableId);
			}
				break;

			case CREATE_TABLE: {
				if (userName != null && !userName.equals("")) {

					ScriptableObject player = getPlayer(userName);
					final String maxPlayers = (String) getParameter(
							"maxPlayers", parameters);
					final String armyName = (String) getParameter("armyName",
							parameters);
					final String activations = (String) getParameter(
							"activations", parameters);
					final String startingDisks = (String) getParameter(
							"startingDisks", parameters);
					final String reinforcements = (String) getParameter(
							"reinforcements", parameters);
					final String alignmentRestriction = (String) getParameter(
							"alignmentRestriction", parameters);
					final String maxPoints = (String) getParameter("maxPoints",
							parameters);
					final String scenario = (String) getParameter("scenario",
							parameters);

					ScriptableObject table = null;
					try {
						// make sure the player is allowed to create a new table
						String tablesStringJson = getOpenAndActiveTables(userName);
						NativeArray tables = (NativeArray) ge
								.execute(tablesStringJson);
						if (tables.size() >= 4) {
							// tell the player they are not allowed to create
							// more
							// tables

							json.append("\"messages\":[\"You are already in 4 active tables.\"]");

						} else {
							table = createTable(maxPlayers, maxPoints,
									activations, startingDisks, reinforcements,
									alignmentRestriction, scenario);

							ScriptableObject joinResult = join(table, player,
									armyName);

							Object success = joinResult.get("success");
							if ((Boolean) success) {

								final Long tableId = getId(table);

								json.append("\"id\":");
								json.append(tableId);
							} else {
								json.append(",\"messages\":[");
								// give joinResult to the user
								NativeArray messages = (NativeArray) joinResult
										.get("messages");
								for (Object message : messages) {
									json.append("\"" + message + "\",");
								}
								json.append("]");
							}
						}

					} catch (GameEngineException gee) {
						// GameEngineException
						mailUnitTest(createUnitTest(table));
						throw gee;
					}

				}
			}
				break;
			case GET_ALL_TABLES: {
				json.append("\"openTables\":");

				// only get open tables
				String fd = getOpenTables();
				json.append(fd);

				json.append(",\"activeTables\":");

				// only get open tables
				fd = getActiveTables();
				json.append(fd);

				final ScriptableObject player = getPlayer(userName);

				if (player != null) {
					json.append(",\"player\":");
					json.append(stringify(player));
				}
			}
				break;
			case CREATE_DISK: {

				final String name = (String) getParameter("name", parameters);

				if (name == null || name.equals("")) {
					break;
				}

				final String type = (String) getParameter("type", parameters);

				final Integer attack = Integer.parseInt((String) getParameter(
						"attack", parameters));
				final Integer defense = Integer.parseInt((String) getParameter(
						"defense", parameters));
				final Integer toughness = Integer
						.parseInt((String) getParameter("toughness", parameters));
				final Integer movement = Integer
						.parseInt((String) getParameter("movement", parameters));
				final Integer wounds = Integer.parseInt((String) getParameter(
						"wounds", parameters));
				final Boolean flying = getParameter("flying", parameters) == null ? false
						: Boolean.parseBoolean((String) getParameter("flying",
								parameters));
				final Boolean swashbuckler = getParameter("swashbuckler",
						parameters) == null ? false : Boolean
						.parseBoolean((String) getParameter("swashbuckler",
								parameters));
				final Boolean archer = getParameter("archer", parameters) == null ? false
						: Boolean.parseBoolean((String) getParameter("archer",
								parameters));

				final Integer arrows = getParameter("arrows", parameters) == null ? 0
						: Integer.parseInt((String) getParameter("arrows",
								parameters));

				final Integer bolts = getParameter("bolts", parameters) == null ? 0
						: Integer.parseInt((String) getParameter("bolts",
								parameters));

				final Integer fireballs = getParameter("fireballs", parameters) == null ? 0
						: Integer.parseInt((String) getParameter("fireballs",
								parameters));

				final Integer boulders = getParameter("boulders", parameters) == null ? 0
						: Integer.parseInt((String) getParameter("boulders",
								parameters));

				final Integer spellcaster = Integer
						.parseInt((String) getParameter("spellcaster",
								parameters));

				final Integer limit = Integer.parseInt((String) getParameter(
						"limit", parameters));

				String parameter = (String) getParameter("missileImmunity",
						parameters);
				final Boolean missileImmunity = getParameter("missileImmunity",
						parameters) == null ? false : Boolean
						.parseBoolean(parameter);

				final Boolean firstblow = getParameter("firstblow", parameters) == null ? false
						: Boolean.parseBoolean((String) getParameter(
								"firstblow", parameters));

				final Integer cost = Integer.parseInt((String) getParameter(
						"cost", parameters));
				final String faction = (String) getParameter("faction",
						parameters);
				final String alignment = (String) getParameter("alignment",
						parameters);
				final String diameter = (String) getParameter("diameter",
						parameters);
				final String description = (String) getParameter("description",
						parameters);
				final String price = (String) getParameter("price", parameters);

				// name, attack, defense, toughness, movement, wounds, flying,
				// swashbuckler, archer, arrows, bolts, fireballs, boulders,
				// missileImmunity, firstblow, spellcaster, cost, faction,
				// alignment, diameter, description, price
				try {
					createDisk(name, type, attack, defense, toughness,
							movement, wounds, flying, swashbuckler, archer,
							arrows, bolts, fireballs, boulders,
							missileImmunity, firstblow, spellcaster, limit,
							cost, faction, alignment, diameter, description,
							price);

					// redirect to a better place
					response.sendRedirect("/thediskgame/disk#!" + name);
				} catch (GameEngineException gee) {
					// GameEngineException CREATE_DISK
					throw new APIException(gee);
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
				break;
			case LOG_IN: {
				try {
					final ScriptableObject player = getPlayer(userName);
					if (player == null) {
						createPlayer(userName);
					}
					response.sendRedirect("/thediskgame/profile");
					return null;
				} catch (GameEngineException gee) {
					throw new APIException(gee);
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
				break;
			case PROFILE: {

				try {
					final ScriptableObject player = getPlayer(userName);

					if (player != null) {
						json.append("\"player\":");
						String f = getOpenAndActiveTables(userName);

						NativeArray na = (NativeArray) ge.execute(f);
						player.put("activeTables", player, na);

						json.append(stringify(player));
						json.append(",");
					}
					json.replace(json.length() - 1, json.length(), "");

				} catch (GameEngineException gee) {
					// GameEngineException GET_MY_DISKS
					throw new APIException(gee);
				}
				break;
			}

			case SAVE_ARMY: {
				// SAVE_ARMY
				final ScriptableObject player = getPlayer(userName);

				if (player != null) {

					final String armyName = (String) getParameter("armyName",
							parameters);

					final String disks = (String) getParameter("disks",
							parameters);

					ge.invoke(player, "saveArmy",
							new Object[] { armyName, ge.execute(disks) });

					savePlayer(player);

					json.append("\"player\":");
					json.append(player.get("json"));
					json.append(",");

				}
				json.replace(json.length() - 1, json.length(), "");
				break;
			}

			case DELETE_ARMY: {
				final ScriptableObject player = getPlayer(userName);

				if (player != null) {

					final String armyName = (String) getParameter("armyName",
							parameters);

					ge.invoke(player, "deleteArmy", new Object[] { armyName });

					savePlayer(player);

					json.append("\"player\":");
					json.append(player.get("json"));
					json.append(",");

				}
				json.replace(json.length() - 1, json.length(), "");
				break;
			}

			case SAVE_REINFORCEMENT: {
				ScriptableObject table = null;
				try {
					Long mementoId = getMementoId(parameters);
					table = getTable(getTableId(parameters), mementoId);
					final String pointString = (String) getParameter("point",
							parameters);
					final String diskNumber = (String) getParameter(
							"diskNumber", parameters);

					saveReinforcement(table, userName, diskNumber, pointString);

					json.append("\"table\":");
					// final ScriptableObject excludedKeys = ge
					// .execute("[\"actions\"]");
					json.append(table.get("json"));
				} catch (GameEngineException gee) {
					// GameEngineException
					mailUnitTest(createUnitTest(table));
					throw gee;
				}
			}
				break;

			case END_REINFORCEMENTS: {
				ScriptableObject table = null;
				try {
					final Long mementoId = getMementoId(parameters);
					table = getTable(getTableId(parameters), mementoId);
					endReinforcements(table, userName);

					json.append("\"table\":");
					json.append(table.get("json"));
				} catch (GameEngineException gee) {
					// GameEngineException
					mailUnitTest(createUnitTest(table));
					throw gee;
				}

				break;
			}

			case END_MISSILES: {
				ScriptableObject table = null;
				try {
					final Long mementoId = getMementoId(parameters);
					table = getTable(getTableId(parameters), mementoId);
					endMissiles(table, userName);

					json.append("\"table\":");
					json.append(table.get("json"));
				} catch (GameEngineException gee) {
					// GameEngineException
					mailUnitTest(createUnitTest(table));
					throw gee;
				}

				break;
			}

			case FIRE_MISSILES: {
				// FIRE_MISSILES
				ScriptableObject table = null;
				try {
					final Long mementoId = getMementoId(parameters);
					table = getTable(getTableId(parameters), mementoId);

					final String diskNumber = (String) getParameter(
							"diskNumber", parameters);

					final String point = (String) getParameter("point",
							parameters);

					final String missileName = (String) getParameter("missile",
							parameters);

					fireMissiles(table, userName, diskNumber, point,
							missileName);

					json.append("\"table\":");
					json.append(table.get("json"));
				} catch (GameEngineException gee) {
					// GameEngineException
					mailUnitTest(createUnitTest(table));
					throw gee;
				}

				break;
			}

			case MOVE_DISK: {
				final String diskNumber = (String) getParameter("diskNumber",
						parameters);
				final Long mementoId = getMementoId(parameters);
				final ScriptableObject table = getTable(getTableId(parameters),
						mementoId);
				// "diskNumber" : movedDiskNumber,

				// "point" : tableClickPoint
				final String point = (String) getParameter("point", parameters);

				move(table, userName, diskNumber, point);

				json.append("\"table\":");
				// final ScriptableObject excludedKeys = ge
				// .execute("[\"actions\"]");
				// json.append(stringify(table, excludedKeys));
				json.append(table.get("json"));
			}
				break;

			case JWT: {
				try {
					final ScriptableObject player = getPlayer(userName);
					if (player == null) {
						json.append("\"jwt\":\"" + "\"");
						break;
					}

					final String s = saveCart(
							(String) getParameter("disks", parameters), player);
					json.append("\"jwt\":\"" + s + "\"");

				} catch (GameEngineException gee) {
					// GameEngineException JWT
					throw new APIException(gee);
				} catch (InvalidKeyException e) {
					e.printStackTrace();
				} catch (SignatureException e) {
					e.printStackTrace();
				}
			}
				break;
			case CONFIRM: {
				final String jwt = (String) getParameter("jwt", parameters);
				try {
					return confirm(jwt, userName);
				} catch (GameEngineException gee) {
					// GameEngineException CONFIRM
					throw new APIException(gee);
				}
			}
			case GET_ALL_DISKS: {
				json.append("\"disks\":{");

				final HashMap<Object, HashMap<String, Object>> disks = ge.persistence
						.getAll("Disk");

				for (HashMap<String, Object> disk : disks.values()) {
					final String diskJson = (String) disk.get("json");
					final Object diskName = disk.get("name");
					json.append("\"" + diskName + "\":" + diskJson + ",");
				}
				if (disks.size() > 0) {
					// json = json.substring(0, json.length() - 1);
					json.replace(json.length() - 1, json.length(), "");
				}
				json.append("},");

				json.append("\"player\":");
				try {
					final ScriptableObject player = getPlayer(userName);
					json.append(stringify(player));
				} catch (GameEngineException gee) {
					json.append("{}");
					// GameEngineException GET_ALL_DISKS
					throw new APIException(gee);
				}
			}
				break;
			case GET_DISK: {
				final String diskName = (String) getParameter("diskName",
						parameters);

				json.append("\"disk\":");

				final HashMap<String, Object> disk = ge.persistence.get("Disk",
						diskName);
				if (disk != null && disk.get("json") != null) {
					final String text = (String) disk.get("json");
					json.append(text);
				} else {
					json.append("{}");
				}

			}
				break;
			case ACTIVATE_DISK: {
				ScriptableObject table = null;
				try {
					final Long mementoId = getMementoId(parameters);
					table = getTable(getTableId(parameters), mementoId);
					// "diskNumber" : movedDiskNumber,
					final String diskNumber = (String) getParameter(
							"diskNumber", parameters);

					activateDisk(table, diskNumber, userName);

					json.append("\"table\":");
					json.append(table.get("json"));
				} catch (GameEngineException gee) {
					// GameEngineException
					mailUnitTest(createUnitTest(table));
					throw gee;
				}
			}
				break;
			case END_ACTIVATIONS: {
				ScriptableObject table = null;
				try {
					final Long mementoId = getMementoId(parameters);
					table = getTable(getTableId(parameters), mementoId);
					endActivations(table, userName);

					json.append("\"table\":");
					json.append(table.get("json"));
				} catch (GameEngineException gee) {
					// GameEngineException
					mailUnitTest(createUnitTest(table));
					throw gee;
				}
			}
				break;

			case UPLOAD_DISKS: {
				uploadDisks((BlobKey) parameters.get("csv"));
				try {
					response.sendRedirect("/thediskgame/disk");
					return "";
				} catch (IOException e) {
					e.printStackTrace();
				}
				return "";
			}
			case DOWNLOAD_DISKS: {
				downloadDisks(response);
				return "";
			}
			case UNIT_TEST:
			// get the unit test code
			{
				ScriptableObject table = null;
				try {
					final Long mementoId = getMementoId(parameters);
					table = getTable(getTableId(parameters), mementoId);
					return createUnitTest(table);

				} catch (GameEngineException gee) {
					// GameEngineException
					mailUnitTest(createUnitTest(table));
					throw gee;
				}
			}
			case SET_ATTACKEE:
			//
			{
				final Long mementoId = getMementoId(parameters);
				final ScriptableObject table = getTable(getTableId(parameters),
						mementoId);
				final String attacker = (String) getParameter("attacker",
						parameters);
				final String attackee = (String) getParameter("attackee",
						parameters);

				setAttackee(table, userName, attacker, attackee);

				json.append("\"table\":");
				json.append(table.get("json"));
			}
				break;
			case SET_DEFENDEE:
			//
			{
				final Long mementoId = getMementoId(parameters);
				final ScriptableObject table = getTable(getTableId(parameters),
						mementoId);
				final String defender = (String) getParameter("defender",
						parameters);
				final String defendee = (String) getParameter("defendee",
						parameters);

				setDefendee(table, userName, defender, defendee);

				json.append("\"table\":");
				json.append(table.get("json"));
			}
				break;
			case LEADERBOARD: {

				json.append("\"players\":[");

				List<Entity> leaderboard = getLeaderboard();

				for (Entity player : leaderboard) {
					// final Text object = (Text) player.getProperty("json");
					// final String ad = object.getValue();
					json.append("{\"playerName\":\"");
					json.append(player.getKey().getName());
					json.append("\",\"rating\":");
					json.append(player.getProperty("rating"));
					json.append("},");
				}
				if (leaderboard.size() > 0) {
					// json = json.substring(0, json.length() - 1);
					json.replace(json.length() - 1, json.length(), "");
				}
				json.append("]");
			}
				break;
			case CREATE_MISSION:
				// TODO create mission
				createMission(parameters);

				try {
					response.sendRedirect("/thediskgame/missionEditer#!"
							+ parameters.get("campaign") + ":"
							+ parameters.get("mission"));
				} catch (IOException e) {
 					e.printStackTrace();
				}
				break;
			default:
				break;

			}
			json.append("}");

			return json.toString();
		} finally {
			step.close();
		}
	}

	private static void createMission(Map<String, Object> parameters) {
		// TODO Auto-generated method stub
		// campaign name
		// mission name
		// scenario
		// control1
		// amyname1
		// armypoints1

		// control2
		// amyname2
		// armypoints2
	}

	private static void endMissiles(ScriptableObject table, String userName)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.endMissiles");
		try {
			ge.invoke(table, "endMissiles", new Object[] { userName });
			saveTable(table);
		} finally {
			step.close();
		}
	}

	private static Object restoreTable(final ScriptableObject object,
			final Object jsonObject) throws GameEngineException {
		Step step = MiniProfiler.step("API.updateTable");
		try {
			return ge.invoke(object, "restore", new Object[] { jsonObject });
		} finally {
			step.close();
		}
	}

	private static ScriptableObject saveByName(final String clazz,
			final ScriptableObject object) throws GameEngineException {
		Step step = MiniProfiler.step("API.saveByName");
		try {
			String name = getName(object);
			Entity result;
			if (name == null) {
				result = ge.persistence.save(clazz);
				name = result.getKey().getName();
				setName(object, result.getKey().getName());
			}
			final String json = stringify(object);
			result = ge.persistence.save(clazz, name, "json", json);
			return object;
		} finally {
			step.close();
		}
	}

	private String saveCart(final String disksString,
			final ScriptableObject player) throws InvalidKeyException,
			SignatureException, GameEngineException {

		Step step = MiniProfiler.step("API.saveByName");
		try {

			// ScriptableObject player = API.getPlayer(user);
			if (player == null) {
				return "no logged in user";
			}

			final ScriptableObject disks = ge.execute("_=" + disksString);
			float totalPrice = 0.00f;
			final StringBuilder description = new StringBuilder();
			final float rate = 0.09f;
			for (final Object diskName : disks.getIds()) {

				API.log.info((String) diskName);
				ScriptableObject disk = getDisk((String) diskName);
				// ScriptableObject info = (ScriptableObject)
				// disks.get(diskName);
				// 1.0 Double
				// 4 Integer
				final Object oCount = disks.get(diskName);
				// Object oCount = info.get("count");
				final int count = getInteger(oCount);

				final Object oPrice = disk.get("price");

				if (oPrice == null) {
					API.log.info((String) diskName + ".price is null.");
				}

				final Float diskPrice;
				if (((String) oPrice).equals("")) {
					final Object oCost = disk.get("cost");
					final float cost = Float.parseFloat((String) oCost);
					diskPrice = (cost * rate);
				} else {
					diskPrice = Float.parseFloat((String) oPrice);
				}
				totalPrice += count * diskPrice;
				description.append(diskName).append(" x").append(count);
			}

			// save the cart
			ge.invoke(player, "saveCart", new Object[] { disks });

			// API.savePlayer(player);

			if (player.get("name").equals("antony.trupe@gmail.com")) {
				totalPrice = 0.00f;
			}

			if (totalPrice == 0.00f) {
				// finish processing the order
				completePurchase(player);
				savePlayer(player);
				return "";
			}

			savePlayer(player);

			final JsonToken token = createToken(disksString,
					(String) player.get("name"), totalPrice,
					description.toString());
			return token.serializeAndSign();
		} finally {
			step.close();
		}
	}

	private static ScriptableObject saveDisk(final ScriptableObject disk)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.saveDisk");
		try {
			return saveByName("Disk", disk);
		} finally {
			step.close();
		}
	}

	private static void saveMementos(final ScriptableObject table)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.saveMementos");
		try {
			// save the mementos elsewhere
			ScriptableObject mementos = (ScriptableObject) table
					.get("mementos");

			for (Object mementoId : mementos.getIds()) {
				ScriptableObject memento = (ScriptableObject) mementos
						.get(mementoId);
				HashMap<String, Object> mementoProperties = new HashMap<String, Object>();
				// stringify the memento
				String mementoJson = ge.stringify(memento);

				mementoProperties.put("json", mementoJson);
				Long tableId = getId(table);
				mementoProperties.put("tableId", tableId);
				mementoProperties.put("mementoId", mementoId);

				// make the memento a child of the table
				ge.persistence.save(
						"Table",
						tableId,
						"TableMemento",
						(mementoId.getClass() == String.class ? Long
								.parseLong((String) mementoId) : Long
								.valueOf((Integer) mementoId)),
						mementoProperties);
			}
		} finally {
			step.close();
		}
	}

	private static ScriptableObject savePlayer(final ScriptableObject player)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.savePlayer");
		try {

			HashMap<String, Object> properties = new HashMap<String, Object>();

			String json = stringify(player);

			properties.put("json", json);
			// save rating in its own field
			properties.put("rating", player.get("rating"));
			ge.persistence.save("Player", (String) player.get("name"),
					properties);
			// add json to player
			player.put("json", player, json);

			return player;
		} finally {
			step.close();
		}
	}

	// [{"name":"King Falladir","location":{"x":8,"y":5}},...]
	protected void saveReinforcement(final ScriptableObject table,
			final String user, final String diskNumber, final String pointString)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.saveReinforcements");
		try {

			final ScriptableObject point = ge.execute("_=" + pointString);

			ge.invoke(table, "saveReinforcement", new Object[] { user,
					diskNumber, point });

			saveTable(table);
		} finally {
			step.close();
		}
	}

	private static void saveTable(final ScriptableObject table)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.saveTable");
		try {
			Object id = table.get("id");

			if (id == null) {
				Entity result = ge.persistence.save("Table");
				// id = result.getKey().getId();
				setId(table, result.getKey().getId());
				id = result.getKey().getId();
			}

			saveMementos(table);

			ScriptableObject.deleteProperty(table, "mementos");
			// System.out.print("mementosRemoved:" + mementosRemoved);

			HashMap<String, Object> properties = new HashMap<String, Object>();

			// json
			String json = stringify(table, ge.execute("[\"json\"]"));
			properties.put("json", json);

			// players
			properties.put("players",
					((NativeArray) table.get("playerOrder")).toArray());

			// currentplayer
			properties.put("currentPlayer", ((ScriptableObject) table
					.get("memento")).get("currentPlayer"));

			// segment
			properties.put("segment",
					((ScriptableObject) table.get("memento")).get("segment"));

			properties.put("mementoId", table.get("mementoId"));

			ge.persistence.save("Table", getId(table), properties);
			table.put("json", table, json);
		} finally {
			step.close();
		}
	}

	private void setAttackee(final ScriptableObject table, final String user,
			final String attacker, final String attackee)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.setAttackee");
		try {
			ge.invoke(table, "setAttackee", new Object[] { user, attacker,
					attackee });
			saveTable(table);

			// see if someone won
			if (((ScriptableObject) table.get("memento")).get("segment") == "FINISHED") {
				updateRatings(table);
			}
		} finally {
			step.close();
		}
	}

	protected void setDefendee(final ScriptableObject table, final String user,
			final String defender, final String defendee)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.setDefendee");
		try {
			ge.invoke(table, "setDefendee", new Object[] { user, defender,
					defendee });

			saveTable(table);

			// see if someone won
			if (((ScriptableObject) table.get("memento")).get("segment") == "FINISHED") {
				updateRatings(table);
			}
		} finally {
			step.close();
		}
	}

	private static void setId(final ScriptableObject object, final long id)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.setId");
		try {
			ge.invoke(object, "setId", new Object[] { id });
		} finally {
			step.close();
		}
	}

	private static void setName(final ScriptableObject object, final String name)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.setName");
		try {
			ge.invoke(object, "setName", new Object[] { name });
		} finally {
			step.close();
		}
	}

	private static String stringify(final ScriptableObject object)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.stringify(ScriptableObject)");
		try {
			return ge.stringify(object);
		} finally {
			step.close();
		}
	}

	private static String stringify(final ScriptableObject object,
			ScriptableObject excludedKeys) throws GameEngineException {
		Step step = MiniProfiler
				.step("API.stringify(ScriptableObject,String[])");
		try {
			String json = null;
			if (object != null) {

				json = (String) ge.invoke(object, "stringify",
						new Object[] { excludedKeys });
			}
			return json;
		} finally {
			step.close();
		}
	}

	private static StringBuilder tablesToJSON(PreparedQuery pq) {
		Step step = MiniProfiler.step("API.tablesToJSON");
		try {
			StringBuilder sb = new StringBuilder("[");

			for (Entity result : pq.asIterable()) {
				String json = ((Text) result.getProperty("json")).getValue();

				sb.append(json);
				sb.append(",");

			}
			if (pq.countEntities(FetchOptions.Builder.withDefaults()) > 0) {
				sb.replace(sb.length() - 1, sb.length(), "");
			}
			sb.append("]");
			return sb;
		} finally {
			step.close();
		}
	}

	private static Object update(final ScriptableObject dest,
			final Object source) throws GameEngineException {
		Step step = MiniProfiler.step("API.update");
		try {
			return ge.invoke(dest, "update", new Object[] { source });
		} finally {
			step.close();
		}
	}

	protected static void updateRatings(ScriptableObject table)
			throws GameEngineException {
		Step step = MiniProfiler.step("API.updateRatings");
		try {
			// loop over all the players in the table
			ScriptableObject players = (ScriptableObject) table.get("players");

			List<Object> playerNames = Arrays.asList(players.getIds());
			for (Object playerName : playerNames) {
				ScriptableObject player = getPlayer((String) playerName);
				Double adjustment = (Double) ge.invoke(table,
						"getRatingAdjustment", new Object[] { playerName });

				Object object = player.get("rating");
				if (object == null || !(object instanceof Number)) {
					object = new Double(0);
				}
				Double rating = ((Number) object).doubleValue();
				rating += adjustment;

				ge.invoke(player, "setRating", new Object[] { rating });
				savePlayer(player);
			}
		} finally {
			step.close();
		}
	}

	private void uploadDisks(BlobKey zipBlobKey) throws GameEngineException {
		Step step = MiniProfiler.step("API.uploadDisks");
		try {

			if (zipBlobKey == null) {
				return;
			}

			final ZipInputStream zis;

			try {

				zis = getZipFile(zipBlobKey);

				ZipEntry ze;

				CSVParser p = new CSVParser();

				ze = zis.getNextEntry();
				while (ze != null) {

					ByteArrayOutputStream baos = new ByteArrayOutputStream();

					final byte[] b = new byte[2048];

					int size = 0;

					while ((size = zis.read(b, 0, b.length)) != -1) {
						baos.write(b, 0, size);
					}

					String[] parts = ze.getName().split("/");
					String fileName = parts[parts.length - 1];

					if (fileName.contains("disks.csv")) {

						final String csv = new String(baos.toByteArray());

						List<?> headers = null;
						boolean h = true;

						for (String line : csv.split("\n")) {

							line = line.trim();

							// first row
							if (h) {
								headers = Arrays.asList(p.parseLine(line));
								h = false;
							}

							// data
							else {
								final String[] diskData = p.parseLine(line);

								final int length = diskData.length;
								if (length <= 1) {
									break;
								}

								final String diskName = diskData[headers
										.indexOf("name")];

								final String type = diskData[headers
										.indexOf("type")];

								int attack = Integer.parseInt(diskData[headers
										.indexOf("attack")]);
								int defense = Integer.parseInt(diskData[headers
										.indexOf("defense")]);
								int toughness = Integer
										.parseInt(diskData[headers
												.indexOf("toughness")]);
								int movement = Integer
										.parseInt(diskData[headers
												.indexOf("movement")]);
								int wounds = Integer.parseInt(diskData[headers
										.indexOf("wounds")]);
								int indexOfFlying = headers.indexOf("flying");
								String s = diskData[indexOfFlying];
								boolean flying = Boolean.parseBoolean(s);
								boolean swashbuckler = headers
										.indexOf("swashbuckler") > -1
										&& !diskData[headers
												.indexOf("swashbuckler")]
												.equals("null") ? Boolean
										.parseBoolean(diskData[headers
												.indexOf("swashbuckler")])
										: false;
								boolean archer = headers.indexOf("archer") > -1
										&& !diskData[headers.indexOf("archer")]
												.equals("null") ? Boolean
										.parseBoolean(diskData[headers
												.indexOf("archer")]) : false;
								int arrows = headers.indexOf("arrows") > -1
										&& !diskData[headers.indexOf("arrows")]
												.equals("null") ? Integer
										.parseInt(diskData[headers
												.indexOf("arrows")]) : 0;
								int bolts = headers.indexOf("bolts") > -1
										&& !diskData[headers.indexOf("bolts")]
												.equals("null") ? Integer
										.parseInt(diskData[headers
												.indexOf("bolts")]) : 0;
								int fireballs = headers.indexOf("fireballs") > -1
										&& !diskData[headers
												.indexOf("fireballs")]
												.equals("null") ? Integer
										.parseInt(diskData[headers
												.indexOf("fireballs")]) : 0;
								int boulders = headers.indexOf("boulders") > -1
										&& !diskData[headers
												.indexOf("boulders")]
												.equals("null") ? Integer
										.parseInt(diskData[headers
												.indexOf("boulders")]) : 0;
								boolean missileImmunity = headers
										.indexOf("missileImmunity") > -1
										&& !diskData[headers
												.indexOf("missileImmunity")]
												.equals("null") ? Boolean
										.parseBoolean(diskData[headers
												.indexOf("missileImmunity")])
										: false;
								boolean firstblow = Boolean
										.parseBoolean(headers
												.indexOf("firstblow") > -1
												&& !diskData[headers
														.indexOf("firstblow")]
														.equals("null") ? diskData[headers
												.indexOf("firstblow")]
												: "false");
								int spellcaster = Integer
										.parseInt(headers
												.indexOf("spellcaster") > -1
												&& !diskData[headers
														.indexOf("spellcaster")]
														.equals("null") ? diskData[headers
												.indexOf("spellcaster")] : "0");
								int limit = headers.indexOf("limit") > -1
										&& !diskData[headers.indexOf("limit")]
												.equals("null") ? Integer
										.parseInt(diskData[headers
												.indexOf("limit")]) : 0;
								int cost = Integer.parseInt(diskData[headers
										.indexOf("cost")]);
								ScriptableObject disk = createDisk(
										diskName,
										type,
										attack,
										defense,
										toughness,
										movement,
										wounds,
										flying,
										swashbuckler,
										archer,
										arrows,
										bolts,
										fireballs,
										boulders,
										missileImmunity,
										firstblow,
										spellcaster,
										limit,
										cost,
										diskData[headers.indexOf("faction")],
										diskData[headers.indexOf("alignment")],
										diskData[headers.indexOf("diameter")],
										diskData[headers.indexOf("description")],
										diskData[headers.indexOf("price")]);

								saveDisk(disk);
							}
						}
					}
					// get the next file in the zip
					ze = zis.getNextEntry();
				}

				zis.close();
			} catch (FileNotFoundException fnf) {
				fnf.printStackTrace();
			} catch (IOException ioe) {
				ioe.printStackTrace();
			} finally {
				// delete the zip
				if (zipBlobKey != null) {
					BlobstoreService blobstoreService = BlobstoreServiceFactory
							.getBlobstoreService();
					blobstoreService.delete(zipBlobKey);
				}
			}
		} finally {
			step.close();
		}
	}

	public static HashMap<String, Object> getMission(String campaignName,
			String missionName) throws GameEngineException {
		HashMap<String, Object> mission = ge.persistence.get("Mission",
				campaignName + ":" + missionName);
		return mission;
	}

}