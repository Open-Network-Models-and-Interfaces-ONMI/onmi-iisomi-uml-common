package com.ctbri.uml2json.model;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.ctbri.uml2json.Main;

/**
 * Created by zhaogy on 2016/8/18.
 */
public class OwnedAttr extends Param{
    private String aggregation;//shared means only using uuid, while composite using whole struct
    public OwnedAttr(String name){
        super(name);
    }
    public String getAggregation() {
        return aggregation;
    }

    public void setAggregation(String aggregation) {
        this.aggregation = aggregation;
    }



    public JSONObject outoutSchema(){
        if("shared".equals(aggregation)) {
            return outputBasicSchema(isList,formatTypeName(),typeOf,true,keyName);
        }
        return super.outputSchema();
    }
    public boolean isRefObj(){
        if(isPrimitive) return false;
        if(isPassByRef) return false;
        if(TYPE_OF_ENUM.equals(typeOf)) return false;
        if("shared".equals(aggregation)) return false;
        if(TYPE_NAME_UNIVERSALID.equals(typeName)) return false;
        return true;
    }



}
