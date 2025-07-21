// ASTM Parser
class ASTMParser {
    constructor() {
        this.segments = {
            'H': 'Header',
            'P': 'Patient Information',
            'O': 'Test Order',
            'R': 'Result',
            'C': 'Comment',
            'M': 'Manufacturer Information',
            'L': 'Terminator'
        };

        this.fields = {
            'H': ['Record Type', 'Delimiter Definition', 'Message Control ID', 'Access Password', 'Sender Name', 'Sender Address', 'Reserved', 'Sender Telephone', 'Characteristics of Sender', 'Receiver ID', 'Comments', 'Processing ID', 'Version Number', 'Timestamp'],
            'P': ['Record Type', 'Sequence Number', 'Practice Assigned Patient ID', 'Laboratory Assigned Patient ID', 'Patient ID Number 3', 'Patient Name', 'Mother\'s Maiden Name', 'Date of Birth', 'Patient Sex', 'Patient Race-Ethnic Origin', 'Patient Address', 'Reserved Field', 'Patient Telephone Number', 'Attending Physician ID', 'Special Field 1', 'Special Field 2', 'Patient Height', 'Patient Weight', 'Patient\'s Known Diagnosis', 'Patient Active Medications', 'Patient\'s Diet', 'Practice Field 1', 'Practice Field 2', 'Admission and Discharge Dates', 'Admission Status', 'Location', 'Nature of Alternative Diagnostic Code and Classification', 'Alternative Diagnostic Code and Classification', 'Patient Religion', 'Marital Status', 'Isolation Status', 'Language', 'Hospital Service', 'Hospital Institution', 'Dosage Category'],
            'O': ['Record Type', 'Sequence Number', 'Specimen ID', 'Instrument Specimen ID', 'Universal Test ID', 'Priority', 'Requested/Ordered Date and Time', 'Specimen Collection Date and Time', 'Collection End Time', 'Collection Volume', 'Collector ID', 'Action Code', 'Danger Code', 'Relevant Clinical Info', 'Date/Time Specimen Received', 'Specimen Source', 'Ordering Physician', 'Physician\'s Telephone Number', 'User Field No. 1', 'User Field No. 2', 'Laboratory Field No. 1', 'Laboratory Field No. 2', 'Date/Time Results Reported or Last Modified', 'Instrument Charge to Computer System', 'Instrument Section ID', 'Report Types', 'Reserved Field', 'Location or Ward of Specimen Collection', 'Nosocomial Infection Flag', 'Specimen Service', 'Specimen Institution'],
            'R': ['Record Type', 'Sequence Number', 'Universal Test ID', 'Data or Measurement Value', 'Units', 'Reference Ranges', 'Result Abnormal Flags', 'Nature of Quality Control', 'Result Status', 'Date of Change in Instrument Normative Values', 'Operator Identification', 'Date/Time Test Started', 'Date/Time Test Completed', 'Instrument Identification']
        };
    }

    parse(data) {
        try {
            const lines = data.trim().split('\n');
            const result = {
                format: 'ASTM',
                segments: [],
                errors: [],
                metadata: {
                    totalSegments: lines.length,
                    parsedAt: new Date().toISOString()
                }
            };

            lines.forEach((line, index) => {
                try {
                    const segment = this.parseSegment(line.trim(), index + 1);
                    if (segment) {
                        result.segments.push(segment);
                    }
                } catch (error) {
                    result.errors.push({
                        line: index + 1,
                        message: error.message,
                        data: line
                    });
                }
            });

            return result;
        } catch (error) {
            return {
                format: 'ASTM',
                segments: [],
                errors: [{ line: 0, message: error.message, data: data }],
                metadata: { parsedAt: new Date().toISOString() }
            };
        }
    }

    parseSegment(line, lineNumber) {
        if (!line || line.length === 0) return null;

        const recordType = line.charAt(0).toUpperCase();
        const fields = line.split('|');

        if (!this.segments[recordType]) {
            throw new Error(`Unknown ASTM segment type: ${recordType}`);
        }

        const segment = {
            lineNumber: lineNumber,
            recordType: recordType,
            segmentType: recordType,
            description: this.segments[recordType],
            rawData: line,
            fields: [],
            fieldCount: fields.length
        };

        const fieldDefinitions = this.fields[recordType] || [];

        fields.forEach((fieldValue, index) => {
            const fieldName = fieldDefinitions[index] || `Field ${index + 1}`;
            segment.fields.push({
                index: index + 1,
                name: fieldName,
                value: fieldValue.trim(),
                description: this.getFieldDescription(recordType, index)
            });
        });

        return segment;
    }

    getFieldDescription(recordType, fieldIndex) {
        const descriptions = {
            'H': {
                0: 'Record identifier - always "H"',
                1: 'Field delimiter and special characters',
                2: 'Unique message control identifier',
                13: 'Date and time message was generated'
            },
            'P': {
                0: 'Record identifier - always "P"',
                5: 'Patient name in last name^first name format',
                7: 'Date of birth in YYYYMMDD format',
                8: 'Patient gender (M/F/U)'
            },
            'O': {
                0: 'Record identifier - always "O"',
                2: 'Unique specimen identifier',
                4: 'Universal test identifier code^name^system',
                5: 'Test priority (S=STAT, R=Routine)',
                6: 'Date and time test was ordered'
            },
            'R': {
                0: 'Record identifier - always "R"',
                2: 'Universal test identifier matching order',
                3: 'Test result value',
                4: 'Result units of measurement',
                5: 'Reference range for normal values'
            }
        };

        return descriptions[recordType] && descriptions[recordType][fieldIndex]
            ? descriptions[recordType][fieldIndex]
            : 'Standard ASTM field';
    }

    validate(data) {
        const result = this.parse(data);
        const validation = {
            isValid: result.errors.length === 0,
            errors: result.errors,
            warnings: [],
            summary: {
                totalSegments: result.segments.length,
                segmentTypes: {}
            }
        };

        result.segments.forEach(segment => {
            const type = segment.recordType;
            validation.summary.segmentTypes[type] = (validation.summary.segmentTypes[type] || 0) + 1;
        });

        if (!result.segments.some(s => s.recordType === 'H')) {
            validation.warnings.push('No Header (H) segment found - recommended for valid ASTM messages');
        }

        return validation;
    }
}

// HL7 Parser
class HL7Parser {
    constructor() {
        this.segments = {
            'MSH': 'Message Header',
            'EVN': 'Event Type',
            'PID': 'Patient Identification',
            'PV1': 'Patient Visit',
            'ORC': 'Common Order',
            'OBR': 'Observation Request',
            'OBX': 'Observation/Result',
            'NTE': 'Notes and Comments',
            'AL1': 'Patient Allergy Information',
            'DG1': 'Diagnosis'
        };

        this.fields = {
            'MSH': ['Field Separator', 'Encoding Characters', 'Sending Application', 'Sending Facility', 'Receiving Application', 'Receiving Facility', 'Date/Time of Message', 'Security', 'Message Type', 'Message Control ID', 'Processing ID', 'Version ID', 'Sequence Number', 'Continuation Pointer', 'Accept Acknowledgment Type', 'Application Acknowledgment Type', 'Country Code', 'Character Set', 'Principal Language Of Message'],
            'PID': ['Set ID - PID', 'Patient ID', 'Patient Identifier List', 'Alternate Patient ID - PID', 'Patient Name', 'Mother\'s Maiden Name', 'Date/Time of Birth', 'Administrative Sex', 'Patient Alias', 'Race', 'Patient Address', 'County Code', 'Phone Number - Home', 'Phone Number - Business', 'Primary Language', 'Marital Status', 'Religion', 'Patient Account Number', 'SSN Number - Patient', 'Driver\'s License Number - Patient'],
            'ORC': ['Order Control', 'Placer Order Number', 'Filler Order Number', 'Placer Group Number', 'Order Status', 'Response Flag', 'Quantity/Timing', 'Parent Order', 'Date/Time of Transaction', 'Entered By', 'Verified By', 'Ordering Provider', 'Enterer\'s Location', 'Call Back Phone Number', 'Order Effective Date/Time', 'Order Control Code Reason', 'Entering Organization', 'Entering Device', 'Action By'],
            'OBR': ['Set ID - OBR', 'Placer Order Number', 'Filler Order Number', 'Universal Service Identifier', 'Priority', 'Requested Date/Time', 'Observation Date/Time', 'Observation End Date/Time', 'Collection Volume', 'Collector Identifier', 'Specimen Action Code', 'Danger Code', 'Relevant Clinical Information', 'Specimen Received Date/Time', 'Specimen Source', 'Ordering Provider', 'Order Callback Phone Number', 'Placer field 1', 'Placer field 2', 'Filler Field 1', 'Filler Field 2', 'Results Rpt/Status Chng - Date/Time', 'Charge to Practice', 'Diagnostic Serv Sect ID', 'Result Status', 'Parent Result', 'Quantity/Timing', 'Result Copies To', 'Parent', 'Transportation Mode', 'Reason for Study'],
            'OBX': ['Set ID - OBX', 'Value Type', 'Observation Identifier', 'Observation Sub-ID', 'Observation Value', 'Units', 'References Range', 'Abnormal Flags', 'Probability', 'Nature of Abnormal Test', 'Observation Result Status', 'Effective Date of Reference Range', 'User Defined Access Checks', 'Date/Time of the Observation', 'Producer\'s ID', 'Responsible Observer', 'Observation Method']
        };
    }

    parse(data) {
        try {
            const lines = data.trim().split('\n');
            const result = {
                format: 'HL7',
                segments: [],
                errors: [],
                metadata: {
                    totalSegments: lines.length,
                    parsedAt: new Date().toISOString()
                }
            };

            lines.forEach((line, index) => {
                try {
                    const segment = this.parseSegment(line.trim(), index + 1);
                    if (segment) {
                        result.segments.push(segment);
                    }
                } catch (error) {
                    result.errors.push({
                        line: index + 1,
                        message: error.message,
                        data: line
                    });
                }
            });

            return result;
        } catch (error) {
            return {
                format: 'HL7',
                segments: [],
                errors: [{ line: 0, message: error.message, data: data }],
                metadata: { parsedAt: new Date().toISOString() }
            };
        }
    }

    parseSegment(line, lineNumber) {
        if (!line || line.length === 0) return null;

        const fields = line.split('|');
        const segmentType = fields[0];

        if (!this.segments[segmentType]) {
            throw new Error(`Unknown HL7 segment type: ${segmentType}`);
        }

        const segment = {
            lineNumber: lineNumber,
            segmentType: segmentType,
            description: this.segments[segmentType],
            rawData: line,
            fields: [],
            fieldCount: fields.length
        };

        const fieldDefinitions = this.fields[segmentType] || [];

        fields.forEach((fieldValue, index) => {
            let fieldName;
            if (index === 0) {
                fieldName = 'Segment Type';
            } else {
                fieldName = fieldDefinitions[index - 1] || `Field ${index}`;
            }

            segment.fields.push({
                index: index + 1,
                name: fieldName,
                value: fieldValue.trim(),
                description: this.getFieldDescription(segmentType, index)
            });
        });

        return segment;
    }

    getFieldDescription(segmentType, fieldIndex) {
        const descriptions = {
            'MSH': {
                0: 'Segment identifier - always "MSH"',
                1: 'Field separator character (usually |)',
                2: 'Component separator, repetition separator, etc.',
                9: 'Unique message control identifier',
                10: 'Processing ID (P=Production, D=Debug, T=Training)',
                11: 'Version ID (e.g., 2.5)'
            },
            'PID': {
                0: 'Segment identifier - always "PID"',
                4: 'Patient name in last^first^middle format',
                6: 'Date of birth in YYYYMMDD format',
                7: 'Administrative sex (M/F/O/U)'
            },
            'OBR': {
                0: 'Segment identifier - always "OBR"',
                3: 'Universal service identifier for the test',
                6: 'Date and time observation was requested',
                24: 'Result status (F=Final, P=Preliminary)'
            }
        };

        return descriptions[segmentType] && descriptions[segmentType][fieldIndex]
            ? descriptions[segmentType][fieldIndex]
            : 'Standard HL7 field';
    }

    validate(data) {
        const result = this.parse(data);
        const validation = {
            isValid: result.errors.length === 0,
            errors: result.errors,
            warnings: [],
            summary: {
                totalSegments: result.segments.length,
                segmentTypes: {}
            }
        };

        result.segments.forEach(segment => {
            const type = segment.segmentType;
            validation.summary.segmentTypes[type] = (validation.summary.segmentTypes[type] || 0) + 1;
        });

        if (!result.segments.some(s => s.segmentType === 'MSH')) {
            validation.warnings.push('No Message Header (MSH) segment found - required for valid HL7 messages');
        }

        return validation;
    }
}

// Main Parser
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

// Sample data
const SAMPLE_DATA = {
    astm: {
        name: 'ASTM Complete Blood Count Order',
        description: 'Complete blood count test order in ASTM format',
        data: `H|\\^&|||LIS^Laboratory Information System|||||||P|E 1394-97|20231201120000
P|1||12345||Smith^John^A||19850315|M|||123 Main St^Any City^CA^90210|||||||||||||||||||||
O|1|ORD123|12345^001|^^^CBC^Complete Blood Count^L||R|20231201120000|||||A||||||||||F||||||||
R|1|^^^WBC^White Blood Cell Count^L||7.2|10*3/uL|4.0-10.0|N|||F|||20231201150000
R|2|^^^RBC^Red Blood Cell Count^L||4.8|10*6/uL|4.2-5.4|N|||F|||20231201150000
R|3|^^^HGB^Hemoglobin^L||14.2|g/dL|12.0-16.0|N|||F|||20231201150000
L|1|N`
    },
    hl7: {
        name: 'HL7 Laboratory Order Message',
        description: 'Laboratory order message in HL7 format',
        data: `MSH|^~\\&|LIS|HOSPITAL|LAB|HOSPITAL|20231201120000||ORM^O01^ORM_O01|MSG001|P|2.5
PID|1||12345^^^HOSPITAL^MR||Smith^John^A||19850315|M|||123 Main St^^Any City^CA^90210^USA
ORC|NW|ORD123|ORD123|||||||^Smith^John^A
OBR|1|ORD123|ORD123|CBC^Complete Blood Count^L||20231201120000|||||||||^Smith^John^A||||||||||||F`
    }
};

// Template data
const TEMPLATE_DATA = {
    astm: {
        bloodWork: {
            name: '血液検査オーダー',
            description: 'Complete Blood Count (CBC) test order',
            template: `H|\\^&|||LIS^Laboratory Information System|||||||P|E 1394-97|${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}
P|1||PATIENT_ID||LastName^FirstName^MiddleName||YYYYMMDD|M|||Street Address^City^State^ZipCode|||||||||||||||||||||
O|1|ORDER_ID|SPECIMEN_ID^SAMPLE|^^^CBC^Complete Blood Count^L||R|${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}|||||A||||||||||F||||||||
L|1|N`
        },
        chemistry: {
            name: '生化学検査オーダー',
            description: 'Basic metabolic panel test order',
            template: `H|\\^&|||LIS^Laboratory Information System|||||||P|E 1394-97|${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}
P|1||PATIENT_ID||LastName^FirstName^MiddleName||YYYYMMDD|F|||Street Address^City^State^ZipCode|||||||||||||||||||||
O|1|ORDER_ID|SPECIMEN_ID^SAMPLE|^^^BMP^Basic Metabolic Panel^L||R|${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}|||||A||||||||||F||||||||
L|1|N`
        }
    },
    hl7: {
        labOrder: {
            name: 'ラボオーダーメッセージ',
            description: 'Standard laboratory order message',
            template: `MSH|^~\\&|LIS|HOSPITAL|LAB|HOSPITAL|${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}||ORM^O01^ORM_O01|MSG_ID|P|2.5
PID|1||PATIENT_ID^^^HOSPITAL^MR||LastName^FirstName^MiddleName||YYYYMMDD|M|||Street Address^^City^State^ZipCode^Country
ORC|NW|ORDER_ID|ORDER_ID|||||||^Doctor^Ordering^
OBR|1|ORDER_ID|ORDER_ID|TEST_CODE^Test Description^L||${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}|||||||||^Doctor^Ordering^||||||||||||F`
        },
        patientAdmit: {
            name: '患者入院メッセージ',
            description: 'Patient admission message',
            template: `MSH|^~\\&|HIS|HOSPITAL|ADT|HOSPITAL|${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}||ADT^A01^ADT_A01|MSG_ID|P|2.5
EVN|A01|${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}|||^Doctor^Attending^
PID|1||PATIENT_ID^^^HOSPITAL^MR||LastName^FirstName^MiddleName||YYYYMMDD|M|||Street Address^^City^State^ZipCode^Country
PV1|1|I|WARD^ROOM^BED|E|||^Doctor^Attending^|||SUR||||A|||^Doctor^Attending^|INS|||||||||||||||||||||${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}`
        }
    }
};