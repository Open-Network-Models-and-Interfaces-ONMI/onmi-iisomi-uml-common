<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:fn="http://www.w3.org/2005/xpath-functions" xmlns:myfn="my:functions" exclude-result-prefixes="xs fn myfn">
  <xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:param name="uml" select="fn:doc('./assoziations.xml')"/>
  <xsl:key name="nodeById" match="children[@xmi-type='notation:Shape']" use="@xmi-id"/>
  <xsl:key name="classById" match="class" use="@xmi-id"/>
  <xsl:key name="associationById" match="assoziation" use="@id"/>
  <xsl:template match="/">
    <edges>
      <xsl:message select="fn:name($uml/*)"/>
      <xsl:apply-templates select="//edges[element[@xmi-type = 'uml:Association']]"/>
    </edges>
  </xsl:template>
  <xsl:template match="edges">
    <xsl:variable name="source" select="myfn:extractId(fn:key('nodeById', @source)/element/@href)"/>
    <xsl:variable name="target" select="myfn:extractId(fn:key('nodeById', @target)/element/@href)"/>
    <edge id="{@xmi-id}" source="{$source}" target="{$target}">
      <xsl:apply-templates select="element">
        <xsl:with-param name="source" select="$source"/>
        <xsl:with-param name="target" select="$target"/>
      </xsl:apply-templates>
    </edge>
  </xsl:template>
  <xsl:template match="element">
    <xsl:param name="source"/>
    <xsl:param name="target"/>
    <xsl:variable name="association" select="myfn:extractId(@href)"/>
    <xsl:variable name="association-source" select="fn:key('associationById', $association, $uml)/@source"/>
    <xsl:variable name="association-target" select="fn:key('associationById', $association, $uml)/@target"/>
    <xsl:attribute name="association" select="$association"></xsl:attribute>
    <xsl:attribute name="association-source" select="$association-source"></xsl:attribute>
    <xsl:attribute name="association-target" select="$association-target"></xsl:attribute>
    <xsl:choose>
      <xsl:when test="$source = $target">
        <xsl:attribute name="filp" select="fn:false()"></xsl:attribute>
        <xsl:attribute name="reason">$source = $target</xsl:attribute>
      </xsl:when>
      <xsl:when test="$source = $association-target and $target = $association-source">
        <xsl:attribute name="filp" select="fn:true()"></xsl:attribute>
        <xsl:attribute name="reason">$source = $association-target and $target = $association-source</xsl:attribute>
      </xsl:when>
      <xsl:otherwise>
        <xsl:attribute name="filp" select="fn:false()"></xsl:attribute>
        <xsl:attribute name="reason">otherwise</xsl:attribute>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  <!-- functions -->
  <xsl:function name="myfn:extractId">
    <xsl:param name="string"/>
    <xsl:value-of select="fn:substring-after($string, '#')"/>
  </xsl:function>
</xsl:stylesheet>
