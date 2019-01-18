<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:fn="http://www.w3.org/2005/xpath-functions">
  <xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:key name="objectById" match="*" use="@xmi-id"/>
  <xsl:key name="objectClassById" match="packagedElement[@xmi-type='uml:Class']" use="@xmi-id"/>
  <xsl:template match="/">
    <analyse>
      <assoziations>
        <xsl:apply-templates select="//packagedElement[@xmi-type='uml:Association']"/>
      </assoziations>
      <classes>
        <xsl:apply-templates select="//packagedElement[@xmi-type='uml:Class']"/>
      </classes>
    </analyse>
  </xsl:template>
  <xsl:template match="packagedElement[@xmi-type='uml:Class']">
    <class xmi-id="{@xmi-id}" name="{@name}"/>
  </xsl:template>
  <xsl:template match="packagedElement[@xmi-type='uml:Association']">
    <assoziation id="{@xmi-id}" name="{@name}">
      <xsl:call-template name="extractDetailsById">
        <xsl:with-param name="object" select="fn:key('objectById', fn:substring-before(@memberEnd, ' '))"/>
        <xsl:with-param name="attributeName">source</xsl:with-param>
      </xsl:call-template>
      <xsl:call-template name="extractDetailsById">
        <xsl:with-param name="object" select="fn:key('objectById', fn:substring-after(@memberEnd, ' '))"/>
        <xsl:with-param name="attributeName">target</xsl:with-param>
      </xsl:call-template>
    </assoziation>
  </xsl:template>
  <!-- functions -->
  <xsl:template name="extractDetailsById">
    <xsl:param name="object"/>
    <xsl:param name="attributeName"/>
    <xsl:choose>
      <xsl:when test="fn:name($object) = 'ownedEnd' or fn:name($object) = 'ownedAttribute'">
        <xsl:attribute name="{$attributeName}" select="fn:key('objectById', $object/@type )/@xmi-id"></xsl:attribute>
      </xsl:when>
      <xsl:otherwise>
        <xsl:message>
          <xsl:text>Ignored: </xsl:text>
          <xsl:value-of select="$object/@*"/>
        </xsl:message>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
</xsl:stylesheet>
