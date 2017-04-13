package com.ctbri.uml2json.model;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.ctbri.uml2json.Main;
import org.apache.commons.lang3.StringUtils;

/**
 * Created by zhaogy on 2016/8/8.
 */
public class Param extends BaseClass {
    protected String name;
    protected boolean isPrimitive=true;
    protected boolean isList=false;
    protected String min="0";
    protected String max="1";// 1...*
    protected String typeName; //Enum,dataType's name,classes's name.
    protected String typeOf=TYPE_OF_STRING; //String,Integer,Boolean,classes,data_type,enumeration
    protected String typeId; //save type's id
    protected String defaultValue;
    protected String Comment="";
    protected boolean isPassByRef=false;

    public Param(String name){
        this.name=name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isPrimitive() {
        return isPrimitive;
    }

    public void setPrimitive(boolean primitive) {
        isPrimitive = primitive;
    }

    public boolean isList() {
        return isList;
    }

    public void setList(boolean list) {
        isList = list;
    }

    public String getMin() {
        return min;
    }

    public void setMin(String min) {
        this.min = min;
    }

    public String getMax() {
        return max;
    }

    public void setMax(String max) {
        this.max = max;
    }

    public String getTypeName() {
        return typeName;
    }

    public void setTypeName(String typeName) {
        this.typeName = typeName;
    }

    public String getTypeOf() {
        return typeOf;
    }

    public void setTypeOf(String typeOf) {
        this.typeOf = typeOf;
    }

    public String getDefaultValue() {
        return defaultValue;
    }

    public void setDefaultValue(String defaultValue) {
        this.defaultValue = defaultValue;
    }

    public String getComment() {
        return Comment;
    }

    public void setComment(String comment) {
        Comment = comment;
    }

    public String getTypeId() {
        return typeId;
    }

    public void setTypeId(String typeId) {
        this.typeId = typeId;
    }

    public boolean isPassByRef() {
        return isPassByRef;
    }

    public void setPassByRef(boolean passByRef) {
        isPassByRef = passByRef;
    }

    public Object output(String prefix){
       if(isPrimitive){
           //普通string，integer，boolean
            return packPrimitiveValue();
       }else{
            if(TYPE_OF_ENUM.equals(typeOf)){
                log(prefix+"call param:"+name+" 's enum:"+typeName);
                return Main.enumobjs.get(typeName).output(isList);
            }else if(TYPE_OF_DATATYPE.equals(typeOf)){
                log(prefix+"call param:"+name+" 's datatype:"+typeName);
                return Main.datatypes.get(typeName).output(isList,prefix+"  ");
            }else if(TYPE_OF_CLASSES.equals(typeOf)){
                log(prefix+"call param:"+name+" 's objclass:"+typeName);
                return Main.objclasses.get(typeName).output(isList,prefix+"  ");
            }
       }
        return "UNKONW_TYPE_"+typeOf;
    }

    protected Object packPrimitiveValue(){
        if(TYPE_OF_STRING.equals(typeOf)){
            if(isList){
                JSONArray array=new JSONArray();
                array.add(defaultValue!=null?defaultValue:TYPE_OF_STRING);
                return array;
            }else{
                return defaultValue!=null?defaultValue:TYPE_OF_STRING;
            }
        }else if(TYPE_OF_INTEGER.equals(typeOf)){
            if(isList){
                JSONArray array=new JSONArray();
                array.add(defaultValue!=null?formatInteger(defaultValue):TYPE_OF_INTEGER);
                return array;
            }else{
                return defaultValue!=null?formatInteger(defaultValue):TYPE_OF_INTEGER;
            }
        }else if(TYPE_OF_BOOLEAN.equals(typeOf)){
            if(isList){
                JSONArray array=new JSONArray();
                array.add(defaultValue!=null?formatBoolean(defaultValue):TYPE_OF_BOOLEAN);
                return array;
            }else{
                return defaultValue!=null?formatBoolean(defaultValue):TYPE_OF_BOOLEAN;
            }
        }else{
            if(isList){
                JSONArray array=new JSONArray();
                array.add("UNKNOWN_TYPE_"+typeOf);
                return array;
            }else{
                return "UNKNOWN_TYPE_"+typeOf;
            }
        }
    }
    protected Object formatInteger(String v){
        try {
            return Integer.valueOf(v);
        } catch (NumberFormatException e) {
            return TYPE_OF_INTEGER;
        }
    }
    protected Object formatBoolean(String v){
        try {
            return Boolean.parseBoolean(v);
        } catch (Exception e) {
            return TYPE_OF_BOOLEAN;
        }

    }

    public JSONObject outputSchema(){
        if(isPrimitive)      return packPrimitiveValue(isList);
        if(TYPE_OF_ENUM.equals(typeOf)){
            return Main.enumobjs.get(typeId).outputSchema(isList);
        }else{
            if(TYPE_NAME_UNIVERSALID.equals(typeName)) return  outputBasicSchema(isList,"string",false);
            if(isPassByRef) {
                return  outputBasicSchema(isList,"string",true);
            }
            return outputBasicSchema(isList,typeName,true);

        }
    }

    protected JSONObject packPrimitiveValue(boolean isList){
        if(TYPE_OF_STRING.equals(typeOf)){
            return outputBasicSchema(isList,SCHEMA_TYPE_STRING,false);
        }else if(TYPE_OF_INTEGER.equals(typeOf)){
            return outputBasicSchema(isList,SCHEMA_TYPE_INTEGER,false);
        }else if(TYPE_OF_BOOLEAN.equals(typeOf)){
            return outputBasicSchema(isList,SCHEMA_TYPE_BOOLEAN,false);
        }else{
            log("Param:"+getName()+"'s type is unknown type:"+typeOf);
            return outputBasicSchema(isList,"UNKNOWN_TYPE",false);
        }
    }

    protected JSONObject outputBasicSchema(boolean isList, String type, boolean isRef){
        JSONObject obj=new JSONObject();
        if(!isList){
            if(isRef){
                obj.put(SCHEMA_$REF,"#/definitions/"+type);
            }else{
                obj.put("type",type);
            }
            if(StringUtils.isNotEmpty(getComment())) obj.put(SCHEMA_DESCRIPTION,getComment());
            return obj;
        }
        JSONObject subobj=new JSONObject();
        if(isRef){
            subobj.put(SCHEMA_$REF,"#/definitions/"+type);
        }else{
            subobj.put("type",type);
        }
        obj.put("type",SCHEMA_TYPE_ARRAY);
        obj.put("items",subobj);
        return obj;
    }

    public boolean isRequired(){
        if(min.equals("0")) return false;
        return true;
    }
}
