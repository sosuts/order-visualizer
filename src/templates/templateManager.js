const astmTemplates = require('./astm_templates');
const hl7Templates = require('./hl7_templates');

class TemplateManager {
    constructor() {
        this.templates = {
            astm: astmTemplates,
            hl7: hl7Templates
        };
    }

    getAllTemplates() {
        return this.templates;
    }

    getTemplatesByFormat(format) {
        return this.templates[format.toLowerCase()] || {};
    }

    getTemplate(format, templateName) {
        const formatTemplates = this.getTemplatesByFormat(format);
        return formatTemplates[templateName] || null;
    }

    fillTemplate(format, templateName, values = {}) {
        const template = this.getTemplate(format, templateName);
        if (!template) {
            throw new Error(`Template not found: ${format}.${templateName}`);
        }

        let filledTemplate = template.template;
        const now = new Date();
        const defaultValues = {
            timestamp: this.formatDateTime(now),
            order_datetime: this.formatDateTime(now),
            result_datetime: this.formatDateTime(now),
            event_datetime: this.formatDateTime(now),
            admit_datetime: this.formatDateTime(now),
            dob: this.formatDate(new Date('1985-03-15')),
            control_id: `MSG${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
            patient_id: String(Math.floor(Math.random() * 90000) + 10000),
            order_number: `ORD${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
            placer_order: `ORD${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
            filler_order: `ORD${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
            specimen_id: `${String(Math.floor(Math.random() * 90000) + 10000)}^001`
        };

        const mergedValues = { ...defaultValues, ...values };

        Object.entries(template.fields).forEach(([fieldName, fieldDef]) => {
            const placeholder = `{${fieldName}}`;
            let value = mergedValues[fieldName];

            if (!value) {
                if (fieldDef.example) {
                    value = fieldDef.example;
                } else if (fieldDef.options && fieldDef.options.length > 0) {
                    value = fieldDef.options[0];
                } else {
                    value = `[${fieldName}]`;
                }
            }

            filledTemplate = filledTemplate.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
        });

        return filledTemplate;
    }

    getFieldSuggestions(format, fieldValue) {
        const formatTemplates = this.getTemplatesByFormat(format);
        const suggestions = new Set();

        Object.values(formatTemplates).forEach(template => {
            Object.entries(template.fields).forEach(([fieldName, fieldDef]) => {
                if (fieldName.toLowerCase().includes(fieldValue.toLowerCase())) {
                    suggestions.add(fieldName);
                }

                if (fieldDef.example && fieldDef.example.toLowerCase().includes(fieldValue.toLowerCase())) {
                    suggestions.add(fieldDef.example);
                }

                if (fieldDef.options) {
                    fieldDef.options.forEach(option => {
                        if (option.toLowerCase().includes(fieldValue.toLowerCase())) {
                            suggestions.add(option);
                        }
                    });
                }
            });
        });

        return Array.from(suggestions).slice(0, 10);
    }

    getCommonValues() {
        return {
            sex: ['M', 'F', 'O', 'U'],
            priority: ['R', 'S', 'A'],
            abnormal_flag: ['N', 'H', 'L', 'HH', 'LL'],
            admission_type: ['E', 'I', 'O', 'P', 'R'],
            message_types: {
                hl7: ['ORM^O01', 'ORU^R01', 'ADT^A01', 'ADT^A02', 'ADT^A03'],
                astm: ['H', 'P', 'O', 'R', 'C', 'L']
            },
            common_tests: [
                { code: 'CBC', name: 'Complete Blood Count' },
                { code: 'CHEM', name: 'Basic Chemistry Panel' },
                { code: 'LFT', name: 'Liver Function Tests' },
                { code: 'LIPID', name: 'Lipid Panel' },
                { code: 'TSH', name: 'Thyroid Stimulating Hormone' },
                { code: 'HBA1C', name: 'Hemoglobin A1c' },
                { code: 'UA', name: 'Urinalysis' },
                { code: 'CULT', name: 'Bacterial Culture' }
            ],
            sample_patients: [
                { name: 'Smith^John^A', dob: '19850315', sex: 'M', id: '12345' },
                { name: 'Johnson^Mary^L', dob: '19900622', sex: 'F', id: '67890' },
                { name: 'Davis^Robert^K', dob: '19751203', sex: 'M', id: '78901' },
                { name: 'Wilson^Sarah^E', dob: '19920910', sex: 'F', id: '23456' }
            ]
        };
    }

    validateTemplate(format, templateData) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (!format || !['astm', 'hl7'].includes(format.toLowerCase())) {
            validation.isValid = false;
            validation.errors.push('Invalid format. Must be "astm" or "hl7"');
        }

        if (!templateData || typeof templateData !== 'string') {
            validation.isValid = false;
            validation.errors.push('Template data must be a non-empty string');
        }

        if (format.toLowerCase() === 'hl7') {
            if (!templateData.startsWith('MSH|')) {
                validation.warnings.push('HL7 messages should start with MSH segment');
            }
        }

        const lines = templateData.split('\n');
        if (lines.length === 0) {
            validation.isValid = false;
            validation.errors.push('Template cannot be empty');
        }

        const hasUnresolvedPlaceholders = /{[^}]+}/.test(templateData);
        if (hasUnresolvedPlaceholders) {
            validation.warnings.push('Template contains unresolved placeholders');
        }

        return validation;
    }

    formatDateTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}${month}${day}`;
    }

    generateRandomData(format, templateName) {
        const commonValues = this.getCommonValues();
        const randomPatient = commonValues.sample_patients[Math.floor(Math.random() * commonValues.sample_patients.length)];
        const randomTest = commonValues.common_tests[Math.floor(Math.random() * commonValues.common_tests.length)];
        
        return {
            patient_name: randomPatient.name,
            patient_id: randomPatient.id,
            dob: randomPatient.dob,
            sex: randomPatient.sex,
            test_code: randomTest.code,
            test_name: randomTest.name,
            sending_app: format === 'hl7' ? 'EMR_SYSTEM' : 'LIS',
            sending_facility: 'HOSPITAL',
            receiving_app: format === 'hl7' ? 'LAB_SYSTEM' : 'LAB',
            receiving_facility: format === 'hl7' ? 'LAB' : 'HOSPITAL',
            facility: 'HOSPITAL',
            address: '123 Main St^^Any City^CA^90210',
            priority: 'R'
        };
    }
}

module.exports = TemplateManager;