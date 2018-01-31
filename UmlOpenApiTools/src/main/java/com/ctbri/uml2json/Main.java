package com.ctbri.uml2json;


import com.ctbri.uml2json.model.*;

import java.io.File;
import java.io.FilenameFilter;
import java.util.*;

/**
 * Created by zhaogy on 2016/7/6.
 */
public class Main {
    public static Map<String,Uml2jsonParser> parserMap=new HashMap<>();
    public static LinkedHashMap<String,Enums> enumobjs=new LinkedHashMap<>();
    public static LinkedHashMap<String,DataType> datatypes=new LinkedHashMap<>();
    public static LinkedHashMap<String,ObjectClass> objclasses=new LinkedHashMap<>();
    public static LinkedHashMap<String,PrimaryType> primaryTypes=new LinkedHashMap<>();
    public static Map<String,Set<String>> refTables=new HashMap<>();
    public static Set<String> passByRefs=new HashSet<String>();
    public static boolean needLog=true;
    public static boolean hasError=false;

    public static void main(String[] args){

        String filePath;//"./test.xml";

        if(args.length<=0) {
            System.out.println("[WARN]NO Source directory given, default using current director");
            filePath="./";
        }else{
            filePath=args[0];
        }


        if(args.length>2) {
            try {
                needLog = Boolean.parseBoolean(args[2]);
            } catch (Exception e) {

            }
        }
        File filesDir=new File(filePath);
        if(filesDir.isFile()){
            filesDir=filesDir.getParentFile();
        }else if(!filesDir.isDirectory()){
            System.err.println("[ERROR]The first parameter:"+args[0]+" is not a valid path!");
            System.exit(1);
        }
        String savePath=filesDir.getAbsolutePath();
        if(args.length>1){
            savePath =args[1];
            File outputpath=new File(savePath);
            if(!outputpath.isDirectory()) {
                System.err.println("[ERROR]The second parameter: "+args[1]+" is not a valid path!");
                System.exit(1);
            }
        }

        File[] umlfiles=filesDir.listFiles(new FilenameFilter() {
            @Override
            public boolean accept(File dir, String name) {
                if(name.endsWith(".uml")) return true;
                return false;
            }
        });
        if(umlfiles.length<=0) {
            System.err.println("[WARN]No uml files found!");
            System.exit(1);
        }
        for(File f:umlfiles){
            try {
                Uml2jsonParser parser=new Uml2jsonParser(f);
                System.out.println("=================================================================");
                System.out.println("===============Parsing "+f.getName()+"=================");
                System.out.println("=================================================================");
                parser.parse();
                parserMap.put(f.getName().substring(0,f.getName().lastIndexOf(".")),parser);
            } catch (Exception e) {
                System.err.println("[ERROR]parse err:"+e);
                e.printStackTrace();
                System.exit(1);
            }
        }
        System.out.println("=================================================================");
        System.out.println("[INFO]checking reference deadlock......");
        System.out.println("=================================================================");
        checkDeadLockReference();
        if(hasError){
            System.exit(1);
        }
        System.out.println("=================================================================");
        System.out.println("[INFO]begin output result......=================================");
        System.out.println("=================================================================");
        for(Map.Entry<String,Uml2jsonParser> entry:parserMap.entrySet()){
            try {
                UmlParser parser=entry.getValue();
                System.out.println("[INFO]Handling "+entry.getKey()+"......");
                parser.output(savePath);
            } catch (Exception e) {
                System.err.println("[ERROR]output err:"+e);
                e.printStackTrace();
                System.exit(1);
            }
        }

    }

    private static void checkDeadLockReference(){
        for(String key:refTables.keySet()){
            Set<String> v=refTables.get(key);
            for(String s:v){
                if(refTables.containsKey(s) && refTables.get(s).contains(key)){
                    System.err.println("[ERROR]　The '"+key+ "' and '" + s +"' have endless loop!　They are using composite reference each other!");
                    hasError=true;
                }
            }
        }
    }


}
