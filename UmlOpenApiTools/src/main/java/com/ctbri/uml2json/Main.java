package com.ctbri.uml2json;


import com.ctbri.uml2json.model.*;

import java.io.*;
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
    public static Set<String> passByRefs=new HashSet<>();
    public static Set<String> partOfKeys=new HashSet<>();
    public static Map<String,String> allIds=new HashMap<>();
    public static boolean needLog=true;
    public static boolean hasError=false;
    public static boolean classLabeled=false;//是否dataType 和 objectclass最后输出的时候要加后缀  -d  -c,以表明这是datatype还是objectclass
    public static final String PREFIX_DATATYPE="-d";
    public static final String PREFIX_CLASS="-c";
    public static void main(String[] args){
        String filePath=null;
        if(args.length<1){
            System.err.println("[ERR]Invalid parameter! Run example:");
            System.err.println("Example 1:     java -jar uml2json.jar $inPath  $outPath  $subfixFlag");
            System.err.println("Example 2:     java -jar uml2json.jar $inPath  $outPath");
            System.err.println("Example 3:     java -jar uml2json.jar $inOutPath  $subfixFlag");
            System.err.println("Example 4:     java -jar uml2json.jar $inOutPath");
            System.err.println("$inPath: The parent directory of uml files  e.g.  d:/sourceDir");
            System.err.println("$outPath: Json file output path   e.g.  d:/targetDir");
            System.err.println("$inOutPath: Use same path for input and output");
            //System.err.println("$subfixFlag: Force to add subfix '-d','-c' for DataType and ObjectClass?  (fixed value: yes)");
            System.err.println("$subfixFlag: Force to add subfix '-c' for ObjectClass?  (fixed value: yes)");
            System.out.println("Please run it again with proper parameter");
            System.exit(1);
        }else{
            filePath=args[0];
        }

        File filesDir=new File(filePath);
        if(filesDir.isFile()){
            filesDir=filesDir.getParentFile();
        }else if(!filesDir.isDirectory()){
            System.err.println("[ERROR]The first parameter:"+args[0]+" is not a valid path!");
            System.exit(1);
        }
        String savePath=filesDir.getAbsolutePath();
        if(args.length>2){
            if("yes".equalsIgnoreCase(args[2]))  classLabeled=true;
            savePath =args[1];
            File outputpath=new File(savePath);
            if(!outputpath.isDirectory()) {
                System.err.println("[ERROR]The second parameter: "+args[1]+" is not a valid path!");
                System.exit(1);
            }
        }else if(args.length==2){
            if("yes".equalsIgnoreCase(args[1])){
                classLabeled=true;
            }else{
                savePath =args[1];
                File outputpath=new File(savePath);
                if(!outputpath.isDirectory()) {
                    System.err.println("[ERROR]The second parameter: "+args[1]+" is not a valid path!");
                    System.exit(1);
                }
            }
        }


        List<File> umlfiles=getAllSubFiles(filesDir);
        if(umlfiles.size()<=0) {
            System.err.println("[WARN]No uml files found!");
            System.exit(1);
        }

        for(File f:umlfiles){
            if(parserMap.containsKey(f.getName().substring(0,f.getName().lastIndexOf(".")))) continue;
            try {
                Uml2jsonParser parser=new Uml2jsonParser(f);
                System.out.println("=================================================================");
                System.out.println("[INFO]Parsing "+f.getName()+"...");
                System.out.println("=================================================================");
                parser.parse();
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
        System.out.println("[INFO]begin output result......");
        System.out.println("=================================================================");
        for(Map.Entry<String,Uml2jsonParser> entry:parserMap.entrySet()){
            try {
                UmlParser parser=entry.getValue();
                if(((Uml2jsonParser)parser).canBeOutput()){
                    System.out.println("[INFO]Handling "+entry.getKey()+"......");
                    parser.output(savePath);
                }

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

    private static List<File> getAllSubFiles(File dir){
        List<File> files=new ArrayList<>();
        File[] subfiles=dir.listFiles();
        for(File f:subfiles){
            if(f.isDirectory()){
                files.addAll(getAllSubFiles(f));
            }else if(f.getName().endsWith("uml")){
                files.add(f);
            }
        }
       return files;
    }

    public static void saveId(String id,String filename){
        if(allIds.containsKey(id)){
            System.err.println("[ERROR]find duplicated id:"+id+" in "+filename+"! Conflict file:"+allIds.get(id));
            System.exit(1);
        }
        allIds.put(id,filename);
    }

}
