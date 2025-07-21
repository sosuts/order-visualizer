const MedicalFormatParser = require('../../src/parsers');

const parser = new MedicalFormatParser();

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'GET') {
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
        const { data } = event.queryStringParameters || {};
        
        if (!data) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'No data provided for format detection'
                })
            };
        }

        const format = parser.detectFormat(data);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                format: format
            })
        };
        
    } catch (error) {
        console.error('Format detection error:', error);
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