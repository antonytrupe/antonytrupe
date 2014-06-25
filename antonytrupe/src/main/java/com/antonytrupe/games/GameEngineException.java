package com.antonytrupe.games;

import org.mozilla.javascript.EcmaError;

@SuppressWarnings("serial")
public class GameEngineException extends Exception {
	public GameEngineException(EcmaError ee) {
		super(ee);
	}
}