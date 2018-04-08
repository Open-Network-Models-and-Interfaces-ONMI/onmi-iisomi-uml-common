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
</xsl:stylesheet>