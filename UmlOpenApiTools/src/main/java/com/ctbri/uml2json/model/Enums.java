package com.ctbri.uml2json.model;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.dom4j.Element;

import java.util.List;

/**
 * Created by zhaogy on 2016/8/8.
 */
public class Enums extends BaseClass{
    private String name;
    private String type= Param.TYPE_OF_ENUM;
    private JSONArray properties=new JSONArray();
    private String comment;
    public void addProperty(String p){
        properties.add(p);
    }
    public Enums(String name){
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public JSONArray getProperties() {
        return properties;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Object output(boolean isList){
        if(!isList)  return StringUtils.join(properties.iterator(),"|");
        JSONArray array=new JSONArray();
        array.addAll(properties);
        return array;
    }

    public JSONObject outputSchema(boolean isList){
        JSONObject obj=new JSONObject(true);
        if(isList){
            JSONObject subobj=new JSONObject(true);
            subobj.put("type",SCHEMA_TYPE_STRING);
            subobj.put("enum",properties);
            obj.put("items",subobj);
            obj.put("type",SCHEMA_TYPE_ARRAY);
        }else{
            obj.put("type",SCHEMA_TYPE_STRING);
            obj.put("enum",properties);
        }
        return obj;
    }


}
