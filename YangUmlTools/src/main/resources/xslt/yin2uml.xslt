<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
	xmlns:architecture="http://www.eclipse.org/papyrus/infra/core/architecture" 
	xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore" 
	xmlns:fn="http://www.w3.org/2005/xpath-functions" 
	xmlns:math="http://exslt.org/math" 
	xmlns:uml="http://www.eclipse.org/uml2/5.0.0/UML" 
	xmlns:xmi="http://www.omg.org/spec/XMI/20131001" 
	xmlns:xs="http://www.w3.org/2001/XMLSchema" 
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
	xmlns:yang="urn:ietf:params:xml:ns:yang:ietf-yang-types" 
	xmlns:yin="urn:ietf:params:xml:ns:yang:yin:1">
	<xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
	<xsl:param name="prefix" select="/yin:module/yin:prefix/@value"/>
	<!-- keys -->
	<xsl:key name="typedefByFullName" match="yin:typedef" use="fn:concat($prefix, ':', @name)"/>
	<xsl:key name="typedefByName" match="yin:typedef" use="@name"/>
	<xsl:key name="enumsByName" match="yin:enumeration" use="../@name"/>
	<!-- start templates -->
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
			</packagedElement>
			<packagedElement xmi:type="uml:Package" xmi:id="{fn:generate-id()}_{@name}" name="ClassDiagrams"/>
			<profileApplication xmi:type="uml:ProfileApplication" xmi:id="{fn:generate-id()}pa1">
				<eAnnotations xmi:type="ecore:EAnnotation" xmi:id="{fn:generate-id()}pa1ea1" source="PapyrusVersion">
					<details xmi:type="ecore:EStringToStringMapEntry" xmi:id="{fn:generate-id()}pa1ea1d1" key="Version" value="0.0.8"/>
					<details xmi:type="ecore:EStringToStringMapEntry" xmi:id="{fn:generate-id()}pa1ea1d2" key="Comment" value="ProfileLifecycle Profile v0.0.4 applied."/>
					<details xmi:type="ecore:EStringToStringMapEntry" xmi:id="{fn:generate-id()}pa1ea1d3" key="Copyright" value=""/>
					<details xmi:type="ecore:EStringToStringMapEntry" xmi:id="{fn:generate-id()}pa1ea1d4" key="Date" value="2017-08-16"/>
					<details xmi:type="ecore:EStringToStringMapEntry" xmi:id="{fn:generate-id()}pa1ea1d5" key="Author" value=""/>
				</eAnnotations>
				<eAnnotations xmi:type="ecore:EAnnotation" xmi:id="{fn:generate-id()}pa1ea2" source="http://www.eclipse.org/uml2/2.0.0/UML">
					<references xmi:type="ecore:EPackage" href="UmlProfiles/OpenInterfaceModelProfile/OpenInterfaceModel_Profile.profile.uml#_jdlJkIJYEee3epvelL_xvA"/>
				</eAnnotations>
				<appliedProfile xmi:type="uml:Profile" href="UmlProfiles/OpenInterfaceModelProfile/OpenInterfaceModel_Profile.profile.uml#_UbM6ILbyEeaufdfMFhfy_A"/>
			</profileApplication>
			<profileApplication xmi:type="uml:ProfileApplication" xmi:id="{fn:generate-id()}pa2">
				<eAnnotations xmi:type="ecore:EAnnotation" xmi:id="{fn:generate-id()}pa2ea1" source="PapyrusVersion">
					<details xmi:type="ecore:EStringToStringMapEntry" xmi:id="{fn:generate-id()}pa2ea1d1" key="Version" value="0.2.13"/>
					<details xmi:type="ecore:EStringToStringMapEntry" xmi:id="{fn:generate-id()}pa2ea1d2" key="Comment" value="ProfileLifecycle Profile v0.0.4 applied."/>
					<details xmi:type="ecore:EStringToStringMapEntry" xmi:id="{fn:generate-id()}pa2ea1d3" key="Copyright" value=""/>
					<details xmi:type="ecore:EStringToStringMapEntry" xmi:id="{fn:generate-id()}pa2ea1d4" key="Date" value="2017-08-16"/>
					<details xmi:type="ecore:EStringToStringMapEntry" xmi:id="{fn:generate-id()}pa2ea1d5" key="Author" value=""/>
				</eAnnotations>
				<eAnnotations xmi:type="ecore:EAnnotation" xmi:id="{fn:generate-id()}pa2ea2" source="http://www.eclipse.org/uml2/2.0.0/UML">
					<references xmi:type="ecore:EPackage" href="UmlProfiles/OpenModelProfile/OpenModel_Profile.profile.uml#_JpVIYIJYEee3epvelL_xvA"/>
				</eAnnotations>
				<appliedProfile xmi:type="uml:Profile" href="UmlProfiles/OpenModelProfile/OpenModel_Profile.profile.uml#_m1xqsHBgEd6FKu9XX1078A"/>
			</profileApplication>
			<profileApplication xmi:type="uml:ProfileApplication" xmi:id="{fn:generate-id()}pa3">
				<eAnnotations xmi:type="ecore:EAnnotation" xmi:id="{fn:generate-id()}pa3ea1" source="PapyrusVersion">
					<details xmi:type="ecore:EStringToStringMapEntry" xmi:id="{fn:generate-id()}pa3ea1d1" key="Version" value="0.0.4"/>
					<details xmi:type="ecore:EStringToStringMapEntry" xmi:id="{fn:generate-id()}pa3ea1d2" key="Comment" value="Metaclasses Property and Stereotype added via &lt;Element Import>."/>
					<details xmi:type="ecore:EStringToStringMapEntry" xmi:id="{fn:generate-id()}pa3ea1d3" key="Copyright" value=""/>
					<details xmi:type="ecore:EStringToStringMapEntry" xmi:id="{fn:generate-id()}pa3ea1d4" key="Date" value="2017-08-08"/>
					<details xmi:type="ecore:EStringToStringMapEntry" xmi:id="{fn:generate-id()}pa3ea1d5" key="Author" value=""/>
				</eAnnotations>
				<eAnnotations xmi:type="ecore:EAnnotation" xmi:id="{fn:generate-id()}pa3ea2" source="http://www.eclipse.org/uml2/2.0.0/UML">
					<references xmi:type="ecore:EPackage" href="UmlProfiles/ProfileLifecycleProfile/ProfileLifecycle_Profile.profile.uml#_AL3HsHweEee8oZaf2rRQlg"/>
				</eAnnotations>
				<appliedProfile xmi:type="uml:Profile" href="UmlProfiles/ProfileLifecycleProfile/ProfileLifecycle_Profile.profile.uml#_CBpGoEdZEearpawF38eisA"/>
			</profileApplication>
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
	<xsl:template match="yin:type[@name='enumeration' and ../fn:not(yin:status/@value = 'deprecated')]" mode="enums">
		<packagedElement xmi:type="uml:Enumeration" xmi:id="{fn:generate-id(.)}" name="{$prefix}:{../@name}-enums">
			<xsl:apply-templates select="*"/>
			<xsl:apply-templates select="../yin:description"/>
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
		<xsl:apply-templates select="yin:type[@name = 'enumeration']" mode="enums"/>
		
	</xsl:template>
	<xsl:template match="yin:type[fn:name(..) = 'typedef']">
		<ownedAttribute xmi:type="uml:Property" xmi:id="{fn:generate-id(.)}" name="{../@name}">
			<xsl:choose>
				<xsl:when test="@name = 'enumeration'">
					<xsl:attribute name="type" select="key('enumsByName', @name)/fn:generate-id(.)"/>
				</xsl:when>
				<xsl:when test="fn:not( fn:contains(@name, ':') ) and ( fn:contains('@binary@bits@boolean@decimal64@empty@enumeration@identityref@instance-identifier@int8@int16@int32@int64@leafref@string@uint8@uint16@uint32@uint64@union@', fn:concat('@', @name, '@') ) )">
					<type xmi:type="uml:DataType" href="YangBuildInTypes.uml#ybit:{@name}"/>
				</xsl:when>
				<xsl:when test="key('typedefByFullName', @name)">
					<xsl:attribute name="type" select="key('typedefByFullName', @name)/fn:generate-id(.)"/>
				</xsl:when>
				<xsl:when test="key('typedefByName', @name)">
					<xsl:attribute name="type" select="key('typedefByName', @name)/fn:generate-id(.)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:attribute name="type" select="@name"/>
				</xsl:otherwise>
			</xsl:choose>
		</ownedAttribute>
	</xsl:template>
	<xsl:template match="@*|*|text()">
		<!--
		<xsl:copy><xsl:apply-templates select="@*|*|text()"/></xsl:copy> -->
	</xsl:template>
</xsl:stylesheet>