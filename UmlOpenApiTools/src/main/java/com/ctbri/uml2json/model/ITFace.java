package com.ctbri.uml2json.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by zhaogy on 2016/8/9.
 */
public class ITFace {
    private String name;
    private List<Operation> operations=new ArrayList<>();

    public ITFace(String name){
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<Operation> getOperations() {
        return operations;
    }

    public void addOperation(Operation operation){
        operations.add(operation);
    }


}
