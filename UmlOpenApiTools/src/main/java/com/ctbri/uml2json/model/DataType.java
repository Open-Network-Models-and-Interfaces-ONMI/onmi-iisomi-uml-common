package com.ctbri.uml2json.model;



import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by zhaogy on 2016/8/8.
 */
public class DataType extends BaseClass {
    private String name;
    private List<OwnedAttr> properties=new ArrayList<>();
    private String comment;
    private String keyName;//当该dataType的某个ownedAttr被标记了partOfObjectKey=1的时候，keyName=那个attr的name
    public DataType(String name){
        this.name=name;
    }
    public void addProperty(OwnedAttr p){
        properties.add(p);
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<OwnedAttr> getProperties() {
        return properties;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getKeyName() {
        return keyName;
    }

    public void setKeyName(String keyName) {
        this.keyName = keyName;
    }



    public JSONObject propertySchema(){
        JSONObject obj=new JSONObject();
        JSONObject propObjs=new JSONObject();
        obj.put(SCHEMA_PROPERTIES,propObjs);
        JSONArray isRequiredArr=new JSONArray();
        for(OwnedAttr attr:properties){
            propObjs.put(attr.getName(),attr.outoutSchema());
            if(attr.isRequired()) {
                isRequiredArr.add(attr.getName());
            }
        }
        if(!isRequiredArr.isEmpty()) obj.put("required",isRequiredArr);
        return obj;
    }
}
