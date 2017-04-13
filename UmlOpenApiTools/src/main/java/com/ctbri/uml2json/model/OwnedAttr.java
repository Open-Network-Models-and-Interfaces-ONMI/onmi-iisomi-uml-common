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
    private void minLoop(JSONArray array){
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
    public Object output(String prefix){
        if(isPrimitive){
            //普通string，integer，boolean
            return packPrimitiveValue();
        }else{
            //class,datatype,or enum
            if(TYPE_OF_ENUM.equals(typeOf)){
                log(prefix+"call attr:"+name+" 's enum:"+typeName);
                return Main.enumobjs.get(typeName).output(isList);
            }else{
                if("shared".equals(aggregation)){
                    if(!isList)  return "String";
                    JSONArray array=new JSONArray();
                    minLoop(array);
                    return array;
                }
                if(TYPE_OF_DATATYPE.equals(typeOf)){
                    log(prefix+"call attr:"+name+" 's datatype:"+typeName);
                    return Main.datatypes.get(typeName).output(isList,prefix+"    ");
                }else if(TYPE_OF_CLASSES.equals(typeOf)){
                    log(prefix+"call attr:"+name+" 's objclass:"+typeName);
                    return Main.objclasses.get(typeName).output(isList,prefix+"    ");
                }
            }
            return "INTERNAL_ERROR";
        }
    }

    public JSONObject outoutSchema(){
        if(isPrimitive)      return packPrimitiveValue(isList);
        if(TYPE_OF_ENUM.equals(typeOf)) return Main.enumobjs.get(typeId).outputSchema(isList);
        if("shared".equals(aggregation)){
            return outputBasicSchema(isList,"string",false);
        }else if(isPassByRef){
            return outputBasicSchema(isList,"string",false);
        }else{
            if(TYPE_NAME_UNIVERSALID.equals(typeName)){
                return outputBasicSchema(isList,"string",false);
            }
            return outputBasicSchema(isList,typeName,true);
        }
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
