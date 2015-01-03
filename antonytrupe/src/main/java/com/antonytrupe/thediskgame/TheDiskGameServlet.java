package com.antonytrupe.thediskgame;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.*;

import org.mozilla.javascript.ScriptableObject;

import com.antonytrupe.games.GameEngineException;

@SuppressWarnings("serial")
public class TheDiskGameServlet extends HttpServlet {
	private static String viewPath = "/views/thediskgame/";

	private void newMission(ServletRequest request, ServletResponse response)
			throws ServletException, IOException {

		// TODO check to see if we are editing an existing mission
		request.setAttribute("campaign", null);
		request.setAttribute("mission", null);
		request.setAttribute("scenario", null);

		request.getRequestDispatcher(viewPath + "missionEditor.jsp").forward(
				request, response);
	}

	@SuppressWarnings("unused")
	private void table() {
	}

	public void doGet(HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException {
		// resp.setContentType("text/plain");
		// resp.getWriter().println("BattledisksServlet");

		String pathInfo = request.getPathInfo();
		if (pathInfo == null) {
			// TODO figure out the default behavior
			pathInfo = "";
		}

		if (pathInfo.toLowerCase().contains("missionEditor")) {
			newMission(request, response);
			return;
		}

		pathInfo = pathInfo.replace("/", "");

		if (pathInfo.contains(".jsp")) {
			request.getRequestDispatcher(viewPath + pathInfo).forward(request,
					response);
			return;
		} else if (pathInfo.contains(".css")) {
			request.getRequestDispatcher(pathInfo).forward(request, response);
			return;
		}

		// get the user object

		String username = API.getUser(request);
		ScriptableObject player = null;
		if (username != null) {

			try {
				player = API.getPlayer(username);
			} catch (GameEngineException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		} else {
			// user is null, so look for a player by out lightweight user cookie
			Cookie[] cookies = request.getCookies();

			if (cookies != null) {
				for (Cookie cookie : cookies) {
					if (cookie.getName().equals("lightusername")) {
						// do something
						// value can be retrieved using #cookie.getValue()
						username = cookie.getValue();
					}
				}
			}

			try {
				player = API.getPlayer(username);
				if (player == null) {
					// we still didn't get a player object, so create one now
					long i = java.util.UUID.randomUUID()
							.getLeastSignificantBits();
					username = Long.toHexString(i);
					player = API.createPlayer(username);
					response.addCookie(new Cookie("lightusername", username));
				}
			} catch (GameEngineException e) {
				e.printStackTrace();
			}
		}
		// we either have a full player or lightweight player at this point
		if (player == null) {
			// check for jsession cookie
			// request.getCookies()["JSESSION"];
			try {
				player = API.createPlayer(username);
			} catch (GameEngineException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}

		// check to see if there is something specific in the url

		// if no user and nothing in the url, then go to the campaign
		// get the campaign
		HashMap<String, Object> mission;
		try {
			String campaignName = "Official Campaign";
			String missionName = "1";
			mission = API.getMission(campaignName, missionName);

			ScriptableObject table = API.createTable(
					(String) mission.get("maxPlayers"),
					(String) mission.get("maxPoints"),
					(String) mission.get("activations"),
					(String) mission.get("startingDisks"),
					(String) mission.get("reinforcements"),
					(String) mission.get("alignmentRestriction"),
					(String) mission.get("scenario"));

			// build the army for the player

			@SuppressWarnings("unchecked")
			List<String> player1disks = (ArrayList<String>) mission
					.get("player1Disks");

			String armyName = campaignName + ":" + missionName;

			for (String diskName : player1disks) {
				ScriptableObject disk = API.getDisk(diskName);

				boolean addedToArmy = false;
				Integer lastIndex = 0;
				while (!addedToArmy) {
					// check to see if the player already has this disk
					Integer diskNumber = (Integer) API.getDiskNumber(player,
							diskName, lastIndex);
					Boolean diskIsInArmy = (Boolean) API.diskIsInArmy(player,
							armyName, diskNumber);
					// if the player doesn't have this disk
					if (diskNumber == null) {
						diskNumber = (Integer) API.addDiskToPlayer(player,
								disk, null);
						API.addDiskToArmy(player, armyName, diskNumber, null);
						addedToArmy = true;
					}
					// the player does have this disk and its not in the army
					// yet
					else if (!diskIsInArmy) {
						API.addDiskToArmy(player, armyName, diskNumber, null);
						addedToArmy = true;
					}
					// the player has this disk and it IS in the army already
					else {
						lastIndex = diskNumber + 1;
					}
				}

			}

			API.join(table, player, armyName);
		} catch (GameEngineException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

		request.setAttribute("table", null);

		request.getRequestDispatcher("/views/thediskgame/index.jsp").forward(
				request, response);
	}
}
