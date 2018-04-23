<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
    xmlns:xs="http://www.w3.org/2001/XMLSchema" 
    xmlns:fn="http://www.w3.org/2005/xpath-functions" 
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
            <uuid value="{uuid:get-uuid()}"></uuid>
            <uuid value="{uuid:get-uuid()}"></uuid>
            <uuid value="{uuid:get-uuid()}"></uuid>
            <uuid value="{uuid:get-uuid()}"></uuid>
        </output>
    </xsl:template>
    <!--
Functions in the uuid: namespace are used to calculate a UUID
The method used is a derived timestamp method, which is explained
here: http://www.famkruithof.net/guid-uuid-timebased.html
and here: http://www.ietf.org/rfc/rfc4122.txt
-->
    <!--
Returns the UUID
-->
    <xsl:function name="uuid:get-uuid" as="xs:string*">
        <xsl:variable name="ts" select="uuid:ts-to-hex(uuid:generate-timestamp())"/>
        <xsl:value-of separator="-" select="            substring($ts, 8, 8),            substring($ts, 4, 4),            string-join((uuid:get-uuid-version(), substring($ts, 1, 3)), ''),            uuid:generate-clock-id(),            uuid:get-network-node()"/>
    </xsl:function>
    <!--
Functions in the uuid: namespace are used to calculate a hash from a string.
-->
    <!--
Returns the Hash
-->
    <xsl:function name="iisomi:get-hash" as="xs:string*">
        <xsl:param name="input-string"/>
        <xsl:value-of select="fn:string-to-codepoints($input-string)"/>
<!--
        <xsl:variable name="ts" select="uuid:ts-to-hex($input-string)"/>
        <xsl:value-of separator="-" select="            substring($ts, 8, 8),            substring($ts, 4, 4),            string-join((uuid:get-uuid-version(), substring($ts, 1, 3)), ''),            uuid:generate-clock-id(),            uuid:get-network-node()"/>
-->
    </xsl:function>
    <!--
internal aux. fu
with saxon, this creates a more-unique result with
generate-id then when just using a variable containing a node
-->
    <xsl:function name="uuid:_get-node">
        <xsl:comment>getNode</xsl:comment>
    </xsl:function>
    <!-- generates some kind of unique id -->
    <xsl:function name="uuid:get-id" as="xs:string">
        <xsl:sequence select="generate-id(uuid:_get-node())"/>
    </xsl:function>
    <!--
should return the next nr in sequence, but this can't be done
in xslt. Instead, it returns a guaranteed unique number
-->
    <xsl:function name="uuid:next-nr" as="xs:integer">
        <xsl:variable name="node">
            <xsl:comment>getNode</xsl:comment>
        </xsl:variable>
        <xsl:sequence select="            xs:integer(replace(            generate-id($node), '\D', ''))"/>
    </xsl:function>
    <!-- internal fu for returning hex digits only -->
    <xsl:function name="uuid:_hex-only" as="xs:string">
        <xsl:param name="string"/>
        <xsl:param name="count"/>
        <xsl:sequence select="            substring(replace(            $string, '[^0-9a-fA-F]', '')            , 1, $count)"/>
    </xsl:function>
    <!-- may as well be defined as returning the same seq each time -->
    <xsl:variable name="_clock" select="uuid:get-id()"/>
    <xsl:function name="uuid:generate-clock-id" as="xs:string">
        <xsl:sequence select="uuid:_hex-only($_clock, 4)"/>
    </xsl:function>
    <!--
returns the network node, this one is 'random', but must
be the same within calls. The least-significant bit must be '1'
when it is not a real MAC address (in this case it is set to '1')
-->
    <xsl:function name="uuid:get-network-node" as="xs:string">
        <xsl:sequence select="uuid:_hex-only('09-17-3F-13-E4-C5', 12)"/>
    </xsl:function>
    <!-- returns version, for timestamp uuids, this is "1" -->
    <xsl:function name="uuid:get-uuid-version" as="xs:string">
        <xsl:sequence select="'1'"/>
    </xsl:function>
    <!--
Generates a timestamp of the amount of 100 nanosecond
intervals from 15 October 1582, in UTC time.
-->
    <xsl:function name="uuid:generate-timestamp">
        <!--
date calculation automatically goes
correct when you add the timezone information, in this
case that is UTC.
-->
        <xsl:variable name="duration-from-1582" as="xs:dayTimeDuration">
            <xsl:sequence select="                current-dateTime() -                xs:dateTime('1582-10-15T00:00:00.000Z')"/>
        </xsl:variable>
        <xsl:variable name="random-offset" as="xs:integer">
            <xsl:sequence select="uuid:next-nr() mod 10000"/>
        </xsl:variable>
        <!-- do the math to get the 100 nano second intervals -->
        <xsl:sequence select="            (days-from-duration($duration-from-1582) * 24 * 60 * 60 +            hours-from-duration($duration-from-1582) * 60 * 60 +            minutes-from-duration($duration-from-1582) * 60 +            seconds-from-duration($duration-from-1582)) * 1000            * 10000 + $random-offset"/>
    </xsl:function>
    <!-- simple non-generalized function to convert from timestamp to hex -->
    <xsl:function name="uuid:ts-to-hex">
        <xsl:param name="dec-val"/>
        <xsl:value-of separator="" select="            for $i in 1 to 15            return (0 to 9, tokenize('A B C D E F', ' '))            [            $dec-val idiv            xs:integer(math:power(16, 15 - $i))            mod 16 + 1            ]"/>
    </xsl:function>
    <xsl:function name="math:power">
        <xsl:param name="base"/>
        <xsl:param name="power"/>
        <xsl:choose>
            <xsl:when test="$power &lt; 0 or contains(string($power), '.')">
                <xsl:message terminate="yes">                    The XSLT template math:power doesn't support negative or                    fractional arguments.                </xsl:message>
                <xsl:text>NaN</xsl:text>
            </xsl:when>
            <xsl:otherwise>
                <xsl:call-template name="math:_power">
                    <xsl:with-param name="base" select="$base"/>
                    <xsl:with-param name="power" select="$power"/>
                    <xsl:with-param name="result" select="1"/>
                </xsl:call-template>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:function>
    <xsl:template name="math:_power">
        <xsl:param name="base"/>
        <xsl:param name="power"/>
        <xsl:param name="result"/>
        <xsl:choose>
            <xsl:when test="$power = 0">
                <xsl:value-of select="$result"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:call-template name="math:_power">
                    <xsl:with-param name="base" select="$base"/>
                    <xsl:with-param name="power" select="$power - 1"/>
                    <xsl:with-param name="result" select="$result * $base"/>
                </xsl:call-template>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
</xsl:stylesheet>