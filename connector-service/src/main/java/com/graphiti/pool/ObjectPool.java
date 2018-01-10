package com.graphiti.pool;

import java.util.Hashtable;

import com.graphiti.Constants;
import java.util.Enumeration;

/**
 * This has been inspired from 
 * https://sourcemaking.com/design_patterns/object_pool/java
 * 
 * @author 
 */

public abstract class ObjectPool<T> {
	private long expirationTime;
	private Hashtable<String,Hashtable<T,Long>> lockedOrgs;
	private Hashtable<String,Hashtable<T,Long>> unlockedOrgs;
	
	public ObjectPool() {
	    expirationTime = Long.parseLong((String) Constants.getInstance().properties.get("database-connection-pool-expiration-time"));
	    lockedOrgs = new Hashtable<String,Hashtable<T, Long>>();
	    unlockedOrgs = new Hashtable<String,Hashtable<T, Long>>();
	}
	
	protected abstract T create();
	
	public abstract boolean validate(T o);
	
	public abstract void expire(T o);
	
	public synchronized T checkOut(String orgId) {
		long now = System.currentTimeMillis();
		T t;
		Hashtable<T,Long> unlocked = unlockedOrgs.get(orgId);
		Hashtable<T,Long> locked = lockedOrgs.get(orgId);
		if(unlocked!=null && unlocked.size()>0){
			Enumeration<T> e = unlocked.keys();
			while (e.hasMoreElements()) {
				t = e.nextElement();
				if ((now - unlocked.get(t)) > expirationTime) {
					// This means the object has expired
					unlocked.remove(t);
					expire(t);
					t=null;
				}
				else{
					if(validate(t)){
						unlocked.remove(t);
						locked.put(t, now);
						return t;
					}
					else{
						// object validation has failed so we can safely remove it
						unlocked.remove(t);
						expire(t);
						t = null;
					}
				}
			}
		}
		t = create();
		if(locked==null){
			locked = new Hashtable<T,Long>();
			lockedOrgs.put(orgId, locked);
		}
		locked.put(t, now);
		return t;
	}
	
	public synchronized void checkIn(String orgId,T t) {
		Hashtable<T,Long> unlocked = unlockedOrgs.get(orgId);
		Hashtable<T,Long> locked = lockedOrgs.get(orgId);
	    locked.remove(t);
	    if(unlocked==null){
	    	unlocked = new Hashtable<T,Long>();
	    	unlockedOrgs.put(orgId, unlocked);
	    }
	    unlocked.put(t, System.currentTimeMillis());
	}
	
}
