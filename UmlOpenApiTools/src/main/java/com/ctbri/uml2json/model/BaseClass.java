package com.ctbri.uml2json.model;

import com.ctbri.uml2json.Main;

import java.util.HashSet;

/**
 * Created by zhaogy on 2016/9/7.
 */
public class BaseClass {
    public static final String TYPE_OF_ENUM="ENUMERATION";
    public static final String TYPE_OF_DATATYPE="DATA_TYPE";
    public static final String TYPE_OF_CLASSES="CLASSES";
    public static final String TYPE_OF_STRING="String";
    public static final String TYPE_OF_INTEGER="Integer";
    public static final String TYPE_OF_BOOLEAN="Boolean";

    public static final String TYPE_NAME_UNIVERSALID="UniversalId";
    public static final String SCHEMA_PROPERTIES="properties";
    public static final String SCHEMA_DESCRIPTION="description";
    public static final String SCHEMA_ALLOF="allOf";
    public static final String SCHEMA_$REF="$ref";
    public static final String SCHEMA_TYPE_STRING="string";
    public static final String SCHEMA_TYPE_BOOLEAN="boolean";
    public static final String SCHEMA_TYPE_INTEGER="integer";
    public static final String SCHEMA_TYPE_ARRAY="array";
    protected void log(String log){
       if(Main.needLog) System.out.println("[INFO]"+log);
    }
    protected void logError(String log){
       if(Main.needLog) System.err.println("[ERROR]"+log);
    }

    protected void addToRefTable(String k,String v){
        if(Main.refTables.containsKey(k)){
            Main.refTables.get(k).add(v);
        }else{
            HashSet<String> vc=new HashSet<String>();
            vc.add(v);
            Main.refTables.put(k,vc);
        }
    }
}
