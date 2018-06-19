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
	<!-- key definitions -->
	<xsl:key name="nodeByXmiId" match="*" use="@xmi-id"/>
	<!-- start templates -->
	<xsl:template match="edges" exclude-result-prefixes="fn notation style uml xmi">
		<xsl:variable name="source" select="key( 'nodeByXmiId', @source)"/>
		<xsl:variable name="target" select="key( 'nodeByXmiId', @target)"/>
		
		<xsl:choose>
			<xsl:when test="fn:not(@source)">
				<xsl:call-template name="log">
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' has no source.</xsl:text>
						<xsl:text> - removed</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
			</xsl:when>
			<xsl:when test="fn:not(@target)">
				<xsl:call-template name="log">
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' has no target.</xsl:text>
						<xsl:text> - removed</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
			</xsl:when>
			<xsl:when test="fn:not($source)">
				<xsl:call-template name="log">
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' has invalid source: '</xsl:text>
						<xsl:value-of select="@source" />
						<xsl:text>' - removed</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
			</xsl:when>
			<xsl:when test="fn:not($target)">
				<xsl:call-template name="log">
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' has invalid target: '</xsl:text>
						<xsl:value-of select="@target" />
						<xsl:text>' - removed</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
<!-- 				<xsl:call-template name="log">
					<xsl:with-param name="message">
						<xsl:text>Edge with xmi:id='</xsl:text>
						<xsl:value-of select="@xmi-id" />
						<xsl:text>' is ok.</xsl:text>
					</xsl:with-param>
				</xsl:call-template>
 -->				<xsl:copy>
					<xsl:apply-templates select="@* | node() | text()" />
				</xsl:copy>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
</xsl:stylesheet>
