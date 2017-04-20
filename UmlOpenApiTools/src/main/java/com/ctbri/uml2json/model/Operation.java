package com.ctbri.uml2json.model;

import com.alibaba.fastjson.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by zhaogy on 2016/8/9.
 */
public class Operation extends BaseClass{
    private String name;
    private List<Param> params=new ArrayList<>();
    private List<Param> paramsOut=new ArrayList<>();
    public Operation(String name){
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<Param> getParams() {
        return params;
    }

    public void addParams(Param param, boolean isout) {
        if(!isout) {
            params.add(param);
        }else{
            paramsOut.add(param);
        }
    }


    public JSONObject output(boolean inflag){
        JSONObject obj=new JSONObject();
        List<Param> ps=inflag?params:paramsOut;
        if(ps.size()<1) return null;
        for(Param param:ps){
            log("generate params:"+param.getName()+" for operation:"+name);
            obj.put(param.getName(),param.output("    "));
        }
        return obj;
    }

    public JSONObject outputSchema(boolean inflag){
        JSONObject obj=new JSONObject();
        JSONObject props=new JSONObject(true);
        obj.put(SCHEMA_PROPERTIES,props);
        List<Param> ps=inflag?params:paramsOut;
        if(ps.size()<1) return obj;
        for(Param param:ps){
            props.put(param.getName(),param.outputSchema());
        }
        return obj;
    }
}
