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

<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fn="http://www.w3.org/2005/xpath-functions" xmlns:notation="http://www.eclipse.org/gmf/runtime/1.0.2/notation" xmlns:xmi="http://www.omg.org/spec/XMI/20131001" xmlns:uml="http://www.eclipse.org/uml2/5.0.0/UML" xmlns:style="http://www.eclipse.org/papyrus/infra/viewpoints/policy/style">
	<!-- output definition -->
	<xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
	<!-- imports -->
    <xsl:import href="./log.xslt"/>	
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
	<xsl:key name="nodeByXmiId" match="*" use="@xmi-id"/>
	<!-- start templates -->	
	<xsl:template match="edges" exclude-result-prefixes="fn notation style uml xmi">
		<xsl:variable name="source" select="key( 'nodeByXmiId', @source)"/>
		<xsl:variable name="target" select="key( 'nodeByXmiId', @target)"/>
		<xsl:variable name="source-ref-to-uml" select="key( 'nodeByXmiId', @source)/element/@href"/>
		<xsl:variable name="target-ref-to-uml" select="key( 'nodeByXmiId', @target)/element/@href"/>
		<xsl:variable name="source-id" select="fn:substring-after( key( 'nodeByXmiId', @source)/element/@href, '#' )"/>
		<xsl:variable name="target-id" select="fn:substring-after( key( 'nodeByXmiId', @target)/element/@href, '#' )"/>
		<xsl:variable name="association-id" select="fn:substring-after( ./element[@xmi-type='uml:Association']/@href, '#' )"/>
		<xsl:variable name="member-end" select="key('nodeByXmiId', $association-id, $umlLookup)/@memberEnd"/>
		<xsl:variable name="source-attribute-id" select="fn:substring-before( $member-end, ' ' )"/>
		<xsl:variable name="target-attribute-id" select="fn:substring-after( $member-end, ' ' )"/>
		<xsl:variable name="current">
			<xsl:value-of select="key('nodeByXmiId', $source-id, $umlLookup)/@name"/>
			<xsl:text> to </xsl:text>
			<xsl:value-of select="key('nodeByXmiId', $target-id, $umlLookup)/@name"/>
		</xsl:variable>
		<xsl:variable name="required">
			<xsl:value-of select="key('nodeByXmiId', $source-attribute-id, $umlLookup)/../@name"/>
			<xsl:text> to </xsl:text>
			<xsl:value-of select="key('nodeByXmiId', $target-attribute-id, $umlLookup)/../@name"/>
		</xsl:variable>
		<xsl:choose>
			<xsl:when test="fn:not(@source) or @source = ''">
				<xsl:call-template name="log">
					<xsl:with-param name="level">DEBUG</xsl:with-param>
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
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
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' has no target.</xsl:text>
						<xsl:text> - not modified</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
				<xsl:copy>
					<xsl:apply-templates select="@* | node() | text()"/>
				</xsl:copy>
			</xsl:when>
			<xsl:when test="fn:not($source-ref-to-uml) or $source-ref-to-uml = ''">
				<xsl:call-template name="log">
					<xsl:with-param name="level">DEBUG</xsl:with-param>
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' and source='</xsl:text>
						<xsl:value-of select="@target" />
						<xsl:text>' has no source class element in UML.</xsl:text>
						<xsl:text> - not modified</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
				<xsl:copy>
					<xsl:apply-templates select="@* | node() | text()"/>
				</xsl:copy>
			</xsl:when>
			<xsl:when test="fn:not($target-ref-to-uml) or $target-ref-to-uml = ''">
				<xsl:call-template name="log">
					<xsl:with-param name="level">DEBUG</xsl:with-param>
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' and target='</xsl:text>
						<xsl:value-of select="@source" />
						<xsl:text>' has no target class element in UML.</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
				<xsl:copy>
					<xsl:apply-templates select="@* | node() | text()"/>
				</xsl:copy>
			</xsl:when>

			<xsl:when test="fn:not($source-id) or $source-id = ''">
				<xsl:call-template name="log">
					<xsl:with-param name="level">DEBUG</xsl:with-param>
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' has invalid source-id: '</xsl:text>
						<xsl:value-of select="@source" />
						<xsl:text>' - not modified.</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
				<xsl:copy>
					<xsl:apply-templates select="@* | node() | text()"/>
				</xsl:copy>
			</xsl:when>
			<xsl:when test="fn:not($target-id) or $target-id = ''">
				<xsl:call-template name="log">
					<xsl:with-param name="level">DEBUG</xsl:with-param>
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' has invalid target-id: '</xsl:text>
						<xsl:value-of select="@target" />
						<xsl:text>' - not modified</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
				<xsl:copy>
					<xsl:apply-templates select="@* | node() | text()"/>
				</xsl:copy>
			</xsl:when>


			<xsl:when test="fn:not(key('nodeByXmiId', $source-id, $umlLookup))">
				<xsl:call-template name="log">
					<xsl:with-param name="level">INFO </xsl:with-param>
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' has invalid source-id: '</xsl:text>
						<xsl:value-of select="$source-id" />
						<xsl:text>' Corresponding uml node not found - not modified</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
				<xsl:copy>
					<xsl:apply-templates select="@* | node() | text()"/>
				</xsl:copy>
			</xsl:when>
			<xsl:when test="fn:not(key('nodeByXmiId', $target-id, $umlLookup))">
				<xsl:call-template name="log">
					<xsl:with-param name="level">INFO </xsl:with-param>
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' has invalid target-id: '</xsl:text>
						<xsl:value-of select="$target-id" />
						<xsl:text>' Corresponding uml node not found (It might be referencing another UML model) - not modified</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
				<xsl:copy>
					<xsl:apply-templates select="@* | node() | text()"/>
				</xsl:copy>
			</xsl:when>

			<xsl:when test="fn:not($source)">
				<xsl:call-template name="log">
					<xsl:with-param name="level">DEBUG</xsl:with-param>
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' has invalid source: '</xsl:text>
						<xsl:value-of select="@source" />
						<xsl:text>' - not modified</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
				<xsl:copy>
					<xsl:apply-templates select="@* | node() | text()"/>
				</xsl:copy>
			</xsl:when>
			<xsl:when test="fn:not($target)">
				<xsl:call-template name="log">
					<xsl:with-param name="level">DEBUG</xsl:with-param>
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' has invalid target: '</xsl:text>
						<xsl:value-of select="@target" />
						<xsl:text>' - not modified</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
				<xsl:copy>
					<xsl:apply-templates select="@* | node() | text()"/>
				</xsl:copy>
			</xsl:when>


			<xsl:when test="fn:not($source-attribute-id) or $source-attribute-id = ''">
				<xsl:call-template name="log">
					<xsl:with-param name="level">DEBUG</xsl:with-param>
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' has invalid source: '</xsl:text>
						<xsl:value-of select="@source" />
						<xsl:text>' - not modified</xsl:text>
						<xsl:text>Please check </xsl:text>
					</xsl:with-param>
				</xsl:call-template>
				<xsl:copy>
					<xsl:apply-templates select="@* | node() | text()"/>
				</xsl:copy>
			</xsl:when>
			<xsl:when test="fn:not($target)">
				<xsl:call-template name="log">
					<xsl:with-param name="level">DEBUG</xsl:with-param>
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' has invalid target: '</xsl:text>
						<xsl:value-of select="@target" />
						<xsl:text>' - not modified</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
				<xsl:copy>
					<xsl:apply-templates select="@* | node() | text()"/>
				</xsl:copy>
			</xsl:when>

			<xsl:when test="fn:not($association-id) or $association-id = ''">
				<xsl:call-template name="log">
					<xsl:with-param name="level">DEBUG</xsl:with-param>
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' has no association-id in UML: '</xsl:text>
						<xsl:value-of select="./element[@xmi-type='uml:Association']/@href" />
						<xsl:text>' - not modified</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
				<xsl:copy>
					<xsl:apply-templates select="@* | node() | text()"/>
				</xsl:copy>
			</xsl:when>

			<xsl:when test="fn:not($member-end) or $member-end = ''">
				<xsl:call-template name="log">
					<xsl:with-param name="level">DEBUG</xsl:with-param>
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' and association-id in UML: '</xsl:text>
						<xsl:value-of select="$association-id" />
						<xsl:text>' has no member-end attribute.</xsl:text>
						<xsl:text> - not modified</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
				<xsl:copy>
					<xsl:apply-templates select="@* | node() | text()"/>
				</xsl:copy>
			</xsl:when>

			<xsl:when test="fn:not($source-attribute-id) or $source-attribute-id = ''">
				<xsl:call-template name="log">
					<xsl:with-param name="level">DEBUG</xsl:with-param>
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' and association-id in UML: '</xsl:text>
						<xsl:value-of select="$association-id" />
						<xsl:text>' and member-end: '</xsl:text>
						<xsl:value-of select="$member-end" />
						<xsl:text>' has invalid source attribute id.</xsl:text>
						<xsl:text> - not modified</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
				<xsl:copy>
					<xsl:apply-templates select="@* | node() | text()"/>
				</xsl:copy>
			</xsl:when>

			<xsl:when test="fn:not($target-attribute-id) or $target-attribute-id = ''">
				<xsl:call-template name="log">
					<xsl:with-param name="level">DEBUG</xsl:with-param>
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' and association-id in UML: '</xsl:text>
						<xsl:value-of select="$association-id" />
						<xsl:text>' and member-end: '</xsl:text>
						<xsl:value-of select="$member-end" />
						<xsl:text>' has invalid target attribute id.</xsl:text>
						<xsl:text> - not modified</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
				<xsl:copy>
					<xsl:apply-templates select="@* | node() | text()"/>
				</xsl:copy>
			</xsl:when>



			<xsl:when test="fn:not( $required = $current )">
				<xsl:call-template name="log">
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' modified, because </xsl:text>
						<xsl:text>required: '</xsl:text>
						<xsl:value-of select="$current" />
						<xsl:text>' IS NOT </xsl:text>
						<xsl:text>current: '</xsl:text>
						<xsl:value-of select="$required" />
						<xsl:text>'</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
				<xsl:copy>
					<xsl:apply-templates select="@*"/>
					<!-- overwrite source with target and vice versa -->
					<xsl:attribute name="source" select="@target"/>
					<xsl:attribute name="target" select="@source"/>
					<xsl:apply-templates select="node()[fn:not( fn:name() = 'sourceAnchor' or fn:name(.) = 'targetAnchor' ) ] | text()"/>
					<sourceAnchor xmi-type="{sourceAnchor/@xmi-type}" xmi-id="{sourceAnchor/@xmi-id}" id="{targetAnchor/@id}"/>
					<targetAnchor xmi-type="{targetAnchor/@xmi-type}" xmi-id="{targetAnchor/@xmi-id}" id="{sourceAnchor/@id}"/>
				</xsl:copy>
			</xsl:when>
			<xsl:otherwise>
				<xsl:call-template name="log">
					<xsl:with-param name="level">DEBUG</xsl:with-param>
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' is fine, no modification. </xsl:text>
					</xsl:with-param>
				</xsl:call-template>
				<xsl:copy>
					<xsl:apply-templates select="@* | node() | text()"/>
				</xsl:copy>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
</xsl:stylesheet>
