package com.graphiti.controller;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import javax.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import com.graphiti.bean.Connection;
import com.graphiti.bean.User;
import com.graphiti.client.externalServices.IdentityService;
import com.graphiti.exceptions.ConnectionCreationException;
import com.graphiti.exceptions.ConnectionNotFoundException;
import com.graphiti.exceptions.MemberNotFoundException;
import com.graphiti.exceptions.RequiredFieldMissing;
import com.graphiti.repository.ConnectionRepository;

@RestController
public class ConnectionController {

	private Logger logger = LoggerFactory.getLogger(ConnectionController.class);

	@Autowired
	private ConnectionRepository connectionRepository;

	@RequestMapping(value = "/data/download", method = RequestMethod.GET)
	public void getDownload(HttpServletResponse response) throws IOException {
		response.setContentType("text/csv");
		String csvFileName = "ABC.csv";
		String headerKey = "Content-Disposition";
		String headerValue = String.format("attachment; filename=\"%s\"",
				csvFileName);
		response.setHeader(headerKey, headerValue);
		response.getWriter().print("a,b,c\n");
		response.getWriter().append("1,2,3\n");
		response.getWriter().append("3,4,5");
	}

	// Make External
	@RequestMapping(value = "/connection", method = RequestMethod.POST, consumes = "application/json", produces = "application/json")
	public ResponseEntity<String> addConnection(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestBody Connection connection) {
		try {
			validateIncomingData(connection);
			IdentityService identityService = new IdentityService();
			logger.info(
					"graphiti-tid: {}. Getting User Information for Member with Id: {}",
					graphiti_tid, memberId);
			User user = identityService.getUser(memberId, graphiti_tid);
			if (user == null) {
				logger.error("graphiti-tid: {}. User not found with the Id:{}",
						graphiti_tid, memberId);
				throw new MemberNotFoundException("Member not found");
			}
			connection.setMemberId(memberId);
			long currentTime = Instant.now().getEpochSecond();
			connection.setMemberId(memberId);
			connection.setLastModifiedBy(memberId);
			connection.setLastModifiedOn(currentTime);
			String connectionUUID = String.valueOf(UUID.randomUUID());
			connection.setId(connectionUUID);
			connection.setOrganization(user.getOrganization());
			logger.info("graphiti-tid:{}.Making a connection entry.",
					graphiti_tid);
			connectionRepository.add(graphiti_tid, connection);
			return new ResponseEntity<String>("{\"connectionId\":\""
					+ connectionUUID + "\"}", HttpStatus.CREATED);
		} catch (ConnectionCreationException e) {
			throw e;
		} catch (Exception e) {
			logger.error(
					"graphiti-tid:{}. Error while creating connection. Message :{}",
					graphiti_tid, e.getMessage());
			return new ResponseEntity<String>(
					"Error while creating connection",
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@RequestMapping(value = "/ext/connection", method = RequestMethod.POST, consumes = "application/json", produces = "application/json")
	public ResponseEntity<String> extaddConnection(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@RequestBody Connection connection) {
		return addConnection(memberId,graphiti_tid,connection);
	}
	
	@RequestMapping(value = "/connection/{connectionId}", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<Connection> getConnection(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@PathVariable String connectionId) {
		// Get User related Details
		IdentityService identityService = new IdentityService();
		User user = identityService.getUser(memberId, graphiti_tid);
		if (user == null) {
			throw new MemberNotFoundException("Member not found");
		}
		Connection connection = connectionRepository.get(connectionId,
				user.getOrganization());
		if (connection == null) {
			return new ResponseEntity<Connection>(connection,
					HttpStatus.NOT_FOUND);
		} else {
			return new ResponseEntity<Connection>(connection, HttpStatus.OK);
		}
	}

	// Make External
	@RequestMapping(value = "/connection/{connectionId}", method = RequestMethod.PUT, consumes = "application/json")
	public ResponseEntity<?> update(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@PathVariable String connectionId,
			@RequestBody Connection connection) {
		validateIncomingData(connection);
		if(connection.getPassword()==null){ // No change in password
			Connection oldConnection = connectionRepository.getWithPassword(connection.getId(), connection.getOrganization());
			connection.setPassword(oldConnection.getPassword());
		}
		//update the member who has last modified it
		connection.setLastModifiedBy(memberId);
		long currentTime = Instant.EPOCH.getEpochSecond();
		connection.setLastModifiedOn(currentTime);
		connectionRepository.update(connectionId, connection);
		return new ResponseEntity<>(null, HttpStatus.NO_CONTENT);
	}
	
	@RequestMapping(value = "/ext/connection/{connectionId}", method = RequestMethod.PUT, consumes = "application/json")
	public ResponseEntity<?> extupdate(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@PathVariable String connectionId,
			@RequestBody Connection connection) {
		return update(memberId,graphiti_tid,connectionId,connection);
	}

	// Make External
	@RequestMapping(value = "/connection", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<List<Connection>> getAll(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid) {
		// Get User related Details
		IdentityService identityService = new IdentityService();
		User user = identityService.getUser(memberId, graphiti_tid);
		if (user == null) {
			throw new MemberNotFoundException("Member not found");
		}
		// Get only those connections which belongs to the ORG the user belongs
		// to
		List<Connection> connections = connectionRepository.getAll(user
				.getOrganization());
		if (connections == null || connections.size() == 0) {
			return new ResponseEntity<List<Connection>>(connections,
					HttpStatus.NOT_FOUND);
		} else {
			return new ResponseEntity<List<Connection>>(connections,
					HttpStatus.OK);
		}
	}
	
	@RequestMapping(value = "/ext/connection", method = RequestMethod.GET, produces = "application/json")
	public ResponseEntity<List<Connection>> extgetAll(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid) {
		return getAll(memberId,graphiti_tid);
	}

	@RequestMapping(value = "/connection/{connectionId}", method = RequestMethod.DELETE)
	public ResponseEntity<?> delete(
			@RequestHeader(value = "memberId", required = true) String memberId,
			@RequestHeader(value = "graphiti-tid") String graphiti_tid,
			@PathVariable String connectionId) {
		try {
			IdentityService identityService = new IdentityService();
			User user = identityService.getUser(memberId, graphiti_tid);
			if (user == null) {
				throw new MemberNotFoundException("Member not found");
			}
			boolean status = connectionRepository.delete(connectionId,
					user.getOrganization());
			if (status == false) {
				return new ResponseEntity<String>(
						"Connection could not be deleted",
						HttpStatus.INTERNAL_SERVER_ERROR);
			} else {
				return new ResponseEntity<>(null, HttpStatus.NO_CONTENT);
			}
		} catch (ConnectionNotFoundException e) {
			throw e;
		}
	}

	/**
	 * This is a private method to validate if the connection fields meet the
	 * standards or not
	 * 
	 * @param connection
	 */
	private void validateIncomingData(Connection connection) {
		if (connection.getConnectionName() == null
				|| connection.getConnectionName().length() == 0) {
			throw new RequiredFieldMissing("Connection Name");
		}
		if (connection.getDatabaseType() == null
				|| connection.getDatabaseType().length() == 0) {
			throw new RequiredFieldMissing("Database Type");
		}
		// if(connection.getDatabaseName()==null ||
		// connection.getDatabaseName().length()==0){
		// throw new RequiredFieldMissing("Database Name");
		// }
		if (connection.getServerUrl() == null
				|| connection.getServerUrl().length() == 0) {
			throw new RequiredFieldMissing("Server URL");
		}
		// if(connection.getPort()==0){
		// throw new RequiredFieldMissing("Database Port");
		// }
		if (connection.getUsername() == null
				|| connection.getUsername().length() == 0) {
			throw new RequiredFieldMissing("Database username");
		}
		if (connection.getPassword() == null
				|| connection.getPassword().length() == 0) {
			throw new RequiredFieldMissing("Database password");
		}
	}
}
