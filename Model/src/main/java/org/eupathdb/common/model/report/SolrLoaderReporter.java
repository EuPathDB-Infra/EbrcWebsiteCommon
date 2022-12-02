package org.eupathdb.common.model.report;

import static org.gusdb.fgputil.functional.Functions.rSwallow;
import static org.gusdb.fgputil.functional.Functions.reduce;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Set;

import org.gusdb.fgputil.functional.FunctionalInterfaces.Procedure;
import org.gusdb.fgputil.json.JsonWriter;
import org.gusdb.wdk.core.api.JsonKeys;
import org.gusdb.wdk.model.WdkModelException;
import org.gusdb.wdk.model.answer.stream.RecordStream;
import org.gusdb.wdk.model.answer.stream.RecordStreamFactory;
import org.gusdb.wdk.model.record.RecordInstance;
import org.gusdb.wdk.model.record.TableValue;
import org.gusdb.wdk.model.report.reporter.AnswerDetailsReporter;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Provides records returned by the answer value in the following JSON format:
 * [
 *   {
 *     id: ["pk1", "pk2", "pk3"],
 *     tableNameOne: "a clob holding tab delimited table values",
 *     tableNameTwo: "a clob holding tab delimited table values",
 *     attributeNameOne: "attribute value"
 *     etc.
 *   }
 * ]
 * 
 * @author rdoherty
 */
public class SolrLoaderReporter extends AnswerDetailsReporter {

  @Override
  protected void writeResponseBody(OutputStream out, Procedure checkResponseSize) throws WdkModelException {

    // create output writer and initialize record stream
    try (JsonWriter writer = new JsonWriter(out);
         RecordStream records = RecordStreamFactory.getRecordStream(
            _baseAnswer, _attributes.values(), _tables.values())) {
      writer.array();
      for (RecordInstance record : records) {
        writer.value(formatRecord(record, _attributes.keySet(), _tables.keySet()));
        checkResponseSize.perform();
      }
      writer.endArray();
    }
    catch (IOException e) {
      throw new WdkModelException("Unable to write reporter result to output stream", e);
    }
  }

  private static JSONObject formatRecord(RecordInstance record,
      Set<String> attributeNames, Set<String> tableNames) throws WdkModelException {
    try {
      var obj = new JSONObject()
          .put(JsonKeys.ID, record.getPrimaryKey().getValues().values())
          .put("recordType", record.getRecordClass().getUrlSegment());
      for (String attributeName: attributeNames) {
        obj.put(attributeName, record.getAttributeValue(attributeName).getValue());
      }
      for (String tableName: tableNames) {
        obj.put(tableName, flattenTableValue(record.getTableValue(tableName)));
      }
      return obj;
    }
    catch (Exception e) {
      throw WdkModelException.translateFrom(e);
    }
  }

  private static JSONArray flattenTableValue(TableValue table) {
    return
      reduce(table, (arr1, row) ->
        reduce(row.values(), rSwallow((arr2, col) ->
          arr2.put(col.getValue())), arr1), new JSONArray());
  }
}
