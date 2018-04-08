package com.ctbri.uml2json.model;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.ctbri.uml2json.Main;
import org.apache.commons.lang3.StringUtils;

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
    private String keyName;//当该class的某个ownedAttr被标记了partOfObjectKey=1的时候，keyName被赋值为那个attr的name,尤其是这个class里面可能没有，但其父类里面有
    public ObjectClass(String name){
        this.name=name;
    }

    public String getName() {
        return name;
    }

    public String formatName(){
        if(Main.classLabeled) return name+Main.PREFIX_CLASS;
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

    public String getKeyName() {
        return keyName;
    }

    public void setKeyName(String keyName) {
        this.keyName = keyName;
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
                if(clazz.getGeneralization()!=null){
                    clazz=Main.objclasses.get(clazz.getGeneralization());
                }
                JSONObject refObj=new JSONObject();
                refObj.put(SCHEMA_$REF,"#/definitions/"+clazz.formatName());
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
