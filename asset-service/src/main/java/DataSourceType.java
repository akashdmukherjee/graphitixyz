

/**
 * The source type of a data set
 * 
 * @author 
 *
 */
public enum DataSourceType {

	FILE_UPLOAD("FILE_UPLOAD"),
	SQL("SQL"),
	APP("APP");
	
	private final String value;
	
	private DataSourceType(String value){
		this.value = value;
	}
	
	public String getValue(){
		return this.value;
	}	
}
