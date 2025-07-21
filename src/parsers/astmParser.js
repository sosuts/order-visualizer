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

module.exports = ASTMParser;