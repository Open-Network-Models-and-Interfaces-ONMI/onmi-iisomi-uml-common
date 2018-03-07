package com.ctbri.uml2json;

import org.dom4j.DocumentException;


/**
 * Created by zhaogy on 2016/7/6.
 */
public interface UmlParser {
    public void parse() throws DocumentException;
  //  public void saveTo(String dirName);
    public void output(String dirName);
}
