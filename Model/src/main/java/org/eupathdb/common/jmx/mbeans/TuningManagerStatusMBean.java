package org.eupathdb.common.jmx.mbeans;

import java.util.ArrayList;
import java.util.Map;

/**
 * MBean representing the WDK database cache.
 */
public interface TuningManagerStatusMBean {
  public ArrayList<Map<String, String>> gettable_statuses();
}
