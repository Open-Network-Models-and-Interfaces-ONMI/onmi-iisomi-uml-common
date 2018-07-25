<?xml version="1.0" encoding="UTF-8"?>
<!-- /* * (C) Copyright 2018 highstreet technologies (http://highstreet-technologies.com) 
	and others. * * Licensed under the Apache License, Version 2.0 (the "License"); 
	* you may not use this file except in compliance with the License. * You 
	may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 
	* * Unless required by applicable law or agreed to in writing, software * 
	distributed under the License is distributed on an "AS IS" BASIS, * WITHOUT 
	WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. * See the 
	License for the specific language governing permissions and * limitations 
	under the License. * * Contributors: * Martin Skorupski [martin.skorupski@highstreet-technologies.com] 
	*/ -->

<xsl:stylesheet version="2.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:fn="http://www.w3.org/2005/xpath-functions"
	xmlns:notation="http://www.eclipse.org/gmf/runtime/1.0.2/notation"
	xmlns:xmi="http://www.omg.org/spec/XMI/20131001"
	xmlns:uml="http://www.eclipse.org/uml2/5.0.0/UML"
	xmlns:style="http://www.eclipse.org/papyrus/infra/viewpoints/policy/style">
	<!-- output definition -->
	<xsl:output method="xml" version="1.0" encoding="UTF-8"
		indent="yes" />
	<!-- functions -->
	<xsl:template name="log">
		<xsl:param name="level">INFO </xsl:param>
		<xsl:param name="message"></xsl:param>
		<xsl:if test="$xsltLogLevel = $level or $level = 'INFO ' ">
			<xsl:message>
				<xsl:value-of select="fn:current-dateTime()" />
				<xsl:text> | </xsl:text>
				<xsl:value-of select="$level" />
				<xsl:text> | </xsl:text>
				<xsl:value-of select="$model" />
				<xsl:text>.notation</xsl:text>
				<xsl:text> | </xsl:text>
				<xsl:value-of select="$message" />
				<xsl:text></xsl:text>
			</xsl:message>
		</xsl:if>

	</xsl:template>
	<xsl:template match="/" exclude-result-prefixes="fn notation style uml xmi">
		<xsl:message>
			<xsl:text> </xsl:text>
		</xsl:message>
		<xsl:message>
			<xsl:text>### Start </xsl:text>
            <xsl:value-of select="$model" />
		</xsl:message>
		<xsl:apply-templates select="node()" />
	</xsl:template>
	<xsl:template match="@* | node() | text()">
		<xsl:copy>
			<xsl:apply-templates select="@* | node() | text()" />
		</xsl:copy>
	</xsl:template>
</xsl:stylesheet>
