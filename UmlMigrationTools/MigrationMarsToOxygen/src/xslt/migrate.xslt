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
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fn="http://www.w3.org/2005/xpath-functions" xmlns:notation="http://www.eclipse.org/gmf/runtime/1.0.2/notation" xmlns:xmi="http://www.omg.org/spec/XMI/20131001" xmlns:uml="http://www.eclipse.org/uml2/5.0.0/UML" xmlns:style="http://www.eclipse.org/papyrus/infra/viewpoints/policy/style" xmlns:myfn="my:functions" exclude-result-prefixes="fn notation xmi uml style myfn">
  <!-- imports -->
  <xsl:import href="./log.xslt"/>
  <!-- output definition -->
  <xsl:output method="xml" version="1.0" encoding="UTF-8" indent="no"/>
  <!-- external parameters -->
  <xsl:param name="model">model</xsl:param>
  <xsl:param name="sourceFolder">../../temp</xsl:param>
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
  <xsl:key name="nodeById" match="*" use="@xmi-id"/>
  <!-- start templates -->
  <xsl:template match="edges[element[@xmi-type = 'uml:Association']]">
    <xsl:variable name="source" select="myfn:extractId(fn:key('nodeById', @source)/element/@href)"/>
    <xsl:variable name="target" select="myfn:extractId(fn:key('nodeById', @target)/element/@href)"/>
    <xsl:variable name="association" select="myfn:extractId( ./element[@xmi-type='uml:Association']/@href )"/>
    <xsl:variable name="memberEnd" select="fn:key('nodeById', $association, $umlLookup)/@memberEnd"/>
    <xsl:variable name="association-source" select="myfn:getObjectClass( $memberEnd, 'source' )"/>
    <xsl:variable name="association-target" select="myfn:getObjectClass( $memberEnd, 'target' )"/>

<!--
      <xsl:message>
        <xsl:value-of select="myfn:umlName($source)"/>
        <xsl:text> - </xsl:text>
        <xsl:value-of select="myfn:umlName($target)"/>
        <xsl:text>&#xA;</xsl:text>
        <xsl:value-of select="myfn:umlName($association-source)"/>
        <xsl:text> - </xsl:text>
        <xsl:value-of select="myfn:umlName($association-target)"/>
        <xsl:text>&#xA;</xsl:text>
        <xsl:text>&#xA;</xsl:text>
      </xsl:message> -->
      <xsl:choose>
        <xsl:when test="$source = $target">
          <xsl:call-template name="log">
            <xsl:with-param name="level">DEBUG</xsl:with-param>
            <xsl:with-param name="message">
              <xsl:text>Source and target are identical, no need to flip: '</xsl:text>
              <xsl:value-of select="@xmi-id"/>
              <xsl:text>' - not modified</xsl:text>
            </xsl:with-param>
          </xsl:call-template>
          <xsl:copy>
            <xsl:apply-templates select="@* | node() | text()"/>
          </xsl:copy>
        </xsl:when>
        <xsl:when test="$source = $association-target and $target = $association-source">
          <xsl:call-template name="log">
            <xsl:with-param name="message">
              <xsl:text>Edge with assoziation-name='</xsl:text>
              <xsl:value-of select="fn:key('nodeById', $association, $umlLookup)/@name"/>
              <xsl:text>' and xmi:id='</xsl:text>
              <xsl:value-of select="@xmi-id"/>
              <xsl:text>' modified, because </xsl:text>
              <xsl:text>$source(</xsl:text>
              <xsl:value-of select="myfn:umlName($source)"/>
              <xsl:text>) = $association-target(</xsl:text>
              <xsl:value-of select="myfn:umlName($association-target)"/>
              <xsl:text>) and $target(</xsl:text>
              <xsl:value-of select="myfn:umlName($target)"/>
              <xsl:text>) = $association-source(</xsl:text>
              <xsl:value-of select="myfn:umlName($association-source)"/>
              <xsl:text>).</xsl:text>
            </xsl:with-param>
          </xsl:call-template>
          <xsl:copy>
            <xsl:apply-templates select="@*"/>
            <!-- overwrite source with target and vice versa -->
            <xsl:attribute name="source" select="@target"/>
            <xsl:attribute name="target" select="@source"/>
            <xsl:apply-templates select="node()[fn:not( fn:name() = 'sourceAnchor' or fn:name(.) = 'targetAnchor' ) ] | text()" mode="filp"/>
            <sourceAnchor xmi-type="{sourceAnchor/@xmi-type}" xmi-id="{sourceAnchor/@xmi-id}" id="{targetAnchor/@id}"/>
            <targetAnchor xmi-type="{targetAnchor/@xmi-type}" xmi-id="{targetAnchor/@xmi-id}" id="{sourceAnchor/@id}"/>
          </xsl:copy>
        </xsl:when>
        <xsl:when test="fn:not(@source) or @source = ''">
          <xsl:call-template name="log">
            <xsl:with-param name="level">DEBUG</xsl:with-param>
            <xsl:with-param name="message">
              <xsl:text>Edge with xmi:id='</xsl:text>
              <xsl:value-of select="@xmi-id"/>
              <xsl:text>' has no source.</xsl:text>
              <xsl:text> - not modified</xsl:text>
            </xsl:with-param>
          </xsl:call-template>
          <xsl:copy>
            <xsl:apply-templates select="@* | node() | text()"/>
          </xsl:copy>
        </xsl:when>
        <xsl:when test="fn:not(@target) or @target = ''">
          <xsl:call-template name="log">
            <xsl:with-param name="level">DEBUG</xsl:with-param>
            <xsl:with-param name="message">
              <xsl:text>Edge with xmi:id='</xsl:text>
              <xsl:value-of select="@xmi-id"/>
              <xsl:text>' has no target.</xsl:text>
              <xsl:text> - not modified</xsl:text>
            </xsl:with-param>
          </xsl:call-template>
          <xsl:copy>
            <xsl:apply-templates select="@* | node() | text()"/>
          </xsl:copy>
        </xsl:when>
        <xsl:when test="fn:not($source) or $source = ''">
          <xsl:call-template name="log">
            <xsl:with-param name="level">DEBUG</xsl:with-param>
            <xsl:with-param name="message">
              <xsl:text>Edge with xmi:id='</xsl:text>
              <xsl:value-of select="@xmi-id"/>
              <xsl:text>' and source='</xsl:text>
              <xsl:value-of select="@target"/>
              <xsl:text>' has no source class element in UML.</xsl:text>
              <xsl:text> - not modified</xsl:text>
            </xsl:with-param>
          </xsl:call-template>
          <xsl:copy>
            <xsl:apply-templates select="@* | node() | text()"/>
          </xsl:copy>
        </xsl:when>
        <xsl:when test="fn:not($target) or $target = ''">
          <xsl:call-template name="log">
            <xsl:with-param name="level">DEBUG</xsl:with-param>
            <xsl:with-param name="message">
              <xsl:text>Edge with xmi:id='</xsl:text>
              <xsl:value-of select="@xmi-id"/>
              <xsl:text>' and target='</xsl:text>
              <xsl:value-of select="@source"/>
              <xsl:text>' has no target class element in UML.</xsl:text>
            </xsl:with-param>
          </xsl:call-template>
          <xsl:copy>
            <xsl:apply-templates select="@* | node() | text()"/>
          </xsl:copy>
        </xsl:when>
        <xsl:when test="fn:not(key('nodeById', $source, $umlLookup))">
          <xsl:call-template name="log">
            <xsl:with-param name="level">INFO </xsl:with-param>
            <xsl:with-param name="message">
              <xsl:text>Edge with xmi:id='</xsl:text>
              <xsl:value-of select="@xmi-id"/>
              <xsl:text>' has invalid source: '</xsl:text>
              <xsl:value-of select="$source"/>
              <xsl:text>' Corresponding uml node not found - not modified</xsl:text>
            </xsl:with-param>
          </xsl:call-template>
          <xsl:copy>
            <xsl:apply-templates select="@* | node() | text()"/>
          </xsl:copy>
        </xsl:when>
        <xsl:when test="fn:not(key('nodeById', $target, $umlLookup))">
          <xsl:call-template name="log">
            <xsl:with-param name="level">INFO </xsl:with-param>
            <xsl:with-param name="message">
              <xsl:text>Edge with xmi:id='</xsl:text>
              <xsl:value-of select="@xmi-id"/>
              <xsl:text>' has invalid target: '</xsl:text>
              <xsl:value-of select="$target"/>
              <xsl:text>' Corresponding uml node not found (It might be referencing another UML model) - not modified</xsl:text>
            </xsl:with-param>
          </xsl:call-template>
          <xsl:copy>
            <xsl:apply-templates select="@* | node() | text()"/>
          </xsl:copy>
        </xsl:when>
        <xsl:when test="fn:not($association) or $association = ''">
          <xsl:call-template name="log">
            <xsl:with-param name="level">DEBUG</xsl:with-param>
            <xsl:with-param name="message">
              <xsl:text>Edge with xmi:id='</xsl:text>
              <xsl:value-of select="@xmi-id"/>
              <xsl:text>' has no association-id in UML: '</xsl:text>
              <xsl:value-of select="./element[@xmi-type='uml:Association']/@href"/>
              <xsl:text>' - not modified</xsl:text>
            </xsl:with-param>
          </xsl:call-template>
          <xsl:copy>
            <xsl:apply-templates select="@* | node() | text()"/>
          </xsl:copy>
        </xsl:when>
        <xsl:when test="fn:not($memberEnd) or $memberEnd = ''">
          <xsl:call-template name="log">
            <xsl:with-param name="level">DEBUG</xsl:with-param>
            <xsl:with-param name="message">
              <xsl:text>Edge with xmi:id='</xsl:text>
              <xsl:value-of select="@xmi-id"/>
              <xsl:text>' and association-id in UML: '</xsl:text>
              <xsl:value-of select="$association"/>
              <xsl:text>' has no memberEnd attribute.</xsl:text>
              <xsl:text> - not modified</xsl:text>
            </xsl:with-param>
          </xsl:call-template>
          <xsl:copy>
            <xsl:apply-templates select="@* | node() | text()"/>
          </xsl:copy>
        </xsl:when>
        <xsl:when test="fn:not($association-source) or $association-source = ''">
          <xsl:call-template name="log">
            <xsl:with-param name="level">DEBUG</xsl:with-param>
            <xsl:with-param name="message">
              <xsl:text>Edge with xmi:id='</xsl:text>
              <xsl:value-of select="@xmi-id"/>
              <xsl:text>' has invalid source: '</xsl:text>
              <xsl:value-of select="$association-source"/>
              <xsl:text>' - not modified</xsl:text>
              <xsl:text>Please check </xsl:text>
            </xsl:with-param>
          </xsl:call-template>
          <xsl:copy>
            <xsl:apply-templates select="@* | node() | text()"/>
          </xsl:copy>
        </xsl:when>
        <xsl:when test="fn:not($association-target)">
          <xsl:call-template name="log">
            <xsl:with-param name="level">DEBUG</xsl:with-param>
            <xsl:with-param name="message">
              <xsl:text>Edge with xmi:id='</xsl:text>
              <xsl:value-of select="@xmi-id"/>
              <xsl:text>' has invalid target: '</xsl:text>
              <xsl:value-of select="$association-target"/>
              <xsl:text>' - not modified</xsl:text>
            </xsl:with-param>
          </xsl:call-template>
          <xsl:copy>
            <xsl:apply-templates select="@* | node() | text()"/>
          </xsl:copy>
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="log">
            <xsl:with-param name="level">DEBUG</xsl:with-param>
            <xsl:with-param name="message">
              <xsl:text>Edge with xmi:id='</xsl:text>
              <xsl:value-of select="@xmi-id"/>
              <xsl:text>' is fine, no modification. </xsl:text>
            </xsl:with-param>
          </xsl:call-template>
          <xsl:copy>
            <xsl:apply-templates select="@* | node() | text()"/>
          </xsl:copy>
        </xsl:otherwise>
      </xsl:choose>
  </xsl:template>
  <xsl:template match="children[@xmi-type='notation:DecorationNode' and @type='6003']" mode="filp">
    <children xmi-type="notation:DecorationNode" xmi-id="{@xmi-id}"  visible="false" type="6003">
      <xsl:apply-templates select="node() | text()"/>
    </children>
  </xsl:template>
  <xsl:template match="children[@xmi-type='notation:DecorationNode' and @type='6005']" mode="filp">
    <children xmi-type="notation:DecorationNode" xmi-id="{@xmi-id}" type="6005">
      <xsl:apply-templates select="node() | text()"/>
    </children>
  </xsl:template>
  <xsl:template match="@* | node() | text()" mode="filp">
    <xsl:copy>
      <xsl:apply-templates select="@* | node() | text()"/>
    </xsl:copy>
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
    <xsl:variable name="source">
      <xsl:choose>
        <xsl:when test="fn:name($memberEndSource) = 'ownedEnd'">
          <xsl:value-of select="$memberEndTarget/@type"/>
        </xsl:when>
        <xsl:when test="fn:name($memberEndSource) = 'ownedAttribute'">
          <xsl:value-of select="$memberEndSource/../@xmi-id"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:message>
            <xsl:text>ignore source </xsl:text>
            <xsl:value-of select="$memberEnd"/>
          </xsl:message>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="target">
      <xsl:choose>
        <xsl:when test="fn:name($memberEndTarget) = 'ownedEnd'">
          <xsl:value-of select="$memberEndSource/@type"/>
        </xsl:when>
        <xsl:when test="fn:name($memberEndTarget) = 'ownedAttribute'">
          <xsl:value-of select="$memberEndTarget/../@xmi-id"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:message>
            <xsl:text>ignore target </xsl:text>
            <xsl:value-of select="$memberEnd"/>
          </xsl:message>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
<!--
    <xsl:message>
      <xsl:text>memberEnd1: </xsl:text>
      <xsl:value-of select="fn:substring-before($memberEnd, ' ')"/>
      <xsl:text> - </xsl:text>
      <xsl:value-of select="fn:name( $memberEndSource )"/>
      <xsl:text> - </xsl:text>
      <xsl:value-of select="$source"/>
      <xsl:text> - </xsl:text>
      <xsl:value-of select="myfn:umlName($source)"/>
    </xsl:message>
    <xsl:message>
      <xsl:text>memberEnd2: </xsl:text>
      <xsl:value-of select="fn:substring-after($memberEnd, ' ')"/>
      <xsl:text> - </xsl:text>
      <xsl:value-of select="fn:name( $memberEndTarget )"/>
      <xsl:text> - </xsl:text>
      <xsl:value-of select="$target"/>
      <xsl:text> - </xsl:text>
      <xsl:value-of select="myfn:umlName($target)"/>
    </xsl:message>
-->
    <xsl:choose>
      <xsl:when test="$memberEndType = 'source'">
        <xsl:value-of select="$source"/>
      </xsl:when>
      <xsl:when test="$memberEndType = 'target'">
        <xsl:value-of select="$target"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="log">
          <xsl:with-param name="level">ERROR</xsl:with-param>
          <xsl:with-param name="message">
            <xsl:text>Parameter 'memberEndType' must be 'source' or 'target' but is '</xsl:text>
            <xsl:value-of select="$memberEndType"/>
            <xsl:text>'. </xsl:text>
          </xsl:with-param>
        </xsl:call-template>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>
  <xsl:function name="myfn:umlName">
    <xsl:param name="string"/>
    <xsl:value-of select="fn:key('nodeById', $string, $umlLookup)/@name"/>
  </xsl:function>
</xsl:stylesheet>
