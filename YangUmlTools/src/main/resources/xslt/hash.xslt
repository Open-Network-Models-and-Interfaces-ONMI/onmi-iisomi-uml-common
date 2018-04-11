<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
    xmlns:xs="http://www.w3.org/2001/XMLSchema" 
    xmlns:fn="http://www.w3.org/2005/xpath-functions" 
    xmlns:iisomi="https://wiki.opennetworking.org/display/OIMT/IISOMI" 
    xmlns:xmi="http://www.omg.org/spec/XMI/20131001" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
    xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore" 
    xmlns:uml="http://www.eclipse.org/uml2/5.0.0/UML" 
    xmlns:yin="urn:ietf:params:xml:ns:yang:yin:1" 
    xmlns:yang="urn:ietf:params:xml:ns:yang:ietf-yang-types" 
    xmlns:uuid="http://www.uuid.org" 
    xmlns:math="http://exslt.org/math">
    <xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
    <xsl:param name="prefix" select="/yin:module/yin:prefix/@value"/>
    <xsl:template match="/">
        <output>
            <uuid value="{iisomi:get-hash('hello-world')}"></uuid>
            <uuid value="{iisomi:get-hash('hello-world')}"></uuid>
            <uuid value="{iisomi:get-hash('hello-world')}"></uuid>
            <uuid value="{iisomi:get-hash('hello-world')}"></uuid>
        </output>
    </xsl:template>
    <!--
Functions in the uuid: namespace are used to calculate a hash from a string.
-->
    <!--
Returns the Hash
-->
    <xsl:function name="iisomi:get-hash" as="xs:string*">
        <xsl:param name="input-string"/>
        <xsl:variable name="output">
            <xsl:for-each select="fn:string-to-codepoints($input-string)">
                <xsl:value-of separator="" select="iisomi:dec-hex(.)"/>
            </xsl:for-each>
        </xsl:variable>
        <xsl:variable name="ts" select="fn:translate($output,' ', '')"/>
        <xsl:value-of separator="-" select="substring($ts, 8, 8),substring($ts, 4, 4),string-join((uuid:get-uuid-version(), substring($ts, 1, 3)), ''),            uuid:generate-clock-id(),            uuid:get-network-node()"/>
        <!--
            <xsl:value-of separator="" select="fn:translate($output,' ', '')"/>
-->
    </xsl:function>
    <xsl:function name="iisomi:dec-hex" as="xs:string*">
        <xsl:param name="index" />
        <xsl:if test="$index > 0">
            <xsl:value-of select="iisomi:dec-hex(fn:floor($index div 16))"/>
            <xsl:choose>
                <xsl:when test="$index mod 16 &lt; 10">
                    <xsl:value-of select="$index mod 16" />
                </xsl:when>
                <xsl:otherwise>
                    <xsl:choose>
                        <xsl:when test="$index mod 16 = 10">A</xsl:when>
                        <xsl:when test="$index mod 16 = 11">B</xsl:when>
                        <xsl:when test="$index mod 16 = 12">C</xsl:when>
                        <xsl:when test="$index mod 16 = 13">D</xsl:when>
                        <xsl:when test="$index mod 16 = 14">E</xsl:when>
                        <xsl:when test="$index mod 16 = 15">F</xsl:when>
                        <xsl:otherwise>A</xsl:otherwise>
                    </xsl:choose>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:if>
    </xsl:function>
</xsl:stylesheet>