package com.ctbri.uml2json;


import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.ctbri.uml2json.model.*;
import com.ctbri.uml2json.util.JsonFormatTool;
import com.sun.istack.internal.Nullable;
import org.dom4j.*;
import org.dom4j.io.SAXReader;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;

public class Uml2jsonParser extends BaseClass implements UmlParser{

    private LinkedHashMap<String,ITFace> interfaces=new LinkedHashMap<>();
    private static QName qname_type = QName.get("type");
    private QName qname_xmitype =null;
    private static String OPERATION_PREFEX="/operations/";
    private Element root=null;
    private boolean isWindows=false;

    private File file;
    public Uml2jsonParser(File file){
        this.file=file;
        String osname=System.getProperty("os.name").toLowerCase();
        if(osname.indexOf("win")>=0) isWindows=true;
    }

    public void parse() throws DocumentException{
        SAXReader reader = new SAXReader();
        Document document = reader.read(file);
        root = document.getRootElement();
        qname_xmitype=QName.get("type", root.getNamespaceForPrefix("xmi"));
        Element pkgElement=root.element("Package");
        if(pkgElement==null){
            pkgElement=root.element("Model");
        }
        //String pkgName=pkgElement.attributeValue("name");


        //check dependence
        Element imports =(Element)pkgElement.selectSingleNode("./packagedElement[@name='Imports']");
        if(imports!=null) parseImports(imports);

        List<Element> passByRefs =(List<Element>)root.elements("PassedByReference");
        parsePassByRefs(passByRefs);

        Element typedefs =(Element)pkgElement.selectSingleNode("./packagedElement[@name='TypeDefinitions']");
        if(typedefs!=null) {
            parseEnumeration(typedefs);
            parseDataType(typedefs);
            parsePrimaryType(typedefs);
        }
        Element objclazzs =(Element)pkgElement.selectSingleNode("./packagedElement[@name='ObjectClasses']");
        if(objclazzs!=null){
            parseDataType(objclazzs);
            parseObjectClasses(objclazzs);
        }
        Element intfs =(Element)pkgElement.selectSingleNode("./packagedElement[@name='Interfaces']");
        if(intfs!=null) interfaces(intfs);
     }
    private void interfaces(Element e){
        List<Node> nodes =e.selectNodes("./packagedElement[@xmi:type='uml:Interface']");
        for(Node node:nodes){
            Element enode=(Element)node;
            ITFace itFace=new ITFace(enode.attributeValue("name"));
            interfaces.put(itFace.getName(),itFace);
            List<Element> opers=enode.elements("ownedOperation");
            for(Element oper:opers){
                Operation operObj=new Operation(oper.attributeValue("name"));
                List<Element> parameles=oper.elements("ownedParameter");
                for(Element param:parameles){
                    Param paramObj=new Param(param.attributeValue("name"));
                    String direction=param.attributeValue("direction");
                    handlePropValues(paramObj,param);
                    if(direction!=null && "out".equals(direction)){
                        operObj.addParams(paramObj,true);
                    }else{
                        operObj.addParams(paramObj,false);
                    }
                }
                itFace.addOperation(operObj);
            }
        }
    }
    private void parseImports(Element e){
        if(e==null) return;
        List<Node> imports =e.selectNodes("./packageImport[@xmi:type='uml:PackageImport']");
        for(Node imp:imports){
            Element ev=(Element)imp.selectSingleNode("./importedPackage");
            String href=ev.attributeValue("href").split("#")[0];
            log("it depend on :"+href+", try to parse......");
            if(!Main.parserMap.containsKey(href.substring(0,href.lastIndexOf(".")))){
                try {
                    File pfile=new File(file.getParent()+File.separator+href);
                    if(!pfile.exists()){
                        System.err.print("Can't find dependent file:"+href);
                        System.exit(1);
                    }
                    new Uml2jsonParser(pfile).parse();
                } catch (DocumentException e1) {
                    logError("Parse error with: "+href);
                    e1.printStackTrace();
                    System.exit(1);
                }
            }else{
                log("dependent file has been already parsed ever,using cache!!!");
            }
        }
    }
    private void parsePassByRefs(List<Element> passByRefs){
        if(passByRefs==null || passByRefs.isEmpty()) return;
        for(Element e:passByRefs){
            Main.passByRefs.add(e.attributeValue("base_StructuralFeature"));
        }
    }
    private void parsePrimaryType(Element e){
        List<Node> enums =e.selectNodes("./packagedElement[@xmi:type='uml:PrimitiveType']");
        if(enums==null) return;
        for(Node v:enums){
            Element ev=(Element)v;
            PrimaryType enu=new PrimaryType(ev.attributeValue("name"));
            Element coment=(Element)ev.selectSingleNode("./ownedComment/body");
            if(coment!=null) {
                enu.setComment(coment.getStringValue());
            }
            Main.primaryTypes.put(ev.attributeValue("id"),enu);
        }
    }
    private  void parseEnumeration(Element e){
        List<Node> enums =e.selectNodes("./packagedElement[@xmi:type='uml:Enumeration']");
        if(enums==null) return;
        for(Node v:enums){
            Element ev=(Element)v;
            Enums enu=new Enums(ev.attributeValue("name"));
            List<Element> values=ev.elements("ownedLiteral");
            for(Element vv:values){
                enu.addProperty(vv.attributeValue("name"));
            }
            Element coment=(Element)ev.selectSingleNode("./ownedComment/body");
            if(coment!=null) {
                enu.setComment(coment.getStringValue());
            }
            Main.enumobjs.put(ev.attributeValue("id"),enu);
        }
    }
    private void parseDataType(Element e){
        List<Node> dts =e.selectNodes("./packagedElement[@xmi:type='uml:DataType']");
        for(Node dt:dts){
            Element ev=(Element)dt;
            DataType dataType=new DataType(ev.attributeValue("name"));
            List<Element> subevs=ev.elements("ownedAttribute");
            for(Element se:subevs){
                OwnedAttr attr=new OwnedAttr(se.attributeValue("name"));
                handleAttrValues(attr,se);
                dataType.addProperty(attr);
                if(attr.isRefObj()) {
                    addToRefTable(dataType.getName(),attr.getTypeName());
                }
            }
            Main.datatypes.put(ev.attributeValue("id"),dataType);
        }
    }

    private void handleAttrValues(OwnedAttr attr,Element se){
        handlePropValues(attr,se);
        setAggresgation(attr,se);
    }

    private void handlePropValues(Param prop, Element se){

        String typeAttr=se.attributeValue(qname_type);
        if(typeAttr==null || "".equals(typeAttr)){//如果type没有出现在属性中，那么应该含有子标签<type>
            if(se.element("type")==null){
                //连子标签<type>都没有，那对不起了！！！！
                //Main.hasError=true;
                logError(se.attributeValue("name")+" has no any type definition. treat it as string");
                prop.setPrimitive(true);
                prop.setTypeName(se.attributeValue("name"));
                prop.setTypeOf(TYPE_OF_STRING);
            }else{
                String typetype = se.element("type").attributeValue("type");
                typeAttr = se.element("type").attributeValue("href");
                if("uml:PrimitiveType".equals(typetype)){
                    prop.setPrimitive(true);
                    prop.setTypeName(se.attributeValue("name"));
                    setPrimitiveType(prop,typeAttr);
                }else{//complex data types
                    prop.setPrimitive(false);
                    setTypeById(prop,typeAttr.split("#")[1]);
                }
            }
        }else{
            prop.setPrimitive(false);
            setTypeById(prop,typeAttr);
        }
        if(Main.passByRefs.contains(se.attributeValue("id"))) prop.setPassByRef(true);
        Element defele=se.element("defaultValue");
        if(defele!=null){
            prop.setDefaultValue(defele.attributeValue("name"));
        }
        Element desp=(Element) se.selectSingleNode("./ownedComment/body");
        if(desp!=null){
            prop.setComment(desp.getStringValue());
        }
        setMinMax(prop,se);
    }


    private String getNameByTypeId(String typeId){
        Element e =(Element)root.selectSingleNode("//packagedElement[@xmi:id='"+typeId+"']");
        if(e==null) {
            if(Main.enumobjs.containsKey(typeId)) return Main.enumobjs.get(typeId).getName();
            if(Main.datatypes.containsKey(typeId)) return Main.datatypes.get(typeId).getName();
            if(Main.objclasses.containsKey(typeId)) return Main.objclasses.get(typeId).getName();
            if(Main.primaryTypes.containsKey(typeId)) return Main.primaryTypes.get(typeId).getName();
            return null;
        }
        return e.attributeValue("name");
    }
    private void setTypeById(Param obj, String typeId){
        Element e =(Element)root.selectSingleNode("//packagedElement[@xmi:id='"+typeId+"']");
        if(e!=null) {
            obj.setTypeId(typeId);
            obj.setTypeName(e.attributeValue("name"));
            String tpo=e.attributeValue(qname_xmitype);
            if("uml:Class".equals(tpo)){
                obj.setTypeOf(TYPE_OF_CLASSES);
            }else if("uml:DataType".equals(tpo)){
                obj.setTypeOf(TYPE_OF_DATATYPE);
            }else if("uml:Enumeration".equals(tpo)){
                obj.setTypeOf(TYPE_OF_ENUM);
            }else if("uml:PrimitiveType".equals(tpo)){
                obj.setTypeOf(TYPE_OF_STRING);
            }else if("uml:Signal".equals(tpo)){
                System.out.println(e.attributeValue("name")+" type is uml:Signal, treat it as Class");
                obj.setTypeOf(TYPE_OF_CLASSES);
            }else{
                logError("Unexcepted type:"+tpo+" whose id is:"+typeId);
                System.exit(1);
            }
        }else{
            //The definition need to be found in static collections
            findInStaticCollections(typeId,obj);
        }
    }
    private void findInStaticCollections(String id,Param obj){
        if(Main.enumobjs.containsKey(id)){
            obj.setTypeOf(TYPE_OF_ENUM);
            obj.setTypeName(Main.enumobjs.get(id).getName());
            obj.setTypeId(id);
        }else if(Main.datatypes.containsKey(id)){
            obj.setTypeOf(TYPE_OF_DATATYPE);
            obj.setTypeName(Main.datatypes.get(id).getName());
            obj.setTypeId(id);
        }else if(Main.objclasses.containsKey(id)){
            obj.setTypeOf(TYPE_OF_CLASSES);
            obj.setTypeName(Main.objclasses.get(id).getName());
            obj.setTypeId(id);
        }else if(Main.primaryTypes.containsKey(id)){
            obj.setTypeOf(TYPE_OF_STRING);
            obj.setTypeName(Main.primaryTypes.get(id).getName());
            obj.setTypeId(id);
        }else{
            logError("Can not find the id:"+id+" in all definitions of Enum,DataType,ObjectClass. Pls check "+file.getName());
            System.exit(1);
        }
    }
    private void parseObjectClasses(Element e){
        List<Node> nodes =e.selectNodes("./packagedElement[@xmi:type='uml:Class']");
        for(Node node:nodes){
            Element enode=(Element)node;
            ObjectClass oc=new ObjectClass(enode.attributeValue("name"));
            Main.objclasses.put(enode.attributeValue("id"),oc);
            if("true".equals(enode.attributeValue("isAbstract"))) {
                oc.setAbstract(true);
            }else{
                Element generalizationE=enode.element("generalization");
                if(generalizationE!=null){
                    //oc.setGeneralization(generalizationE.attributeValue("general"));
                    String tmpName=getNameByTypeId(generalizationE.attributeValue("general"));
                    if(tmpName!=null) {
                        oc.setGeneralization(generalizationE.attributeValue("general"));
                    }
                }
            }
            List<Element> attrs=enode.elements("ownedAttribute");
            for(Element attr:attrs){
                OwnedAttr prop=new OwnedAttr(attr.attributeValue("name"));
                handleAttrValues(prop,attr);
                oc.addProperty(prop);
                if(prop.isRefObj()) addToRefTable(oc.getName(),prop.getTypeName());
            }
        }
    }
    private void setAggresgation(OwnedAttr obj, Element attr){
        String aggregation = attr.attributeValue("aggregation");
        if(aggregation!=null){
            obj.setAggregation(aggregation);
        }
    }
    private void setMinMax(Param obj, Element e){
        Element lowerE=e.element("lowerValue");
        if(lowerE!=null) {
            String v=lowerE.attributeValue("value");
            if(v!=null) {
                obj.setMin(v);
            }
        }
        Element upperE=e.element("./upperValue");
        if(upperE!=null) {
            String x=upperE.attributeValue("value");
            if(x!=null){
                obj.setMax(x);
                try {
                    int tmax = Integer.parseInt(x);
                    if(tmax>1) obj.setList(true);
                }catch (Exception ee){
                    if("*".equals(x)) obj.setList(true);
                }
            }
        }
    }
    private void setPrimitiveType(Param obj, String type){
        if(type.endsWith(TYPE_OF_INTEGER)){
            obj.setTypeOf(TYPE_OF_INTEGER);
        }else if(type.endsWith(TYPE_OF_STRING)){
            obj.setTypeOf(TYPE_OF_STRING);
        }else if(type.endsWith(TYPE_OF_BOOLEAN)){
            obj.setTypeOf(TYPE_OF_BOOLEAN);
        }else{
            obj.setTypeOf("ERROR! Unknown primitive type: "+type+" Pls check "+file.getName());
            obj.setTypeOf(TYPE_OF_STRING);
            //System.exit(1);
        }
    }

 /*   public void saveTo(String dirName){
        try {
            FileWriter fw=new FileWriter(dirName+File.separator+"convert_result.html");
            fw.write("<html>"+newLine());
            fw.write("<header>"+newLine());
            fw.write("<link href='./css/bootstrap.min.css' rel='stylesheet'>"+newLine());
            fw.write("<link href='./css/font-awesome.min.css' rel='stylesheet'>"+newLine());
            fw.write("<link href='./css/base.css' rel='stylesheet'>"+newLine());
            fw.write("<link href='./css/font_useso.css' rel='stylesheet' type='text/css'>"+newLine());
            fw.write("</header>"+newLine());
            fw.write("<body>"+newLine());
            for(String key:interfaces.keySet()){
                List<Operation> list=interfaces.get(key).getOperations();
                fw.write("<h1>Interface: "+key+"</h1>");
                for(Operation op:list){
                    fw.write("<h3>Operation: "+op.getName()+"</h3>");
                    fw.write("<h4>POST URL: /baseURL/operations/"+op.getName()+"</h4>");
                    JSONObject result=op.output(true);
                    if(result==null){
                        fw.write("<h5>JSON body for input parameter: no content</h5>");
                    }else {
                        fw.write("<h5>JSON body for input parameter: </h5>");
                        fw.write("<div class='btfjson' style='padding:20px;border-right:solid 1px #ddd;border-top:solid 1px #ddd;border-left:solid 1px #ddd;border-bottom:solid 1px #ddd;border-radius:0;overflow-y:scroll; outline:none;'>" + op.output(true).toString() + "</div>");
                    }

                    result=op.output(false);
                    if(result==null){
                        fw.write("<h5>JSON body for output parameter: no content</h5>");
                    }else{
                        fw.write("<h5>JSON body for output parameter:</h5>");
                        fw.write("<div class='btfjson' style='padding:20px;border-right:solid 1px #ddd;border-top:solid 1px #ddd;border-left:solid 1px #ddd;border-bottom:solid 1px #ddd;border-radius:0;overflow-y:scroll; outline:none;'>"+result.toString()+"</div>");
                    }
                }
            }
            fw.write(newLine()+"<script src='./js/jquery.min.js'></script>");
            fw.write(newLine()+"<script src='./js/jquery.message.js'></script>");
            fw.write(newLine()+"<script src='./js/jquery.json.js'></script>");
            fw.write(newLine()+"<script src='./js/jquery.xml2json.js'></script>");
            fw.write(newLine()+"<script src='./js/jquery.json2xml.js'></script>");
            fw.write(newLine()+"<script src='./js/json2.js'></script>");
            fw.write(newLine()+"<script src='./js/jsonlint.js'></script>");
            fw.write(newLine()+"<script src='./js/jsonlint.js'></script>");
            fw.write(newLine()+"<script src='./js/formatjson.js'></script>");
            fw.write(newLine()+"</body>");
            fw.write(newLine()+"</html>");
            fw.close();
            log("File has been saved to "+dirName+File.separator+"convert_result.html !!!");
        } catch (IOException e) {
            log("write file fail:"+e);
        }


    }
    private String newLine(){
        if(isWindows) return "\r\n";
        return "\n";
    }
    */
    public void output(String dirName){
        FileWriter fw=null;
        try {
            String moduleName=file.getName().substring(0,file.getName().lastIndexOf("."));
            fw = new FileWriter(dirName+ File.separator+moduleName+"API.json");
            JSONObject object=new JSONObject(true);
            object.put("swagger","2.0");
            object.put("info",generateInfoObj("1.0.0",moduleName));
            object.put("host","localhost:8000");
            object.put("basePath","/restconf");
            object.put("schemes", JSONArray.parseArray("[\"http\"]"));
            JSONObject pathsObj=new JSONObject();
            JSONObject defsObj=new JSONObject();
            object.put("paths",pathsObj);
            object.put("definitions",defsObj);
            for(String key:interfaces.keySet()){
                List<Operation> list=interfaces.get(key).getOperations();
                for(Operation op:list){
                    JSONObject pathObj=new JSONObject();
                    pathsObj.put(OPERATION_PREFEX+moduleName+"Module-Interfaces-"+moduleName+"_"+key+"API:"+op.getName()+"/",pathObj);
                    JSONObject postObj=new JSONObject();
                    pathObj.put("post",postObj);

                    JSONObject responseObj=new JSONObject();
                    JSONArray  paramsArray=new JSONArray();
                    JSONObject paramObj=new JSONObject();
                    paramsArray.add(paramObj);
                    postObj.put("responses",responseObj);
                    JSONObject obj200=new JSONObject();
                    obj200.put("description","Successful operation");
                    obj200.put("schema",formRefObj(op.getName()+"RPCOutputSchema"));
                    responseObj.put("200",obj200);
                    postObj.put("description","Create operation of resource: "+op.getName());
                    postObj.put("summary","Create "+op.getName());
                    postObj.put("operationId","create"+op.getName());
                    postObj.put("parameters",paramsArray);
                    paramObj.put("required",op.getParams().size()>0?true:false);
                    paramObj.put("description",op.getName()+"body object");
                    paramObj.put("name",op.getName());
                    paramObj.put("in","body");
                    paramObj.put("schema",formRefObj(op.getName()+"RPCInputSchema"));
                    postObj.put("produces",JSONArray.parseArray("[\"application/json\"]"));
                    postObj.put("consumes",JSONArray.parseArray("[\"application/json\"]"));
                }
            }
            for(DataType dt:Main.datatypes.values()){
                defsObj.put(dt.getName(),dt.propertySchema());
            }
            for(ObjectClass oc:Main.objclasses.values()){
                defsObj.put(oc.getName(),oc.propertySchema());
            }
            for(PrimaryType pt:Main.primaryTypes.values()){
                defsObj.put(pt.getName(),pt.propertySchema());
            }
            for(String key:interfaces.keySet()){
                List<Operation> list=interfaces.get(key).getOperations();
                for(Operation op:list){
                    if(op.getParams().size()>0) {
                        defsObj.put(op.getName()+"RPCInputSchema",op.outputSchema(true));
                    }else{
                        defsObj.put(op.getName()+"RPCInputSchema",JSONObject.parseObject("{\"description\":\"This operation doesn't need parameter\"}"));
                    }
                    defsObj.put(op.getName()+"RPCOutputSchema",op.outputSchema(false));
                }
            }
            fw.write(JsonFormatTool.formatJson(object));
            log("File has been saved to "+dirName+File.separator+moduleName+"API.json");
        } catch (Exception e) {
            logError("write file fail:"+e);
            e.printStackTrace();
        }finally{
            if(fw!=null){
                try {
                    fw.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
    private JSONObject formRefObj(String path){
        JSONObject obj=new JSONObject();
        obj.put("$ref","#/definitions/"+path);
        return obj;
    }
    private JSONObject generateInfoObj(String version,String name){
        JSONObject obj=new JSONObject();
        obj.put("version","1.0.0");
        obj.put("description","TapiModule-Interfaces-"+name+"API generated from UML");
        obj.put("title","TapiModule-Interfaces-"+name+"API");
        return obj;
    }
}
