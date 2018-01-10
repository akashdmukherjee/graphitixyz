package com.graphiti;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Properties;

public class InternalCache {
	public static ArrayList<String> acceptableDateFormats = new ArrayList<String>();
	private static InternalCache internalCache;
	
	private InternalCache(){
		
	}
	
	/**
	 * Get internal cache object
	 * @return
	 */
	public static InternalCache getInstance(){
		if(internalCache==null){
			internalCache = new InternalCache();
			return internalCache;
		}
		else{
			return internalCache;
		}
	}
}
