/**
 * Created by Administrator on 2017/4/1.
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