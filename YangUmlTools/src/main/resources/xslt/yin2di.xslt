<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
	xmlns:architecture="http://www.eclipse.org/papyrus/infra/core/architecture" 
	xmlns:xmi="http://www.omg.org/spec/XMI/20131001" 
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
	<xsl:template match="/">
		<architecture:ArchitectureDescription xmi:version="2.0" contextId="org.eclipse.papyrus.infra.services.edit.TypeContext"/>
	</xsl:template>
</xsl:stylesheet>