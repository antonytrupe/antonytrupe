/*
 * Copyright 2010 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.antonytrupe.wiki;

import java.io.Serializable;
import java.util.Date;

@SuppressWarnings("serial")
public class Page implements Serializable {

	public static final String DATE = "date";
	public static final String REMOTE_IP = "remoteIP";
	public static final String CONTENT = "content";
	public static final String NAME = "name";
	public static final String PAGE = "Page";
	public static final String PAGEHISTORY = PAGE + "History";
	public static final String DIFF = "diff";
	public static final String UPDATE = "update";
	// public static final String STYLE = "style";
	public static final String USER = "user";

	private String name;
	private String content = "";
	// private String style = "";
	private Date date;
	private Boolean update = false;
	private String remoteIp;
	private String diff;

	private String user;

	public Page() {
	}

	public Page(String name) {
		this(name, null, null, null, new Date());
	}

	public Page(String name, String content) {
		this(name, content, null, null, new Date());
	}

	public Page(String name, String content, Boolean update) {
		this(name, content, null, null, new Date());
	}

	public Page(String name, String content, Date date, String user,
			String remoteIP) {
		this(name, content, user, null, new Date());
	}

	public Page(String name, String content, String user) {
		this(name, content, user, null, new Date());
	}

	/*
	 * the main constructor
	 */
	public Page(String name, String content, String user, String remoteAddr,
			Date date) {
		this.name = name;
		this.content = content;
		// private String style = "";
		this.date = date;
		this.update = false;
		this.remoteIp = remoteAddr;
		this.diff = "";

		this.user = user;
	}

	public String getContent() {
		return this.content;
	}

	public Date getDate() {
		return this.date;
	}

	public String getDiff() {
		return this.diff;
	}

	public String getIpAddress() {

		return this.remoteIp;
	}

	public String getName() {
		return this.name;
	}

	public String getUser() {
		return this.user;
	}

	public Boolean isUpdate() {
		return this.update;
	}

	public void setDiff(String diff) {
		this.diff = diff;
	}

	public void setName(String name) {
		this.name = name;
	}

	public void setUpdate(Boolean update) {
		this.update = update;
	}

	public void setUser(String user) {
		this.user = user;
	}
}