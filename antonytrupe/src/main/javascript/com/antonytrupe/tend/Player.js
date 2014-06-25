goog.provide('com.antonytrupe.tend.Player');

/**
 * @suppress {uselessCode}
 */
function Disposition() {
	"use strict";
	IN_PROGRESS, DONE;
}

function Player(p) {
	"use strict";
	var $this = this;
	$this.name = p.name || "";
	$this.disposition = p.disposition || {};
	$this.resources = p.resources || {};
	$this.settlements = p.settlements || {};
	$this.trade = p.trade || {};
	$this.queuedResourceCollections = p.queuedResourceCollections || {};
	$this.queuedSettlements = p.queuedSettlements || {};
	$this.queuedSettlementsResources = p.queuedSettlementsResources || {};
	$this.populationLocation = p.populationLocation || {};
	$this.color = p.color || null;
	$this.unplacedPopulation = 1;
	$this.unplacedQueuePopulation = 1;
	$this.population = {};
	$this.queuedPopulationMoves = {};
	$this.queuedPopulation = {};
	$this.queuedPopulationExpansions = {};

	/**
	 * @param {Point}
	 *            point
	 * @param {Settlement}
	 *            settlement
	 * @param {Object}
	 *            r resources
	 */
	$this.queueSettlement = function(point, settlement, r) {
		// console.log('Player.queueSettlement');
		$this.queuedSettlements[point.stringify()] = settlement.name;
		$this.queuedSettlementsResources[point.stringify()] = r;

		// remove spent resources
		Object.keys(r).forEach(function(key) {
			$this.removeResources(key, r[key]);
		});
	};

	$this.addResources = function(resource, count) {
		var a = $this.resources[resource.name];
		if (a == null) {
			a = 0;
		}
		a += count;
		if (a <= 0) {
			delete $this.resources[resource.name];
		} else {
			$this.resources[resource.name] = a;
		}
	};

	$this.addSettlement = function(point, settlement) {
		$this.settlements[point.stringify()] = settlement.name;
	};

	function getName() {
		return $this.name;
	}

	function getDisposition() {
		return $this.disposition;
	}

	function getPopulation() {
		var p = 0;
		for ( var entry in $this.populationLocation.values()) {
			p += entry;
		}
		return p;
	}

	function getResource(key) {
		return $this.resources.get(key);
	}

	$this.getScore = function() {
		var score = 0;
		$.each($this.settlements, function(k, settlement) {
			score += Settlement[settlement].level;
		});
		return score;
	};

	function getSettlements() {
		return $this.settlements;
	}

	function hasResources(key, value) {
		return $this.resources.containsKey(key) && $this.resources.get(key) >= value;
	}

	$this.hasSettlement = function(point) {
		return !!$this.settlements[point.stringify()];
	};

	$this.removeResources = function(resource, count) {
		var a = $this.resources[resource];
		a -= count;
		if (a <= 0) {
			delete $this.resources[resource];
		} else {
			$this.resources[resource] = a;
		}
	};

	/**
	 * 
	 * @return number of non-calamity resources the player has
	 */
	function resourceCount() {
		var count = 0;
		for ( var entry in $this.resources) {
			if (entry.getKey().category != Category.CALAMITY) {
				count += entry.getValue();
			}
		}
		return count;
	}

	function deserialize(playerInfo) {
		// get the player's phase
		var string = playerInfo.get("disposition");
		if (string != null) {
			$this.setDisposition(Disposition.valueOf(string));
		}

		$this.color = playerInfo.get("color");

		// de-serialize collections
		var rc = playerInfo.get("queuedResourceCollections");
		if (rc != null) {
			for ( var resourcePointLevel in rc.entrySet()) {
				var settlementPointAsMap = resourcePointLevel.getValue();
				var settlementPoint = JsonHelper.readPoint(settlementPointAsMap);
				var keyAsMap = JsonHelper.readMap(resourcePointLevel.getKey());
				var resourcePointMap = keyAsMap.get("resourcePoint");
				var resourcePoint = JsonHelper.readPoint(resourcePointMap);
				var level = keyAsMap.get("level");

				var collectedPoints = $this.queuedSettlementCollectionPoints.get(settlementPoint);
				if (collectedPoints == null) {
					collectedPoints = 0;
				}
				collectedPoints += level;
				// collectedPoints += level;
				$this.queuedSettlementCollectionPoints.put(settlementPoint, collectedPoints);

				$this.queuedResourceCollections.put(new PointLevel(resourcePoint, level), settlementPoint);
			}
		}

		{
			var playerResources = playerInfo.get("resources");

			for ( var playerResource in playerResources) {
				var pre = Resource.valueOf(playerResource.getKey());
				var resourceCount = playerResource.getValue();
				$this.addResources(pre, resourceCount);
			}
		}

		// var mapper = new ObjectMapper();
		{
			// de-serialize trade data
			var tradeMap = playerInfo.get("trade");
			if (tradeMap != null) {

				var knownResourceString = tradeMap.get("knownResource");
				if (knownResourceString != null) {
					var knownResource = Resource.valueOf(knownResourceString);
					$this.trade.knownResource = knownResource;
				}
				//

				var playerTo = tradeMap.get("playerTo");
				$this.trade.playerTo = playerTo;

				var secretResources = tradeMap.get("secretResources");

				for ( var entry in secretResources.entrySet()) {
					var pre = Resource.valueOf(entry.getKey());
					$this.trade.secretResources.put(pre, entry.getValue());
				}
				/*
				 * var wantedResources = mapper.convertValue(tradeMap
				 * .get("wantedResources"), List.class); for ( var entry in
				 * wantedResources) {
				 * 
				 * var pre = Resource.valueOf(entry);
				 * $this.trade.wantedResources.add(pre); }
				 */
			}
		}
		{
			var playerSettlements = playerInfo.get("settlements");

			for ( var reso in playerSettlements.entrySet()) {
				var p = JsonHelper.readPoint(reso.getKey());
				var s = Settlement.valueOf(reso.getValue());
				$this.addSettlement(p, s);
			}
		}

		{
			var queuedSettlements = playerInfo.get("queuedSettlements");
			if (queuedSettlements != null) {
				for ( var reso in queuedSettlements.entrySet()) {
					var p = JsonHelper.readPoint(reso.getKey());

					var s = Settlement.valueOf(reso.getValue());

					$this.queuedSettlements.put(p, s);
				}
			}
		}
		{

			// queuedSettlementResources
			var queuedSettlementResources = playerInfo.get("queuedSettlementsResources");
			if (queuedSettlementResources != null) {
				for ( var entry in queuedSettlementResources.entrySet()) {
					var p = JsonHelper.readPoint(entry.getKey());
					var resources = {};
					for ( var o in entry.getValue().entrySet()) {

						var pre = Resource.valueOf(o.getKey());
						var count = o.getValue();
						resources.put(pre, count);
					}

					$this.queuedSettlementsResources.put(p, resources);
				}
			}
		}
	}

	function serialize(includeSecret) {
		var sb = new StringBuilder("{");

		sb.append("\"name\":\"").append($this.name).append("\",");
		sb.append("\"disposition\":\"").append($this.disposition).append("\",");
		sb.append("\"score\":").append($this.getScore()).append(",");
		sb.append("\"color\":\"").append($this.color).append("\",");

		// serialize the player's trade
		sb.append("\"trade\":").append($this.trade.serialize(includeSecret)).append(",");

		// serialize collections
		{
			sb.append("\"queuedResourceCollections\":");
			sb.append("{");
			var trim = false;

			for ( var p in $this.queuedResourceCollections.entrySet()) {
				// {"{resourcePoint:"",level:""}":settlementPoint,...}
				sb.append("\"{")
				// resourcePoint
				.append("\\\"resourcePoint\\\":")
				//
				.append(p.getKey().point.escape())
				// level
				.append(",\\\"level\\\":").append(p.getKey().level)
				// settlementPoint
				.append("}\":").append(p.getValue()).append(",");
				trim = true;
			}
			if (trim) {
				sb.deleteCharAt(sb.length() - 1);
			}

			sb.append("}");
		}

		sb.append(",");

		{
			sb.append("\"queuedSettlementCollectionPoints\":");
			sb.append("{");
			var trim = false;

			for ( var p in $this.queuedSettlementCollectionPoints.entrySet()) {
				// {"point":"integer"}

				// sb.append("{")
				// settlementPoint
				sb.append("\"").append(p.getKey().escape()).append("\":")
				// usedPoints
				.append(p.getValue());
				sb.append(",");
				trim = true;
			}
			if (trim) {
				sb.deleteCharAt(sb.length() - 1);
			}

			sb.append("}");
		}
		sb.append(",");

		if (includeSecret) {
			// start resources
			sb.append("\"resources\":");
			sb.append("{");
			var trim = false;

			for ( var r in $this.resources.entrySet()) {
				sb.append("\"").append(r.getKey()).append("\":");
				sb.append(r.getValue());
				sb.append(",");
				trim = true;
			}

			if (trim) {
				sb.deleteCharAt(sb.length() - 1);
			}

			sb.append("} ");
			// end resources
			sb.append(",");
		}

		if (includeSecret) {
			// start queued settlements
			sb.append("\"queuedSettlements\":");
			sb.append("{");
			var trim = false;

			for ( var r in $this.queuedSettlements.entrySet()) {
				sb.append("\"").append(r.getKey().escape()).append("\":\"");
				sb.append(r.getValue().name());
				sb.append("\",");
				trim = true;
			}

			if (trim) {
				sb.deleteCharAt(sb.length() - 1);
			}

			sb.append("} ");
			// end settlements
			sb.append(",");
		}
		if (includeSecret) {
			// start queued settlements resources
			sb.append("\"queuedSettlementsResources\":");
			sb.append("{");
			var trim = false;

			for ( var pointResourceMap in $this.queuedSettlementsResources.entrySet()) {
				sb.append("\"").append(pointResourceMap.getKey().escape()).append("\":");
				sb.append("{");
				var trim2 = false;

				for ( var resourceInteger in pointResourceMap.getValue().entrySet()) {
					sb.append("\"").append(resourceInteger.getKey().name()).append("\":");
					sb.append(resourceInteger.getValue());
					sb.append(",");
					trim2 = true;
				}

				if (trim2) {
					sb.deleteCharAt(sb.length() - 1);
				}

				sb.append("} ");
				// end resources
				sb.append(",");
				trim = true;
			}

			if (trim) {
				sb.deleteCharAt(sb.length() - 1);
			}

			sb.append("} ");
			// end settlements
			sb.append(",");
		}
		{
			// start settlements
			sb.append("\"settlements\":");
			sb.append("{");
			var trim = false;

			for ( var r in $this.settlements.entrySet()) {
				sb.append("\"").append(r.getKey().escape()).append("\":\"");
				sb.append(r.getValue().name());
				sb.append("\",");
				trim = true;
			}

			if (trim) {
				sb.deleteCharAt(sb.length() - 1);
			}

			sb.append("} ");
			// end settlements
			sb.append(",");
		}

		sb.deleteCharAt(sb.length() - 1);

		sb.append("}");
		return sb.toString();
	}

	function setDisposition(disposition) {
		$this.disposition = disposition;
	}

	function queuePopulationMove(from, to) {
		var start = $this.population.get(from);
		var moved = $this.queuedPopulationMoves.get(from);
		var end = $this.queuedPopulation.get(to);
		if (end == null) {
			end = 0;
		}
		if (moved == null) {
			moved = 0;
		}
		if (start > moved) {
			// queue the move
			$this.queuedPopulation.put(to, end + 1);
			$this.queuedPopulationMoves.put(from, moved + 1);
		}

	}

	function queuePopulationExpand(point) {
		var pop = $this.population.get(point);
		if (pop == null) {
			pop = 0;
		}
		var queued = $this.queuedPopulationExpansions.get(point);
		if (queued == null) {
			queued = 0;
		}
		// if the player has no population at $this point

		if (pop == 0 &&
		// check to see if they have "free" population to place
		$this.unplacedQueuePopulation > 0 &&
		// make sure they're not putting more then 2 here
		queued < 2) {
			// queue the population
			$this.queuedPopulationExpansions.put(point, queued + 1);
			// decrement the remaining available free population
			$this.unplacedQueuePopulation--;
		}
		// if the player does have population at $this point
		if (pop > 0 &&
		// make sure they're not increasing by more then 2
		queued < 2 &&
		// make sure they're not more then doubling
		queued + 1 <= pop * 2) {
			$this.queuedPopulationExpansions.put(point, queued + 1);
		}

	}
}