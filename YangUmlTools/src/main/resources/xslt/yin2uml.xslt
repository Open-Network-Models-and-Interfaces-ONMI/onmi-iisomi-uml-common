<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:fn="http://www.w3.org/2005/xpath-functions" xmlns:xmi="http://www.omg.org/spec/XMI/20131001" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore" xmlns:uml="http://www.eclipse.org/uml2/5.0.0/UML" xmlns:yin="urn:ietf:params:xml:ns:yang:yin:1" xmlns:yang="urn:ietf:params:xml:ns:yang:ietf-yang-types">
	<xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
	<xsl:param name="prefix" select="/yin:module/yin:prefix/@value"/>
	<xsl:template match="/">
		<xmi:XMI xmi:version="20131001">
			<xsl:apply-templates select="*"/>
		</xmi:XMI>
	</xsl:template>
	<xsl:template match="yin:module">
		<uml:Model xmi:id="{fn:generate-id()}" name="{@name}">
			<packageImport xmi:type="uml:PackageImport" xmi:id="{fn:generate-id()}pi">
				<importedPackage xmi:type="uml:Model" href="pathmap://UML_LIBRARIES/UMLPrimitiveTypes.library.uml#_0"/>
			</packageImport>
			<xsl:apply-templates select="yin:description"/>
			<packagedElement xmi:type="uml:Package" xmi:id="{fn:generate-id()}oc" name="ObjectClasses">
				<xsl:apply-templates select="//yin:container | //yin:list"/>
			</packagedElement>
			<packagedElement xmi:type="uml:Package" xmi:id="{fn:generate-id()}td" name="TypeDefinitions">
				<xsl:apply-templates select="//yin:typedef | //yin:identity"/>
				<xsl:apply-templates select="//yin:type[@name='enumeration']"/>
			</packagedElement>
		</uml:Model>
	</xsl:template>
	<xsl:template match="yin:container[fn:not( yin:status/@value = 'deprecated') ] | yin:list[fn:not( yin:status/@value = 'deprecated') ]">
		<packagedElement xmi:type="uml:Class" xmi:id="{fn:generate-id()}" name="{@name}">
			<xsl:apply-templates select="yin.description"/>
		</packagedElement>
	</xsl:template>
	<xsl:template match="yin:identity">
		<packagedElement xmi:type="uml:Enumeration" xmi:id="{fn:generate-id()}" name="{@name}">
			<xsl:apply-templates select="*"/>
		</packagedElement>
	</xsl:template>
	<xsl:template match="yin:type[@name='enumeration' and ../fn:not(yin:status/@value = 'deprecated')]">
		<packagedElement xmi:type="uml:Enumeration" xmi:id="{fn:generate-id(..)}" name="{../@name}">
			<xsl:apply-templates select="*"/>
		</packagedElement>
	</xsl:template>
	<xsl:template match="yin:enum">
		<ownedLiteral xmi:type="uml:EnumerationLiteral" xmi:id="{fn:generate-id()}" name="{@name}">
			<xsl:apply-templates select="*"/>
		</ownedLiteral>
	</xsl:template>
	<xsl:template match="yin:text">
		<body>
			<xsl:value-of select="."/>
		</body> 
	</xsl:template>
	<xsl:template match="yin:description">
		<ownedComment xmi:type="uml:Comment" xmi:id="{fn:generate-id(.)}" annotatedElement="{fn:generate-id(..)}">
			<xsl:apply-templates select="*"/>
		</ownedComment> 
	</xsl:template>
	<xsl:template match="yin:typedef[ fn:not(yin:status/@value = 'deprecated')]">
		<packagedElement xmi:type="uml:DataType" xmi:id="{fn:generate-id()}" name="{$prefix}:{@name}">
			<xsl:apply-templates select="*"/>
		</packagedElement>
	</xsl:template>
	<xsl:template match="yin:type">
		<xsl:choose>
			<xsl:when test="@name = 'string' ">
				<type xmi:type="uml:PrimitiveType" href="pathmap://UML_LIBRARIES/UMLPrimitiveTypes.library.uml#String"/>
			</xsl:when>
			<xsl:when test="@name = 'int8' ">
				<type xmi:type="uml:PrimitiveType" href="pathmap://UML_LIBRARIES/UMLPrimitiveTypes.library.uml#Integer"/>
			</xsl:when>
			<xsl:when test="@name = 'int16' ">
				<type xmi:type="uml:PrimitiveType" href="pathmap://UML_LIBRARIES/UMLPrimitiveTypes.library.uml#Integer"/>
			</xsl:when>
			<xsl:when test="@name = 'int32' ">
				<type xmi:type="uml:PrimitiveType" href="pathmap://UML_LIBRARIES/UMLPrimitiveTypes.library.uml#Integer"/>
			</xsl:when>
			<xsl:when test="@name = 'int64' ">
				<type xmi:type="uml:PrimitiveType" href="pathmap://UML_LIBRARIES/UMLPrimitiveTypes.library.uml#Integer"/>
			</xsl:when>
			<xsl:when test="@name = 'uint8' ">
				<type xmi:type="uml:PrimitiveType" href="pathmap://UML_LIBRARIES/UMLPrimitiveTypes.library.uml#Integer"/>
			</xsl:when>
			<xsl:when test="@name = 'uint16' ">
				<type xmi:type="uml:PrimitiveType" href="pathmap://UML_LIBRARIES/UMLPrimitiveTypes.library.uml#Integer"/>
			</xsl:when>
			<xsl:when test="@name = 'uint32' ">
				<type xmi:type="uml:PrimitiveType" href="pathmap://UML_LIBRARIES/UMLPrimitiveTypes.library.uml#Integer"/>
			</xsl:when>
			<xsl:when test="@name = 'uint64' ">
				<type xmi:type="uml:PrimitiveType" href="pathmap://UML_LIBRARIES/UMLPrimitiveTypes.library.uml#Integer"/>
			</xsl:when>
			<xsl:when test="@name = 'object-identifier' ">
				<type xmi:type="uml:PrimitiveType" href="pathmap://UML_LIBRARIES/UMLPrimitiveTypes.library.uml#String"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:message>
					<xsl:value-of select="@name"/>
				</xsl:message>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template match="@*|*|text()">
		<!--
		<xsl:copy>
			<xsl:apply-templates select="@*|*|text()"/>
		</xsl:copy> -->
	</xsl:template>
</xsl:stylesheet>
