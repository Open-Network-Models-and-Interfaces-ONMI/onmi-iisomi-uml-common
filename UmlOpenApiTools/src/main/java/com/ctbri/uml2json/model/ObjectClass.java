package com.ctbri.uml2json.model;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.ctbri.uml2json.Main;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by zhaogy on 2016/8/8.
 */
public class ObjectClass extends BaseClass {
    private String name;
    private String type= Param.TYPE_OF_CLASSES;
    private boolean isAbstract=false;
    private String generalization;
    private List<OwnedAttr> properties=new ArrayList<>();
    public ObjectClass(String name){
        this.name=name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public boolean isAbstract() {
        return isAbstract;
    }

    public void setAbstract(boolean anAbstract) {
        isAbstract = anAbstract;
    }

    public String getGeneralization() {
        return generalization;
    }

    public void setGeneralization(String generalization) {
        this.generalization = generalization;
    }

    public List getProperties() {
        return properties;
    }

    public void addProperty(OwnedAttr prop){
        properties.add(prop);
    }

    public Object output(boolean isList,String prefix){
        JSONObject obj=new JSONObject();
        if(generalization!=null){
            ObjectClass clazz= Main.objclasses.get(generalization);
            if(clazz!=null){
                for(OwnedAttr p:clazz.properties){
                    obj.put(p.getName(),p.output(prefix+"    "));
                }
            }
        }
        for(OwnedAttr prop:properties){
            log(prefix+"call class:"+name+" 's prop:"+prop.getName() +" type:"+prop.getTypeOf());
            obj.put(prop.getName(),prop.output(prefix+"    "));
        }
        if(!isList) return obj;
        JSONArray array=new JSONArray();
        array.add(obj);
        return array;
    }

    public JSONObject propertySchema(){
        JSONObject obj=new JSONObject(true);
        JSONObject props=new JSONObject();
        JSONArray isRequiredArr=new JSONArray();
        obj.put(SCHEMA_PROPERTIES,props);
        for(OwnedAttr attr:properties){
            props.put(attr.getName(),attr.outoutSchema());
            if(attr.isRequired()) isRequiredArr.add(attr.getName());
        }
        if(!isRequiredArr.isEmpty()) obj.put("required",isRequiredArr);
        if(!isAbstract && generalization!=null){
            ObjectClass clazz=Main.objclasses.get(generalization);
            if(clazz!=null){
                JSONObject refObj=new JSONObject();
                refObj.put(SCHEMA_$REF,"#/definitions/"+clazz.getName());
                JSONArray array=new JSONArray();
                array.add(refObj);
                array.add(obj);
                JSONObject allof=new JSONObject();
                allof.put(SCHEMA_ALLOF,array);
                return allof;
            }
        }
        return obj;
    }
}
