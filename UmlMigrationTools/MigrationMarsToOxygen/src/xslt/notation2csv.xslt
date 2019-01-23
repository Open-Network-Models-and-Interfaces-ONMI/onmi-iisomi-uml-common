<?xml version="1.0" encoding="UTF-8"?>
<!-- 
/*
 * (C) Copyright 2018 highstreet technologies (http://highstreet-technologies.com) and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Contributors:
 *     Martin Skorupski [martin.skorupski@highstreet-technologies.com]
 */
-->
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:fn="http://www.w3.org/2005/xpath-functions" xmlns:xmi="http://www.omg.org/XMI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:OpenModel_Profile="http:///schemas/OpenModel_Profile/_aG1hkAPxEeewDI5jM-81FA/21" xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore" xmlns:notation="http://www.eclipse.org/gmf/runtime/1.0.2/notation" xmlns:style="http://www.eclipse.org/papyrus/infra/viewpoints/policy/style" xmlns:uml="http://www.eclipse.org/uml2/5.0.0/UML" xsi:schemaLocation="http:///schemas/OpenModel_Profile/_aG1hkAPxEeewDI5jM-81FA/21 OpenModel_Profile.profile.uml#_aG-rgAPxEeewDI5jM-81FA" xmlns:myfn="my:functions" exclude-result-prefixes="fn notation xmi uml style myfn">
  <!-- defintion of output -->
  <xsl:output method="text" version="1.0" encoding="UTF-8" indent="yes"/>
  <!-- external parameters -->
  <xsl:param name="model">CoreModel</xsl:param>
  <xsl:param name="sourceFolder">.</xsl:param>
  <xsl:param name="xsltLogLevel">true</xsl:param>
  <!-- global variables -->
  <xsl:variable name="umlFile">
    <xsl:value-of select="$sourceFolder"/>
    <xsl:text>/</xsl:text>
    <xsl:value-of select="$model"/>
    <xsl:text>.uml</xsl:text>
  </xsl:variable>
  <xsl:variable name="umlLookup" select="fn:doc($umlFile)"/>
  <!-- key definitions -->
  <xsl:key name="nodeById" match="*" use="@xmi:id"/>
  <!-- start templates -->
  <xsl:template match="xmi:XMI">
    <xsl:text>Diagram,EdgeId,source,uml-source,target,uml-target,pointer2uml</xsl:text>
    <xsl:text>&#xA;</xsl:text>
    <xsl:apply-templates select="notation:Diagram/edges"/>
  </xsl:template>
  <xsl:template match="edges">
    <xsl:variable name="source" select="myfn:extractId(fn:key('nodeById', @source)/element/@href)"/>
    <xsl:variable name="target" select="myfn:extractId(fn:key('nodeById', @target)/element/@href)"/>
    <xsl:variable name="association" select="myfn:extractId( ./element[@xmi-type='uml:Association']/@href )"/>
    <xsl:variable name="memberEnd" select="fn:key('nodeById', $association, $umlLookup)/@memberEnd"/>
    <xsl:variable name="association-source" select="myfn:getObjectClass( $memberEnd, 'source' )"/>
    <xsl:variable name="association-target" select="myfn:getObjectClass( $memberEnd, 'target' )"/>
    <xsl:value-of select="../@name"/>
    <xsl:text>,</xsl:text>
    <xsl:value-of select="@xmi:id"/>
    <xsl:text>,</xsl:text>
    <xsl:choose>
      <xsl:when test="@source and @source != ''">
        <xsl:value-of select="@source"/>
        <xsl:text>,</xsl:text>
        <xsl:value-of select="$source"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>[no source],[no source]</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
    <xsl:text>,</xsl:text>
    <xsl:choose>
      <xsl:when test="@target and @target != ''">
        <xsl:value-of select="@target"/>
        <xsl:text>,</xsl:text>
        <xsl:value-of select="$target"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>[no target],[no target]</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
    <xsl:text>,</xsl:text>
    <xsl:apply-templates select="element"/>
    <xsl:text>,</xsl:text>
    <xsl:text>&#xA;</xsl:text>
  </xsl:template>
  <xsl:template match="element">
    <xsl:choose>
      <xsl:when test="@href">
        <xsl:value-of select="myfn:extractId(@href)"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>[notation internal]</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  <!-- functions -->
  <xsl:function name="myfn:extractId">
    <xsl:param name="string"/>
    <xsl:value-of select="fn:substring-after($string, '#')"/>
  </xsl:function>
  <xsl:function name="myfn:getObjectClass">
    <xsl:param name="memberEnd"/>
    <xsl:param name="memberEndType"/>
    <xsl:variable name="memberEndSource" select="fn:key('nodeById', fn:substring-before($memberEnd, ' '), $umlLookup )"/>
    <xsl:variable name="memberEndTarget" select="fn:key('nodeById', fn:substring-after($memberEnd, ' '), $umlLookup )"/>
    <xsl:choose>
      <xsl:when test="$memberEndType = 'source'">
        <xsl:value-of select="$memberEndSource"/>
      </xsl:when>
      <xsl:when test="$memberEndType = 'target'">
        <xsl:value-of select="$memberEndTarget"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>ERROR!</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>
</xsl:stylesheet>
