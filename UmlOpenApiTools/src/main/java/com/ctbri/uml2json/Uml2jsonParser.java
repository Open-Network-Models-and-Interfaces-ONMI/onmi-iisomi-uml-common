package com.ctbri.uml2json;


import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.ctbri.uml2json.model.*;
import com.ctbri.uml2json.util.JsonFormatTool;
import com.sun.istack.internal.Nullable;
import org.apache.commons.lang3.StringUtils;
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
    //private boolean isWindows=false;
    private boolean canBeOutput=false;//if current file has no any interface, then not output to json file

    public boolean canBeOutput() {
        return canBeOutput;
    }

    private File file;
    public Uml2jsonParser(File file){
        this.file=file;
        /*String osname=System.getProperty("os.name").toLowerCase();
        if(osname.indexOf("win")>=0) isWindows=true;*/
    }

    public void parse() throws DocumentException{
        SAXReader reader = new SAXReader();
        Document document = reader.read(file);
        root = document.getRootElement();
        //为了兼容Tapi各个版本以及联盟的版本，每个待解析的文件的根元素都不一样，有的是Model，有的是Package，还有的Profile，但Profile的暂时不处理
        qname_xmitype=QName.get("type", root.getNamespaceForPrefix("xmi"));
        Element pkgElement=root.element("Package");
        if(pkgElement==null){
            pkgElement=root.element("Model");
            if(pkgElement==null){
                pkgElement=root.element("Profile");
                if(pkgElement!=null){
                    //this is a OpenModel uml, skip it
                    return;
                }else{
                    //bad format
                    return;
                }
            }
        }

        //以前联盟版本是把所有文件都融在一个文件中，没有依赖文件的问题，但ONF的各个文件都拆出来了，彼此或有依赖性，所以首先要先解析imports指定的文件
        Element imports =(Element)pkgElement.selectSingleNode("./packagedElement[@name='Imports']");
        if(imports!=null) parseImports(imports);

        //有些class类型的object里面的object或许被标明了是composite复合类型，但uml文件的最后还要检查是否又被标明了PassedByReference即以传ID的形式取代实体类的形式。所以要提前加载以便后续使用它，将composite的类型替换为share类型
        List<Element> passByRefs =(List<Element>)root.elements("PassedByReference");
        parsePassByRefs(passByRefs);

        //提前记录所有partOfKey为1的元素
        List<Element>   partOfKeys=(List<Element>)root.selectNodes("OpenModel_Profile:OpenModelAttribute[@partOfObjectKey='1']");
        parsePartOfKeys(partOfKeys);

        //首先解析最基本的枚举、结构
        Element typedefs =(Element)pkgElement.selectSingleNode("./packagedElement[@name='TypeDefinitions']");
        if(typedefs!=null) {
            parseEnumeration(typedefs);
            parsePrimaryType(typedefs);
            parseDataType(typedefs);
        }else{
            typedefs =(Element)pkgElement.selectSingleNode("./packagedElement[@name='TypeDefs']");
            if(typedefs!=null) {
                parseEnumeration(typedefs);
                parsePrimaryType(typedefs);
                parseDataType(typedefs);
            }
        }
        //先解析Abstractclass
        Element objclazzs =(Element)pkgElement.selectSingleNode("./packagedElement[@name='ObjectClasses']");
        if(objclazzs!=null){
            parseDataType(objclazzs);
            System.out.print("ObjectClasse:");
            parseAbstractObjectClasses(objclazzs);
            parseObjectClasses(objclazzs);
            System.out.print("\n");
        }

        //最后解析接口Interface
        Element intfs =(Element)pkgElement.selectSingleNode("./packagedElement[@name='Interfaces']");
        if(intfs!=null) interfaces(intfs);
        Main.parserMap.put(file.getName().substring(0,file.getName().lastIndexOf(".")),this);
     }

    //解析最基础的枚举类型
    private  void parseEnumeration(Element e){
        List<Node> enums =e.selectNodes("./packagedElement[@xmi:type='uml:Enumeration']");
        if(enums==null) return;
        System.out.print("Enumeration:");
        for(Node v:enums){
            Element ev=(Element)v;
            Enums enu=new Enums(ev.attributeValue("name"));//枚举值的名字
            System.out.print("["+enu.getName()+"]");
            List<Element> values=ev.elements("ownedLiteral");
            for(Element vv:values){
                enu.addProperty(vv.attributeValue("name"));//追加枚举值
            }
            //注释
            Element coment=(Element)ev.selectSingleNode("./ownedComment/body");
            if(coment!=null) {
                enu.setComment(coment.getStringValue());
            }
            Main.enumobjs.put(ev.attributeValue("id"),enu);
            Main.saveId(ev.attributeValue("id"),file.getName());
        }
        System.out.print("\n");
    }
    private void interfaces(Element e){
        List<Node> nodes =e.selectNodes("./packagedElement[@xmi:type='uml:Interface']");
        if(nodes!=null && !nodes.isEmpty()) canBeOutput=true;
        System.out.print("Interface:");
        for(Node node:nodes){
            Element enode=(Element)node;
            ITFace itFace=new ITFace(enode.attributeValue("name"));
            System.out.print("["+itFace.getName()+"]");
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
        System.out.print("\n");
    }
    private void parseImports(Element e){
        if(e==null) return;
        List<Node> imports =e.selectNodes("./packageImport[@xmi:type='uml:PackageImport']");
        for(Node imp:imports){
            Element ev=(Element)imp.selectSingleNode("./importedPackage");
            String href=ev.attributeValue("href").split("#")[0];

            if(!Main.parserMap.containsKey(href.substring(0,href.lastIndexOf(".")))){
                log("It depend on :"+href+", try to parse......");
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
            }
        }
    }
    private void parsePassByRefs(List<Element> passByRefs){
        if(passByRefs==null || passByRefs.isEmpty()) return;
        for(Element e:passByRefs){
            Main.passByRefs.add(e.attributeValue("base_StructuralFeature"));
        }
    }
    private void parsePartOfKeys(List<Element> keys){
        if(keys==null || keys.isEmpty()) return;
        for(Element e:keys){
            Main.partOfKeys.add(e.attributeValue("base_StructuralFeature"));
        }
    }
    private void parsePrimaryType(Element e){
        List<Node> enums =e.selectNodes("./packagedElement[@xmi:type='uml:PrimitiveType']");
        if(enums==null || enums.isEmpty()) return;
        System.out.print("PrimaryType:");
        for(Node v:enums){
            Element ev=(Element)v;
            PrimaryType enu=new PrimaryType(ev.attributeValue("name"));
            System.out.print("["+enu.getName()+"]");
            String href=ev.attributeValue("href");
            if(href!=null){
                if(href.toLowerCase().endsWith(TYPE_OF_INTEGER)){
                    enu.setTypeOf(TYPE_OF_INTEGER);
                }else if(href.toLowerCase().endsWith(TYPE_OF_BOOLEAN)){
                    enu.setTypeOf(TYPE_OF_BOOLEAN);
                }
            }
            Element coment=(Element)ev.selectSingleNode("./ownedComment/body");
            if(coment!=null) {
                enu.setComment(coment.getStringValue());
            }
            Main.primaryTypes.put(ev.attributeValue("id"),enu);
        }
        System.out.print("\n");
    }

    private void parseDataType(Element e){
        List<Node> dts =e.selectNodes("./packagedElement[@xmi:type='uml:DataType']");
        if(dts==null || dts.isEmpty()) return;
        System.out.print("DataType:");
        for(Node dt:dts){
            Element ev=(Element)dt;
            DataType dataType=new DataType(ev.attributeValue("name"));
            System.out.print("["+dataType.getName()+"]");
            List<Element> subevs=ev.elements("ownedAttribute");
            for(Element se:subevs){
                OwnedAttr attr=new OwnedAttr(se.attributeValue("name"));
                handleAttrValues(attr,se);
                dataType.addProperty(attr);
                if(Main.partOfKeys.contains(ev.attributeValue("id"))){
                    dataType.setKeyName(se.attributeValue("name"));
                }
                if(attr.isRefObj()) {
                    addToRefTable(dataType.getName(),attr.getTypeName());
                }
            }
            Main.datatypes.put(ev.attributeValue("id"),dataType);
            Main.saveId(ev.attributeValue("id"),file.getName());
        }
        System.out.print("\n");
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
                logWarn(se.attributeValue("name")+" has no any type definition. treat it as string");
                prop.setPrimitive(true);
                prop.setTypeName(se.attributeValue("name"));
                prop.setTypeOf(TYPE_OF_STRING);
            }else{
                String typetype = se.element("type").attributeValue("type");
                String href = se.element("type").attributeValue("href");
                //should handle all these kind of type：
                //<type xmi:type="uml:PrimitiveType" href="pathmap://UML_LIBRARIES/UMLPrimitiveTypes.library.uml#String"/>
                //<type xmi:type="uml:PrimitiveType" href="TapiCommon.uml#_j2GU0N78EeW-BtRsuJPbqg"/>
                //<type xmi:type="uml:Enumeration" href="TapiCommon.uml#_i92HIL6PEeWRz-VHgA3LJQ"/>
                //<type xmi:type="uml:Class" href="TapiCommon.uml#_j2GU0N78EeW-BtRsuJPbqg"/>
                if(href.contains("PrimitiveTypes.library.uml")){
                    prop.setPrimitive(true);
                    prop.setTypeName(se.attributeValue("name"));
                    setPrimitiveType(prop,href.split("#")[1]);
                }else if("uml:PrimitiveType".equals(typetype)){
                    prop.setPrimitive(true);
                    setTypeById(prop,href.split("#")[1]);
                }else{
                    //other type : datatype or class
                    prop.setPrimitive(false);
                    setTypeById(prop,href.split("#")[1]);
                }

            }
        }else{
            //like this:  type="_j2GU0N78EeW-BtRsuJPbqg"
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
        //先在当前文件中查找id为该typeId的对象，如果找不到就到全局类Main中的cache大仓库里去找
        //Should search in the current file first,if get nothing, then search in memory which has been parsed and stored before.
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
                //当前所有packagedElement的PrimitiveType全都是string，还没发现有其他的类型
                obj.setPrimitive(true);
                obj.setTypeOf(TYPE_OF_STRING);
            }else if("uml:Signal".equals(tpo)){
                logWarn(e.attributeValue("name")+" type is uml:Signal, treat it as Class");
                obj.setTypeOf(TYPE_OF_CLASSES);
            }else{
                logError("Unexcepted type:"+tpo+" whose id is:"+typeId);
                System.exit(1);
            }
        }else{
            if(!findInStaticCollections(typeId,obj)) {
                logError("Can not find the id:\""+typeId+"\" in all definitions of Enum,DataType,ObjectClass. Please check "+file.getName());
                System.exit(1);
            }
        }
    }
    private boolean findInStaticCollections(String id,Param obj){
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
            obj.setPrimitive(true);
            obj.setTypeOf(TYPE_OF_STRING);
            obj.setTypeName(Main.primaryTypes.get(id).getName());
            obj.setTypeId(id);
        }else{
            return false;
        }
        return true;
    }
    private String getParentKeyName(String clazzId){
        //找到父类的keyName
        ObjectClass pclass=Main.objclasses.get(clazzId);
        if(pclass==null) return null;
        if(pclass.getGeneralization()==null){
            return pclass.getKeyName();
        }else{
            return getParentKeyName(pclass.getGeneralization());
        }
    }
    private void parseAbstractObjectClasses(Element e){
        List<Node> nodes =e.selectNodes("//packagedElement[@xmi:type='uml:Class' and @isAbstract='true']");
        if(nodes==null || nodes.isEmpty()) return;

        //先handle父类
        for(Node node:nodes){
            Element enode=(Element)node;
            Element generalizationE=enode.element("generalization");
            if(generalizationE!=null) continue;
            ObjectClass oc=new ObjectClass(enode.attributeValue("name"));
            System.out.print("["+oc.getName()+"]");
            Main.objclasses.put(enode.attributeValue("id"),oc);
            Main.saveId(enode.attributeValue("id"),file.getName());
            oc.setAbstract(true);
            List<Element> attrs=enode.elements("ownedAttribute");
            for(Element attr:attrs){
                OwnedAttr prop=new OwnedAttr(attr.attributeValue("name"));
                if(Main.partOfKeys.contains(attr.attributeValue("id")) && StringUtils.isBlank(oc.getKeyName())){
                    oc.setKeyName(attr.attributeValue("name"));
                }
                handleAttrValues(prop,attr);
                oc.addProperty(prop);
            }
        }
        //再处理继承abstract的子abstract类
        for(Node node:nodes){
            Element enode=(Element)node;
            Element generalizationE=enode.element("generalization");
            if(generalizationE==null) continue;
            ObjectClass oc=new ObjectClass(enode.attributeValue("name"));
            System.out.print("["+oc.getName()+"]");
            Main.objclasses.put(enode.attributeValue("id"),oc);
            Main.saveId(enode.attributeValue("id"),file.getName());
            oc.setAbstract(true);
            String tmpName=getNameByTypeId(generalizationE.attributeValue("general"));
            if(tmpName!=null) {
                oc.setGeneralization(generalizationE.attributeValue("general"));
                oc.setKeyName(getParentKeyName(oc.getGeneralization()));
            }
            List<Element> attrs=enode.elements("ownedAttribute");
            for(Element attr:attrs){
                OwnedAttr prop=new OwnedAttr(attr.attributeValue("name"));
                if(Main.partOfKeys.contains(attr.attributeValue("id")) && StringUtils.isBlank(oc.getKeyName())){
                    oc.setKeyName(attr.attributeValue("name"));
                }
                handleAttrValues(prop,attr);
                oc.addProperty(prop);
            }
        }
    }
    private void parseObjectClasses(Element e){
        List<Node> nodes =e.selectNodes("//packagedElement[@xmi:type='uml:Class']");
        for(Node node:nodes){
            Element enode=(Element)node;
            if("true".equals(enode.attributeValue("isAbstract")))  continue;
            ObjectClass oc=new ObjectClass(enode.attributeValue("name"));
            System.out.print("["+oc.getName()+"]");
            Main.objclasses.put(enode.attributeValue("id"),oc);
            Main.saveId(enode.attributeValue("id"),file.getName());
            Element generalizationE=enode.element("generalization");
            if(generalizationE!=null){
                String tmpName=getNameByTypeId(generalizationE.attributeValue("general"));
                if(tmpName!=null) {
                    oc.setGeneralization(generalizationE.attributeValue("general"));
                    oc.setKeyName(getParentKeyName(oc.getGeneralization()));
                }
            }
            List<Element> attrs=enode.elements("ownedAttribute");

            for(Element attr:attrs){
                OwnedAttr prop=new OwnedAttr(attr.attributeValue("name"));
                if(Main.partOfKeys.contains(attr.attributeValue("id")) && StringUtils.isBlank(oc.getKeyName())){
                    oc.setKeyName(attr.attributeValue("name"));
                }
                handleAttrValues(prop,attr);
                oc.addProperty(prop);
                if(prop.isRefObj()) addToRefTable(oc.getName(),prop.getTypeName());
                //如果当前这个attr的类型是DataType or objClass类型的时候，要为当前这个attr的keyName赋值,以便后续直接输出该属性的x-key|x-path
                if(TYPE_OF_DATATYPE.equals(prop.getTypeOf())){
                    DataType dt=Main.datatypes.get(prop.getTypeId());
                    prop.setKeyName(dt.getKeyName());
                }else if(TYPE_OF_CLASSES.equals(prop.getTypeOf())){
                   ObjectClass occ=Main.objclasses.get(prop.getTypeId());
                   if(occ!=null && StringUtils.isNotBlank(occ.getKeyName())) prop.setKeyName(occ.getKeyName());
                }

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
        Element upperE=e.element("upperValue");
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
        if(type.toLowerCase().endsWith(TYPE_OF_INTEGER)){
            obj.setTypeOf(TYPE_OF_INTEGER);
        }else if(type.toLowerCase().endsWith(TYPE_OF_STRING)){
            obj.setTypeOf(TYPE_OF_STRING);
        }else if(type.toLowerCase().endsWith(TYPE_OF_BOOLEAN)){
            obj.setTypeOf(TYPE_OF_BOOLEAN);
        }else if(type.toLowerCase().endsWith(TYPE_OF_FLOAT)){
            obj.setTypeOf(TYPE_OF_FLOAT);
        }else{
            logWarn("Unknown primitive type: "+type+",treat it as string. Pls check "+file.getName());
            obj.setTypeOf(TYPE_OF_STRING);
        }
    }

    public void output(String dirName){
        FileWriter fw=null;
        try {
            String moduleName=file.getName().substring(0,file.getName().lastIndexOf("."));
            fw = new FileWriter(dirName+ File.separator+moduleName+"API.json");
            JSONObject object=new JSONObject(true);
            object.put("swagger","2.0");
            object.put("info",generateInfoObj("2.0.0",moduleName));
            object.put("host","localhost");
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
                    //pathsObj.put(OPERATION_PREFEX+moduleName+"Module-Interfaces-"+moduleName+"_"+key+"API:"+op.getName()+"/",pathObj);
                    pathsObj.put(OPERATION_PREFEX+op.getName()+"/",pathObj);
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

            for(PrimaryType pt:Main.primaryTypes.values()){
                defsObj.put(pt.getName(),pt.propertySchema());
            }
            for(DataType dt:Main.datatypes.values()){
                //defsObj.put(Main.classLabeled?dt.getName()+Main.PREFIX_DATATYPE:dt.getName(),dt.propertySchema());
                defsObj.put(dt.getName(),dt.propertySchema());
            }
            for(ObjectClass oc:Main.objclasses.values()){
                defsObj.put(Main.classLabeled?oc.getName()+Main.PREFIX_CLASS:oc.getName(),oc.propertySchema());
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
        obj.put("version",version);
        obj.put("description","TapiModule-Interfaces-"+name+"API generated from UML");
        obj.put("title","TapiModule-Interfaces-"+name+"API");
        return obj;
    }
}
