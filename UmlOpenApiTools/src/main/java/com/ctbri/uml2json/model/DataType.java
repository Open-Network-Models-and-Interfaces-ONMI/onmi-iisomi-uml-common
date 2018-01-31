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

    public Object output(boolean isList,String prefix){
        //generate the data type json struct
        if(TYPE_NAME_UNIVERSALID.equals(name)){
            if(!isList) return "String";
            JSONArray array=new JSONArray();
            array.add("String");
            return array;
        }
        JSONObject obj=new JSONObject();
        for(OwnedAttr prop:properties){
            log(prefix+"call DataType:"+name+" 's attr:"+prop.getName()+ " type:"+prop.getTypeOf());
            obj.put(prop.getName(),prop.output(prefix+"    "));
        }
        if(!isList) return obj;
        JSONArray array=new JSONArray();
        array.add(obj);
        return array;
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
