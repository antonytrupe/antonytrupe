goog.provide('com.antonytrupe.tend.Trade');

function Trade(playerTo, knownResource, secretResources, wantedResources) {
	"use strict";
	
	var $this=this;
	$this.playerTo = playerTo;
	$this.knownResource = knownResource;
	$this.secretResources = secretResources;
	$this.wantedResources = wantedResources;

	function equals(obj) {
		if ($this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		var other = obj;
		if ($this.knownResource != other.knownResource)
			return false;
		if ($this.secretResources == null) {
			if (other.secretResources != null)
				return false;
		} else if (!$this.secretResources.equals(other.secretResources))
			return false;
		return true;
	}

	function getValue() {
		// var value = 0;
		// var knownResourceIncluded = false;

		for ( var entry in $this.secretResources.entrySet()) {
			// include knownResource in trade totalValue
			if ($this.knownResource == entry.getKey()) {
				value += entry.getKey().getValue(entry.getValue() + 1);
				knownResourceIncluded = true;
			} else {
				value += entry.getKey().getValue(entry.getValue());
			}
		}
		if (!knownResourceIncluded && $this.knownResource != null) {
			// include knownResource in trade totalValue
			value += $this.knownResource.getValue(1);
		}
		return value;
	}

	function secretResourcesCount() {
		var count = 0;
		for ( var entry in $this.secretResources.values()) {
			count += entry;
		}
		return count;
	}

	function serialize(includeSecret) {
		// serialize trade object

		var sb = new StringBuilder("{");

		sb.append("\"playerTo\":\"").append($this.playerTo).append("\",");
		// don't print the string null if knownResource is null
		if ($this.knownResource != null) {
			sb.append("\"knownResource\":\"").append($this.knownResource)
					.append("\",");
		}

		if (includeSecret) {
			sb.append("\"secretResources\":{");
			// secret cards
			var trim = false;
			for ( var entry in $this.secretResources.entrySet()) {
				sb.append("\"").append(entry.getKey()).append("\":");
				sb.append("").append(entry.getValue()).append(",");
				trim = true;
			}
			if (trim) {
				sb.deleteCharAt(sb.length() - 1);
			}
			sb.append("},");
		}

		sb.append("\"totalValue\":" + $this.getValue() + ",");

		var resourceCount = 0;
		if ($this.knownResource != null) {
			resourceCount++;
		}
		resourceCount += $this.secretResourcesCount();

		sb.append("\"resourceCount\":" + resourceCount + ",");

		sb.append("\"wantedResources\":[");
		// wants
		var trim = false;
		for ( var r in $this.wantedResources) {
			sb.append("\"").append(r).append("\",");
			trim = true;
		}
		if (trim) {
			sb.deleteCharAt(sb.length() - 1);
		}
		sb.append("]");

		sb.append("}");

		return sb.toString();

	}

}