package com.antonytrupe.thediskgame;

import com.antonytrupe.games.GameEngineException;

@SuppressWarnings("serial")
public class APIException extends Exception {
	public APIException(GameEngineException gee) {
		super(gee);
	}
}