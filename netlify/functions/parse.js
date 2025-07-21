const MedicalFormatParser = require('../../src/parsers');

const parser = new MedicalFormatParser();

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Method not allowed'
            })
        };
    }

    try {
        const { data, format } = JSON.parse(event.body);
        
        if (!data || data.trim() === '') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'No data provided for parsing'
                })
            };
        }

        const result = parser.parse(data, format);
        const displayData = parser.formatForDisplay(result);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                result: result,
                displayData: displayData,
                detectedFormat: result.format
            })
        };
        
    } catch (error) {
        console.error('Parse error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};