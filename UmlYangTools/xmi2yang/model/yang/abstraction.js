/**
 * Created by Administrator on 2017/3/28.
 */
function Abstration(id,clientid,supplier, comment, fileName) {
    this.id = id;
    this.clientid = clientid;
    this.supplier = supplier;
    //this.supplierfilename=supplierfilename;
    this.comment=comment;
    this.fileName = fileName;
}
module.exports = Abstration;
/*
for(var i = 0; i < augment.length; i++){
    for(var  j = 0; j < yangModule.length; j++){
        if(augment[i].fileName === yangModule[j].fileName){
            yangModule[j].children.push(augment[i]);
        }
    }
}*/
