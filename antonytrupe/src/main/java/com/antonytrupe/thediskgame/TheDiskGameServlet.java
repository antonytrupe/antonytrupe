package com.antonytrupe.thediskgame;

import java.io.IOException;
import java.math.BigInteger;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.mozilla.javascript.ScriptableObject;

import com.antonytrupe.games.GameEngineException;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;

@SuppressWarnings("serial")
public class TheDiskGameServlet extends HttpServlet {
	private static String viewPath = "/views/thediskgame/";
	private HttpServletRequest request;
	private HttpServletResponse response;

	private void missionEditor(HashMap<String, Object> mission)
			throws ServletException, IOException {

		// TODO check to see if we are editing an existing mission
		request.setAttribute("campaign", mission.get("campaign"));
		request.setAttribute("mission", mission.get("mission"));
		request.setAttribute("scenario", mission.get("scenario"));
		request.setAttribute("startingDisks", mission.get("startingDisks"));
		request.setAttribute("reinforcements", mission.get("reinforcements"));
		request.setAttribute("activations", mission.get("activations"));
		request.setAttribute("alignmentRestriction",
				mission.get("alignmentRestriction"));
		request.setAttribute("maxPlayers", mission.get("maxPlayers"));
		request.setAttribute("control1", mission.get("control1"));
		request.setAttribute("army1", mission.get("army1"));
		request.setAttribute("maxPoints1", mission.get("maxPoints1"));
		request.setAttribute("control2", mission.get("control2"));
		request.setAttribute("army2", mission.get("army2"));
		request.setAttribute("maxPoints2", mission.get("maxPoints2"));

		// get all the campaigns/missions
		HashMap<Object, HashMap<String, Object>> missions = API.Mission
				.getAll();
		request.setAttribute("allMissions", missions);

		request.getRequestDispatcher(viewPath + "missionEditor.jsp").forward(
				request, response);
	}

	private void tableList() throws ServletException, IOException {
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
		request.setAttribute("hereEncoded",
				URLEncoder.encode("/thediskgame/games", "UTF-8"));

		request.getRequestDispatcher(viewPath + "tableList.jsp").forward(
				request, response);

	}

	public void doGet(final HttpServletRequest request,
			final HttpServletResponse response) throws IOException,
			ServletException {

		this.request = request;
		this.response = response;

		String user = API.getUser(request);
		ScriptableObject player = null;
		if (user != null) {

			try {
				player = API.Player.get(user);
			} catch (GameEngineException e1) {
				e1.printStackTrace();
			}

			String hashtext = null;
			try {
				MessageDigest m = MessageDigest.getInstance("MD5");
				byte[] digest = m.digest(user.getBytes());
				BigInteger bigInt = new BigInteger(1, digest);
				hashtext = bigInt.toString(16);
			} catch (NoSuchAlgorithmException e) {
				e.printStackTrace();
			}

			request.setAttribute("gravatar", hashtext);
			if (player != null) {
				request.setAttribute("playerName", player.get("name"));
			}
		}

		String pathInfo = request.getPathInfo();
		if (pathInfo == null) {
			// TODO figure out the default behavior
			pathInfo = "";
		}
		// remove leading backslash
		pathInfo = pathInfo.replaceAll("^/", "");

		String[] parts = pathInfo.split("/");
		final String action = parts[0];

		switch (action.toLowerCase()) {

		case "game":
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

		case "games":
			tableList();
			break;

		case "missioneditor":

			HashMap<String, Object> mission = new HashMap<String, Object>();
			if (parts.length >= 2) {
				String missionName = URLDecoder.decode(parts[1], "UTF-8");
				try {
					mission = API.Mission.get(missionName);
				} catch (GameEngineException e) {
					e.printStackTrace();
				}
			}

			missionEditor(mission);
			break;

		case "diskeditor":
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
		default:
			break;
		}

		/*
		 * if (pathInfo.contains(".jsp")) {
		 * request.getRequestDispatcher(viewPath + pathInfo).forward(request,
		 * response); return; } else if (pathInfo.contains(".css")) {
		 * request.getRequestDispatcher(pathInfo).forward(request, response);
		 * return; }
		 */
		// get the user object

		/*
		 * String username = API.getUser(request); ScriptableObject player =
		 * null; if (username != null) {
		 * 
		 * try { player = API.getPlayer(username); } catch (GameEngineException
		 * e) { e.printStackTrace(); } } else { // user is null, so look for a
		 * player by out lightweight user cookie Cookie[] cookies =
		 * request.getCookies();
		 * 
		 * if (cookies != null) { for (Cookie cookie : cookies) { if
		 * (cookie.getName().equals("lightusername")) { // do something // value
		 * can be retrieved using #cookie.getValue() username =
		 * cookie.getValue(); } } }
		 * 
		 * try { player = API.getPlayer(username); if (player == null) { // we
		 * still didn't get a player object, so create one now long i =
		 * java.util.UUID.randomUUID() .getLeastSignificantBits(); username =
		 * Long.toHexString(i); player = API.Player.create(username);
		 * response.addCookie(new Cookie("lightusername", username)); } } catch
		 * (GameEngineException e) { e.printStackTrace(); } }
		 */
		// we either have a full player or lightweight player at this point
		/*
		 * if (player == null) { // check for jsession cookie //
		 * request.getCookies()["JSESSION"]; try { player =
		 * API.Player.create(username); } catch (GameEngineException e) {
		 * e.printStackTrace(); } }
		 */
		// check to see if there is something specific in the url

		// if no user and nothing in the url, then go to the campaign
		// get the campaign
		/*
		 * HashMap<String, Object> mission; try { String campaignName =
		 * "Official Campaign"; String missionName = "1"; mission =
		 * API.Mission.get(campaignName, missionName);
		 * 
		 * ScriptableObject table = API.createTable( (String)
		 * mission.get("maxPlayers"), (String) mission.get("maxPoints"),
		 * (String) mission.get("activations"), (String)
		 * mission.get("startingDisks"), (String) mission.get("reinforcements"),
		 * (String) mission.get("alignmentRestriction"), (String)
		 * mission.get("scenario"));
		 * 
		 * // build the army for the player
		 * 
		 * @SuppressWarnings("unchecked") List<String> player1disks =
		 * (ArrayList<String>) mission .get("player1Disks");
		 * 
		 * String armyName = campaignName + ":" + missionName;
		 * 
		 * for (String diskName : player1disks) { ScriptableObject disk =
		 * API.getDisk(diskName);
		 * 
		 * boolean addedToArmy = false; Integer lastIndex = 0; while
		 * (!addedToArmy) { // check to see if the player already has this disk
		 * Integer diskNumber = (Integer) API.getDiskNumber(player, diskName,
		 * lastIndex); Boolean diskIsInArmy = (Boolean) API.diskIsInArmy(player,
		 * armyName, diskNumber); // if the player doesn't have this disk if
		 * (diskNumber == null) { diskNumber = (Integer)
		 * API.addDiskToPlayer(player, disk, null); API.addDiskToArmy(player,
		 * armyName, diskNumber, null); addedToArmy = true; } // the player does
		 * have this disk and its not in the army // yet else if (!diskIsInArmy)
		 * { API.addDiskToArmy(player, armyName, diskNumber, null); addedToArmy
		 * = true; } // the player has this disk and it IS in the army already
		 * else { lastIndex = diskNumber + 1; } }
		 * 
		 * }
		 * 
		 * API.join(table, player, armyName); } catch (GameEngineException e) {
		 * e.printStackTrace(); }
		 * 
		 * request.setAttribute("table", null);
		 * 
		 * request.getRequestDispatcher("/views/thediskgame/index.jsp").forward(
		 * request, response);
		 */
	}

	private void game(ScriptableObject game) throws ServletException,
			IOException {
		// TODO Auto-generated method stub

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

		request.getRequestDispatcher(viewPath + "table.jsp").forward(request,
				response);
	}

	private void newGame(ScriptableObject player) throws ServletException,
			IOException {
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
		request.setAttribute("hereEncoded",
				URLEncoder.encode("/thediskgame/game", "UTF-8"));

		// TODO add the player json as an attribute
		if (player != null) {
			String playerJSON = (String) player.get("json");
			request.setAttribute("playerJSON", playerJSON);
		}

		request.getRequestDispatcher(viewPath + "newTable.jsp").forward(
				request, response);
	}

	private void diskEditor(ScriptableObject disk) throws ServletException,
			IOException, GameEngineException {
		BlobstoreService blobstoreService = BlobstoreServiceFactory
				.getBlobstoreService();
		String uploadurl = blobstoreService
				.createUploadUrl("/thediskgame/api?action=UPLOAD_DISKS");
		request.setAttribute("uploadurl", uploadurl);

		List<String> jsFiles = new ArrayList<String>() {
			{
				add("Point");
				add("Disk");
				add("UI");
				add("DiskUI");
			}
		};

		request.setAttribute("jsFiles", jsFiles);

		request.setAttribute("here", "/thediskgame/diskEditor");
		request.setAttribute("hereEncoded",
				URLEncoder.encode("/thediskgame/diskEditor", "UTF-8"));

		String json = API.stringify(disk);
		request.setAttribute("diskJson", json);

		request.getRequestDispatcher(viewPath + "diskEditor.jsp").forward(
				request, response);

	}

}
