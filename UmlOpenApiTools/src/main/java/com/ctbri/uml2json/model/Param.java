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
    protected String keyName;

    public String getKeyName() {
        return keyName;
    }

    public void setKeyName(String keyName) {
        this.keyName = keyName;
    }

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


    protected void minLoop(JSONArray array){
        if(min!=null){
            try{
                int loop=Integer.parseInt(min);
                if(loop==0) loop++;
                for(int i=0;i<loop;i++){
                    array.add("string");
                }
            }catch (Exception e){
                array.add("string");
            }
        }else{
            array.add("string");
        }
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

    public String formatTypeName(){
        if(Main.classLabeled){
            if(TYPE_OF_DATATYPE.equals(typeOf)) return typeName+Main.PREFIX_DATATYPE;
            if(TYPE_OF_CLASSES.equals(typeOf)) return typeName+Main.PREFIX_CLASS;
        }
        return typeName;
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
        if(TYPE_OF_ENUM.equals(typeOf)) return Main.enumobjs.get(typeId).outputSchema(isList);
        if(TYPE_NAME_UNIVERSALID.equals(typeName)) return outputBasicSchema(isList,"string",TYPE_OF_STRING,false,null);
        return outputBasicSchema(isList,formatTypeName(),typeOf,isPassByRef,keyName);

    }

    protected JSONObject packPrimitiveValue(boolean isList){
        if(TYPE_OF_STRING.equals(typeOf) || TYPE_OF_INTEGER.equals(typeOf) || TYPE_OF_BOOLEAN.equals(typeOf)){
            return outputBasicSchema(isList,typeName,typeOf,false,null);
        }else{
            logError("Param:"+getName()+"'s type is unknown type:"+typeOf);
            return outputBasicSchema(isList,typeName,"UNKNOWN_TYPE_"+typeOf,false,null);
        }
    }



    protected JSONObject outputBasicSchema(boolean isList,String typeName,String typeOf,boolean isPassByRef,String keyName){
        //keyName的值是来自当前这个作为参数的complexdatatype的keyname，而这个keyname又是来自它的子ownattr的某个标记为partOfKey的属性的名称
        JSONObject obj=new JSONObject();
        if(!isList){
            if(TYPE_OF_CLASSES.equals(typeOf)){
                if(isPassByRef){
                    obj.put("type","string");
                    if(StringUtils.isNotBlank(keyName)) {
                        obj.put("x-path","/"+typeName+"/"+keyName);
                    }
                }else{
                    obj.put(SCHEMA_$REF,"#/definitions/"+typeName);
                }
            }else if(TYPE_OF_DATATYPE.equals(typeOf)){
                obj.put(SCHEMA_$REF,"#/definitions/"+typeName);
            }else{
                /*if(isPassByRef){
                    obj.put(SCHEMA_$REF,"#/definitions/"+typeName);
                }else{
                    obj.put("type",typeName);
                }*/
                obj.put("type",typeOf);
            }
            if(StringUtils.isNotEmpty(getComment())) obj.put(SCHEMA_DESCRIPTION,getComment());
            return obj;
        }
        JSONObject subobj=new JSONObject();
        obj.put("type",SCHEMA_TYPE_ARRAY);
        obj.put("items",subobj);
        if(TYPE_OF_CLASSES.equals(typeOf)){
            if(isPassByRef){
                subobj.put("type","string");
                if(StringUtils.isNotBlank(keyName)) subobj.put("x-path","/"+typeName+"/"+keyName);
            }else{
                subobj.put(SCHEMA_$REF,"#/definitions/"+typeName);
                obj.put("x-key",keyName);
            }
        }else if(TYPE_OF_DATATYPE.equals(typeOf)){
            subobj.put(SCHEMA_$REF,"#/definitions/"+typeName);
            if(StringUtils.isNotBlank(keyName)){
                obj.put("x-key",keyName);
            }
        }else{
            //普通类型
            subobj.put("type",typeName);
            /*if(isPassByRef){
                subobj.put(SCHEMA_$REF,"#/definitions/"+typeName);
            }else{
                subobj.put("type",typeName);
            }*/
        }
        return obj;
    }

    public boolean isRequired(){
        if(min.equals("0")) return false;
        return true;
    }
}
