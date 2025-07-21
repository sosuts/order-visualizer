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
            'DG1': 'Diagnosis',
            'AL1': 'Patient Allergy Information',
            'NK1': 'Next of Kin',
            'GT1': 'Guarantor',
            'IN1': 'Insurance',
            'ACC': 'Accident'
        };

        this.fields = {
            'MSH': ['Field Separator', 'Encoding Characters', 'Sending Application', 'Sending Facility', 'Receiving Application', 'Receiving Facility', 'Date/Time of Message', 'Security', 'Message Type', 'Message Control ID', 'Processing ID', 'Version ID', 'Sequence Number', 'Continuation Pointer', 'Accept Acknowledgment Type', 'Application Acknowledgment Type', 'Country Code', 'Character Set', 'Principal Language of Message'],
            'PID': ['Set ID', 'Patient ID', 'Patient Identifier List', 'Alternate Patient ID', 'Patient Name', 'Mother\'s Maiden Name', 'Date/Time of Birth', 'Administrative Sex', 'Patient Alias', 'Race', 'Patient Address', 'County Code', 'Phone Number - Home', 'Phone Number - Business', 'Primary Language', 'Marital Status', 'Religion', 'Patient Account Number', 'SSN Number', 'Driver\'s License Number', 'Mother\'s Identifier', 'Ethnic Group', 'Birth Place', 'Multiple Birth Indicator', 'Birth Order', 'Citizenship', 'Veterans Military Status', 'Nationality', 'Patient Death Date and Time', 'Patient Death Indicator'],
            'ORC': ['Order Control', 'Placer Order Number', 'Filler Order Number', 'Placer Group Number', 'Order Status', 'Response Flag', 'Quantity/Timing', 'Parent Order', 'Date/Time of Transaction', 'Entered By', 'Verified By', 'Ordering Provider', 'Enterer\'s Location', 'Call Back Phone Number', 'Order Effective Date/Time', 'Order Control Code Reason', 'Entering Organization', 'Entering Device', 'Action By', 'Advanced Beneficiary Notice Code', 'Ordering Facility Name', 'Ordering Facility Address', 'Ordering Facility Phone Number', 'Ordering Provider Address'],
            'OBR': ['Set ID', 'Placer Order Number', 'Filler Order Number', 'Universal Service Identifier', 'Priority', 'Requested Date/Time', 'Observation Date/Time', 'Observation End Date/Time', 'Collection Volume', 'Collector Identifier', 'Specimen Action Code', 'Danger Code', 'Relevant Clinical Information', 'Specimen Received Date/Time', 'Specimen Source', 'Ordering Provider', 'Order Callback Phone Number', 'Placer field 1', 'Placer field 2', 'Filler Field 1', 'Filler Field 2', 'Results Rpt/Status Chng - Date/Time', 'Charge to Practice', 'Diagnostic Serv Sect ID', 'Result Status', 'Parent Result', 'Quantity/Timing', 'Result Copies To', 'Parent', 'Transportation Mode', 'Reason for Study', 'Principal Result Interpreter', 'Assistant Result Interpreter', 'Technician', 'Transcriptionist', 'Scheduled Date/Time', 'Number of Sample Containers', 'Transport Logistics of Collected Sample', 'Collector\'s Comment', 'Transport Arrangement Responsibility', 'Transport Arranged', 'Escort Required', 'Planned Patient Transport Comment'],
            'OBX': ['Set ID', 'Value Type', 'Observation Identifier', 'Observation Sub-ID', 'Observation Value', 'Units', 'References Range', 'Abnormal Flags', 'Probability', 'Nature of Abnormal Test', 'Observation Result Status', 'Effective Date of Reference Range', 'User Defined Access Checks', 'Date/Time of the Observation', 'Producer\'s ID', 'Responsible Observer', 'Observation Method', 'Equipment Instance Identifier', 'Date/Time of the Analysis']
        };
    }

    parse(data) {
        try {
            const lines = data.trim().split(/[\r\n]+/);
            const result = {
                format: 'HL7',
                message: {
                    messageType: '',
                    controlId: '',
                    version: '',
                    timestamp: ''
                },
                segments: [],
                errors: [],
                metadata: {
                    totalSegments: lines.length,
                    parsedAt: new Date().toISOString()
                }
            };

            let encodingChars = '^~\\&';
            
            lines.forEach((line, index) => {
                try {
                    const segment = this.parseSegment(line.trim(), index + 1, encodingChars);
                    if (segment) {
                        result.segments.push(segment);
                        
                        if (segment.segmentType === 'MSH') {
                            result.message.messageType = segment.fields.find(f => f.index === 9)?.value || '';
                            result.message.controlId = segment.fields.find(f => f.index === 10)?.value || '';
                            result.message.version = segment.fields.find(f => f.index === 12)?.value || '';
                            result.message.timestamp = segment.fields.find(f => f.index === 7)?.value || '';
                            encodingChars = segment.fields.find(f => f.index === 2)?.value || '^~\\&';
                        }
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

    parseSegment(line, lineNumber, encodingChars = '^~\\&') {
        if (!line || line.length < 3) return null;

        const segmentType = line.substring(0, 3);
        
        if (!this.segments[segmentType]) {
            throw new Error(`Unknown HL7 segment type: ${segmentType}`);
        }

        let fields;
        if (segmentType === 'MSH') {
            const fieldSeparator = line.charAt(3);
            const remainingData = line.substring(4);
            fields = ['MSH', fieldSeparator, ...remainingData.split(fieldSeparator)];
        } else {
            fields = line.split('|');
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
            if (segmentType === 'MSH' && index === 0) return;
            
            const adjustedIndex = segmentType === 'MSH' ? index : index + 1;
            const fieldName = fieldDefinitions[segmentType === 'MSH' ? index - 1 : index] || `Field ${adjustedIndex}`;
            
            const components = this.parseComponents(fieldValue, encodingChars);
            
            segment.fields.push({
                index: adjustedIndex,
                name: fieldName,
                value: fieldValue,
                components: components,
                description: this.getFieldDescription(segmentType, segmentType === 'MSH' ? index - 1 : index)
            });
        });

        return segment;
    }

    parseComponents(fieldValue, encodingChars) {
        if (!fieldValue) return [];
        
        const componentSeparator = encodingChars.charAt(0);
        const components = fieldValue.split(componentSeparator);
        
        return components.map((comp, index) => ({
            index: index + 1,
            value: comp,
            subcomponents: comp.includes(encodingChars.charAt(1)) ? 
                comp.split(encodingChars.charAt(1)) : [comp]
        }));
    }

    getFieldDescription(segmentType, fieldIndex) {
        const descriptions = {
            'MSH': {
                0: 'Field separator character',
                1: 'Encoding characters (^~\\&)',
                8: 'Message type and trigger event',
                9: 'Unique message control identifier',
                11: 'HL7 version (e.g., 2.5)'
            },
            'PID': {
                4: 'Patient full name',
                6: 'Date of birth (YYYYMMDD)',
                7: 'Administrative sex (M/F/O/U)',
                10: 'Patient home address'
            },
            'OBR': {
                3: 'Universal service identifier for test',
                4: 'Test priority and urgency',
                6: 'Date and time observation requested',
                15: 'Specimen source and type'
            },
            'OBX': {
                1: 'Data type of observation value',
                2: 'Observation identifier and name',
                4: 'Actual observation value/result',
                5: 'Units of measurement'
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
                segmentTypes: {},
                messageType: result.message.messageType
            }
        };

        result.segments.forEach(segment => {
            const type = segment.segmentType;
            validation.summary.segmentTypes[type] = (validation.summary.segmentTypes[type] || 0) + 1;
        });

        if (!result.segments.some(s => s.segmentType === 'MSH')) {
            validation.errors.push({
                line: 0,
                message: 'MSH (Message Header) segment is required as first segment in HL7 messages'
            });
        }

        const mshSegment = result.segments.find(s => s.segmentType === 'MSH');
        if (mshSegment && mshSegment.lineNumber !== 1) {
            validation.warnings.push('MSH segment should be the first segment in the message');
        }

        return validation;
    }
}

module.exports = HL7Parser;