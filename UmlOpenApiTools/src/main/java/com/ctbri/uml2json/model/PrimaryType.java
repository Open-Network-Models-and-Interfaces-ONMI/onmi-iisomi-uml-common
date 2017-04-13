package com.ctbri.uml2json.model;


import com.alibaba.fastjson.JSONObject;

import java.util.List;

/**
 * Created by Gary on 2017/3/23.
 */
public class PrimaryType extends BaseClass{
    private String name;
    private String comment;
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
    public PrimaryType(String name){
        this.name=name;
    }
    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public JSONObject propertySchema(){
        JSONObject obj=new JSONObject();
        JSONObject propObjs=new JSONObject();
        obj.put(SCHEMA_PROPERTIES,propObjs);
        return obj;
    }
}
