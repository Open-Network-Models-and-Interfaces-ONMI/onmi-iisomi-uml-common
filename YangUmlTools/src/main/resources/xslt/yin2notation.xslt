<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
	xmlns:architecture="http://www.eclipse.org/papyrus/infra/core/architecture" 
	xmlns:css="http://www.eclipse.org/papyrus/infra/gmfdiag/css" 
	xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore" 
	xmlns:fn="http://www.w3.org/2005/xpath-functions" 
	xmlns:math="http://exslt.org/math" 
	xmlns:notation="http://www.eclipse.org/gmf/runtime/1.0.2/notation" 
	xmlns:style="http://www.eclipse.org/papyrus/infra/gmfdiag/style" 
	xmlns:uml="http://www.eclipse.org/uml2/5.0.0/UML" 
	xmlns:xmi="http://www.omg.org/spec/XMI/20131001" 
	xmlns:xs="http://www.w3.org/2001/XMLSchema" 
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
	xmlns:yang="urn:ietf:params:xml:ns:yang:ietf-yang-types" 
	xmlns:yin="urn:ietf:params:xml:ns:yang:yin:1">
	<xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
	<xsl:template match="/">
		<xmi:XMI xmi:version="2.0">
			<xsl:apply-templates select="*"/>
		</xmi:XMI>
	</xsl:template>
	<xsl:template match="yin:module">
		<notation:Diagram xmi:id="{fn:generate-id()}" type="PapyrusUMLClassDiagram" name="{@name}" measurementUnit="Pixel">
			<xsl:apply-templates select="//yin:typedef[yin:type/@name!='enumeration'] | //yin:identity"/>
			<xsl:apply-templates select="//yin:type[@name='enumeration']"/>
			<styles xmi:type="notation:StringValueStyle" xmi:id="{fn:generate-id()}dcv1" name="diagram_compatibility_version" stringValue="1.3.0"/>
			<styles xmi:type="notation:DiagramStyle" xmi:id="{fn:generate-id()}ds1"/>
			<styles xmi:type="style:PapyrusDiagramStyle" xmi:id="{fn:generate-id()}pds1" diagramKindId="org.eclipse.papyrus.uml.diagram.class">
				<owner xmi:type="uml:Package" href="{@name}.uml#{fn:generate-id()}_{@name}"/>
			</styles>
			<element xmi:type="uml:Package" href="{@name}.uml#{fn:generate-id()}_{@name}"/>
		</notation:Diagram>
		<css:ModelStyleSheets xmi:id="{fn:generate-id()}mss1">
			<stylesheets xmi:type="css:StyleSheetReference" xmi:id="{fn:generate-id()}mss1ssr1" path="/YangToUml/UmlProfiles/ClassDiagramStyleSheet.css"/>
		</css:ModelStyleSheets>
	</xsl:template>
	<xsl:template match="yin:type[fn:name(..) = 'typedef']">
		<children xmi:type="notation:Shape" xmi:id="{fn:generate-id()}ch1" type="Property_DataTypeAttributeLabel">
			<element xmi:type="uml:Property" href="{/yin:module/@name}.uml#{fn:generate-id(.)}"/>
			<layoutConstraint xmi:type="notation:Location" xmi:id="{fn:generate-id()}ch1lc1"/>
		</children>
	</xsl:template>
	<xsl:template match="yin:typedef[ fn:not(yin:status/@value = 'deprecated')]">
		<children xmi:type="notation:Shape" xmi:id="{fn:generate-id()}nch1" type="DataType_Shape">
			<children xmi:type="notation:DecorationNode" xmi:id="{fn:generate-id()}nch1ch1" type="DataType_NameLabel"/>
			<children xmi:type="notation:DecorationNode" xmi:id="{fn:generate-id()}nch1ch2" type="DataType_FloatingNameLabel">
				<layoutConstraint xmi:type="notation:Location" xmi:id="{fn:generate-id()}nch1ch2lc1" y="15"/>
			</children>
			<children xmi:type="notation:BasicCompartment" xmi:id="{fn:generate-id()}nch1ch3" type="DataType_AttributeCompartment">
				<xsl:apply-templates select="yin:type"/>
				<styles xmi:type="notation:TitleStyle" xmi:id="{fn:generate-id()}nch1ch3s1"/>
				<styles xmi:type="notation:SortingStyle" xmi:id="{fn:generate-id()}nch1ch3s2"/>
				<styles xmi:type="notation:FilteringStyle" xmi:id="{fn:generate-id()}nch1ch3s3"/>
				<layoutConstraint xmi:type="notation:Bounds" xmi:id="{fn:generate-id()}nch1ch3lr1"/>
			</children>
			<children xmi:type="notation:BasicCompartment" xmi:id="{fn:generate-id()}nch1ch4" type="DataType_OperationCompartment">
				<styles xmi:type="notation:TitleStyle" xmi:id="{fn:generate-id()}nch1ch4s1"/>
				<styles xmi:type="notation:SortingStyle" xmi:id="{fn:generate-id()}nch1ch4s2"/>
				<styles xmi:type="notation:FilteringStyle" xmi:id="{fn:generate-id()}nch1ch4s3"/>
				<layoutConstraint xmi:type="notation:Bounds" xmi:id="{fn:generate-id()}nch1ch4lc1"/>
			</children>
			<element xmi:type="uml:DataType" href="{/yin:module/@name}.uml#{fn:generate-id()}"/>
			<layoutConstraint xmi:type="notation:Bounds" xmi:id="{fn:generate-id()}nch1lc1" x="20" y="{20 + 120*(fn:position()-1)}" width="240" height="100"/>
		</children>
		<xsl:apply-templates select="yin:description">
			<xsl:with-param name="y" select="20 + 120*(fn:position()-1)"/>
		</xsl:apply-templates>
	</xsl:template>
	<xsl:template match="yin:description">
		<xsl:param name="y"/>
		<children xmi:type="notation:Shape" xmi:id="{fn:generate-id()}ch1" type="Comment_Shape">
			<children xmi:type="notation:DecorationNode" xmi:id="{fn:generate-id()}ch1ch1" type="Comment_BodyLabel"/>
			<element xmi:type="uml:Comment" href="{/yin:module/@name}.uml#{fn:generate-id()}"/>
			<layoutConstraint xmi:type="notation:Bounds" xmi:id="{fn:generate-id()}ch1lr1" x="280" y="{$y}" width="480"  height="100"/>
		</children>
	</xsl:template>
	<xsl:template match="@*|*|text()">
		<!--
		<xsl:copy><xsl:apply-templates select="@*|*|text()"/></xsl:copy> -->
	</xsl:template>
</xsl:stylesheet>