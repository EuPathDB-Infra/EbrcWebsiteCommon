package org.eupathdb.common.db;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Properties;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.db.platform.SupportedPlatform;
import org.gusdb.fgputil.db.pool.ConnectionPoolConfig;
import org.gusdb.fgputil.db.pool.DbDriverInitializer;
import org.gusdb.fgputil.db.runner.SQLRunner;
import org.gusdb.fgputil.db.runner.SQLRunnerException;
import org.gusdb.wdk.model.config.ModelConfigAppDB;

public class EuPathDbDriverInitializer implements DbDriverInitializer {

  public static final Logger LOG = Logger.getLogger(EuPathDbDriverInitializer.class);

  /* Remove setup for JavaMelody due to problems detailed in Redmine 17615 */
  //private static final String MELODY_DRIVER = "net.bull.javamelody.JdbcDriver";

  /* Remove setup for Log4Jdbc due to problems detailed in Redmine 14576 */
  //private static final String LOG4JDBC_DRIVER = "net.sf.log4jdbc.DriverSpy";
  //private static final String LOG4JDBC_URL_PREFIX = "jdbc:log4";

  @Override
  public String initializeDriver(String driverClassName, String connectionUrl, Properties props) throws ClassNotFoundException {

    LOG.debug("Initializing Model-Specified driver: " + driverClassName);
    Class.forName(driverClassName);

    // NOTE!!  The order of the registration of these drivers is important.  Log4Jdbc first, then Melody
    //LOG.debug("Initializing Log4Jdbc proxy driver.");
    //Class.forName(LOG4JDBC_DRIVER);

    //LOG.debug("Initializing Java Melody JDBC driver.");
    //Class.forName(MELODY_DRIVER);

    //LOG.debug("Specifying native JDBC driver to Melody (" + driverClassName + ").");
    //props.put("driver", driverClassName);

    //LOG.debug("Prepending Log4Jdbc URL prefix onto connection URL.");
    //connectionUrl = LOG4JDBC_URL_PREFIX + connectionUrl;

    return connectionUrl;
  }

  /**
   * Per problems with using up too many DB links, close links on connections before closing.
   * See documentation on this strategy here:
   *   https://docs.oracle.com/cd/B28359_01/server.111/b28310/ds_admin004.htm#ADMIN12169
   */
  @Override
  public void closeConnection(Connection connection, ConnectionPoolConfig dbConfig) throws SQLException {
    boolean incomingAutoCommit = connection.getAutoCommit();
    if (dbConfig instanceof ModelConfigAppDB) {
      connection.setAutoCommit(true);
      ModelConfigAppDB appDbConfig = (ModelConfigAppDB)dbConfig;
      if (appDbConfig.getPlatformEnum() == SupportedPlatform.ORACLE) {
        closeDbLink(connection, appDbConfig.getUserDbLink());
        closeDbLink(connection, appDbConfig.getAcctDbLink());
      }
    }
    // set auto-commit back to what it was
    connection.setAutoCommit(incomingAutoCommit);
    // always try to close connection
    connection.close();
  }

  private static void closeDbLink(Connection connection, String dbLinkName) {
    dbLinkName = dbLinkName.substring(1); // remove leading '@'
    String preCloseSql = "alter session close database link " + dbLinkName;
    try {
      LOG.trace("Attempting to close DB link '" + dbLinkName + "' on connection before returning it to the pool.");
      new SQLRunner(connection, preCloseSql, "close-db-link").executeStatement();
      LOG.debug("Successfully closed DB link '" + dbLinkName + "' before returning connection to pool.");
    }
    catch (SQLRunnerException exceptionWrapper) {
      String message = "Unable to execute pre-close SQL <" + preCloseSql + ">";
      Throwable e = exceptionWrapper.getCause();
      // ignore exception but log at different levels depending on which exception is thrown
      if (e.getMessage().contains("ORA-02081")) {
        // ORA-01081 (database link is not open) is highly likely since the vast majority of connections
        //   will not open DB links; log at trace in case anyone wants to see how often this happens
        LOG.trace(message, e);
      }
      else {
        // if this is an unexpected exception, log at error level; ideally we would throw an ErrorEvent here
        //   (to generate an email) but we have very little context here (TODO: do the work to send anyway??)
        LOG.error(message, e);
      }
    }
  }

}
