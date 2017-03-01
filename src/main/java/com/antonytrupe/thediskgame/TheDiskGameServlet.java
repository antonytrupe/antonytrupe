package com.antonytrupe.thediskgame;

import java.io.IOException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map.Entry;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.ScriptableObject;

import com.antonytrupe.MD5Util;
import com.antonytrupe.games.GameEngineException;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;
import com.google.gson.Gson;

@SuppressWarnings("serial")
public class TheDiskGameServlet extends HttpServlet {

	public enum PAGE {
		DISKEDITOR("diskeditor"), MISSIONEDITOR("missioneditor"), GAMES("games"), GAME("game"), INDEX(
				"index"), ARMYEDITOR("armyeditor"), USERS("users");

		private String pageName;

		PAGE(String pageName) {
			this.pageName = pageName;
		}

		public static PAGE fromString(String text) {
			if (text != null) {
				for (PAGE b : PAGE.values()) {
					if (text.equalsIgnoreCase(b.pageName)) {
						return b;
					}
				}
			}
			return INDEX;
		}
	};

	private static String viewPath = "/views/thediskgame/";
	private HttpServletRequest request;
	private HttpServletResponse response;

	private void missionEditor(String campaignName, String missionName) throws ServletException, IOException {

		// get the mission
		HashMap<String, Object> mission = API.Mission.get(campaignName, missionName);
		String missionJson = new Gson().toJson(mission);
		request.setAttribute("missionJson", missionJson);
		// request.setAttribute("mission", mission);

		if (mission != null) {
			for (Entry<String, Object> a : mission.entrySet()) {
				request.setAttribute(a.getKey(), a.getValue());
			}
		}

		// get all the campaigns/missions
		HashMap<Object, HashMap<String, Object>> allMissions = API.Mission.getAll();
		request.setAttribute("allMissions", allMissions);
		String allMissionsJson = new Gson().toJson(allMissions);
		request.setAttribute("allMissionsJson", allMissionsJson);

		request.setAttribute("here", "/thediskgame/missionEditor");
		request.setAttribute("hereEncoded", URLEncoder.encode("/thediskgame/missionEditor", "UTF-8"));

		request.getRequestDispatcher(viewPath + "missionEditor.jsp").forward(request, response);
	}

	private void gameList() throws ServletException, IOException {
		String openTables = API.Table.getOpen();
		request.setAttribute("openTables", openTables);

		String activeTables = API.Table.getActive();
		request.setAttribute("activeTables", activeTables);

		String playerName = API.getUser(request);
		String myTables = API.Table.getOpenAndActive(playerName);
		request.setAttribute("myTables", myTables);

		List<String> jsFiles = new ArrayList<String>() {
			{
				add("Point");
				add("Player");
				add("Table");
				add("UI");
				add("API");
			}
		};

		request.setAttribute("jsFiles", jsFiles);

		request.setAttribute("here", "/thediskgame/games");
		request.setAttribute("hereEncoded", URLEncoder.encode("/thediskgame/games", "UTF-8"));

		request.getRequestDispatcher(viewPath + "tableList.jsp").forward(request, response);

	}

	public void doGet(final HttpServletRequest request, final HttpServletResponse response)
			throws IOException, ServletException {

		this.request = request;
		this.response = response;

		String email = API.getUser(request);
		ScriptableObject player = null;
		if (email != null) {

			try {
				player = API.Player.get(email);
			} catch (GameEngineException e1) {
				e1.printStackTrace();
			}

			// String hashtext = null;
			// try {
			// MessageDigest m = MessageDigest.getInstance("MD5");
			// byte[] digest = m.digest(email.getBytes());
			// BigInteger bigInt = new BigInteger(1, digest);
			// hashtext = bigInt.toString(16);
			// } catch (NoSuchAlgorithmException e) {
			// e.printStackTrace();
			// }

			String hash = MD5Util.md5Hex(email);

			request.setAttribute("gravatar", hash);
			if (player != null) {
				request.setAttribute("playerName", player.get("name"));
			}
		}

		String playerJson = "{}";

		if (player != null) {
			playerJson = (String) player.get("json");
		}
		request.setAttribute("playerJson", playerJson);

		String pathInfo = request.getPathInfo();
		// String contextPath = request.getContextPath();
		String requestURI = request.getRequestURI();
		// StringBuffer requestURL = request.getRequestURL();
		if (pathInfo == null) {
			pathInfo = "";
		}
		// remove leading backslash
		pathInfo = pathInfo.replaceAll("^/", "");

		String[] parts = pathInfo.split("/");
		final PAGE action = PAGE.fromString(parts[0].replace("#", "").replace(".jsp", ""));

		switch (action) {

		case USERS:
			users();
			break;

		case GAME:
			String gameId = "new";
			if (parts.length > 1 && parts[1] != null) {

				gameId = parts[1];
			}

			if (gameId.equals("new")) {

				newGame(player);
			} else {

				try {
					long parseInt = Long.parseLong(gameId);
					ScriptableObject game = API.Table.get(parseInt, 0);
					game(game);
				} catch (NumberFormatException e) {
					newGame(player);
				} catch (GameEngineException e) {
					e.printStackTrace();
				}

			}

			break;

		case GAMES:
			// make them log in first
			if (player == null) {
				String string = "/login.html?redirect_uri=" + URLEncoder.encode(
						"/thediskgame/api?action=LOG_IN"
								+ URLEncoder.encode("&return_to=" + URLEncoder.encode(requestURI, "UTF-8"), "UTF-8"),
						"UTF-8");
				response.sendRedirect(string);
				return;
			}

			gameList();
			break;

		case ARMYEDITOR:
			String armyName = null;
			if (parts.length == 2 && parts[1] != null) {

				armyName = parts[1];
			}
			if (parts.length >= 3 && parts[1] != null && parts[2] != null) {

				armyName = parts[2] + "/" + parts[2];
			}

			try {
				armyEditor(player, armyName);
			} catch (GameEngineException e1) {
				// TODO Auto-generated catch block
				e1.printStackTrace();
			}
			break;

		case MISSIONEDITOR:
			String campaignName = null;
			if (parts.length >= 2) {
				campaignName = URLDecoder.decode(parts[1], "UTF-8");

			}
			String missionName = null;
			if (parts.length >= 3) {
				missionName = URLDecoder.decode(parts[2], "UTF-8");

			}

			missionEditor(campaignName, missionName);
			break;

		case DISKEDITOR:
			ScriptableObject disk = null;
			if (parts.length >= 2) {
				String diskName = URLDecoder.decode(parts[1], "UTF-8");
				try {
					disk = API.Disk.get(diskName);
				} catch (GameEngineException e) {
					e.printStackTrace();
				}
			}

			try {
				diskEditor(disk);
			} catch (GameEngineException e) {
				e.printStackTrace();
			}
			break;
		case INDEX:// fall through to default
		default:
			index();
			break;
		}

	}

	private void users() throws ServletException, IOException {
		// TODO Auto-generated method stub
		request.getRequestDispatcher(viewPath + "profile.jsp").forward(request, response);
	}

	private void armyEditor(ScriptableObject player, String armyName)
			throws ServletException, IOException, GameEngineException {
		// TODO armyEditor
		NativeObject playerArmies = null;
		Object playerDisks = null;
		Object playerName = null;
		// Object army = null;
		if (player != null) {
			playerArmies = (NativeObject) player.get("armies");
			playerDisks = player.get("disks");
			playerName = player.get("name");
			// army = playerArmies.get(armyName);
		}
		if (armyName != null) {
			// army = API.Army.get(armyName);
		}

		HashMap<Object, HashMap<String, Object>> globalArmies = API.Army.getAll();
		request.setAttribute("globalArmies", globalArmies);

		request.setAttribute("playerArmies", playerArmies);

		request.setAttribute("armyName", armyName);

		String playerArmiesJson = new Gson().toJson(playerArmies);
		request.setAttribute("playerArmiesJson", playerArmiesJson);

		request.setAttribute("playerDisks", playerDisks);
		String playerDisksJson = new Gson().toJson(playerDisks);
		request.setAttribute("playerDisksJson", playerDisksJson);

		HashMap<Object, HashMap<String, Object>> allDisks = API.Disk.getAll();
		request.setAttribute("allDisks", allDisks);

		request.setAttribute("playerName", playerName);

		request.setAttribute("here", "/thediskgame/armyeditor/" + armyName);
		request.setAttribute("hereEncoded", URLEncoder.encode("/thediskgame/armyeditor/" + armyName, "UTF-8"));

		request.getRequestDispatcher(viewPath + "armyEditor.jsp").forward(request, response);
	}

	private void index() throws ServletException, IOException {

		request.setAttribute("here", "/thediskgame/");
		request.setAttribute("hereEncoded", URLEncoder.encode("/thediskgame/", "UTF-8"));

		request.getRequestDispatcher(viewPath + "index.jsp").forward(request, response);
	}

	private void game(ScriptableObject game) throws ServletException, IOException {

		List<String> jsFiles = new ArrayList<String>() {
			{
				add("Point");
				add("Disk");
				add("Player");
				add("Table");
				add("UI");
				add("TableUI");
				add("API");
			}
		};

		request.setAttribute("jsFiles", jsFiles);

		request.setAttribute("here", "/thediskgame/game/" + game.get("id"));
		request.setAttribute("hereEncoded", URLEncoder.encode("/thediskgame/game/" + game.get("id"), "UTF-8"));

		request.setAttribute("tableJson", game.get("json"));

		request.getRequestDispatcher(viewPath + "table.jsp").forward(request, response);
	}

	private void newGame(ScriptableObject player) throws ServletException, IOException {
		List<String> jsFiles = new ArrayList<String>() {
			{
				add("Player");
				add("Table");
				add("Disk");
				add("Point");
				add("API");
			}
		};

		request.setAttribute("jsFiles", jsFiles);

		request.setAttribute("here", "/thediskgame/game");
		request.setAttribute("hereEncoded", URLEncoder.encode("/thediskgame/game", "UTF-8"));

		// add the player json as an attribute
		if (player != null) {
			String playerJson = (String) player.get("json");
			request.setAttribute("playerJson", playerJson);
		}

		request.getRequestDispatcher(viewPath + "newTable.jsp").forward(request, response);
	}

	private void diskEditor(ScriptableObject disk) throws ServletException, IOException, GameEngineException {
		BlobstoreService blobstoreService = BlobstoreServiceFactory.getBlobstoreService();
		String uploadurl = blobstoreService.createUploadUrl("/thediskgame/api?action=UPLOAD_DISKS");
		request.setAttribute("uploadurl", uploadurl);

		List<String> jsFiles = new ArrayList<String>() {
			{
				add("Point");
				add("Disk");
				add("UI");
				add("DiskUI");
			}
		};

		HashMap<Object, HashMap<String, Object>> allDisks = API.Disk.getAll();
		// Object allDisksJson = API.stringify(allDisks);
		String allDisksJson = new Gson().toJson(allDisks);
		request.setAttribute("allDisks", allDisksJson);

		request.setAttribute("jsFiles", jsFiles);

		String here = "/thediskgame/diskEditor/";
		if (disk != null) {
			here += disk.get("name");
		}
		request.setAttribute("here", here);
		request.setAttribute("hereEncoded", URLEncoder.encode(here, "UTF-8"));

		String json = API.stringify(disk);
		request.setAttribute("diskJson", json);

		request.getRequestDispatcher(viewPath + "diskEditor.jsp").forward(request, response);
	}
}