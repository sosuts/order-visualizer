const ASTMParser = require('./astmParser');
const HL7Parser = require('./hl7Parser');

class MedicalFormatParser {
    constructor() {
        this.astmParser = new ASTMParser();
        this.hl7Parser = new HL7Parser();
    }

    detectFormat(data) {
        const trimmed = data.trim();
        
        if (trimmed.startsWith('MSH|')) {
            return 'hl7';
        }
        
        if (trimmed.match(/^[HPOCRML]\|/m)) {
            return 'astm';
        }
        
        const lines = trimmed.split(/[\r\n]+/);
        const firstLine = lines[0];
        
        if (firstLine && firstLine.length > 3 && firstLine.charAt(3) === '|') {
            const segmentType = firstLine.substring(0, 3);
            if (['MSH', 'EVN', 'PID', 'PV1', 'ORC', 'OBR', 'OBX', 'NTE'].includes(segmentType)) {
                return 'hl7';
            }
        }
        
        if (/\|.*\|.*\|/.test(firstLine)) {
            return 'astm';
        }
        
        return 'unknown';
    }

    parse(data, format = null) {
        try {
            const detectedFormat = format || this.detectFormat(data);
            
            switch (detectedFormat.toLowerCase()) {
                case 'astm':
                    return this.astmParser.parse(data);
                case 'hl7':
                    return this.hl7Parser.parse(data);
                default:
                    return {
                        format: 'unknown',
                        segments: [],
                        errors: [{
                            line: 0,
                            message: `Unknown format: ${detectedFormat}. Expected ASTM or HL7 format.`,
                            data: data.substring(0, 100)
                        }],
                        metadata: {
                            detectedFormat: detectedFormat,
                            parsedAt: new Date().toISOString()
                        }
                    };
            }
        } catch (error) {
            return {
                format: 'error',
                segments: [],
                errors: [{
                    line: 0,
                    message: `Parse error: ${error.message}`,
                    data: data.substring(0, 100)
                }],
                metadata: { parsedAt: new Date().toISOString() }
            };
        }
    }

    validate(data, format = null) {
        const detectedFormat = format || this.detectFormat(data);
        
        switch (detectedFormat.toLowerCase()) {
            case 'astm':
                return this.astmParser.validate(data);
            case 'hl7':
                return this.hl7Parser.validate(data);
            default:
                return {
                    isValid: false,
                    errors: [{
                        line: 0,
                        message: `Cannot validate unknown format: ${detectedFormat}`
                    }],
                    warnings: [],
                    summary: { totalSegments: 0, segmentTypes: {} }
                };
        }
    }

    getSampleData() {
        return {
            astm: {
                name: 'ASTM Complete Blood Count Order',
                data: `H|\\^&|||LIS^LIS|||||||P|E 1394-97|20231201120000
P|1||12345||Smith^John^A||19850315|M|||123 Main St^Any City^CA^90210|||||||||||||||||||||
O|1|ORD123|12345^001|^^^Complete Blood Count^L||R||||||A||||||||||F||||||||
L|1|N`
            },
            hl7: {
                name: 'HL7 Laboratory Order Message',
                data: `MSH|^~\\&|LIS|HOSPITAL|LAB|HOSPITAL|20231201120000||ORM^O01^ORM_O01|MSG001|P|2.5
PID|1||12345^^^HOSPITAL^MR||Smith^John^A||19850315|M|||123 Main St^^Any City^CA^90210^USA
ORC|NW|ORD123|ORD123|||||||^Smith^John^A
OBR|1|ORD123|ORD123|CBC^Complete Blood Count^L||20231201120000|||||||||^Smith^John^A||||||||||||F`
            }
        };
    }

    formatForDisplay(parseResult) {
        if (!parseResult || !parseResult.segments) return [];
        
        const displayData = [];
        
        parseResult.segments.forEach(segment => {
            segment.fields.forEach(field => {
                displayData.push({
                    segment: `${segment.segmentType} (${segment.description})`,
                    field: field.name,
                    value: field.value,
                    description: field.description || 'Standard field',
                    lineNumber: segment.lineNumber
                });
            });
        });
        
        return displayData;
    }
}

module.exports = MedicalFormatParser;