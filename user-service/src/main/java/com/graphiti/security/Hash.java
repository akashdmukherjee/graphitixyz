package com.graphiti.security;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.graphiti.utils.Utils;

/**
 * It will be used for Hashing purposes.
 * LOGGING only exceptions
 * 
 * @author 
 *
 */

public class Hash {

	private static Logger logger = LoggerFactory.getLogger(Hash.class);
	
	/**
	 * The purpose of this function is to generate Hash
	 * for the passed in password. Basically this is the called function from outside
	 * This function will return a JSONObject consisting of the hashedValue and also the SALT
	 * Keys: hashedPassword,salt
	 * @param password
	 * @return JSONObject
	 * @throws NoSuchAlgorithmException 
	 */
	public static JSONObject generateHash(String password){
		try{
			byte[] salt = getSalt();
			String hashValue = getSHA512SecurePassword(password,salt);
			JSONObject returningJSONObject = new JSONObject();
			returningJSONObject.put("hashedPassword", hashValue);
			returningJSONObject.put("salt",new String(salt));
			return returningJSONObject;
		}
		finally{
			// Do Nothing
		}
	}

	/**
	 * Here the hash will be generated 
	 * @param passwordToHash
	 * @param salt
	 * @return
	 * @throws NoSuchAlgorithmException
	 */
	public static String getSHA512SecurePassword(String passwordToHash,
			byte[] salt) {
		try{
			String generatedPassword = null;
			MessageDigest md = MessageDigest.getInstance("SHA-512");
			md.update(salt);
			byte[] bytes = md.digest(passwordToHash.getBytes());
			StringBuilder sb = new StringBuilder();
			for (int i = 0; i < bytes.length; i++) {
				sb.append(Integer.toString((bytes[i] & 0xff) + 0x100, 16)
						.substring(1));
			}
			generatedPassword = sb.toString();
			return generatedPassword;
		}
		catch(NoSuchAlgorithmException e){
			logger.error("No Such Algo exception");
			return null;
		}
	}
	
	/**
	 * Generate the salt here
	 * @return
	 * @throws NoSuchAlgorithmException
	 */
    private static byte[] getSalt()
    {
        return Utils.generateRandomAlphaNumericString(10).getBytes();
    }

}
