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
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:fn="http://www.w3.org/2005/xpath-functions" xmlns:xmi="http://www.omg.org/spec/XMI/20131001" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:OpenModel_Profile="http:///schemas/OpenModel_Profile/_aG1hkAPxEeewDI5jM-81FA/21" xmlns:RootElement="http:///schemas/RootElement/_B4YnAGFbEeeiJ9-h1KDHig/45" xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore" xmlns:uml="http://www.eclipse.org/uml2/5.0.0/UML" xsi:schemaLocation="http:///schemas/OpenModel_Profile/_aG1hkAPxEeewDI5jM-81FA/21 OpenModel_Profile.profile.uml#_aG-rgAPxEeewDI5jM-81FA http:///schemas/RootElement/_B4YnAGFbEeeiJ9-h1KDHig/45 Experimental.profile.uml#_B4kNMGFbEeeiJ9-h1KDHig" xmlns:myfn="my:functions" exclude-result-prefixes="fn xmi uml myfn">
  <!-- defintion of output -->
  <xsl:output method="text" version="1.0" encoding="UTF-8" indent="yes"/>
  <!-- key definitions -->
  <xsl:key name="nodeById" match="*" use="@xmi:id"/>
  <!-- start templates -->
  <xsl:template match="xmi:XMI">
    <xsl:text>Id,Type,Name,SourceId,SourceNode,Source,SourceType,SourceClass,TargetId,TargetNode,Target,TargetType,TargetClass</xsl:text>
    <xsl:text>&#xA;</xsl:text>
    <xsl:apply-templates select="//packagedElement"/>
  </xsl:template>
  <xsl:template match="packagedElement">
    <xsl:value-of select="@xmi:id"/>
    <xsl:text>,</xsl:text>
    <xsl:value-of select="@xmi:type"/>
    <xsl:text>,</xsl:text>
    <xsl:value-of select="@name"/>
    <xsl:text>,</xsl:text>
    <xsl:if test="@xmi:type = 'uml:Association'">
      <xsl:variable name="sourceId" select="fn:substring-before(@memberEnd, ' ')"/>
      <xsl:variable name="targetId" select="fn:substring-after(@memberEnd, ' ')"/>
      <xsl:variable name="associationSource" select="fn:key('nodeById', $sourceId)"/>
      <xsl:variable name="associationTarget" select="fn:key('nodeById', $targetId)"/>
      <!--
      <xsl:variable name="sourceClass" select="fn:key('nodeById', $associationSource/@type)"/>
      <xsl:variable name="targetClass" select="fn:key('nodeById', $associationTarget/@type)"/>
      -->
      <xsl:variable name="sourceClassId">
        <xsl:choose>
          <xsl:when test="fn:name( $associationSource ) = 'ownedAttribute'">
            <xsl:value-of select="$associationSource/../@xmi:id"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="$associationTarget/@type"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:variable>
      <xsl:variable name="targetClassId">
        <xsl:choose>
          <xsl:when test="fn:name( $associationTarget ) = 'ownedAttribute'">
            <xsl:value-of select="$associationTarget/../@xmi:id"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="$associationSource/@type"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:variable>
      <xsl:value-of select="$sourceId"/>
      <xsl:text>,</xsl:text>
      <xsl:value-of select="fn:name( $associationSource )"/>
      <xsl:text>,</xsl:text>
      <xsl:value-of select="$associationSource/@name"/>
      <xsl:text>,</xsl:text>
      <xsl:value-of select="$associationSource/@type"/>
      <xsl:text>,</xsl:text>
      <xsl:value-of select="fn:key('nodeById', $sourceClassId)/@name"/>
      <xsl:text>,</xsl:text>
      <xsl:value-of select="$targetId"/>
      <xsl:text>,</xsl:text>
      <xsl:value-of select="fn:name( $associationTarget )"/>
      <xsl:text>,</xsl:text>
      <xsl:value-of select="$associationTarget/@name"/>
      <xsl:text>,</xsl:text>
      <xsl:value-of select="$associationTarget/@type"/>
      <xsl:text>,</xsl:text>
      <xsl:value-of select="fn:key('nodeById', $targetClassId)/@name"/>
    </xsl:if>
    <xsl:text>&#xA;</xsl:text>
  </xsl:template>
</xsl:stylesheet>
