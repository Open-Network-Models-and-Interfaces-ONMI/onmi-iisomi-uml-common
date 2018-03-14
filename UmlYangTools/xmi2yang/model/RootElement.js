/**
 * Created by Administrator on 2017/4/14.
 */
function RootElement(id,name,multiplicity,description,fileName){
    this.id = id;
    this.name=name;
    this.multiplicity=multiplicity;
    this.description=description;
    this.fileName = fileName;
}

module.exports = RootElement;